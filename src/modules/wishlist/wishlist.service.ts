import { wishlistRepository } from "./wishlist.repository";

export const wishlistService = {
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
