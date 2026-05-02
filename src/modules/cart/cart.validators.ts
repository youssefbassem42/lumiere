import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(99).default(1),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
});

export const removeCartItemSchema = z.object({
  productId: z.string().min(1),
});

export type AddCartItemDTO = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemDTO = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemDTO = z.infer<typeof removeCartItemSchema>;
