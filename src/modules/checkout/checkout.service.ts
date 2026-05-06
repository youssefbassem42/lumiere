import { cartRepository } from "@/modules/cart/cart.repository";
import { AppError } from "@/modules/shared/errors";
import { paymentService } from "@/modules/payments/payment.service";
import { emailService } from "@/services/email.service";
import { db } from "@/lib/db";
import { checkoutRepository } from "./checkout.repository";
import { calculateCheckoutPricing } from "./pricing";
import type { CheckoutDTO } from "./checkout.validators";
import type { CheckoutResult } from "./checkout.types";

import { cartService } from "@/modules/cart/cart.service";
import type { CartIdentity } from "@/modules/cart/cart.types";

export const checkoutService = {
  async startCheckout(identity: CartIdentity, dto: CheckoutDTO): Promise<CheckoutResult> {
    const cart = await cartService.getCart(identity);
    if (cart.items.length === 0) {
      throw new AppError("Cart is empty", 400, "EMPTY_CART");
    }

    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new AppError(
          `${item.product.name} no longer has enough stock`,
          409,
          "STOCK_LIMIT"
        );
      }
    }

    const promoCode =
      dto.promoCode && dto.promoCode.trim() ? dto.promoCode.trim().toUpperCase() : null;

    let discountAmount = 0;
    if (promoCode) {
      const promo = await db.promoCode.findUnique({
        where: { code: promoCode },
      });
      if (!promo || !promo.isActive) {
        throw new AppError("Invalid promo code", 400, "INVALID_PROMO_CODE");
      }
      if (promo.expiryDate && new Date() > promo.expiryDate) {
        throw new AppError("Promo code has expired", 400, "EXPIRED_PROMO_CODE");
      }
      if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
        throw new AppError("Promo code usage limit reached", 400, "LIMIT_REACHED");
      }

      discountAmount = promo.discountType === "PERCENTAGE" 
        ? (cart.subtotal * promo.discountValue) / 100
        : promo.discountValue;
        
      discountAmount = Math.min(discountAmount, cart.subtotal); // Cannot discount more than subtotal
      
      await db.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const pricing = calculateCheckoutPricing(cart, { discountAmount });
    const order = await checkoutRepository.createPendingOrder({
      userId: identity.userId,
      guestEmail: dto.guestEmail,
      cart,
      address: dto.shippingAddress,
      pricing,
      provider: dto.provider,
      promoCode,
    });

    try {
      const providerPayload =
        dto.provider === "cod"
          ? {}
          : await paymentService.createProviderPayment({
              orderId: order.id,
              provider: dto.provider,
              amount: order.totalAmount,
              currency: order.currency,
            });

      if (dto.provider === "cod") {
        if (identity.userId) await cartRepository.clearUserCart(identity.userId);
        else if (identity.guestId) await import("@/modules/cart/cart.repository").then(m => m.guestCartRepository.clear(identity.guestId!));

        const email = identity.userId
          ? (await db.user.findUnique({ where: { id: identity.userId }, select: { email: true } }))?.email
          : dto.guestEmail;

        if (email) {
          await emailService.sendOrderConfirmation({
            to: email,
            orderId: order.id,
            totalAmount: order.totalAmount,
          });
        }

        await this.notifySellers(order.id).catch(console.error);
      }

      return {
        orderId: order.id,
        provider: dto.provider,
        status: "pending",
        amount: order.totalAmount,
        currency: "usd",
        ...providerPayload,
      };
    } catch (error) {
      if (dto.provider !== "cod") {
        await paymentService.failOrder(
          order.id,
          error instanceof Error ? error.message : "Payment provider initialization failed"
        );
      }
      throw error;
    }
  },

  async notifySellers(orderId: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  include: { user: { select: { email: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (!order) return;

    // Group items by seller to send one email per seller per order
    const sellerEmails = new Map<string, string[]>();
    for (const item of order.items) {
      const email = item.product.seller?.user?.email;
      if (email) {
        if (!sellerEmails.has(email)) sellerEmails.set(email, []);
        sellerEmails.get(email)!.push(item.productName);
      }
    }

    for (const [email, productNames] of sellerEmails.entries()) {
      await emailService.sendSellerNotification({
        to: email,
        orderId,
        productName: productNames.join(", "),
      }).catch(console.error);
    }
  }
};
