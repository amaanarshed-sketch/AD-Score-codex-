import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { normalizePlan, planFromVariantId } from "../../../../lib/plans";
import { getSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

function verifySignature(rawBody, signature) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
  if (!secret || !signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const actual = Buffer.from(signature, "utf8");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function attrs(payload) {
  return payload?.data?.attributes || {};
}

async function syncSubscription(supabase, payload, eventName) {
  const attributes = attrs(payload);
  const custom = payload?.meta?.custom_data || {};
  const userId = custom.user_id;
  if (!userId) return;

  const variantId = attributes.variant_id || attributes.first_subscription_item?.variant_id;
  // The subscription's current variant is the source of truth: custom_data.plan is frozen at
  // first checkout, so it goes stale after an upgrade or downgrade in the customer portal.
  const variantPlan = planFromVariantId(variantId);
  const plan = normalizePlan(variantPlan !== "free" ? variantPlan : custom.plan);

  await supabase.from("profiles").upsert({
    id: userId,
    email: attributes.user_email || attributes.customer_email || null,
  });

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      lemon_customer_id: String(attributes.customer_id || ""),
      lemon_subscription_id: String(payload?.data?.id || attributes.subscription_id || ""),
      lemon_variant_id: String(variantId || ""),
      plan,
      status: attributes.status || eventName.replace("subscription_", ""),
      renews_at: attributes.renews_at || null,
      ends_at: attributes.ends_at || null,
      trial_ends_at: attributes.trial_ends_at || null,
      customer_portal_url: attributes.urls?.customer_portal || "",
      raw: payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "lemon_subscription_id" },
  );

  // Credits are never reset here. A new credit period starts when renews_at advances
  // (see getSubscriptionPeriodBounds), so pause/resume or plan changes can't refill credits.
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") || "";
  if (!verifySignature(rawBody, signature)) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const payload = JSON.parse(rawBody);
  const eventName = payload?.meta?.event_name || request.headers.get("x-event-name") || "";

  // subscription_payment_* events carry subscription-invoices, not subscriptions; storing them
  // would create bogus subscription rows keyed by invoice id. subscription_updated covers renewals.
  if (eventName.startsWith("subscription_") && payload?.data?.type === "subscriptions") {
    await syncSubscription(supabase, payload, eventName);
  }

  return NextResponse.json({ received: true });
}
