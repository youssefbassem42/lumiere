import { wishlistRepository } from "./wishlist.repository";

export const wishlistService = {
  async getWishlistProductIds(userId: string) {
    return wishlistRepository.listProductIds(userId);
  },

  async isInWishlist(userId: string | undefined, productId: string) {
    if (!userId) return false;
    return wishlistRepository.isInWishlist(userId, productId);
  },

  async getWishlist(userId: string) {
    return wishlistRepository.getWishlist(userId);
  },

  async toggleItem(userId: string, productId: string) {
    const exists = await wishlistRepository.isInWishlist(userId, productId);
    if (exists) {
      await wishlistRepository.removeItem(userId, productId);
      return { status: "removed" };
    } else {
      await wishlistRepository.addItem(userId, productId);
      return { status: "added" };
    }
  },
  
  async removeItem(userId: string, productId: string) {
    await wishlistRepository.removeItem(userId, productId);
    return { status: "removed" };
  }
};
