import { NextResponse } from "next/server";

const SCORE_MAX = {
  platform_fit: 15,
  objective_fit: 15,
  audience_fit: 15,
  hook: 15,
  creative_strength: 15,
  clarity: 10,
  offer: 10,
  cta: 5,
};

const scoreKeys = Object.keys(SCORE_MAX);
const angles = ["Problem-solution", "Social proof", "Offer-driven", "Curiosity", "Educational", "UGC-style", "Brand awareness", "Other"];
const actions = ["Run", "Revise", "Reject"];
const confidenceLevels = ["Low", "Medium", "High"];

function cleanAd(input = {}, index = 0) {
  const creativeType = ["image", "video"].includes(input.creativeType) ? input.creativeType : "none";
  return {
    ad_id: input.ad_id || String.fromCharCode(65 + index),
    adCopy: String(input.adCopy || "").trim(),
    postLink: String(input.postLink || "").trim(),
    detectedPlatform: String(input.detectedPlatform || "").trim(),
    creativeType,
    creativeFilename: String(input.creativeFilename || "").trim(),
    hasCreativePreview: Boolean(input.hasCreativePreview),
    imageData: creativeType === "image" ? String(input.imageData || "") : "",
  };
}

function cleanContext(input = {}) {
  return {
    platform: String(input.platform || "Meta / Facebook / Instagram").trim(),
    objective: String(input.objective || "Conversions").trim(),
    audience: String(input.audience || "").trim(),
  };
}

function hasInput(ad) {
  return Boolean(ad.adCopy || ad.postLink || ad.creativeType !== "none");
}

function creativeLine(ad) {
  if (ad.creativeType === "video") return `Video creative uploaded: ${ad.creativeFilename || "unnamed file"}. Video creative uploaded, but deep video analysis is not available in this MVP.`;
  if (ad.creativeType === "image") return `Image creative uploaded: ${ad.creativeFilename || "unnamed file"}. Creative preview exists: ${ad.hasCreativePreview ? "yes" : "no"}.`;
  return "No creative uploaded.";
}

function buildSinglePrompt(context, ad) {
  return `Analyze this ad as a structured ad decision tool, not a generic chatbot.

Context:
- Platform: ${context.platform}
- Ad objective: ${context.objective}
- Target audience: ${context.audience || "Not provided"}
- Ad copy: ${ad.adCopy || "Not provided"}
- Ad post link: ${ad.postLink || "Not provided"}
- Platform detected from link: ${ad.detectedPlatform || "Not detected"}
- Creative type: ${ad.creativeType}
- Creative filename: ${ad.creativeFilename || "none"}
- Creative preview exists: ${ad.hasCreativePreview ? "yes" : "no"}
- Creative limitation: ${ad.creativeType === "video" ? "Video creative uploaded, but deep video analysis is not available in this MVP." : "If image details are visible, evaluate visual hierarchy, product visibility, contrast, readability, and face/person presence."}

Return JSON in this exact format:
{
  "overall_score": 0,
  "confidence": "Low | Medium | High",
  "recommended_action": "Run | Revise | Reject",
  "input_summary": { "has_copy": true, "has_creative": true, "creative_type": "image | video | none", "has_link": true },
  "scores": {
    "platform_fit": { "score": 0, "max": 15, "feedback": "" },
    "objective_fit": { "score": 0, "max": 15, "feedback": "" },
    "audience_fit": { "score": 0, "max": 15, "feedback": "" },
    "hook": { "score": 0, "max": 15, "feedback": "" },
    "creative_strength": { "score": 0, "max": 15, "feedback": "" },
    "clarity": { "score": 0, "max": 10, "feedback": "" },
    "offer": { "score": 0, "max": 10, "feedback": "" },
    "cta": { "score": 0, "max": 5, "feedback": "" }
  },
  "detected_angle": { "angle": "Problem-solution | Social proof | Offer-driven | Curiosity | Educational | UGC-style | Brand awareness | Other", "explanation": "" },
  "key_strengths": [],
  "critical_issues": [],
  "improvements": [],
  "hook_rewrites": [],
  "creative_recommendations": [],
  "final_verdict": ""
}

Rules:
- Scores must total 100 across the max values.
- Be strict. Do not inflate scores.
- Clearly separate copy analysis, creative analysis, landing/post context analysis, and overall recommendation.
- Feedback must be specific to platform, objective, audience, copy, creative, and link context provided.
- Do not scrape the post link. Treat it as context only.
- If video was uploaded, include: "Video creative uploaded, but deep video analysis is not available in this MVP."
- Avoid generic advice like "make it more engaging."
- Explain exactly what is weak and how to improve it.`;
}

