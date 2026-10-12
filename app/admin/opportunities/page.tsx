"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundCanvas from "@/components/BackgroundCanvas";
import ScrollReveal from "@/components/ScrollReveal";
import AdminVerificationQueue from "@/components/AdminVerificationQueue";
import AdminVentureQueue from "@/components/AdminVentureQueue";
import { Opportunity, OpportunityCategory } from "@/server/types/opportunity";
import type { UserProfile } from "@/server/types";
import { KENYA_COUNTIES } from "@/server/data/opportunities";

const CATEGORIES: OpportunityCategory[] = [
  "Grants & Funding",
  "Incubators & Accelerators",
  "Hackathons & Challenges",
  "Fellowships & Training",
  "Scholarships",
];

function getValueFieldLabel(category: OpportunityCategory) {
  switch (category) {
    case "Scholarships":
      return "Award value (KES)";
    case "Incubators & Accelerators":
      return "Program value (KES)";
    case "Hackathons & Challenges":
      return "Prize value (KES)";
    case "Fellowships & Training":
      return "Stipend or training value (KES)";
    default:
      return "Funding amount (KES)";
  }
}

function getValueLabelPlaceholder(category: OpportunityCategory) {
  switch (category) {
    case "Scholarships":
      return "e.g. Full tuition or KSh 250,000";
    case "Incubators & Accelerators":
      return "e.g. Mentorship + KSh 500,000 in-kind support";
    case "Hackathons & Challenges":
      return "e.g. KSh 100,000 first prize";
    case "Fellowships & Training":
      return "e.g. KSh 40,000 monthly stipend";
    default:
      return "e.g. KSh 1,000,000";
  }
}

