import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { getCurrentBuyer } from "@/lib/buyerAuth";
import { Button } from "@/components/ui/button";

export const BuyerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [buyer, setBuyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[BuyerProtectedRoute] Checking auth...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[BuyerProtectedRoute] Error getting session:", sessionError);
          setError("session-error");
          return;
        }
        
        console.log("[BuyerProtectedRoute] Session:", session ? "exists" : "none");
        setSession(session);
        
        if (session) {
          console.log("[BuyerProtectedRoute] Fetching buyer data...");
          const buyerData = await getCurrentBuyer();
          console.log("[BuyerProtectedRoute] Buyer data:", buyerData ? "found" : "not found");
          setBuyer(buyerData);
          
          if (!buyerData) {
            setError("no-buyer");
          }
        }
      } catch (e) {
        console.error("[BuyerProtectedRoute] Unexpected error in checkAuth:", e);
        setError("unexpected");
      } finally {
        console.log("[BuyerProtectedRoute] Setting loading to false");
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[BuyerProtectedRoute] Auth state changed, event:", event);
      
      try {
        setSession(session);
        
        if (session) {
          console.log("[BuyerProtectedRoute] Session exists, fetching buyer...");
          const buyerData = await getCurrentBuyer();
          console.log("[BuyerProtectedRoute] Buyer data from auth change:", buyerData ? "found" : "not found");
          setBuyer(buyerData);
          
          if (!buyerData) {
            setError("no-buyer");
          } else {
            setError(null);
          }
        } else {
          console.log("[BuyerProtectedRoute] No session, clearing buyer");
          setBuyer(null);
          setError(null);
        }
      } catch (e) {
        console.error("[BuyerProtectedRoute] Error in auth state change:", e);
        setError("unexpected");
      } finally {
        setLoading(false);
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

  if (!buyer) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            No buyer account is linked to this email ({session.user.email}). Please contact support.
          </p>
          <Button 
            onClick={() => supabase.auth.signOut()} 
            variant="outline"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
