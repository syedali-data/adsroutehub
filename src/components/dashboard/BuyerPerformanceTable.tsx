import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
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
    <Card className="shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold">Buyer Performance</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Top buyers by revenue</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 bg-muted/20 rounded-lg">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Loading buyer data...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-muted/20 rounded-lg">
            <div className="text-center space-y-2">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground font-medium">No buyer data for this period</p>
              <p className="text-sm text-muted-foreground/70">Buyer performance will appear here once deliveries are made</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Buyer</TableHead>
                  <TableHead className="font-semibold">City</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("deliveries")} className="h-8 px-2 font-semibold">
                      Deliveries <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("grossRevenue")} className="h-8 px-2 font-semibold">
                      Gross <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold">Refunded</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("netRevenue")} className="h-8 px-2 font-semibold">
                      Net <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("refundRate")} className="h-8 px-2 font-semibold">
                      Refund % <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((buyer, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">{buyer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{buyer.city}</TableCell>
                    <TableCell className="tabular-nums">{buyer.deliveries}</TableCell>
                    <TableCell className="tabular-nums">${buyer.grossRevenue.toFixed(2)}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">${buyer.refundedAmount.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">${buyer.netRevenue.toFixed(2)}</TableCell>
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
