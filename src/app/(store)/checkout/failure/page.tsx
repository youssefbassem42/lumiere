import Link from "next/link";

export const metadata = { title: "Checkout Failed" };

export default function CheckoutFailurePage() {
  return (
    <div className="container-page py-16">
      <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center max-w-2xl mx-auto">
        <span className="badge badge-error">Payment Failed</span>
        <h1 className="text-3xl font-bold text-slate-900 mt-4">Payment could not be completed</h1>
        <p className="text-slate-500 mt-3">No order is marked paid until the payment provider confirms it.</p>
        <div className="flex justify-center gap-3 mt-8">
          <Link href="/checkout" className="btn btn-primary">Try Again</Link>
          <Link href="/cart" className="btn btn-secondary">Return to Cart</Link>
        </div>
      </div>
    </div>
  );
}
