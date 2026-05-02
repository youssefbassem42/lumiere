"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
    setServerError(null);
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!form.name || form.name.trim().length < 2)
      errs.name = "Name must be at least 2 characters";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";
    if (!form.password || form.password.length < 8)
      errs.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(form.password))
      errs.password = "Password must contain at least one uppercase letter";
    else if (!/[0-9]/.test(form.password))
      errs.password = "Password must contain at least one number";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto login after registration
      await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      router.push("/");
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

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

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                {errors[f.key] && (
                  <p className="text-red-600 text-xs mt-1">{errors[f.key]}</p>
                )}
              </div>
            ))}

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
