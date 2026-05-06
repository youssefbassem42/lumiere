import Link from "next/link";
import { productService } from "@/modules/products/product.service";
import { ProductCard } from "@/components/product/ProductCard";
import Image from "next/image";

export default async function HomePage() {
  const featured = await productService.getFeaturedProducts(4).catch(() => []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center bg-slate-100 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Background - Minimalist Interior"
            fill
            className="object-cover object-center opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-white/20"></div>
        </div>
        
        <div className="relative z-10 container-page flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 max-w-3xl drop-shadow-sm tracking-tight animate-fade-up">
            Elevate Your Everyday Surroundings
          </h1>
          <p className="text-lg md:text-xl text-slate-800 max-w-2xl mb-10 animate-fade-up delay-100 font-medium">
            Discover a curated collection of premium objects designed for intentional living. Uncompromising quality meets timeless minimalism.
          </p>
          <Link href="/products" className="btn btn-primary rounded-full px-8 py-3 animate-fade-up delay-200 uppercase tracking-widest text-xs font-semibold">
            Shop The Collection
          </Link>
        </div>
      </section>

      {/* ── Curated Categories (Bento) ── */}
      <section className="py-24 container-page">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Curated Categories</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[800px] md:h-[500px]">
          {/* Large Feature */}
          <Link href="/products?category=electronics" className="md:col-span-8 group relative rounded-2xl overflow-hidden bg-slate-100 flex items-end">
            <Image 
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200"
              alt="Electronics"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
            <div className="relative z-10 p-12 w-full">
              <span className="text-2xl font-semibold text-white block mb-2">Electronics</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-200 opacity-80 group-hover:opacity-100 transition-opacity">Explore Category →</span>
            </div>
          </Link>

          {/* Stacked Features */}
          <div className="md:col-span-4 flex flex-col gap-6 h-full">
            <Link href="/products?category=home" className="flex-1 group relative rounded-2xl overflow-hidden bg-slate-100 flex items-end">
              <Image 
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800"
                alt="Home"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>
              <div className="relative z-10 p-8 w-full">
                <span className="text-xl font-semibold text-white block">Home</span>
              </div>
            </Link>
            
            <Link href="/products?category=lifestyle" className="flex-1 group relative rounded-2xl overflow-hidden bg-slate-100 flex items-end">
              <Image 
                src="https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800"
                alt="Lifestyle"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>
              <div className="relative z-10 p-8 w-full">
                <span className="text-xl font-semibold text-white block">Lifestyle</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trending Products ── */}
      {featured.length > 0 && (
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="container-page">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Trending Now</h2>
              <Link href="/products" className="text-xs font-semibold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                View All <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featured.map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
