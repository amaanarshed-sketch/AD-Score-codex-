"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BarChart3, Clock3, GitCompareArrows, Sparkles } from "lucide-react";
import Navbar from "../../components/Navbar";
import ProductStatus from "../../components/ProductStatus";
import { getAnalysisHistory } from "../../lib/history";

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "Recent";
  }
}

function actionColor(action = "") {
  if (action.includes("Run")) return "text-emerald-300";
  if (action.includes("Reject") || action.includes("Do not")) return "text-rose-300";
  return "text-amber-300";
}

export default function HistoryPage() {
  const [history] = useState(() => getAnalysisHistory());

  return (
    <main className="app-page min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="app-eyebrow text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Saved Locally</p>
            <h1 className="app-title mt-3 text-4xl font-black tracking-tight md:text-5xl">Analysis history</h1>
            <p className="app-muted mt-3 max-w-2xl text-slate-400">
              Recent ad scores are saved in this browser so you can compare decisions without setting up accounts or a database yet.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="app-primary-action inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
              <Sparkles size={16} />
              Analyze Ad
            </Link>
            <Link href="/compare" className="app-secondary-action inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              <GitCompareArrows size={16} />
              Compare Ads
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <ProductStatus />
        </div>

        {history.length ? (
          <div className="grid gap-4">
            {history.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">
                        {item.type === "compare" ? <GitCompareArrows size={13} /> : <BarChart3 size={13} />}
                        {item.type === "compare" ? "Compare" : "Single"}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-400">
                        <Clock3 size={13} />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.platform} · {item.objective} · {item.audience || "Audience not provided"}
                    </p>
                  </div>
                  <div className="grid min-w-44 gap-2 rounded-lg border border-white/10 bg-slate-950/70 p-4">
                    <div className="text-3xl font-black text-cyan-300">{item.score || 0}<span className="text-sm text-slate-500">/100</span></div>
                    <div className={`text-sm font-bold ${actionColor(item.action)}`}>{item.action || "Revise"}</div>
                    <div className="text-xs font-semibold text-slate-500">Confidence: {item.confidence || "Low"}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="app-card rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h2 className="app-title text-2xl font-black">No saved analyses yet</h2>
            <p className="app-muted mt-3 text-slate-400">Run a single analysis or compare ads, then your recent results will appear here.</p>
            <Link href="/dashboard" className="app-primary-action mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
              Start first analysis
              <ArrowRight size={16} />
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
