import type { CartDTO } from "@/modules/cart/cart.types";
import type { CheckoutPricing } from "./checkout.types";

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 75;
const STANDARD_SHIPPING_FEE = 8.99;

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateCheckoutPricing(
  cart: CartDTO,
  params?: { discountAmount?: number }
): CheckoutPricing {
  const subtotal = roundMoney(cart.subtotal);
  const discountAmount = roundMoney(Math.max(0, params?.discountAmount ?? 0));
  const taxableSubtotal = roundMoney(Math.max(0, subtotal - discountAmount));
  const taxAmount = roundMoney(taxableSubtotal * TAX_RATE);
  const shippingFee =
    taxableSubtotal === 0 || taxableSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    shippingFee,
    totalAmount: roundMoney(taxableSubtotal + taxAmount + shippingFee),
    currency: "usd",
  };
}
