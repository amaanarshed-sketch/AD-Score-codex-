import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/supabaseAdmin";
import { hasLemonSqueezyConfig } from "../../../../lib/billingServer";

const variantByPlan = {
  plus: process.env.LEMONSQUEEZY_PLUS_VARIANT_ID,
  pro: process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
};

export async function POST(request) {
  const { user } = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Sign in before upgrading." }, { status: 401 });
  if (!hasLemonSqueezyConfig()) return NextResponse.json({ error: "Lemon Squeezy is not configured yet." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const plan = String(body.plan || "").toLowerCase();
  const variantId = variantByPlan[plan];
  if (!variantId) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3001";
  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          test_mode: process.env.LEMONSQUEEZY_TEST_MODE !== "false",
          product_options: {
            enabled_variants: [Number(variantId)],
            redirect_url: `${appUrl}/account?checkout=success`,
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: false,
            discount: true,
            button_color: "#67e8f9",
          },
          checkout_data: {
            email: user.email,
            custom: {
              user_id: user.id,
              plan,
            },
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(process.env.LEMONSQUEEZY_STORE_ID) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json({ error: data?.errors?.[0]?.detail || "Unable to create checkout." }, { status: 502 });
  }

  const url = data?.data?.attributes?.url;
  if (!url) return NextResponse.json({ error: "Checkout URL was not returned." }, { status: 502 });
  return NextResponse.json({ url });
}
