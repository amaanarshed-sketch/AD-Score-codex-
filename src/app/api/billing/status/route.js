import { NextResponse } from "next/server";
import { demoBillingStatus, getBillingStatusForUser } from "../../../../lib/billingServer";
import { getUserFromRequest, hasSupabaseServerConfig } from "../../../../lib/supabaseAdmin";

export async function GET(request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json(demoBillingStatus());
  }

  const { user, supabase } = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({
      ...demoBillingStatus(),
      configured: true,
      authenticated: false,
      message: "Sign in to unlock credits, checkout, and saved subscription status.",
    });
  }

  return NextResponse.json(await getBillingStatusForUser(supabase, user));
}
