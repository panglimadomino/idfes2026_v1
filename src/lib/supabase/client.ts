import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export function createSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}
