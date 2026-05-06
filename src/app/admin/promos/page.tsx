import { adminService } from "@/modules/admin/admin.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ConfirmButton } from "@/components/admin/AdminClientHelpers";

export default async function AdminPromosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const promos = await adminService.getPromoCodes();

  async function createPromo(formData: FormData) {
    "use server";
    const code = formData.get("code") as string;
    const discountType = formData.get("discountType") as "PERCENTAGE" | "FIXED";
    const discountValue = parseFloat(formData.get("discountValue") as string);
    const usageLimitRaw = formData.get("usageLimit") as string;
    const usageLimit = usageLimitRaw ? parseInt(usageLimitRaw) : null;
    const expiryDateRaw = formData.get("expiryDate") as string;
    const expiryDate = expiryDateRaw ? new Date(expiryDateRaw) : null;

    if (!code || isNaN(discountValue)) return;

    await adminService.createPromoCode({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      usageLimit,
      expiryDate
    });
    revalidatePath("/admin/promos");
  }

  async function togglePromo(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await adminService.togglePromoCode(id, isActive);
    revalidatePath("/admin/promos");
  }

  async function deletePromo(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await adminService.deletePromoCode(id);
    revalidatePath("/admin/promos");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Promo Codes & Discounts</h2>
        <p className="text-slate-500 text-sm mt-1">Create and manage checkout coupons</p>
      </div>

      <form action={createPromo} className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Code</label>
          <input type="text" name="code" required placeholder="SAVE20" className="input py-2 text-sm uppercase w-32" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
          <select name="discountType" className="input py-2 text-sm w-32">
            <option value="PERCENTAGE">Percentage %</option>
            <option value="FIXED">Fixed Amount $</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Value</label>
          <input type="number" name="discountValue" required placeholder="20" min="0" step="0.01" className="input py-2 text-sm w-24" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Usage Limit (opt)</label>
          <input type="number" name="usageLimit" placeholder="Unlimited" min="1" className="input py-2 text-sm w-32" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Expiry (opt)</label>
          <input type="date" name="expiryDate" className="input py-2 text-sm w-40" />
        </div>
        <button type="submit" className="btn btn-primary py-2 text-sm">Create Coupon</button>
      </form>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500 bg-slate-50">
              <th className="py-3 px-4 font-medium rounded-tl-lg">Code</th>
              <th className="py-3 px-4 font-medium">Discount</th>
              <th className="py-3 px-4 font-medium">Usage</th>
              <th className="py-3 px-4 font-medium">Expiry</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promos.map((promo) => (
              <tr key={promo.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{promo.code}</span>
                </td>
                <td className="py-4 px-4 font-medium text-blue-700">
                  {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `$${promo.discountValue.toFixed(2)} OFF`}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {promo.usedCount} / {promo.usageLimit || "∞"}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {promo.expiryDate ? new Date(promo.expiryDate).toLocaleDateString() : "Never"}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    promo.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {promo.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-4 px-4 text-right space-x-2">
                  <form action={togglePromo} className="inline-block">
                    <input type="hidden" name="id" value={promo.id} />
                    <input type="hidden" name="isActive" value={(!promo.isActive).toString()} />
                    <button type="submit" title={promo.isActive ? "Deactivate" : "Activate"} className={`p-1.5 rounded transition-colors ${promo.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {promo.isActive ? "pause" : "play_arrow"}
                      </span>
                    </button>
                  </form>
                  <form action={deletePromo} className="inline-block">
                    <input type="hidden" name="id" value={promo.id} />
                    <ConfirmButton 
                      confirmMessage="Delete this promo code?"
                      title="Delete" 
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">No promo codes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
