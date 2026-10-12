"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  ChartBarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type {
  EcosystemAnalytics as EcosystemAnalyticsData,
  MonthlyEngagement,
} from "@/server/types/analytics";

type TrendKey = "members" | "applications" | "ventures";

const TREND_SERIES: {
  key: TrendKey;
  label: string;
  color: string;
  stroke: string;
}[] = [
  { key: "members", label: "New members", color: "#5eead4", stroke: "#5eead4" },
  { key: "applications", label: "Opportunity applications", color: "#a5b4fc", stroke: "#a5b4fc" },
  { key: "ventures", label: "Venture submissions", color: "#fcd34d", stroke: "#fcd34d" },
];

function trendPath(
  data: MonthlyEngagement[],
  key: TrendKey,
  maxValue: number
) {
  const left = 40;
  const right = 700;
  const top = 18;
  const bottom = 190;
  const usableWidth = right - left;
  const usableHeight = bottom - top;
  const points = data.flatMap((month, index) => {
    const value = month[key];
    if (value === null) return [];
    const x =
      data.length <= 1
        ? left + usableWidth / 2
        : left + (index / (data.length - 1)) * usableWidth;
    const y = bottom - (value / maxValue) * usableHeight;
    return [{ x, y, value, label: month.label }];
  });
  const path = points
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  return { path, points, left, right, top, bottom };
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: "members" | "activity";
}) {
  const Icon = icon === "members" ? UsersIcon : ChartBarIcon;
  return (
    <div className="border-b border-white/10 px-1 py-4 sm:border-b-0 sm:border-r sm:px-4 sm:py-1 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-slate-300">{label}</p>
        <Icon
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-teal-200"
        />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function HorizontalBarChart({
  title,
  description,
  rows,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: { label: string; value: number }[];
  emptyMessage: string;
}) {
  const maxValue = Math.max(1, ...rows.map(({ value }) => value));
  return (
    <section
      aria-label={title}
      className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6"
    >
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
      {rows.length > 0 ? (
        <div className="mt-6 space-y-4">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="truncate text-xs text-slate-200">{label}</span>
                <span className="shrink-0 text-xs tabular-nums text-slate-300">
                  {value.toLocaleString()}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-800"
                role="img"
                aria-label={`${label}: ${value}`}
              >
                <div
                  className="h-full rounded-full bg-teal-300"
                  style={{ width: `${Math.max(2, (value / maxValue) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-slate-300">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

function EngagementChart({
  data,
}: {
  data: MonthlyEngagement[];
}) {
  const [visibleSeries, setVisibleSeries] = useState<TrendKey[]>([
    "members",
    "applications",
    "ventures",
  ]);
  const maxValue = Math.max(
    1,
    ...data.flatMap((month) =>
      TREND_SERIES.map(({ key }) => month[key] ?? 0)
    )
  );

  const toggleSeries = (key: TrendKey) => {
    setVisibleSeries((current) =>
      current.includes(key)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== key)
        : [...current, key]
    );
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            Ecosystem activity
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Monthly sign-ups, opportunity applications, and venture submissions
            across KIOH.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Activity chart series">
          {TREND_SERIES.map((series) => {
            const selected = visibleSeries.includes(series.key);
            return (
              <button
                key={series.key}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSeries(series.key)}
                className={`min-h-10 rounded-lg border px-2.5 text-[11px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 ${
                  selected
                    ? "border-white/15 bg-white/[0.07] text-white"
                    : "border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </button>
            );
          })}
        </div>
      </div>

      {data.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <svg
            viewBox="0 0 740 232"
            role="img"
            aria-labelledby="engagement-chart-title engagement-chart-description"
            className="h-56 min-w-[620px] w-full"
          >
            <title id="engagement-chart-title">
              Six-month ecosystem activity trend
            </title>
            <desc id="engagement-chart-description">
              A line chart comparing monthly new members, opportunity
              applications, and venture submissions. Values below five are
              suppressed for partner accounts.
            </desc>
            {[0, 1, 2, 3].map((step) => {
              const y = 190 - step * (172 / 3);
              return (
                <g key={step}>
                  <line
                    x1="40"
                    x2="700"
                    y1={y}
                    y2={y}
                    stroke="rgba(148,163,184,0.18)"
                    strokeDasharray="3 6"
                  />
                  <text
                    x="30"
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px]"
                  >
                    {Math.round((maxValue * step) / 3)}
                  </text>
                </g>
              );
            })}
            {data.map((month, index) => {
              const x =
                data.length <= 1
                  ? 370
                  : 40 + (index / (data.length - 1)) * 660;
              return (
                <text
                  key={month.month}
                  x={x}
                  y="216"
                  textAnchor="middle"
                  className="fill-slate-300 text-[10px]"
                >
                  {month.label}
                </text>
              );
            })}
            {TREND_SERIES.filter(({ key }) => visibleSeries.includes(key)).map(
              (series) => {
                const { path, points } = trendPath(
                  data,
                  series.key,
                  maxValue
                );
                return (
                  <g key={series.key}>
                    {path && (
                      <path
                        d={path}
                        fill="none"
                        stroke={series.stroke}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {points.map((point) => (
                      <circle
                        key={`${series.key}-${point.label}`}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#0f172a"
                        stroke={series.stroke}
                        strokeWidth="2"
                      >
                        <title>
                          {point.label}: {point.value} {series.label.toLowerCase()}
                        </title>
                      </circle>
                    ))}
                  </g>
                );
              }
            )}
          </svg>
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-slate-300">
          Activity trends will appear as KIOH submissions are recorded.
        </p>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        A dash indicates a count below five that is hidden for partner privacy.
        Chart values are aggregates, not funding awards.
      </p>
      <div className="sr-only">
        <table>
          <caption>Monthly ecosystem activity for the last six months</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">New members</th>
              <th scope="col">Opportunity applications</th>
              <th scope="col">Venture submissions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((month) => (
              <tr key={month.month}>
                <th scope="row">{month.label}</th>
                <td>{month.members ?? "Suppressed"}</td>
                <td>{month.applications ?? "Suppressed"}</td>
                <td>{month.ventures ?? "Suppressed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function EcosystemAnalytics() {
  const [analytics, setAnalytics] = useState<EcosystemAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("All counties");

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analytics", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.data) {
        throw new Error(result.message || "Could not load ecosystem analytics.");
      }
      setAnalytics(result.data as EcosystemAnalyticsData);
    } catch (loadError) {
      console.error("[ECOSYSTEM_ANALYTICS_LOAD_ERROR]:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load ecosystem analytics."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadAnalytics(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadAnalytics]);

  const availableCounties = useMemo(
    () =>
      Array.from(
        new Set([
          ...((analytics?.fundingByCounty ?? []).map(({ county }) => county)),
          ...((analytics?.membersByCounty ?? []).map(({ county }) => county)),
        ])
      ).sort((a, b) => a.localeCompare(b)),
    [analytics]
  );
  const fundingRows = useMemo(
    () =>
      (analytics?.fundingByCounty ?? [])
        .filter(
          ({ county }) =>
            selectedCounty === "All counties" || county === selectedCounty
        )
        .map(({ county, count }) => ({ label: county, value: count })),
    [analytics, selectedCounty]
  );
  const memberRows = useMemo(
    () =>
      (analytics?.membersByCounty ?? [])
        .filter(
          ({ county }) =>
            selectedCounty === "All counties" || county === selectedCounty
        )
        .map(({ county, count }) => ({ label: county, value: count })),
    [analytics, selectedCounty]
  );

  const selectedMemberCount =
    selectedCounty === "All counties"
      ? analytics?.totals.members
      : analytics?.membersByCounty.find(
          ({ county }) => county === selectedCounty
        )?.count ?? 0;
  const selectedFundingCount =
    selectedCounty === "All counties"
      ? analytics?.totals.activeFundingListings
      : analytics?.fundingByCounty.find(
          ({ county }) => county === selectedCounty
        )?.count ?? 0;

  return (
    <section className="mt-8 space-y-6" aria-labelledby="ecosystem-analytics-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="ecosystem-analytics-title"
            className="text-2xl font-bold text-white"
          >
            Ecosystem analytics
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            A live, aggregated view of opportunity access, venture activity, and
            youth engagement across KIOH.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="analytics-county" className="text-xs text-slate-300">
            County
          </label>
          <select
            id="analytics-county"
            value={selectedCounty}
            onChange={(event) => setSelectedCounty(event.target.value)}
            disabled={!analytics || isLoading}
            className="min-h-11 min-w-44 rounded-xl border border-white/10 bg-slate-900 px-3 text-xs text-white outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-300/30 disabled:opacity-60"
          >
            <option value="All counties">All counties</option>
            {availableCounties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            disabled={isLoading}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 disabled:cursor-wait disabled:opacity-50"
          >
            <ArrowPathIcon
              aria-hidden="true"
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3"
        >
          <p className="text-xs text-rose-100">{error}</p>
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            disabled={isLoading}
            className="min-h-10 rounded-lg px-3 text-xs font-semibold text-rose-100 hover:bg-rose-200/10 disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && !analytics ? (
        <div
          role="status"
          aria-label="Loading ecosystem analytics"
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl bg-slate-800"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-slate-900/50" />
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:grid-cols-3 sm:gap-y-5 lg:grid-cols-5">
            <MetricCard
              label={selectedCounty === "All counties" ? "Registered members" : "Members in county"}
              value={selectedMemberCount ?? 0}
              detail={
                selectedCounty === "All counties"
                  ? "All KIOH accounts"
                  : selectedCounty
              }
              icon="members"
            />
            <MetricCard
              label="Opportunity applications"
              value={analytics.totals.opportunityApplications}
              detail="Submitted through KIOH"
              icon="activity"
            />
            <MetricCard
              label={selectedCounty === "All counties" ? "Open grant listings" : "County grant listings"}
              value={selectedFundingCount ?? 0}
              detail={
                selectedCounty === "All counties"
                  ? "Not funds awarded"
                  : selectedCounty
              }
              icon="activity"
            />
            <MetricCard
              label="Approved ventures"
              value={analytics.totals.approvedVentures}
              detail="Publicly reviewed showcase"
              icon="activity"
            />
            <MetricCard
              label="Mentor applications"
              value={analytics.totals.mentorApplications}
              detail="Submitted for review"
              icon="activity"
            />
          </div>

          <EngagementChart data={analytics.monthlyEngagement} />

          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart
              title="Open grant opportunities by county"
              description="Current KIOH grant listings with a future deadline. Counts show listings, not awarded or committed funding."
              rows={fundingRows}
              emptyMessage="No open grant listings match this county filter."
            />
            <HorizontalBarChart
              title="KIOH members by county"
              description="Member profile locations. Partner accounts only see county groups of five or more people."
              rows={memberRows}
              emptyMessage="No county profile data matches this filter."
            />
          </div>

          <HorizontalBarChart
            title="Approved venture activity by sector"
            description="Publicly approved ventures in the showcase, grouped by their selected domain."
            rows={(analytics.venturesBySector ?? []).map(({ sector, count }) => ({
              label: sector,
              value: count,
            }))}
            emptyMessage="Approved venture sector data will appear as ventures pass review."
          />

          <p className="text-[11px] leading-relaxed text-slate-400">
            Snapshot generated{" "}
            {new Date(analytics.generatedAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            . All charts use aggregated platform records. Opportunity amounts are
            not totaled because listings can use different currencies and do
            not represent awards.
            {analytics.suppressedCountyCounts > 0
              ? ` ${analytics.suppressedCountyCounts} small county member group${analytics.suppressedCountyCounts === 1 ? " is" : "s are"} hidden for privacy.`
              : ""}
          </p>
        </>
      ) : null}
    </section>
  );
}
