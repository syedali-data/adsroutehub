import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Truck, DollarSign } from "lucide-react";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [leadsRes, buyersRes, deliveriesRes] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact" }).gte("created_at", today.toISOString()),
        supabase.from("buyers").select("*", { count: "exact" }).eq("status", "active"),
        supabase.from("deliveries").select("charge_amount").gte("created_at", today.toISOString()),
      ]);

      const revenue = deliveriesRes.data?.reduce((sum, d) => sum + Number(d.charge_amount || 0), 0) || 0;

      return {
        leadsToday: leadsRes.count || 0,
        activeBuyers: buyersRes.count || 0,
        deliveriesToday: deliveriesRes.data?.length || 0,
        revenueToday: revenue,
      };
    },
  });

  const statCards = [
    {
      title: "Leads Today",
      value: stats?.leadsToday || 0,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Active Buyers",
      value: stats?.activeBuyers || 0,
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Deliveries Today",
      value: stats?.deliveriesToday || 0,
      icon: Truck,
      color: "text-warning",
    },
    {
      title: "Revenue Today",
      value: `$${stats?.revenueToday.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to ADS RouteHub</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;