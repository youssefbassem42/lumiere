import { db } from "@/lib/db";
import type { OrderDetailDTO, PaginatedOrdersDTO } from "./order.types";
import type { OrderQueryDTO } from "./order.validators";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export const orderRepository = {
  async findManyForUser(userId: string, query: OrderQueryDTO): Promise<PaginatedOrdersDTO> {
    const skip = (query.page - 1) * query.limit;

    const [total, orders] = await db.$transaction([
      db.order.count({ where: { userId } }),
      db.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
        select: {
          id: true,
          status: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
          items: { select: { quantity: true } },
        },
      }),
    ]);

    return {
      data: orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: order.createdAt.toISOString(),
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async findByIdForUser(userId: string, orderId: string): Promise<OrderDetailDTO | null> {
    const order = await db.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        subtotal: true,
        discountAmount: true,
        promoCode: true,
        taxAmount: true,
        shippingFee: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        payment: {
          select: { status: true, provider: true, transactionId: true },
        },
        shippingAddress: {
          select: {
            fullName: true,
            phone: true,
            country: true,
            city: true,
            street: true,
            postalCode: true,
          },
        },
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            productSlug: true,
            imageUrl: true,
            quantity: true,
            price: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      promoCode: order.promoCode,
      taxAmount: order.taxAmount,
      shippingFee: order.shippingFee,
      totalAmount: order.totalAmount,
      currency: order.currency,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt.toISOString(),
      payment: order.payment,
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        ...item,
        lineTotal: roundMoney(item.price * item.quantity),
      })),
    };
  },
};
