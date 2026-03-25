import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertEnv, env } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient() {
  assertEnv();

  if (!browserClient) {
    browserClient = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }

  return browserClient;
}
