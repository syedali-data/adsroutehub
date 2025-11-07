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
import { format } from "date-fns";

const Deliveries = () => {
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, leads(name, email), buyers(business_name), campaigns(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : deliveries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                  <TableCell>
                    <div className="flex gap-1">
                      {delivery.claimed && <Badge variant="outline">Claimed</Badge>}
                      {delivery.won && <Badge className="bg-accent">Won</Badge>}
                      {delivery.refunded && <Badge className="bg-destructive">Refunded</Badge>}
                      {!delivery.claimed && !delivery.won && !delivery.refunded && (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
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

export default Deliveries;