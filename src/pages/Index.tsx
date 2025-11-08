import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn, Shield } from "lucide-react";
import adsLogo from "@/assets/ads-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <main className="relative flex-1 flex flex-col items-center justify-center gap-16 p-4 sm:p-8">
        {/* Hero section */}
        <div className="text-center space-y-8 max-w-3xl">
          {/* Logo */}
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src={adsLogo} 
              alt="ADS Logo" 
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl"
            />
          </div>
          
          {/* Main headline */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">
            ADS RouteHub
          </h1>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg px-4">
          <Button 
            onClick={() => navigate("/buyer/login")} 
            size="lg"
            className="flex-1 h-16 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <LogIn className="mr-3 h-6 w-6" />
            Buyer Portal
          </Button>
          <Button 
            onClick={() => navigate("/admin")}
            variant="outline"
            size="lg"
            className="flex-1 h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2"
          >
            <Shield className="mr-3 h-6 w-6" />
            Admin Portal
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © {currentYear} ADS RouteHub – Analyticals Data Services
        </p>
      </footer>
    </div>
  );
};

export default Index;
