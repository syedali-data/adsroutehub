import { SupabaseClient } from "@supabase/supabase-js";

export async function getSettingsMap(supabase: SupabaseClient): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) throw error;
  
  const map: Record<string, string> = {};
  for (const row of data || []) {
    map[row.key] = row.value;
  }
  return map;
}
