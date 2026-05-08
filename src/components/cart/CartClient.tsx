"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { CartDTO } from "@/modules/cart/cart.types";

const emptyCart: CartDTO = { id: "empty", items: [], subtotal: 0, itemCount: 0 };

export function CartClient() {
  const [cart, setCart] = useState<CartDTO>(emptyCart);
  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cart")
      .then((response) => response.json())
      .then(setCart)
      .catch(() => toast.error("Unable to load cart"))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const shipping = cart.subtotal >= 75 || cart.subtotal === 0 ? 0 : 8.99;
    const tax = Math.round(cart.subtotal * 0.08 * 100) / 100;
    return { shipping, tax, total: Math.round((cart.subtotal + shipping + tax) * 100) / 100 };
  }, [cart.subtotal]);

  async function updateQuantity(productId: string, quantity: number) {
    const previous = cart;
    setUpdatingProductId(productId);
    
    // Optimistic UI update
    setCart((current) => {
      const items = current.items
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity, lineTotal: item.product.price * quantity }
            : item
        )
        .filter((item) => item.quantity > 0);
      return {
        ...current,
        items,
        subtotal: Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    });

    const response = await fetch("/api/cart/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setCart(previous);
      toast.error(payload?.error ?? "Unable to update cart");
    } else {
      if (quantity === 0) {
        toast.success("Item removed from cart");
      }
      setCart(await response.json());
    }
    setUpdatingProductId(null);
  }

  if (loading) {
    return <div className="container-page py-10"><div className="skeleton h-80 w-full" /></div>;
  }

  return (
    <div className="container-page py-10">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-1">{cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}</p>
        </div>
        <Link href="/products" className="btn btn-secondary">Continue Shopping</Link>
      </div>

      {cart.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
          <p className="text-slate-500 mt-2">Browse products and add something you like.</p>
          <Link href="/products" className="btn btn-primary mt-6">Shop Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4">
                <Link href={`/products/${item.product.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                  {item.product.image ? (
                    <Image src={item.product.image.url} alt={item.product.image.alt ?? item.product.name} fill className="object-cover" />
                  ) : null}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link href={`/products/${item.product.slug}`} className="font-semibold text-slate-900 hover:text-blue-600">{item.product.name}</Link>
                      <p className="text-sm text-slate-500 mt-1">${item.product.price.toFixed(2)}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.product.stock} available</p>
                    </div>
                    <p className="font-semibold">${item.lineTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-5">
                    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                      <button className="px-3 py-2 text-slate-600 disabled:opacity-40" disabled={updatingProductId === item.productId} onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button className="px-3 py-2 text-slate-600 disabled:opacity-40" disabled={updatingProductId === item.productId || item.quantity >= item.product.stock} onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                    <button onClick={() => updateQuantity(item.productId, 0)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="bg-white rounded-2xl border border-slate-100 p-6 h-fit">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>${summary.tax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>{summary.shipping === 0 ? "Free" : `$${summary.shipping.toFixed(2)}`}</span></div>
              <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-semibold"><span>Total</span><span>${summary.total.toFixed(2)}</span></div>
            </div>
            <Link href="/checkout" className="btn btn-primary w-full mt-6">Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
