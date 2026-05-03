import { NextResponse } from "next/server";
import { authorizeAnalysisRequest, refundUsage, reserveUsage } from "../../../lib/billingServer";
import {
  buildCompareAdsUserPrompt,
  buildSingleAdUserPrompt,
  buildVideoHookAuditUserPrompt,
  compareAdsSystemPrompt,
  singleAdSystemPrompt,
  videoHookAuditSystemPrompt,
} from "../../../lib/prompts/adnex-scoring-engine";

const SINGLE_OUTPUT_TOKENS = 500;
const VIDEO_OUTPUT_TOKENS = 600;
const COMPARE_OUTPUT_TOKENS = 700;
const TEXT_LIMIT = 1500;
const CONTEXT_LIMIT = 300;
const LINK_LIMIT = 500;
const MAX_VIDEO_FRAMES = 4;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const rateBuckets = new Map();

const SCORE_MAX = {
  platform_fit: 15,
  objective_fit: 15,
  audience_fit: 15,
  hook_strength: 20,
  creative_strength: 15,
  offer_clarity: 10,
  cta_strength: 10,
};

const scoreKeys = Object.keys(SCORE_MAX);
const actions = ["Run", "Revise", "Reject"];
const confidenceLevels = ["Low", "Medium", "High"];
const videoPotentials = ["Low", "Medium", "High"];
const videoVerdicts = ["Strong hook, weak conversion", "Weak scroll-stop", "Strong overall", "Revise opening", "Improve offer clarity"];
const performancePatterns = ["Strong overall", "Strong attention, weak conversion", "Weak attention, strong offer", "Weak hook", "Unclear offer", "Weak CTA", "Poor audience fit", "Reject before spending"];

const scoreSectionSchema = () => ({
  type: "object",
  additionalProperties: false,
  required: ["score", "max", "feedback"],
  properties: {
    score: { type: "number" },
    max: { type: "number" },
    feedback: { type: "string" },
  },
});

const videoSectionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "feedback"],
  properties: {
    score: { type: "number" },
    feedback: { type: "string" },
  },
};

const videoHookAuditSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "analysis_mode",
    "frame_count",
    "hook_strength",
    "visual_clarity",
    "offer_visibility",
    "creative_structure",
    "cta_visibility",
    "attention_potential",
    "conversion_potential",
    "video_verdict",
    "limitations",
  ],
  properties: {
    analysis_mode: { type: "string", enum: ["sampled_key_frames", "limited_video_context", "none"] },
    frame_count: { type: "number" },
    hook_strength: videoSectionSchema,
    visual_clarity: videoSectionSchema,
    offer_visibility: videoSectionSchema,
    creative_structure: videoSectionSchema,
    cta_visibility: videoSectionSchema,
    attention_potential: { type: "string", enum: videoPotentials },
    conversion_potential: { type: "string", enum: videoPotentials },
    video_verdict: { type: "string" },
    limitations: { type: "string" },
  },
};

const singleAdSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_score",
    "verdict",
    "confidence",
    "performance_pattern",
    "attention_potential",
    "conversion_potential",
    "scores",
    "key_strengths",
    "critical_issues",
    "improvements",
    "hook_rewrites",
    "final_verdict",
  ],
  properties: {
    overall_score: { type: "number" },
    verdict: { type: "string", enum: actions },
    confidence: { type: "string", enum: confidenceLevels },
    performance_pattern: { type: "string", enum: performancePatterns },
    attention_potential: { type: "string", enum: videoPotentials },
    conversion_potential: { type: "string", enum: videoPotentials },
    scores: {
      type: "object",
      additionalProperties: false,
      required: scoreKeys,
      properties: {
        platform_fit: scoreSectionSchema(),
        objective_fit: scoreSectionSchema(),
        audience_fit: scoreSectionSchema(),
        hook_strength: scoreSectionSchema(),
        creative_strength: scoreSectionSchema(),
        offer_clarity: scoreSectionSchema(),
        cta_strength: scoreSectionSchema(),
      },
    },
    key_strengths: { type: "array", items: { type: "string" } },
    critical_issues: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    hook_rewrites: { type: "array", items: { type: "string" } },
    final_verdict: { type: "string" },
  },
};

const singleAdWithVideoSchema = {
  ...singleAdSchema,
  required: [...singleAdSchema.required, "video_hook_audit"],
  properties: {
    ...singleAdSchema.properties,
    video_hook_audit: videoHookAuditSchema,
  },
};

const compareAdsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["campaign_context", "ads", "ranking", "winner", "final_recommendation", "test_plan"],
  properties: {
    campaign_context: {
      type: "object",
      additionalProperties: false,
      required: ["platform", "objective", "target_audience"],
      properties: {
        platform: { type: "string" },
        objective: { type: "string" },
        target_audience: { type: "string" },
      },
    },
    ads: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ad_id", "overall_score", "verdict", "confidence", "performance_pattern", "attention_potential", "conversion_potential", "strongest_point", "weakest_point", "scores", "what_to_keep", "what_to_fix", "suggested_hook_rewrite", "creative_recommendation"],
        properties: {
          ad_id: { type: "string" },
          overall_score: { type: "number" },
          verdict: { type: "string", enum: actions },
          confidence: { type: "string", enum: confidenceLevels },
          performance_pattern: { type: "string" },
          attention_potential: { type: "string", enum: videoPotentials },
          conversion_potential: { type: "string", enum: videoPotentials },
          strongest_point: { type: "string" },
          weakest_point: { type: "string" },
          scores: {
            type: "object",
            additionalProperties: false,
            required: scoreKeys,
            properties: Object.fromEntries(scoreKeys.map((key) => [key, { type: "number" }])),
          },
          what_to_keep: { type: "array", items: { type: "string" } },
          what_to_fix: { type: "array", items: { type: "string" } },
          suggested_hook_rewrite: { type: "string" },
          creative_recommendation: { type: "string" },
        },
      },
    },
    ranking: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rank", "ad_id", "score", "reason"],
        properties: {
          rank: { type: "number" },
          ad_id: { type: "string" },
          score: { type: "number" },
          reason: { type: "string" },
        },
      },
    },
    winner: {
      type: "object",
      additionalProperties: false,
      required: ["ad_id", "score", "why_it_won", "remaining_risk"],
      properties: {
        ad_id: { type: "string" },
        score: { type: "number" },
        why_it_won: { type: "string" },
        remaining_risk: { type: "string" },
      },
    },
    final_recommendation: { type: "string" },
    test_plan: {
      type: "object",
      additionalProperties: false,
      required: ["primary_ad", "backup_ad", "testing_note"],
      properties: {
        primary_ad: { type: "string" },
        backup_ad: { type: "string" },
        testing_note: { type: "string" },
      },
    },
  },
};

function jsonSchemaFormat(name, schema) {
  return { type: "json_schema", name, strict: true, schema };
}

function compactText(value = "", limit = TEXT_LIMIT) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function cleanAd(input = {}, index = 0) {
  const creativeType = ["image", "video"].includes(input.creativeType) ? input.creativeType : "none";
  return {
    ad_id: input.ad_id || String.fromCharCode(65 + index),
    adCopy: compactText(input.adCopy, TEXT_LIMIT),
    postLink: compactText(input.postLink, LINK_LIMIT),
    detectedPlatform: compactText(input.detectedPlatform, CONTEXT_LIMIT),
    creativeType,
    creativeFilename: compactText(input.creativeFilename, CONTEXT_LIMIT),
    hasCreativePreview: Boolean(input.hasCreativePreview),
    videoDuration: Math.max(0, Math.round(Number(input.videoDuration || 0))),
    imageData: creativeType === "image" ? String(input.imageData || "") : "",
    videoFrames: creativeType === "video" && Array.isArray(input.videoFrames) ? input.videoFrames.filter((frame) => String(frame).startsWith("data:image/")).slice(0, MAX_VIDEO_FRAMES) : [],
    videoAnalysisMode: ["sampled_key_frames", "sampled_frames"].includes(input.videoAnalysisMode) ? "sampled_key_frames" : "none",
    videoFrameExtractionFailed: Boolean(input.videoFrameExtractionFailed),
  };
}

function cleanContext(input = {}) {
  return {
    platform: compactText(input.platform || "Meta / Facebook / Instagram", CONTEXT_LIMIT),
    objective: compactText(input.objective || "Conversions", CONTEXT_LIMIT),
    audience: compactText(input.audience, CONTEXT_LIMIT),
  };
}

function hasInput(ad) {
  return Boolean(ad.adCopy || ad.postLink || ad.creativeType !== "none");
}

