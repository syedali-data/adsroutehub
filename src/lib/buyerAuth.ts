import { supabase } from "@/integrations/supabase/client";

export async function getCurrentBuyer() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("[buyerAuth] No authenticated user");
    return null;
  }

  console.log("[buyerAuth] Checking buyer access for user:", user.email);

  // First check if buyer_users mapping exists
  const { data: buyerUser, error: buyerUserError } = await supabase
    .from("buyer_users")
    .select("buyer_id")
    .eq("id", user.id)
    .single();

  if (buyerUserError && buyerUserError.code !== 'PGRST116') {
    console.error("[buyerAuth] Error fetching buyer_users:", buyerUserError);
  }

  if (buyerUser) {
    console.log("[buyerAuth] Found existing buyer mapping:", buyerUser.buyer_id);
    // Fetch the buyer record
    const { data: buyer, error: buyerError } = await supabase
      .from("buyers")
      .select("*")
      .eq("id", buyerUser.buyer_id)
      .single();
    
    if (buyerError) {
      console.error("[buyerAuth] Error fetching buyer:", buyerError);
      return null;
    }
    
    return buyer;
  }

  // Auto-create mapping if buyer email matches
  console.log("[buyerAuth] No mapping found, checking for buyer by email:", user.email);
  const { data: buyer, error: buyerLookupError } = await supabase
    .from("buyers")
    .select("*")
    .eq("email", user.email)
    .single();

  if (buyerLookupError) {
    if (buyerLookupError.code === 'PGRST116') {
      console.log("[buyerAuth] No buyer found with email:", user.email);
    } else {
      console.error("[buyerAuth] Error looking up buyer:", buyerLookupError);
    }
    return null;
  }

  if (buyer) {
    console.log("[buyerAuth] Found buyer, creating mapping for:", buyer.id);
    
    // Create the buyer_users mapping
    const { error: mappingError } = await supabase
      .from("buyer_users")
      .insert({
        id: user.id,
        buyer_id: buyer.id
      });
    
    if (mappingError) {
      console.error("[buyerAuth] Error creating buyer_users mapping:", mappingError);
      return null;
    }
    
    // Assign buyer role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: 'buyer'
      });
    
    if (roleError) {
      console.error("[buyerAuth] Error creating buyer role:", roleError);
      return null;
    }
    
    console.log("[buyerAuth] Successfully created buyer mapping and role");
    return buyer;
  }

  console.log("[buyerAuth] No matching buyer found");
  return null;
}
