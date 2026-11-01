"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdInputBlock, { apiAdPayload, emptyAdInput, validateAdInput } from "../../components/AdInputBlock";
import CampaignContextFields, { objectives, platforms } from "../../components/CampaignContextFields";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../components/AuthProvider";
import { saveAnalysisHistory } from "../../lib/history";

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
      const createdAt = new Date().toISOString();
      sessionStorage.setItem("adnex:last-result", JSON.stringify({ result: data, ad: storedAd, context, createdAt }));
      saveAnalysisHistory({
        type: "single",
        title: storedAd.adCopy?.slice(0, 72) || storedAd.creativeFilename || storedAd.postLink || "Single ad analysis",
        score: data.overall_score,
        action: data.verdict || data.recommended_action,
        confidence: data.confidence,
        platform,
        objective,
        audience,
        result: data,
        ad: storedAd,
      });
      router.push("/results");
    } catch (err) {
      setError(err.message || "Something went wrong while analyzing the ad.");
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
    <>
      <Navbar />
      <main className="shell page">
        <section className="page-head">
          <div>
            <p className="eyebrow">Analyze · Single ad</p>
            <h1 className="h1">Score one ad before it spends a dollar.</h1>
            <p className="lede">Add copy, a creative, a post link, or any mix. Adnex reads it against your campaign and returns Run, Revise or Reject.</p>
          </div>
          <Link href="/compare" className="btn">Compare 2–4 ads instead</Link>
        </section>

        <section className="section" style={{ display: "grid", gap: 20 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h2 className="h2">Campaign</h2>
            <span className="meta">STEP 01 OF 02</span>
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
        </section>

        <section className="section" style={{ display: "grid", gap: 20, borderBottom: 0 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h2 className="h2">Ad</h2>
            <span className="meta">STEP 02 OF 02</span>
          </div>
          <AdInputBlock title="Ad A" value={ad} onChange={handleAdChange} />

          {error ? <p className="notice notice--error">{error}</p> : null}

          <button type="button" onClick={analyze} disabled={loading} className="btn btn--accent btn--lg btn--block">
            {loading ? <Loader2 className="spin" size={17} /> : null}
            {loading ? "Analyzing…" : "Analyze ad →"}
          </button>
        </section>
      </main>
    </>
  );
}