function inferConfidence(context, ad) {
  let points = 0;
  if (context.audience.split(/\s+/).filter(Boolean).length >= 5) points += 1;
  if (ad.adCopy.length >= 80) points += 1;
  if (ad.creativeType !== "none") points += 1;
  if (ad.postLink) points += 1;
  if (ad.creativeType === "video" && !ad.videoFrames?.length) points -= 1;
  if (ad.videoFrameExtractionFailed) points -= 1;
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

function potentialFromScore(score) {
  if (score >= 75) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

function performancePatternFrom(scores, overall = 0) {
  const hookPercent = (scores.hook_strength?.score || 0) / SCORE_MAX.hook_strength;
  const offerPercent = (scores.offer_clarity?.score || 0) / SCORE_MAX.offer_clarity;
  const ctaPercent = (scores.cta_strength?.score || 0) / SCORE_MAX.cta_strength;
  const audiencePercent = (scores.audience_fit?.score || 0) / SCORE_MAX.audience_fit;
  const attentionStrong = hookPercent >= 0.75 && (scores.creative_strength?.score || 0) / SCORE_MAX.creative_strength >= 0.7;
  const conversionStrong = offerPercent >= 0.75 && ctaPercent >= 0.75;
  if (overall < 55) return "Reject before spending";
  if (audiencePercent < 0.5) return "Poor audience fit";
  if (hookPercent < 0.5) return "Weak hook";
  if (offerPercent < 0.55) return "Unclear offer";
  if (ctaPercent < 0.55) return "Weak CTA";
  if (attentionStrong && !conversionStrong) return "Strong attention, weak conversion";
  if (!attentionStrong && conversionStrong) return "Weak attention, strong offer";
  if (overall >= 80 && conversionStrong) return "Strong overall";
  return "Unclear offer";
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

  const isVideo = ad.creativeType === "video";
  const videoHookAudit = buildVideoHookAudit(context, ad, { hasCopy, hasCTA, angle });

  const scores = {
    platform_fit: section(9 + (hasCreative ? 2 : 0) + (context.platform === "TikTok" && copy.length < 220 ? 2 : 0), 15, "Platform fit is limited by how native the ad feels for the selected placement and feed behavior."),
    objective_fit: section(8 + (hasCTA ? 3 : 0) + (context.objective === "Awareness" ? 1 : 0), 15, `For ${context.objective}, the ad needs a clearer bridge between the message and the intended action.`),
    audience_fit: section(context.audience ? 11 : 5, 15, context.audience ? "The audience context is usable, but the ad should call out their exact buying moment earlier." : "Audience fit is weak because the target audience was not specific enough."),
    hook_strength: section((copy ? 10 : 4) + (/\?/.test(copy) ? 4 : 0) + (angle !== "Other" ? 3 : 0), 20, hasCopy ? "The hook has a direction, but it needs sharper tension in the first line." : "No copy was provided, so hook strength can only be inferred from creative/link context."),
    creative_strength: section(hasCreative ? (isVideo ? 11 : 10) : 4, 15, hasCreative ? (isVideo ? "Video Hook Audit checks sampled key frames for scroll-stop potential, visual clarity, offer visibility, and CTA visibility." : "Image preview exists; check visual hierarchy, product visibility, and contrast before launch.") : "No creative was uploaded, so visual stopping power cannot be judged."),
    offer_clarity: section(5 + (hasNumber ? 2 : 0), 10, hasNumber ? "The offer has a concrete detail, but it needs stronger urgency or proof." : "The offer lacks a specific number, deadline, mechanism, or proof point."),
    cta_strength: section(hasCTA ? 7 : 3, 10, hasCTA ? "The CTA is present, but should repeat the promised outcome." : "The CTA is weak or missing, which can reduce response."),
  };

  function section(score, max, feedback) {
    return { score: Math.max(0, Math.min(max, score)), max, feedback };
  }

  const total = totalScores(scores) - confidencePenalty(confidence);
  const hasMajorWeakness = scores.hook_strength.score < 10 || scores.offer_clarity.score < 6 || scores.cta_strength.score < 6;
  const verdict = total >= 80 && !hasMajorWeakness && confidence !== "Low" ? "Run" : total >= 60 ? "Revise" : "Reject";
  const performance_pattern = performancePatternFrom(scores, total);
  const attention_potential = potentialFromScore(((scores.hook_strength.score / 20) * 60) + ((scores.creative_strength.score / 15) * 40));
  const conversion_potential = potentialFromScore(((scores.offer_clarity.score / 10) * 50) + ((scores.cta_strength.score / 10) * 50));

  return normalizeSingle({
    overall_score: total,
    confidence,
    verdict,
    performance_pattern,
    attention_potential,
    conversion_potential,
    input_summary: { has_copy: hasCopy, has_creative: hasCreative, creative_type: ad.creativeType, has_link: hasLinkValue },
    scores,
    key_strengths: [
      hasCopy ? "The ad has enough copy to judge the core message." : "The creative/link can still be used as context for a basic review.",
      hasCreative ? "Creative preview gives a starting point for visual recommendations." : "The analysis can focus tightly on copy and offer clarity.",
      ...(ad.videoFrameExtractionFailed ? ["Frame extraction failed, so video confidence is limited."] : []),
    ],
    critical_issues: [
      ...(confidence === "Low" ? ["Low confidence because copy, creative, audience, or link context is incomplete."] : []),
      ...(scores.cta_strength.score < 6 ? ["CTA is too weak for a performance campaign."] : []),
      ...(scores.offer_clarity.score < 7 ? ["Offer is not concrete enough to make the click feel urgent."] : []),
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
      ad.creativeType === "video" ? "Make the first 1-3 seconds show the pain, result, offer, or CTA." : "Use high contrast text overlay only if it clarifies the offer.",
      "Show a face/person if trust or relatability is important for the audience.",
    ],
    video_hook_audit: videoHookAudit,
    final_verdict: verdict === "Run" ? "Run this, but monitor CTA performance closely." : verdict === "Revise" ? "Revise before running. The idea is usable, but the execution is not ready to scale." : "Do not run this yet. The ad needs a clearer hook, offer, or creative before spending budget.",
  }, context, ad);
}

function buildVideoHookAudit(context, ad, signals = {}) {
  const limitations = "Based on sampled key frames only. Audio/transcript/full video sequence not analyzed.";
  if (ad.creativeType !== "video") {
    return {
      analysis_mode: "none",
      frame_count: 0,
      hook_strength: videoSection(0, 30, "No video was provided, so opening-frame hook strength cannot be judged."),
      visual_clarity: videoSection(0, 20, "No video was provided, so visual clarity cannot be judged."),
      offer_visibility: videoSection(0, 20, "No video was provided, so offer visibility cannot be judged."),
      creative_structure: videoSection(0, 15, "No video was provided, so opening structure cannot be judged."),
      cta_visibility: videoSection(0, 15, "No video was provided, so CTA visibility cannot be judged."),
      attention_potential: "Low",
      conversion_potential: "Low",
      video_verdict: "Revise opening",
      limitations,
    };
  }

  const isShort = ad.videoDuration > 0 && ad.videoDuration <= 35;
  const tiktokLike = context.platform === "TikTok" || /instagram|facebook/i.test(context.platform);
  const hasFrames = ad.videoFrames?.length > 0;
  const hookScore = Math.min(30, 12 + (hasFrames ? 5 : 0) + (signals.hasCopy ? 5 : 0) + (signals.angle !== "Other" ? 5 : 0) + (isShort ? 2 : 0));
  const clarityScore = Math.min(20, 8 + (hasFrames ? 4 : 0) + (signals.hasCopy ? 4 : 0) + (tiktokLike ? 1 : 0));
  const offerScore = Math.min(20, 7 + (signals.hasCopy ? 4 : 0) + (context.audience ? 3 : 0));
  const structureScore = Math.min(15, 6 + (hasFrames ? 3 : 0) + (isShort ? 3 : 0) + (signals.angle !== "Other" ? 2 : 0));
  const ctaScore = Math.min(15, signals.hasCTA ? 10 : 5);
  const attentionTotal = hookScore + clarityScore + structureScore;
  const conversionTotal = offerScore + ctaScore + (signals.hasCopy ? 8 : 3);
  const attention_potential = attentionTotal >= 55 ? "High" : attentionTotal >= 38 ? "Medium" : "Low";
  const conversion_potential = conversionTotal >= 35 ? "High" : conversionTotal >= 24 ? "Medium" : "Low";
  const video_verdict = attention_potential === "High" && conversion_potential !== "High"
    ? "Strong hook, weak conversion"
    : attention_potential === "Low"
      ? "Weak scroll-stop"
      : attention_potential === "High" && conversion_potential === "High"
        ? "Strong overall"
        : conversion_potential === "Low"
          ? "Improve offer clarity"
          : "Revise opening";

  return {
    analysis_mode: hasFrames ? "sampled_key_frames" : "limited_video_context",
    frame_count: ad.videoFrames?.length || 0,
    hook_strength: videoSection(hookScore, 30, signals.hasCopy ? "The opening has enough message context, but the first frame still needs a sharper visual or text cue." : "The opening needs a clear first-frame hook so viewers understand the promise instantly."),
    visual_clarity: videoSection(clarityScore, 20, "Keep the first frame readable on mobile with one dominant focal point and minimal clutter."),
    offer_visibility: videoSection(offerScore, 20, context.audience ? "Show the offer or outcome earlier so this audience understands why the ad matters." : "Offer visibility is limited because the target audience is broad or missing."),
    creative_structure: videoSection(structureScore, 15, isShort ? "The opening structure can work for paid social if each early frame carries one idea." : "The opening should tighten around hook, proof, offer, and CTA before the viewer scrolls."),
    cta_visibility: videoSection(ctaScore, 15, signals.hasCTA ? "The CTA exists, but it should become visible sooner in the opening frames." : "The CTA is not visible enough. Add a direct next step earlier."),
    attention_potential,
    conversion_potential,
    video_verdict,
    limitations: ad.videoFrameExtractionFailed ? "Frame extraction failed, so this audit used limited video context. Audio/transcript/full video sequence not analyzed." : limitations,
  };
}

function videoSection(score, max, feedback) {
  return { score: Math.max(0, Math.min(max, score)), max, feedback };
}

function totalScores(scores) {
  return scoreKeys.reduce((sum, key) => sum + Number(scores[key]?.score || 0), 0);
}

function scoreAlias(value = {}, key) {
  const aliases = {
    hook_strength: "hook",
    offer_clarity: "offer",
    cta_strength: "cta",
  };
  return value.scores?.[key] || value.scores?.[aliases[key]] || {};
}

function normalizeSingle(value = {}, context = {}, ad = {}) {
  const scores = {};
  for (const key of scoreKeys) {
    const raw = scoreAlias(value, key);
    scores[key] = {
      score: Math.max(0, Math.min(SCORE_MAX[key], Number(raw.score || 0))),
      max: SCORE_MAX[key],
      feedback: String(raw.feedback || "No feedback returned."),
    };
  }
  const overall = Math.max(0, Math.min(100, Number(value.overall_score || totalScores(scores))));
  const hasMajorWeakness = scores.hook_strength.score < 10 || scores.offer_clarity.score < 6 || scores.cta_strength.score < 6;
  const verdict = actions.includes(value.verdict) ? value.verdict : actions.includes(value.recommended_action) ? value.recommended_action : overall >= 80 && !hasMajorWeakness ? "Run" : overall >= 60 ? "Revise" : "Reject";
  const performance_pattern = performancePatterns.includes(value.performance_pattern) ? value.performance_pattern : performancePatternFrom(scores, overall);
  return {
    overall_score: overall,
    verdict,
    recommended_action: verdict,
    confidence: confidenceLevels.includes(value.confidence) ? value.confidence : inferConfidence(context, ad),
    performance_pattern,
    attention_potential: videoPotentials.includes(value.attention_potential) ? value.attention_potential : potentialFromScore(((scores.hook_strength.score / 20) * 60) + ((scores.creative_strength.score / 15) * 40)),
    conversion_potential: videoPotentials.includes(value.conversion_potential) ? value.conversion_potential : potentialFromScore(((scores.offer_clarity.score / 10) * 50) + ((scores.cta_strength.score / 10) * 50)),
    input_summary: {
      has_copy: Boolean(value.input_summary?.has_copy ?? ad.adCopy),
      has_creative: Boolean(value.input_summary?.has_creative ?? ad.creativeType !== "none"),
      creative_type: ["image", "video", "none"].includes(value.input_summary?.creative_type) ? value.input_summary.creative_type : ad.creativeType || "none",
      has_link: Boolean(value.input_summary?.has_link ?? ad.postLink),
    },
    scores,
    key_strengths: shortArray(value.key_strengths, ["Clear enough to score."], { min: 1, max: 3 }),
    critical_issues: shortArray(value.critical_issues, ["Hook, offer, or CTA needs sharpening."], { min: 1, max: 3 }),
    improvements: shortArray(value.improvements, ["Clarify the hook.", "Strengthen the offer.", "Make CTA direct."], { min: 3, max: 5 }),
    hook_rewrites: shortArray(value.hook_rewrites, ["Stop wasting budget on weak ads.", "Know before you spend.", "Fix the ad before launch."], { min: 3, max: 3 }),
    creative_recommendations: shortArray(value.creative_recommendations, [ad.creativeType === "video" ? "Improve first-frame clarity." : "Improve visual hierarchy."], { min: 1, max: 4 }),
    video_hook_audit: normalizeVideoHookAudit(value.video_hook_audit || value.video_analysis, context, ad),
    final_verdict: String(value.final_verdict || `${verdict} this ad based on the current score and confidence.`),
  };
}

function normalizeVideoHookAudit(value = {}, context = {}, ad = {}) {
  if (value?.audit_type) return normalizeLegacyVideoAnalysis(value, context, ad);
  const fallback = buildVideoHookAudit(context, ad, {});
  if (ad.creativeType !== "video" && value.analysis_mode !== "sampled_key_frames") return fallback;
  return {
    analysis_mode: ["none", "sampled_key_frames", "limited_video_context"].includes(value.analysis_mode) ? value.analysis_mode : fallback.analysis_mode,
    frame_count: Math.max(0, Math.min(MAX_VIDEO_FRAMES, Number(value.frame_count ?? fallback.frame_count ?? 0))),
    hook_strength: normalizeVideoSection(value.hook_strength, fallback.hook_strength),
    visual_clarity: normalizeVideoSection(value.visual_clarity, fallback.visual_clarity),
    offer_visibility: normalizeVideoSection(value.offer_visibility, fallback.offer_visibility),
    creative_structure: normalizeVideoSection(value.creative_structure, fallback.creative_structure),
    cta_visibility: normalizeVideoSection(value.cta_visibility, fallback.cta_visibility),
    attention_potential: videoPotentials.includes(value.attention_potential) ? value.attention_potential : fallback.attention_potential,
    conversion_potential: videoPotentials.includes(value.conversion_potential) ? value.conversion_potential : fallback.conversion_potential,
    video_verdict: videoVerdicts.includes(value.video_verdict) ? value.video_verdict : fallback.video_verdict,
    limitations: String(value.limitations || fallback.limitations),
  };
}

function normalizeLegacyVideoAnalysis(value = {}, context = {}, ad = {}) {
  const fallback = buildVideoHookAudit(context, ad, {});
  if (ad.creativeType !== "video") return fallback;
  return {
    analysis_mode: value.audit_type === "none" ? "none" : ad.videoFrames?.length ? "sampled_key_frames" : "limited_video_context",
    frame_count: ad.videoFrames?.length || 0,
    hook_strength: normalizeVideoSection(value.first_three_seconds, fallback.hook_strength),
    visual_clarity: normalizeVideoSection(value.on_screen_text || value.product_clarity, fallback.visual_clarity),
    offer_visibility: normalizeVideoSection(value.product_clarity, fallback.offer_visibility),
    creative_structure: normalizeVideoSection(value.visual_flow || value.platform_native_feel, fallback.creative_structure),
    cta_visibility: normalizeVideoSection(value.cta_timing, fallback.cta_visibility),
    attention_potential: fallback.attention_potential,
    conversion_potential: fallback.conversion_potential,
    video_verdict: fallback.video_verdict,
    limitations: "Based on sampled key frames only. Audio/transcript/full video sequence not analyzed.",
  };
}

function normalizeVideoSection(value = {}, fallback) {
  const max = Number(value.max || fallback.max || 1);
  return {
    score: Math.max(0, Math.min(max, Number(value.score ?? fallback.score ?? 0))),
    max,
    feedback: String(value.feedback || fallback.feedback || "No video feedback returned."),
  };
}

function arrayOr(value, fallback) {
  return Array.isArray(value) && value.length ? value.slice(0, 6).map(String) : fallback;
}

function shortArray(value, fallback, { min = 1, max = 5 } = {}) {
  const source = Array.isArray(value) ? value.map((item) => compactText(item, 140)).filter(Boolean) : [];
  const merged = [...source, ...fallback].slice(0, max);
  while (merged.length < min) merged.push(fallback[merged.length % fallback.length] || "Clarify the offer.");
  return merged;
}

function parseJson(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI JSON parse failed:", error);
    throw error;
  }
}

function imagePayload(ad) {
  if (!ad.imageData?.startsWith("data:image/")) return null;
  return { type: "input_image", image_url: ad.imageData };
}

function videoFramePayloads(ad) {
  return (ad.videoFrames || []).filter((frame) => String(frame).startsWith("data:image/")).slice(0, MAX_VIDEO_FRAMES).map((frame) => ({ type: "input_image", image_url: frame }));
}

function openAiModel(mode = "text") {
  if (mode === "vision") return process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini";
  return process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
}

function extractResponseText(data = {}) {
  if (data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) chunks.push(part.text);
      if (part.type === "text" && part.text) chunks.push(part.text);
    }
  }
  return chunks.join("");
}

