"use client";

import { useState } from "react";

type PaymentMethod = {
  id: string;
  type: "card" | "paypal";
  last4?: string;
  brand?: string;
  email?: string;
  isDefault: boolean;
};

const MOCK_METHODS: PaymentMethod[] = [
  { id: "1", type: "card", last4: "4242", brand: "Visa", isDefault: true },
  { id: "2", type: "paypal", email: "user@example.com", isDefault: false },
];

export default function PaymentMethodSection() {
  const [methods, setMethods] = useState<PaymentMethod[]>(MOCK_METHODS);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="md:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Payment Methods</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="text-blue-600 text-xs font-semibold uppercase tracking-wider hover:underline"
        >
          Add New
        </button>
      </div>

      {isAdding ? (
        <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-lg text-center">
          <p className="text-sm text-slate-600 mb-3">To add a new payment method, please complete a purchase. We securely save your cards during checkout via Stripe.</p>
          <button onClick={() => setIsAdding(false)} className="btn btn-secondary py-2 text-xs uppercase tracking-widest w-full">Back</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {methods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">
                  {method.type === "card" ? "credit_card" : "account_balance_wallet"}
                </span>
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    {method.type === "card" ? `${method.brand} Card` : "PayPal Account"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {method.type === "card" ? `•••• •••• •••• ${method.last4}` : method.email}
                  </p>
                </div>
              </div>
              {method.isDefault && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">DEFAULT</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
