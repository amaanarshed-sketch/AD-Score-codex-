import { NextResponse } from "next/server";
import { authorizeAnalysisRequest, refundUsage, reserveUsage } from "../../../lib/billingServer";

const AD_DECISION_SYSTEM_PROMPT = `You are an AI ad performance evaluation engine.

You analyze ads and return structured, concise, and actionable outputs.

You are NOT a chatbot. Do not explain. Do not add extra text.

CRITICAL RULES:

1. OUTPUT FORMAT
- Always return valid JSON only
- No markdown
- No extra text before or after JSON
- Must match required schema exactly

2. LENGTH CONTROL
- Keep all responses extremely concise
- Each feedback field: max 1–2 sentences
- Avoid repetition
- Avoid filler language

3. STYLE
- Direct, analytical, and specific
- Do NOT use generic phrases like:
  'this is engaging', 'this looks good', 'this could be improved'
- Always explain what is wrong and why

4. SCORING
- Be strict and realistic
- Do not inflate scores
- Base scoring on real marketing performance principles

5. PRIORITY
Focus only on:
- conversion potential
- clarity
- strength of hook
- effectiveness of offer
- CTA quality

Ignore branding fluff.

6. VIDEO HANDLING
If video frames are provided:
- Analyze only visible frames
- Do NOT assume audio or full video context
- Briefly mention limitation if needed

7. IMPROVEMENTS
- Provide 3–5 improvements
- Each under 12 words
- Must be actionable

8. HOOK REWRITES
- Provide exactly 3 rewritten hooks
- Keep them short, direct, and scroll-stopping

9. DECISION OUTPUT
Always include a clear decision:
- 'Run'
- 'Revise'
- 'Reject'

10. TOKEN EFFICIENCY
- Use minimal words
- Avoid repeating ideas
- Avoid long explanations

Your goal:
Deliver maximum decision value with minimal tokens.`;

const SINGLE_OUTPUT_TOKENS = 500;
const COMPARE_OUTPUT_TOKENS = 600;
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
    videoAnalysisMode: input.videoAnalysisMode === "sampled_frames" ? "sampled_frames" : "none",
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

function creativeLine(ad) {
  if (ad.creativeType === "video") return `Video: ${ad.creativeFilename || "unnamed"}, ${ad.videoDuration || "unknown"}s, ${ad.videoFrames.length} sampled frames. Analyze visible frames only; no audio/full-video assumptions.`;
  if (ad.creativeType === "image") return `Image creative uploaded: ${ad.creativeFilename || "unnamed file"}. Creative preview exists: ${ad.hasCreativePreview ? "yes" : "no"}.`;
  return "No creative uploaded.";
}

function buildSinglePrompt(context, ad) {
  return `Task: score one ad. Return JSON only.
Context: platform=${context.platform}; objective=${context.objective}; audience=${context.audience || "Not provided"}.
Input: copy="${ad.adCopy || "Not provided"}"; link="${ad.postLink || "Not provided"}"; link_platform="${ad.detectedPlatform || "Not detected"}"; creative=${ad.creativeType}; file="${ad.creativeFilename || "none"}"; video_seconds=${ad.videoDuration || 0}; video_frames=${ad.videoFrames.length}.
Video rule: if frames are attached, analyze visible frames only; no audio/full-video assumptions.
Schema keys: overall_score, confidence, recommended_action, input_summary, scores, detected_angle, key_strengths, critical_issues, improvements, hook_rewrites, creative_recommendations, video_analysis, final_verdict.
Scores max: platform_fit 15, objective_fit 15, audience_fit 15, hook 15, creative_strength 15, clarity 10, offer 10, cta 5. Overall totals 100.
Arrays: key_strengths 1-3, critical_issues 1-3, improvements 3-5 under 12 words, hook_rewrites exactly 3, creative_recommendations 1-4.
Use existing UI shape: each scores item is {score,max,feedback}; detected_angle is {angle,explanation}; video_analysis includes audit_type, summary, six score sections, retention_risks, scene_recommendations.`;
}

