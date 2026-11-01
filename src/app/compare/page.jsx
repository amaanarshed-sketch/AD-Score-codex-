"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import AdInputBlock, { apiAdPayload, emptyAdInput, validateAdInput } from "../../components/AdInputBlock";
import CampaignContextFields, { objectives, platforms } from "../../components/CampaignContextFields";
import Navbar from "../../components/Navbar";
import ProductStatus from "../../components/ProductStatus";
import { SCORE_SECTIONS, verdictTone } from "../../components/ScoreResult";
import { saveAnalysisHistory } from "../../lib/history";

function createAd(index) {
  return { ...emptyAdInput, id: String.fromCharCode(65 + index) };
}

function ratioColor(ratio) {
  if (ratio < 0.5) return "var(--rej)";
  if (ratio < 0.75) return "var(--rev)";
  return "var(--ink)";
}

function potentialClass(value) {
  if (value === "High") return "tone-run";
  if (value === "Medium") return "tone-rev";
  return value ? "tone-rej" : "";
}

function ScoreCell({ value = 0, max }) {
  const ratio = Math.max(0, Math.min(1, Number(value || 0) / max));
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 96 }}>
      <span className="num">{Number(value || 0)}<span style={{ color: "var(--ink3)", fontSize: 12 }}>/{max}</span></span>
      <div className="track"><div style={{ width: `${ratio * 100}%`, background: ratioColor(ratio) }} /></div>
    </div>
  );
}

