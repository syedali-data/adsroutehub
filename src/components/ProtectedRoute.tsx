import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 [ProtectedRoute] Component mounted, initializing auth...');
    let mounted = true;
    
    const checkAuth = async () => {
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
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error("[ProtectedRoute] Error getting session:", sessionError);
        }
        
        console.log('🔍 [ProtectedRoute] Session:', session?.user?.email || 'No session');
        setSession(session);
      } catch (e) {
        console.error("[ProtectedRoute] Auth check failed:", e);
      } finally {
        if (mounted) {
          console.log('🔍 [ProtectedRoute] Auth check complete, setting loading = false');
          setLoading(false);
        }
      }
    };
    
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 [ProtectedRoute] Auth state changed:', event, session?.user?.email || 'No session');
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      console.log('🔍 [ProtectedRoute] Cleanup, unsubscribing...');
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

  return <>{children}</>;
};