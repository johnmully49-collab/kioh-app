"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn as signInWithCredentials } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { UserProfile, UserRole } from "@/server/types";
import { handleGoogleSignIn, sendPasswordResetLink } from "@/server/actions/authActions";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: UserProfile) => void;
  redirectTo?: string;
}

type ModalView = "signin" | "signup" | "forgot_password" | "verification_sent";

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  redirectTo = "/dashboard",
}: AuthModalProps) {
  const router = useRouter();
  const [view, setView] = useState<ModalView>("signin");
  const [role, setRole] = useState<UserRole>("participant");

  // Form Field States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI Feedback States
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetFormState = () => {
    setStatusMessage(null);
    setLoading(false);
  };

  const handleSwitchView = (newView: ModalView) => {
    resetFormState();
    setView(newView);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setLoading(true);

    try {
      if (view === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, password, role }),
        });
        const data = await res.json();

        if (data.success) {
          setView("verification_sent");
        } else {
          setStatusMessage({
            type: "error",
            text: data.message || "Registration failed. Please try again.",
          });
        }
      } else if (view === "signin") {
        const result = await signInWithCredentials("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
        if (!result || result.error) {
          setStatusMessage({
            type: "error",
            text: "The email or password is incorrect, or your email has not been verified.",
          });
          return;
        }

        const response = await fetch("/api/auth/profile");
        const profileResult = await response.json();
        if (!response.ok) {
          throw new Error(profileResult.message || "Failed to load your profile.");
        }
        const user = profileResult.user as UserProfile;
        onLoginSuccess?.(user);
        onClose();
        router.push(redirectTo);
      } else if (view === "forgot_password") {
        const res = await sendPasswordResetLink(email);

        if (res.success) {
          setStatusMessage({
            type: "success",
            text: res.message || "Password reset link sent! Please check your inbox.",
          });
        } else {
          setStatusMessage({
            type: "error",
            text: res.message || "Failed to send reset link. Please check the email.",
          });
        }
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "A network error occurred. Please check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  const startGoogleSignIn = async () => {
    setStatusMessage(null);
    setLoading(true);
    try {
      await handleGoogleSignIn(redirectTo);
    } catch (error) {
      console.error("[GOOGLE_SIGN_IN_ERROR]:", error);
      setStatusMessage({
        type: "error",
        text: "Google sign-in could not be started. Check your connection and try again.",
      });
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email.trim()) {
      setStatusMessage({
        type: "error",
        text: "Enter the email address you used to register.",
      });
      setView("signin");
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not resend verification email.");
      }
      setStatusMessage({
        type: "success",
        text: result.message,
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not resend verification email.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      role="presentation"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close sign-in dialog"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-slate-950/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="relative max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/15 bg-slate-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-8"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white sm:right-5 sm:top-5"
        >
          ✕
        </button>

        {/* Verification Sent Screen */}
        {view === "verification_sent" ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-400/30 bg-teal-400/10 text-teal-300 shadow-lg shadow-teal-500/10">
              <ShieldCheckIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 id="auth-dialog-title" className="mt-4 text-2xl font-bold text-white">
              Verify Your Email
            </h3>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              We have sent a verification link to{" "}
              <span className="font-semibold text-teal-300">{email}</span>. Please
              check your inbox to verify your account and access all KIOH features.
            </p>
            {statusMessage && (
              <p
                role="status"
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  statusMessage.type === "error"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-teal-500/30 bg-teal-500/10 text-teal-300"
                }`}
              >
                {statusMessage.text}
              </p>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => void resendVerificationEmail()}
              className="mt-4 min-h-11 w-full rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Resend verification email"}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchView("signin")}
              className="mt-6 w-full rounded-full bg-teal-400 py-3 text-xs font-bold text-slate-950 transition hover:bg-teal-300 shadow-lg shadow-teal-500/20"
            >
              Continue to Sign In →
            </button>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                KIOH Ecosystem
              </span>
              <h3 id="auth-dialog-title" className="mt-1 pr-10 text-2xl font-bold text-white sm:text-3xl">
                {view === "signin"
                  ? "Welcome Back"
                  : view === "signup"
                  ? "Join KIOH Network"
                  : "Reset Password"}
              </h3>
            </div>

            {/* Role Switcher (Sign Up Only) */}
            {view === "signup" && (
              <div className="mt-5">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Select Ecosystem Role
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    {
                      id: "participant",
                      label: "Participant",
                      desc: "Student & Builder",
                    },
                    {
                      id: "navigator",
                      label: "Navigator",
                      desc: "Guide & Mentor",
                    },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as UserRole)}
                      className={`min-h-[76px] rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                        role === r.id
                          ? "border-teal-400 bg-teal-400/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <p className="text-xs font-bold">{r.label}</p>
                      <p className="text-[10px] text-slate-400">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Social Google Provider */}
            {view !== "forgot_password" && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => void startGoogleSignIn()}
                  disabled={loading}
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                    />
                  </svg>
                  {loading ? "Connecting to Google..." : "Continue with Google"}
                </button>

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative bg-slate-900 px-3 text-[10px] uppercase font-mono tracking-widest text-slate-500">
                    or email
                  </span>
                </div>
              </div>
            )}

            {/* Status Alert */}
            {statusMessage && (
              <div
                className={`mb-3 rounded-xl border p-3 text-xs ${
                  statusMessage.type === "error"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-teal-500/30 bg-teal-500/10 text-teal-300"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            {/* Dynamic Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {view === "signup" && (
                <div>
                  <label htmlFor="auth-full-name" className="block text-xs font-semibold text-slate-300">
                    Full name
                  </label>
                  <input
                    id="auth-full-name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-300">
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                />
              </div>

              {view !== "forgot_password" && (
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    {view === "signin" && (
                      <button
                        type="button"
                        onClick={() => handleSwitchView("forgot_password")}
                        className="text-[11px] text-teal-300 hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <LockClosedIcon aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={view === "signup" ? "new-password" : "current-password"}
                      minLength={view === "signup" ? 8 : undefined}
                      required
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-12 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-teal-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:brightness-105 disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : view === "signin"
                  ? <>Sign in <ArrowRightIcon className="h-4 w-4" /></>
                  : view === "signup"
                  ? <>Create account <ArrowRightIcon className="h-4 w-4" /></>
                  : "Send Reset Link →"}
              </button>
            </form>

            {/* Switch Views Navigation */}
            <div className="mt-5 text-center text-xs text-slate-400">
              {view === "signin" ? (
                <p>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchView("signup")}
                    className="font-semibold text-teal-300 hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              ) : view === "signup" ? (
                <p>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchView("signin")}
                    className="font-semibold text-teal-300 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSwitchView("signin")}
                  className="font-semibold text-teal-300 hover:underline"
                >
                  ← Back to Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
