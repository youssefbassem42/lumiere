"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function WishlistGrid({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState(initialItems);
  
  const handleRemove = async (productId: string) => {
    const res = await fetch(`/api/wishlist/${productId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems(items.filter(item => item.productId !== productId));
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {items.map(item => (
        <div key={item.id} className="group relative border border-slate-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
          <button 
            onClick={() => handleRemove(item.productId)}
            className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </button>
          
          <Link href={`/products/${item.product.slug}`} className="block">
            <div className="aspect-[4/5] bg-slate-100 relative">
              {item.product.images?.[0] && (
                <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-900 truncate">{item.product.name}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mt-1">${item.product.price.toFixed(2)}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