function buildComparePrompt(context, ads) {
  return `Task: compare ads for one campaign. Return JSON only.
Context: platform=${context.platform}; objective=${context.objective}; audience=${context.audience || "Not provided"}.
Ads:
${ads.map((ad) => `${ad.ad_id}: copy="${ad.adCopy || "Not provided"}"; link="${ad.postLink || "Not provided"}"; link_platform="${ad.detectedPlatform || "Not detected"}"; creative=${creativeLine(ad)}`).join("\n")}
Schema keys: campaign_context, ads, ranking, winner, final_recommendation, test_plan.
Per ad: ad_id, overall_score, confidence, recommended_action, strongest_point, weakest_point, scores, what_to_keep, what_to_fix, suggested_hook_rewrite, creative_recommendation.
Scores max: platform_fit 15, objective_fit 15, audience_fit 15, hook 15, creative_strength 15, clarity 10, offer 10, cta 5.
Rules: within 5 points => A/B test. All below 60 => revise all. Flag low-confidence incomplete inputs. Mention weak CTA/offer risk. If frames are attached, analyze visible frames only.`;
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

  const isVideo = ad.creativeType === "video";
  const videoAnalysis = buildVideoAnalysis(context, ad, { hasCopy, hasCTA, angle });

  const scores = {
    platform_fit: section(9 + (hasCreative ? 2 : 0) + (context.platform === "TikTok" && copy.length < 220 ? 2 : 0), "Platform fit is limited by how native the ad feels for the selected placement and feed behavior."),
    objective_fit: section(8 + (hasCTA ? 3 : 0) + (context.objective === "Awareness" ? 1 : 0), `For ${context.objective}, the ad needs a clearer bridge between the message and the intended action.`),
    audience_fit: section(context.audience ? 11 : 5, context.audience ? "The audience context is usable, but the ad should call out their exact buying moment earlier." : "Audience fit is weak because the target audience was not specific enough."),
    hook: section((copy ? 8 : 3) + (/\?/.test(copy) ? 3 : 0) + (angle !== "Other" ? 2 : 0), hasCopy ? "The hook has a direction, but it needs sharper tension in the first line." : "No copy was provided, so hook quality can only be inferred from creative/link context."),
    creative_strength: section(hasCreative ? (isVideo ? 11 : 10) : 4, hasCreative ? (isVideo ? "Video audit checks scroll-stopping open, pacing, visual clarity, product visibility, and CTA timing. This score is stricter because weak motion creative can waste budget fast." : "Image preview exists; check visual hierarchy, product visibility, and contrast before launch.") : "No creative was uploaded, so visual stopping power cannot be judged."),
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
      ad.creativeType === "video" ? "Open with the clearest pain point or result in the first 1-2 seconds, then cut to proof or product use." : "Use high contrast text overlay only if it clarifies the offer.",
      "Show a face/person if trust or relatability is important for the audience.",
    ],
    video_analysis: videoAnalysis,
    final_verdict: recommended_action === "Run" ? "Run this, but monitor CTA performance closely." : recommended_action === "Revise" ? "Revise before running. The idea is usable, but the execution is not ready to scale." : "Do not run this yet. The ad needs a clearer hook, offer, or creative before spending budget.",
  }, context, ad);
}

