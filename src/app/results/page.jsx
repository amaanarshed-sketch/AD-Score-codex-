"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, GitCompareArrows } from "lucide-react";
import Navbar from "../../components/Navbar";
import ScoreResult from "../../components/ScoreResult";

export default function ResultsPage() {
  const [payload] = useState(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("adscore:last-result");
    return stored ? JSON.parse(stored) : null;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Results</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Ad performance score</h1>
          </div>
          <Link
            href="/compare"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <GitCompareArrows size={16} />
            Compare another ad
          </Link>
        </div>

        {payload?.result ? (
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <aside className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              {payload.context ? (
                <div className="mb-5 rounded-lg border border-white/10 bg-slate-950/70 p-4">
                  <h2 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Context</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-slate-500">Platform</span>
                      <strong className="text-slate-200">{payload.context.platform}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Objective</span>
                      <strong className="text-slate-200">{payload.context.objective}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Target audience</span>
                      <strong className="text-slate-200">{payload.context.audience || "Not provided"}</strong>
                    </div>
                  </div>
                </div>
              ) : null}
              <h2 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Submitted Input</h2>
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <div>
                  <span className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Copy</span>
                  <p className="whitespace-pre-wrap">{payload.ad?.adCopy || "Not provided"}</p>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Creative</span>
                  <p>{payload.ad?.creativeFilename || "Not provided"}</p>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Post Link</span>
                  <p className="break-all">{payload.ad?.postLink || "Not provided"}</p>
                </div>
              </div>
            </aside>
            <ScoreResult result={payload.result} context={payload.context} />
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h2 className="text-2xl font-black">No result yet</h2>
            <p className="mt-3 text-slate-400">Run an analysis first, then the scorecard will appear here.</p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-lg bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              Analyze Ad
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
