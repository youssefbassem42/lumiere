import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { wishlistService } from "@/modules/wishlist/wishlist.service";
import WishlistGrid from "./WishlistGrid";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const wishlist = await wishlistService.getWishlist(session.user.id);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">My Wishlist</h2>
      </div>
      
      {!wishlist?.items.length ? (
        <div className="flex-grow flex items-center justify-center text-slate-500 flex-col gap-2">
          <span className="material-symbols-outlined text-4xl">favorite_border</span>
          <p>Your wishlist is currently empty.</p>
        </div>
      ) : (
        <WishlistGrid initialItems={wishlist.items} />
      )}
    </div>
  );
}
