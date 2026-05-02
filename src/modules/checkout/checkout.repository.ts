import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { CartDTO } from "@/modules/cart/cart.types";
import type { CheckoutAddressDTO } from "./checkout.validators";
import type { CheckoutPricing } from "./checkout.types";

export const checkoutRepository = {
  async createPendingOrder(params: {
    userId: string;
    cart: CartDTO;
    address: CheckoutAddressDTO;
    pricing: CheckoutPricing;
    provider: "stripe" | "paypal";
  }) {
    const { userId, cart, address, pricing, provider } = params;

    return db.$transaction(async (tx) => {
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity }, isPublished: true },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          throw new Error(`Insufficient stock for ${item.product.name}`);
        }
      }

      return tx.order.create({
        data: {
          userId,
          status: "PENDING",
          subtotal: pricing.subtotal,
          taxAmount: pricing.taxAmount,
          shippingFee: pricing.shippingFee,
          totalAmount: pricing.totalAmount,
          currency: pricing.currency,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
              productName: item.product.name,
              productSlug: item.product.slug,
              imageUrl: item.product.image?.url,
            })),
          },
          shippingAddress: {
            create: {
              fullName: address.fullName,
              phone: address.phone,
              country: address.country,
              city: address.city,
              street: address.street,
              postalCode: address.postalCode || null,
            },
          },
          payment: {
            create: {
              provider,
              status: "PENDING",
              amount: pricing.totalAmount,
              currency: pricing.currency,
            },
          },
        },
        select: { id: true, totalAmount: true, currency: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },
};
