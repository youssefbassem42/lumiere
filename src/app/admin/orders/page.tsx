import { adminService } from "@/modules/admin/admin.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { AutoSubmitSelect } from "@/components/admin/AdminClientHelpers";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page || "1");
  const { data: orders, meta } = await adminService.getOrders({ page });

  async function updateStatus(formData: FormData) {
    "use server";
    const orderId = formData.get("orderId") as string;
    const status = formData.get("status") as OrderStatus;
    await adminService.updateOrderStatus(orderId, status);
    revalidatePath("/admin/orders");
  }

  const statuses: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Order Management</h2>
        <p className="text-slate-500 text-sm mt-1">Track and update the fulfillment status of all orders</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500 bg-slate-50">
              <th className="py-3 px-4 font-medium rounded-tl-lg">Order ID</th>
              <th className="py-3 px-4 font-medium">Customer</th>
              <th className="py-3 px-4 font-medium">Items</th>
              <th className="py-3 px-4 font-medium">Total</th>
              <th className="py-3 px-4 font-medium">Status Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-mono text-xs text-slate-700">{order.id.slice(0, 8)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-slate-900">{order.user?.name || "Guest"}</div>
                  <div className="text-xs text-slate-500">{order.user?.email || order.guestEmail || "No Email"}</div>
                </td>
                <td className="py-4 px-4 text-slate-600">
                  <ul className="list-disc pl-4 text-xs">
                    {order.items.map((item: any, i: number) => (
                      <li key={i}>{item.quantity}x <span className="truncate max-w-[150px] inline-block align-bottom">{item.productName}</span></li>
                    ))}
                  </ul>
                </td>
                <td className="py-4 px-4 font-semibold text-slate-900">
                  ${order.totalAmount.toFixed(2)}
                </td>
                <td className="py-4 px-4">
                  <form action={updateStatus} className="flex items-center gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <AutoSubmitSelect 
                      name="status" 
                      defaultValue={order.status}
                      className={`text-xs border rounded p-1.5 font-medium cursor-pointer ${
                        order.status === 'DELIVERED' ? 'bg-green-50 border-green-200 text-green-700' :
                        order.status === 'CANCELLED' ? 'bg-red-50 border-red-200 text-red-700' :
                        order.status === 'SHIPPED' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        'bg-white border-slate-200 text-slate-700'
                      }`}
                      options={statuses.map(s => ({ label: s, value: s }))}
                    />
                  </form>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <a 
              href={`/admin/orders?page=${meta.page - 1}`}
              className={`btn btn-secondary py-1 px-3 text-sm ${meta.page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Previous
            </a>
            <a 
              href={`/admin/orders?page=${meta.page + 1}`}
              className={`btn btn-secondary py-1 px-3 text-sm ${meta.page >= meta.totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
              Next
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
