import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellerService } from "@/modules/seller/seller.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export default async function SellerProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await sellerService.getProfile(session.user.id);
  if (!profile) {
    redirect("/seller/settings");
  }

  const products = await sellerService.getProducts(profile.id);

  async function deleteProduct(formData: FormData) {
    "use server";
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user) return;
    
    const productId = formData.get("productId") as string;
    const sellerProf = await sellerService.getProfile(userSession.user.id);
    if (!sellerProf) return;

    await db.product.delete({
      where: { id: productId, sellerId: sellerProf.id }
    });
    revalidatePath("/seller/products");
  }

  async function restockProduct(formData: FormData) {
    "use server";
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user) return;
    
    const productId = formData.get("productId") as string;
    const amount = parseInt(formData.get("amount") as string, 10);
    const sellerProf = await sellerService.getProfile(userSession.user.id);
    if (!sellerProf) return;

    await db.product.update({
      where: { id: productId, sellerId: sellerProf.id },
      data: { stock: { increment: amount } }
    });
    revalidatePath("/seller/products");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Products</h2>
        <Link href="/seller/products/new" className="btn btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Product
        </Link>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500 mb-4">You haven't added any products yet.</p>
          <Link href="/seller/products/new" className="btn btn-secondary">Create your first product</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="py-3 font-medium">Product</th>
                <th className="py-3 font-medium">Price</th>
                <th className="py-3 font-medium">Stock</th>
                <th className="py-3 font-medium">Restock</th>
                <th className="py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="text-sm">
                  <td className="py-4">
                    <div className="font-medium text-slate-900">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.category.name}</div>
                  </td>
                  <td className="py-4 font-medium text-slate-900">${product.price.toFixed(2)}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${product.stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="py-4">
                    <form action={restockProduct} className="flex items-center gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      <input 
                        type="number" 
                        name="amount" 
                        min="1" 
                        defaultValue="10" 
                        className="w-16 h-8 text-xs border border-slate-200 rounded px-2 focus:ring-1 focus:ring-blue-500 outline-none" 
                      />
                      <button type="submit" className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700">
                        Add
                      </button>
                    </form>
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <Link 
                      href={`/seller/products/edit/${product.id}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors inline-block"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </Link>
                    <form action={deleteProduct} className="inline-block">
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </form>
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
