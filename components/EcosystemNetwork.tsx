export default function EcosystemNetwork() {
  const nodes = [
    { title: "Young Talent Targeted", value: "1M+", status: "Active Reach" },
    { title: "Solutions & Projects", value: "10K+", status: "In Development" },
    { title: "Ecosystem Vision", value: "2045", status: "Long-term Target" },
  ];

  return (
    <section className="relative z-10 border-y border-white/10 bg-white/[0.02] px-6 py-16 backdrop-blur-md">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        {nodes.map((node) => (
          <div
            key={node.title}
            className="group relative rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center backdrop-blur-xl transition duration-300 hover:border-teal-400/40 hover:shadow-lg hover:shadow-teal-500/10"
          >
            <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-teal-300/80">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              {node.status}
            </div>
            <p className="mt-3 text-4xl font-bold bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
              {node.value}
            </p>
            <p className="mt-2 text-sm text-slate-400">{node.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}