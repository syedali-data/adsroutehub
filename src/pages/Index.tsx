import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4 bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Lead Management System</h1>
        <p className="text-muted-foreground text-lg">Please select your portal to continue</p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => navigate("/auth")} size="lg">
          <Shield className="mr-2 h-5 w-5" />
          Admin Portal
        </Button>
        <Button variant="outline" onClick={() => navigate("/buyer/login")} size="lg">
          <LogIn className="mr-2 h-5 w-5" />
          Buyer Portal
        </Button>
      </div>
    </div>
  );
};

export default Index;
