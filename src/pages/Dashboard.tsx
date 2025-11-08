import { useState } from "react";
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

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");
  const dateRange = useDateRange(timeRange);

  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs(dateRange);
  const { data: leadsDeliveriesData, isLoading: chartLoading } = useLeadsDeliveriesOverTime(dateRange);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueOverTime(dateRange);
  const { data: buyerPerformance, isLoading: buyerLoading } = useBuyerPerformance(dateRange);
  const { data: campaignPerformance, isLoading: campaignLoading } = useCampaignPerformance(dateRange);
  const { data: refundHealth, isLoading: refundLoading } = useRefundHealth(dateRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Analytics overview for ADS RouteHub</p>
        </div>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Trends</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <LeadsDeliveriesChart data={leadsDeliveriesData || []} isLoading={chartLoading} />
          <RevenueChart data={revenueData || []} isLoading={revenueLoading} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Buyer Performance</h2>
        <BuyerPerformanceTable data={buyerPerformance || []} isLoading={buyerLoading} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Campaigns</h2>
        <CampaignBreakdown data={campaignPerformance || []} isLoading={campaignLoading} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Refund Health</h2>
        <RefundHealthSummary data={refundHealth} isLoading={refundLoading} />
      </section>
    </div>
  );
};

export default Dashboard;