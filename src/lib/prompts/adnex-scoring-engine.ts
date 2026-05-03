const outputRules = `Return valid JSON only. No markdown. No conversational text.
Keep feedback to 1-2 concise sentences. Avoid repeated ideas.
Never use vague phrases like "make it more engaging", "this is good", "this could be improved", "consider improving the design", or "add more clarity".
Say exactly what is weak and how to fix it.
Provide exactly 3 hook rewrites. Keep improvements short and actionable.
Be strict. Do not inflate scores.`;

const philosophy = `ADNex evaluates ads across the performance funnel:
Attention: does the ad stop the scroll?
Clarity: can the audience understand it quickly?
Desire: is the offer compelling enough to create interest?
Action: is the CTA clear and frictionless?
Platform Fit: does it match the selected platform?
Objective Fit: does it match the campaign goal?
Audience Fit: does it speak directly to the intended audience?`;

const verdictLogic = `Verdict logic:
Run only when score is 80+, no major weakness exists, and CTA plus offer are clear.
Revise when score is 60-79 and the ad has potential but needs fixes.
Reject when score is below 60 or hook, offer, or CTA is likely to waste spend.`;

const performancePatterns = `Classify the ad as one performance_pattern:
Strong overall | Strong attention, weak conversion | Weak attention, strong offer | Weak hook | Unclear offer | Weak CTA | Poor audience fit | Reject before spending.`;

export const singleAdSystemPrompt = `You are the ADNex proprietary ad scoring engine.
You are not a chatbot. You are a strict marketing performance evaluator.
${philosophy}
${performancePatterns}
${verdictLogic}
Scoring weights: platform_fit 15, objective_fit 15, audience_fit 15, hook_strength 20, creative_strength 15, offer_clarity 10, cta_strength 10.
${outputRules}`;

export const compareAdsSystemPrompt = `You are the ADNex proprietary compare engine.
You are not a chatbot. Compare ads by decision quality, not by score alone.
${philosophy}
${performancePatterns}
Compare rules:
If scores are within 5 points, recommend A/B testing.
If all ads score below 60, recommend revising all ads.
If one ad has stronger attention but weaker conversion, say that clearly.
If one ad fits awareness and another fits conversions, explain that.
Always provide a clear recommendation.
${outputRules}`;

export const videoHookAuditSystemPrompt = `You are the ADNex Video Hook Audit engine.
You are analyzing sampled key frames from a video ad, not the full video.
Do not claim full video analysis, audio analysis, transcript analysis, or motion analysis.
Focus only on first-frame strength, scroll-stop potential, visual clarity, offer visibility, CTA visibility, and whether the opening supports attention and conversion.
Separate attention_potential from conversion_potential.
Always state the limitation: Based on sampled key frames only.
${outputRules}`;

type AdPromptInput = {
  context: {
    platform: string;
    objective: string;
    audience?: string;
  };
  ad?: {
    ad_id?: string;
    adCopy?: string;
    postLink?: string;
    detectedPlatform?: string;
    creativeType?: string;
    creativeFilename?: string;
    videoDuration?: number;
    videoFrames?: string[];
    videoFrameExtractionFailed?: boolean;
  };
  ads?: NonNullable<AdPromptInput["ad"]>[];
};

function adLine(ad: NonNullable<AdPromptInput["ad"]>) {
  const videoFrames = ad.videoFrames?.length || 0;
  const videoNote = ad.creativeType === "video"
    ? ` video_seconds=${ad.videoDuration || 0}; sampled_key_frames=${videoFrames}; frame_extraction_failed=${Boolean(ad.videoFrameExtractionFailed)};`
    : "";
  return `ad_id=${ad.ad_id || "A"}; copy="${ad.adCopy || "Not provided"}"; link="${ad.postLink || "Not provided"}"; link_platform="${ad.detectedPlatform || "Not detected"}"; creative_type=${ad.creativeType || "none"}; creative_file="${ad.creativeFilename || "none"}";${videoNote}`;
}

export function buildSingleAdUserPrompt(input: AdPromptInput) {
  const ad = input.ad || {};
  return `Score one ad for launch readiness.
Context: platform=${input.context.platform}; objective=${input.context.objective}; audience=${input.context.audience || "Not provided"}.
Input: ${adLine(ad)}
Return this JSON shape:
{"overall_score":0,"verdict":"Run | Revise | Reject","confidence":"Low | Medium | High","performance_pattern":"Strong overall | Strong attention, weak conversion | Weak attention, strong offer | Weak hook | Unclear offer | Weak CTA | Poor audience fit | Reject before spending","attention_potential":"Low | Medium | High","conversion_potential":"Low | Medium | High","scores":{"platform_fit":{"score":0,"max":15,"feedback":""},"objective_fit":{"score":0,"max":15,"feedback":""},"audience_fit":{"score":0,"max":15,"feedback":""},"hook_strength":{"score":0,"max":20,"feedback":""},"creative_strength":{"score":0,"max":15,"feedback":""},"offer_clarity":{"score":0,"max":10,"feedback":""},"cta_strength":{"score":0,"max":10,"feedback":""}},"key_strengths":[],"critical_issues":[],"improvements":[],"hook_rewrites":[],"final_verdict":""}`;
}

export function buildVideoHookAuditUserPrompt(input: AdPromptInput) {
  const ad = input.ad || {};
  return `Run Video Hook Audit from sampled key frames only.
Context: platform=${input.context.platform}; objective=${input.context.objective}; audience=${input.context.audience || "Not provided"}.
Input: ${adLine(ad)}
Return this JSON shape:
{"video_hook_audit":{"analysis_mode":"sampled_key_frames","frame_count":0,"hook_strength":{"score":0,"feedback":""},"visual_clarity":{"score":0,"feedback":""},"offer_visibility":{"score":0,"feedback":""},"creative_structure":{"score":0,"feedback":""},"cta_visibility":{"score":0,"feedback":""},"attention_potential":"Low | Medium | High","conversion_potential":"Low | Medium | High","video_verdict":"","limitations":"Based on sampled key frames only. Audio, transcript, and full video sequence are not analyzed."}}`;
}

export function buildCompareAdsUserPrompt(input: AdPromptInput) {
  const ads = input.ads || [];
  return `Compare ads for the same campaign.
Context: platform=${input.context.platform}; objective=${input.context.objective}; audience=${input.context.audience || "Not provided"}.
Ads:
${ads.map(adLine).join("\n")}
Return this JSON shape:
{"campaign_context":{"platform":"","objective":"","target_audience":""},"ads":[{"ad_id":"A","overall_score":0,"verdict":"Run | Revise | Reject","confidence":"Low | Medium | High","performance_pattern":"","attention_potential":"Low | Medium | High","conversion_potential":"Low | Medium | High","strongest_point":"","weakest_point":"","scores":{"platform_fit":0,"objective_fit":0,"audience_fit":0,"hook_strength":0,"creative_strength":0,"offer_clarity":0,"cta_strength":0},"what_to_keep":[],"what_to_fix":[],"suggested_hook_rewrite":"","creative_recommendation":""}],"ranking":[{"rank":1,"ad_id":"","score":0,"reason":""}],"winner":{"ad_id":"","score":0,"why_it_won":"","remaining_risk":""},"final_recommendation":"","test_plan":{"primary_ad":"","backup_ad":"","testing_note":""}}`;
}
