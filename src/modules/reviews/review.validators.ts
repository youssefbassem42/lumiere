import { z } from "zod";

export const reviewCreateSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().min(0).max(5),
  comment: z.string().trim().min(1, "Review cannot be empty").max(1000),
});

export const reviewUpdateSchema = z.object({
  rating: z.coerce.number().min(0).max(5).optional(),
  comment: z.string().trim().min(1, "Review cannot be empty").max(1000).optional(),
});

export const reviewReplySchema = z.object({
  comment: z.string().trim().min(1, "Reply cannot be empty").max(1000),
});

export const reviewQuerySchema = z.object({
  sort: z.enum(["newest", "highest"]).optional().default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
export type ReviewReplyInput = z.infer<typeof reviewReplySchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
