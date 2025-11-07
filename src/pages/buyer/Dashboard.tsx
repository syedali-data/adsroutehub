import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentBuyer } from "@/lib/buyerAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, TrendingUp, DollarSign, Package, Calendar } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];
type Delivery = Database["public"]["Tables"]["deliveries"]["Row"];

const BuyerDashboard = () => {
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadBuyer();
  }, []);

  const loadBuyer = async () => {
    const currentBuyer = await getCurrentBuyer();
    
    if (!currentBuyer) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "No buyer account is associated with this email. Please contact support.",
      });
      await supabase.auth.signOut();
      navigate("/buyer/login");
      return;
    }

    setBuyer(currentBuyer);
    setLoading(false);
  };

  const { data: deliveries = [] } = useQuery({
    queryKey: ["buyer-deliveries", buyer?.id],
    enabled: !!buyer,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("buyer_id", buyer!.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Delivery[];
    },
  });

  const stats = {
    last7Days: deliveries.filter((d) => {
      const daysDiff = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length,
    last30Days: deliveries.filter((d) => {
      const daysDiff = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    }).length,
    spend7Days: deliveries
      .filter((d) => {
        const daysDiff = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7 && !d.refunded;
      })
      .reduce((sum, d) => sum + Number(d.charge_amount), 0),
    spend30Days: deliveries
      .filter((d) => {
        const daysDiff = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30 && !d.refunded;
      })
      .reduce((sum, d) => sum + Number(d.charge_amount), 0),
  };

  const updateBuyerMutation = useMutation({
    mutationFn: async (updates: Partial<Buyer>) => {
      const { error } = await supabase
        .from("buyers")
        .update(updates)
        .eq("id", buyer!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-deliveries"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
      loadBuyer();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/buyer/login");
  };

  const handleStatusToggle = (checked: boolean) => {
    updateBuyerMutation.mutate({ status: checked ? "active" : "paused" });
  };

  const handleCapUpdate = (field: "daily_cap" | "shared_cap", value: string) => {
    const num = parseInt(value) || 0;
    const max = field === "daily_cap" ? 50 : 10;
    const clamped = Math.max(0, Math.min(max, num));
    updateBuyerMutation.mutate({ [field]: clamped });
  };

  const handleServicesUpdate = (services: string[]) => {
    updateBuyerMutation.mutate({ services_csv: services.join(",") });
  };

  if (loading || !buyer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const serviceOptions = ["hvac contractor", "closet design", "plumbing"];
  const selectedServices = buyer.services_csv ? buyer.services_csv.split(",").map(s => s.trim()) : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">{buyer.business_name}</h1>
            <p className="text-sm text-muted-foreground">
              {buyer.city} • {buyer.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last7Days}</div>
              <p className="text-xs text-muted-foreground">leads delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last30Days}</div>
              <p className="text-xs text-muted-foreground">leads delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spend (7d)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.spend7Days.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">total charges</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spend (30d)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.spend30Days.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">total charges</p>
            </CardContent>
          </Card>
        </div>

        {/* Status & Caps */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Capacity</CardTitle>
            <CardDescription>Manage your lead receiving preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="status">Active Status</Label>
              <Switch
                id="status"
                checked={buyer.status === "active"}
                onCheckedChange={handleStatusToggle}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daily_cap">Daily Cap (max: 50)</Label>
                <Input
                  id="daily_cap"
                  type="number"
                  min="0"
                  max="50"
                  value={buyer.daily_cap}
                  onChange={(e) => handleCapUpdate("daily_cap", e.target.value)}
                  onBlur={(e) => handleCapUpdate("daily_cap", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shared_cap">Shared Cap (max: 10)</Label>
                <Input
                  id="shared_cap"
                  type="number"
                  min="0"
                  max="10"
                  value={buyer.shared_cap}
                  onChange={(e) => handleCapUpdate("shared_cap", e.target.value)}
                  onBlur={(e) => handleCapUpdate("shared_cap", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Service Preferences</CardTitle>
            <CardDescription>Select the services you want to receive leads for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((service) => (
                <Badge
                  key={service}
                  variant={selectedServices.includes(service) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const newServices = selectedServices.includes(service)
                      ? selectedServices.filter((s) => s !== service)
                      : [...selectedServices, service];
                    handleServicesUpdate(newServices);
                  }}
                >
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Your current pricing structure (contact support to modify)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Pricing Mode:</span>
              <span className="text-sm">{buyer.pricing_mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Shared Lead Price:</span>
              <span className="text-sm">${Number(buyer.price_shared).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Exclusive Lead Price:</span>
              <span className="text-sm">${Number(buyer.price_exclusive).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
            <CardDescription>Your last 20 lead deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lead ID</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No deliveries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>{format(new Date(delivery.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-mono text-xs">{delivery.lead_id?.slice(0, 8)}...</TableCell>
                      <TableCell>${Number(delivery.charge_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {delivery.refunded ? (
                          <Badge variant="destructive">Refunded</Badge>
                        ) : (
                          <Badge variant="default">Charged</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BuyerDashboard;
