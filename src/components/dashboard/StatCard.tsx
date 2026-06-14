import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  /** Percentage change vs. the previous period. */
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  /** Uppercase label styling used in the top KPI row. */
  emphasis?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel = "vs prev. period",
  icon: Icon,
  iconClassName,
  emphasis,
}: StatCardProps) {
  const direction = change === undefined ? "flat" : change > 0 ? "up" : change < 0 ? "down" : "flat";
  const TrendIcon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const trendColor =
    direction === "up"
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
      : direction === "down"
      ? "text-rose-600 bg-rose-50 dark:bg-rose-500/10"
      : "text-muted-foreground bg-muted";

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <p
          className={cn(
            "text-sm font-medium text-muted-foreground",
            emphasis && "text-xs font-semibold uppercase tracking-wider"
          )}
        >
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary",
              iconClassName
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>

      {change !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
              trendColor
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </Card>
  );
}
