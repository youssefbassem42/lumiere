"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";

type FormState = {
  name: string;
  email: string;
  birthDate: string;
  gender: "MALE" | "FEMALE" | "";
  role: "USER" | "SELLER";
  shopName: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    birthDate: "",
    gender: "",
    role: "USER",
    shopName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!form.name || form.name.trim().length < 2)
      errs.name = "Name must be at least 2 characters";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";
    if (!form.birthDate) errs.birthDate = "Birth date is required";
    if (!form.gender) errs.gender = "Gender is required";
    if (form.role === "SELLER" && (!form.shopName || form.shopName.trim().length < 2))
      errs.shopName = "Shop name must be at least 2 characters";
    if (!form.password || form.password.length < 8)
      errs.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(form.password))
      errs.password = "Password must contain at least one uppercase letter";
    else if (!/[0-9]/.test(form.password))
      errs.password = "Password must contain at least one number";
    else if (!/[^A-Za-z0-9]/.test(form.password))
      errs.password = "Password must contain at least one special character";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          birthDate: form.birthDate,
          gender: form.gender,
          role: form.role,
          shopName: form.role === "SELLER" ? form.shopName : undefined,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      toast.success(data.message ?? "Account created! Please check your email.");
      setForm({ name: "", email: "", birthDate: "", gender: "", role: "USER", shopName: "", password: "", confirmPassword: "" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = [
    { label: "At least 8 characters", valid: form.password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(form.password) },
    { label: "One number", valid: /[0-9]/.test(form.password) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(form.password) },
  ];

  const fields: { key: keyof FormState; label: string; type: string; placeholder: string; autoComplete: string }[] = [
    { key: "name", label: "Full Name", type: "text", placeholder: "Jane Doe", autoComplete: "name" },
    { key: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
    { key: "password", label: "Password", type: "password", placeholder: "Min. 8 chars, 1 uppercase, 1 number", autoComplete: "new-password" },
    { key: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Repeat your password", autoComplete: "new-password" },
  ];

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, var(--color-brand-50) 0%, #fff 60%)" }}
    >
      <div className="w-full max-w-md">
        <div className="card p-8 animate-fade-up">
          <div className="text-center mb-8">
            <Link href="/" className="font-display text-3xl font-bold" style={{ color: "var(--color-brand-600)" }}>
              Lumière
            </Link>
            <h1 className="text-xl font-semibold mt-4 text-zinc-900">Create your account</h1>
            <p className="text-zinc-500 text-sm mt-1">Join thousands of happy customers</p>
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="btn btn-secondary w-full mb-4"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="h-px bg-zinc-200 flex-1" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">or</span>
            <span className="h-px bg-zinc-200 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Role Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-zinc-700 mb-4 text-center">I want to register as a:</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: "USER" }))}
                  className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${
                    form.role === "USER" 
                      ? "border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-100 ring-4 ring-blue-50/50" 
                      : "border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50 shadow-sm"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    form.role === "USER" 
                      ? "bg-blue-600 text-white scale-110 rotate-3" 
                      : "bg-zinc-100 text-zinc-400 group-hover:scale-105"
                  }`}>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className={`block text-sm font-bold ${form.role === "USER" ? "text-blue-700" : "text-zinc-600"}`}>Customer</span>
                    <span className="text-[10px] text-zinc-400 font-medium">Shop products</span>
                  </div>
                  {form.role === "USER" && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow-md">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: "SELLER" }))}
                  className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${
                    form.role === "SELLER" 
                      ? "border-purple-600 bg-purple-50/30 shadow-lg shadow-purple-100 ring-4 ring-purple-50/50" 
                      : "border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50 shadow-sm"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    form.role === "SELLER" 
                      ? "bg-purple-600 text-white scale-110 -rotate-3" 
                      : "bg-zinc-100 text-zinc-400 group-hover:scale-105"
                  }`}>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className={`block text-sm font-bold ${form.role === "SELLER" ? "text-purple-700" : "text-zinc-600"}`}>Seller</span>
                    <span className="text-[10px] text-zinc-400 font-medium">Sell products</span>
                  </div>
                  {form.role === "SELLER" && (
                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full p-1 shadow-md">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {form.role === "SELLER" && (
              <div className="animate-fade-in">
                <label htmlFor="register-shopName" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Shop Name *
                </label>
                <input
                  id="register-shopName"
                  name="shopName"
                  type="text"
                  required
                  value={form.shopName}
                  onChange={handleChange}
                  placeholder="Your brand name"
                  className={`input ${errors.shopName ? "input-error" : ""}`}
                />
                {errors.shopName && <p className="text-red-600 text-xs mt-1">{errors.shopName}</p>}
              </div>
            )}

            {fields.map((f) => (
              <div key={f.key}>
                <label htmlFor={`register-${f.key}`} className="block text-sm font-medium text-zinc-700 mb-1.5">
                  {f.label}
                </label>
                <div className="relative">
                  <input
                    id={`register-${f.key}`}
                    name={f.key}
                    type={f.type === "password" ? (showPassword ? "text" : "password") : f.type}
                    autoComplete={f.autoComplete}
                    required
                    value={form[f.key]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className={`input ${errors[f.key] ? "input-error" : ""} ${f.type === "password" ? "pr-10" : ""}`}
                  />
                  {f.type === "password" && f.key === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      aria-label="Toggle password"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                      </svg>
                    </button>
                  )}
                </div>
                {f.key === "password" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                    {passwordRules.map((rule) => (
                      <p
                        key={rule.label}
                        className={`text-xs flex items-center gap-1.5 ${rule.valid ? "text-green-700" : "text-zinc-400"}`}
                      >
                        <span aria-hidden="true">{rule.valid ? "✔" : "✖"}</span>
                        {rule.label}
                      </p>
                    ))}
                  </div>
                )}
                {errors[f.key] && (
                  <p className="text-red-600 text-xs mt-1">{errors[f.key]}</p>
                )}
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="register-birthDate" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Birth Date
                </label>
                <input
                  id="register-birthDate"
                  name="birthDate"
                  type="date"
                  required
                  value={form.birthDate}
                  onChange={handleChange}
                  className={`input ${errors.birthDate ? "input-error" : ""}`}
                />
                {errors.birthDate && <p className="text-red-600 text-xs mt-1">{errors.birthDate}</p>}
              </div>
              <div>
                <label htmlFor="register-gender" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Gender
                </label>
                <select
                  id="register-gender"
                  name="gender"
                  required
                  value={form.gender}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, gender: e.target.value as FormState["gender"] }));
                    setErrors((err) => ({ ...err, gender: undefined }));
                  }}
                  className={`input ${errors.gender ? "input-error" : ""}`}
                >
                  <option value="">Select</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
                {errors.gender && <p className="text-red-600 text-xs mt-1">{errors.gender}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
