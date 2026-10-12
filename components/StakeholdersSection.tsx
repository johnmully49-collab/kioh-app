"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckIcon,
  LightBulbIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import JoinModal from "./JoinModal";

const stakeholderRoles = [
  {
    id: "donors",
    title: "Donors & funders",
    badge: "FUND THE FUTURE",
    icon: LightBulbIcon,
    tagline: "Back ambitious people with pathways to meaningful work.",
    description:
      "Help expand access to curated opportunities, practical learning, expert guidance, and community-led innovation across Kenya.",
    benefits: [
      "Co-design programs around your funding priorities",
      "Set clear outcomes and reporting from the start",
      "Connect support to opportunities across the ecosystem",
    ],
    cta: "Discuss funding a program",
    roleType: "donor" as const,
  },
  {
    id: "mentors",
    title: "Industry mentors",
    badge: "SHARE KNOWLEDGE",
    icon: AcademicCapIcon,
    tagline: "Make your experience a practical advantage for builders.",
    description:
      "Offer focused guidance in technology, product, investment readiness, growth, and the realities of building in the region.",
    benefits: [
      "Give guidance in a format that fits your schedule",
      "Support people working on real challenges",
      "Meet a growing community of African innovators",
    ],
    cta: "Explore mentoring",
    roleType: "mentor" as const,
  },
  {
    id: "partners",
    title: "Companies & partners",
    badge: "BUILD WITH US",
    icon: RocketLaunchIcon,
    tagline: "Turn real industry challenges into shared progress.",
    description:
      "Partner on talent pathways, innovation challenges, knowledge-sharing, and practical programs shaped around your organization’s goals.",
    benefits: [
      "Co-create challenges grounded in real needs",
      "Build a thoughtful early-career talent pathway",
      "Bring your tools and expertise to new builders",
    ],
    cta: "Start a partnership",
    roleType: "partner" as const,
  },
  {
    id: "institutions",
    title: "Universities & hubs",
    badge: "EXPAND REACH",
    icon: BuildingOffice2Icon,
    tagline: "Connect local talent to a wider innovation network.",
    description:
      "Bring opportunity discovery, mentoring, and collaborative programs closer to students and the communities where ideas begin.",
    benefits: [
      "Connect learners with mentors and opportunities",
      "Create pathways for student-led projects",
      "Build links with peers and industry partners",
    ],
    cta: "Connect your institution",
    roleType: "partner" as const,
  },
] as const;

const visionTargets = [
  { value: "47", label: "counties in Kenya", note: "A national opportunity" },
  { value: "1M", label: "young people", note: "KIOH 2045 vision target" },
  { value: "10K", label: "solutions launched", note: "KIOH 2045 vision target" },
];

export default function StakeholdersSection() {
  const [activeRole, setActiveRole] = useState<(typeof stakeholderRoles)[number]["id"]>("donors");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<"builder" | "mentor" | "donor" | "partner">("donor");
  const [verifiedOrganizations, setVerifiedOrganizations] = useState<
    { name: string; verifiedAt: string }[]
  >([]);
  const [organizationsError, setOrganizationsError] = useState("");
  const reduceMotion = useReducedMotion();
  const selected = stakeholderRoles.find((role) => role.id === activeRole) ?? stakeholderRoles[0];
  const SelectedIcon = selected.icon;

  const handleOpenModal = (roleType: "builder" | "mentor" | "donor" | "partner") => {
    setModalRole(roleType);
    setIsModalOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    const loadVerifiedOrganizations = async () => {
      try {
        const response = await fetch("/api/verified-organizations");
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.data)) {
          throw new Error(result.message || "Unable to load verified partners.");
        }
        if (!cancelled) {
          setVerifiedOrganizations(result.data);
          setOrganizationsError("");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[VERIFIED_PARTNERS_LOAD_ERROR]:", error);
          setOrganizationsError(
            error instanceof Error
              ? error.message
              : "Unable to load verified partners."
          );
        }
      }
    };

    void loadVerifiedOrganizations();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="stakeholders"
      className="relative isolate scroll-mt-24 overflow-hidden border-y border-white/10 bg-[#0b1c19] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-28 -top-36 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              For people who move ecosystems forward
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Invest in potential.
              <span className="block text-emerald-200">Build what comes next.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              KIOH brings young builders, mentors, institutions, and organizations into one connected ecosystem. Find a practical way to contribute—and make the outcomes visible.
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal("partner")}
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-200 active:scale-[0.99] sm:w-auto"
            >
              Explore a partnership <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {visionTargets.map((target, index) => (
              <motion.div
                key={target.value}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur-sm sm:rounded-3xl sm:p-5"
              >
                <p className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                  {target.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-emerald-100 sm:text-sm">
                  {target.label}
                </p>
                <p className="mt-2 hidden text-[10px] leading-4 text-slate-400 sm:block">
                  {target.note}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {stakeholderRoles.map((role) => {
              const RoleIcon = role.icon;
              const active = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveRole(role.id)}
                  className={`group flex min-h-28 touch-manipulation flex-col items-start justify-between rounded-2xl border p-4 text-left transition duration-200 active:scale-[0.98] sm:min-h-36 sm:rounded-3xl sm:p-5 ${
                    active
                      ? "border-emerald-300/40 bg-emerald-300/10 shadow-lg shadow-emerald-950/20"
                      : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <RoleIcon
                    aria-hidden="true"
                    className={`h-6 w-6 ${active ? "text-emerald-200" : "text-slate-400"}`}
                  />
                  <span>
                    <span className="block text-sm font-semibold leading-5 text-white sm:text-base">
                      {role.title}
                    </span>
                    <span className="mt-1 hidden text-[10px] font-medium tracking-[0.12em] text-slate-400 sm:block">
                      {role.badge}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.article
              key={selected.id}
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#10221f] p-5 shadow-2xl shadow-black/20 sm:p-8 lg:p-10"
            >
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald-200">
                      {selected.badge}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      {selected.title}
                    </h3>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-200/10 text-emerald-100">
                    <SelectedIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-emerald-50/90">
                  {selected.tagline}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                  {selected.description}
                </p>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    A partnership designed around outcomes
                  </p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                    {selected.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2.5 text-xs leading-5 text-slate-300"
                      >
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenModal(selected.roleType)}
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200/25 bg-emerald-200/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-200/15 active:scale-[0.99] sm:w-auto"
                >
                  {selected.cta} <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        {(verifiedOrganizations.length > 0 || organizationsError) && (
          <div className="mt-12 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Verified partner organizations
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  Organizations reviewed by the KIOH team and listed with permission.
                </p>
              </div>
              {organizationsError && (
                <p role="status" className="text-xs text-amber-200">
                  {organizationsError}
                </p>
              )}
            </div>
            {verifiedOrganizations.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-3">
                {verifiedOrganizations.map((organization) => (
                  <li
                    key={organization.name}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/[0.06] px-4 py-2 text-sm font-medium text-white"
                  >
                    <CheckBadgeIcon
                      className="h-5 w-5 text-emerald-300"
                      aria-hidden="true"
                    />
                    {organization.name}
                    <span className="sr-only">, verified partner organization</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
          1 million young people and 10,000 launched solutions are KIOH’s 2045 vision targets—not current impact totals.
        </p>
      </div>

      <JoinModal
        key={modalRole}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultRole={modalRole}
      />
    </section>
  );
}
