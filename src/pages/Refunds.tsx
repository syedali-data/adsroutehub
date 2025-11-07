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
import { useState } from "react";

const Refunds = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [reasonCategory, setReasonCategory] = useState<string>("");
  const [requestedBy, setRequestedBy] = useState<string>("buyer");
  const [requestedByDetails, setRequestedByDetails] = useState("");
  const [refundScope, setRefundScope] = useState<string>("full");
  const [refundAmount, setRefundAmount] = useState<string>("");

  const { data: refundRequests, isLoading } = useQuery({
    queryKey: ["refund-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*, deliveries(id, charge_amount, leads(id, name, email), buyers(id, business_name))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: deliveries } = useQuery({
    queryKey: ["deliveries-for-refund"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("id, charge_amount, lead_id, buyer_id, leads(name, email), buyers(business_name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const updateRefundLocally = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("refund_requests")
      .update({ status, handled_ts: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    if (status === "approved") {
      const request = refundRequests?.find((r) => r.id === id);
      if (request?.delivery_id) {
        await supabase
          .from("deliveries")
          .update({ refunded: true, refund_ts: new Date().toISOString() })
          .eq("id", request.delivery_id);
      }
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      toast({ title: "Success", description: "Refund request updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund",
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
      // Find the delivery to get buyer_id and lead_id
      const delivery = deliveries?.find((d) => d.id === deliveryId);
      if (!delivery) throw new Error("Delivery not found");

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

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      toast({ title: "Success", description: "Refund request created" });
      setIsCreateModalOpen(false);
      setSelectedDeliveryId("");
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
        description: error.message || "Failed to create refund request",
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
        <Button onClick={() => setIsCreateModalOpen(true)}>
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
              refundRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{format(new Date(request.created_at), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{request.deliveries?.leads?.name || "N/A"}</TableCell>
                  <TableCell>{request.deliveries?.buyers?.business_name || "N/A"}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create refund request</DialogTitle>
            <DialogDescription>
              Manually create a new refund request for a delivery.
            </DialogDescription>
          </DialogHeader>
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
                  <SelectItem value="job_cancelled">Job cancelled</SelectItem>
                  <SelectItem value="lead_not_interested">Lead not interested</SelectItem>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRefund}
              disabled={createRefundMutation.isPending}
            >
              {createRefundMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Refunds;