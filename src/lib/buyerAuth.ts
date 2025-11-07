import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];

export async function getCurrentBuyer(): Promise<Buyer | null> {
  try {
    // Get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return null;
    }

    // Check if buyer_users mapping exists
    const { data: buyerUser, error: buyerUserError } = await supabase
      .from("buyer_users")
      .select("buyer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (buyerUserError) {
      console.error("Error fetching buyer_users:", buyerUserError);
      return null;
    }

    // If mapping exists, fetch the buyer
    if (buyerUser) {
      const { data: buyer, error: buyerError } = await supabase
        .from("buyers")
        .select("*")
        .eq("id", buyerUser.buyer_id)
        .single();

      if (buyerError) {
        console.error("Error fetching buyer:", buyerError);
        return null;
      }

      return buyer;
    }

    // No mapping exists - try to auto-create one based on email match
    const { data: matchingBuyer, error: matchError } = await supabase
      .from("buyers")
      .select("*")
      .eq("email", user.email!)
      .maybeSingle();

    if (matchError) {
      console.error("Error finding matching buyer:", matchError);
      return null;
    }

    if (!matchingBuyer) {
      // No buyer with this email exists
      return null;
    }

    // Create the buyer_users mapping
    const { error: insertError } = await supabase
      .from("buyer_users")
      .insert({
        id: user.id,
        buyer_id: matchingBuyer.id,
      });

    if (insertError) {
      console.error("Error creating buyer_users mapping:", insertError);
      return null;
    }

    return matchingBuyer;
  } catch (error) {
    console.error("Unexpected error in getCurrentBuyer:", error);
    return null;
  }
}
