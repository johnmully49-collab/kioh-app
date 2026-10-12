export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative z-10 border-t border-white/10 bg-slate-950/70 px-6 py-24 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">
              Why KIOH exists
            </p>

            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Talent should have a pathway.
            </h2>

            <p className="mt-6 max-w-xl leading-8 text-slate-400">
              There are young people with skills, ideas, ambition and the
              desire to contribute, but sometimes the right information,
              mentorship, networks, resources or spaces are missing.
            </p>

            <p className="mt-4 max-w-xl leading-8 text-slate-400">
              KIOH exists to help close that gap — creating a pathway from
              potential, to opportunity, to capability, and eventually to
              impact.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-amber-500/20 blur-xl" />

            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl shadow-2xl">
              <p className="text-xs font-semibold tracking-widest text-slate-500">
                THE KIOH JOURNEY
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Discover",
                  "Connect",
                  "Learn",
                  "Collaborate",
                  "Research",
                  "Build",
                  "Launch",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="group flex items-center gap-4 rounded-xl border border-transparent p-2 transition duration-300 hover:border-white/10 hover:bg-white/[0.03]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-400/30 bg-teal-400/10 text-xs font-semibold text-teal-300 transition group-hover:bg-teal-400 group-hover:text-slate-950">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="text-lg font-medium text-slate-200 transition group-hover:translate-x-1">
                      {step}
                    </span>

                    {index < 6 && (
                      <span className="ml-auto text-slate-700">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}