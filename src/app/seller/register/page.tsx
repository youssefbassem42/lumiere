"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function SellerRegisterPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    description: "",
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-12 h-12 rounded-full animate-spin border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    router.push("/login?callbackUrl=/seller/register");
    return null;
  }

  if (session.user?.role === "SELLER") {
    router.push("/seller");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      toast.success("Welcome to the Seller Community!");
      // Force session update to reflect new role
      await update();
      
      router.push("/seller");
      router.refresh();
    } catch (err) {
      toast.error("Failed to register. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 bg-slate-50">
      <div className="container-page max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="bg-blue-600 px-8 py-12 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">Become a Seller</h1>
              <p className="text-blue-100">Open your shop and start selling to thousands of customers</p>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-6">

            <div>
              <label htmlFor="shopName" className="block text-sm font-semibold text-slate-700 mb-2">
                Shop Name
              </label>
              <input
                id="shopName"
                type="text"
                required
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="input h-12"
                placeholder="e.g. My Awesome Shop"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input py-3 min-h-[120px]"
                placeholder="Tell us about your shop and what you sell..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-12 text-base shadow-lg shadow-blue-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registering...
                  </div>
                ) : (
                  "Create Seller Profile"
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              By registering, you agree to our <Link href="/terms" className="underline hover:text-slate-600">Seller Terms of Service</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
