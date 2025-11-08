import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn, Shield, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-12 p-4 sm:p-8">
        {/* Hero section */}
        <div className="text-center space-y-6 max-w-3xl">
          {/* Logo/Brand */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg mb-4">
            <TrendingUp className="w-10 h-10 text-primary-foreground" />
          </div>
          
          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            ADS RouteHub
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Lead routing & buyer insights for local service businesses
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4">
          <Button 
            onClick={() => navigate("/buyer/login")} 
            size="lg"
            className="flex-1 h-14 text-base"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Buyer Portal
          </Button>
          <Button 
            onClick={() => navigate("/admin")}
            variant="outline"
            size="lg"
            className="flex-1 h-14 text-base"
          >
            <Shield className="mr-2 h-5 w-5" />
            Admin Portal
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {currentYear} ADS RouteHub – Analyticals Data Services
        </p>
      </footer>
    </div>
  );
};

export default Index;
