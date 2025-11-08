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
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceMultiSelect } from "@/components/buyers/ServiceMultiSelect";
import { TrendingUp, DollarSign, Package, Calendar } from "lucide-react";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for form editing
  const [statusActive, setStatusActive] = useState(true);
  const [dailyCap, setDailyCap] = useState(10);
  const [sharedCap, setSharedCap] = useState(3);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [hasUnsavedCapacity, setHasUnsavedCapacity] = useState(false);
  const [hasUnsavedServices, setHasUnsavedServices] = useState(false);

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

  const updateCapacityMutation = useMutation({
    mutationFn: async (updates: { status?: "active" | "paused"; daily_cap?: number; shared_cap?: number }) => {
      if (!buyer) throw new Error("No buyer found");
      
      const { error } = await supabase
        .from("buyers")
        .update(updates)
        .eq("id", buyer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-buyer"] });
      setHasUnsavedCapacity(false);
      toast({
        title: "Settings updated",
        description: "Status & capacity preferences saved.",
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

  const updateServicesMutation = useMutation({
    mutationFn: async (services: string[]) => {
      if (!buyer) throw new Error("No buyer found");
      
      const { error } = await supabase
        .from("buyers")
        .update({ services_csv: services.join(",") })
        .eq("id", buyer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-buyer"] });
      setHasUnsavedServices(false);
      toast({
        title: "Services updated",
        description: "Your service preferences have been saved.",
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

  const handleSaveCapacity = () => {
    updateCapacityMutation.mutate({
      status: statusActive ? "active" : "paused",
      daily_cap: dailyCap,
      shared_cap: sharedCap,
    });
  };

  const handleSaveServices = () => {
    updateServicesMutation.mutate(selectedServices);
  };

  // Sync local state with buyer data when it loads
  useEffect(() => {
    if (buyer) {
      setStatusActive(buyer.status === "active");
      setDailyCap(buyer.daily_cap);
      setSharedCap(buyer.shared_cap);
      setSelectedServices(buyer.services_csv?.split(",").map(s => s.trim()).filter(Boolean) || []);
      setHasUnsavedCapacity(false);
      setHasUnsavedServices(false);
    }
  }, [buyer]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">{buyer.business_name}</h1>
            <p className="text-lg text-muted-foreground">{buyer.city} • {buyer.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} size="lg">
            Sign out
          </Button>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-card to-card/50 border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Last 7 days</CardDescription>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <CardTitle className="text-4xl font-bold">{stats.count7d}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Leads delivered</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-10 w-20 mb-1" />
                  <Skeleton className="h-4 w-28" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Last 30 days</CardDescription>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <CardTitle className="text-4xl font-bold">{stats.count30d}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Leads delivered</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-10 w-20 mb-1" />
                  <Skeleton className="h-4 w-28" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Last 7 days</CardDescription>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <CardTitle className="text-4xl font-bold text-primary">${stats.spend7d.toFixed(2)}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Total spend</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-10 w-24 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">Last 30 days</CardDescription>
                <Package className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <CardTitle className="text-4xl font-bold text-secondary">${stats.spend30d.toFixed(2)}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Total spend</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-10 w-24 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status & Capacity */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Status & Capacity</CardTitle>
            <CardDescription>Control when and how many leads you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="status-switch" className="text-base font-medium">Active status</Label>
                <p className="text-sm text-muted-foreground">
                  {statusActive ? "You are currently receiving leads" : "Lead delivery is paused"}
                </p>
              </div>
              <Switch
                id="status-switch"
                checked={statusActive}
                onCheckedChange={(checked) => {
                  setStatusActive(checked);
                  setHasUnsavedCapacity(true);
                }}
                disabled={updateCapacityMutation.isPending}
              />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="daily-cap" className="text-base">Daily cap</Label>
                  <p className="text-sm text-muted-foreground">Maximum leads per day (0-200)</p>
                </div>
                <Input
                  id="daily-cap"
                  type="number"
                  min="0"
                  max="200"
                  value={dailyCap}
                  onChange={(e) => {
                    const value = Math.min(200, Math.max(0, parseInt(e.target.value) || 0));
                    setDailyCap(value);
                    setHasUnsavedCapacity(true);
                  }}
                  disabled={updateCapacityMutation.isPending}
                  className="text-lg"
                />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="shared-cap" className="text-base">Shared cap</Label>
                  <p className="text-sm text-muted-foreground">Max shared leads per lead (0-10)</p>
                </div>
                <Input
                  id="shared-cap"
                  type="number"
                  min="0"
                  max="10"
                  value={sharedCap}
                  onChange={(e) => {
                    const value = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                    setSharedCap(value);
                    setHasUnsavedCapacity(true);
                  }}
                  disabled={updateCapacityMutation.isPending}
                  className="text-lg"
                />
              </div>
            </div>

            {hasUnsavedCapacity && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <p className="text-sm text-muted-foreground">You have unsaved changes</p>
                <Button
                  onClick={handleSaveCapacity}
                  disabled={updateCapacityMutation.isPending}
                  size="lg"
                >
                  {updateCapacityMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Preferences */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Service Preferences</CardTitle>
            <CardDescription>
              Select which services you want to receive leads for. You can choose from preset options or add custom services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ServiceMultiSelect
              value={selectedServices}
              onChange={(services) => {
                setSelectedServices(services);
                setHasUnsavedServices(true);
              }}
              disabled={updateServicesMutation.isPending}
            />

            {hasUnsavedServices && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <p className="text-sm text-muted-foreground">You have unsaved changes</p>
                <Button
                  onClick={handleSaveServices}
                  disabled={updateServicesMutation.isPending}
                  size="lg"
                >
                  {updateServicesMutation.isPending ? "Saving..." : "Save services"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing (read-only) */}
        <Card className="border-2 bg-gradient-to-br from-card to-accent/5">
          <CardHeader>
            <CardTitle className="text-2xl">Pricing</CardTitle>
            <CardDescription>Your current pricing structure (managed by admin)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-4 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pricing mode</p>
                <p className="text-2xl font-bold capitalize">{buyer.pricing_mode}</p>
              </div>
              <div className="rounded-lg border bg-card p-4 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Shared lead</p>
                <p className="text-2xl font-bold">${Number(buyer.price_shared).toFixed(2)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Exclusive lead</p>
                <p className="text-2xl font-bold">${Number(buyer.price_exclusive).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Deliveries</CardTitle>
            <CardDescription>Your last 20 lead deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Lead Name</TableHead>
                    <TableHead className="font-semibold">Charge</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeliveries === undefined ? (
                    // Loading state
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentDeliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="h-8 w-8" />
                          <p>No deliveries yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentDeliveries.map((delivery: any) => (
                      <TableRow key={delivery.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {new Date(delivery.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{delivery.leads?.name || "N/A"}</TableCell>
                        <TableCell className="font-semibold">
                          ${Number(delivery.charge_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {delivery.refunded ? (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                              Refunded
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              Paid
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
