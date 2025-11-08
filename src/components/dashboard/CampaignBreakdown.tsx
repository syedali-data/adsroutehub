import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No campaign data available</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Deliveries</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((campaign, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="text-muted-foreground">{campaign.serviceType}</TableCell>
                    <TableCell className="text-muted-foreground">{campaign.city}</TableCell>
                    <TableCell className="text-right">{campaign.leads}</TableCell>
                    <TableCell className="text-right">{campaign.deliveries}</TableCell>
                    <TableCell className="text-right font-semibold">${campaign.revenue.toFixed(2)}</TableCell>
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
