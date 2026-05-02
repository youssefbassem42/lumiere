import Link from "next/link";

export const metadata = { title: "Checkout Success" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <div className="container-page py-16">
      <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center max-w-2xl mx-auto">
        <span className="badge badge-success">Payment Processing</span>
        <h1 className="text-3xl font-bold text-slate-900 mt-4">Thank you for your order</h1>
        <p className="text-slate-500 mt-3">Payment confirmation is completed by the provider webhook. Your order status will update automatically.</p>
        <div className="flex justify-center gap-3 mt-8">
          {orderId && <Link href={`/orders/${orderId}`} className="btn btn-primary">View Order</Link>}
          <Link href="/orders" className="btn btn-secondary">Order History</Link>
        </div>
      </div>
    </div>
  );
}
