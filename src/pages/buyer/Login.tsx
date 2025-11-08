import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Mail, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BuyerLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/buyer/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        navigate("/buyer/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if this email exists as a buyer using security definer function
      const { data: buyerExists, error: checkError } = await supabase
        .rpc("buyer_email_exists", { _email: email.trim() });

      if (checkError) {
        console.error("Error checking buyer email:", checkError);
        throw new Error("Failed to validate email. Please try again.");
      }

      if (!buyerExists) {
        toast({
          title: "Access denied",
          description: "We couldn't find a buyer account for this email. Please contact support.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/buyer/dashboard`,
        },
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We sent you a login link. Click it to access your dashboard.",
      });
    } catch (error: any) {
      console.error("Buyer login error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send login link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ADS RouteHub</h1>
            <p className="text-muted-foreground mt-1">Buyer Login</p>
          </div>
        </div>

        {/* Login card */}
        <Card className="border-2">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Sign in with the email your leads are delivered to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="buyer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? "Sending login link..." : "Send login link"}
              </Button>
            </form>

            <Alert className="bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                We'll email you a secure one-time login link. No password required.
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <button
                onClick={() => navigate("/admin")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                Internal user? Go to Admin Portal
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
