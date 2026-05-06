import { adminService } from "@/modules/admin/admin.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ConfirmButton } from "@/components/admin/AdminClientHelpers";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page || "1");
  const { data: products, meta } = await adminService.getProducts({ 
    search: resolvedSearchParams.search,
    page
  });

  async function deleteProduct(formData: FormData) {
    "use server";
    const productId = formData.get("productId") as string;
    await adminService.deleteProduct(productId);
    revalidatePath("/admin/products");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Platform Products</h2>
          <p className="text-slate-500 text-sm mt-1">Manage all products listed by sellers or admins</p>
        </div>

        <form className="flex gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            name="search" 
            defaultValue={resolvedSearchParams.search} 
            placeholder="Search products..." 
            className="input py-2 text-sm max-w-xs"
          />
          <button type="submit" className="btn btn-secondary py-2 text-sm">Search</button>
        </form>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500 bg-slate-50">
              <th className="py-3 px-4 font-medium rounded-tl-lg">Product</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Seller</th>
              <th className="py-3 px-4 font-medium">Price</th>
              <th className="py-3 px-4 font-medium">Stock</th>
              <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-900 line-clamp-1">{product.name}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{product.sku || "NO SKU"}</div>
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {product.category.name}
                </td>
                <td className="py-4 px-4">
                  {product.seller ? (
                    <span className="font-medium text-blue-600">{product.seller.shopName}</span>
                  ) : (
                    <span className="text-slate-400">Admin</span>
                  )}
                </td>
                <td className="py-4 px-4 font-medium text-slate-900">
                  ${product.price.toFixed(2)}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${product.stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-4 px-4 text-right space-x-2">
                  <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 inline-block text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Product">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </a>
                  <form action={deleteProduct} className="inline-block">
                    <input type="hidden" name="productId" value={product.id} />
                    <ConfirmButton 
                      confirmMessage="Delete this product permanently?"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                      title="Delete Product"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">No products found.</td>
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
              href={`/admin/products?page=${meta.page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}`}
              className={`btn btn-secondary py-1 px-3 text-sm ${meta.page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Previous
            </a>
            <a 
              href={`/admin/products?page=${meta.page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}`}
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
