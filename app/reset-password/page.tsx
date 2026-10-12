"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const invalidResetLink = !token || !email;
  const displayStatusMessage = invalidResetLink
    ? {
        type: "error" as const,
        text: "Invalid or expired password reset link. Please request a new one.",
      }
    : statusMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (password.length < 8) {
      setStatusMessage({
        type: "error",
        text: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: "success",
          text: "Your password has been reset successfully! Redirecting to login...",
        });
        setTimeout(() => {
          router.push("/?signin=true");
        }, 2500);
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "Failed to reset password.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: "A network error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-2xl">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 font-bold text-slate-950 shadow-lg shadow-teal-500/20">
          K
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">Set New Password</h2>
        <p className="mt-1 text-xs text-slate-400">
          {email ? (
            <>
              Updating credentials for{" "}
              <span className="font-semibold text-teal-300">{email}</span>
            </>
          ) : (
            "Enter your new password below"
          )}
        </p>
      </div>

      {displayStatusMessage && (
        <div
          className={`mt-6 rounded-2xl border p-4 text-xs ${
            displayStatusMessage.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-teal-500/30 bg-teal-500/10 text-teal-300"
          }`}
        >
          {displayStatusMessage.text}
        </div>
      )}

      {!invalidResetLink && token && email ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white placeholder-slate-500 transition focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white placeholder-slate-500 transition focus:border-teal-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:brightness-105 disabled:opacity-50"
          >
            {loading ? "Updating Password..." : "Update Password →"}
          </button>
        </form>
      ) : (
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-block rounded-full bg-teal-400/10 border border-teal-400/30 px-6 py-2.5 text-xs font-semibold text-teal-300 hover:bg-teal-400/20"
          >
            Return to Homepage
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <Suspense
        fallback={
          <div className="text-xs text-slate-400">Loading reset form...</div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}