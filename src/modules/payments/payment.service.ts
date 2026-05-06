import crypto from "crypto";
import { db } from "@/lib/db";
import { AppError } from "@/modules/shared/errors";
import { emailService } from "@/services/email.service";
import { cartRepository } from "@/modules/cart/cart.repository";

type PaymentProvider = "stripe" | "paypal";

function cents(amount: number) {
  return Math.round(amount * 100);
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new AppError(`${name} is not configured`, 500, "PAYMENT_CONFIG");
  return value;
}

async function stripeRequest<T>(path: string, body: URLSearchParams): Promise<T> {
  const secret = requireEnv("STRIPE_SECRET_KEY");
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new AppError(json.error?.message ?? "Stripe request failed", 502, "STRIPE_ERROR");
  }
  return json as T;
}

async function getPaypalAccessToken() {
  const clientId = requireEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID");
  const secret = requireEnv("PAYPAL_CLIENT_SECRET");
  const baseUrl = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  const json = await response.json();
  if (!response.ok) throw new AppError("PayPal authentication failed", 502, "PAYPAL_ERROR");
  return json.access_token as string;
}

async function paypalRequest<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";
  const token = await getPaypalAccessToken();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new AppError(json.message ?? "PayPal request failed", 502, "PAYPAL_ERROR");
  }
  return json as T;
}

export const paymentService = {
  async createProviderPayment(params: {
    orderId: string;
    provider: PaymentProvider;
    amount: number;
    currency: string;
  }) {
    if (params.provider === "stripe") {
      const intent = await stripeRequest<{
        id: string;
        client_secret: string;
      }>(
        "/payment_intents",
        new URLSearchParams({
          amount: String(cents(params.amount)),
          currency: params.currency,
          "metadata[orderId]": params.orderId,
          "automatic_payment_methods[enabled]": "true",
        })
      );

      await db.payment.update({
        where: { orderId: params.orderId },
        data: {
          transactionId: intent.id,
          clientSecret: intent.client_secret,
        },
      });

      return { stripe: { clientSecret: intent.client_secret } };
    }

    const paypalOrder = await paypalRequest<{ id: string }>("/v2/checkout/orders", {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.orderId,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
        },
      ],
    });

    await db.payment.update({
      where: { orderId: params.orderId },
      data: { providerOrderId: paypalOrder.id },
    });

    return { paypal: { orderId: paypalOrder.id } };
  },

  async markPaid(provider: PaymentProvider, providerId: string) {
    const payment = await db.payment.findFirst({
      where:
        provider === "stripe"
          ? { provider, transactionId: providerId }
          : { provider, providerOrderId: providerId },
      select: { id: true, orderId: true, status: true },
    });

    if (!payment) throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
    if (payment.status === "SUCCESS") return;

    const updatedOrder = await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS" },
      });
      return tx.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
        select: {
          id: true,
          totalAmount: true,
          guestEmail: true,
          userId: true,
          user: { select: { email: true } },
        },
      });
    });

    if (updatedOrder.userId) {
      await cartRepository.clearUserCart(updatedOrder.userId).catch(console.error);
    }

    const email = updatedOrder.user?.email || updatedOrder.guestEmail;
    if (email) {
      await emailService.sendPaymentSuccess({
        to: email,
        orderId: updatedOrder.id,
        totalAmount: updatedOrder.totalAmount,
      });
    }

    // Notify sellers
    const { checkoutService } = await import("@/modules/checkout/checkout.service");
    await checkoutService.notifySellers(updatedOrder.id).catch(console.error);
  },

  async markFailed(provider: PaymentProvider, providerId: string, failureReason?: string) {
    const payment = await db.payment.findFirst({
      where:
        provider === "stripe"
          ? { provider, transactionId: providerId }
          : { provider, providerOrderId: providerId },
      select: { id: true, orderId: true, status: true },
    });

    if (!payment || payment.status === "SUCCESS") return;

    await this.failOrder(payment.orderId, failureReason);
  },

  async failOrder(orderId: string, failureReason?: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (!order || order.status === "PAID") return;

    await db.$transaction([
      db.payment.update({
        where: { orderId },
        data: { status: "FAILED", failureReason },
      }),
      db.order.update({
        where: { id: orderId },
        data: { status: "FAILED" },
      }),
      ...order.items.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      ),
    ]);
  },

  verifyStripeWebhook(payload: string, signatureHeader: string | null) {
    const secret = requireEnv("STRIPE_WEBHOOK_SECRET");
    if (!signatureHeader) throw new AppError("Missing Stripe signature", 400, "BAD_SIGNATURE");

    const parts = Object.fromEntries(
      signatureHeader.split(",").map((part) => {
        const [key, value] = part.split("=");
        return [key, value];
      })
    );

    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) {
      throw new AppError("Invalid Stripe signature", 400, "BAD_SIGNATURE");
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    const providedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new AppError("Invalid Stripe signature", 400, "BAD_SIGNATURE");
    }
  },

  async verifyPaypalWebhook(headers: Headers, body: unknown) {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) return;

    const baseUrl = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";
    const token = await getPaypalAccessToken();
    const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });

    const json = await response.json();
    if (!response.ok || json.verification_status !== "SUCCESS") {
      throw new AppError("Invalid PayPal webhook signature", 400, "BAD_SIGNATURE");
    }
  },
};
