import { cacheGet, cacheSet } from "@/lib/redis";
import { productRepository } from "./product.repository";
import type {
  ProductQueryDTO,
  PaginatedProducts,
  ProductDetail,
  ProductListItem,
} from "./product.types";

const CACHE_TTL = 300; // 5 min

function buildCacheKey(query: ProductQueryDTO): string {
  const parts = ["products"];
  if (query.search) parts.push(`search=${query.search}`);
  if (query.categorySlug) parts.push(`category=${query.categorySlug}`);
  if (query.minPrice !== undefined) parts.push(`min=${query.minPrice}`);
  if (query.maxPrice !== undefined) parts.push(`max=${query.maxPrice}`);
  if (query.sort) parts.push(`sort=${query.sort}`);
  parts.push(`page=${query.page ?? 1}`);
  parts.push(`limit=${query.limit ?? 12}`);
  return parts.join(":");
}

export const productService = {
  async getProducts(query: ProductQueryDTO): Promise<PaginatedProducts> {
    const cacheKey = buildCacheKey(query);
    const cached = await cacheGet<PaginatedProducts>(cacheKey);
    if (cached) return cached;

    const result = await productRepository.findMany(query);
    await cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  },

  async getProductBySlug(slug: string): Promise<ProductDetail | null> {
    const cacheKey = `product:${slug}`;
    const cached = await cacheGet<ProductDetail>(cacheKey);
    if (cached) return cached;

    const product = await productRepository.findBySlug(slug);
    if (product) await cacheSet(cacheKey, product, CACHE_TTL);
    return product;
  },

  async getFeaturedProducts(limit = 8): Promise<ProductListItem[]> {
    const cacheKey = `products:featured:${limit}`;
    const cached = await cacheGet<ProductListItem[]>(cacheKey);
    if (cached) return cached;

    const products = await productRepository.findFeatured(limit);
    await cacheSet(cacheKey, products, CACHE_TTL);
    return products;
  },
};
