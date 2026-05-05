import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { orderService } from "@/modules/orders/order.service";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { id } = await params;
  let order;
  try {
    order = await orderService.getOrder(session.user.id, id);
  } catch {
    notFound();
  }

  const getProgress = (status: string) => {
    const statuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
    const index = statuses.indexOf(status);
    if (index === -1) return 0;
    return (index / (statuses.length - 1)) * 100;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/profile/orders" className="text-slate-500 hover:text-blue-600">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</h1>
        </div>
        <p className="text-sm text-slate-500">Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tracking */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{order.status}</h2>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative w-full h-1.5 bg-slate-100 rounded-full mb-4">
              <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${getProgress(order.status)}%` }}></div>
            </div>
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
              <span>Pending</span>
              <span>Paid</span>
              <span>Shipped</span>
              <span>Delivered</span>
            </div>
          </section>

          {/* Delivery Info */}
          {order.shippingAddress && (
            <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                <span className="material-symbols-outlined">home</span>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-2">DELIVERY ADDRESS</h3>
                <p className="text-sm text-slate-900 leading-relaxed">
                  {order.shippingAddress.fullName}<br/>
                  {order.shippingAddress.street}<br/>
                  {order.shippingAddress.city}, {order.shippingAddress.country}<br/>
                  {order.shippingAddress.phone}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Summary */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-4">ORDER SUMMARY</h3>
            <div className="flex flex-col gap-4 mb-6">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
                    {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-slate-900 font-medium truncate" title={item.productName}>{item.productName}</h4>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-medium text-slate-900 whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Shipping</span>
                <span>${order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Tax</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-slate-900 pt-3 mt-3 border-t border-slate-100">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col">
            <a 
              href={`/api/orders/${order.id}/invoice`} 
              target="_blank"
              className="w-full py-3 px-4 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">receipt</span>
              Download Invoice
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
