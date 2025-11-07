import { useQuery } from "@tanstack/react-query";
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

const Buyers = () => {
  const navigate = useNavigate();

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : buyers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No buyers found
                </TableCell>
              </TableRow>
            ) : (
              buyers?.map((buyer) => (
                <TableRow
                  key={buyer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/buyers/${buyer.id}`)}
                >
                  <TableCell className="font-medium">{buyer.business_name}</TableCell>
                  <TableCell className="capitalize">{buyer.city}</TableCell>
                  <TableCell>{buyer.email}</TableCell>
                  <TableCell>{buyer.daily_cap}</TableCell>
                  <TableCell>{buyer.daily_sent}</TableCell>
                  <TableCell>{buyer.free_leads_left}</TableCell>
                  <TableCell>{(buyer.response_rate * 100).toFixed(0)}%</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(buyer.status)}>{buyer.status}</Badge>
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