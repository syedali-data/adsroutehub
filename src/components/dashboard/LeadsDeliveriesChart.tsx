import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

interface LeadsDeliveriesChartProps {
  data: { date: string; leads: number; deliveries: number }[];
  isLoading?: boolean;
}

export const LeadsDeliveriesChart = ({ data, isLoading }: LeadsDeliveriesChartProps) => {
  const chartConfig = {
    leads: {
      label: "Leads",
      color: "hsl(var(--primary))",
    },
    deliveries: {
      label: "Deliveries",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads & Deliveries Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="deliveries" stroke="var(--color-deliveries)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
