import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { checkIsAdmin } from "@/lib/userRoles";

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 [AdminProtectedRoute] Component mounted, initializing auth...');
    let mounted = true;
    
    const checkAuth = async () => {
      console.log("[AdminProtectedRoute] Starting auth check...");
      
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
          console.log("[AdminProtectedRoute] Component unmounted during session check");
          return;
        }
        
        if (sessionError) {
          console.error("[AdminProtectedRoute] Error getting session:", sessionError);
          setLoading(false);
          return;
        }
        
        console.log('🔍 [AdminProtectedRoute] Session:', session?.user?.email || 'No session');
        setSession(session);
        
        if (session) {
          console.log("[AdminProtectedRoute] Checking admin status...");
          
          // Add timeout to admin check
          const adminPromise = checkIsAdmin();
          const adminTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Admin check timeout after 8 seconds')), 8000)
          );
          
          const adminStatus = await Promise.race([
            adminPromise,
            adminTimeoutPromise
          ]) as any;
          
          if (!mounted) {
            console.log("[AdminProtectedRoute] Component unmounted during admin check");
            return;
          }
          
          console.log('🔍 [AdminProtectedRoute] Admin status:', adminStatus);
          setIsAdmin(adminStatus);
        }
      } catch (e) {
        console.error("[AdminProtectedRoute] Auth check failed:", e);
      } finally {
        if (mounted) {
          console.log('🔍 [AdminProtectedRoute] Auth check complete, setting loading = false');
          setLoading(false);
        }
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 [AdminProtectedRoute] Auth state changed:', event, session?.user?.email || 'No session');
      
      if (!mounted) {
        console.log("[AdminProtectedRoute] Component unmounted, ignoring auth change");
        return;
      }
      
      try {
        setSession(session);
        
        if (session) {
          console.log("[AdminProtectedRoute] Checking admin status in auth change...");
          
          // Add timeout to admin check
          const adminPromise = checkIsAdmin();
          const adminTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Admin check timeout in auth change')), 8000)
          );
          
          const adminStatus = await Promise.race([
            adminPromise,
            adminTimeoutPromise
          ]) as any;
          
          if (!mounted) return;
          
          console.log('🔍 [AdminProtectedRoute] Admin status from auth change:', adminStatus);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("[AdminProtectedRoute] Error in auth state change:", e);
        if (mounted) {
          setIsAdmin(false);
        }
      }
    });

    return () => {
      console.log('🔍 [AdminProtectedRoute] Cleanup, unsubscribing...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
