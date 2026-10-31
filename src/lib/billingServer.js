import { NextResponse } from "next/server";
import { canUseCreativeAi, canUseVideoAudit, creditsForRequest, normalizePlan, PLAN_CONFIG } from "./plans";
import { getUserFromRequest, hasSupabaseServerConfig } from "./supabaseAdmin";

// cancelled keeps access until ends_at (Lemon Squeezy then sends subscription_expired);
// past_due keeps access while Lemon Squeezy retries the payment.
const activeStatuses = new Set(["active", "on_trial", "cancelled", "past_due"]);

export function hasLemonSqueezyConfig() {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET &&
      process.env.LEMONSQUEEZY_PLUS_VARIANT_ID &&
      process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
  );
}

export function billingConfigured() {
  return hasSupabaseServerConfig() && hasLemonSqueezyConfig();
}

export function getPeriodBounds(now = new Date()) {
  return {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}

function addUtcMonths(date, months) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

// Paid credit periods follow the subscription's billing cycle: the month ending at renews_at.
// The period only moves when Lemon Squeezy advances renews_at after a successful renewal, so
// past_due users keep their current (used) balance instead of getting fresh credits.
export function getSubscriptionPeriodBounds(subscription, now = new Date()) {
  const anchor = subscription?.renews_at || subscription?.ends_at;
  if (!anchor || Number.isNaN(Date.parse(anchor))) return getPeriodBounds(now);
  const periodEnd = new Date(anchor);
  return { periodStart: addUtcMonths(periodEnd, -1).toISOString(), periodEnd: periodEnd.toISOString() };
}

export function demoBillingStatus() {
  return {
    configured: false,
    authenticated: false,
    plan: "free",
    planName: "Free",
    status: "demo",
    monthlyCredits: PLAN_CONFIG.free.monthlyCredits,
    usedCredits: 0,
    remainingCredits: PLAN_CONFIG.free.monthlyCredits,
    customerPortalUrl: "",
    message: "Billing/auth is not configured yet. Demo scoring stays local and does not call paid AI.",
  };
}

function statusPayload({ plan, status, balance, subscription, configured = true }) {
  const normalizedPlan = normalizePlan(plan);
  const monthlyCredits = PLAN_CONFIG[normalizedPlan].monthlyCredits;
  const usedCredits = Number(balance?.used_credits || 0);
  return {
    configured,
    authenticated: configured,
    plan: normalizedPlan,
    planName: PLAN_CONFIG[normalizedPlan].name,
    status: status || subscription?.status || "free",
    monthlyCredits,
    usedCredits,
    remainingCredits: Math.max(0, monthlyCredits - usedCredits),
    periodStart: balance?.period_start || "",
    periodEnd: balance?.period_end || "",
    balanceId: balance?.id || "",
    customerPortalUrl: subscription?.customer_portal_url || "",
  };
}

export async function getBillingStatusForUser(supabase, user) {
  if (!supabase || !user) return demoBillingStatus();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", [...activeStatuses])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = normalizePlan(subscription?.plan || "free");
  const { periodStart, periodEnd } = subscription ? getSubscriptionPeriodBounds(subscription) : getPeriodBounds();
  const monthlyCredits = PLAN_CONFIG[plan].monthlyCredits;

  let { data: balance } = await supabase
    .from("credit_balances")
    .select("*")
    .eq("user_id", user.id)
    .eq("period_start", periodStart)
    .maybeSingle();

  if (!balance) {
    const { data } = await supabase
      .from("credit_balances")
      .insert({
        user_id: user.id,
        plan,
        monthly_credits: monthlyCredits,
        used_credits: 0,
        period_start: periodStart,
        period_end: periodEnd,
      })
      .select("*")
      .single();
    balance = data;
  } else if (balance.plan !== plan || Number(balance.monthly_credits) !== monthlyCredits) {
    const { data } = await supabase
      .from("credit_balances")
      .update({ plan, monthly_credits: monthlyCredits, period_end: periodEnd })
      .eq("id", balance.id)
      .select("*")
      .single();
    balance = data || balance;
  }

  return statusPayload({ plan, subscription, balance });
}

export async function authorizeAnalysisRequest(request, { compare = false, ad, ads = [] } = {}) {
  const credits = creditsForRequest({ compare, ad, ads });
  const hasPaidAi = Boolean(process.env.OPENAI_API_KEY);

  if (!hasPaidAi) {
    return {
      allowed: true,
      demo: true,
      credits,
      allowImageAnalysis: false,
      allowVideoAudit: true,
      billing: demoBillingStatus(),
    };
  }

  if (!hasSupabaseServerConfig()) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Auth and billing must be configured before real AI can be used." }, { status: 503 }),
    };
  }

  const { user, supabase } = await getUserFromRequest(request);
  if (!user) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Sign in to use real AI analysis." }, { status: 401 }),
    };
  }

  const billing = await getBillingStatusForUser(supabase, user);
  const plan = billing.plan;
  const submittedAds = compare ? ads : [ad];
  const usesImage = submittedAds.some((item) => item?.creativeType === "image");
  const usesVideo = submittedAds.some((item) => item?.creativeType === "video");

  if (usesImage && !canUseCreativeAi(plan)) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Image AI analysis is available on Plus and Pro. Free uploads remain preview-only." }, { status: 402 }),
    };
  }

  if (usesVideo && !canUseVideoAudit(plan)) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Video Hook Audit is available on Plus and Pro. Free video uploads remain preview-only." }, { status: 402 }),
    };
  }

  if (billing.remainingCredits < credits) {
    return {
      allowed: false,
      response: NextResponse.json({ error: `Not enough credits. This analysis needs ${credits} credits.` }, { status: 402 }),
    };
  }

  return {
    allowed: true,
    demo: false,
    credits,
    user,
    supabase,
    billing,
    allowImageAnalysis: canUseCreativeAi(plan),
    allowVideoAudit: canUseVideoAudit(plan),
  };
}

