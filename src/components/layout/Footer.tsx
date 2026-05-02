import Link from "next/link";

const footerLinks = {
  Shop: [
    { label: "Sustainability", href: "#" },
    { label: "Shipping & Returns", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  Support: [
    { label: "FAQ", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50 mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-6 lg:px-12 py-24 max-w-7xl mx-auto">
        <div className="md:col-span-1 flex flex-col h-full">
          <div className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tighter">
            LUMIÈRE
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-auto">
            © {new Date().getFullYear()} Lumière Collective. All rights reserved.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          {footerLinks.Shop.map((l) => (
            <Link key={l.label} href={l.href} className="text-xs uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors font-semibold">
              {l.label}
            </Link>
          ))}
        </div>
        
        <div className="flex flex-col gap-4">
          {footerLinks.Legal.map((l) => (
            <Link key={l.label} href={l.href} className="text-xs uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors font-semibold">
              {l.label}
            </Link>
          ))}
        </div>
        
        <div className="flex flex-col gap-4">
          {footerLinks.Support.map((l) => (
            <Link key={l.label} href={l.href} className="text-xs uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors font-semibold">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