function CompareResult({ result }) {
  const ads = result.ads || [];
  const winner = result.winner || {};
  const winnerAd = ads.find((ad) => ad.ad_id === winner.ad_id);

  return (
    <>
      <section className="section">
        <div className="reading">
          <div className="reading__head">
            <span>ADNEX COMPARISON · {ads.length} ADS</span>
            <span>{String(result.campaign_context?.platform || "").toUpperCase()}</span>
          </div>
          <div className="reading__body" style={{ paddingBottom: "clamp(20px, 3vw, 32px)" }}>
            <div className="reading__score">
              {winner.ad_id ? (
                <>
                  <span className="reading__number" style={{ fontSize: "clamp(96px, 14vw, 180px)" }}>{winner.ad_id}</span>
                  {winner.score ? <span className="reading__out-of">{winner.score}/100</span> : null}
                </>
              ) : (
                <>
                  <span className="reading__number" style={{ fontSize: "clamp(96px, 14vw, 180px)" }}>{result.ranking?.[0]?.score ?? 0}</span>
                  <span className="reading__out-of">/100 BEST</span>
                </>
              )}
            </div>
            <div className="reading__verdict-col">
              <div className="reading__verdict" style={{ "--tone": winner.ad_id ? "var(--dk-run)" : "var(--dk-rev)", fontSize: "clamp(40px, 5vw, 72px)" }}>
                {winner.ad_id ? `Run Ad ${winner.ad_id}` : "No winner"}
              </div>
              <p className="reading__summary">{winner.why_it_won}</p>
              {winner.remaining_risk ? <div className="reading__pattern"><strong>REMAINING RISK</strong><br />{winner.remaining_risk}</div> : null}
              {winnerAd?.video_verdict ? <div className="reading__pattern">VIDEO · {winnerAd.video_verdict}</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">Ranking</h2>
          <span className="meta">HIGHEST SCORE FIRST</span>
        </div>
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>Rank</th><th>Ad</th><th>Score</th><th>Verdict</th><th>Confidence</th><th>Attention</th><th>Conversion</th><th>Strongest</th><th>Weakest</th>
              </tr>
            </thead>
            <tbody>
              {(result.ranking || []).map((rank) => {
                const ad = ads.find((item) => item.ad_id === rank.ad_id);
                const verdict = ad?.verdict || ad?.recommended_action || "";
                return (
                  <tr key={rank.ad_id}>
                    <td className="num">{String(rank.rank).padStart(2, "0")}</td>
                    <td style={{ fontWeight: 500 }}>Ad {rank.ad_id}</td>
                    <td className="num">{rank.score}<span style={{ color: "var(--ink3)", fontSize: 12 }}>/100</span></td>
                    <td className={`tone-${verdictTone(verdict)}`} style={{ fontWeight: 500 }}>{verdict}</td>
                    <td>{ad?.confidence}</td>
                    <td className={potentialClass(ad?.attention_potential)}>{ad?.attention_potential || "—"}</td>
                    <td className={potentialClass(ad?.conversion_potential)}>{ad?.conversion_potential || "—"}</td>
                    <td style={{ color: "var(--ink2)" }}>{ad?.strongest_point}</td>
                    <td style={{ color: "var(--ink2)" }}>{ad?.weakest_point}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">Side by side</h2>
          <span className="meta">7 SCORE AREAS</span>
        </div>
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Score area</th>
                {ads.map((ad) => <th key={ad.ad_id}>Ad {ad.ad_id}</th>)}
              </tr>
            </thead>
            <tbody>
              {SCORE_SECTIONS.map((section) => (
                <tr key={section.id}>
                  <td style={{ fontWeight: 500 }}>{section.name}</td>
                  {ads.map((ad) => (
                    <td key={`${ad.ad_id}-${section.id}`}><ScoreCell value={ad.scores?.[section.id]} max={section.max} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">Test plan</h2>
        </div>
        <div className="checks" style={{ marginBottom: 20 }}>
          <div><span>Primary ad</span><span>{result.test_plan?.primary_ad ? `AD ${result.test_plan.primary_ad}` : "NONE"}</span></div>
          <div><span>Backup ad</span><span>{result.test_plan?.backup_ad ? `AD ${result.test_plan.backup_ad}` : "NONE"}</span></div>
        </div>
        <p className="h3" style={{ maxWidth: 820 }}>{result.final_recommendation}</p>
        {result.test_plan?.testing_note ? <p className="body" style={{ marginTop: 12, maxWidth: 720 }}>{result.test_plan.testing_note}</p> : null}
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">Improvement plans</h2>
        </div>
        <div className="cells" style={{ "--min": "320px" }}>
          {ads.map((ad) => (
            <article key={ad.ad_id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <h3 className="h3">Ad {ad.ad_id}</h3>
                <span className="num">{ad.overall_score}<span style={{ color: "var(--ink3)", fontSize: 12 }}>/100</span></span>
              </div>
              <div>
                <p className="eyebrow tone-run">KEEP</p>
                <ol className="numbered" style={{ marginTop: 10, gap: 10 }}>
                  {(ad.what_to_keep || []).map((item, index) => <li key={`${index}-${item}`}><span>{String(index + 1).padStart(2, "0")}</span><span>{item}</span></li>)}
                </ol>
              </div>
              <div>
                <p className="eyebrow tone-rej">FIX</p>
                <ol className="numbered" style={{ marginTop: 10, gap: 10 }}>
                  {(ad.what_to_fix || []).map((item, index) => <li key={`${index}-${item}`}><span>{String(index + 1).padStart(2, "0")}</span><span>{item}</span></li>)}
                </ol>
              </div>
              {ad.suggested_hook_rewrite ? <p className="quote" style={{ fontSize: 20, flex: "none" }}>“{ad.suggested_hook_rewrite}”</p> : null}
              <p className="small">{ad.video_verdict ? `${ad.video_verdict}: ` : ""}{ad.creative_recommendation}</p>
            </article>
          ))}
        </div>
      </section>
    </>
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
    <>
      <Navbar />
      <main className="shell page">
        <section className="page-head">
          <div>
            <p className="eyebrow">Compare · 2–4 ads</p>
            <h1 className="h1">Find the ad worth testing first.</h1>
            <p className="lede">Every ad is scored against the same campaign. When scores are close, Adnex tells you to split-test instead of faking a winner.</p>
          </div>
          <Link href="/dashboard" className="btn">Analyze a single ad</Link>
        </section>

        <section className="section" style={{ display: "grid", gap: 20 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h2 className="h2">Shared campaign</h2>
            <span className="meta">APPLIES TO EVERY AD</span>
          </div>
          <CampaignContextFields
            platform={platform}
            platformSource={platformSource}
            objective={objective}
            audience={audience}
            onPlatformChange={handlePlatformChange}
            onObjectiveChange={setObjective}
            onAudienceChange={setAudience}
          />
          <ProductStatus />
        </section>

        <section className="section" style={{ display: "grid", gap: 20 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h2 className="h2">Ads</h2>
            <button type="button" onClick={addAd} disabled={ads.length >= 4} className="btn">
              + Add ad ({ads.length}/4)
            </button>
          </div>
          <div className="grid-auto" style={{ "--min": "420px", "--gap": "20px" }}>
            {ads.map((ad, index) => (
              <AdInputBlock
                key={ad.id}
                title={`Ad ${ad.id}`}
                value={ad}
                onChange={(next) => updateAd(index, next)}
                onRemove={ads.length > 2 ? () => removeAd(index) : undefined}
              />
            ))}
          </div>

          {error ? <p className="notice notice--error">{error}</p> : null}

          <button type="button" onClick={compareAds} disabled={loading} className="btn btn--accent btn--lg btn--block">
            {loading ? <Loader2 className="spin" size={17} /> : null}
            {loading ? "Comparing…" : `Compare ${ads.length} ads →`}
          </button>
        </section>

        {result ? <CompareResult result={result} /> : null}
      </main>
    </>
  );
}
