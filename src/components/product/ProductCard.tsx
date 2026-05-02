"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductListItem } from "@/modules/products/product.types";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
      aria-label={product.name}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden mb-4 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Favorite Button (Hidden until hover) */}
        <button 
          className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-600 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-10"
          onClick={(e) => { e.preventDefault(); /* Add to wishlist logic */ }}
          aria-label="Add to wishlist"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {discount && (
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-widest text-slate-900 uppercase">
              SALE
            </span>
          )}
          {product.isFeatured && !discount && (
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-widest text-slate-900 uppercase">
              NEW
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1 px-1">
        <div className="flex justify-between items-start">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {product.category.name}
          </p>
          
          {/* Minimal Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center text-yellow-400 gap-1">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-medium text-slate-600">{product.avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-base text-slate-900 font-medium truncate group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-2">
          <span className="text-base text-slate-600">
            ${product.price.toFixed(2)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-slate-400 line-through">
              ${product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
