import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type {
  ProductListItem,
  ProductDetail,
  ProductQueryDTO,
  PaginatedProducts,
} from "./product.types";

// ─── Shared select shape ──────────────────────────────────────────────────────
const productListSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  comparePrice: true,
  stock: true,
  isFeatured: true,
  avgRating: true,
  reviewCount: true,
  images: { select: { id: true, url: true, alt: true }, take: 1 },
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

function mapToListItem(
  p: Prisma.ProductGetPayload<{ select: typeof productListSelect }>
): ProductListItem {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    comparePrice: p.comparePrice,
    stock: p.stock,
    isFeatured: p.isFeatured,
    images: p.images,
    category: p.category,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────
export const productRepository = {
  async findMany(query: ProductQueryDTO): Promise<PaginatedProducts> {
    const {
      search,
      categorySlug,
      minPrice,
      maxPrice,
      sort = "newest",
      page = 1,
      limit = 12,
    } = query;

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      stock: { gt: 0 },
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && {
        price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), lte: maxPrice },
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
          ? { price: "desc" }
          : sort === "rating"
            ? { avgRating: "desc" }
            : { createdAt: "desc" };

    const skip = (page - 1) * limit;

    const [total, products] = await db.$transaction([
      db.product.count({ where }),
      db.product.findMany({
        where,
        select: productListSelect,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data: products.map(mapToListItem),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findBySlug(slug: string): Promise<ProductDetail | null> {
    const p = await db.product.findUnique({
      where: { slug, isPublished: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        comparePrice: true,
        stock: true,
        sku: true,
        isFeatured: true,
        isPublished: true,
        avgRating: true,
        reviewCount: true,
        createdAt: true,
        updatedAt: true,
        images: { select: { id: true, url: true, alt: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!p) return null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice,
      stock: p.stock,
      sku: p.sku,
      isFeatured: p.isFeatured,
      isPublished: p.isPublished,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      images: p.images,
      category: p.category,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
    };
  },

  async findFeatured(limit = 8): Promise<ProductListItem[]> {
    const products = await db.product.findMany({
      where: { isFeatured: true, isPublished: true, stock: { gt: 0 } },
      select: productListSelect,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    return products.map(mapToListItem);
  },
};
