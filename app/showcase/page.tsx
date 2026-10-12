"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import BackgroundCanvas from "@/components/BackgroundCanvas";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollReveal from "@/components/ScrollReveal";
import { KENYA_COUNTIES } from "@/server/data/opportunities";
import type { UserProfile } from "@/server/types";
import {
  VENTURE_DOMAINS,
  VENTURE_STAGES,
  type Venture,
  type VentureDomain,
  type VentureStage,
  type VentureReviewStatus,
} from "@/server/types/venture";

interface OwnVenture {
  id: string;
  name: string;
  domain: VentureDomain;
  county: string;
  reviewStatus: VentureReviewStatus;
  createdAt: string;
}

const statusStyles: Record<VentureReviewStatus, string> = {
  "Under Review":
    "border-amber-300/25 bg-amber-300/10 text-amber-100",
  Approved: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  Rejected: "border-rose-300/25 bg-rose-300/10 text-rose-100",
};

const initialForm = {
  name: "",
  tagline: "",
  description: "",
  domain: VENTURE_DOMAINS[0] as VentureDomain,
  county: "Nairobi",
  stage: VENTURE_STAGES[0] as VentureStage,
  websiteUrl: "",
  publicEmail: "",
  linkedinUrl: "",
  publicContactConsent: false,
};

