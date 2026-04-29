import { NextResponse } from "next/server";
import { billingConfigured, hasLemonSqueezyConfig } from "../../../lib/billingServer";
import { hasSupabaseServerConfig } from "../../../lib/supabaseAdmin";

export function GET() {
  return NextResponse.json({
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    storageConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    authConfigured: hasSupabaseServerConfig(),
    lemonSqueezyConfigured: hasLemonSqueezyConfig(),
    billingConfigured: billingConfigured(),
  });
}
