"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

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

type Provider = "stripe" | "paypal";

export function CheckoutClient() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const stripeElementsRef = useRef<unknown>(null);

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

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <Link href="/cart" className="text-sm text-blue-600 hover:text-blue-700">Back to cart</Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Checkout</h1>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <form onSubmit={startCheckout} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Shipping Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setProvider("stripe")} className={`btn ${provider === "stripe" ? "btn-primary" : "btn-secondary"}`}>Stripe</button>
              <button type="button" onClick={() => setProvider("paypal")} className={`btn ${provider === "paypal" ? "btn-primary" : "btn-secondary"}`}>PayPal</button>
            </div>
          </section>

          <button disabled={loading || Boolean(stripeClientSecret || paypalOrderId)} className="btn btn-primary w-full">
            {loading ? "Preparing payment..." : "Continue to Payment"}
          </button>
        </form>

        <aside className="bg-white rounded-2xl border border-slate-100 p-6 h-fit">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Payment</h2>
          {!stripeClientSecret && !paypalOrderId && (
            <p className="text-sm text-slate-500">Enter shipping details to create a secure payment session.</p>
          )}
          {stripeClientSecret && (
            <div>
              <div id="stripe-payment-element" className="mb-4" />
              <button onClick={confirmStripePayment} className="btn btn-primary w-full">Pay with Stripe</button>
            </div>
          )}
          {paypalOrderId && <div id="paypal-buttons" />}
        </aside>
      </div>
    </div>
  );
}
