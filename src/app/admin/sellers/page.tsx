import { adminService } from "@/modules/admin/admin.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function AdminSellersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const sellers = await adminService.getSellers();

  async function toggleApproval(formData: FormData) {
    "use server";
    const sellerId = formData.get("sellerId") as string;
    const isApproved = formData.get("isApproved") === "true";
    await adminService.toggleSellerApproval(sellerId, isApproved);
    revalidatePath("/admin/sellers");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Seller Management</h2>
        <p className="text-slate-500 text-sm mt-1">Review and manage vendor accounts</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500 bg-slate-50">
              <th className="py-3 px-4 font-medium rounded-tl-lg">Shop Details</th>
              <th className="py-3 px-4 font-medium">Owner</th>
              <th className="py-3 px-4 font-medium">Products</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sellers.map((seller) => (
              <tr key={seller.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-900">{seller.shopName}</div>
                  <div className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{seller.description || "No description"}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-slate-900">{seller.user.name}</div>
                  <div className="text-xs text-slate-500">{seller.user.email}</div>
                  {seller.user.isRestricted && <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Restricted Account</span>}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {seller._count.products} listed
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    seller.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {seller.isApproved ? "Approved" : "Pending Review"}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <form action={toggleApproval}>
                    <input type="hidden" name="sellerId" value={seller.id} />
                    <input type="hidden" name="isApproved" value={(!seller.isApproved).toString()} />
                    <button type="submit" className={`btn btn-sm ${seller.isApproved ? 'btn-secondary text-amber-600 border-amber-200 hover:bg-amber-50' : 'btn-primary bg-emerald-600 hover:bg-emerald-700'}`}>
                      {seller.isApproved ? "Revoke Approval" : "Approve Seller"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {sellers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">No sellers registered yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
