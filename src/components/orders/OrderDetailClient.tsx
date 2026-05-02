"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { OrderDetailDTO } from "@/modules/orders/order.types";

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load order");
        return response.json();
      })
      .then(setOrder)
      .catch((err) => setError(err.message));
  }, [orderId]);

  if (error) return <div className="container-page py-10 text-red-600">{error}</div>;
  if (!order) return <div className="container-page py-10"><div className="skeleton h-80 w-full" /></div>;

  return (
    <div className="container-page py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <Link href="/orders" className="text-sm text-blue-600 hover:text-blue-700">Back to orders</Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Order {order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <a href={`/api/orders/${order.id}/invoice`} className="btn btn-secondary">Download Invoice</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4">
              <Link href={`/products/${item.productSlug}`} className="relative h-24 w-20 shrink-0 rounded-xl overflow-hidden bg-slate-50">
                {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />}
              </Link>
              <div className="flex-1">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/products/${item.productSlug}`} className="font-semibold text-slate-900 hover:text-blue-600">{item.productName}</Link>
                    <p className="text-sm text-slate-500 mt-1">Qty {item.quantity} · ${item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold">${item.lineTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <span className="badge badge-brand">{order.status}</span>
            <p className="text-sm text-slate-500 mt-3">Payment: {order.payment?.status ?? "Unknown"} via {order.payment?.provider ?? "N/A"}</p>
          </section>
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            {order.shippingAddress && (
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-medium text-slate-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                <p>{order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.phone}</p>
              </div>
            )}
          </section>
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Totals</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>${order.taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>${order.shippingFee.toFixed(2)}</span></div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-semibold text-base"><span>Total</span><span>${order.totalAmount.toFixed(2)}</span></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
