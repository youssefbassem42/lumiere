import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { productService } from "@/modules/products/product.service";
import { reviewService } from "@/modules/reviews/review.service";
import { StarRating } from "@/components/ui/StarRating";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { ReviewSection } from "@/components/product/ReviewSection";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { title: product.name, images: product.images[0]?.url ? [product.images[0].url] : [] },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);
  if (!product) notFound();
  const session = await getServerSession(authOptions);
  const [canReview, reviews] = await Promise.all([
    reviewService.canReview(session?.user?.id, product.id),
    reviewService.listForProduct(product.id, { sort: "newest", page: 1, limit: 10 }),
  ]);

  const isInStock = product.stock > 0;
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <div className="container-page py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-zinc-900 transition-colors">Products</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-zinc-900 transition-colors">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-zinc-900 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">
        {/* ── Images ── */}
        <div className="space-y-4">
          {product.images.length > 0 ? (
            <>
              <div className="relative aspect-square bg-zinc-50 rounded-2xl overflow-hidden">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt ?? product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                {discount && (
                  <span className="absolute top-4 left-4 badge badge-brand text-sm px-3 py-1.5">
                    -{discount}%
                  </span>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(1, 5).map((img) => (
                    <div key={img.id} className="aspect-square relative bg-zinc-50 rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-purple-400 transition-all">
                      <Image src={img.url} alt={img.alt ?? product.name} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-300">
              <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/products?category=${product.category.slug}`}
              className="badge badge-brand text-xs"
            >
              {product.category.name}
            </Link>
            {product.isFeatured && <span className="badge badge-success text-xs">Featured</span>}
          </div>

          <h1 className="text-3xl font-bold text-zinc-900 leading-tight mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.avgRating} size="md" />
              <span className="text-sm font-medium">{product.avgRating}</span>
              <span className="text-zinc-400 text-sm">({product.reviewCount} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-zinc-900">
              ${product.price.toFixed(2)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xl text-zinc-400 line-through">
                ${product.comparePrice.toFixed(2)}
              </span>
            )}
            {discount && (
              <span className="text-green-600 font-semibold text-sm">
                Save {discount}%
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-zinc-600 leading-relaxed text-sm mb-6">
            {product.description}
          </p>

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-zinc-400 mb-4">SKU: {product.sku}</p>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-6">
            <span className={`w-2 h-2 rounded-full ${isInStock ? "bg-green-500" : "bg-red-500"}`} />
            <span className={`text-sm font-medium ${isInStock ? "text-green-700" : "text-red-700"}`}>
              {isInStock
                ? product.stock <= 5
                  ? `Only ${product.stock} left in stock`
                  : "In Stock"
                : "Out of Stock"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <AddToCartButton productId={product.id} disabled={!isInStock} />
            <WishlistButton 
              productId={product.id} 
              initialInWishlist={false} // Will be updated by client side fetch
              className="btn btn-secondary btn-lg flex items-center justify-center gap-2"
            />
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-zinc-100">
            {[
              { icon: "🚚", label: "Free Shipping", sub: "On orders over $75" },
              { icon: "🔒", label: "Secure", sub: "SSL protected" },
              { icon: "↩️", label: "Returns", sub: "30-day policy" },
            ].map((b) => (
              <div key={b.label} className="text-center">
                <span className="text-xl">{b.icon}</span>
                <p className="text-xs font-semibold text-zinc-700 mt-1">{b.label}</p>
                <p className="text-xs text-zinc-400">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ReviewSection productId={product.id} canReview={canReview} initialReviews={reviews} />
    </div>
  );
}
