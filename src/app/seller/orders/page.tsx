import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellerService } from "@/modules/seller/seller.service";
import { redirect } from "next/navigation";

export default async function SellerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await sellerService.getProfile(session.user.id);
  if (!profile) redirect("/seller/settings");

  const orders = await sellerService.getOrders(profile.id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Orders</h2>
      
      {orders.length === 0 ? (
        <p className="text-slate-500 py-4">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="py-3 font-medium">Order ID</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Customer</th>
                <th className="py-3 font-medium">Items</th>
                <th className="py-3 font-medium">My Earnings</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="text-sm">
                  <td className="py-4 font-mono text-xs">{order.id.slice(0, 8)}</td>
                  <td className="py-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 text-slate-900">{order.user?.name || "Guest"}</td>
                  <td className="py-4 text-slate-600">
                    <ul className="list-disc pl-4">
                      {order.items.map((item: any) => (
                        <li key={item.id}>{item.quantity}x {item.productName}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-4 font-medium text-slate-900">${order.sellerTotal.toFixed(2)}</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
