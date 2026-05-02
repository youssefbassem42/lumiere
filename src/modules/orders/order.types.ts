export interface OrderListItemDTO {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

export interface OrderDetailDTO extends OrderListItemDTO {
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  payment: {
    status: string;
    provider: string;
    transactionId: string | null;
  } | null;
  shippingAddress: {
    fullName: string;
    phone: string;
    country: string;
    city: string;
    street: string;
    postalCode: string | null;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    imageUrl: string | null;
    quantity: number;
    price: number;
    lineTotal: number;
  }>;
}

export interface PaginatedOrdersDTO {
  data: OrderListItemDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
