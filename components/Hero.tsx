import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 min-h-[90vh] flex items-center">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
            AI-Powered Protection
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 text-slate-900">
            Detect Fake
            <span className="gradient-text block">Internships</span>
            Before You Apply
          </h1>

          <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
            AI-powered scam risk analysis that evaluates internship and job posts
            for suspicious patterns, manipulation tactics, and fraud indicators.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/analyze"
              className="bg-gradient-to-r from-brand to-brand-dark text-white px-8 py-4 rounded-2xl font-semibold text-base hover:shadow-xl hover:shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Check a Job Post
            </Link>
            <a
              href="#how-it-works"
              className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-semibold text-base hover:border-brand hover:text-brand transition-all duration-300"
            >
              See How It Works
            </a>
          </div>

          <div className="flex items-center gap-8 mt-10 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Free to Use
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              95% Accuracy
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Instant Results
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up-delay animate-float hidden lg:block">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-100 animate-pulse-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Sample Analysis</h3>
              <span className="bg-danger/10 text-danger text-xs font-bold px-3 py-1 rounded-full">SCAM DETECTED</span>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl mb-4">
              <p className="text-sm text-slate-500 mb-1">Risk Score</p>
              <p className="text-5xl font-extrabold text-danger">78</p>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                <div className="bg-gradient-to-r from-warn to-danger rounded-full h-2" style={{ width: "78%" }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-danger/10 text-danger rounded-full flex items-center justify-center text-xs">!</span>
                <span className="text-slate-600">Upfront registration fee detected</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-danger/10 text-danger rounded-full flex items-center justify-center text-xs">!</span>
                <span className="text-slate-600">Unrealistic salary promise</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-warn/10 text-warn rounded-full flex items-center justify-center text-xs">!</span>
                <span className="text-slate-600">Urgency tactics used</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