function buildComparePrompt(context, ads) {
  return `Compare these ads for the same campaign. Do not pick the highest score blindly.

Campaign context:
- Platform: ${context.platform}
- Objective: ${context.objective}
- Target audience: ${context.audience || "Not provided"}

Ads:
${ads.map((ad) => `Ad ${ad.ad_id}:
- Copy: ${ad.adCopy || "Not provided"}
- Link: ${ad.postLink || "Not provided"}
- Platform detected from link: ${ad.detectedPlatform || "Not detected"}
- Creative: ${creativeLine(ad)}`).join("\n\n")}

Return JSON in this exact format:
{
  "campaign_context": { "platform": "", "objective": "", "target_audience": "" },
  "ads": [
    {
      "ad_id": "A",
      "overall_score": 0,
      "confidence": "Low | Medium | High",
      "recommended_action": "Run | Revise | Reject",
      "strongest_point": "",
      "weakest_point": "",
      "scores": {
        "platform_fit": 0,
        "objective_fit": 0,
        "audience_fit": 0,
        "hook": 0,
        "creative_strength": 0,
        "clarity": 0,
        "offer": 0,
        "cta": 0
      },
      "what_to_keep": [],
      "what_to_fix": [],
      "suggested_hook_rewrite": "",
      "creative_recommendation": ""
    }
  ],
  "ranking": [{ "rank": 1, "ad_id": "B", "score": 0, "reason": "" }],
  "winner": { "ad_id": "", "score": 0, "why_it_won": "", "remaining_risk": "" },
  "final_recommendation": "",
  "test_plan": { "primary_ad": "", "backup_ad": "", "testing_note": "" }
}

Rules:
- If two ads are within 5 points, recommend A/B testing instead of declaring a hard winner.
- If all ads score below 60, recommend revising all ads before running.
- If an ad has low confidence due to missing copy/creative/context, flag that clearly.
- If the winning ad has weak CTA or unclear offer, mention the risk.
- Consider score difference, confidence, objective fit, creative strength, offer clarity, targeting risk, and input completeness.`;
}

function inferConfidence(context, ad) {
  let points = 0;
  if (context.audience.split(/\s+/).filter(Boolean).length >= 5) points += 1;
  if (ad.adCopy.length >= 80) points += 1;
  if (ad.creativeType !== "none") points += 1;
  if (ad.postLink) points += 1;
  if (points >= 3) return "High";
  if (points >= 2) return "Medium";
  return "Low";
}

function detectAngle(adCopy, creativeType) {
  if (creativeType === "video" && /me|my|day|review|unbox|try/i.test(adCopy)) return "UGC-style";
  if (/\?|secret|why|what if/i.test(adCopy)) return "Curiosity";
  if (/review|trusted|customers|proof|case study|results/i.test(adCopy)) return "Social proof";
  if (/off|discount|free|bonus|limited|save|deal/i.test(adCopy)) return "Offer-driven";
  if (/how to|learn|guide|mistakes|tips/i.test(adCopy)) return "Educational";
  if (/brand|awareness|introducing|meet/i.test(adCopy)) return "Brand awareness";
  if (/tired|struggling|problem|fix|stop|without|wasting/i.test(adCopy)) return "Problem-solution";
  return "Other";
}

