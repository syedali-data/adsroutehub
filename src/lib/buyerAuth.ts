import { supabase } from "@/integrations/supabase/client";

export async function getCurrentBuyer() {
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log("[buyerAuth] getCurrentBuyer called, user:", user?.id, user?.email);
  
  if (!user) {
    console.log("[buyerAuth] No user found");
    return null;
  }

  // First check if buyer_users mapping exists
  const { data: buyerUser, error: buyerUserError } = await supabase
    .from("buyer_users")
    .select("buyer_id")
    .eq("id", user.id)
    .maybeSingle();

  console.log("[buyerAuth] Checked buyer_users:", { buyerUser, error: buyerUserError });

  if (buyerUser) {
    console.log("[buyerAuth] Found existing mapping, fetching buyer:", buyerUser.buyer_id);
    // Fetch the buyer record
    const { data: buyer, error: buyerError } = await supabase
      .from("buyers")
      .select("*")
      .eq("id", buyerUser.buyer_id)
      .maybeSingle();
    
    console.log("[buyerAuth] Fetched buyer:", { buyer, error: buyerError });
    return buyer;
  }

  // Auto-create mapping if buyer email matches
  console.log("[buyerAuth] No mapping found, checking for buyer with email:", user.email);
  
  const { data: buyer, error: buyerLookupError } = await supabase
    .from("buyers")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  console.log("[buyerAuth] Buyer lookup result:", { buyer, error: buyerLookupError });

  if (buyer) {
    console.log("[buyerAuth] Found matching buyer, creating mapping and role");
    
    // Create the buyer_users mapping
    const { error: mappingError } = await supabase
      .from("buyer_users")
      .insert({
        id: user.id,
        buyer_id: buyer.id
      });
    
    if (mappingError) {
      console.error("[buyerAuth] Failed to create buyer mapping:", mappingError);
      // Check if it's a duplicate key error (mapping already exists)
      if (!mappingError.message?.includes("duplicate")) {
        throw mappingError;
      }
      console.log("[buyerAuth] Mapping already exists, continuing");
    } else {
      console.log("[buyerAuth] Successfully created buyer_users mapping");
    }
    
    // Assign buyer role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: 'buyer'
      });
    
    if (roleError) {
      console.error("[buyerAuth] Failed to create buyer role:", roleError);
      // Check if it's a duplicate key error (role already exists)
      if (!roleError.message?.includes("duplicate")) {
        throw roleError;
      }
      console.log("[buyerAuth] Role already exists, continuing");
    } else {
      console.log("[buyerAuth] Successfully created buyer role");
    }
    
    return buyer;
  }

  console.log("[buyerAuth] No matching buyer found for email:", user.email);
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
