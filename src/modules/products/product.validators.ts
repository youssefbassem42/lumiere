import { z } from "zod";

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categorySlug: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z
    .enum(["price_asc", "price_desc", "newest", "rating"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(12),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