function confidencePenalty(confidence) {
  if (confidence === "Low") return 4;
  if (confidence === "Medium") return 1;
  return 0;
}

function mockSingle(context, ad) {
  const hasCopy = Boolean(ad.adCopy);
  const hasLinkValue = Boolean(ad.postLink);
  const hasCreative = ad.creativeType !== "none";
  const confidence = inferConfidence(context, ad);
  const copy = ad.adCopy;
  const hasCTA = /\b(shop|buy|book|start|get|claim|try|download|join|subscribe|schedule|learn|apply)\b/i.test(copy);
  const hasNumber = /\d|%|\$|£|€/.test(copy);
  const angle = detectAngle(copy, ad.creativeType);

  const scores = {
    platform_fit: section(9 + (hasCreative ? 2 : 0) + (context.platform === "TikTok" && copy.length < 220 ? 2 : 0), "Platform fit is limited by how native the ad feels for the selected placement and feed behavior."),
    objective_fit: section(8 + (hasCTA ? 3 : 0) + (context.objective === "Awareness" ? 1 : 0), `For ${context.objective}, the ad needs a clearer bridge between the message and the intended action.`),
    audience_fit: section(context.audience ? 11 : 5, context.audience ? "The audience context is usable, but the ad should call out their exact buying moment earlier." : "Audience fit is weak because the target audience was not specific enough."),
    hook: section((copy ? 8 : 3) + (/\?/.test(copy) ? 3 : 0) + (angle !== "Other" ? 2 : 0), hasCopy ? "The hook has a direction, but it needs sharper tension in the first line." : "No copy was provided, so hook quality can only be inferred from creative/link context."),
    creative_strength: section(hasCreative ? (ad.creativeType === "video" ? 7 : 10) : 4, hasCreative ? (ad.creativeType === "video" ? "Video creative uploaded, but deep video analysis is not available in this MVP." : "Image preview exists; check visual hierarchy, product visibility, and contrast before launch.") : "No creative was uploaded, so visual stopping power cannot be judged."),
    clarity: section(hasCopy ? 7 + (copy.length > 80 ? 1 : 0) : 4, hasCopy ? "The message is understandable, but the outcome could be more concrete." : "Without copy, clarity depends too much on the creative or post link."),
    offer: section(5 + (hasNumber ? 2 : 0), hasNumber ? "The offer has a concrete detail, but it needs stronger urgency or proof." : "The offer lacks a specific number, deadline, mechanism, or proof point."),
    cta: section(hasCTA ? 4 : 2, hasCTA ? "The CTA is present, but should repeat the promised outcome." : "The CTA is weak or missing, which can reduce response."),
  };

  function section(score, feedback) {
    return { score: Math.max(0, Math.min(15, score)), feedback };
  }
  scores.clarity.score = Math.min(10, scores.clarity.score);
  scores.offer.score = Math.min(10, scores.offer.score);
  scores.cta.score = Math.min(5, scores.cta.score);

  const total = totalScores(scores) - confidencePenalty(confidence);
  const recommended_action = total >= 78 && confidence !== "Low" ? "Run" : total >= 55 ? "Revise" : "Reject";

  return normalizeSingle({
    overall_score: total,
    confidence,
    recommended_action,
    input_summary: { has_copy: hasCopy, has_creative: hasCreative, creative_type: ad.creativeType, has_link: hasLinkValue },
    scores,
    detected_angle: {
      angle,
      explanation: `${angle}: The ad ${angle === "Other" ? "does not strongly commit to one persuasion angle yet" : "leans on this pattern based on its opening and offer structure"}.`,
    },
    key_strengths: [
      hasCopy ? "The ad has enough copy to judge the core message." : "The creative/link can still be used as context for a basic review.",
      hasCreative ? "Creative preview gives a starting point for visual recommendations." : "The analysis can focus tightly on copy and offer clarity.",
    ],
    critical_issues: [
      ...(confidence === "Low" ? ["Low confidence because copy, creative, audience, or link context is incomplete."] : []),
      ...(scores.cta.score < 4 ? ["CTA is too weak for a performance campaign."] : []),
      ...(scores.offer.score < 7 ? ["Offer is not concrete enough to make the click feel urgent."] : []),
    ],
    improvements: [
      `Make the first line specific to ${context.audience || "the target audience"}.`,
      `Tie the CTA directly to ${context.objective.toLowerCase()} instead of using a generic action.`,
      "Add a proof point, deadline, visual cue, or offer detail before spending budget.",
    ],
    hook_rewrites: [
      `${context.audience || "Your audience"}: stop wasting budget on ads that do not convert.`,
      `Before you run this on ${context.platform}, fix the hook first.`,
      `The fastest way to lose ad spend? Launching before the message is clear.`,
      `Still guessing which ad will work? Score it before you spend.`,
    ],
    creative_recommendations: [
      hasCreative ? "Make the product or outcome visible in the first frame." : "Upload a creative to evaluate visual hierarchy and stopping power.",
      ad.creativeType === "video" ? "Video creative uploaded, but deep video analysis is not available in this MVP." : "Use high contrast text overlay only if it clarifies the offer.",
      "Show a face/person if trust or relatability is important for the audience.",
    ],
    final_verdict: recommended_action === "Run" ? "Run this, but monitor CTA performance closely." : recommended_action === "Revise" ? "Revise before running. The idea is usable, but the execution is not ready to scale." : "Do not run this yet. The ad needs a clearer hook, offer, or creative before spending budget.",
  }, context, ad);
}

