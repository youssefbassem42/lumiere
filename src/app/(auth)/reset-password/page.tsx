"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rules = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One number", valid: /[0-9]/.test(password) },
    { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to reset password.");
        return;
      }
      setMessage(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!token && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">Missing reset token.</div>}
      {message && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{message}</div>}
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium text-zinc-700 mb-1.5">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
            {rules.map((rule) => (
              <p key={rule.label} className={`text-xs flex items-center gap-1.5 ${rule.valid ? "text-green-700" : "text-zinc-400"}`}>
                <span aria-hidden="true">{rule.valid ? "✔" : "✖"}</span>
                {rule.label}
              </p>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Confirm password
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
          />
        </div>
        <button type="submit" disabled={loading || !token} className="btn btn-primary w-full">
          {loading ? "Saving..." : "Reset password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, var(--color-brand-50) 0%, #fff 60%)" }}>
      <div className="w-full max-w-md">
        <div className="card p-8 animate-fade-up">
          <div className="text-center mb-8">
            <Link href="/" className="font-display text-3xl font-bold" style={{ color: "var(--color-brand-600)" }}>
              Lumière
            </Link>
            <h1 className="text-xl font-semibold mt-4 text-zinc-900">Choose a new password</h1>
            <p className="text-zinc-500 text-sm mt-1">Use a strong password to protect your account.</p>
          </div>
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
