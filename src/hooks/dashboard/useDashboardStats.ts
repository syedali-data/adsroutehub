import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DateRange {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
}

export const useDashboardKPIs = ({ startDate, endDate, previousStartDate, previousEndDate }: DateRange) => {
  return useQuery({
    queryKey: ["dashboard-kpis", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      console.log("[Dashboard KPIs] Fetching data for range:", { startDate, endDate });
      
      const [
        leadsRes,
        prevLeadsRes,
        deliveriesRes,
        prevDeliveriesRes,
        revenueRes,
        prevRevenueRes,
        buyersRes,
      ] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
        supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", previousStartDate.toISOString()).lte("created_at", previousEndDate.toISOString()),
        supabase.from("deliveries").select("*", { count: "exact", head: true }).gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
        supabase.from("deliveries").select("*", { count: "exact", head: true }).gte("created_at", previousStartDate.toISOString()).lte("created_at", previousEndDate.toISOString()),
        supabase.from("deliveries").select("charge_amount, refunded, won").gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
        supabase.from("deliveries").select("charge_amount, refunded, won").gte("created_at", previousStartDate.toISOString()).lte("created_at", previousEndDate.toISOString()),
        supabase.from("buyers").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      // Check for errors in any query
      if (leadsRes.error) throw new Error(`Leads query failed: ${leadsRes.error.message}`);
      if (prevLeadsRes.error) throw new Error(`Previous leads query failed: ${prevLeadsRes.error.message}`);
      if (deliveriesRes.error) throw new Error(`Deliveries query failed: ${deliveriesRes.error.message}`);
      if (prevDeliveriesRes.error) throw new Error(`Previous deliveries query failed: ${prevDeliveriesRes.error.message}`);
      if (revenueRes.error) throw new Error(`Revenue query failed: ${revenueRes.error.message}`);
      if (prevRevenueRes.error) throw new Error(`Previous revenue query failed: ${prevRevenueRes.error.message}`);
      if (buyersRes.error) throw new Error(`Buyers query failed: ${buyersRes.error.message}`);

      const grossRevenue = revenueRes.data?.filter(d => d.won === true && !d.refunded).reduce((sum, d) => sum + Number(d.charge_amount || 0), 0) || 0;
      const refundedAmount = revenueRes.data?.filter(d => d.refunded).reduce((sum, d) => sum + Number(d.charge_amount || 0), 0) || 0;
      const prevGrossRevenue = prevRevenueRes.data?.filter(d => d.won === true && !d.refunded).reduce((sum, d) => sum + Number(d.charge_amount || 0), 0) || 0;

      const calculateDelta = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      console.log("[Dashboard KPIs] Calculated metrics:", {
        totalLeads: leadsRes.count,
        deliveries: deliveriesRes.count,
        grossRevenue,
        refundedAmount,
        netRevenue: grossRevenue - refundedAmount,
      });

      return {
        totalLeads: leadsRes.count || 0,
        totalLeadsDelta: calculateDelta(leadsRes.count || 0, prevLeadsRes.count || 0),
        deliveries: deliveriesRes.count || 0,
        deliveriesDelta: calculateDelta(deliveriesRes.count || 0, prevDeliveriesRes.count || 0),
        grossRevenue,
        grossRevenueDelta: calculateDelta(grossRevenue, prevGrossRevenue),
        refundedAmount,
        netRevenue: grossRevenue - refundedAmount,
        activeBuyers: buyersRes.count || 0,
      };
    },
  });
};

export const useLeadsDeliveriesOverTime = ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
  return useQuery({
    queryKey: ["leads-deliveries-chart", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      console.log("[Leads/Deliveries Chart] Fetching data for range:", { startDate, endDate });
      
      const [leadsRes, deliveriesRes] = await Promise.all([
        supabase.from("leads").select("created_at").gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
        supabase.from("deliveries").select("created_at").gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
      ]);

      if (leadsRes.error) throw new Error(`Leads chart query failed: ${leadsRes.error.message}`);
      if (deliveriesRes.error) throw new Error(`Deliveries chart query failed: ${deliveriesRes.error.message}`);

      const dataMap = new Map<string, { date: string; leads: number; deliveries: number }>();
      
      leadsRes.data?.forEach(lead => {
        const date = new Date(lead.created_at).toISOString().split("T")[0];
        const existing = dataMap.get(date) || { date, leads: 0, deliveries: 0 };
        existing.leads++;
        dataMap.set(date, existing);
      });

      deliveriesRes.data?.forEach(delivery => {
        const date = new Date(delivery.created_at).toISOString().split("T")[0];
        const existing = dataMap.get(date) || { date, leads: 0, deliveries: 0 };
        existing.deliveries++;
        dataMap.set(date, existing);
      });

      const result = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      console.log("[Leads/Deliveries Chart] Processed data points:", result.length);
      return result;
    },
  });
};

export const useRevenueOverTime = ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
  return useQuery({
    queryKey: ["revenue-chart", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      console.log("[Revenue Chart] Fetching data for range:", { startDate, endDate });
      
      const res = await supabase
        .from("deliveries")
        .select("created_at, charge_amount")
        .eq("won", true)
        .eq("refunded", false)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (res.error) throw new Error(`Revenue chart query failed: ${res.error.message}`);

      const dataMap = new Map<string, { date: string; revenue: number }>();

      res.data?.forEach(delivery => {
        const date = new Date(delivery.created_at).toISOString().split("T")[0];
        const existing = dataMap.get(date) || { date, revenue: 0 };
        existing.revenue += Number(delivery.charge_amount || 0);
        dataMap.set(date, existing);
      });

      const result = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      console.log("[Revenue Chart] Processed data points:", result.length);
      return result;
    },
  });
};

