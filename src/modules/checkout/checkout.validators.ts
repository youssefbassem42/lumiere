import { z } from "zod";

export const checkoutAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  street: z.string().trim().min(4).max(180),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
});

export const checkoutSchema = z.object({
  provider: z.enum(["stripe", "paypal", "cod"]),
  shippingAddress: checkoutAddressSchema,
  promoCode: z.string().trim().min(2).max(32).optional().or(z.literal("")),
  guestEmail: z.string().email().optional().or(z.literal("")),
});

export type CheckoutAddressDTO = z.infer<typeof checkoutAddressSchema>;
export type CheckoutDTO = z.infer<typeof checkoutSchema>;
