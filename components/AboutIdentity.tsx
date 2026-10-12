"use client";

import { useState } from "react";

const identityItems = [
  {
    id: "story",
    title: "Our Story",
    tagline: "Born from Purpose",
    content: (
      <div className="space-y-3 text-xs leading-6 text-slate-300 sm:text-base sm:leading-8">
        <p>
          Kenya is home to incredible talent, drive, and ambition. Across universities, technical institutions, and tech communities, young people are constantly striving to create solutions. However, many face a common challenge: fragmented information, limited access to experienced mentors, and a lack of collaborative spaces to test and launch their ideas.
        </p>
        <p>
          KIOH (Kenya Innovation & Opportunity Hub) was established to solve this disconnect. We built a unified ecosystem where ambitious youth, skilled graduates, and visionary leaders converge to share knowledge, access opportunities, and build scalable ventures together.
        </p>
      </div>
    ),
  },
  {
    id: "mission",
    title: "Our Mission",
    tagline: "Transforming Potential into Capability",
    content: (
      <div className="space-y-3 text-xs leading-6 text-slate-300 sm:text-base sm:leading-8">
        <p className="text-sm font-semibold text-teal-300 sm:text-lg">
          To construct sustainable pathways that transform potential into capability and capability into measurable social and economic impact across Kenya and beyond.
        </p>
        <p>
          We achieve this by aggregating curated opportunities, facilitating direct mentorship connections, hosting collaborative problem labs, and nurturing tech talent from discovery through to execution.
        </p>
      </div>
    ),
  },
  {
    id: "vision",
    title: "Our Vision",
    tagline: "Targeting 2045 Impact",
    content: (
      <div className="space-y-3 text-xs leading-6 text-slate-300 sm:text-base sm:leading-8">
        <p className="text-sm font-semibold text-teal-300 sm:text-lg">
          A thriving, interconnected ecosystem where every young person in Kenya has seamless access to the resources, networks, and opportunities required to solve real-world challenges.
        </p>
        <p>
          By 2045, we aim to empower 1 million young people and catalyze 10,000 launched projects and community-driven innovations.
        </p>
      </div>
    ),
  },
];

const values = [
  {
    title: "Inclusivity & Access",
    description: "Breaking geographical and economic barriers so talent anywhere in Kenya can access world-class opportunities.",
    icon: "🌐",
  },
  {
    title: "Action over Theory",
    description: "Promoting hands-on experimentation, building real projects, and deploying solutions that solve localized challenges.",
    icon: "⚡",
  },
  {
    title: "Collaborative Ecosystems",
    description: "Believing that transformative growth happens when students, developers, mentors, and industry partners build together.",
    icon: "🤝",
  },
  {
    title: "Long-term Impact",
    description: "Committed to sustainable, generational progress focused on capability building and sustainable economic output.",
    icon: "🎯",
  },
];

export default function AboutIdentity() {
  const [openId, setOpenId] = useState<string>("story");

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? "" : id));
  };

  return (
    <section id="identity" className="relative z-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300 sm:text-sm">
            Who We Are
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Empowering the Next Generation of Builders.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-slate-400 sm:text-base sm:leading-7">
            KIOH is an innovation and opportunity hub designed to bridge the gap between potential, skills, and real-world impact.
          </p>
        </div>

        {/* Mobile Touch-Optimized Accordion */}
        <div className="mt-10 space-y-4 sm:mt-12">
          {identityItems.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 sm:rounded-3xl ${
                  isOpen
                    ? "border-teal-400/50 bg-slate-900/80 shadow-xl shadow-teal-500/10"
                    : "border-white/10 bg-slate-900/40 hover:border-white/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  className="touch-manipulation flex w-full items-center justify-between p-5 text-left active:bg-white/5 sm:p-8"
                >
                  <div className="pointer-events-none">
                    <span className="text-[10px] font-mono tracking-widest text-teal-300 uppercase sm:text-xs">
                      {item.tagline}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-white sm:text-2xl">
                      {item.title}
                    </h3>
                  </div>

                  <div
                    className={`pointer-events-none flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal-400/30 bg-teal-400/10 text-teal-300 transition-transform duration-300 sm:h-10 sm:w-10 ${
                      isOpen ? "rotate-180 bg-teal-400 text-slate-950" : ""
                    }`}
                  >
                    ↓
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 p-5 pt-4 sm:p-8 sm:pt-6">
                    {item.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Core Values Grid */}
        <div className="mt-16 sm:mt-24">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">
              Guiding Principles
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Our Core Values</h3>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition duration-300 hover:border-teal-400/40 hover:bg-white/[0.06] sm:rounded-3xl sm:p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/10 text-xl sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                  {v.icon}
                </div>
                <h4 className="mt-4 text-base font-bold text-white sm:text-lg">{v.title}</h4>
                <p className="mt-2 text-xs leading-5 text-slate-400 sm:leading-6">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}