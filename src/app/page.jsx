import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, GitCompareArrows, ShieldCheck, Target, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import ScrollScene from "../components/ScrollScene";

const scoreParts = [
  { label: "Platform Fit", score: 14, max: 15, detail: "Does the ad match the channel it will run on?" },
  { label: "Objective Fit", score: 13, max: 15, detail: "Does the message support leads, sales, traffic, or awareness?" },
  { label: "Audience Fit", score: 12, max: 15, detail: "Does it speak to a clear buyer and moment?" },
  { label: "Hook", score: 13, max: 15, detail: "Does the first line stop the scroll?" },
  { label: "Creative", score: 12, max: 15, detail: "Does the visual have enough stopping power?" },
  { label: "Clarity", score: 8, max: 10, detail: "Can someone understand the promise instantly?" },
  { label: "Offer", score: 7, max: 10, detail: "Is the value specific enough to act on?" },
  { label: "CTA", score: 4, max: 5, detail: "Is the next step obvious?" },
];

export default function Home() {
  return (
    <main className="site-shell min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="hero-glass mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-6xl flex-col items-center px-6 pb-16 pt-14 text-center md:pb-20 md:pt-20">
        <div className="max-w-5xl">
          <div className="glass-pill mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
            <Zap size={15} />
            AI ad scoring for paid media teams
          </div>
          <h1 className="hero-title mx-auto max-w-5xl text-5xl font-black leading-[0.96] tracking-tight text-white md:text-7xl">
            Know which ad to run <span className="hero-title__accent">before</span> you spend
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            Score copy, creative, and link context in one place. Compare variants, spot weak offers, and decide what deserves budget before launch day.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="premium-button inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Try AdScore
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Demo mode ready</span>
            <span>Copy + creative + links</span>
            <span>Compare up to 4 ads</span>
          </div>
        </div>

        <div className="mobile-glass-preview rounded-xl border border-white/10 bg-white/[0.04] p-4 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Live score</span>
            <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-xs font-bold text-emerald-200">Recommended</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-cyan-200">82</span>
            <span className="pb-2 text-sm font-semibold text-slate-500">/100</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="mobile-glass-preview__bar h-full rounded-full bg-cyan-300" />
          </div>
        </div>

        <ScrollScene />
      </section>

      <section className="glass-section border-t border-white/10 bg-slate-950 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Value for money</p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">AdScore should pay for itself before launch.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Start free, validate the scoring, then upgrade only when you need more analyses, saved history, and reporting.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Free", "$0", "5 text/link analyses"],
              ["Plus", "$15", "Image analysis"],
              ["Pro", "$39", "750 credits"],
            ].map(([name, price, detail]) => (
              <div key={name} className="depth-card rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="text-sm font-bold text-slate-400">{name}</div>
                <div className="mt-3 text-3xl font-black">{price}</div>
                <div className="mt-2 text-sm text-slate-500">{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="scoring" className="glass-section border-t border-white/10 bg-slate-900/45 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">How scoring works</p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">A direct response scorecard, not a vanity grade.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {scoreParts.map((part) => (
              <div key={part.label} className="depth-card rounded-lg border border-white/10 bg-slate-950/70 p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
                  <BarChart3 size={18} />
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black leading-none">{part.score}</span>
                  <span className="pb-0.5 text-sm font-bold text-slate-500">/{part.max}</span>
                </div>
                <h3 className="mt-2 font-bold">{part.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{part.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <Target className="mt-1 text-cyan-300" size={20} />
              <p className="text-sm leading-6 text-slate-300">Strict scoring keeps weak ads from looking safer than they are.</p>
            </div>
            <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <GitCompareArrows className="mt-1 text-cyan-300" size={20} />
              <p className="text-sm leading-6 text-slate-300">Compare two ads side-by-side and run the higher-potential option.</p>
            </div>
            <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <CheckCircle2 className="mt-1 text-cyan-300" size={20} />
              <p className="text-sm leading-6 text-slate-300">Every result includes specific rewrites and CTA improvements.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
