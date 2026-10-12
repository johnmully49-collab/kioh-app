"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type ApplicationStatus = "Under Review" | "Shortlisted";
type ApplicationDecision = "shortlist" | "accept" | "reject";
type QueueFilter = "Active" | ApplicationStatus;

interface ReviewApplication {
  id: string;
  applicant: {
    name: string;
    email: string;
    county: string;
    organization: string;
  };
  opportunity: {
    title: string;
    organization: string;
    county: string;
    category: string;
    grantAmountLabel: string;
  };
  appliedAt: string;
  status: ApplicationStatus;
  documents: {
    key: string;
    name: string;
    category: "pitchDeck" | "certificate";
  }[];
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(date);
}

export default function AdminApplicationsQueue({
  onUpdated,
}: {
  onUpdated?: () => void;
}) {
  const [applications, setApplications] = useState<ReviewApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("Active");
  const [query, setQuery] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin/applications", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.data)) {
        throw new Error(
          result.message || "Could not load opportunity applications."
        );
      }
      setApplications(result.data as ReviewApplication[]);
    } catch (error) {
      console.error("[ADMIN_APPLICATIONS_LOAD_ERROR]:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not load opportunity applications."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadApplications(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadApplications, reloadVersion]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      if (filter !== "Active" && application.status !== filter) return false;
      if (!normalizedQuery) return true;
      return [
        application.applicant.name,
        application.applicant.email,
        application.applicant.county,
        application.opportunity.title,
        application.opportunity.organization,
        application.opportunity.county,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [applications, filter, query]);

  const reviewApplication = async (
    application: ReviewApplication,
    decision: ApplicationDecision
  ) => {
    const actionLabel =
      decision === "shortlist"
        ? "Shortlist"
        : decision === "accept"
          ? "Accept"
          : "Reject";
    if (
      decision !== "shortlist" &&
      !window.confirm(
        `${actionLabel} ${application.applicant.name}'s application for ${application.opportunity.title}? This will finalize the review.`
      )
    ) {
      return;
    }

    setSavingId(application.id);
    setActionError("");
    setActionMessage("");
    try {
      const response = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: application.id, decision }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not save the review decision.");
      }

      const nextStatus = result.data.status as
        | "Shortlisted"
        | "Accepted"
        | "Rejected";
      if (nextStatus === "Shortlisted") {
        setApplications((current) =>
          current.map((entry) =>
            entry.id === application.id
              ? { ...entry, status: "Shortlisted" }
              : entry
          )
        );
      } else {
        setApplications((current) =>
          current.filter((entry) => entry.id !== application.id)
        );
      }
      setActionMessage(
        `${actionLabel} decision saved for ${application.applicant.name}.`
      );
      onUpdated?.();
    } catch (error) {
      console.error("[ADMIN_APPLICATION_DECISION_ERROR]:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not save the review decision."
      );
    } finally {
      setSavingId("");
    }
  };

  const underReviewCount = applications.filter(
    ({ status }) => status === "Under Review"
  ).length;
  const shortlistedCount = applications.filter(
    ({ status }) => status === "Shortlisted"
  ).length;

  return (
    <section
      id="opportunity-applications"
      className="mt-10"
      aria-labelledby="admin-opportunity-applications-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="admin-opportunity-applications-heading"
            className="text-xl font-bold text-white sm:text-2xl"
          >
            Opportunity application reviews
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
            Review applicants, shortlist promising submissions, and record
            final decisions. Updates appear on each applicant&apos;s dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadVersion((version) => version + 1)}
          disabled={isLoading}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 disabled:cursor-wait disabled:opacity-50"
        >
          <ArrowPathIcon
            aria-hidden="true"
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh queue
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter application reviews"
        >
          {(
            [
              ["Active", `All active (${applications.length})`],
              ["Under Review", `Under review (${underReviewCount})`],
              ["Shortlisted", `Shortlisted (${shortlistedCount})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-10 rounded-xl px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 ${
                filter === value
                  ? "bg-teal-300/15 text-teal-100"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search applications</span>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applicant or opportunity"
            className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 pl-9 pr-3 text-xs text-white placeholder:text-slate-400 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-300/20"
          />
        </label>
      </div>

      {actionMessage && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-3 text-xs text-emerald-100"
        >
          {actionMessage}
        </p>
      )}
      {actionError && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3"
        >
          <p className="text-xs text-rose-100">{actionError}</p>
          <button
            type="button"
            onClick={() => setReloadVersion((version) => version + 1)}
            className="min-h-10 rounded-lg px-3 text-xs font-semibold text-rose-100 hover:bg-rose-200/10"
          >
            Reload queue
          </button>
        </div>
      )}
      {loadError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] p-4"
        >
          <p className="text-xs text-rose-100">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadVersion((version) => version + 1)}
            className="mt-2 min-h-10 rounded-lg px-3 text-xs font-semibold text-rose-100 hover:bg-rose-200/10"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && applications.length === 0 ? (
        <div role="status" className="mt-5 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-white/10 bg-slate-900/60"
            />
          ))}
          <span className="sr-only">Loading applications awaiting review</span>
        </div>
      ) : filteredApplications.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {filteredApplications.map((application) => (
            <li key={application.id}>
              <article className="rounded-2xl border border-white/10 bg-slate-900/65 p-4 sm:p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {application.applicant.name}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          application.status === "Under Review"
                            ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
                            : "border-violet-300/25 bg-violet-300/10 text-violet-100"
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">
                      {application.applicant.email}
                      {application.applicant.organization
                        ? ` · ${application.applicant.organization}`
                        : ""}
                      {` · ${application.applicant.county}`}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Opportunity
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {application.opportunity.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-300">
                          {application.opportunity.organization} ·{" "}
                          {application.opportunity.category} ·{" "}
                          {application.opportunity.county}
                        </p>
                        <p className="mt-1 text-xs font-medium text-teal-100">
                          Listed value:{" "}
                          {application.opportunity.grantAmountLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Application details
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-300">
                          <ClockIcon aria-hidden="true" className="h-3.5 w-3.5" />
                          Submitted {formatDate(application.appliedAt)}
                        </p>
                        {application.documents.length > 0 ? (
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {application.documents.map((document) => (
                              <li key={document.key}>
                                <a
                                  href={`/api/admin/applications/files?applicationId=${encodeURIComponent(application.id)}&key=${encodeURIComponent(document.key)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-10 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-teal-100 underline underline-offset-2 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
                                >
                                  {document.name}
                                  <span className="sr-only">
                                    {" "}
                                    (
                                    {document.category === "pitchDeck"
                                      ? "pitch deck"
                                      : "certificate"}
                                    )
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">
                            No supporting files submitted.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:w-44 xl:shrink-0 xl:flex-col">
                    {application.status === "Under Review" && (
                      <button
                        type="button"
                        disabled={Boolean(savingId)}
                        onClick={() =>
                          void reviewApplication(application, "shortlist")
                        }
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-violet-300/25 px-3 text-xs font-semibold text-violet-100 transition hover:bg-violet-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200 disabled:cursor-wait disabled:opacity-50 xl:flex-none"
                      >
                        {savingId === application.id ? (
                          <ArrowPathIcon
                            aria-hidden="true"
                            className="h-4 w-4 animate-spin"
                          />
                        ) : (
                          <ClockIcon aria-hidden="true" className="h-4 w-4" />
                        )}
                        Shortlist
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={Boolean(savingId)}
                      onClick={() =>
                        void reviewApplication(application, "accept")
                      }
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-3 text-xs font-bold text-emerald-950 transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-100 disabled:cursor-wait disabled:opacity-50 xl:flex-none"
                    >
                      <CheckIcon aria-hidden="true" className="h-4 w-4" />
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(savingId)}
                      onClick={() =>
                        void reviewApplication(application, "reject")
                      }
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-300/25 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200 disabled:cursor-wait disabled:opacity-50 xl:flex-none"
                    >
                      <XMarkIcon aria-hidden="true" className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-900/30 px-5 py-10 text-center">
          <h3 className="text-sm font-semibold text-white">
            {applications.length === 0
              ? "No opportunity applications need review"
              : "No applications match these filters"}
          </h3>
          <p className="mt-2 text-xs text-slate-300">
            {applications.length === 0
              ? "New submissions will appear here until they are shortlisted or receive a final decision."
              : "Change the status filter or search for a different applicant or opportunity."}
          </p>
          {applications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("Active");
              }}
              className="mt-3 min-h-10 rounded-lg px-3 text-xs font-semibold text-teal-100 hover:bg-white/5"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
