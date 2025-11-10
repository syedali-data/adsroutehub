import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Plus } from "lucide-react";
import { getSettingsMap } from "@/lib/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const Refunds = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");
  const [isDeliveryReadOnly, setIsDeliveryReadOnly] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonCategory, setReasonCategory] = useState<string>("");
  const [requestedBy, setRequestedBy] = useState<string>("buyer");
  const [requestedByDetails, setRequestedByDetails] = useState("");
  const [refundScope, setRefundScope] = useState<string>("full");
  const [refundAmount, setRefundAmount] = useState<string>("");

  // Fetch settings for refund window
  const { data: settings } = useQuery({
    queryKey: ["settings-refund"],
    queryFn: async () => {
      return await getSettingsMap(supabase);
    },
  });

  const refundWindowDays = parseInt(settings?.["REFUND_WINDOW_DAYS"] || "14", 10);

  const { data: refundRequests, isLoading, error: refundsError } = useQuery({
    queryKey: ["refund-requests"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("refund_requests")
          .select("*, deliveries(id, charge_amount, leads(id, name, email), buyers(id, business_name))")
          .order("created_at", { ascending: false });

        if (error) {
          if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('session')) {
            throw new Error('Session expired. Please reload the page and sign in again.');
          }
          throw error;
        }
        return data;
      } catch (err) {
        console.error("[Refunds] Query failed:", err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Show error toast when query fails
  if (refundsError) {
    toast({
      title: "Error loading refund requests",
      description: refundsError instanceof Error ? refundsError.message : "Failed to fetch refund requests. Please reload the page.",
      variant: "destructive",
    });
  }

  // Fetch buyer stats for display
  const { data: buyerStats } = useQuery({
    queryKey: ["buyer-refund-stats"],
    queryFn: async () => {
      // Get all unique buyer IDs from refund requests
      const buyerIds = [...new Set(refundRequests?.map(r => r.buyer_id).filter(Boolean))];
      
      if (buyerIds.length === 0) return {};

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Query deliveries and refunds for stats
      const statsMap: Record<string, { 
        total30d: number; 
        refunded30d: number; 
        totalAll: number; 
        refundedAll: number; 
      }> = {};

      for (const buyerId of buyerIds) {
        // 30-day stats
        const { data: deliveries30d } = await supabase
          .from("deliveries")
          .select("id, refunded")
          .eq("buyer_id", buyerId)
          .gte("created_at", thirtyDaysAgo.toISOString());

        // Lifetime stats
        const { data: deliveriesAll } = await supabase
          .from("deliveries")
          .select("id, refunded")
          .eq("buyer_id", buyerId);

        statsMap[buyerId] = {
          total30d: deliveries30d?.length || 0,
          refunded30d: deliveries30d?.filter(d => d.refunded).length || 0,
          totalAll: deliveriesAll?.length || 0,
          refundedAll: deliveriesAll?.filter(d => d.refunded).length || 0,
        };
      }

      return statsMap;
    },
    enabled: !!refundRequests && refundRequests.length > 0,
  });

  const { data: deliveries } = useQuery({
    queryKey: ["deliveries-for-refund", refundWindowDays],
    queryFn: async () => {
      // Calculate the cutoff date based on refund window
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - refundWindowDays);

      const { data, error } = await supabase
        .from("deliveries")
        .select("id, charge_amount, lead_id, buyer_id, created_at, refunded, leads(name, email), buyers(business_name)")
        .eq("refunded", false) // Anti-abuse rule #2: exclude already refunded
        .gte("created_at", cutoffDate.toISOString()) // Anti-abuse rule #3: within refund window
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Anti-abuse rule #1: Filter out deliveries with active refund requests
      const { data: activeRefunds } = await supabase
        .from("refund_requests")
        .select("delivery_id")
        .in("status", ["pending", "approved"]);

      const activeDeliveryIds = new Set(activeRefunds?.map(r => r.delivery_id) || []);
      
      return data?.filter(d => !activeDeliveryIds.has(d.id));
    },
  });

  // Handle opening dialog from URL parameter
  useEffect(() => {
    const deliveryIdFromUrl = searchParams.get("delivery_id");
    if (deliveryIdFromUrl && deliveries) {
      const delivery = deliveries.find(d => d.id === deliveryIdFromUrl);
      if (delivery) {
        setSelectedDeliveryId(deliveryIdFromUrl);
        setIsDeliveryReadOnly(true);
        setRefundAmount(delivery.charge_amount?.toString() || "0");
        setIsCreateModalOpen(true);
        // Clear the URL parameter
        setSearchParams({});
      }
    }
  }, [searchParams, deliveries, setSearchParams]);

  const updateRefundLocally = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("refund_requests")
        .update({ status, handled_ts: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('session')) {
          throw new Error('Session expired. Please reload the page and sign in again.');
        }
        throw error;
      }

      if (status === "approved") {
        const request = refundRequests?.find((r) => r.id === id);
        if (request?.delivery_id) {
          const { error: deliveryError } = await supabase
            .from("deliveries")
            .update({ refunded: true, refund_ts: new Date().toISOString() })
            .eq("id", request.delivery_id);
          
          if (deliveryError) throw deliveryError;
        }
      }
    } catch (err) {
      console.error("[Refunds] Update refund locally failed:", err);
      throw err;
    }
  };

  const sendRefundToN8n = async (id: string, status: "approved" | "rejected", webhookUrl: string) => {
    const request = refundRequests?.find((r) => r.id === id);
    if (!request) throw new Error("Refund request not found");

    const delivery = request.deliveries;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refund_request_id: request.id,
        delivery_id: request.delivery_id ?? delivery?.id,
        buyer_id: delivery?.buyers?.id,
        lead_id: delivery?.leads?.id,
        new_status: status,
        previous_status: request.status,
        reason: request.reason,
        reason_category: request.reason_category,
        requested_by: request.requested_by,
        requested_by_details: request.requested_by_details,
        refund_scope: request.refund_scope,
        refund_amount: request.refund_amount,
        charge_amount: delivery?.charge_amount ?? null,
        created_ts: request.created_at,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook call failed: ${response.statusText}`);
    }
  };

  const handleRefundMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      try {
        // Fetch settings to determine routing
        const settingsMap = await getSettingsMap(supabase);
        const useN8n = settingsMap["USE_N8N_REFUNDS"] === "true";
        const webhookUrl = settingsMap["N8N_REFUND_WEBHOOK_URL"];

        if (useN8n && webhookUrl) {
          // Use n8n webhook
          await sendRefundToN8n(id, status, webhookUrl);
        } else {
          // Use direct Supabase updates
          await updateRefundLocally(id, status);
        }
      } catch (err) {
        console.error("[Refunds] Handle refund mutation failed:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries-for-refund"] });
      toast({ title: "Success", description: "Refund request updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund. Please reload the page.",
        variant: "destructive",
      });
    },
  });

  const createRefundMutation = useMutation({
    mutationFn: async ({ 
      deliveryId, 
      reason,
      reasonCategory,
      requestedBy,
      requestedByDetails,
      refundScope,
      refundAmount,
    }: { 
      deliveryId: string; 
      reason: string;
      reasonCategory: string;
      requestedBy: string;
      requestedByDetails: string;
      refundScope: string;
      refundAmount: number;
    }) => {
      try {
        // Find the delivery to get buyer_id and lead_id
        const delivery = deliveries?.find((d) => d.id === deliveryId);
        if (!delivery) throw new Error("Delivery not found");

        // Anti-abuse rule #2: Check if already refunded
        if (delivery.refunded) {
          throw new Error("This delivery has already been refunded.");
        }

        // Anti-abuse rule #3: Check refund window
        const deliveryAge = (Date.now() - new Date(delivery.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (deliveryAge > refundWindowDays) {
          throw new Error(`Refund window has expired for this delivery (more than ${refundWindowDays} days old).`);
        }

        // Anti-abuse rule #1: Check for existing active refund request
        const { data: existingRefund } = await supabase
          .from("refund_requests")
          .select("id")
          .eq("delivery_id", deliveryId)
          .in("status", ["pending", "approved"])
          .maybeSingle();

        if (existingRefund) {
          throw new Error("A refund request already exists for this delivery (pending or approved).");
        }

        const { error } = await supabase.from("refund_requests").insert({
          delivery_id: deliveryId,
          buyer_id: delivery.buyer_id,
          reason: reason,
          reason_category: reasonCategory,
          requested_by: requestedBy,
          requested_by_details: requestedByDetails || null,
          refund_scope: refundScope,
          refund_amount: refundAmount,
          status: "pending",
          auto_decision: false,
        });

        if (error) {
          if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('session')) {
            throw new Error('Session expired. Please reload the page and sign in again.');
          }
          throw error;
        }
      } catch (err) {
        console.error("[Refunds] Create refund mutation failed:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries-for-refund"] });
      toast({ title: "Success", description: "Refund request created" });
      setIsCreateModalOpen(false);
      setSelectedDeliveryId("");
      setIsDeliveryReadOnly(false);
      setReason("");
      setReasonCategory("");
      setRequestedBy("buyer");
      setRequestedByDetails("");
      setRefundScope("full");
      setRefundAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create refund request. Please reload the page.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRefund = () => {
    if (!selectedDeliveryId) {
      toast({
        title: "Validation Error",
        description: "Please select a delivery",
        variant: "destructive",
      });
      return;
    }
    if (!reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason",
        variant: "destructive",
      });
      return;
    }
    if (!reasonCategory) {
      toast({
        title: "Validation Error",
        description: "Please select a reason category",
        variant: "destructive",
      });
      return;
    }
    if (!requestedBy) {
      toast({
        title: "Validation Error",
        description: "Please select who requested the refund",
        variant: "destructive",
      });
      return;
    }
    
    const delivery = deliveries?.find((d) => d.id === selectedDeliveryId);
    const finalRefundAmount = refundScope === "full" 
      ? (delivery?.charge_amount || 0) 
      : parseFloat(refundAmount);

    if (refundScope === "partial" && (!refundAmount || finalRefundAmount <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid refund amount for partial refunds",
        variant: "destructive",
      });
      return;
    }

    createRefundMutation.mutate({ 
      deliveryId: selectedDeliveryId, 
      reason,
      reasonCategory,
      requestedBy,
      requestedByDetails,
      refundScope,
      refundAmount: finalRefundAmount,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning",
      approved: "bg-accent",
      rejected: "bg-destructive",
      auto_approved: "bg-accent",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Refunds</h1>
          <p className="text-muted-foreground">Manage refund requests</p>
        </div>
        <Button onClick={() => {
          setIsDeliveryReadOnly(false);
          setIsCreateModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New refund request
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : refundRequests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No refund requests found
                </TableCell>
              </TableRow>
            ) : (
              refundRequests?.map((request) => {
                const stats = buyerStats?.[request.buyer_id || ""];
                const stats30dText = stats 
                  ? `${stats.refunded30d}/${stats.total30d} (${stats.total30d > 0 ? Math.round((stats.refunded30d / stats.total30d) * 100) : 0}%)`
                  : "—";
                const statsAllText = stats 
                  ? `${stats.refundedAll}/${stats.totalAll} (${stats.totalAll > 0 ? Math.round((stats.refundedAll / stats.totalAll) * 100) : 0}%)`
                  : "—";

                return (
                  <TableRow key={request.id}>
                    <TableCell>{format(new Date(request.created_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{request.deliveries?.leads?.name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{request.deliveries?.buyers?.business_name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">
                          30d: {stats30dText} • Lifetime: {statsAllText}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefundMutation.mutate({ id: request.id, status: "approved" })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefundMutation.mutate({ id: request.id, status: "rejected" })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create refund request</DialogTitle>
            <DialogDescription>
              Manually create a new refund request for a delivery.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery">Delivery *</Label>
                <Select 
                  value={selectedDeliveryId} 
                  onValueChange={(value) => {
                    setSelectedDeliveryId(value);
                    const delivery = deliveries?.find((d) => d.id === value);
                    if (delivery && refundScope === "full") {
                      setRefundAmount(delivery.charge_amount?.toString() || "0");
                    }
                  }}
                  disabled={isDeliveryReadOnly}
                >
                  <SelectTrigger id="delivery">
                    <SelectValue placeholder="Select a delivery" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveries?.map((delivery) => (
                      <SelectItem key={delivery.id} value={delivery.id}>
                        {delivery.id.slice(0, 8)} • {delivery.leads?.name || "Unknown"} • {delivery.buyers?.business_name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason-category">Reason category *</Label>
                <Select value={reasonCategory} onValueChange={setReasonCategory}>
                  <SelectTrigger id="reason-category">
                    <SelectValue placeholder="Select a reason category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bad_contact">Bad contact</SelectItem>
                    <SelectItem value="duplicate_lead">Duplicate lead</SelectItem>
                    <SelectItem value="outside_service_area">Outside service area</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for the refund request"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requested-by">Requested by *</Label>
                <Select value={requestedBy} onValueChange={setRequestedBy}>
                  <SelectTrigger id="requested-by">
                    <SelectValue placeholder="Select who requested the refund" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requested-by-details">Requested by details</Label>
                <Input
                  id="requested-by-details"
                  type="text"
                  value={requestedByDetails}
                  onChange={(e) => setRequestedByDetails(e.target.value)}
                  placeholder="Name or email (optional)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refund-scope">Refund type *</Label>
                <Select 
                  value={refundScope} 
                  onValueChange={(value) => {
                    setRefundScope(value);
                    if (value === "full") {
                      const delivery = deliveries?.find((d) => d.id === selectedDeliveryId);
                      if (delivery) {
                        setRefundAmount(delivery.charge_amount?.toString() || "0");
                      }
                    }
                  }}
                >
                  <SelectTrigger id="refund-scope">
                    <SelectValue placeholder="Select refund type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full delivery amount</SelectItem>
                    <SelectItem value="partial">Partial amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Refund amount *</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  disabled={refundScope === "full"}
                  placeholder="Enter refund amount"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRefund}
                disabled={createRefundMutation.isPending}
              >
                {createRefundMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Refunds;