import { useState, useEffect } from "react";
import { FileText, Users, Truck, DollarSign, TrendingUp, DollarSign as RefundIcon } from "lucide-react";
import { TimeRangeFilter, TimeRange } from "@/components/dashboard/TimeRangeFilter";
import { useDateRange } from "@/hooks/useDateRange";
import {
  useDashboardKPIs,
  useLeadsDeliveriesOverTime,
  useRevenueOverTime,
  useBuyerPerformance,
  useCampaignPerformance,
  useRefundHealth,
} from "@/hooks/dashboard/useDashboardStats";
import { KPICard } from "@/components/dashboard/KPICard";
import { LeadsDeliveriesChart } from "@/components/dashboard/LeadsDeliveriesChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { BuyerPerformanceTable } from "@/components/dashboard/BuyerPerformanceTable";
import { CampaignBreakdown } from "@/components/dashboard/CampaignBreakdown";
import { RefundHealthSummary } from "@/components/dashboard/RefundHealthSummary";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");
  const dateRange = useDateRange(timeRange);

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useDashboardKPIs(dateRange);
  const { data: leadsDeliveriesData, isLoading: chartLoading, error: chartError } = useLeadsDeliveriesOverTime(dateRange);
  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useRevenueOverTime(dateRange);
  const { data: buyerPerformance, isLoading: buyerLoading } = useBuyerPerformance(dateRange);
  const { data: campaignPerformance, isLoading: campaignLoading } = useCampaignPerformance(dateRange);
  const { data: refundHealth, isLoading: refundLoading } = useRefundHealth(dateRange);

  // Handle errors with toast notifications
  useEffect(() => {
    if (kpisError) {
      console.error("[Dashboard] KPI Error:", kpisError);
      toast({
        title: "Error loading dashboard metrics",
        description: kpisError.message,
        variant: "destructive",
      });
    }
  }, [kpisError]);

  useEffect(() => {
    if (chartError) {
      console.error("[Dashboard] Chart Error:", chartError);
      toast({
        title: "Error loading chart data",
        description: chartError.message,
        variant: "destructive",
      });
    }
  }, [chartError]);

  useEffect(() => {
    if (revenueError) {
      console.error("[Dashboard] Revenue Error:", revenueError);
      toast({
        title: "Error loading revenue data",
        description: revenueError.message,
        variant: "destructive",
      });
    }
  }, [revenueError]);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Real-time insights and performance metrics
          </p>
        </div>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Total Leads"
          value={kpis?.totalLeads || 0}
          delta={kpis?.totalLeadsDelta}
          icon={FileText}
          isLoading={kpisLoading}
        />
        <KPICard
          title="Deliveries Sent"
          value={kpis?.deliveries || 0}
          delta={kpis?.deliveriesDelta}
          icon={Truck}
          isLoading={kpisLoading}
        />
        <KPICard
          title="Gross Revenue"
          value={`$${kpis?.grossRevenue.toFixed(2) || "0.00"}`}
          delta={kpis?.grossRevenueDelta}
          icon={TrendingUp}
          isLoading={kpisLoading}
        />
        <KPICard
          title="Refunded Amount"
          value={`$${kpis?.refundedAmount.toFixed(2) || "0.00"}`}
          icon={RefundIcon}
          isLoading={kpisLoading}
        />
        <KPICard
          title="Net Revenue"
          value={`$${kpis?.netRevenue.toFixed(2) || "0.00"}`}
          icon={DollarSign}
          isLoading={kpisLoading}
        />
        <KPICard
          title="Active Buyers"
          value={kpis?.activeBuyers || 0}
          icon={Users}
          isLoading={kpisLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadsDeliveriesChart data={leadsDeliveriesData || []} isLoading={chartLoading} />
        <RevenueChart data={revenueData || []} isLoading={revenueLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CampaignBreakdown data={campaignPerformance || []} isLoading={campaignLoading} />
        <BuyerPerformanceTable data={buyerPerformance || []} isLoading={buyerLoading} />
      </div>

      <RefundHealthSummary data={refundHealth} isLoading={refundLoading} />
    </div>
  );
};

export default Dashboard;