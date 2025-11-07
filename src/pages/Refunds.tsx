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
import { Check, X } from "lucide-react";

const Refunds = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: refundRequests, isLoading } = useQuery({
    queryKey: ["refund-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*, deliveries(*, leads(name, email), buyers(business_name))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleRefundMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      toast({ title: "Success", description: "Refund request updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
      <div>
        <h1 className="text-3xl font-bold">Refunds</h1>
        <p className="text-muted-foreground">Manage refund requests</p>
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
    </div>
  );
};

export default Refunds;