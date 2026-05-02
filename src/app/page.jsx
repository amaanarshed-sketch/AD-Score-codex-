import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, GitCompareArrows, ShieldCheck, Sparkles, Target, X, Zap } from "lucide-react";
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

      <section className="hero-glass mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-14 pt-12 text-center md:pb-18 md:pt-16">
        <div className="max-w-5xl">
          <div className="glass-pill reveal-up mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
            <Zap size={15} />
            AI ad scoring for paid media teams
          </div>
          <div className="reveal-up reveal-delay-1 mb-5 flex items-center justify-center gap-3 text-xs font-bold text-slate-400">
            <div className="flex -space-x-2">
              {["A", "D", "N"].map((item) => (
                <span key={item} className="avatar-bubble flex h-8 w-8 items-center justify-center rounded-full border border-black bg-white text-[0.7rem] font-black text-black">
                  {item}
                </span>
              ))}
            </div>
            <span>Built for marketers who need a clean go/no-go decision.</span>
          </div>
          <h1 className="hero-title reveal-up reveal-delay-2 mx-auto max-w-5xl text-5xl font-black leading-[0.96] tracking-tight text-white md:text-7xl">
            Know which ad will{" "}
            <span className="hero-title__signal">win</span>{" "}
            <span className="hero-title__before">before</span>{" "}
            you spend money
          </h1>
          <p className="reveal-up reveal-delay-3 mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            Analyze your ad copy, creative, and campaign context before you launch. Get a clear score, verdict, and fixes in seconds.
          </p>
          <div className="reveal-up reveal-delay-4 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="premium-button app-floating-action inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Analyze Your Ad
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
          <div className="reveal-up reveal-delay-5 mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Auth connected</span>
            <span>Copy + image + video + links</span>
            <span>Compare up to 4 ads</span>
          </div>
        </div>

        <ScrollScene />

        <div className="home-platform-grid mt-8 grid w-full max-w-6xl grid-cols-2 gap-3 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:grid-cols-4">
          {["Meta", "TikTok", "Google", "LinkedIn"].map((platform) => (
            <span key={platform} className="platform-chip rounded-full px-5 py-3">{platform}</span>
          ))}
        </div>

        <div className="home-step-grid mt-5 grid w-full max-w-6xl gap-3 text-left md:grid-cols-3">
          {[
            ["01", "Drop the asset", "Copy, image, video, or post link."],
            ["02", "Get the verdict", "Run, revise, or reject with score reasons."],
            ["03", "Pick the winner", "Compare ads before spend gets real."],
          ].map(([number, title, detail]) => (
            <div key={number} className="bubble-card rounded-2xl border border-white/10 bg-black/35 p-5">
              <p className="font-mono text-xs font-black text-slate-500">{number}</p>
              <h3 className="mt-3 text-base font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-section border-t border-white/10 bg-slate-950 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Value for money</p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">Adnex should pay for itself before launch.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Start free, validate the scoring, then upgrade only when you need more analyses, saved history, and reporting.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Free", "$0", "5 text/link analyses"],
              ["Plus", "$15", "Image + video audits"],
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

      <section className="glass-section border-t border-white/10 bg-slate-950 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Why it feels different</p>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">Less guessing. More decision quality.</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="depth-card rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="mb-5 text-sm font-black text-slate-500">Generic AI score</p>
              <div className="space-y-4">
                {["Scores feel inflated", "Feedback sounds generic", "Creative and copy get mixed together", "No clear run/revise decision"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-slate-400">
                    <X size={16} className="text-slate-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="depth-card premium-panel rounded-2xl border border-white/10 bg-white/[0.055] p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">Adnex decision layer</p>
                <span className="rounded-full border border-white/10 bg-white px-3 py-1 text-xs font-black text-black">Premium</span>
              </div>
              <div className="space-y-4">
                {["Strict scoring by platform and objective", "Specific fixes under each score", "Separate copy, creative, link, and video context", "Run, revise, or reject verdict"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
                    <CheckCircle2 size={16} className="text-white" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
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
              <Sparkles className="mt-1 text-cyan-300" size={20} />
              <p className="text-sm leading-6 text-slate-300">Every result includes score reasons, rewrites, CTA improvements, and creative/video fixes.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
