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
    <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold tracking-tight">{isLoading ? "..." : value}</div>
        {showDelta && !isLoading && (
          <div className="flex items-center gap-1.5 mt-2">
            {isPositive && <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
            <span className={`text-sm font-medium ${
              isPositive 
                ? "text-emerald-600 dark:text-emerald-400" 
                : isNegative 
                ? "text-rose-600 dark:text-rose-400" 
                : "text-muted-foreground"
            }`}>
              {delta > 0 ? "+" : ""}{delta.toFixed(1)}% <span className="text-xs font-normal">vs prev</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
