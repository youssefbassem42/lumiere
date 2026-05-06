import { db } from "@/lib/db";

export const wishlistRepository = {
  async listProductIds(userId: string): Promise<string[]> {
    const wishlist = await db.wishlist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wishlist) return [];

    const items = await db.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      select: { productId: true },
    });
    return items.map((item) => item.productId);
  },

  async getWishlist(userId: string) {
    let wishlist = await db.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {  
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
      },
    });

    if (!wishlist) {
      const userExists = await db.user.count({ where: { id: userId } });
      if (!userExists) {
        throw new Error("Cannot create wishlist: User does not exist");
      }

      wishlist = await db.wishlist.create({
        data: { userId },
        include: { items: { include: { product: { include: { images: true } } } } },
      });
    }

    return wishlist;
  },

  async addItem(userId: string, productId: string) {
    let wishlist = await db.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await db.wishlist.create({ data: { userId } });
    }

    return db.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      create: {
        wishlistId: wishlist.id,
        productId,
      },
      update: {},
    });
  },

  async removeItem(userId: string, productId: string) {
    const wishlist = await db.wishlist.findUnique({ where: { userId } });
    if (!wishlist) return null;

    return db.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });
  },
  
  async isInWishlist(userId: string, productId: string) {
    const wishlist = await db.wishlist.findUnique({ where: { userId } });
    if (!wishlist) return false;
    const item = await db.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        }
      }
    });
    return !!item;
  }
};