export default function AdminOpportunitiesPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePanel, setActivePanel] = useState<
    "opportunities" | "verification" | "ventures"
  >("opportunities");

  // Local State for Admin Managed Opportunities
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Modal & Edit States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  // Form Field States
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState<OpportunityCategory>("Grants & Funding");
  const [county, setCounty] = useState("Nairobi");
  const [grantAmount, setGrantAmount] = useState<number>(0);
  const [grantAmountLabel, setGrantAmountLabel] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [description, setDescription] = useState("");
  const [eligibilityInput, setEligibilityInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModalOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isModalOpen]);

  useEffect(() => {
    const requestedPanel = new URLSearchParams(window.location.search).get(
      "panel"
    );
    if (
      requestedPanel === "opportunities" ||
      requestedPanel === "verification" ||
      requestedPanel === "ventures"
    ) {
      const timeout = window.setTimeout(
        () => setActivePanel(requestedPanel),
        0
      );
      return () => window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOpportunities = async () => {
      try {
        const response = await fetch("/api/opportunities");
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Failed to load opportunities.");
        }
        if (!cancelled) setOpportunities(result.data);
      } catch (error) {
        if (!cancelled) {
          console.error("[ADMIN_OPPORTUNITIES_LOAD_ERROR]:", error);
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load opportunities."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadOpportunities();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered List
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesCategory =
        selectedCategory === "All" || opp.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesCategory && matchesSearch;
    });
  }, [opportunities, selectedCategory, searchQuery]);

  // Open Modal for Create or Edit
  const handleOpenModal = (oppToEdit?: Opportunity) => {
    if (oppToEdit) {
      setEditingOpp(oppToEdit);
      setTitle(oppToEdit.title);
      setOrganization(oppToEdit.organization);
      setCategory(oppToEdit.category);
      setCounty(oppToEdit.county);
      setGrantAmount(oppToEdit.grantAmount);
      setGrantAmountLabel(oppToEdit.grantAmountLabel);
      setDeadline(oppToEdit.deadline);
      setApplicationUrl(oppToEdit.applicationUrl ?? "");
      setDescription(oppToEdit.description);
      setEligibilityInput(oppToEdit.eligibility.join(", "));
      setTagsInput(oppToEdit.tags.join(", "));
    } else {
      setEditingOpp(null);
      setTitle("");
      setOrganization("");
      setCategory("Grants & Funding");
      setCounty("Nairobi");
      setGrantAmount(0);
      setGrantAmountLabel("");
      setDeadline("");
      setApplicationUrl("");
      setDescription("");
      setEligibilityInput("");
      setTagsInput("");
    }
    setIsModalOpen(true);
  };

  // Save or Update Handler
  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const eligibilityArray = eligibilityInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const tagsArray = tagsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      ...(editingOpp ? { id: editingOpp.id } : {}),
      title,
      organization,
      category,
      county,
      grantAmount,
      grantAmountLabel,
      deadline,
      applicationUrl: applicationUrl.trim(),
      description,
      eligibility: eligibilityArray,
      tags: tagsArray,
      featured: true,
    };

    try {
      const response = await fetch("/api/opportunities", {
        method: editingOpp ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to save opportunity.");
      }

      const savedOpportunity = result.data as Opportunity;
      setOpportunities((prev) =>
        editingOpp
          ? prev.map((opportunity) =>
              opportunity.id === savedOpportunity.id
                ? savedOpportunity
                : opportunity
            )
          : [savedOpportunity, ...prev]
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("[ADMIN_OPPORTUNITY_SAVE_ERROR]:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save opportunity."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this opportunity?")) {
      setErrorMessage("");
      try {
        const response = await fetch(
          `/api/opportunities?id=${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Failed to delete opportunity.");
        }
        setOpportunities((prev) => prev.filter((opportunity) => opportunity.id !== id));
      } catch (error) {
        console.error("[ADMIN_OPPORTUNITY_DELETE_ERROR]:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to delete opportunity."
        );
      }
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white selection:bg-teal-500/30">
      <BackgroundCanvas />
      <Header
        currentUser={currentUser}
        onLoginSuccess={setCurrentUser}
        onLogout={() => setCurrentUser(null)}
        onOpenProfile={() => router.push("/dashboard")}
      />

      <ScrollReveal>
      <section className="relative px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {errorMessage && (
            <p className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-300">
              {errorMessage}
            </p>
          )}
          {/* Top Admin Banner */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="inline-block rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-300">
                KIOH Portal Management
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                KIOH Admin Panel
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Manage opportunities and review trust applications.
              </p>
            </div>

            {activePanel === "opportunities" && (
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="min-h-12 rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:brightness-105"
              >
                + Post New Opportunity
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Admin tools"
            className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3"
          >
            {(
              [
                ["opportunities", "Opportunities"],
                ["verification", "Verification queue"],
                ["ventures", "Venture submissions"],
              ] as const
            ).map(([panel, label]) => (
              <button
                key={panel}
                id={`admin-tab-${panel}`}
                type="button"
                role="tab"
                aria-selected={activePanel === panel}
                aria-controls={`admin-panel-${panel}`}
                onClick={() => setActivePanel(panel)}
                className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activePanel === panel
                    ? "bg-teal-300 text-slate-950"
                    : "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activePanel === "verification" ? (
            <div
              id="admin-panel-verification"
              role="tabpanel"
              aria-labelledby="admin-tab-verification"
            >
              <AdminVerificationQueue />
            </div>
          ) : activePanel === "ventures" ? (
            <div
              id="admin-panel-ventures"
              role="tabpanel"
              aria-labelledby="admin-tab-ventures"
            >
              <AdminVentureQueue />
            </div>
          ) : (
            <div
              id="admin-panel-opportunities"
              role="tabpanel"
              aria-labelledby="admin-tab-opportunities"
            >
          <section
            className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5"
            aria-label="Opportunity listings by type"
          >
            {[
              ["Published listings", opportunities.length],
              [
                "Scholarships",
                opportunities.filter((item) => item.category === "Scholarships")
                  .length,
              ],
              [
                "Grants & funding",
                opportunities.filter(
                  (item) => item.category === "Grants & Funding"
                ).length,
              ],
              [
                "Other programs",
                opportunities.filter(
                  (item) =>
                    item.category !== "Scholarships" &&
                    item.category !== "Grants & Funding"
                ).length,
              ],
              ["Counties reached", new Set(opportunities.map((o) => o.county)).size],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-900/80 p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {value}
                </p>
              </div>
            ))}
          </section>

          {/* Search & Filter Bar */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl">
            <input
              type="text"
              placeholder="Search title, organization, county, or tag"
              aria-label="Search opportunities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
            />

              <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible">
              {["All", ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-11 shrink-0 snap-start rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-teal-400 text-slate-950"
                      : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat} (
                  {cat === "All"
                    ? opportunities.length
                    : opportunities.filter((opp) => opp.category === cat)
                        .length}
                  )
                </button>
              ))}
              </div>
          </div>

          {/* Opportunities Table */}
          <div className="mt-8 overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead className="border-b border-white/10 bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="p-4">Opportunity</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">County</th>
                  <th className="p-4">Award / support</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Application link</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading opportunities…
                    </td>
                  </tr>
                ) : filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <p className="text-sm font-semibold text-white">
                        {opportunities.length === 0
                          ? "No opportunities have been published yet"
                          : "No opportunities match these filters"}
                      </p>
                      <p className="mt-2 text-xs text-slate-300">
                        {opportunities.length === 0
                          ? "Add scholarships, grants, fellowships, accelerators, or challenges with the post button above."
                          : "Try a different category or search term."}
                      </p>
                      {opportunities.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory("All");
                            setSearchQuery("");
                          }}
                          className="mt-3 min-h-10 rounded-lg px-3 text-xs font-semibold text-teal-100 hover:bg-white/5"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <p className="font-bold text-white">{opp.title}</p>
                      <p className="text-[11px] text-slate-400">{opp.organization}</p>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-100">
                        {opp.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-mono">📍 {opp.county}</td>
                    <td className="p-4 font-semibold text-teal-100">
                      {opp.grantAmountLabel}
                    </td>
                    <td className="p-4 text-slate-300 tabular-nums">{opp.deadline}</td>
                    <td className="p-4">
                      {opp.applicationUrl ? (
                        <a
                          href={opp.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-200 underline underline-offset-2 hover:text-white"
                        >
                          Open official link ↗
                        </a>
                      ) : (
                        <span className="text-slate-400">Not added</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(opp)}
                        className="min-h-11 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(opp.id)}
                        className="min-h-11 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </div>
          )}
        </div>
      </section>
      </ScrollReveal>

      {/* Post/Edit Opportunity Modal */}
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          role="presentation"
        >
          <button
            type="button"
            aria-label="Close opportunity editor"
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 cursor-default bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="opportunity-editor-title"
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/15 bg-slate-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-white sm:right-5 sm:top-5"
            >
              ✕
            </button>

            <h3 id="opportunity-editor-title" className="pr-12 text-xl font-bold text-white">
              {editingOpp ? "Edit Opportunity" : "Post New Opportunity"}
            </h3>

            <form onSubmit={handleSaveOpportunity} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Opportunity Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase">
                    Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase">
                    County / Region
                  </label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                  >
                    {KENYA_COUNTIES.filter((c) => c !== "All Counties").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="opportunity-amount"
                    className="block text-[11px] font-bold text-slate-300 uppercase"
                  >
                    {getValueFieldLabel(category)}
                  </label>
                  <input
                    id="opportunity-amount"
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={grantAmount}
                    onChange={(e) =>
                      setGrantAmount(
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="opportunity-value-label"
                  className="block text-[11px] font-bold text-slate-300 uppercase"
                >
                  Award / support description
                </label>
                <input
                  id="opportunity-value-label"
                  type="text"
                  required
                  maxLength={120}
                  placeholder={getValueLabelPlaceholder(category)}
                  value={grantAmountLabel}
                  onChange={(e) => setGrantAmountLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-300 focus:border-teal-400 focus:outline-none"
                />
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  For non-cash opportunities, enter 0 above and describe the
                  tuition, mentorship, training, or other support here.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Deadline Date
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="opportunity-application-url"
                  className="block text-[11px] font-bold text-slate-300 uppercase"
                >
                  Official Application URL (HTTPS)
                </label>
                <input
                  id="opportunity-application-url"
                  type="url"
                  inputMode="url"
                  required={category === "Scholarships"}
                  placeholder="https://provider.org/apply"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-300">
                  {category === "Scholarships"
                    ? "Required for scholarships. Use the provider's official HTTPS application page."
                    : "Optional. Add the provider's official HTTPS application page when available."}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Eligibility Criteria (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Registered in Kenya, Age 18-35, MVP ready"
                  value={eligibilityInput}
                  onChange={(e) => setEligibilityInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. AgriTech, Youth Grant, Climate"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="min-h-12 w-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20"
              >
                {isSaving
                  ? "Saving..."
                  : editingOpp
                  ? "Update Opportunity"
                  : "Publish Opportunity"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

      <Footer />
    </main>
  );
}