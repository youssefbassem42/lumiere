"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SellerNav() {
  const pathname = usePathname();

  const links = [
    { href: "/seller", label: "Dashboard", exact: true, icon: "dashboard" },
    { href: "/seller/products", label: "Products", icon: "inventory_2" },
    { href: "/seller/orders", label: "Orders", icon: "shopping_bag" },
    { href: "/seller/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <nav className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-0">
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {link.icon}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
