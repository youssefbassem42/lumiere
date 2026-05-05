import { redis, cacheGet, cacheSet } from "@/lib/redis";
import { db } from "@/lib/db";

const MAX_RECENT = 10;
const RECENT_PREFIX = "recent_products:";

export const recentlyViewedService = {
  async addProduct(userId: string, productId: string) {
    const key = `${RECENT_PREFIX}${userId}`;
    // Fetch current list
    let recent = await cacheGet<string[]>(key) || [];
    
    // Remove if exists to push to front
    recent = recent.filter(id => id !== productId);
    recent.unshift(productId);
    
    // Limit size
    recent = recent.slice(0, MAX_RECENT);
    
    // Store back, 30 days TTL
    await cacheSet(key, recent, 30 * 24 * 60 * 60);
    return { success: true };
  },

  async getRecentProducts(userId: string) {
    const key = `${RECENT_PREFIX}${userId}`;
    const recentIds = await cacheGet<string[]>(key) || [];
    if (recentIds.length === 0) return [];

    // Fetch products from DB
    const products = await db.product.findMany({
      where: { id: { in: recentIds } },
      include: { images: { take: 1 } },
    });

    // Reorder to match Redis array order
    return recentIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean);
  }
};
