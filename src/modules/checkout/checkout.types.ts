export interface CheckoutPricing {
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: "usd";
}

export interface CheckoutResult {
  orderId: string;
  provider: "stripe" | "paypal";
  status: "pending";
  amount: number;
  currency: "usd";
  stripe?: { clientSecret: string };
  paypal?: { orderId: string };
}