export const useBuyerPerformance = ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
  return useQuery({
    queryKey: ["buyer-performance", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const deliveriesRes = await supabase
        .from("deliveries")
        .select("buyer_id, charge_amount, refunded, won")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const buyerMap = new Map<string, {
        buyerId: string;
        deliveries: number;
        grossRevenue: number;
        refundedAmount: number;
        refundedDeliveries: number;
      }>();

      deliveriesRes.data?.forEach(delivery => {
        if (!delivery.buyer_id) return;
        const existing = buyerMap.get(delivery.buyer_id) || {
          buyerId: delivery.buyer_id,
          deliveries: 0,
          grossRevenue: 0,
          refundedAmount: 0,
          refundedDeliveries: 0,
        };
        existing.deliveries++;
        if (delivery.won === true && !delivery.refunded) {
          existing.grossRevenue += Number(delivery.charge_amount || 0);
        }
        if (delivery.refunded) {
          existing.refundedAmount += Number(delivery.charge_amount || 0);
          existing.refundedDeliveries++;
        }
        buyerMap.set(delivery.buyer_id, existing);
      });

      const buyerIds = Array.from(buyerMap.keys());
      if (buyerIds.length === 0) return [];

      const buyersRes = await supabase
        .from("buyers")
        .select("id, business_name, city")
        .in("id", buyerIds);

      return buyersRes.data?.map(buyer => {
        const stats = buyerMap.get(buyer.id)!;
        return {
          name: buyer.business_name,
          city: buyer.city,
          deliveries: stats.deliveries,
          grossRevenue: stats.grossRevenue,
          refundedAmount: stats.refundedAmount,
          netRevenue: stats.grossRevenue - stats.refundedAmount,
          refundRate: stats.deliveries > 0 ? (stats.refundedDeliveries / stats.deliveries) * 100 : 0,
        };
      }) || [];
    },
  });
};

export const useCampaignPerformance = ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
  return useQuery({
    queryKey: ["campaign-performance", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const [leadsRes, deliveriesRes] = await Promise.all([
        supabase.from("leads").select("campaign_id").gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
        supabase.from("deliveries").select("campaign_id, charge_amount, refunded, won").gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
      ]);

      const campaignMap = new Map<string, { leads: number; deliveries: number; revenue: number }>();

      leadsRes.data?.forEach(lead => {
        if (!lead.campaign_id) return;
        const existing = campaignMap.get(lead.campaign_id) || { leads: 0, deliveries: 0, revenue: 0 };
        existing.leads++;
        campaignMap.set(lead.campaign_id, existing);
      });

      deliveriesRes.data?.forEach(delivery => {
        if (!delivery.campaign_id) return;
        const existing = campaignMap.get(delivery.campaign_id) || { leads: 0, deliveries: 0, revenue: 0 };
        existing.deliveries++;
        if (delivery.won === true && !delivery.refunded) {
          existing.revenue += Number(delivery.charge_amount || 0);
        }
        campaignMap.set(delivery.campaign_id, existing);
      });

      const campaignIds = Array.from(campaignMap.keys());
      if (campaignIds.length === 0) return [];

      const campaignsRes = await supabase
        .from("campaigns")
        .select("id, name, service_type, city")
        .in("id", campaignIds);

      return campaignsRes.data?.map(campaign => {
        const stats = campaignMap.get(campaign.id) || { leads: 0, deliveries: 0, revenue: 0 };
        return {
          name: campaign.name,
          serviceType: campaign.service_type,
          city: campaign.city,
          leads: stats.leads,
          deliveries: stats.deliveries,
          revenue: stats.revenue,
        };
      }) || [];
    },
  });
};

export const useRefundHealth = ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
  return useQuery({
    queryKey: ["refund-health", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const refundsRes = await supabase
        .from("refund_requests")
        .select("status, created_at, handled_ts, buyer_id")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const total = refundsRes.data?.length || 0;
      const approved = refundsRes.data?.filter(r => r.status === "approved").length || 0;
      const rejected = refundsRes.data?.filter(r => r.status === "rejected").length || 0;

      const handledRequests = refundsRes.data?.filter(r => r.handled_ts && (r.status === "approved" || r.status === "rejected")) || [];
      const avgResponseTime = handledRequests.length > 0
        ? handledRequests.reduce((sum, r) => {
            const diff = new Date(r.handled_ts!).getTime() - new Date(r.created_at).getTime();
            return sum + diff;
          }, 0) / handledRequests.length / (1000 * 60 * 60)
        : 0;

      const buyerRefundCounts = new Map<string, number>();
      refundsRes.data?.forEach(r => {
        if (r.buyer_id) {
          buyerRefundCounts.set(r.buyer_id, (buyerRefundCounts.get(r.buyer_id) || 0) + 1);
        }
      });

      const topBuyerIds = Array.from(buyerRefundCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      let topBuyers: { name: string; count: number }[] = [];
      if (topBuyerIds.length > 0) {
        const buyersRes = await supabase
          .from("buyers")
          .select("id, business_name")
          .in("id", topBuyerIds);

        topBuyers = buyersRes.data?.map(buyer => ({
          name: buyer.business_name,
          count: buyerRefundCounts.get(buyer.id) || 0,
        })) || [];
      }

      return {
        total,
        approved,
        rejected,
        avgResponseTimeHours: avgResponseTime,
        topBuyers,
      };
    },
  });
};