function buildVideoAnalysis(context, ad, signals = {}) {
  if (ad.creativeType !== "video") {
    return {
      audit_type: "none",
      summary: "No video creative was submitted.",
      first_three_seconds: videoSection(0, 20, "No video was provided, so the opening cannot be judged."),
      visual_flow: videoSection(0, 20, "No video was provided, so scene flow cannot be judged."),
      on_screen_text: videoSection(0, 15, "No video was provided, so text overlays cannot be judged."),
      product_clarity: videoSection(0, 15, "No video was provided, so product visibility cannot be judged."),
      cta_timing: videoSection(0, 10, "No video was provided, so CTA timing cannot be judged."),
      platform_native_feel: videoSection(0, 10, "No video was provided, so platform-native fit cannot be judged."),
      retention_risks: [],
      scene_recommendations: [],
    };
  }

  const isShort = ad.videoDuration > 0 && ad.videoDuration <= 35;
  const tiktokLike = context.platform === "TikTok" || /instagram|facebook/i.test(context.platform);
  const firstScore = Math.min(20, 9 + (signals.hasCopy ? 4 : 0) + (signals.angle !== "Other" ? 3 : 0) + (isShort ? 2 : 0));
  const flowScore = Math.min(20, 10 + (isShort ? 3 : 0) + (signals.hasCTA ? 2 : 0));
  const textScore = Math.min(15, 7 + (signals.hasCopy ? 4 : 0));
  const clarityScore = Math.min(15, 8 + (signals.hasCopy ? 2 : 0) + (context.audience ? 2 : 0));
  const ctaScore = Math.min(10, signals.hasCTA ? 7 : 4);
  const nativeScore = Math.min(10, 5 + (tiktokLike ? 3 : 1) + (isShort ? 1 : 0));

  return {
    audit_type: ad.videoFrames?.length ? "basic_video" : "full_video",
    summary: ad.videoFrames?.length ? `Audit uses ${ad.videoFrames.length} sampled frames only; audio and full motion are not assumed.` : `${ad.creativeFilename || "Uploaded video"} is treated as a video ad audit for ${context.platform}.`,
    first_three_seconds: videoSection(firstScore, 20, signals.hasCopy ? "The opening has enough message context to judge the hook, but it still needs a sharper visual or text cue in the first second." : "The video needs a clear first-frame text hook so the viewer understands the promise before sound or context loads."),
    visual_flow: videoSection(flowScore, 20, isShort ? "The duration is suitable for a fast paid social test; keep each scene focused on one idea." : "The video may be long for a cold paid-social placement; tighten the sequence around hook, proof, offer, and CTA."),
    on_screen_text: videoSection(textScore, 15, signals.hasCopy ? "Use the strongest copy as large on-screen text, not only in the caption. Keep it readable on mobile." : "Add concise on-screen text so the ad works without sound."),
    product_clarity: videoSection(clarityScore, 15, context.audience ? "The product or outcome should be visible before the viewer has to infer why it matters to this audience." : "Product clarity is limited because the target audience is broad or missing."),
    cta_timing: videoSection(ctaScore, 10, signals.hasCTA ? "The CTA exists, but it should appear once near the middle and again in the final frame." : "The CTA is not strong enough. Add a direct action tied to the offer."),
    platform_native_feel: videoSection(nativeScore, 10, tiktokLike ? "The creative should feel like a native short-form post: fast open, human/product proof, readable captions, and minimal polish." : "Match the pacing and production style to the selected platform instead of using a generic creative."),
    retention_risks: [
      "If the first second does not show the pain point, outcome, or product, viewers may scroll before the offer lands.",
      "If captions are small or delayed, the ad will underperform for viewers watching without sound.",
      "If the CTA appears only at the end, high-intent viewers may not know what to do soon enough.",
    ],
    scene_recommendations: [
      "Scene 1: lead with the strongest pain point or result in large mobile-readable text.",
      "Scene 2: show product use, proof, or transformation instead of abstract branding.",
      "Final scene: repeat the offer and CTA with a clear next step.",
    ],
  };
}

function videoSection(score, max, feedback) {
  return { score: Math.max(0, Math.min(max, score)), max, feedback };
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
    key_strengths: shortArray(value.key_strengths, ["Clear enough to score."], { min: 1, max: 3 }),
    critical_issues: shortArray(value.critical_issues, ["Hook, offer, or CTA needs sharpening."], { min: 1, max: 3 }),
    improvements: shortArray(value.improvements, ["Clarify the hook.", "Strengthen the offer.", "Make CTA direct."], { min: 3, max: 5 }),
    hook_rewrites: shortArray(value.hook_rewrites, ["Stop wasting budget on weak ads.", "Know before you spend.", "Fix the ad before launch."], { min: 3, max: 3 }),
    creative_recommendations: shortArray(value.creative_recommendations, [ad.creativeType === "video" ? "Improve first-frame clarity." : "Improve visual hierarchy."], { min: 1, max: 4 }),
    video_analysis: normalizeVideoAnalysis(value.video_analysis, context, ad),
    final_verdict: String(value.final_verdict || `${action} this ad based on the current score and confidence.`),
  };
}

