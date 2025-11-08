import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  isLoading?: boolean;
}

export const KPICard = ({ title, value, delta, icon: Icon, isLoading }: KPICardProps) => {
  const showDelta = delta !== undefined;
  const isPositive = delta && delta > 0;
  const isNegative = delta && delta < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isLoading ? "..." : value}</div>
        {showDelta && !isLoading && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive && <TrendingUp className="h-3 w-3 text-green-600" />}
            {isNegative && <TrendingDown className="h-3 w-3 text-red-600" />}
            <span className={`text-xs ${isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"}`}>
              {delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs prev period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
