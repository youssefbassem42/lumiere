import { AppError } from "@/modules/shared/errors";
import { orderRepository } from "./order.repository";
import type { OrderQueryDTO } from "./order.validators";

export const orderService = {
  async getOrders(userId: string, query: OrderQueryDTO) {
    return orderRepository.findManyForUser(userId, query);
  },

  async getAllOrders(query: OrderQueryDTO) {
    return orderRepository.findManyAll(query);
  },

  async getOrder(userId: string, orderId: string) {
    const order = await orderRepository.findByIdForUser(userId, orderId);
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    return order;
  },
};
