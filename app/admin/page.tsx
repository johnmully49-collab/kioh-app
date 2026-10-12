"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import BackgroundCanvas from "@/components/BackgroundCanvas";
import AdminApplicationsQueue from "@/components/AdminApplicationsQueue";
import EcosystemAnalytics from "@/components/EcosystemAnalytics";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollReveal from "@/components/ScrollReveal";

interface AdminSummary {
  generatedAt: string;
  members: number;
  activeOpportunities: number;
  applications: number;
  pendingMentorApplications: number;
  pendingPartnerInquiries: number;
  pendingVentures: number;
  pendingOpportunityApplications: number;
  totalPendingReviews: number;
}

const EMPTY_SUMMARY: AdminSummary = {
  generatedAt: "",
  members: 0,
  activeOpportunities: 0,
  applications: 0,
  pendingMentorApplications: 0,
  pendingPartnerInquiries: 0,
  pendingVentures: 0,
  pendingOpportunityApplications: 0,
  totalPendingReviews: 0,
};

function SummaryMetric({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof UsersIcon;
}) {
  return (
    <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-r sm:p-5 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-slate-300">{label}</p>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-200" />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function AdminAction({
  href,
  title,
  description,
  count,
  icon: Icon,
  accent = "teal",
}: {
  href: string;
  title: string;
  description: string;
  count?: number;
  icon: typeof ClipboardDocumentCheckIcon;
  accent?: "teal" | "amber" | "violet";
}) {
  const accentStyles = {
    teal: "text-teal-200 bg-teal-300/10",
    amber: "text-amber-100 bg-amber-300/10",
    violet: "text-violet-200 bg-violet-300/10",
  };

  return (
    <Link
      href={href}
      className="group flex min-h-36 items-start gap-4 rounded-2xl border border-white/10 bg-slate-900/65 p-5 transition hover:border-teal-200/25 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentStyles[accent]}`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white">{title}</span>
          {typeof count === "number" && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-200">
              {count}
            </span>
          )}
        </span>
        <span className="mt-2 block text-xs leading-relaxed text-slate-400">
          {description}
        </span>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-200">
          Open tool
          <ArrowRightIcon
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}

export default function AdminPortalPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/summary", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.data) {
        throw new Error(result.message || "Could not load the admin overview.");
      }
      setSummary(result.data as AdminSummary);
    } catch (loadError) {
      console.error("[ADMIN_OVERVIEW_LOAD_ERROR]:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load the admin overview."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadSummary(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadSummary]);

  const currentSummary = summary ?? EMPTY_SUMMARY;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white selection:bg-teal-500/30">
      <BackgroundCanvas />
      <Header
        currentUser={null}
        onLoginSuccess={() => undefined}
        onLogout={() => undefined}
        onOpenProfile={() => router.push("/dashboard")}
      />

      <ScrollReveal>
        <section className="relative px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">
                  KIOH operations
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Admin portal
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                  Review submissions, manage live opportunities, and monitor
                  verified ecosystem activity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadSummary()}
                disabled={isLoading}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 disabled:cursor-wait disabled:opacity-50"
              >
                <ArrowPathIcon
                  aria-hidden="true"
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh overview
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3"
              >
                <p className="text-xs text-rose-100">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadSummary()}
                  disabled={isLoading}
                  className="min-h-10 rounded-lg px-3 text-xs font-semibold text-rose-100 hover:bg-rose-200/10 disabled:opacity-50"
                >
                  Try again
                </button>
              </div>
            )}

            <section
              aria-label="Platform overview"
              className="mt-7 grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-900/70 p-2 sm:grid-cols-3 sm:p-4 lg:grid-cols-5"
            >
              {isLoading && !summary ? (
                Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className="m-2 h-24 animate-pulse rounded-xl bg-slate-800"
                  />
                ))
              ) : (
                <>
                  <SummaryMetric
                    label="Registered members"
                    value={currentSummary.members}
                    helper="All KIOH accounts"
                    icon={UsersIcon}
                  />
                  <SummaryMetric
                    label="Active opportunities"
                    value={currentSummary.activeOpportunities}
                    helper="Not past deadline"
                    icon={BriefcaseIcon}
                  />
                  <SummaryMetric
                    label="Opportunity applications"
                    value={currentSummary.applications}
                    helper="Submitted through KIOH"
                    icon={ClipboardDocumentCheckIcon}
                  />
                  <SummaryMetric
                    label="Pending reviews"
                    value={currentSummary.totalPendingReviews}
                    helper="Applications, Navigator, partner, venture"
                    icon={BuildingOffice2Icon}
                  />
                  <SummaryMetric
                    label="Pending ventures"
                    value={currentSummary.pendingVentures}
                    helper="Awaiting admin decision"
                    icon={UserGroupIcon}
                  />
                </>
              )}
            </section>

            <section className="mt-9" aria-labelledby="admin-work-heading">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="admin-work-heading"
                    className="text-lg font-semibold text-white"
                  >
                    Admin workspaces
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Shortcuts to the existing review and publishing workflows.
                  </p>
                </div>
                {summary?.generatedAt && (
                  <p className="text-[11px] text-slate-400">
                    Updated{" "}
                    {new Date(summary.generatedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <AdminAction
                  href="#opportunity-applications"
                  title="Application reviews"
                  description="Review funding and scholarship applications, shortlist, and record decisions."
                  count={currentSummary.pendingOpportunityApplications}
                  icon={ClipboardDocumentCheckIcon}
                  accent="amber"
                />
                <AdminAction
                  href="/admin/opportunities?panel=verification"
                  title="Verification queue"
                  description="Review Navigator applications and partner organization requests."
                  count={
                    currentSummary.pendingMentorApplications +
                    currentSummary.pendingPartnerInquiries
                  }
                  icon={ClipboardDocumentCheckIcon}
                  accent="amber"
                />
                <AdminAction
                  href="/admin/opportunities?panel=ventures"
                  title="Venture submissions"
                  description="Review founder submissions before they are shown publicly."
                  count={currentSummary.pendingVentures}
                  icon={BuildingOffice2Icon}
                  accent="violet"
                />
                <AdminAction
                  href="/admin/opportunities?panel=opportunities"
                  title="Opportunity manager"
                  description="Create, edit, and remove grants, scholarships, and other listings."
                  count={currentSummary.activeOpportunities}
                  icon={BriefcaseIcon}
                />
                <Link
                  href="/dashboard?tab=analytics"
                  className="group flex min-h-36 items-start gap-4 rounded-2xl border border-white/10 bg-slate-900/65 p-5 transition hover:border-teal-200/25 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-300/10 text-teal-200">
                    <ChartBarIcon
                      aria-hidden="true"
                      className="h-5 w-5"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">
                      Ecosystem analytics
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-slate-400">
                      Explore county reach, sectors, funding listings, and
                      engagement trends.
                    </span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-200">
                      Open analytics
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </span>
                </Link>
              </div>
            </section>

            <AdminApplicationsQueue onUpdated={() => void loadSummary()} />

            <section className="mt-10" aria-label="Ecosystem analytics">
              <EcosystemAnalytics />
            </section>
          </div>
        </section>
      </ScrollReveal>
      <Footer />
    </main>
  );
}
