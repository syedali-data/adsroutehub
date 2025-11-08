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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // getCurrentBuyer will auto-create mapping and role if buyer email matches
        const buyerData = await getCurrentBuyer();
        setBuyer(buyerData);
      }
      
      setLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session) {
        const buyerData = await getCurrentBuyer();
        setBuyer(buyerData);
      } else {
        setBuyer(null);
      }
      
      setLoading(false);
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