function totalScores(scores) {
  return scoreKeys.reduce((sum, key) => sum + Number(scores[key]?.score || 0), 0);
}

function normalizeSingle(value = {}, context = {}, ad = {}) {
  const scores = {};
  for (const key of scoreKeys) {
    const raw = value.scores?.[key] || {};
    scores[key] = {
      score: Math.max(0, Math.min(SCORE_MAX[key], Number(raw.score || 0))),
      max: SCORE_MAX[key],
      feedback: String(raw.feedback || "No feedback returned."),
    };
  }
  const overall = Math.max(0, Math.min(100, Number(value.overall_score || totalScores(scores))));
  const action = actions.includes(value.recommended_action) ? value.recommended_action : overall >= 78 ? "Run" : overall >= 55 ? "Revise" : "Reject";
  const angle = angles.includes(value.detected_angle?.angle) ? value.detected_angle.angle : detectAngle(ad.adCopy || "", ad.creativeType || "none");
  return {
    overall_score: overall,
    confidence: confidenceLevels.includes(value.confidence) ? value.confidence : inferConfidence(context, ad),
    recommended_action: action,
    input_summary: {
      has_copy: Boolean(value.input_summary?.has_copy ?? ad.adCopy),
      has_creative: Boolean(value.input_summary?.has_creative ?? ad.creativeType !== "none"),
      creative_type: ["image", "video", "none"].includes(value.input_summary?.creative_type) ? value.input_summary.creative_type : ad.creativeType || "none",
      has_link: Boolean(value.input_summary?.has_link ?? ad.postLink),
    },
    scores,
    detected_angle: { angle, explanation: String(value.detected_angle?.explanation || `${angle}: inferred from the ad copy and supplied context.`) },
    key_strengths: arrayOr(value.key_strengths, ["The ad has enough structure to evaluate."]),
    critical_issues: arrayOr(value.critical_issues, ["The ad needs sharper proof, CTA, or audience specificity before scaling."]),
    improvements: arrayOr(value.improvements, ["Clarify the hook, offer, and CTA before running."]),
    hook_rewrites: arrayOr(value.hook_rewrites, ["Stop wasting budget on ads your audience scrolls past."]),
    creative_recommendations: arrayOr(value.creative_recommendations, [ad.creativeType === "video" ? "Video creative uploaded, but deep video analysis is not available in this MVP." : "Improve visual hierarchy, contrast, and product visibility."]),
    final_verdict: String(value.final_verdict || `${action} this ad based on the current score and confidence.`),
  };
}

