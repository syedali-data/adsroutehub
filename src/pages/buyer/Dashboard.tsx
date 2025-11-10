import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Package, Calendar, AlertCircle, Lock, Unlock } from "lucide-react";
import { useUnlockDelivery } from "@/hooks/useUnlockDelivery";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const unlockMutation = useUnlockDelivery();

  // Local state for form editing
  const [statusActive, setStatusActive] = useState(true);
  const [dailyCap, setDailyCap] = useState(10);
  const [hasUnsavedCapacity, setHasUnsavedCapacity] = useState(false);
  const [selectedDeliveryToUnlock, setSelectedDeliveryToUnlock] = useState<string | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const { data: buyer, isLoading, error } = useQuery({
    queryKey: ["current-buyer"],
    queryFn: async () => {
      try {
        return await getCurrentBuyer();
      } catch (err) {
        console.error("[BuyerDashboard] getCurrentBuyer failed:", err);
        if (err instanceof Error && (err.message?.includes('JWT') || err.message?.includes('token') || err.message?.includes('session'))) {
          throw new Error('Session expired. Please reload the page and sign in again.');
        }
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
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
          unlocked,
          lead_id,
          leads (name, phone, email, budget_raw, notes)
        `)
        .eq("buyer_id", buyer.id)
        .order("created_at", { ascending: false })
        .limit(20);

      return data || [];
    },
    enabled: !!buyer,
  });

  const updateCapacityMutation = useMutation({
    mutationFn: async (updates: { status?: "active" | "paused"; daily_cap?: number }) => {
      if (!buyer) throw new Error("No buyer found");
      
      try {
        const { error } = await supabase
          .from("buyers")
          .update(updates)
          .eq("id", buyer.id);

        if (error) {
          if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('session')) {
            throw new Error('Session expired. Please reload the page and sign in again.');
          }
          throw error;
        }
      } catch (err) {
        console.error("[BuyerDashboard] Update capacity failed:", err);
        throw err;
      }
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
        description: error.message || "Failed to update settings. Please reload the page.",
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
    });
  };

  // Sync local state with buyer data when it loads
  useEffect(() => {
    if (buyer) {
      setStatusActive(buyer.status === "active");
      setDailyCap(buyer.daily_cap);
      setHasUnsavedCapacity(false);
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

  const services = buyer.services_csv?.split(",").map(s => s.trim()).filter(Boolean) || [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {buyer.business_name}
            </h1>
            <p className="text-lg text-muted-foreground font-medium">{buyer.city} • {buyer.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} size="lg" className="border-2">
            Sign out
          </Button>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-card via-card to-muted/30 border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">Last 7 days</CardDescription>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <CardTitle className="text-5xl font-bold tracking-tight">{stats.count7d}</CardTitle>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Leads delivered</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-12 w-20 mb-2" />
                  <Skeleton className="h-4 w-28" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card via-card to-muted/30 border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">Last 30 days</CardDescription>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <CardTitle className="text-5xl font-bold tracking-tight">{stats.count30d}</CardTitle>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Leads delivered</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-12 w-20 mb-2" />
                  <Skeleton className="h-4 w-28" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/30 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary/80">Last 7 days</CardDescription>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <CardTitle className="text-5xl font-bold tracking-tight text-primary">${stats.spend7d.toFixed(2)}</CardTitle>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Total spend</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-12 w-24 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-background border-2 border-secondary/30 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-secondary/80">Last 30 days</CardDescription>
                <Package className="h-5 w-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <CardTitle className="text-5xl font-bold tracking-tight text-secondary">${stats.spend30d.toFixed(2)}</CardTitle>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Total spend</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-12 w-24 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status & Capacity */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Status & Capacity</CardTitle>
            <CardDescription className="text-base">Control when and how many leads you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border-2 bg-gradient-to-r from-muted/50 to-muted/30 p-5 shadow-sm">
              <div className="space-y-1">
                <Label htmlFor="status-switch" className="text-lg font-semibold">Active status</Label>
                <p className="text-sm text-muted-foreground font-medium">
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
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="daily-cap" className="text-lg font-semibold">Daily cap</Label>
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
                className="text-xl font-semibold h-14 border-2"
              />
            </div>

            <div className="rounded-xl border-2 bg-muted/30 p-5">
              <div className="space-y-1.5">
                <Label className="text-base font-semibold text-muted-foreground">Lead type preference</Label>
                <p className="text-2xl font-bold capitalize">{buyer.pricing_mode}</p>
                <p className="text-sm text-muted-foreground">
                  {buyer.pricing_mode === 'both' && `Accepts both shared and exclusive leads (max ${buyer.shared_cap} buyers per shared lead)`}
                  {buyer.pricing_mode === 'shared' && `Accepts shared leads only (max ${buyer.shared_cap} buyers per lead)`}
                  {buyer.pricing_mode === 'exclusive' && 'Accepts exclusive leads only'}
                </p>
              </div>
            </div>

            {hasUnsavedCapacity && (
              <div className="flex items-center justify-end gap-3 pt-2 border-t-2 mt-6 pt-6">
                <p className="text-sm text-muted-foreground font-medium">You have unsaved changes</p>
                <Button
                  onClick={handleSaveCapacity}
                  disabled={updateCapacityMutation.isPending}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold"
                >
                  {updateCapacityMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Preferences */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Service Preferences</CardTitle>
            <CardDescription className="text-base">
              Your configured service types for receiving leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border-2 bg-muted/30 p-5">
              {services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <Badge 
                      key={service} 
                      variant="secondary" 
                      className="px-4 py-2 text-sm font-semibold border-2"
                    >
                      {service}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No services configured</p>
              )}
            </div>
            
            <div className="flex items-start gap-3 rounded-xl border-2 bg-accent/20 p-4">
              <AlertCircle className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-accent-foreground">
                Want to change your services? Contact support.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing (read-only) */}
        <Card className="border-2 shadow-lg bg-gradient-to-br from-card via-card to-accent/10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Pricing</CardTitle>
            <CardDescription className="text-base">Your current pricing structure (managed by admin)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border-2 bg-gradient-to-br from-card to-muted/30 p-6 space-y-2 shadow-sm">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pricing mode</p>
                <p className="text-3xl font-bold capitalize">{buyer.pricing_mode}</p>
              </div>
              <div className="rounded-xl border-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 p-6 space-y-2 shadow-sm">
                <p className="text-sm font-semibold text-primary/80 uppercase tracking-wide">Shared lead</p>
                <p className="text-3xl font-bold text-primary">${Number(buyer.price_shared).toFixed(2)}</p>
              </div>
              <div className="rounded-xl border-2 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30 p-6 space-y-2 shadow-sm">
                <p className="text-sm font-semibold text-secondary/80 uppercase tracking-wide">Exclusive lead</p>
                <p className="text-3xl font-bold text-secondary">${Number(buyer.price_exclusive).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Recent Deliveries</CardTitle>
            <CardDescription className="text-base">Your last 20 lead deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border-2 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="font-bold text-base">Date</TableHead>
                    <TableHead className="font-bold text-base">Lead Name</TableHead>
                    <TableHead className="font-bold text-base">Charge</TableHead>
                    <TableHead className="font-bold text-base">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeliveries === undefined ? (
                    // Loading state
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentDeliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <Package className="h-10 w-10" />
                          <p className="text-lg font-medium">No deliveries yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentDeliveries.map((delivery: any) => (
                      <TableRow key={delivery.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-semibold">
                          {new Date(delivery.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{delivery.leads?.name || "N/A"}</TableCell>
                        <TableCell className="font-bold text-lg">
                          ${Number(delivery.charge_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {delivery.refunded ? (
                            <Badge variant="destructive" className="px-3 py-1 text-xs font-bold">
                              Refunded
                            </Badge>
                          ) : delivery.unlocked ? (
                            <Badge className="px-3 py-1 text-xs font-bold bg-green-500">
                              <Unlock className="h-3 w-3 mr-1" />
                              Unlocked
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1"
                              onClick={() => {
                                setSelectedDeliveryToUnlock(delivery.id);
                                setShowUnlockDialog(true);
                              }}
                              disabled={unlockMutation.isPending}
                            >
                              <Lock className="h-3 w-3" />
                              Unlock
                            </Button>
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

      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unlock the full contact details for this lead. The charge will be applied according to your pricing plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedDeliveryToUnlock) {
                  unlockMutation.mutate(selectedDeliveryToUnlock);
                  setShowUnlockDialog(false);
                  setSelectedDeliveryToUnlock(null);
                }
              }}
            >
              Unlock Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
