"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, GitCompareArrows, Loader2, Sparkles } from "lucide-react";
import AdInputBlock, { apiAdPayload, emptyAdInput, validateAdInput } from "../../components/AdInputBlock";
import Navbar from "../../components/Navbar";
import ProductStatus from "../../components/ProductStatus";
import { saveAnalysisHistory } from "../../lib/history";

const platforms = ["Meta / Facebook / Instagram", "TikTok", "Google Ads", "LinkedIn"];
const objectives = ["Conversions", "Leads", "Engagement", "Traffic", "Awareness"];

export default function DashboardPage() {
  const router = useRouter();
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
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...context, ...apiAdPayload(ad, "A") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed.");

      const storedAd = { ...ad, imageData: "", creativePreview: "" };
      sessionStorage.setItem("adscore:last-result", JSON.stringify({ result: data, ad: storedAd, context }));
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
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Single Analysis</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Score one ad before launch.</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Provide copy, a creative, a post link, or any combination. AdScore will judge the campaign context and return a strict launch recommendation.
            </p>
          </div>
          <Link
            href="/compare"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <GitCompareArrows size={16} />
            Compare Ads
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-200">Platform</span>
                <select
                  value={platform}
                  onChange={(event) => handlePlatformChange(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
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
                ) : (
                  <p className="mt-2 text-xs leading-5 text-slate-500">Copy or creative-only ads need a manual platform choice.</p>
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-200">Ad Objective</span>
                <select
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                >
                  {objectives.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-200">Target Audience</span>
                <input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="Example: small business owners in Sri Lanka, gym beginners, new parents, ecommerce shoppers"
                  className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
                />
              </label>
            </div>

            <ProductStatus />
          </aside>

          <section>
            <AdInputBlock title="Ad Input" value={ad} onChange={handleAdChange} />

            {error ? <p className="mt-4 rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}

            <button
              type="button"
              onClick={analyze}
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
              {loading ? "Analyzing..." : "Analyze Ad"}
              {!loading ? <ArrowRight size={17} /> : null}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}
