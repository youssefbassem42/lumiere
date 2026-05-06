"use client";

import { Suspense, useEffect, useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import { SearchBar } from "@/components/ui/SearchBar";
import type { ProductListItem, PaginatedProducts, CategoryWithChildren } from "@/modules/products/product.types";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State from URL
  const search = searchParams.get("search") ?? "";
  const categorySlug = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? "1");
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  // Local UI state
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch categories once
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Fetch products on param change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categorySlug) params.set("categorySlug", categorySlug);
    if (sort) params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("page", String(page));
    params.set("limit", "12");

    fetch(`/api/products?${params}`)
      .then((r) => r.json() as Promise<PaginatedProducts>)
      .then((data) => {
        setProducts(data.data);
        setMeta(data.meta);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, categorySlug, sort, minPrice, maxPrice, page]);

  // URL update helper
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page"); // reset page on filter change
      setLoading(true);
      startTransition(() => router.push(`/products?${params.toString()}`));
    },
    [searchParams, router]
  );

  const clearFilters = useCallback(() => {
    setLoading(true);
    startTransition(() => router.push("/products"));
  }, [router]);

  const hasFilters = !!(search || categorySlug || minPrice || maxPrice || sort !== "newest");

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {search ? `Results for "${search}"` : categorySlug ? `Category: ${categorySlug}` : "All Products"}
          </h1>
          {!loading && (
            <p className="text-sm text-zinc-500 mt-0.5">
              {meta.total} product{meta.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="btn btn-secondary btn-sm lg:hidden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="input h-9 text-sm w-auto pr-8 cursor-pointer"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-5">
          {search && (
            <span className="badge badge-brand flex items-center gap-1.5">
              Search: {search}
              <button onClick={() => updateParam("search", "")} className="hover:opacity-70">×</button>
            </span>
          )}
          {categorySlug && (
            <span className="badge badge-brand flex items-center gap-1.5">
              Category: {categorySlug}
              <button onClick={() => updateParam("category", "")} className="hover:opacity-70">×</button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="badge badge-brand flex items-center gap-1.5">
              Price: ${minPrice || "0"} – ${maxPrice || "∞"}
              <button onClick={() => { updateParam("minPrice", ""); updateParam("maxPrice", ""); }} className="hover:opacity-70">×</button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-red-600 underline">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* ── Sidebar ── */}
        <aside className={`
          ${sidebarOpen ? "block" : "hidden"} lg:block
          w-full lg:w-60 shrink-0 space-y-6
          fixed lg:static inset-0 lg:inset-auto z-40 lg:z-auto
          bg-white lg:bg-transparent p-6 lg:p-0 overflow-y-auto
        `}>
          {/* Mobile sidebar close */}
          <div className="flex items-center justify-between lg:hidden mb-4">
            <h2 className="font-semibold text-zinc-900">Filters</h2>
            <button onClick={() => setSidebarOpen(false)} className="btn btn-ghost btn-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide">Search</h3>
            <SearchBar
              key={search}
              onSearch={(q) => updateParam("search", q)}
              defaultValue={search}
              placeholder="Search products…"
            />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide">Category</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => updateParam("category", "")}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${!categorySlug ? "bg-purple-50 text-purple-700 font-medium" : "text-zinc-600 hover:bg-zinc-50"}`}
                  >
                    All
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => updateParam("category", cat.slug)}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${categorySlug === cat.slug ? "bg-purple-50 text-purple-700 font-medium" : "text-zinc-600 hover:bg-zinc-50"}`}
                    >
                      {cat.name}
                    </button>
                    {cat.children?.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => updateParam("category", child.slug)}
                        className={`w-full text-left text-sm pl-5 pr-2 py-1 rounded-lg transition-colors mt-0.5 ${categorySlug === child.slug ? "bg-purple-50 text-purple-700 font-medium" : "text-zinc-500 hover:bg-zinc-50"}`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price range */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide">Price Range</h3>
            <div className="flex gap-2">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Min $</label>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => updateParam("minPrice", e.target.value)}
                  placeholder="0"
                  className="input text-sm h-8"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Max $</label>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => updateParam("maxPrice", e.target.value)}
                  placeholder="∞"
                  className="input text-sm h-8"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Product Grid ── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="w-16 h-16 text-zinc-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-zinc-700">No products found</h3>
              <p className="text-zinc-400 text-sm mt-1">Try adjusting your filters or search query.</p>
              <button onClick={clearFilters} className="btn btn-primary btn-sm mt-4">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                {products.map((p, i) => (
                  <div key={p.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam("page", String(page - 1))}
                    className="btn btn-secondary btn-sm disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateParam("page", String(pageNum))}
                        className={`btn btn-sm w-9 h-9 ${pageNum === page ? "btn-primary" : "btn-secondary"}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    disabled={page >= meta.totalPages}
                    onClick={() => updateParam("page", String(page + 1))}
                    className="btn btn-secondary btn-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-page py-8"><ProductGridSkeleton count={12} /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