async function callOpenAI(content, { maxOutputTokens, mode = "text", instructions, responseFormat }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: openAiModel(mode),
      instructions,
      input: [{ role: "user", content }],
      temperature: 0.2,
      top_p: 1,
      max_output_tokens: maxOutputTokens,
      text: { format: responseFormat },
      store: false,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenAI request failed: ${response.status} ${errorText.slice(0, 240)}`);
  }
  return response.json();
}

async function analyzeWithOpenAI(context, ad, allowImageAnalysis = false) {
  const hasVideoFrames = allowImageAnalysis && ad.creativeType === "video" && ad.videoFrames?.length;
  const prompt = hasVideoFrames
    ? `${buildSingleAdUserPrompt({ context, ad })}\n${buildVideoHookAuditUserPrompt({ context, ad })}\nReturn one JSON object with the single ad fields and a video_hook_audit field.`
    : buildSingleAdUserPrompt({ context, ad });
  const content = [{ type: "input_text", text: prompt }];
  // Free/demo plan rule: images are preview-only and must not be sent for AI analysis.
  // Future billing/auth should pass allowImageAnalysis=true only for Plus/Pro requests.
  const image = allowImageAnalysis ? imagePayload(ad) : null;
  if (image) content.push(image);
  if (allowImageAnalysis && ad.creativeType === "video") {
    const frames = videoFramePayloads(ad);
    if (frames.length) content.push({ type: "input_text", text: "Video Hook Audit sampled key frames. Analyze first-frame strength, scroll-stop potential, visual clarity, offer visibility, and CTA visibility only. Do not claim motion/audio/transcript/full-video review." }, ...frames);
  }
  const mode = allowImageAnalysis && (image || ad.videoFrames?.length) ? "vision" : "text";
  const data = await callOpenAI(content, {
    maxOutputTokens: hasVideoFrames ? VIDEO_OUTPUT_TOKENS : SINGLE_OUTPUT_TOKENS,
    mode,
    instructions: hasVideoFrames ? `${singleAdSystemPrompt}\n${videoHookAuditSystemPrompt}` : singleAdSystemPrompt,
    responseFormat: jsonSchemaFormat(hasVideoFrames ? "adnex_single_ad_with_video" : "adnex_single_ad", hasVideoFrames ? singleAdWithVideoSchema : singleAdSchema),
  });
  return normalizeSingle(parseJson(extractResponseText(data)), context, ad);
}

async function analyzeSingle(context, ad, allowImageAnalysis = false) {
  if (process.env.OPENAI_API_KEY) return analyzeWithOpenAI(context, ad, allowImageAnalysis);
  return mockSingle(context, ad);
}

function compareMock(context, ads) {
  const analyzed = ads.map((ad) => mockSingle(context, ad));
  const compareAds = analyzed.map((result, index) => {
    const sorted = scoreKeys.map((key) => [key, result.scores[key].score / result.scores[key].max]).sort((a, b) => b[1] - a[1]);
    const videoHook = result.video_hook_audit;
    return {
      ad_id: ads[index].ad_id,
      overall_score: result.overall_score,
      verdict: result.verdict,
      confidence: result.confidence,
      recommended_action: result.verdict,
      performance_pattern: result.performance_pattern,
      strongest_point: sorted[0][0].replaceAll("_", " "),
      weakest_point: sorted.at(-1)[0].replaceAll("_", " "),
      scores: Object.fromEntries(scoreKeys.map((key) => [key, result.scores[key].score])),
      what_to_keep: result.key_strengths.slice(0, 2),
      what_to_fix: result.critical_issues.slice(0, 3),
      suggested_hook_rewrite: result.hook_rewrites[0],
      creative_recommendation: ads[index].creativeType === "video" ? "Make the first 1-3 seconds show the offer, visual hook, and CTA sooner." : result.creative_recommendations[0],
      attention_potential: ads[index].creativeType === "video" ? videoHook?.attention_potential || result.attention_potential : result.attention_potential,
      conversion_potential: ads[index].creativeType === "video" ? videoHook?.conversion_potential || result.conversion_potential : result.conversion_potential,
      video_verdict: ads[index].creativeType === "video" ? videoHook?.video_verdict || "Revise opening" : "",
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
      remaining_risk: allLow ? "All ads need revision before spend." : compareAds.some((ad) => ad.video_verdict === "Strong hook, weak conversion") ? "One video has stronger attention potential than conversion clarity, so fix offer/CTA before scaling." : "Check CTA clarity and offer specificity before increasing budget.",
    },
    final_recommendation: allLow ? "Do not run any yet - all need revision." : close ? `Test Ad ${winner.ad_id} and Ad ${second.ad_id}.` : compareAds.find((ad) => ad.ad_id === winner.ad_id)?.video_verdict === "Strong hook, weak conversion" ? `Ad ${winner.ad_id} has stronger attention, but revise offer and CTA before conversion campaigns.` : `Run Ad ${winner.ad_id} first.`,
    test_plan: { primary_ad: allLow ? "" : winner.ad_id, backup_ad: second?.ad_id || "", testing_note: close ? "Scores are within 5 points, so split testing is safer." : "Start with the top ad and keep the runner-up as backup." },
  };
}

async function compareWithOpenAI(context, ads, allowImageAnalysis = false) {
  const content = [{ type: "input_text", text: buildCompareAdsUserPrompt({ context, ads }) }];
  // Free/demo plan rule: images are preview-only and must not be sent for AI analysis.
  // Future billing/auth should pass allowImageAnalysis=true only for Plus/Pro requests.
  if (allowImageAnalysis) {
    for (const ad of ads) {
      const image = imagePayload(ad);
      if (image) content.push({ type: "input_text", text: `Image creative for Ad ${ad.ad_id}` }, image);
      const frames = videoFramePayloads(ad);
      if (frames.length) content.push({ type: "input_text", text: `Video Hook Audit sampled key frames for Ad ${ad.ad_id}. Analyze attention potential and conversion potential only. Do not claim motion/audio/transcript/full-video review.` }, ...frames);
    }
  }
  const hasVisionInput = allowImageAnalysis && ads.some((ad) => ad.imageData || ad.videoFrames?.length);
  const data = await callOpenAI(content, {
    maxOutputTokens: COMPARE_OUTPUT_TOKENS,
    mode: hasVisionInput ? "vision" : "text",
    instructions: hasVisionInput ? `${compareAdsSystemPrompt}\n${videoHookAuditSystemPrompt}` : compareAdsSystemPrompt,
    responseFormat: jsonSchemaFormat("adnex_compare_ads", compareAdsSchema),
  });
  return normalizeCompare(parseJson(extractResponseText(data)), context, ads);
}

function normalizeCompare(value = {}, context, ads) {
  const fallback = compareMock(context, ads);
  const compareAds = Array.isArray(value.ads) && value.ads.length ? value.ads : fallback.ads;
  const scoreValue = (ad, key) => {
    const aliases = {
      hook_strength: "hook",
      offer_clarity: "offer",
      cta_strength: "cta",
    };
    return ad.scores?.[key] ?? ad.scores?.[aliases[key]] ?? 0;
  };
  return {
    campaign_context: value.campaign_context || fallback.campaign_context,
    ads: compareAds.map((ad, index) => ({
      ad_id: String(ad.ad_id || ads[index]?.ad_id || String.fromCharCode(65 + index)),
      overall_score: Math.max(0, Math.min(100, Number(ad.overall_score || 0))),
      verdict: actions.includes(ad.verdict) ? ad.verdict : actions.includes(ad.recommended_action) ? ad.recommended_action : "Revise",
      confidence: confidenceLevels.includes(ad.confidence) ? ad.confidence : "Low",
      recommended_action: actions.includes(ad.verdict) ? ad.verdict : actions.includes(ad.recommended_action) ? ad.recommended_action : "Revise",
      performance_pattern: performancePatterns.includes(ad.performance_pattern) ? ad.performance_pattern : "Unclear offer",
      strongest_point: String(ad.strongest_point || "platform fit"),
      weakest_point: String(ad.weakest_point || "offer clarity"),
      scores: Object.fromEntries(scoreKeys.map((key) => [key, Math.max(0, Math.min(SCORE_MAX[key], Number(scoreValue(ad, key) || 0)))])),
      what_to_keep: arrayOr(ad.what_to_keep, ["Keep the strongest message angle."]),
      what_to_fix: arrayOr(ad.what_to_fix, ["Fix the weakest score area before launch."]),
      suggested_hook_rewrite: String(ad.suggested_hook_rewrite || "Stop guessing which ad will convert."),
      creative_recommendation: String(ad.creative_recommendation || "Improve first-frame clarity and visual hierarchy."),
      attention_potential: videoPotentials.includes(ad.attention_potential) ? ad.attention_potential : ads[index]?.creativeType === "video" ? "Medium" : "",
      conversion_potential: videoPotentials.includes(ad.conversion_potential) ? ad.conversion_potential : ads[index]?.creativeType === "video" ? "Medium" : "",
      video_verdict: videoVerdicts.includes(ad.video_verdict) ? ad.video_verdict : ads[index]?.creativeType === "video" ? "Revise opening" : "",
    })),
    ranking: Array.isArray(value.ranking) && value.ranking.length ? value.ranking : fallback.ranking,
    winner: value.winner || fallback.winner,
    final_recommendation: String(value.final_recommendation || fallback.final_recommendation),
    test_plan: value.test_plan || fallback.test_plan,
  };
}

function rateLimitKey(request, auth) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return auth?.user?.id || forwarded || "anonymous";
}

function checkRateLimit(request, auth) {
  if (!process.env.OPENAI_API_KEY || auth?.demo) return null;
  const key = rateLimitKey(request, auth);
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json({ error: "Rate limit reached. Try again in a few minutes.", retry_after: retryAfter }, { status: 429 });
  }
  bucket.count += 1;
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const context = cleanContext(body);

    if (body.compare) {
      const ads = (Array.isArray(body.ads) ? body.ads : []).slice(0, 4).map(cleanAd).filter(hasInput);
      if (ads.length < 2) return NextResponse.json({ error: "At least two ads need copy, creative, or a post link." }, { status: 400 });
      const auth = await authorizeAnalysisRequest(request, { compare: true, ads });
      if (!auth.allowed) return auth.response;
      const rateLimitResponse = checkRateLimit(request, auth);
      if (rateLimitResponse) return rateLimitResponse;
      let reservation = null;
      try {
        if (process.env.OPENAI_API_KEY && !auth.demo) reservation = await reserveUsage(auth, "compare", { ad_count: ads.length, creative_types: ads.map((ad) => ad.creativeType) });
        const result = process.env.OPENAI_API_KEY ? await compareWithOpenAI(context, ads, auth.allowImageAnalysis) : compareMock(context, ads);
        return NextResponse.json(result);
      } catch (error) {
        console.error("Compare AI failed, returning mock:", error);
        await refundUsage(auth, reservation, "compare_ai_failed");
        return NextResponse.json(compareMock(context, ads));
      }
    }

    const ad = cleanAd(body);
    if (!hasInput(ad)) return NextResponse.json({ error: "Provide ad copy, a creative upload, or an ad/post link." }, { status: 400 });
    const auth = await authorizeAnalysisRequest(request, { ad });
    if (!auth.allowed) return auth.response;
    const rateLimitResponse = checkRateLimit(request, auth);
    if (rateLimitResponse) return rateLimitResponse;
    let reservation = null;
    try {
      if (process.env.OPENAI_API_KEY && !auth.demo) reservation = await reserveUsage(auth, "single", { creative_type: ad.creativeType });
      const result = await analyzeSingle(context, ad, auth.allowImageAnalysis);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Analyze AI failed, returning mock:", error);
      await refundUsage(auth, reservation, "single_ai_failed");
      return NextResponse.json(mockSingle(context, ad));
    }
  } catch (error) {
    console.error("Analyze route error:", error);
    return NextResponse.json({ error: "Unable to analyze ad." }, { status: 500 });
  }
}