function arrayOr(value, fallback) {
  return Array.isArray(value) && value.length ? value.slice(0, 6).map(String) : fallback;
}

function parseJson(text) {
  return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim());
}

function imagePayload(ad) {
  if (!ad.imageData?.startsWith("data:image/")) return null;
  return { type: "image_url", image_url: { url: ad.imageData } };
}

async function analyzeWithOpenAI(context, ad, allowImageAnalysis = false) {
  const content = [{ type: "text", text: buildSinglePrompt(context, ad) }];
  // Free/demo plan rule: images are preview-only and must not be sent for AI analysis.
  // Future billing/auth should pass allowImageAnalysis=true only for Plus/Pro requests.
  const image = allowImageAnalysis ? imagePayload(ad) : null;
  if (image) content.push(image);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: "You are a strict direct response ad strategist. Return only valid JSON." }, { role: "user", content }],
    }),
  });
  if (!response.ok) throw new Error("OpenAI request failed.");
  const data = await response.json();
  return normalizeSingle(parseJson(data.choices?.[0]?.message?.content || "{}"), context, ad);
}

async function analyzeSingle(context, ad, allowImageAnalysis = false) {
  if (process.env.OPENAI_API_KEY) return analyzeWithOpenAI(context, ad, allowImageAnalysis);
  return mockSingle(context, ad);
}

function compareMock(context, ads) {
  const analyzed = ads.map((ad) => mockSingle(context, ad));
  const compareAds = analyzed.map((result, index) => {
    const sorted = scoreKeys.map((key) => [key, result.scores[key].score / result.scores[key].max]).sort((a, b) => b[1] - a[1]);
    return {
      ad_id: ads[index].ad_id,
      overall_score: result.overall_score,
      confidence: result.confidence,
      recommended_action: result.recommended_action,
      strongest_point: sorted[0][0].replaceAll("_", " "),
      weakest_point: sorted.at(-1)[0].replaceAll("_", " "),
      scores: Object.fromEntries(scoreKeys.map((key) => [key, result.scores[key].score])),
      what_to_keep: result.key_strengths.slice(0, 2),
      what_to_fix: result.critical_issues.slice(0, 3),
      suggested_hook_rewrite: result.hook_rewrites[0],
      creative_recommendation: result.creative_recommendations[0],
    };
  });
  const ranking = [...compareAds].sort((a, b) => b.overall_score - a.overall_score).map((ad, index) => ({
    rank: index + 1,
    ad_id: ad.ad_id,
    score: ad.overall_score,
    reason: `${ad.strongest_point} is stronger than its weakest area: ${ad.weakest_point}.`,
  }));
  const winner = ranking[0];
  const second = ranking[1];
  const allLow = ranking.every((item) => item.score < 60);
  const close = second && Math.abs(winner.score - second.score) <= 5;
  return {
    campaign_context: { platform: context.platform, objective: context.objective, target_audience: context.audience },
    ads: compareAds,
    ranking,
    winner: {
      ad_id: allLow ? "" : winner.ad_id,
      score: allLow ? 0 : winner.score,
      why_it_won: allLow ? "No ad is strong enough to recommend yet." : close ? `Ads ${winner.ad_id} and ${second.ad_id} are close, so this should be an A/B test rather than a hard winner.` : `Ad ${winner.ad_id} has the strongest combination of score, confidence, and campaign fit.`,
      remaining_risk: allLow ? "All ads need revision before spend." : "Check CTA clarity and offer specificity before increasing budget.",
    },
    final_recommendation: allLow ? "Do not run any yet — all need revision." : close ? `Test Ad ${winner.ad_id} and Ad ${second.ad_id}.` : `Run Ad ${winner.ad_id} first.`,
    test_plan: { primary_ad: allLow ? "" : winner.ad_id, backup_ad: second?.ad_id || "", testing_note: close ? "Scores are within 5 points, so split testing is safer." : "Start with the top ad and keep the runner-up as backup." },
  };
}

