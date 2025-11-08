import { supabase } from "@/integrations/supabase/client";

export async function getCurrentBuyer() {
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log("[buyerAuth] getCurrentBuyer called, user:", user?.id, user?.email);
  
  if (!user || !user.email) {
    console.log("[buyerAuth] No authenticated user or email");
    return null;
  }

  // Step 1: Check if buyer_users mapping already exists
  const { data: buyerUser } = await supabase
    .from("buyer_users")
    .select("buyer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (buyerUser) {
    console.log("[buyerAuth] Found existing mapping, fetching buyer:", buyerUser.buyer_id);
    const { data: buyer } = await supabase
      .from("buyers")
      .select("*")
      .eq("id", buyerUser.buyer_id)
      .maybeSingle();
    
    console.log("[buyerAuth] Fetched buyer:", buyer);
    return buyer;
  }

  // Step 2: No mapping exists - look for buyer with matching email
  console.log("[buyerAuth] No mapping found, looking up buyer by email:", user.email);
  
  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .ilike("email", user.email)
    .maybeSingle();

  if (!buyer) {
    console.log("[buyerAuth] No buyer found with email:", user.email);
    return null;
  }

  console.log("[buyerAuth] Found matching buyer, auto-creating mapping and role");
  
  // Step 3: Auto-create buyer_users mapping
  const { error: mappingError } = await supabase
    .from("buyer_users")
    .insert({
      id: user.id,
      buyer_id: buyer.id
    });
  
  if (mappingError && !mappingError.message?.includes("duplicate")) {
    console.error("[buyerAuth] Failed to create buyer_users mapping:", mappingError);
    // Don't throw - just log and continue, buyer might still work
  } else {
    console.log("[buyerAuth] Created buyer_users mapping");
  }
  
  // Step 4: Auto-create user_roles entry
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({
      user_id: user.id,
      role: 'buyer'
    });
  
  if (roleError && !roleError.message?.includes("duplicate")) {
    console.error("[buyerAuth] Failed to create user_roles entry:", roleError);
    // Don't throw - just log and continue, buyer might still work
  } else {
    console.log("[buyerAuth] Created user_roles entry");
  }
  
  // Step 5: Return the buyer (mapping and role creation are best-effort)
  return buyer;
}

