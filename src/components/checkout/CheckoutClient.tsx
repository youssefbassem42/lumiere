"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useMemo } from "react";
import type { CartDTO } from "@/modules/cart/cart.types";

declare global {
  interface Window {
    Stripe?: (key: string) => {
      elements: (options: { clientSecret: string }) => {
        create: (type: "payment") => { mount: (selector: string) => void };
      };
      confirmPayment: (options: {
        elements: unknown;
        confirmParams: { return_url: string };
      }) => Promise<{ error?: { message?: string } }>;
    };
    paypal?: {
      Buttons: (options: {
        createOrder: () => string;
        onApprove: (_data: unknown, actions: { order: { capture: () => Promise<unknown> } }) => Promise<void>;
        onError: (error: unknown) => void;
      }) => { render: (selector: string) => void };
    };
  }
}

type Provider = "stripe" | "paypal" | "cod";

export function CheckoutClient() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [promoCode, setPromoCode] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const stripeElementsRef = useRef<unknown>(null);

  useEffect(() => {
    fetch("/api/cart")
      .then((response) => response.json())
      .then(setCart)
      .catch(() => setError("Unable to load cart"));
  }, []);

  const summary = useMemo(() => {
    if (!cart) return { shipping: 0, tax: 0, total: 0, subtotal: 0, discount: 0 };
    const shipping = cart.subtotal >= 75 || cart.subtotal === 0 ? 0 : 8.99;
    const discount = (cart.subtotal * discountPercent) / 100;
    const discountedSubtotal = cart.subtotal - discount;
    const tax = Math.round(discountedSubtotal * 0.08 * 100) / 100;
    return {
      subtotal: cart.subtotal,
      discount,
      shipping,
      tax,
      total: Math.round((discountedSubtotal + shipping + tax) * 100) / 100,
    };
  }, [cart, discountPercent]);

  // Mock promo validation for UI (backend validates properly)
  async function applyPromo() {
    if (!promoCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid promo code");
      
      // Handle different discount types
      if (data.discountType === "PERCENTAGE") {
        setDiscountPercent(data.discountValue);
      } else {
        // For fixed discounts, we'll need to calculate the percentage equivalent 
        // or update the summary logic. For now, let's support percentage in the state.
        const percent = Math.min(100, (data.discountValue / (cart?.subtotal || 1)) * 100);
        setDiscountPercent(percent);
      }
      setMessage("Promo code applied!");
    } catch (err: any) {
      setError(err.message);
      setDiscountPercent(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!stripeClientSecret || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) return;

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => {
      const stripe = window.Stripe?.(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) return;
      const elements = stripe.elements({ clientSecret: stripeClientSecret });
      stripeElementsRef.current = { stripe, elements };
      elements.create("payment").mount("#stripe-payment-element");
    };
    document.head.appendChild(script);
  }, [stripeClientSecret]);

  useEffect(() => {
    if (!paypalOrderId || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) return;

    const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk]");
    const renderButtons = () => {
      window.paypal?.Buttons({
        createOrder: () => paypalOrderId,
        onApprove: async (_data, actions) => {
          await actions.order.capture();
          router.push(`/checkout/success?orderId=${orderId}`);
        },
        onError: () => setError("PayPal payment failed. Please try again."),
      }).render("#paypal-buttons");
    };

    if (existing) {
      renderButtons();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = renderButtons;
    document.head.appendChild(script);
  }, [orderId, paypalOrderId, router]);

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStripeClientSecret(null);
    setPaypalOrderId(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        promoCode: promoCode || undefined,
        guestEmail: form.get("guestEmail"),
        shippingAddress: {
          fullName: form.get("fullName"),
          phone: form.get("phone"),
          country: form.get("country"),
          city: form.get("city"),
          street: form.get("street"),
          postalCode: form.get("postalCode"),
        },
      }),
    });

    const payload = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(payload?.error ?? "Checkout failed");
      return;
    }

    setOrderId(payload.orderId);
    if (provider === "cod") {
      router.push(`/checkout/success?orderId=${payload.orderId}&provider=cod`);
      return;
    }
    if (provider === "stripe") setStripeClientSecret(payload.stripe.clientSecret);
    if (provider === "paypal") setPaypalOrderId(payload.paypal.orderId);
  }

  async function confirmStripePayment() {
    const refs = stripeElementsRef.current as
      | { stripe: NonNullable<Window["Stripe"]> extends (...args: never[]) => infer T ? T : never; elements: unknown }
      | null;

    if (!refs) {
      setError("Stripe payment form is still loading.");
      return;
    }

    const result = await refs.stripe.confirmPayment({
      elements: refs.elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/success?orderId=${orderId}` },
    });

    if (result.error) setError(result.error.message ?? "Stripe payment failed");
  }

  async function updateQuantity(productId: string, quantity: number) {
    if (!cart) return;
    const previous = cart;
    setError(null);
    setCart((current) => {
      if (!current) return current;
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
      setError(payload?.error ?? "Unable to update cart");
    } else {
      setCart(await response.json());
    }
  }

  if (!cart) return <div className="container-page py-10"><div className="skeleton h-80 w-full" /></div>;

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <Link href="/cart" className="text-sm text-blue-600 hover:text-blue-700">Back to cart</Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Checkout</h1>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <form onSubmit={startCheckout} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 h-fit">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact & Shipping</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input name="guestEmail" type="email" className="input sm:col-span-2" placeholder="Email (required for guest checkout)" />
              <input name="fullName" className="input" placeholder="Full name" required />
              <input name="phone" className="input" placeholder="Phone" required />
              <input name="country" className="input" placeholder="Country" required />
              <input name="city" className="input" placeholder="City" required />
              <input name="street" className="input sm:col-span-2" placeholder="Street address" required />
              <input name="postalCode" className="input" placeholder="Postal code" />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h2>
            <div className="grid grid-cols-3 gap-3">
              <button type="button" onClick={() => setProvider("stripe")} className={`btn ${provider === "stripe" ? "btn-primary" : "btn-secondary"}`}>Stripe</button>
              <button type="button" onClick={() => setProvider("paypal")} className={`btn ${provider === "paypal" ? "btn-primary" : "btn-secondary"}`}>PayPal</button>
              <button type="button" onClick={() => setProvider("cod")} className={`btn ${provider === "cod" ? "btn-primary" : "btn-secondary"}`}>Cash</button>
            </div>
          </section>

          <button disabled={loading || Boolean(stripeClientSecret || paypalOrderId) || cart.items.length === 0} className="btn btn-primary w-full">
            {loading ? "Preparing payment..." : "Continue to Payment"}
          </button>
        </form>

        <aside className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 border-b border-slate-50 pb-3 last:border-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-800 line-clamp-1">{item.product.name}</span>
                    <span className="font-medium text-slate-900">${item.lineTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-md border border-slate-200">
                      <button type="button" className="px-2 py-0.5 text-slate-600 hover:bg-slate-50" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                      <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                      <button type="button" className="px-2 py-0.5 text-slate-600 hover:bg-slate-50" disabled={item.quantity >= item.product.stock} onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              <input 
                value={promoCode} 
                onChange={e => setPromoCode(e.target.value)} 
                className="input flex-1 py-2 text-sm" 
                placeholder="Promo Code (Try LUMIERE10)" 
              />
              <button type="button" onClick={applyPromo} className="btn btn-secondary py-2 text-sm">Apply</button>
            </div>

            <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>${summary.subtotal.toFixed(2)}</span></div>
              {summary.discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({discountPercent}%)</span><span>-${summary.discount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>${summary.tax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>{summary.shipping === 0 ? "Free" : `$${summary.shipping.toFixed(2)}`}</span></div>
              <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>${summary.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {(stripeClientSecret || paypalOrderId) && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Complete Payment</h2>
              {stripeClientSecret && (
                <div>
                  <div id="stripe-payment-element" className="mb-4" />
                  <button onClick={confirmStripePayment} className="btn btn-primary w-full">Pay with Stripe</button>
                </div>
              )}
              {paypalOrderId && <div id="paypal-buttons" />}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
