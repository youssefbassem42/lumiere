"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
}

export function AddToCartButton({ productId, disabled }: AddToCartButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function addToCart() {
    setError(null);
    const response = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Unable to add item");
      return;
    }

    startTransition(() => router.push("/cart"));
  }

  return (
    <div className="flex-1">
      <button
        disabled={disabled || isPending}
        onClick={addToCart}
        className="btn btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add to cart"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        {isPending ? "Adding..." : disabled ? "Out of Stock" : "Add to Cart"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
