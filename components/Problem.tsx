export default function Problem() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-brand font-semibold text-sm uppercase tracking-wider">The Problem</span>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">
            Internship Scams Are On the Rise
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Students are the primary targets of fake job postings and internship fraud.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="gradient-border bg-white p-8 rounded-2xl hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2">50%+</h3>
            <p className="text-slate-500">Online job posts lack any verification mechanism for legitimacy.</p>
          </div>

          <div className="gradient-border bg-white p-8 rounded-2xl hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2">High Risk</h3>
            <p className="text-slate-500">Students are targeted due to urgency, inexperience, and desperation.</p>
          </div>

          <div className="gradient-border bg-white p-8 rounded-2xl hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-warn/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Upfront Fees</h3>
            <p className="text-slate-500">Many fake internships demand registration payments before joining.</p>
          </div>
        </div>

        <p className="text-center text-slate-500 max-w-3xl mx-auto">
          Scammers exploit desperation for experience, lack of awareness, and pressure tactics.
          Most students apply without verifying legitimacy.
        </p>
      </div>
    </section>
  );
}
