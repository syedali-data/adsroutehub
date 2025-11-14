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
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { EditBuyerDialog } from "@/components/buyers/EditBuyerDialog";

const Buyers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBuyer, setEditingBuyer] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: buyers, isLoading, error: queryError } = useQuery({
    queryKey: ["buyers"],
    queryFn: async () => {
      console.log("[Buyers] Fetching buyers list...");
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      );
      
      // Create query promise
      const queryPromise = supabase
        .from("buyers")
        .select("*")
        .order("created_at", { ascending: false });
      
      try {
        // Race between timeout and query
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        if (error) {
          console.error("[Buyers] Error fetching buyers:", error);
          // Check for auth errors
          if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('session')) {
            throw new Error('Session expired. Please reload the page and sign in again.');
          }
          throw error;
        }
        console.log("[Buyers] Successfully fetched buyers:", data?.length);
        return data;
      } catch (err) {
        console.error("[Buyers] Query failed:", err);
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });

  // Show error toast when query fails
  if (queryError) {
    toast({
      title: "Error loading buyers",
      description: queryError instanceof Error ? queryError.message : "Failed to fetch buyers list. Please reload the page.",
      variant: "destructive",
      action: {
        label: "Retry",
        onClick: () => queryClient.invalidateQueries({ queryKey: ["buyers"] })
      }
    });
  }

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" | "test" }) => {
      try {
        const { error } = await supabase
          .from("buyers")
          .update({ status })
          .eq("id", id);
        if (error) {
          if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('session')) {
            throw new Error('Session expired. Please reload the page and sign in again.');
          }
          throw error;
        }
      } catch (err) {
        console.error("[Buyers] Update status failed:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({ title: "Updated", description: "Buyer status updated." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please reload the page.",
        variant: "destructive",
      });
    },
  });

  const deleteBuyer = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from("buyers").delete().eq("id", id);
        if (error) {
          if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('session')) {
            throw new Error('Session expired. Please reload the page and sign in again.');
          }
          throw error;
        }
      } catch (err) {
        console.error("[Buyers] Delete failed:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({ title: "Deleted", description: "Buyer deleted." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Cannot delete buyer with linked deliveries. Please reload the page if session expired.",
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
              <TableHead>Services</TableHead>
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
                <TableCell colSpan={10} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : queryError ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-destructive">
                  Error loading buyers. Please check console or contact support.
                </TableCell>
              </TableRow>
            ) : buyers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
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
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {buyer.services_csv?.split(',').map((service: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {service.trim()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
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
                          setEditingBuyer(buyer);
                          setEditDialogOpen(true);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
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

      <EditBuyerDialog 
        buyer={editingBuyer}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
};

export default Buyers;