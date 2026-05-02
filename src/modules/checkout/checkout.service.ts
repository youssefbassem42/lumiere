import { cartRepository } from "@/modules/cart/cart.repository";
import { AppError } from "@/modules/shared/errors";
import { paymentService } from "@/modules/payments/payment.service";
import { emailService } from "@/services/email.service";
import { db } from "@/lib/db";
import { checkoutRepository } from "./checkout.repository";
import { calculateCheckoutPricing } from "./pricing";
import type { CheckoutDTO } from "./checkout.validators";
import type { CheckoutResult } from "./checkout.types";

export const checkoutService = {
  async startCheckout(userId: string, dto: CheckoutDTO): Promise<CheckoutResult> {
    const cart = await cartRepository.getCartItemsForCheckout(userId);
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

    const pricing = calculateCheckoutPricing(cart);
    const order = await checkoutRepository.createPendingOrder({
      userId,
      cart,
      address: dto.shippingAddress,
      pricing,
      provider: dto.provider,
    });

    try {
      const providerPayload = await paymentService.createProviderPayment({
        orderId: order.id,
        provider: dto.provider,
        amount: order.totalAmount,
        currency: order.currency,
      });

      await cartRepository.clearUserCart(userId);
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user) {
        await emailService.sendOrderConfirmation({
          to: user.email,
          orderId: order.id,
          totalAmount: order.totalAmount,
        });
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
      await paymentService.failOrder(
        order.id,
        error instanceof Error ? error.message : "Payment provider initialization failed"
      );
      throw error;
    }
  },
};
