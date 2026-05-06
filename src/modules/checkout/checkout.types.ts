export interface CheckoutPricing {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: "usd";
}

export interface CheckoutResult {
  orderId: string;
  provider: "stripe" | "paypal" | "cod";
  status: "pending";
  amount: number;
  currency: "usd";
  stripe?: { clientSecret: string };
  paypal?: { orderId: string };
}
