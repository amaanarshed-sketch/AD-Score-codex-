import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    storageConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
