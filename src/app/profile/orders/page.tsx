import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { orderService } from "@/modules/orders/order.service";
import Link from "next/link";
import { recentlyViewedService } from "@/modules/users/recently-viewed.service";
import Image from "next/image";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const orders = await orderService.getOrders(session.user.id, { page: 1, limit: 10 });
  const recentProducts = await recentlyViewedService.getRecentProducts(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Order History</h2>
        </div>
        <div className="flex flex-col mt-4 flex-grow">
          {orders.data.length === 0 ? (
            <p className="text-slate-500">No orders found.</p>
          ) : (
            orders.data.map((order, index) => (
              <div key={order.id} className={`flex flex-col py-4 ${index !== orders.data.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-slate-900 font-medium mt-1">
                      {order.itemCount} item(s) • ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                    order.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                    order.status === "PAID" ? "bg-blue-100 text-blue-800" :
                    order.status === "SHIPPED" ? "bg-indigo-100 text-indigo-800" :
                    order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800" :
                    order.status === "RETURNED" ? "bg-purple-100 text-purple-800" :
                    order.status === "FAILED" ? "bg-red-100 text-red-800" :
                    "bg-slate-100 text-slate-800"
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                  <Link href={`/profile/orders/${order.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {recentProducts.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col mt-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentProducts.map(product => (
              <Link href={`/products/${product?.slug}`} key={product?.id} className="group block">
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-3 relative">
                  {product?.images?.[0] && (
                    <Image src={product.images[0].url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  )}
                </div>
                <h3 className="text-sm font-medium text-slate-900 truncate">{product?.name}</h3>
                <p className="text-sm text-blue-600 mt-1">${product?.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
