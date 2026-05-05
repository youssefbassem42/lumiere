import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/modules/payments/payment.service";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");

    // Verify signature
    paymentService.verifyStripeWebhook(payload, signature);

    const event = JSON.parse(payload);

    // Handle events
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      await paymentService.markPaid("stripe", paymentIntent.id);
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const failureReason = paymentIntent.last_payment_error?.message || "Payment failed";
      await paymentService.markFailed("stripe", paymentIntent.id, failureReason);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe Webhook Error:", err.message);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }
}
