"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type FormState = { email: string; password: string; rememberMe: boolean };

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [e.target.name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
      rememberMe: String(form.rememberMe),
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "EMAIL_NOT_VERIFIED"
          ? "Please verify your email before signing in."
          : "Invalid email or password. Please try again."
      );
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, var(--color-brand-50) 0%, #fff 60%)" }}>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-8 animate-fade-up">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="font-display text-3xl font-bold" style={{ color: "var(--color-brand-600)" }}>
              Lumière
            </Link>
            <h1 className="text-xl font-semibold mt-4 text-zinc-900">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <Link href="/forgot-password" className="text-xs text-purple-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input
                name="rememberMe"
                type="checkbox"
                checked={form.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-purple-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
