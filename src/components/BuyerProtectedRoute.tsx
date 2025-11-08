import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { checkIsBuyer } from "@/lib/userRoles";
import { canUserBecomeBuyer } from "@/lib/buyerAuth";

export const BuyerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isBuyerOrCanBe, setIsBuyerOrCanBe] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // Check if they ARE a buyer OR CAN BECOME one (email matches)
        const isBuyer = await checkIsBuyer();
        const canBeBuyer = !isBuyer ? await canUserBecomeBuyer() : false;
        setIsBuyerOrCanBe(isBuyer || canBeBuyer);
      }
      
      setLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session) {
        const isBuyer = await checkIsBuyer();
        const canBeBuyer = !isBuyer ? await canUserBecomeBuyer() : false;
        setIsBuyerOrCanBe(isBuyer || canBeBuyer);
      } else {
        setIsBuyerOrCanBe(false);
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

  if (!isBuyerOrCanBe) {
    // Not a buyer and email doesn't match any buyer
    return <Navigate to="/buyer/login" replace />;
  }

  return <>{children}</>;
};
