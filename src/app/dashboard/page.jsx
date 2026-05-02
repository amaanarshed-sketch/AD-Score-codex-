"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, GitCompareArrows, Loader2, Settings2 } from "lucide-react";
import AdInputBlock, { apiAdPayload, emptyAdInput, validateAdInput } from "../../components/AdInputBlock";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../components/AuthProvider";
import { saveAnalysisHistory } from "../../lib/history";

const platforms = ["Meta / Facebook / Instagram", "TikTok", "Google Ads", "LinkedIn"];
const objectives = ["Conversions", "Leads", "Engagement", "Traffic", "Awareness"];

export default function DashboardPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [ad, setAd] = useState(emptyAdInput);
  const [platform, setPlatform] = useState(platforms[0]);
  const [platformSource, setPlatformSource] = useState({ type: "manual", label: "" });
  const [objective, setObjective] = useState(objectives[0]);
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    const validation = validateAdInput(ad);
    if (validation || ad.error) {
      setError(validation || ad.error);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const context = { platform, objective, audience };
      const token = await getAccessToken();
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...context, ...apiAdPayload(ad, "A") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed.");

      const storedAd = { ...ad, imageData: "", videoFrames: [], creativePreview: "" };
      sessionStorage.setItem("adnex:last-result", JSON.stringify({ result: data, ad: storedAd, context }));
      saveAnalysisHistory({
        type: "single",
        title: storedAd.adCopy?.slice(0, 72) || storedAd.creativeFilename || storedAd.postLink || "Single ad analysis",
        score: data.overall_score,
        action: data.recommended_action,
        confidence: data.confidence,
        platform,
        objective,
        audience,
        result: data,
        ad: storedAd,
      });
      router.push("/results");
    } catch (err) {
      setError(err.message || "Something went wrong. Mock data should still render if the API is reachable.");
    } finally {
      setLoading(false);
    }
  }

  function handlePlatformChange(nextPlatform) {
    setPlatform(nextPlatform);
    setPlatformSource({ type: "manual", label: "Selected manually" });
  }

  function handleAdChange(nextAd) {
    if (nextAd.detectedPlatform && nextAd.detectedPlatform !== ad.detectedPlatform) {
      setPlatform(nextAd.detectedPlatform);
      setPlatformSource({ type: "link", label: "Detected from ad link" });
    }
    setAd(nextAd);
  }

  return (
    <main className="app-page min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="app-eyebrow text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Single Analysis</p>
            <h1 className="app-title mt-3 text-3xl font-black tracking-tight md:text-5xl">Score one ad before launch.</h1>
            <p className="app-muted mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Provide copy, a creative, a post link, or any combination. Adnex will judge the campaign context and return a strict launch recommendation.
            </p>
          </div>
          <Link
            href="/compare"
            className="app-secondary-action inline-flex self-start items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <GitCompareArrows size={16} />
            Compare Ads
          </Link>
        </div>

        <section className="mx-auto max-w-5xl">
          <div className="app-card workbench-card mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="app-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
                <Settings2 size={17} />
              </span>
              <div>
                <p className="app-eyebrow text-xs font-black uppercase tracking-[0.16em] text-slate-400">Campaign Context</p>
                <h2 className="app-title text-lg font-black text-white">Set the basics</h2>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr_1.35fr]">
              <label className="block">
                <span className="app-label mb-2 block text-sm font-bold text-slate-200">Platform</span>
                <select
                  value={platform}
                  onChange={(event) => handlePlatformChange(event.target.value)}
                  className="app-control w-full rounded-lg border p-3 text-sm outline-none transition"
                >
                  {platforms.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                {platformSource.type === "link" ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
                    <BadgeCheck size={13} />
                    {platformSource.label}
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="app-label mb-2 block text-sm font-bold text-slate-200">Objective</span>
                <select
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  className="app-control w-full rounded-lg border p-3 text-sm outline-none transition"
                >
                  {objectives.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="app-label mb-2 block text-sm font-bold text-slate-200">Audience</span>
                <input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="Example: ecommerce shoppers in Sri Lanka"
                  className="app-control w-full rounded-lg border p-3 text-sm outline-none transition"
                />
              </label>
            </div>
          </div>

          <AdInputBlock title="Ad Input" value={ad} onChange={handleAdChange} />

          {error ? <p className="mt-4 rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}

          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="app-primary-action app-floating-action mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? <Loader2 className="animate-spin" size={17} /> : null}
            {loading ? "Analyzing..." : "Analyze Ad"}
          </button>
        </section>
      </section>
    </main>
  );
}
