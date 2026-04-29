import { createClient } from "@supabase/supabase-js";

let adminClient;

export function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseServerConfig()) return null;
  if (!adminClient) {
    adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export async function getUserFromRequest(request) {
  const supabase = getSupabaseAdminClient();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!supabase || !token) return { user: null, supabase };

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return { user: null, supabase };
  return { user: data.user || null, supabase };
}
