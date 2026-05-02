import { db } from "@/lib/db";
import { AppError } from "@/modules/shared/errors";
import { cartRepository, guestCartRepository } from "./cart.repository";
import type { CartDTO, CartIdentity, GuestCartItem } from "./cart.types";

async function getPublishedProduct(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId, isPublished: true },
    select: { id: true, stock: true },
  });

  if (!product) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  if (product.stock <= 0) throw new AppError("Product is out of stock", 409, "OUT_OF_STOCK");
  return product;
}

function requireCartIdentity(identity: CartIdentity) {
  if (!identity.userId && !identity.guestId) {
    throw new AppError("Missing cart identity", 400, "MISSING_CART_IDENTITY");
  }
}

async function updateGuestItems(
  guestId: string,
  updater: (items: GuestCartItem[]) => GuestCartItem[]
) {
  const items = await guestCartRepository.getItems(guestId);
  await guestCartRepository.setItems(guestId, updater(items));
  return guestCartRepository.resolveCart(guestId);
}

export const cartService = {
  async getCart(identity: CartIdentity): Promise<CartDTO> {
    requireCartIdentity(identity);
    if (identity.userId) return cartRepository.getUserCart(identity.userId);
    return guestCartRepository.resolveCart(identity.guestId!);
  },

  async addItem(identity: CartIdentity, productId: string, quantity: number): Promise<CartDTO> {
    requireCartIdentity(identity);
    const product = await getPublishedProduct(productId);

    if (identity.userId) {
      const cart = await cartRepository.getUserCart(identity.userId);
      const currentQuantity =
        cart.items.find((item) => item.productId === productId)?.quantity ?? 0;
      if (currentQuantity + quantity > product.stock) {
        throw new AppError("Quantity exceeds available stock", 409, "STOCK_LIMIT");
      }
      return cartRepository.addUserItem(identity.userId, productId, quantity);
    }

    return updateGuestItems(identity.guestId!, (items) => {
      const existing = items.find((item) => item.productId === productId);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      if (nextQuantity > product.stock) {
        throw new AppError("Quantity exceeds available stock", 409, "STOCK_LIMIT");
      }

      if (existing) {
        return items.map((item) =>
          item.productId === productId ? { ...item, quantity: nextQuantity } : item
        );
      }

      return [...items, { productId, quantity }];
    });
  },

  async updateItem(identity: CartIdentity, productId: string, quantity: number): Promise<CartDTO> {
    requireCartIdentity(identity);

    if (quantity > 0) {
      const product = await getPublishedProduct(productId);
      if (quantity > product.stock) {
        throw new AppError("Quantity exceeds available stock", 409, "STOCK_LIMIT");
      }
    }

    if (identity.userId) {
      return cartRepository.setUserItemQuantity(identity.userId, productId, quantity);
    }

    return updateGuestItems(identity.guestId!, (items) => {
      if (quantity <= 0) return items.filter((item) => item.productId !== productId);
      const exists = items.some((item) => item.productId === productId);
      if (!exists) return [...items, { productId, quantity }];
      return items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  },

  async removeItem(identity: CartIdentity, productId: string): Promise<CartDTO> {
    requireCartIdentity(identity);
    if (identity.userId) return cartRepository.removeUserItem(identity.userId, productId);
    return updateGuestItems(identity.guestId!, (items) =>
      items.filter((item) => item.productId !== productId)
    );
  },

  async syncGuestCartToUser(userId: string, guestId: string): Promise<CartDTO> {
    const guestCart = await guestCartRepository.resolveCart(guestId);

    for (const item of guestCart.items) {
      await this.addItem({ userId }, item.productId, item.quantity);
    }

    await guestCartRepository.clear(guestId);
    return cartRepository.getUserCart(userId);
  },
};
