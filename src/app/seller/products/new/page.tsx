import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellerService } from "@/modules/seller/seller.service";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await sellerService.getProfile(session.user.id);
  if (!profile) redirect("/seller/settings");

  const categories = await db.category.findMany();

  async function createProduct(formData: FormData) {
    "use server";
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user) return;
    
    const sellerProf = await sellerService.getProfile(userSession.user.id);
    if (!sellerProf) return;

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const imageUrl = formData.get("imageUrl") as string;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

    await db.product.create({
      data: {
        name,
        slug,
        description,
        price,
        stock,
        categoryId,
        sellerId: sellerProf.id,
        isPublished: true,
        images: imageUrl ? {
          create: [{ url: imageUrl, alt: name }]
        } : undefined
      }
    });

    revalidatePath("/seller/products");
    redirect("/seller/products");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Product</h2>
      
      <form action={createProduct} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
          <input type="text" name="name" required className="input" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
          <textarea name="description" required rows={4} className="input resize-y" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Price ($) *</label>
            <input type="number" step="0.01" name="price" required className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Stock *</label>
            <input type="number" name="stock" required className="input" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
          <select name="categoryId" required className="input bg-white">
            <option value="">Select a category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
          <input type="url" name="imageUrl" className="input" placeholder="https://..." />
          <p className="text-xs text-slate-500 mt-1">Provide a valid image URL.</p>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <a href="/seller/products" className="btn btn-secondary">Cancel</a>
          <button type="submit" className="btn btn-primary">Create Product</button>
        </div>
      </form>
    </div>
  );
}
