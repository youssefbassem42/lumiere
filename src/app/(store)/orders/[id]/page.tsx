import { OrderDetailClient } from "@/components/orders/OrderDetailClient";

export const metadata = { title: "Order Details" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
