export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  isFeatured: boolean;
  images: ProductImage[];
  category: ProductCategory;
  avgRating: number;
  reviewCount: number;
  // Canonical AI Commerce fields (source aliases for the integration sync)
  title?: string;
  handle?: string;
  description?: string | null;
  stockQuantity?: number;
  inventory_quantity?: number;
  categoryId?: string;
  categoryName?: string;
  image_url?: string | null;
  compareAtPrice?: number | null;
  sku?: string | null;
  external_id?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  sku: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  children: CategoryWithChildren[];
}

// ─── Query DTOs ───────────────────────────────────────────────────────────────

export interface ProductQueryDTO {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  data: ProductListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
