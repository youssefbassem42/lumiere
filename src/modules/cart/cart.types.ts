export interface CartProductDTO {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: { url: string; alt: string | null } | null;
}

export interface CartItemDTO {
  id: string;
  productId: string;
  quantity: number;
  lineTotal: number;
  product: CartProductDTO;
}

export interface CartDTO {
  id: string;
  items: CartItemDTO[];
  subtotal: number;
  itemCount: number;
}

export interface CartIdentity {
  userId?: string;
  guestId?: string;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
}