export async function reserveUsage(auth, featureType, metadata = {}) {
  if (!auth?.supabase || !auth?.user || auth.demo || !auth.billing?.balanceId) return null;
  const { data: balance } = await auth.supabase
    .from("credit_balances")
    .select("*")
    .eq("id", auth.billing.balanceId)
    .single();

  if (!balance) return null;
  const nextUsed = Number(balance.used_credits || 0) + Number(auth.credits || 0);

  const { data: event } = await auth.supabase.from("usage_events").insert({
    user_id: auth.user.id,
    feature_type: featureType,
    credits_used: auth.credits,
    metadata: { ...metadata, status: "reserved" },
  }).select("*").single();

  const { data } = await auth.supabase
    .from("credit_balances")
    .update({ used_credits: nextUsed })
    .eq("id", balance.id)
    .select("*")
    .single();

  return { balance: data, event };
}

export async function refundUsage(auth, reservation, reason = "ai_failed") {
  const balanceId = reservation?.balance?.id || auth?.billing?.balanceId;
  if (!auth?.supabase || !auth?.user || auth.demo || !reservation || !balanceId) return null;
  const { data: balance } = await auth.supabase
    .from("credit_balances")
    .select("*")
    .eq("id", balanceId)
    .single();

  if (!balance) return null;
  const credits = Number(auth.credits || 0);
  const nextUsed = Math.max(0, Number(balance.used_credits || 0) - credits);

  await auth.supabase.from("usage_events").insert({
    user_id: auth.user.id,
    feature_type: "refund",
    credits_used: -credits,
    metadata: {
      reason,
      reserved_event_id: reservation.event?.id || "",
    },
  });

  const { data } = await auth.supabase
    .from("credit_balances")
    .update({ used_credits: nextUsed })
    .eq("id", balance.id)
    .select("*")
    .single();

  return data;
}

export async function recordUsage(auth, featureType, metadata = {}) {
  return reserveUsage(auth, featureType, metadata);
}
