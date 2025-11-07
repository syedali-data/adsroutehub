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
import { useNavigate } from "react-router-dom";
import { AddBuyerDialog } from "@/components/buyers/AddBuyerDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";

const Buyers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: buyers, isLoading } = useQuery({
    queryKey: ["buyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" | "test" }) => {
      const { error } = await supabase
        .from("buyers")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({ title: "Updated", description: "Buyer status updated." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    },
  });

  const deleteBuyer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("buyers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({ title: "Deleted", description: "Buyer deleted." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Cannot delete buyer with linked deliveries. Please archive instead.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-accent",
      paused: "bg-warning",
      test: "bg-muted",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Buyers</h1>
          <p className="text-muted-foreground">Manage your lead buyers</p>
        </div>
        <AddBuyerDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Daily Cap</TableHead>
              <TableHead>Daily Sent</TableHead>
              <TableHead>Free Leads</TableHead>
              <TableHead>Response Rate</TableHead>
              <TableHead>Status</TableHead>
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
            ) : buyers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No buyers found
                </TableCell>
              </TableRow>
            ) : (
              buyers?.map((buyer) => (
                <TableRow key={buyer.id}>
                  <TableCell
                    className="font-medium cursor-pointer hover:underline"
                    onClick={() => navigate(`/buyers/${buyer.id}`)}
                  >
                    {buyer.business_name}
                  </TableCell>
                  <TableCell className="capitalize">{buyer.city}</TableCell>
                  <TableCell>{buyer.email}</TableCell>
                  <TableCell>{buyer.daily_cap}</TableCell>
                  <TableCell>{buyer.daily_sent}</TableCell>
                  <TableCell>{buyer.free_leads_left}</TableCell>
                  <TableCell>{(buyer.response_rate * 100).toFixed(0)}%</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(buyer.status)}>{buyer.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          updateStatus.mutate({ id: buyer.id, status: "active" });
                        }}>
                          Set Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          updateStatus.mutate({ id: buyer.id, status: "paused" });
                        }}>
                          Set Paused
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          updateStatus.mutate({ id: buyer.id, status: "test" });
                        }}>
                          Set Test
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this buyer?")) {
                              deleteBuyer.mutate(buyer.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default Buyers;