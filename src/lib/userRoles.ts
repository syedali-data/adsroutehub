import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'buyer';

export async function getUserRole(): Promise<AppRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return roleData?.role as AppRole | null;
}

export async function checkIsAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

export async function checkIsBuyer(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'buyer';
}
