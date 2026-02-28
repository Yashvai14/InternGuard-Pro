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

        <Link
          href="/analyze"
          className="bg-gradient-to-r from-brand to-accent text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5"
        >
          Analyze Post
        </Link>
      </div>
    </header>
  );
}
