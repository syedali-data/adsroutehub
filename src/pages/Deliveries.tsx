import { useState } from "react";
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
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Phone, Trophy, ThumbsDown, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClaimDialog } from "@/components/deliveries/ClaimDialog";
import { getSettingsMap } from "@/lib/settings";

const Deliveries = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [claimDialog, setClaimDialog] = useState<{
    open: boolean;
    type: "won" | "lost";
    deliveryId: string | null;
  }>({ open: false, type: "won", deliveryId: null });

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          *,
          leads(id, name, email),
          buyers(id, business_name),
          campaigns(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Helper to update claim locally
  async function updateClaimLocally(
    id: string,
    updates: {
      claim_status?: 'new' | 'contacted' | 'won' | 'lost';
      claimed?: boolean;
      won?: boolean | null;
      contacted_at?: string | null;
      closed_at?: string | null;
      outcome_reason?: string | null;
      outcome_notes?: string | null;
      refunded?: boolean;
    }
  ) {
    const { error } = await supabase.from("deliveries").update(updates).eq("id", id);
    if (error) throw error;
  }

  // Helper to send claim to n8n
  async function sendClaimToN8n(
    id: string,
    updates: {
      claim_status?: 'new' | 'contacted' | 'won' | 'lost';
      claimed?: boolean;
      won?: boolean | null;
      contacted_at?: string | null;
      closed_at?: string | null;
      outcome_reason?: string | null;
      outcome_notes?: string | null;
      refunded?: boolean;
    },
    webhookUrl: string
  ) {
    const { data, error } = await supabase
      .from("deliveries")
      .select("*, leads(id, name, email), buyers(id, business_name)")
      .eq("id", id)
      .single();

    if (error || !data) throw error || new Error("Delivery not found");

    const payload = {
      delivery_id: data.id,
      buyer_id: data.buyers?.id,
      lead_id: data.leads?.id,
      charge_amount: data.charge_amount,
      claim_status: updates.claim_status ?? data.claim_status,
      claimed: updates.claimed ?? data.claimed,
      won: updates.won ?? data.won,
      contacted_at: updates.contacted_at ?? data.contacted_at,
      closed_at: updates.closed_at ?? data.closed_at,
      outcome_reason: updates.outcome_reason ?? data.outcome_reason,
      outcome_notes: updates.outcome_notes ?? data.outcome_notes,
      refunded: updates.refunded ?? data.refunded,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n claim webhook failed: ${response.statusText}`);
    }
  }

  const updateClaim = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        claim_status?: 'new' | 'contacted' | 'won' | 'lost';
        claimed?: boolean;
        won?: boolean | null;
        contacted_at?: string | null;
        closed_at?: string | null;
        outcome_reason?: string | null;
        outcome_notes?: string | null;
        refunded?: boolean;
      };
    }) => {
      const settingsMap = await getSettingsMap(supabase);
      const useN8nClaims = settingsMap["USE_N8N_CLAIMS"] === "true";
      const webhookUrl = settingsMap["N8N_CLAIM_WEBHOOK_URL"];

      if (useN8nClaims && webhookUrl) {
        await sendClaimToN8n(id, updates, webhookUrl);
      } else {
        await updateClaimLocally(id, updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast({ title: "Updated", description: "Delivery updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery.",
        variant: "destructive",
      });
    },
  });

  const handleMarkContacted = (deliveryId: string) => {
    updateClaim.mutate({
      id: deliveryId,
      updates: {
        claim_status: 'contacted',
        claimed: true,
        contacted_at: new Date().toISOString(),
      },
    });
  };

  const handleClaimDialogSubmit = (reason: string, notes: string) => {
    if (!claimDialog.deliveryId) return;

    updateClaim.mutate({
      id: claimDialog.deliveryId,
      updates: {
        claim_status: claimDialog.type,
        claimed: true,
        won: claimDialog.type === "won",
        closed_at: new Date().toISOString(),
        outcome_reason: reason || null,
        outcome_notes: notes || null,
      },
    });

    setClaimDialog({ open: false, type: "won", deliveryId: null });
  };

  const getClaimStatusBadge = (delivery: any) => {
    switch (delivery.claim_status) {
      case 'won':
        return <Badge className="bg-green-600">Won</Badge>;
      case 'lost':
        return <Badge variant="destructive">Lost</Badge>;
      case 'contacted':
        return <Badge variant="secondary">Contacted</Badge>;
      case 'new':
      default:
        return <Badge variant="outline">New</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deliveries</h1>
        <p className="text-muted-foreground">Track lead deliveries to buyers</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Claim Status</TableHead>
              <TableHead>Refund Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : deliveries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No deliveries found
                </TableCell>
              </TableRow>
            ) : (
              deliveries?.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>{format(new Date(delivery.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell>{delivery.leads?.name || "N/A"}</TableCell>
                  <TableCell>{delivery.buyers?.business_name || "N/A"}</TableCell>
                  <TableCell>{delivery.campaigns?.name || "N/A"}</TableCell>
                  <TableCell className="uppercase">{delivery.channel}</TableCell>
                  <TableCell>${delivery.charge_amount}</TableCell>
                  <TableCell>{getClaimStatusBadge(delivery)}</TableCell>
                  <TableCell>
                    {delivery.refunded ? (
                      <Badge variant="destructive">Refunded</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {delivery.claim_status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkContacted(delivery.id)}
                          title="Mark Contacted"
                          disabled={updateClaim.isPending}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                      {delivery.claim_status === 'contacted' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              setClaimDialog({
                                open: true,
                                type: "won",
                                deliveryId: delivery.id,
                              })
                            }
                            title="Mark Won"
                            disabled={updateClaim.isPending}
                          >
                            <Trophy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setClaimDialog({
                                open: true,
                                type: "lost",
                                deliveryId: delivery.id,
                              })
                            }
                            title="Mark Lost"
                            disabled={updateClaim.isPending}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {!delivery.refunded && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/refunds?delivery_id=${delivery.id}`)}
                          title="Create Refund Request"
                          disabled={updateClaim.isPending}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClaimDialog
        open={claimDialog.open}
        onOpenChange={(open) =>
          setClaimDialog((prev) => ({ ...prev, open }))
        }
        onSubmit={handleClaimDialogSubmit}
        type={claimDialog.type}
        isPending={updateClaim.isPending}
      />
    </div>
  );
};

export default Deliveries;