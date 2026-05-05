"use client";

import { useState, useTransition, useEffect } from "react";

interface WishlistButtonProps {
  productId: string;
  initialInWishlist: boolean;
  className?: string;
}

export function WishlistButton({ productId, initialInWishlist = false, className }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [isPending, startTransition] = useTransition();

  // Optionally fetch initial state if not provided
  useEffect(() => {
    if (initialInWishlist === undefined) {
      fetch("/api/wishlist").then(res => res.json()).then(data => {
        if (data && data.items) {
          setInWishlist(data.items.some((item: any) => item.productId === productId));
        }
      });
    }
  }, [productId, initialInWishlist]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic UI update
    const previousState = inWishlist;
    setInWishlist(!previousState);

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
        }
      } catch (error) {
        setInWishlist(previousState);
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
