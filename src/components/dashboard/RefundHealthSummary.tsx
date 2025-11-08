import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RefundHealth {
  total: number;
  approved: number;
  rejected: number;
  avgResponseTimeHours: number;
  topBuyers: { name: string; count: number }[];
}

interface RefundHealthSummaryProps {
  data: RefundHealth | undefined;
  isLoading?: boolean;
}

export const RefundHealthSummary = ({ data, isLoading }: RefundHealthSummaryProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refund Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refund Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No refund requests in this period</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Requests</div>
            <div className="text-2xl font-bold">{data.total}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Approved</div>
            <div className="text-2xl font-bold text-green-600">{data.approved}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{data.rejected}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Response</div>
            <div className="text-2xl font-bold">{data.avgResponseTimeHours.toFixed(1)}h</div>
          </div>
        </div>

        {data.topBuyers.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Top 5 Buyers by Refund Count</div>
            <div className="space-y-2">
              {data.topBuyers.map((buyer, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{buyer.name}</span>
                  <Badge variant="secondary">{buyer.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
