"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string | null;
  isDefault: boolean;
};

export default function AddressSection({ initialAddresses }: { initialAddresses: Address[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    const url = editingAddress?.id ? `/api/user/addresses/${editingAddress.id}` : "/api/user/addresses";
    const method = editingAddress?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, isDefault: data.isDefault === "on" }),
    });

    if (res.ok) {
      const updated = await res.json();
      if (method === "POST") {
        setAddresses([updated, ...addresses]);
        toast.success("Address added successfully");
      } else {
        setAddresses(addresses.map(a => a.id === updated.id ? updated : a));
        toast.success("Address updated successfully");
      }
      setIsEditing(false);
      setEditingAddress(null);
      router.refresh();
    } else {
      toast.error("Failed to save address");
    }
    setLoading(false);
  }

  async function deleteAddress(id: string) {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success("Address deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete address");
    }
  }

  return (
    <div className="md:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Shipping Information</h2>
        {!isEditing && (
          <button 
            onClick={() => { setIsEditing(true); setEditingAddress(null); }}
            className="text-blue-600 text-xs font-semibold uppercase tracking-wider hover:underline"
          >
            Add New
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input name="fullName" defaultValue={editingAddress?.fullName} placeholder="Full Name" required className="input col-span-2 py-2 text-sm" />
            <input name="phone" defaultValue={editingAddress?.phone} placeholder="Phone" required className="input py-2 text-sm" />
            <input name="country" defaultValue={editingAddress?.country} placeholder="Country" required className="input py-2 text-sm" />
            <input name="city" defaultValue={editingAddress?.city} placeholder="City" required className="input py-2 text-sm" />
            <input name="postalCode" defaultValue={editingAddress?.postalCode || ""} placeholder="Postal Code" className="input py-2 text-sm" />
            <input name="street" defaultValue={editingAddress?.street} placeholder="Street" required className="input col-span-2 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input name="isDefault" type="checkbox" defaultChecked={editingAddress?.isDefault} />
            Set as default address
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-2 text-xs uppercase tracking-widest">
              {loading ? "Saving..." : "Save Address"}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary py-2 text-xs uppercase tracking-widest">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {addresses.length > 0 ? (
            addresses.map((addr) => (
              <div key={addr.id} className="p-3 border border-slate-100 rounded-lg group relative">
                {addr.isDefault && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">DEFAULT</span>
                )}
                <p className="text-sm text-slate-900 font-medium">{addr.fullName}</p>
                <p className="text-xs text-slate-500 mt-1">{addr.street}, {addr.city}, {addr.country}</p>
                <p className="text-xs text-slate-400">{addr.phone}</p>
                
                <div className="absolute top-3 right-3 hidden group-hover:flex gap-2">
                  <button onClick={() => { setEditingAddress(addr); setIsEditing(true); }} className="text-slate-400 hover:text-blue-600">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => deleteAddress(addr.id)} className="text-slate-400 hover:text-red-600">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No shipping addresses saved yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
