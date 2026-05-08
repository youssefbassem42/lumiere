import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellerService } from "@/modules/seller/seller.service";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await sellerService.getProfile(session.user.id);
  if (!profile) redirect("/seller/settings");

  const product = await db.product.findUnique({
    where: { id, sellerId: profile.id },
    include: { images: true }
  });

  if (!product) notFound();

  const categories = await db.category.findMany();

  async function updateProduct(formData: FormData) {
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
    const isPublished = formData.get("isPublished") === "on";

    await db.product.update({
      where: { id, sellerId: sellerProf.id },
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        isPublished,
        images: imageUrl ? {
          deleteMany: {},
          create: [{ url: imageUrl, alt: name }]
        } : undefined
      }
    });

    revalidatePath("/seller/products");
    redirect("/seller/products");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Product</h2>
      
      <form action={updateProduct} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
          <input type="text" name="name" defaultValue={product.name} required className="input" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
          <textarea name="description" defaultValue={product.description} required rows={4} className="input resize-y" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Price ($) *</label>
            <input type="number" step="0.01" name="price" defaultValue={product.price} required className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Stock *</label>
            <input type="number" name="stock" defaultValue={product.stock} required className="input" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
          <select name="categoryId" defaultValue={product.categoryId} required className="input bg-white">
            <option value="">Select a category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
          <input type="url" name="imageUrl" defaultValue={product.images[0]?.url || ""} className="input" placeholder="https://..." />
          <p className="text-xs text-slate-500 mt-1">Provide a valid image URL.</p>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="isPublished" id="isPublished" defaultChecked={product.isPublished} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="isPublished" className="text-sm font-medium text-slate-700">Published</label>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <a href="/seller/products" className="btn btn-secondary">Cancel</a>
          <button type="submit" className="btn btn-primary">Update Product</button>
        </div>
      </form>
    </div>
  );
}
