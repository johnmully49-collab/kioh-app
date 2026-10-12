"use client";

import { useState } from "react";

const milestones = [
  {
    phase: "Phase 01",
    title: "Ecosystem Foundation",
    year: "2024 - 2026",
    summary: "Establish KIOH hub nodes across universities and community centers, onboarding initial cohorts and mentors.",
    details: [
      "Launch Opportunity Board & Mentorship Directory",
      "Reach 50,000 active students and builders",
      "Form strategic partnerships with local labs"
    ],
  },
  {
    phase: "Phase 02",
    title: "Regional Acceleration",
    year: "2027 - 2030",
    summary: "Expand physical problem labs and provide seed micro-grants for ecosystem-driven startups.",
    details: [
      "Establish 10 regional community research labs",
      "Deploy AI skill academies in all 47 counties",
      "Fund top 100 youth-led innovation projects"
    ],
  },
  {
    phase: "Phase 03",
    title: "Continental Network",
    year: "2031 - 2040",
    summary: "Scale the KIOH framework across East Africa to enable cross-border builder networks and shared ventures.",
    details: [
      "Pan-African mentorship exchange program",
      "Cross-border venture funding network",
      "Scale developer platform to 500k active builders"
    ],
  },
  {
    phase: "Phase 04",
    title: "Vision 2045",
    year: "2041 - 2045",
    summary: "Achieve the long-term vision of transforming youth potential into sustainable continental economic impact.",
    details: [
      "1 Million young people empowered through high-impact pathways",
      "10,000 launched solutions operating across Africa",
      "Self-sustaining innovation ecosystem infrastructure"
    ],
  },
];

export default function JourneyRoadmap() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="journey" className="relative z-10 border-t border-white/10 bg-slate-950/80 px-6 py-24 backdrop-blur-xl lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">
            Long-term Strategy
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Our Journey to 2045.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            A structured roadmap transforming localized potential into measurable, large-scale impact over the coming decades.
          </p>
        </div>

        {/* Timeline Steps Selector */}
        <div className="mt-16 grid gap-4 md:grid-cols-4">
          {milestones.map((item, index) => (
            <button
              key={item.phase}
              onClick={() => setActiveStep(index)}
              className={`relative flex flex-col items-start rounded-2xl border p-6 text-left transition duration-300 ${
                activeStep === index
                  ? "border-teal-400/60 bg-teal-400/10 shadow-xl shadow-teal-500/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex w-full items-center justify-between text-xs font-mono">
                <span className={activeStep === index ? "text-teal-300 font-bold" : "text-slate-500"}>
                  {item.phase}
                </span>
                <span className="text-slate-400">{item.year}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
            </button>
          ))}
        </div>

        {/* Active Phase Detail Card */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="text-xs font-mono tracking-widest text-teal-300 uppercase">
                {milestones[activeStep].phase} Overview
              </span>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {milestones[activeStep].title} ({milestones[activeStep].year})
              </h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-1.5 text-xs text-teal-300">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
              Strategic Focus
            </span>
          </div>

          <p className="mt-6 leading-7 text-slate-300">
            {milestones[activeStep].summary}
          </p>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Key Objectives & Milestones
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {milestones[activeStep].details.map((detail) => (
                <li
                  key={detail}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs font-medium text-slate-300"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-[10px] font-bold text-teal-300">
                    ✓
                  </span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}