function normalizeVideoAnalysis(value = {}, context = {}, ad = {}) {
  const fallback = buildVideoAnalysis(context, ad, {});
  if (ad.creativeType !== "video" && value.audit_type !== "full_video" && value.audit_type !== "basic_video") return fallback;
  return {
    audit_type: ["none", "basic_video", "full_video"].includes(value.audit_type) ? value.audit_type : fallback.audit_type,
    summary: String(value.summary || fallback.summary),
    first_three_seconds: normalizeVideoSection(value.first_three_seconds, fallback.first_three_seconds),
    visual_flow: normalizeVideoSection(value.visual_flow, fallback.visual_flow),
    on_screen_text: normalizeVideoSection(value.on_screen_text, fallback.on_screen_text),
    product_clarity: normalizeVideoSection(value.product_clarity, fallback.product_clarity),
    cta_timing: normalizeVideoSection(value.cta_timing, fallback.cta_timing),
    platform_native_feel: normalizeVideoSection(value.platform_native_feel, fallback.platform_native_feel),
    retention_risks: arrayOr(value.retention_risks, fallback.retention_risks),
    scene_recommendations: arrayOr(value.scene_recommendations, fallback.scene_recommendations),
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

async function callOpenAI(content, maxOutputTokens, mode = "text") {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: openAiModel(mode),
      instructions: AD_DECISION_SYSTEM_PROMPT,
      input: [{ role: "user", content }],
      temperature: 0.2,
      top_p: 1,
      max_output_tokens: maxOutputTokens,
      text: { format: { type: "json_object" } },
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
  const content = [{ type: "input_text", text: buildSinglePrompt(context, ad) }];
  // Free/demo plan rule: images are preview-only and must not be sent for AI analysis.
  // Future billing/auth should pass allowImageAnalysis=true only for Plus/Pro requests.
  const image = allowImageAnalysis ? imagePayload(ad) : null;
  if (image) content.push(image);
  if (allowImageAnalysis && ad.creativeType === "video") content.push(...videoFramePayloads(ad));
  const mode = allowImageAnalysis && (image || ad.videoFrames?.length) ? "vision" : "text";
  const data = await callOpenAI(content, SINGLE_OUTPUT_TOKENS, mode);
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
      creative_recommendation: ads[index].creativeType === "video" ? result.video_analysis?.scene_recommendations?.[0] || result.creative_recommendations[0] : result.creative_recommendations[0],
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
  const content = [{ type: "input_text", text: buildComparePrompt(context, ads) }];
  // Free/demo plan rule: images are preview-only and must not be sent for AI analysis.
  // Future billing/auth should pass allowImageAnalysis=true only for Plus/Pro requests.
  if (allowImageAnalysis) {
    for (const ad of ads) {
      const image = imagePayload(ad);
      if (image) content.push({ type: "input_text", text: `Image creative for Ad ${ad.ad_id}` }, image);
      const frames = videoFramePayloads(ad);
      if (frames.length) content.push({ type: "input_text", text: `Sampled video frames for Ad ${ad.ad_id}. Analyze visible frames only.` }, ...frames);
    }
  }
  const hasVisionInput = allowImageAnalysis && ads.some((ad) => ad.imageData || ad.videoFrames?.length);
  const data = await callOpenAI(content, COMPARE_OUTPUT_TOKENS, hasVisionInput ? "vision" : "text");
  return normalizeCompare(parseJson(extractResponseText(data)), context, ads);
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
