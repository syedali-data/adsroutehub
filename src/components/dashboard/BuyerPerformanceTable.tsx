import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuyerPerformance {
  name: string;
  city: string;
  deliveries: number;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  refundRate: number;
}

interface BuyerPerformanceTableProps {
  data: BuyerPerformance[];
  isLoading?: boolean;
}

type SortKey = "deliveries" | "grossRevenue" | "netRevenue" | "refundRate";

export const BuyerPerformanceTable = ({ data, isLoading }: BuyerPerformanceTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("netRevenue");
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDesc ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * multiplier;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buyer Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No buyer data available</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("deliveries")} className="h-8 px-2">
                      Deliveries <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("grossRevenue")} className="h-8 px-2">
                      Gross <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Refunded</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("netRevenue")} className="h-8 px-2">
                      Net <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("refundRate")} className="h-8 px-2">
                      Refund % <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((buyer, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{buyer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{buyer.city}</TableCell>
                    <TableCell>{buyer.deliveries}</TableCell>
                    <TableCell>${buyer.grossRevenue.toFixed(2)}</TableCell>
                    <TableCell>${buyer.refundedAmount.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">${buyer.netRevenue.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={buyer.refundRate > 20 ? "destructive" : "secondary"}>
                        {buyer.refundRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
