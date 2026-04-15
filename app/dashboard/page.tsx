"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Prediction {
  id: number;
  company_name: string | null;
  risk_score: number;
  label: string;
  confidence: number;
  scam_probability: number;
  safe_probability: number;
  matched_keywords: string[];
  marked_as_scam: boolean;
  job_text_preview: string;
  created_at: string;
}

interface Stats {
  total: number;
  scam: number;
  safe: number;
  marked_as_scam: number;
  avg_risk_score: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function riskColor(score: number) {
  if (score >= 70) return { text: "text-red-600", bg: "bg-red-100", bar: "from-red-400 to-red-600" };
  if (score >= 40) return { text: "text-amber-600", bg: "bg-amber-100", bar: "from-amber-400 to-amber-500" };
  return { text: "text-emerald-600", bg: "bg-emerald-100", bar: "from-emerald-400 to-emerald-500" };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function downloadReport(company?: string) {
  const params = company ? `?company_name=${encodeURIComponent(company)}` : "";
  const a = document.createElement("a");
  a.href = `/api/dashboard/report${params}`;
  a.download = company ? `report_${company}.csv` : "report_all.csv";
  a.click();
}

function downloadPredictionReport(predictionId: number) {
  const a = document.createElement("a");
  a.href = `/api/dashboard/predictions/${predictionId}/report`;
  a.download = `internguard_prediction_${predictionId}.pdf`;
  a.click();
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${color} p-6 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/60 shadow-sm">
          {icon}
        </div>
      </div>
      <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "scam" | "safe" | "marked">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, predsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/predictions?limit=200"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (predsRes.ok) setPredictions(await predsRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleMark = async (p: Prediction) => {
    setMarkingId(p.id);
    try {
      const res = await fetch(`/api/dashboard/predictions/${p.id}/mark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marked_as_scam: !p.marked_as_scam }),
      });
      if (res.ok) {
        setPredictions((prev) =>
          prev.map((x) => x.id === p.id ? { ...x, marked_as_scam: !x.marked_as_scam } : x)
        );
        // refresh stats
        const sr = await fetch("/api/dashboard/stats");
        if (sr.ok) setStats(await sr.json());
      }
    } catch { /* ignore */ }
    setMarkingId(null);
  };

  // Filtered + searched rows
  const shown = predictions.filter((p) => {
    if (filter === "scam" && p.label !== "scam") return false;
    if (filter === "safe" && p.label !== "safe") return false;
    if (filter === "marked" && !p.marked_as_scam) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.company_name || "").toLowerCase().includes(q) ||
        p.job_text_preview.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Unique companies for per-company download
  const companies = [...new Set(predictions.map((p) => p.company_name).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* ── Top Nav ───────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.06] bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">InternGuard</span>
            <span className="text-white/20 mx-1">/</span>
            <span className="text-white/50 text-sm font-medium">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadReport()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download All
            </button>
            <Link
              href="/dashboard/companies"
              className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] text-white text-sm font-medium px-4 py-2 rounded-xl transition border border-white/[0.1]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Companies
            </Link>
            <Link
              href="/analyze"
              className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm font-medium px-4 py-2 rounded-xl transition border border-white/[0.1]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Scan
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* ── Stats Grid ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-5">Overview</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] h-36 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                label="Total Scanned" value={stats?.total ?? 0}
                sub="All-time internship posts"
                color="bg-indigo-950/40 border-indigo-800/30"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                label="Detected Scams" value={stats?.scam ?? 0}
                sub={`${stats ? Math.round((stats.scam / Math.max(stats.total, 1)) * 100) : 0}% of total`}
                color="bg-red-950/40 border-red-800/30"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Safe Posts" value={stats?.safe ?? 0}
                sub={`${stats ? Math.round((stats.safe / Math.max(stats.total, 1)) * 100) : 0}% of total`}
                color="bg-emerald-950/40 border-emerald-800/30"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>}
                label="Marked as Scam" value={stats?.marked_as_scam ?? 0}
                sub={`Avg Risk: ${stats?.avg_risk_score ?? 0}`}
                color="bg-orange-950/40 border-orange-800/30"
              />
            </div>
          )}
        </section>

        {/* ── Per Company Download ────────────────────────────────────── */}
        {companies.length > 0 && (
          <section>
            <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-5">Download Report by Company</h2>
            <div className="flex flex-wrap gap-2">
              {companies.map((c) => (
                <button
                  key={c}
                  onClick={() => downloadReport(c)}
                  className="flex items-center gap-2 bg-white/[0.05] hover:bg-indigo-600 text-white/70 hover:text-white border border-white/[0.1] hover:border-indigo-500 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  {c}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Filters + Search ────────────────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {(["all", "scam", "safe", "marked"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    filter === f
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                      : "bg-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.1] border border-white/[0.08]"
                  }`}
                >
                  {f === "all" ? "All" : f === "scam" ? "🚨 Scam" : f === "safe" ? "✅ Safe" : "🚩 Marked"}
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
                placeholder="Search company, label..."
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
            <div className="flex flex-col items-center justify-center py-24 text-white/30">
              <svg className="w-14 h-14 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold">No records found</p>
              <p className="text-sm mt-1">Try changing the filter or run a scan first.</p>
              <Link href="/analyze" className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium underline underline-offset-2">
                Analyze a post →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-white/[0.04] text-white/40 text-xs font-semibold uppercase tracking-widest border-b border-white/[0.08]">
                <span className="col-span-3">Company</span>
                <span className="col-span-2">Risk</span>
                <span className="col-span-1">Label</span>
                <span className="col-span-2">Confidence</span>
                <span className="col-span-2">Scanned At</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.05]">
                {shown.map((p) => {
                  const rc = riskColor(p.risk_score);
                  return (
                    <div key={p.id}>
                      <div
                        className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer items-center"
                        onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                      >
                        {/* Company */}
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center shrink-0 text-white/60 text-xs font-bold">
                            {(p.company_name || "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/90 font-medium text-sm truncate">
                              {p.company_name || <span className="text-white/30 italic">Unknown</span>}
                            </p>
                            <p className="text-white/30 text-xs">ID #{p.id}</p>
                          </div>
                        </div>

                        {/* Risk Score */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-extrabold ${rc.text}`}>{p.risk_score}</span>
                            <div className="flex-1 bg-white/[0.07] rounded-full h-1.5 max-w-16">
                              <div
                                className={`bg-gradient-to-r ${rc.bar} rounded-full h-1.5 transition-all`}
                                style={{ width: `${p.risk_score}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Label */}
                        <div className="col-span-1">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            p.label === "scam"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {p.label.toUpperCase()}
                          </span>
                        </div>

                        {/* Confidence */}
                        <div className="col-span-2 text-white/60 text-sm font-medium">
                          {p.confidence}%
                        </div>

                        {/* Date */}
                        <div className="col-span-2 text-white/40 text-xs">
                          {p.created_at ? formatDate(p.created_at) : "—"}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {p.marked_as_scam && (
                            <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-xs font-bold">🚩 Marked</span>
                          )}
                          <button
                            onClick={() => toggleMark(p)}
                            disabled={markingId === p.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              p.marked_as_scam
                                ? "bg-white/[0.07] text-white/50 hover:bg-white/[0.12] hover:text-white"
                                : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                            } disabled:opacity-40`}
                          >
                            {markingId === p.id ? "..." : p.marked_as_scam ? "Unmark" : "Mark Scam"}
                          </button>
                          <button
                            onClick={() => downloadPredictionReport(p.id)}
                            title="Download report"
                            className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-indigo-600 text-white/40 hover:text-white flex items-center justify-center transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Row */}
                      {expanded === p.id && (
                        <div className="px-6 pb-5 bg-white/[0.02] border-t border-white/[0.05]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5">
                            {/* Job Text Preview */}
                            <div>
                              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Job Description Preview</p>
                              <p className="text-white/60 text-sm leading-relaxed bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                                {p.job_text_preview || "No preview available."}
                              </p>
                            </div>

                            {/* Keywords + Probabilities */}
                            <div className="space-y-4">
                              <div>
                                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Suspicious Keywords</p>
                                {p.matched_keywords.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {p.matched_keywords.map((kw) => (
                                      <span key={kw} className="bg-red-500/15 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg text-xs font-medium">
                                        ⚠ {kw}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-white/30 text-sm">None detected</p>
                                )}
                              </div>
                              <div>
                                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Probability Breakdown</p>
                                <div className="space-y-2">
                                  <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                      <span className="text-white/50">Scam</span>
                                      <span className="text-red-400 font-bold">{p.scam_probability}%</span>
                                    </div>
                                    <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                                      <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-full h-1.5" style={{ width: `${p.scam_probability}%` }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                      <span className="text-white/50">Safe</span>
                                      <span className="text-emerald-400 font-bold">{p.safe_probability}%</span>
                                    </div>
                                    <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full h-1.5" style={{ width: `${p.safe_probability}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.06] text-white/30 text-xs">
                Showing {shown.length} of {predictions.length} records
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
