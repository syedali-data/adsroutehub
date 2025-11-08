import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { checkIsBuyer } from "@/lib/userRoles";

export const BuyerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isBuyer, setIsBuyer] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const buyerStatus = await checkIsBuyer();
        setIsBuyer(buyerStatus);
      }
      
      setLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session) {
        const buyerStatus = await checkIsBuyer();
        setIsBuyer(buyerStatus);
      } else {
        setIsBuyer(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/buyer/login" replace />;
  }

  if (!isBuyer) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
