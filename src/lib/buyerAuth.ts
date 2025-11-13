import { supabase } from "@/integrations/supabase/client";

export async function getCurrentBuyer() {
  const startTime = performance.now();
  console.log('🔍 [buyerAuth] getCurrentBuyer() started');
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log("[buyerAuth] getCurrentBuyer called, user:", user?.id, user?.email);
    
    if (userError) {
      console.error("[buyerAuth] Error getting user:", userError);
      return null;
    }
    
    if (!user || !user.email) {
      console.log("[buyerAuth] No authenticated user or email");
      return null;
    }

    // Step 1: Try to get buyer via mapping (with join to buyers)
    console.log("[buyerAuth] Checking for existing buyer_users mapping...");
    const { data: buyerUserData, error: mappingError } = await supabase
      .from("buyer_users")
      .select("buyer_id, buyers(*)")
      .eq("id", user.id)
      .maybeSingle();

    if (mappingError) {
      console.error("[buyerAuth] Error querying buyer_users:", mappingError);
      // Continue to fallback
    }

    if (buyerUserData?.buyers) {
      console.log("[buyerAuth] Found existing mapping, returning buyer:", buyerUserData.buyers);
      return buyerUserData.buyers;
    }

    // Step 2: No mapping exists - look for buyer with matching email
    console.log("[buyerAuth] No mapping found, looking up buyer by email:", user.email);
    
    const { data: buyer, error: buyerError } = await supabase
      .from("buyers")
      .select("*")
      .ilike("email", user.email)
      .maybeSingle();

    if (buyerError) {
      console.error("[buyerAuth] Error querying buyers table:", buyerError);
      return null;
    }

    if (!buyer) {
      console.log("[buyerAuth] No buyer found with email:", user.email);
      return null;
    }

    console.log("[buyerAuth] Found matching buyer (id:", buyer.id, "), auto-creating mapping and role");
    
    // Step 3: Auto-create buyer_users mapping
    const { error: insertMappingError } = await supabase
      .from("buyer_users")
      .insert({
        id: user.id,
        buyer_id: buyer.id
      });
    
    if (insertMappingError) {
      if (insertMappingError.message?.includes("duplicate") || insertMappingError.code === "23505") {
        console.log("[buyerAuth] Buyer_users mapping already exists (duplicate key)");
      } else {
        console.error("[buyerAuth] Failed to create buyer_users mapping:", insertMappingError);
      }
    } else {
      console.log("[buyerAuth] Successfully created buyer_users mapping");
    }
    
    // Step 4: Auto-create user_roles entry
    const { error: insertRoleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: 'buyer'
      });
    
    if (insertRoleError) {
      if (insertRoleError.message?.includes("duplicate") || insertRoleError.code === "23505") {
        console.log("[buyerAuth] User_roles entry already exists (duplicate key)");
      } else {
        console.error("[buyerAuth] Failed to create user_roles entry:", insertRoleError);
      }
    } else {
      console.log("[buyerAuth] Successfully created user_roles entry");
    }
    
    // Step 5: Return the buyer (mapping and role creation are best-effort)
    const duration = performance.now() - startTime;
    console.log(`🔍 [buyerAuth] getCurrentBuyer() completed in ${duration.toFixed(0)}ms, returning buyer`);
    return buyer;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`🔍 [buyerAuth] getCurrentBuyer() failed after ${duration.toFixed(0)}ms:`, error);
    return null;
  }
}

