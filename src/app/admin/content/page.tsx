import { adminService } from "@/modules/admin/admin.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const { data: products } = await adminService.getProducts({});

  async function toggleFeatured(formData: FormData) {
    "use server";
    const productId = formData.get("productId") as string;
    const isFeatured = formData.get("isFeatured") === "true";
    await adminService.toggleFeatured(productId, isFeatured);
    revalidatePath("/admin/content");
    revalidatePath("/"); // Update homepage
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Content Management</h2>
        <p className="text-slate-500 text-sm mt-1">Manage homepage featured products and banners</p>
      </div>

      <div className="space-y-8">
        <section className="bg-slate-50 rounded-lg p-6 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Homepage Featured Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-2 font-semibold">Product</th>
                  <th className="py-2 px-2 font-semibold text-center">Featured Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="text-sm">
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-900">{product.name}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <form action={toggleFeatured}>
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="isFeatured" value={(!product.isFeatured).toString()} />
                        <button type="submit" className={`p-1 rounded-full transition-colors ${product.isFeatured ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'}`} title={product.isFeatured ? "Remove from Featured" : "Add to Featured"}>
                          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: product.isFeatured ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-slate-50 rounded-lg p-6 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Homepage Banners</h3>
          <p className="text-sm text-slate-500 mb-4">
            Currently, banners are managed via environment variables or hardcoded components in the MVP for maximum performance. To change the hero banner, edit `src/app/page.tsx` or contact your engineering team.
          </p>
          <div className="p-4 bg-white border border-slate-200 rounded-lg opacity-70">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">MVP LIMITATION</span>
            <p className="text-sm text-slate-700 mt-2">Dynamic banner CMS is deferred to Phase 4 development to maintain current lightweight architecture.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
