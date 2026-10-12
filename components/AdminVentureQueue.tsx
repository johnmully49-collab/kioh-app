"use client";

import { useEffect, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type {
  VentureDomain,
  VentureStage,
} from "@/server/types/venture";

interface PendingVenture {
  id: string;
  name: string;
  tagline: string;
  description: string;
  domain: VentureDomain;
  county: string;
  stage: VentureStage;
  websiteUrl: string | null;
  publicEmail: string;
  linkedinUrl: string | null;
  founderName: string;
  founderOrganization: string | null;
  createdAt: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export default function AdminVentureQueue() {
  const [ventures, setVentures] = useState<PendingVenture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadPendingVentures = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/admin/ventures");
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.data)) {
          throw new Error(result.message || "Could not load venture submissions.");
        }
        if (!cancelled) setVentures(result.data);
      } catch (error) {
        if (!cancelled) {
          console.error("[ADMIN_VENTURES_LOAD_ERROR]:", error);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load venture submissions."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadPendingVentures();
    return () => {
      cancelled = true;
    };
  }, [reloadVersion]);

  const review = async (
    venture: PendingVenture,
    decision: "approve" | "reject"
  ) => {
    const verb = decision === "approve" ? "Approve" : "Reject";
    if (!window.confirm(`${verb} ${venture.name}?`)) return;

    setSavingId(venture.id);
    setActionError("");
    try {
      const response = await fetch("/api/admin/ventures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: venture.id, decision }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not save this decision.");
      }
      setVentures((current) =>
        current.filter((entry) => entry.id !== venture.id)
      );
    } catch (error) {
      console.error("[ADMIN_VENTURE_REVIEW_ERROR]:", error);
      setActionError(
        error instanceof Error ? error.message : "Could not save this decision."
      );
    } finally {
      setSavingId("");
    }
  };

  return (
    <section aria-labelledby="venture-review-heading" className="mt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="venture-review-heading" className="text-xl font-bold text-white sm:text-2xl">
            Venture submissions
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Check each submission before it becomes visible in the public directory.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
          {ventures.length} awaiting review
        </span>
      </div>

      {loadError && (
        <div className="mb-5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
          <p role="alert">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadVersion((version) => version + 1)}
            className="mt-2 min-h-10 font-semibold underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="mb-5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
          {actionError}
        </p>
      )}
      {isLoading ? (
        <p role="status" className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center text-sm text-slate-300">
          Loading venture submissions…
        </p>
      ) : ventures.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 text-sm text-slate-300">
          No venture submissions are waiting for review.
        </p>
      ) : (
        <ul className="space-y-4">
          {ventures.map((venture) => (
            <li key={venture.id}>
              <article className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{venture.name}</h3>
                      <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold text-amber-100">
                        Under review
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-emerald-100">
                      {venture.tagline}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {venture.domain} · {venture.county} · {venture.stage} · {venture.founderName}
                      {venture.founderOrganization ? `, ${venture.founderOrganization}` : ""} · Submitted {formatDate(venture.createdAt)}
                    </p>
                    <p className="mt-4 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {venture.description}
                    </p>
                    <p className="mt-4 text-sm text-slate-300">
                      Public contact:{" "}
                      <a href={`mailto:${venture.publicEmail}`} className="font-semibold text-teal-200 underline underline-offset-4">
                        {venture.publicEmail}
                      </a>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {venture.linkedinUrl && (
                        <a
                          href={venture.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center gap-1 font-semibold text-teal-200 underline underline-offset-4"
                        >
                          Founder profile <ArrowTopRightOnSquareIcon aria-hidden="true" className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {venture.websiteUrl && (
                        <a
                          href={venture.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center gap-1 font-semibold text-teal-200 underline underline-offset-4"
                        >
                          Website <ArrowTopRightOnSquareIcon aria-hidden="true" className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-36 lg:flex-col">
                    <button
                      type="button"
                      disabled={Boolean(savingId)}
                      onClick={() => void review(venture, "approve")}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-50 lg:flex-none"
                    >
                      <CheckIcon aria-hidden="true" className="h-4 w-4" />
                      {savingId === venture.id ? "Saving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(savingId)}
                      onClick={() => void review(venture, "reject")}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-300/25 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-300/10 disabled:cursor-wait disabled:opacity-50 lg:flex-none"
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
      )}
    </section>
  );
}
