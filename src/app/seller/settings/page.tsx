import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellerService } from "@/modules/seller/seller.service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function SellerSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await sellerService.getProfile(session.user.id);

  async function updateProfile(formData: FormData) {
    "use server";
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user) throw new Error("Unauthorized");
    
    const shopName = formData.get("shopName") as string;
    const description = formData.get("description") as string;
    
    if (!shopName) throw new Error("Shop name is required");
    
    await sellerService.updateProfile(userSession.user.id, {
      shopName,
      description: description || undefined,
    });
    
    revalidatePath("/seller/settings");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Shop Settings</h2>
      
      <form action={updateProfile} className="space-y-6">
        <div>
          <label htmlFor="shopName" className="block text-sm font-medium text-slate-700 mb-2">
            Shop Name *
          </label>
          <input
            type="text"
            id="shopName"
            name="shopName"
            required
            defaultValue={profile?.shopName}
            className="input"
            placeholder="E.g., Lumiere Official"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
            Shop Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={profile?.description || ""}
            className="input resize-y"
            placeholder="Tell your customers about your brand..."
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