export default function ShowcasePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [myVentures, setMyVentures] = useState<OwnVenture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [selectedDomain, setSelectedDomain] = useState("All domains");
  const [reloadKey, setReloadKey] = useState(0);

  const sessionUser: UserProfile | null =
    sessionStatus === "authenticated" && session?.user
      ? {
          id: session.user.id,
          fullName: session.user.name || "KIOH Member",
          email: session.user.email || "",
          avatar: session.user.image || "",
          role: session.user.role,
          navigatorVerified: session.user.navigatorVerified,
          isEmailVerified: true,
          bio: session.user.bio || "",
          location: session.user.location || "",
          organization: session.user.organization || "",
          createdAt: new Date(),
        }
      : null;
  const activeUser = currentUser ?? sessionUser;

  const loadData = useCallback(async (signal: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (selectedCounty !== "All Counties") params.set("county", selectedCounty);
      if (selectedDomain !== "All domains") params.set("domain", selectedDomain);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const response = await fetch(`/api/ventures?${params.toString()}`, {
        signal,
      });
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.data)) {
        throw new Error(result.message || "Could not load ventures.");
      }
      if (signal.aborted) return;
      setVentures(result.data);

      if (sessionStatus === "authenticated") {
        const mineResponse = await fetch("/api/ventures/mine", { signal });
        const mineResult = await mineResponse.json();
        if (!mineResponse.ok || !Array.isArray(mineResult.data)) {
          throw new Error(mineResult.message || "Could not load your submissions.");
        }
        if (signal.aborted) return;
        setMyVentures(mineResult.data);
      } else {
        setMyVentures([]);
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error("[SHOWCASE_LOAD_ERROR]:", error);
        setLoadError(
          error instanceof Error ? error.message : "Could not load ventures."
        );
      }
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [searchQuery, selectedCounty, selectedDomain, sessionStatus]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadData(controller.signal);
    }, searchQuery ? 200 : 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadData, reloadKey]);

  const visibleVentures = useMemo(() => ventures, [ventures]);

  const submitVenture = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/ventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not submit your venture.");
      }
      setFormData(initialForm);
      setIsFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("[SHOWCASE_SUBMIT_ERROR]:", error);
      setFormError(
        error instanceof Error ? error.message : "Could not submit your venture."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white selection:bg-teal-500/30">
      <BackgroundCanvas />
      <Header
        currentUser={activeUser}
        onLoginSuccess={setCurrentUser}
        onLogout={() => setCurrentUser(null)}
        onOpenProfile={() => window.location.assign("/dashboard")}
        authOpen={isAuthOpen}
        onAuthOpenChange={setIsAuthOpen}
      />

      <ScrollReveal>
        <section className="relative px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Ideas growing into ventures.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Meet the young teams building solutions across Kenya. Explore by county or domain, then connect directly with founders.
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  Every listing is reviewed before it appears here. Contact details are published only with the founder’s consent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!activeUser) {
                    setIsAuthOpen(true);
                    return;
                  }
                  setIsFormOpen((open) => !open);
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/25 transition hover:bg-emerald-200"
              >
                <PlusIcon aria-hidden="true" className="h-5 w-5" />
                {isFormOpen ? "Close form" : "List your venture"}
              </button>
            </div>

            {isFormOpen && (
              <section
                aria-labelledby="venture-form-heading"
                className="mt-8 rounded-3xl border border-emerald-200/20 bg-slate-900/80 p-5 shadow-xl sm:p-8"
              >
                <h2 id="venture-form-heading" className="text-xl font-semibold text-white">
                  Tell the ecosystem what you’re building
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Submissions are reviewed by KIOH before publishing. The email and LinkedIn profile you provide below will be visible to anyone viewing an approved listing.
                </p>
                {formError && (
                  <p role="alert" className="mt-4 rounded-xl border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-100">
                    {formError}
                  </p>
                )}
                <form onSubmit={submitVenture} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-200">Venture name</span>
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                      placeholder="e.g. Mavuno Labs"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-200">Short introduction</span>
                    <input
                      required
                      minLength={10}
                      maxLength={180}
                      value={formData.tagline}
                      onChange={(event) => setFormData({ ...formData, tagline: event.target.value })}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                      placeholder="What problem do you solve?"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-200">What you’re building</span>
                    <textarea
                      required
                      minLength={30}
                      maxLength={2500}
                      rows={4}
                      value={formData.description}
                      onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                      className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm leading-6 text-white focus:border-emerald-300 focus:outline-none"
                      placeholder="Describe the solution, who it serves, and what progress you’ve made."
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-200">Domain</span>
                    <select
                      value={formData.domain}
                      onChange={(event) => setFormData({ ...formData, domain: event.target.value as VentureDomain })}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                    >
                      {VENTURE_DOMAINS.map((domain) => (
                        <option key={domain} value={domain}>{domain}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-200">County</span>
                    <select
                      value={formData.county}
                      onChange={(event) => setFormData({ ...formData, county: event.target.value })}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                    >
                      {KENYA_COUNTIES.filter((county) => county !== "All Counties" && county !== "Nationwide").map((county) => (
                        <option key={county} value={county}>{county}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-200">Current stage</span>
                    <select
                      value={formData.stage}
                      onChange={(event) => setFormData({ ...formData, stage: event.target.value as VentureStage })}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                    >
                      {VENTURE_STAGES.map((stage) => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-200">Website (optional)</span>
                    <input
                      type="url"
                      value={formData.websiteUrl}
                      onChange={(event) => setFormData({ ...formData, websiteUrl: event.target.value })}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                      placeholder="https://"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-200">Public contact email</span>
                    <input
                      type="email"
                      required
                      maxLength={254}
                      value={formData.publicEmail}
                      onChange={(event) => setFormData({ ...formData, publicEmail: event.target.value })}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                      placeholder="team@venture.org"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-200">Founder LinkedIn or professional profile</span>
                    <input
                      type="url"
                      required
                      value={formData.linkedinUrl}
                      onChange={(event) => setFormData({ ...formData, linkedinUrl: event.target.value })}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200/15 bg-emerald-200/[0.04] p-4 sm:col-span-2">
                    <input
                      type="checkbox"
                      required
                      checked={formData.publicContactConsent}
                      onChange={(event) => setFormData({ ...formData, publicContactConsent: event.target.checked })}
                      className="mt-0.5 h-4 w-4 accent-emerald-300"
                    />
                    <span className="text-sm leading-6 text-slate-200">
                      I agree that the contact email and profile link above can be shown publicly on my approved venture listing.
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-12 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-50 sm:col-span-2"
                  >
                    {isSubmitting ? "Submitting for review…" : "Submit venture for review"}
                  </button>
                </form>
              </section>
            )}

            {myVentures.length > 0 && (
              <section aria-labelledby="my-ventures-heading" className="mt-10">
                <h2 id="my-ventures-heading" className="text-lg font-semibold text-white">
                  Your submissions
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {myVentures.map((venture) => (
                    <li key={venture.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{venture.name}</p>
                          <p className="mt-1 text-xs text-slate-300">{venture.domain} · {venture.county}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyles[venture.reviewStatus]}`}>
                          {venture.reviewStatus}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-12 border-y border-white/10 py-6">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-300">Search ventures</span>
                  <span className="relative mt-1.5 block">
                    <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Venture, solution, or founder organization"
                      className="min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-300 focus:outline-none"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-300">County</span>
                  <select
                    value={selectedCounty}
                    onChange={(event) => setSelectedCounty(event.target.value)}
                    className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                  >
                    <option>All Counties</option>
                    {KENYA_COUNTIES.filter((county) => county !== "All Counties" && county !== "Nationwide").map((county) => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-300">Domain</span>
                  <select
                    value={selectedDomain}
                    onChange={(event) => setSelectedDomain(event.target.value)}
                    className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
                  >
                    <option>All domains</option>
                    {VENTURE_DOMAINS.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                {visibleVentures.length} {visibleVentures.length === 1 ? "venture" : "ventures"} shown · Only approved listings appear publicly
              </p>
            </div>

            {loadError && (
              <div role="alert" className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/10 p-4 text-sm text-rose-100">
                <p>{loadError}</p>
                <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-2 min-h-10 font-semibold underline underline-offset-4">
                  Try again
                </button>
              </div>
            )}
            {isLoading ? (
              <p role="status" className="mt-8 rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center text-sm text-slate-300">
                Loading ventures…
              </p>
            ) : visibleVentures.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-slate-900/35 px-6 py-14 text-center">
                <BuildingOffice2Icon aria-hidden="true" className="mx-auto h-8 w-8 text-emerald-200" />
                <h2 className="mt-4 text-lg font-semibold text-white">No ventures match those filters yet</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-300">
                  Try another county or domain. If you’re building something, share it with the ecosystem.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCounty("All Counties");
                    setSelectedDomain("All domains");
                    setSearchQuery("");
                  }}
                  className="mt-4 min-h-11 rounded-lg px-3 text-sm font-semibold text-emerald-200 underline underline-offset-4"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleVentures.map((venture) => (
                  <li key={venture.id}>
                    <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-900/65 p-5 shadow-lg shadow-black/10 transition-colors hover:border-emerald-200/25 sm:p-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-200/20 bg-emerald-200/[0.06] px-3 py-1 text-xs font-semibold text-emerald-100">
                          {venture.domain}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                          {venture.stage}
                        </span>
                      </div>
                      <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
                        {venture.name}
                      </h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-emerald-100">
                        {venture.tagline}
                      </p>
                      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">
                        {venture.description}
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-slate-300">
                        <span>{venture.county} County</span>
                        <span>{venture.founderOrganization || `By ${venture.founderName}`}</span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <a
                          href={`mailto:${venture.publicEmail}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-300 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-200"
                        >
                          Contact the team
                        </a>
                        <a
                          href={venture.linkedinUrl || `mailto:${venture.publicEmail}`}
                          target={venture.linkedinUrl ? "_blank" : undefined}
                          rel={venture.linkedinUrl ? "noreferrer" : undefined}
                          aria-label={venture.linkedinUrl ? `Open ${venture.founderName}'s professional profile` : undefined}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.06]"
                        >
                          Founder profile
                          <ArrowTopRightOnSquareIcon aria-hidden="true" className="h-3.5 w-3.5" />
                        </a>
                        {venture.websiteUrl && (
                          <a
                            href={venture.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.06]"
                          >
                            Website
                            <ArrowTopRightOnSquareIcon aria-hidden="true" className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </ScrollReveal>
      <Footer />
    </main>
  );
}
