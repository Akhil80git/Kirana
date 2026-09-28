import { createClient } from "@supabase/supabase-js";

// User provided Supabase project credentials
export const SUPABASE_URL = "https://jejrpwmkjklppigazni.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_SvqLM7eUePPKrHPK-4wv4Q_45P13O_g";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Checks connection to Supabase and verifies if the todos table exists
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tableReady: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.from("todos").select("id").limit(1);
    if (!error) {
      return { connected: true, tableReady: true };
    }
    // If table doesn't exist (PGRST116 or 42P01)
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return { connected: true, tableReady: false, error: "Table 'todos' not created yet in Supabase." };
    }
    return { connected: false, tableReady: false, error: error.message };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown connection error";
    return { connected: false, tableReady: false, error: msg };
  }
}
