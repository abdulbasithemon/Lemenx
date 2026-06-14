"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const PERIODS = [
  "This Week",
  "This Month",
  "Last 3 Months",
  "Last 6 Months",
  "This Year",
  "All Time",
] as const;

export type Period = (typeof PERIODS)[number];

interface PeriodToggleProps {
  value?: Period;
  onChange?: (period: Period) => void;
}

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  const [internal, setInternal] = React.useState<Period>(value ?? "This Month");
  const active = value ?? internal;

  const select = (p: Period) => {
    setInternal(p);
    onChange?.(p);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => select(p)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            active === p
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
