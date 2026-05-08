"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "react-hot-toast";

let cachedWishlistIds: Set<string> | null = null;
let wishlistFetchPromise: Promise<Set<string>> | null = null;

async function fetchWishlistIds(): Promise<Set<string>> {
  if (cachedWishlistIds) return cachedWishlistIds;
  if (wishlistFetchPromise) return wishlistFetchPromise;

  wishlistFetchPromise = fetch("/api/wishlist", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return new Set<string>();
      const data = (await res.json().catch(() => null)) as { productIds?: string[] } | null;
      return new Set<string>(data?.productIds ?? []);
    })
    .catch(() => new Set<string>());

  const ids = await wishlistFetchPromise;
  cachedWishlistIds = ids;
  wishlistFetchPromise = null;
  return ids;
}

function updateWishlistCache(productId: string, inWishlist: boolean) {
  if (!cachedWishlistIds) return;
  if (inWishlist) cachedWishlistIds.add(productId);
  else cachedWishlistIds.delete(productId);
}

interface WishlistButtonProps {
  productId: string;
  initialInWishlist?: boolean;
  className?: string;
}

export function WishlistButton({ productId, initialInWishlist = false, className }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetchWishlistIds().then((ids) => {
      if (!cancelled) setInWishlist(ids.has(productId));
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic UI update
    const previousState = inWishlist;
    const nextState = !previousState;
    setInWishlist(nextState);
    updateWishlistCache(productId, nextState);

    startTransition(async () => {
      try {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          // Revert on failure
          setInWishlist(previousState);
          updateWishlistCache(productId, previousState);
          toast.error("Failed to update wishlist");
        } else {
          toast.success(nextState ? "Added to wishlist" : "Removed from wishlist");
        }
      } catch {
        setInWishlist(previousState);
        updateWishlistCache(productId, previousState);
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <button
      className={className || `absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full transition-all flex items-center justify-center z-10 ${
        inWishlist ? "text-red-500 opacity-100" : "text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"
      }`}
      onClick={toggleWishlist}
      disabled={isPending}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg 
        className="w-5 h-5 transition-colors" 
        fill={inWishlist ? "currentColor" : "none"} 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
