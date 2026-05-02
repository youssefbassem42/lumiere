"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PaginatedOrdersDTO } from "@/modules/orders/order.types";

export function OrdersClient() {
  const [orders, setOrders] = useState<PaginatedOrdersDTO | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders?page=${page}&limit=10`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load orders");
        return response.json();
      })
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, [page]);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Order History</h1>
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!orders ? (
        <div className="skeleton h-64 w-full" />
      ) : orders.data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <h2 className="text-xl font-semibold">No orders yet</h2>
          <Link href="/products" className="btn btn-primary mt-6">Shop Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.data.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Order {order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge badge-brand">{order.status}</span>
                  <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
          <div className="flex items-center justify-between pt-4">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <span className="text-sm text-slate-500">Page {orders.meta.page} of {Math.max(orders.meta.totalPages, 1)}</span>
            <button className="btn btn-secondary" disabled={page >= orders.meta.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
