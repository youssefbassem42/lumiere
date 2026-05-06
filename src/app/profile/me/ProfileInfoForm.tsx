"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProfileUser = {
  name: string | null;
  email: string;
  phone: string | null;
  password: string | null;
  addresses?: Array<{ isDefault: boolean; phone: string }>;
};

export default function ProfileInfoForm({
  user,
  mode = "profile",
}: {
  user: ProfileUser;
  mode?: "profile" | "password";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  if (mode === "password") {
    return (
      <form 
        className="flex flex-col gap-4 mt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setMessage("");
          const formData = new FormData(e.currentTarget);
          const data = Object.fromEntries(formData);
          
          const res = await fetch("/api/user/password", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
          
          const result = await res.json();
          setLoading(false);
          
          if (res.ok) {
            setMessage("Password updated successfully");
            (e.target as HTMLFormElement).reset();
          } else {
            setMessage(result.error || "Failed to update password");
          }
        }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Password</label>
          <input name="currentPassword" required className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" type="password" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Password</label>
          <input name="newPassword" required className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" type="password" />
        </div>
        
        {message && <div className="text-sm text-blue-600">{message}</div>}
        
        <Link href="/reset-password" className="text-sm text-blue-600 hover:underline mt-2">
          Forgot password?
        </Link>
        
        <button disabled={loading} className="mt-2 w-full bg-blue-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50" type="submit">
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    );
  }

  const defaultAddress = user.addresses?.find((a) => a.isDefault);
  const defaultPhone = user.phone || defaultAddress?.phone || "";

  return (
    <form 
      className="flex flex-col gap-4 mt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData);
        
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        
        const result = await res.json();
        setLoading(false);
        
        if (res.ok) {
          setMessage("Profile updated successfully");
          router.refresh();
        } else {
          setMessage(result.error || "Failed to update profile");
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</label>
        <input name="name" defaultValue={user.name || ""} className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" type="text" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
        <input name="email" defaultValue={user.email} className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" type="email" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone Number</label>
        <input name="phone" defaultValue={defaultPhone} className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" type="tel" />
      </div>

      {message && <div className="text-sm text-blue-600">{message}</div>}

      <button disabled={loading} className="mt-2 w-full bg-blue-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50" type="submit">
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
