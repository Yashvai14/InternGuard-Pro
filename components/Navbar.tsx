import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">IG</span>
          </div>
          <span className="text-lg font-bold text-slate-900">InternGuard</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">How It Works</a>
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">Features</a>
          <a href="#trust" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">Trust</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand border border-slate-200 px-4 py-2 rounded-full hover:border-brand/40 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/analyze"
            className="bg-gradient-to-r from-brand to-accent text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            Analyze Post
          </Link>
        </div>
      </div>
    </header>
  );
}
