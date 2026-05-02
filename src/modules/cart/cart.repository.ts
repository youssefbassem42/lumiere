import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import type { CartDTO, GuestCartItem } from "./cart.types";

const cartItemSelect = {
  id: true,
  productId: true,
  quantity: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stock: true,
      images: { select: { url: true, alt: true }, take: 1 },
    },
  },
} satisfies Prisma.CartItemSelect;

type CartItemPayload = Prisma.CartItemGetPayload<{ select: typeof cartItemSelect }>;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function mapCartItems(items: CartItemPayload[], id: string): CartDTO {
  const mapped = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    lineTotal: roundMoney(item.product.price * item.quantity),
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      stock: item.product.stock,
      image: item.product.images[0] ?? null,
    },
  }));

  return {
    id,
    items: mapped,
    subtotal: roundMoney(mapped.reduce((sum, item) => sum + item.lineTotal, 0)),
    itemCount: mapped.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export const cartRepository = {
  async getUserCart(userId: string): Promise<CartDTO> {
    const cart = await db.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { select: cartItemSelect, orderBy: { updatedAt: "desc" } } },
    });

    return mapCartItems(cart.items, cart.id);
  },

  async getCartItemsForCheckout(userId: string) {
    const cart = await db.cart.findUnique({
      where: { userId },
      include: { items: { select: cartItemSelect, orderBy: { createdAt: "asc" } } },
    });

    return cart ? mapCartItems(cart.items, cart.id) : mapCartItems([], "empty");
  },

  async addUserItem(userId: string, productId: string, quantity: number): Promise<CartDTO> {
    const cart = await db.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true },
    });

    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity },
    });

    return this.getUserCart(userId);
  },

  async setUserItemQuantity(userId: string, productId: string, quantity: number): Promise<CartDTO> {
    const cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
    if (!cart) return this.getUserCart(userId);

    if (quantity <= 0) {
      await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    } else {
      await db.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        update: { quantity },
        create: { cartId: cart.id, productId, quantity },
      });
    }

    return this.getUserCart(userId);
  },

  async removeUserItem(userId: string, productId: string): Promise<CartDTO> {
    const cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
    if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return this.getUserCart(userId);
  },

  async clearUserCart(userId: string) {
    const cart = await db.cart.findUnique({ where: { userId }, select: { id: true } });
    if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  },
};

const guestKey = (guestId: string) => `cart:guest:${guestId}`;
const GUEST_CART_TTL = 60 * 60 * 24 * 30;

export const guestCartRepository = {
  async getItems(guestId: string): Promise<GuestCartItem[]> {
    return (await cacheGet<GuestCartItem[]>(guestKey(guestId))) ?? [];
  },

  async setItems(guestId: string, items: GuestCartItem[]) {
    await cacheSet(guestKey(guestId), items, GUEST_CART_TTL);
  },

  async clear(guestId: string) {
    await cacheDel(guestKey(guestId));
  },

  async resolveCart(guestId: string): Promise<CartDTO> {
    const items = await this.getItems(guestId);
    if (items.length === 0) return { id: guestId, items: [], subtotal: 0, itemCount: 0 };

    const products = await db.product.findMany({
      where: { id: { in: items.map((item) => item.productId) }, isPublished: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        images: { select: { url: true, alt: true }, take: 1 },
      },
    });

    const mapped = items
      .map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) return null;
        const quantity = Math.min(item.quantity, product.stock);
        return {
          id: item.productId,
          productId: item.productId,
          quantity,
          lineTotal: roundMoney(product.price * quantity),
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            stock: product.stock,
            image: product.images[0] ?? null,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return {
      id: guestId,
      items: mapped,
      subtotal: roundMoney(mapped.reduce((sum, item) => sum + item.lineTotal, 0)),
      itemCount: mapped.reduce((sum, item) => sum + item.quantity, 0),
    };
  },
};
