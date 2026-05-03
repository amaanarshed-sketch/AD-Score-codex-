"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Loader2, Plus, Trash2, Trophy } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import BillingStatus from "../../components/BillingStatus";
import { useAuth } from "../../components/AuthProvider";
import AdInputBlock, { apiAdPayload, emptyAdInput, validateAdInput } from "../../components/AdInputBlock";
import Navbar from "../../components/Navbar";
import ProductStatus from "../../components/ProductStatus";
import { saveAnalysisHistory } from "../../lib/history";

const platforms = ["Meta / Facebook / Instagram", "TikTok", "Google Ads", "LinkedIn"];
const objectives = ["Conversions", "Leads", "Engagement", "Traffic", "Awareness"];
const scoreMax = {
  platform_fit: 15,
  objective_fit: 15,
  audience_fit: 15,
  hook: 15,
  creative_strength: 15,
  clarity: 10,
  offer: 10,
  cta: 5,
};
const scoreLabels = {
  platform_fit: "Platform Fit",
  objective_fit: "Objective Fit",
  audience_fit: "Audience Fit",
  hook: "Hook",
  creative_strength: "Creative Strength",
  clarity: "Clarity",
  offer: "Offer",
  cta: "CTA",
};

function createAd(index) {
  return { ...emptyAdInput, id: String.fromCharCode(65 + index) };
}

function actionStyle(action) {
  if (action === "Run") return "text-emerald-300";
  if (action === "Reject") return "text-rose-300";
  return "text-amber-300";
}

