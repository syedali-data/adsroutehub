import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target } from "lucide-react";

interface Campaign {
  name: string;
  serviceType: string;
  city: string;
  leads: number;
  deliveries: number;
  revenue: number;
}

interface CampaignBreakdownProps {
  data: Campaign[];
  isLoading?: boolean;
}

export const CampaignBreakdown = ({ data, isLoading }: CampaignBreakdownProps) => {
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold">Campaign Performance</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Performance breakdown by campaign</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
          <Target className="h-5 w-5 text-secondary" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 bg-muted/20 rounded-lg">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Loading campaign data...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-muted/20 rounded-lg">
            <div className="text-center space-y-2">
              <Target className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground font-medium">No campaign data for this period</p>
              <p className="text-sm text-muted-foreground/70">Campaigns will appear here once leads are delivered</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Campaign</TableHead>
                  <TableHead className="font-semibold">Service</TableHead>
                  <TableHead className="font-semibold">City</TableHead>
                  <TableHead className="text-right font-semibold">Leads</TableHead>
                  <TableHead className="text-right font-semibold">Deliveries</TableHead>
                  <TableHead className="text-right font-semibold">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((campaign, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="text-muted-foreground">{campaign.serviceType}</TableCell>
                    <TableCell className="text-muted-foreground">{campaign.city}</TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.leads}</TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.deliveries}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      ${campaign.revenue.toLocaleString()}
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
