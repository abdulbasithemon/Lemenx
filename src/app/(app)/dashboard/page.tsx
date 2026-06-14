"use client";

import {
  LayoutGrid,
  Landmark,
  CreditCard,
  DollarSign,
  HandCoins,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PeriodToggle } from "@/components/dashboard/PeriodToggle";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTaka } from "@/lib/utils";

/**
 * Workspace dashboard — financial pulse overview.
 * Values are placeholders until live data is wired through the finance APIs.
 */
export default function DashboardPage() {
  const userName = "admin";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={LayoutGrid}
          title="Dashboard"
          description={`Welcome back, ${userName}. Here's your financial pulse.`}
          className="mb-0"
        />
        <PeriodToggle />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard emphasis label="Total Income" value={formatTaka(0)} change={0} />
        <StatCard emphasis label="Total Expenses" value={formatTaka(0)} change={0} />
        <StatCard emphasis label="Net Income" value={formatTaka(0)} change={0} />
        <StatCard emphasis label="Avg Monthly Income" value={formatTaka(0)} change={0} />
      </div>

      {/* Balance / debt row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Bank Balance"
          value={formatTaka(417854)}
          change={-14.3}
          changeLabel="from previous period"
          icon={Landmark}
        />
        <StatCard
          label="Total Debt"
          value={formatTaka(2820000)}
          change={-5.2}
          changeLabel="vs last month • 11 debts active"
          icon={CreditCard}
          iconClassName="bg-rose-50 text-rose-600 dark:bg-rose-500/10"
        />
        <StatCard
          label="Total Expenses"
          value={formatTaka(0)}
          change={0}
          changeLabel="vs last month"
          icon={DollarSign}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10"
        />
        <StatCard
          label="Debts Back"
          value={formatTaka(200000)}
          changeLabel="3 pending returns"
          icon={HandCoins}
          iconClassName="bg-sky-50 text-sky-600 dark:bg-sky-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
          </CardHeader>
          <CardContent className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            No data available for this period.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
          </CardHeader>
          <CardContent className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            No source data available.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