async function compareWithOpenAI(context, ads, allowImageAnalysis = false) {
  const content = [{ type: "text", text: buildComparePrompt(context, ads) }];
  // Free/demo plan rule: images are preview-only and must not be sent for AI analysis.
  // Future billing/auth should pass allowImageAnalysis=true only for Plus/Pro requests.
  if (allowImageAnalysis) {
    for (const ad of ads) {
      const image = imagePayload(ad);
      if (image) content.push({ type: "text", text: `Image creative for Ad ${ad.ad_id}` }, image);
    }
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: "You are a strict ad testing strategist. Return only valid JSON." }, { role: "user", content }],
    }),
  });
  if (!response.ok) throw new Error("OpenAI compare request failed.");
  const data = await response.json();
  return normalizeCompare(parseJson(data.choices?.[0]?.message?.content || "{}"), context, ads);
}

function normalizeCompare(value = {}, context, ads) {
  const fallback = compareMock(context, ads);
  const compareAds = Array.isArray(value.ads) && value.ads.length ? value.ads : fallback.ads;
  return {
    campaign_context: value.campaign_context || fallback.campaign_context,
    ads: compareAds.map((ad, index) => ({
      ad_id: String(ad.ad_id || ads[index]?.ad_id || String.fromCharCode(65 + index)),
      overall_score: Math.max(0, Math.min(100, Number(ad.overall_score || 0))),
      confidence: confidenceLevels.includes(ad.confidence) ? ad.confidence : "Low",
      recommended_action: actions.includes(ad.recommended_action) ? ad.recommended_action : "Revise",
      strongest_point: String(ad.strongest_point || "platform fit"),
      weakest_point: String(ad.weakest_point || "offer clarity"),
      scores: Object.fromEntries(scoreKeys.map((key) => [key, Math.max(0, Math.min(SCORE_MAX[key], Number(ad.scores?.[key] || 0)))])),
      what_to_keep: arrayOr(ad.what_to_keep, ["Keep the strongest message angle."]),
      what_to_fix: arrayOr(ad.what_to_fix, ["Fix the weakest score area before launch."]),
      suggested_hook_rewrite: String(ad.suggested_hook_rewrite || "Stop guessing which ad will convert."),
      creative_recommendation: String(ad.creative_recommendation || "Improve first-frame clarity and visual hierarchy."),
    })),
    ranking: Array.isArray(value.ranking) && value.ranking.length ? value.ranking : fallback.ranking,
    winner: value.winner || fallback.winner,
    final_recommendation: String(value.final_recommendation || fallback.final_recommendation),
    test_plan: value.test_plan || fallback.test_plan,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const context = cleanContext(body);
    const allowImageAnalysis = Boolean(body.allowImageAnalysis);

    if (body.compare) {
      const ads = (Array.isArray(body.ads) ? body.ads : []).slice(0, 4).map(cleanAd).filter(hasInput);
      if (ads.length < 2) return NextResponse.json({ error: "At least two ads need copy, creative, or a post link." }, { status: 400 });
      try {
        return NextResponse.json(process.env.OPENAI_API_KEY ? await compareWithOpenAI(context, ads, allowImageAnalysis) : compareMock(context, ads));
      } catch (error) {
        console.error("Compare AI failed, returning mock:", error);
        return NextResponse.json(compareMock(context, ads));
      }
    }

    const ad = cleanAd(body);
    if (!hasInput(ad)) return NextResponse.json({ error: "Provide ad copy, a creative upload, or an ad/post link." }, { status: 400 });
    try {
      return NextResponse.json(await analyzeSingle(context, ad, allowImageAnalysis));
    } catch (error) {
      console.error("Analyze AI failed, returning mock:", error);
      return NextResponse.json(mockSingle(context, ad));
    }
  } catch (error) {
    console.error("Analyze route error:", error);
    return NextResponse.json({ error: "Unable to analyze ad." }, { status: 500 });
  }
}
