"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PredictionResult {
  prediction_id: number;
  risk_score: number;
  label: string;
  confidence: number;
  keywords: string[];
  scam_probability: number;
  safe_probability: number;
}

function getRiskGradient(score: number) {
  if (score >= 70) return "from-red-500 to-orange-500";
  if (score >= 40) return "from-amber-400 to-yellow-400";
  return "from-emerald-400 to-green-400";
}

function getRiskBg(score: number) {
  if (score >= 70) return "bg-red-50 border-red-100";
  if (score >= 40) return "bg-amber-50 border-amber-100";
  return "bg-emerald-50 border-emerald-100";
}

function getRiskLabel(score: number) {
  if (score >= 70) return "High Risk";
  if (score >= 40) return "Medium Risk";
  return "Low Risk";
}

function getRiskTextColor(score: number) {
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-amber-600";
  return "text-emerald-600";
}

export default function ResultPage() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("prediction");
    if (!stored) {
      router.push("/analyze");
      return;
    }
    setResult(JSON.parse(stored));
  }, [router]);

  const sendFeedback = async (isAccurate: boolean) => {
    if (!result) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prediction_id: result.prediction_id,
          is_accurate: isAccurate,
        }),
      });
      setFeedbackSent(true);
    } catch {
      /* ignore */
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Loading results...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/analyze" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-brand text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Analyze Another Post
        </Link>

        <h1 className="text-4xl font-extrabold text-slate-900 mt-8 mb-8 animate-fade-in-up">
          Analysis <span className="gradient-text">Result</span>
        </h1>

        <div className={`rounded-2xl border p-8 mb-6 animate-fade-in-up ${getRiskBg(result.risk_score)}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Risk Score</p>
              <div className="flex items-baseline gap-3">
                <span className={`text-6xl font-extrabold ${getRiskTextColor(result.risk_score)}`}>
                  {result.risk_score}
                </span>
                <span className={`text-lg font-bold ${getRiskTextColor(result.risk_score)}`}>
                  {getRiskLabel(result.risk_score)}
                </span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${result.label === "scam" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              {result.label === "scam" ? "SCAM DETECTED" : "LOOKS SAFE"}
            </div>
          </div>
          <div className="w-full bg-white/60 rounded-full h-3">
            <div className={`bg-gradient-to-r ${getRiskGradient(result.risk_score)} rounded-full h-3 transition-all duration-1000`} style={{ width: `${result.risk_score}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up-delay">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Verdict</p>
            <p className={`text-3xl font-extrabold ${result.label === "scam" ? "text-red-600" : "text-emerald-600"}`}>
              {result.label === "scam" ? "Scam" : "Safe"}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Confidence</p>
            <p className="text-3xl font-extrabold text-slate-900">
              {Math.round(result.confidence * 100)}%
            </p>
          </div>
        </div>

        {result.keywords.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm animate-fade-in-up-delay">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Suspicious Keywords Found</p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-100"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm animate-fade-in-up-delay-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Probability Breakdown</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Scam Probability</span>
                <span className="font-bold text-red-600">{Math.round(result.scam_probability * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-full h-2" style={{ width: `${Math.round(result.scam_probability * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Safe Probability</span>
                <span className="font-bold text-emerald-600">{Math.round(result.safe_probability * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full h-2" style={{ width: `${Math.round(result.safe_probability * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {!feedbackSent ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-fade-in-up-delay-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Was this analysis accurate?</p>
            <div className="flex gap-3">
              <button
                onClick={() => sendFeedback(true)}
                className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-semibold"
              >
                Yes, Accurate
              </button>
              <button
                onClick={() => sendFeedback(false)}
                className="flex-1 bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold"
              >
                No, Inaccurate
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3 animate-fade-in-up">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <p className="text-emerald-700 text-sm font-medium">Thank you for your feedback!</p>
          </div>
        )}
      </div>
    </div>
  );
}
