import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { getCurrentBuyer } from "@/lib/buyerAuth";

export const BuyerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [hasBuyerAccess, setHasBuyerAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // Call getCurrentBuyer - this will auto-create the mapping and role if needed
        const buyer = await getCurrentBuyer();
        setHasBuyerAccess(!!buyer);
      }
      
      setLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session) {
        // Call getCurrentBuyer - this will auto-create the mapping and role if needed
        const buyer = await getCurrentBuyer();
        setHasBuyerAccess(!!buyer);
      } else {
        setHasBuyerAccess(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading your buyer dashboard...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/buyer/login" replace />;
  }

  if (!hasBuyerAccess) {
    // No buyer account found for this email
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            No buyer account is linked to this email. Please contact support.
          </p>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="text-primary hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
