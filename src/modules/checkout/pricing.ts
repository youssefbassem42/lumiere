import type { CartDTO } from "@/modules/cart/cart.types";
import type { CheckoutPricing } from "./checkout.types";

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 75;
const STANDARD_SHIPPING_FEE = 8.99;

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateCheckoutPricing(cart: CartDTO): CheckoutPricing {
  const subtotal = roundMoney(cart.subtotal);
  const taxAmount = roundMoney(subtotal * TAX_RATE);
  const shippingFee =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;

  return {
    subtotal,
    taxAmount,
    shippingFee,
    totalAmount: roundMoney(subtotal + taxAmount + shippingFee),
    currency: "usd",
  };
}
