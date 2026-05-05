"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to send reset email.");
        return;
      }
      setMessage(data.message);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, var(--color-brand-50) 0%, #fff 60%)" }}>
      <div className="w-full max-w-md">
        <div className="card p-8 animate-fade-up">
          <div className="text-center mb-8">
            <Link href="/" className="font-display text-3xl font-bold" style={{ color: "var(--color-brand-600)" }}>
              Lumière
            </Link>
            <h1 className="text-xl font-semibold mt-4 text-zinc-900">Reset your password</h1>
            <p className="text-zinc-500 text-sm mt-1">We will send a secure link valid for 15 minutes.</p>
          </div>

          {message && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{message}</div>}
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            <Link href="/login" className="text-purple-600 font-medium hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
