"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Unable to verify email.");
        setStatus("success");
        setMessage(data.message ?? "Email verified successfully.");
      })
      .catch((error: Error) => {
        setStatus("error");
        setMessage(error.message);
      });
  }, [token]);

  return (
    <div className={`p-4 rounded-lg border text-sm ${
      status === "success"
        ? "bg-green-50 border-green-200 text-green-700"
        : status === "error"
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-blue-50 border-blue-200 text-blue-700"
    }`}>
      {message}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, var(--color-brand-50) 0%, #fff 60%)" }}>
      <div className="w-full max-w-md">
        <div className="card p-8 animate-fade-up text-center">
          <Link href="/" className="font-display text-3xl font-bold" style={{ color: "var(--color-brand-600)" }}>
            Lumière
          </Link>
          <h1 className="text-xl font-semibold mt-4 mb-4 text-zinc-900">Email verification</h1>
          <Suspense fallback={<div className="p-4 rounded-lg bg-blue-50 text-blue-700 text-sm">Verifying your email...</div>}>
            <VerifyEmailStatus />
          </Suspense>
          <Link href="/login" className="btn btn-primary w-full mt-6">Continue to sign in</Link>
        </div>
      </div>
    </div>
  );
}
