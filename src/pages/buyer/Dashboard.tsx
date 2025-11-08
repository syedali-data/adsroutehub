import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentBuyer } from "@/lib/buyerAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const SERVICE_OPTIONS = [
  "hvac contractor",
  "closet design",
  "plumbing",
  "electrical",
  "roofing",
  "painting",
];

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: buyer, isLoading, error } = useQuery({
    queryKey: ["current-buyer"],
    queryFn: getCurrentBuyer,
    retry: 2,
  });

  const { data: stats } = useQuery({
    queryKey: ["buyer-stats", buyer?.id],
    queryFn: async () => {
      if (!buyer) return null;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: deliveries7d } = await supabase
        .from("deliveries")
        .select("charge_amount, refunded")
        .eq("buyer_id", buyer.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      const { data: deliveries30d } = await supabase
        .from("deliveries")
        .select("charge_amount, refunded")
        .eq("buyer_id", buyer.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      return {
        count7d: deliveries7d?.length || 0,
        count30d: deliveries30d?.length || 0,
        spend7d: deliveries7d?.filter(d => !d.refunded).reduce((sum, d) => sum + Number(d.charge_amount), 0) || 0,
        spend30d: deliveries30d?.filter(d => !d.refunded).reduce((sum, d) => sum + Number(d.charge_amount), 0) || 0,
      };
    },
    enabled: !!buyer,
  });

  const { data: recentDeliveries } = useQuery({
    queryKey: ["buyer-recent-deliveries", buyer?.id],
    queryFn: async () => {
      if (!buyer) return [];

      const { data } = await supabase
        .from("deliveries")
        .select(`
          id,
          created_at,
          charge_amount,
          refunded,
          lead_id,
          leads (name)
        `)
        .eq("buyer_id", buyer.id)
        .order("created_at", { ascending: false })
        .limit(20);

      return data || [];
    },
    enabled: !!buyer,
  });

  const updateBuyerMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!buyer) throw new Error("No buyer found");
      
      const { error } = await supabase
        .from("buyers")
        .update(updates)
        .eq("id", buyer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-buyer"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/buyer/login");
  };

  useEffect(() => {
    if (!isLoading && !buyer) {
      console.error("[BuyerDashboard] No buyer found after loading:", error);
      
      const errorMessage = error 
        ? `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        : "No buyer account is associated with this email. Please contact support.";
      
      toast({
        title: "Access denied",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Give user time to see the error before redirecting
      setTimeout(() => {
        console.log("[BuyerDashboard] Redirecting to login");
        navigate("/buyer/login");
      }, 3000);
    } else if (buyer) {
      console.log("[BuyerDashboard] Buyer loaded successfully:", buyer.business_name, buyer.email);
    }
  }, [buyer, isLoading, error, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Setting up your buyer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!buyer) return null;

  const selectedServices = buyer.services_csv?.split(",").map(s => s.trim()).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{buyer.business_name}</h1>
            <p className="text-muted-foreground">{buyer.city} • {buyer.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last 7 days</CardDescription>
              <CardTitle className="text-3xl">{stats?.count7d || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Leads delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last 30 days</CardDescription>
              <CardTitle className="text-3xl">{stats?.count30d || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Leads delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last 7 days</CardDescription>
              <CardTitle className="text-3xl">${stats?.spend7d.toFixed(2) || "0.00"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total spend</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last 30 days</CardDescription>
              <CardTitle className="text-3xl">${stats?.spend30d.toFixed(2) || "0.00"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total spend</p>
            </CardContent>
          </Card>
        </div>

        {/* Status & Caps */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Capacity</CardTitle>
            <CardDescription>Control when you receive leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="status-switch">Active status</Label>
              <Switch
                id="status-switch"
                checked={buyer.status === "active"}
                onCheckedChange={(checked) => {
                  updateBuyerMutation.mutate({ status: checked ? "active" : "paused" });
                }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daily-cap">Daily cap (max: 50)</Label>
                <Input
                  id="daily-cap"
                  type="number"
                  min="0"
                  max="50"
                  value={buyer.daily_cap}
                  onChange={(e) => {
                    const value = Math.min(50, Math.max(0, parseInt(e.target.value) || 0));
                    updateBuyerMutation.mutate({ daily_cap: value });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shared-cap">Shared cap (max: 10)</Label>
                <Input
                  id="shared-cap"
                  type="number"
                  min="0"
                  max="10"
                  value={buyer.shared_cap}
                  onChange={(e) => {
                    const value = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                    updateBuyerMutation.mutate({ shared_cap: value });
                  }}
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
            <div className="space-y-3">
              {SERVICE_OPTIONS.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={selectedServices.includes(service)}
                    onCheckedChange={(checked) => {
                      let newServices = [...selectedServices];
                      if (checked) {
                        newServices.push(service);
                      } else {
                        newServices = newServices.filter(s => s !== service);
                      }
                      updateBuyerMutation.mutate({ services_csv: newServices.join(",") });
                    }}
                  />
                  <Label htmlFor={service} className="cursor-pointer">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Your current pricing structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pricing mode:</span>
              <span className="font-medium">{buyer.pricing_mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shared lead price:</span>
              <span className="font-medium">${Number(buyer.price_shared).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exclusive lead price:</span>
              <span className="font-medium">${Number(buyer.price_exclusive).toFixed(2)}</span>
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
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Refunded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeliveries?.map((delivery: any) => (
                  <TableRow key={delivery.id}>
                    <TableCell>{new Date(delivery.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{delivery.leads?.name || "N/A"}</TableCell>
                    <TableCell>${Number(delivery.charge_amount).toFixed(2)}</TableCell>
                    <TableCell>{delivery.refunded ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
                {(!recentDeliveries || recentDeliveries.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No deliveries yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