function ScoreCell({ value, max }) {
  const width = Math.max(0, Math.min(100, (Number(value || 0) / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-400">{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800">
        <div className="h-1.5 rounded-full bg-cyan-300" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { getAccessToken } = useAuth();
  const [platform, setPlatform] = useState(platforms[0]);
  const [platformSource, setPlatformSource] = useState({ type: "manual", label: "" });
  const [objective, setObjective] = useState(objectives[0]);
  const [audience, setAudience] = useState("");
  const [ads, setAds] = useState([createAd(0), createAd(1)]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usableAds = useMemo(() => ads.filter((ad) => !validateAdInput(ad)), [ads]);

  function handlePlatformChange(nextPlatform) {
    setPlatform(nextPlatform);
    setPlatformSource({ type: "manual", label: "Selected manually" });
  }

  function updateAd(index, next) {
    const adId = ads[index]?.id || String.fromCharCode(65 + index);
    if (next.detectedPlatform && next.detectedPlatform !== ads[index]?.detectedPlatform) {
      setPlatform(next.detectedPlatform);
      setPlatformSource({ type: "link", label: `Detected from Ad ${adId} link` });
    }
    setAds((current) => current.map((ad, itemIndex) => (itemIndex === index ? { ...next, id: ad.id } : ad)));
  }

  function addAd() {
    if (ads.length >= 4) return;
    setAds((current) => [...current, createAd(current.length)]);
  }

  function removeAd(index) {
    if (ads.length <= 2) return;
    setAds((current) => current.filter((_, itemIndex) => itemIndex !== index).map((ad, itemIndex) => ({ ...ad, id: String.fromCharCode(65 + itemIndex) })));
  }

  async function compareAds() {
    const invalid = ads.find((ad) => ad.error || (ad.postLink.trim() && validateAdInput(ad) === "Enter a valid URL for the ad/post link."));
    if (invalid) {
      setError(invalid.error || "Enter a valid URL for each ad/post link.");
      return;
    }
    if (usableAds.length < 2) {
      setError("Provide copy, creative, or a post link for at least two ads.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          compare: true,
          platform,
          objective,
          audience,
          ads: ads.map((ad) => apiAdPayload(ad, ad.id)),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Compare analysis failed.");
      setResult(data);
      saveAnalysisHistory({
        type: "compare",
        title: `Compare ${usableAds.length} ads`,
        score: data.winner?.score || data.ranking?.[0]?.score || 0,
        action: data.final_recommendation,
        confidence: data.ads?.some((item) => item.confidence === "Low") ? "Mixed" : "High",
        platform,
        objective,
        audience,
        result: data,
      });
    } catch (err) {
      setError(err.message || "Something went wrong while comparing ads.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white">
              <ArrowLeft size={16} />
              Back to single analysis
            </Link>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Compare Ads</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Find the strongest ad to test.</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Compare two to four ads using the same campaign context. Close scores become test recommendations instead of fake certainty.
            </p>
          </div>
          <button
            type="button"
            onClick={addAd}
            disabled={ads.length >= 4}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Plus size={16} />
            Add Ad
          </button>
        </div>

        <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-slate-400">Shared Campaign Context</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">Platform</span>
              <select value={platform} onChange={(event) => handlePlatformChange(event.target.value)} className="app-control w-full rounded-lg border p-3 text-sm outline-none transition">
                {platforms.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              {platformSource.type === "link" ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
                  <BadgeCheck size={13} />
                  {platformSource.label}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-500">Paste a supported ad link to auto-detect, or select manually for copy/creative-only ads.</p>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">Ad Objective</span>
              <select value={objective} onChange={(event) => setObjective(event.target.value)} className="app-control w-full rounded-lg border p-3 text-sm outline-none transition">
                {objectives.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">Target Audience</span>
              <input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Example: small business owners in Sri Lanka, gym beginners..." className="app-control w-full rounded-lg border p-3 text-sm outline-none transition" />
            </label>
          </div>
          <div className="mt-5">
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <AuthCard />
              <BillingStatus compact />
            </div>
            <ProductStatus />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          {ads.map((ad, index) => (
            <div key={ad.id} className="relative">
              {ads.length > 2 ? (
                <button type="button" onClick={() => removeAd(index)} className="absolute right-3 top-3 z-10 rounded-lg border border-white/10 bg-slate-950/90 p-2 text-slate-300 hover:bg-white/10" aria-label={`Remove Ad ${ad.id}`}>
                  <Trash2 size={15} />
                </button>
              ) : null}
              <AdInputBlock title={`Ad ${ad.id} Input`} value={ad} onChange={(next) => updateAd(index, next)} />
            </div>
          ))}
        </div>

        {error ? <p className="mt-4 rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}

        <button
          type="button"
          onClick={compareAds}
          disabled={loading}
          className="app-primary-action app-floating-action mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? <Loader2 className="animate-spin" size={17} /> : null}
          {loading ? "Comparing..." : "Compare Ads"}
        </button>

        {result ? (
          <section className="mt-10 space-y-6">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-slate-400">Ranking Table</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="py-3 pr-4">Rank</th>
                        <th className="py-3 pr-4">Ad</th>
                        <th className="py-3 pr-4">Score</th>
                        <th className="py-3 pr-4">Action</th>
                        <th className="py-3 pr-4">Confidence</th>
                        <th className="py-3 pr-4">Attention</th>
                        <th className="py-3 pr-4">Conversion</th>
                        <th className="py-3 pr-4">Strongest</th>
                        <th className="py-3">Weakest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.ranking || []).map((rank) => {
                        const ad = result.ads?.find((item) => item.ad_id === rank.ad_id);
                        return (
                          <tr key={rank.ad_id} className="border-t border-white/10">
                            <td className="py-3 pr-4 font-black text-cyan-300">#{rank.rank}</td>
                            <td className="py-3 pr-4 font-bold text-white">Ad {rank.ad_id}</td>
                            <td className="py-3 pr-4 font-bold">{rank.score}/100</td>
                            <td className={`py-3 pr-4 font-bold ${actionStyle(ad?.recommended_action)}`}>{ad?.recommended_action}</td>
                            <td className="py-3 pr-4 text-slate-300">{ad?.confidence}</td>
                            <td className="py-3 pr-4 text-slate-300">{ad?.attention_potential || "N/A"}</td>
                            <td className="py-3 pr-4 text-slate-300">{ad?.conversion_potential || "N/A"}</td>
                            <td className="py-3 pr-4 text-slate-300">{ad?.strongest_point}</td>
                            <td className="py-3 text-slate-300">{ad?.weakest_point}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-5">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-emerald-200">
                  <Trophy size={16} />
                  Winner Card
                </p>
                <h2 className="mt-3 text-3xl font-black text-white">
                  {result.winner?.ad_id ? `Ad ${result.winner.ad_id}` : "No winner yet"}
                  {result.winner?.score ? <span className="text-emerald-300"> · {result.winner.score}/100</span> : null}
                </h2>
                <p className="mt-4 text-sm leading-6 text-emerald-50/85">{result.winner?.why_it_won}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{result.winner?.remaining_risk}</p>
              </section>
            </div>

            <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-slate-400">Side-by-Side Score Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="py-3 pr-4">Score Area</th>
                      {(result.ads || []).map((ad) => <th key={ad.ad_id} className="py-3 pr-4">Ad {ad.ad_id}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(scoreLabels).map(([key, label]) => (
                      <tr key={key} className="border-t border-white/10">
                        <td className="py-4 pr-4 font-bold text-white">{label}</td>
                        {(result.ads || []).map((ad) => (
                          <td key={`${ad.ad_id}-${key}`} className="py-4 pr-4">
                            <ScoreCell value={ad.scores?.[key]} max={scoreMax[key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-200">Final Recommendation</h2>
                <p className="mt-3 text-lg font-black text-white">{result.final_recommendation}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Primary: {result.test_plan?.primary_ad || "None"} · Backup: {result.test_plan?.backup_ad || "None"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{result.test_plan?.testing_note}</p>
              </div>

              <div className="grid gap-4">
                {(result.ads || []).map((ad) => (
                  <article key={ad.ad_id} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                    <h3 className="text-lg font-black text-white">Improvement Plan · Ad {ad.ad_id}</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-300">Keep</p>
                        <ul className="space-y-2 text-sm leading-6 text-slate-300">
                          {(ad.what_to_keep || []).map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-rose-300">Fix</p>
                        <ul className="space-y-2 text-sm leading-6 text-slate-300">
                          {(ad.what_to_fix || []).map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <p className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm font-semibold leading-6 text-slate-200">{ad.suggested_hook_rewrite}</p>
                      <p className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-300">
                        {ad.video_verdict ? `${ad.video_verdict}: ` : ""}
                        {ad.creative_recommendation}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        ) : null}
      </section>
    </main>
  );
}
