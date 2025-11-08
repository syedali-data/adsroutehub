import { supabase } from "@/integrations/supabase/client";

export async function getCurrentBuyer() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // First check if buyer_users mapping exists
  const { data: buyerUser } = await supabase
    .from("buyer_users")
    .select("buyer_id")
    .eq("id", user.id)
    .single();

  if (buyerUser) {
    // Fetch the buyer record
    const { data: buyer } = await supabase
      .from("buyers")
      .select("*")
      .eq("id", buyerUser.buyer_id)
      .single();
    
    return buyer;
  }

  // Auto-create mapping if buyer email matches
  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("email", user.email)
    .single();

  if (buyer) {
    // Create the buyer_users mapping
    const { error: mappingError } = await supabase
      .from("buyer_users")
      .insert({
        id: user.id,
        buyer_id: buyer.id
      });
    
    if (mappingError) {
      console.error("Failed to create buyer mapping:", mappingError);
      throw mappingError;
    }
    
    // Assign buyer role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: 'buyer'
      });
    
    if (roleError) {
      console.error("Failed to create buyer role:", roleError);
      throw roleError;
    }
    
    return buyer;
  }

  return null;
}

// New helper: check if user email matches any buyer (for auth guard)
export async function canUserBecomeBuyer(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.email) {
    return false;
  }

  const { data: buyer } = await supabase
    .from("buyers")
    .select("id")
    .eq("email", user.email)
    .single();

  return !!buyer;
}
