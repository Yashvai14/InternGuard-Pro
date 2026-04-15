"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Company {
  id: number;
  name: string;
  is_verified: boolean;
  created_at: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/companies");
      if (res.ok) setCompanies(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleVerify = async (c: Company) => {
    setTogglingId(c.id);
    try {
      const res = await fetch(`/api/dashboard/companies/${c.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: !c.is_verified }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((x) => x.id === c.id ? { ...x, is_verified: !x.is_verified } : x)
        );
      }
    } catch { /* ignore */ }
    setTogglingId(null);
  };

  const shown = companies.filter((c) => {
    if (filter === "verified" && !c.is_verified) return false;
    if (filter === "unverified" && c.is_verified) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* ── Top Nav ───────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.06] bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white transition group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <span className="font-bold text-white text-lg tracking-tight">InternGuard</span>
            <span className="text-white/20 mx-1">/</span>
            <span className="text-white/50 text-sm font-medium">Companies</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Company Registry</h1>
          <p className="text-white/50 text-sm">Manage the verification status of companies analyzed on the platform.</p>
        </div>

        {/* ── Filters + Search ────────────────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {(["all", "verified", "unverified"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    filter === f
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                      : "bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.1] border border-white/[0.08]"
                  }`}
                >
                  {f === "all" ? "All" : f === "verified" ? "✅ Verified" : "❓ Unverified"}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company..."
                className="pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white/80 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
          </div>

          {/* ── Table ──────────────────────────────────────────────────── */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] h-16 animate-pulse" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/30 border border-white/[0.08] rounded-2xl bg-white/[0.02]">
              <svg className="w-14 h-14 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-lg font-semibold">No companies found</p>
              <p className="text-sm mt-1">Check back later once predictions have been made.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-white/[0.04] text-white/40 text-xs font-semibold uppercase tracking-widest border-b border-white/[0.08]">
                <span className="col-span-5">Company</span>
                <span className="col-span-3">Status</span>
                <span className="col-span-4 text-right">Actions</span>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {shown.map((c) => (
                  <div key={c.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors items-center">
                    {/* Company */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center shrink-0 text-white/60 text-xs font-bold">
                        {(c.name)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/90 font-medium text-sm truncate">{c.name}</p>
                        <p className="text-white/30 text-xs">ID #{c.id}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-3">
                      {c.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/[0.07] text-white/50">
                          Unverified
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-4 flex items-center justify-end gap-2">
                       <button
                         onClick={() => toggleVerify(c)}
                         disabled={togglingId === c.id}
                         className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                           c.is_verified
                             ? "bg-white/[0.07] text-white/50 hover:bg-white/[0.12] hover:text-white"
                             : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                         } disabled:opacity-40`}
                       >
                         {togglingId === c.id ? "..." : c.is_verified ? "Unverify" : "Verify Company"}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
