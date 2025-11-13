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
    console.log('🔍 [BuyerProtectedRoute] Component mounted, initializing auth...');
    let mounted = true;
    
    const checkAuth = async () => {
      console.log("[BuyerProtectedRoute] Starting auth check...");
      
      try {
        // Add timeout to session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout after 10 seconds')), 10000)
        );
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (!mounted) {
          console.log("[BuyerProtectedRoute] Component unmounted during session check");
          return;
        }
        
        if (sessionError) {
          console.error("[BuyerProtectedRoute] Error getting session:", sessionError);
          setError("session-error");
          setLoading(false);
          return;
        }
        
        console.log('🔍 [BuyerProtectedRoute] Session:', session?.user?.email || 'No session');
        setSession(session);
        
        if (session) {
          console.log("[BuyerProtectedRoute] Fetching buyer data...");
          
          // Add timeout to buyer fetch
          const buyerPromise = getCurrentBuyer();
          const buyerTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Buyer fetch timeout after 8 seconds')), 8000)
          );
          
          const buyerData = await Promise.race([
            buyerPromise,
            buyerTimeoutPromise
          ]) as any;
          
          if (!mounted) {
            console.log("[BuyerProtectedRoute] Component unmounted during buyer fetch");
            return;
          }
          
          console.log('🔍 [BuyerProtectedRoute] Buyer data:', buyerData ? 'found' : 'not found');
          setBuyer(buyerData);
          
          if (!buyerData) {
            setError("no-buyer");
          }
        }
      } catch (e) {
        console.error("[BuyerProtectedRoute] Auth check failed:", e);
        if (mounted) {
          setError("unexpected");
        }
      } finally {
        if (mounted) {
          console.log('🔍 [BuyerProtectedRoute] Auth check complete, setting loading = false');
          setLoading(false);
        }
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 [BuyerProtectedRoute] Auth state changed:', event, session?.user?.email || 'No session');
      
      if (!mounted) {
        console.log("[BuyerProtectedRoute] Component unmounted, ignoring auth change");
        return;
      }
      
      try {
        setSession(session);
        
        if (session) {
          console.log("[BuyerProtectedRoute] Session exists, fetching buyer...");
          
          // Add timeout to buyer fetch in auth change
          const buyerPromise = getCurrentBuyer();
          const buyerTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Buyer fetch timeout in auth change')), 8000)
          );
          
          const buyerData = await Promise.race([
            buyerPromise,
            buyerTimeoutPromise
          ]) as any;
          
          if (!mounted) return;
          
          console.log('🔍 [BuyerProtectedRoute] Buyer data from auth change:', buyerData ? 'found' : 'not found');
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
        if (mounted) {
          setError("unexpected");
        }
      }
    });

    return () => {
      console.log('🔍 [BuyerProtectedRoute] Cleanup, unsubscribing...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-lg">Setting up your buyer dashboard...</div>
          {error && (
            <div className="text-sm text-muted-foreground">
              {error === "unexpected" && "An unexpected error occurred. Please try again."}
              {error === "session-error" && "Session error. Please try logging in again."}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!session) {
    console.log("[BuyerProtectedRoute] No session, redirecting to login");
    return <Navigate to="/buyer/login" replace />;
  }

  if (!buyer || error === "no-buyer") {
    console.log("[BuyerProtectedRoute] No buyer found, showing Access Denied");
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            No buyer account is linked to this email ({session.user.email}). Please contact support.
          </p>
          <Button 
            onClick={() => {
              console.log("[BuyerProtectedRoute] Signing out");
              supabase.auth.signOut();
            }} 
            variant="outline"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  console.log("[BuyerProtectedRoute] Rendering buyer dashboard");
  return <>{children}</>;
};
