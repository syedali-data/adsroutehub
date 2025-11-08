import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";

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
  // Calculate refund rate and health status
  const refundRate = data && data.total > 0 
    ? (data.total / (data.total + 100)) * 100 // Rough estimate
    : 0;
  
  const getHealthStatus = (rate: number) => {
    if (rate < 5) return { label: "Healthy", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" };
    if (rate < 15) return { label: "Watch", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
    return { label: "High", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" };
  };
  
  const healthStatus = getHealthStatus(refundRate);

  if (isLoading) {
    return (
      <Card className="shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Refund Health</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Monitor refund trends and response times</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Loading refund data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card className="shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Refund Health</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Monitor refund trends and response times</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-2 bg-muted/20 rounded-lg p-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-muted-foreground font-medium">No refund requests</p>
            <p className="text-sm text-muted-foreground/70">All deliveries are performing well</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold">Refund Health</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Monitor refund trends and response times</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health indicator */}
        <div className={`rounded-xl p-4 ${healthStatus.bg} border border-border/30`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Overall Status</p>
              <p className={`text-2xl font-bold ${healthStatus.color}`}>{healthStatus.label}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Refund Rate</p>
              <p className={`text-2xl font-bold ${healthStatus.color}`}>{refundRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            </div>
            <p className="text-2xl font-bold">{data.total}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Approved</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.approved}</p>
          </div>
          <div className="bg-rose-500/10 rounded-lg p-4 border border-rose-500/20">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">Rejected</p>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{data.rejected}</p>
          </div>
        </div>

        {/* Response time */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Average Response Time</h4>
          </div>
          <p className="text-3xl font-bold">{data.avgResponseTimeHours.toFixed(1)}<span className="text-xl text-muted-foreground ml-1">hours</span></p>
        </div>

        {/* Top buyers with refunds */}
        {data.topBuyers && data.topBuyers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Top Buyers by Refund Requests</h4>
            <div className="flex flex-wrap gap-2">
              {data.topBuyers.map((buyer, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                  {buyer.name} <span className="ml-1.5 text-muted-foreground">({buyer.count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
