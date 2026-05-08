"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { SearchBar } from "@/components/ui/SearchBar";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const handleSearch = useCallback(
    (q: string) => {
      if (q.trim()) router.push(`/products?search=${encodeURIComponent(q.trim())}`);
    },
    [router]
  );

  const navLinks = [
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Collections", href: "/products?view=categories" },
    { label: "Brands", href: "/products" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 border-b border-slate-200/50 shadow-sm bg-white/60 backdrop-blur-xl">
      <div className="container-page">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tighter text-slate-900 uppercase"
          >
            LUMIÈRE
          </Link>

          {/* Nav links — desktop */}
          <ul className="hidden md:flex items-center space-x-8">
            {navLinks.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Search — grows */}
            <div className="hidden lg:block w-48">
              <SearchBar onSearch={handleSearch} placeholder="Search..." />
            </div>

            {/* Cart icon */}
            <Link
              href="/cart"
              className="text-blue-600 hover:opacity-80 transition-opacity p-2"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </Link>

            {status === "loading" ? (
              <div className="skeleton w-8 h-8 rounded-full" />
            ) : session ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="text-blue-600 hover:opacity-80 transition-opacity p-2"
                  aria-expanded={profileOpen}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-100 shadow-lg py-1 animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Signed In</p>
                      <p className="text-sm font-medium truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setProfileOpen(false)}>
                      My Profile
                    </Link>
                    {session.user?.role === "SELLER" && (
                      <Link href="/seller" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium text-blue-600" onClick={() => setProfileOpen(false)}>
                        Seller Dashboard
                      </Link>
                    )}
                    {session.user?.role === "ADMIN" && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium text-purple-600" onClick={() => setProfileOpen(false)}>
                        Admin Dashboard
                      </Link>
                    )}
                    <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setProfileOpen(false)}>
                      My Orders
                    </Link>
                    <div className="border-t border-slate-100 mt-1">
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setProfileOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-blue-600 hover:opacity-80 transition-opacity p-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="p-2 md:hidden text-slate-600"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile search */}
        <div className="lg:hidden pb-3 px-0">
          <SearchBar onSearch={handleSearch} placeholder="Search..." />
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 py-2 pb-4 animate-fade-in">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block px-2 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
