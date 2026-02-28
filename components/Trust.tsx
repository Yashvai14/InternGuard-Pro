export default function Trust() {
  const points = [
    "Uses labeled internship scam data for training",
    "Hybrid AI + rule-based detection engine",
    "Privacy-first — no data sold or shared",
    "Open feedback loop improves accuracy over time",
  ];

  return (
    <section id="trust" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <span className="text-accent font-semibold text-sm uppercase tracking-wider">Trust</span>
        <h2 className="text-4xl font-extrabold text-white mt-3 mb-4">
          Built for Students. Not Recruiters.
        </h2>
        <p className="text-slate-400 mb-12 max-w-xl mx-auto">
          Our only goal is to protect you from fraudulent opportunities.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          {points.map((point) => (
            <div key={point} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-5">
              <svg className="w-5 h-5 text-accent mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-300 text-sm leading-relaxed">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
