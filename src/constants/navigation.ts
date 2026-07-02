import {
  LayoutGrid,
  Landmark,
  ArrowLeftRight,
  Receipt,
  PieChart,
  LineChart,
  FileText,
  Building2,
  RefreshCw,
  Tags,
  Wallet,
  CheckSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

/**
 * Sidebar navigation for the LemenX user workspace.
 * Grouped to mirror the finance-first dashboard layout.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutGrid }],
  },
  {
    heading: "Banking & Expenses",
    items: [
      { label: "Bank Accounts", href: "/bank-accounts", icon: Landmark },
      { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
      { label: "Expenses", href: "/expenses", icon: Receipt },
      { label: "Budget", href: "/budget", icon: PieChart },
    ],
  },
  {
    heading: "Income",
    items: [
      { label: "Income Dashboard", href: "/income", icon: LayoutGrid },
      { label: "Income Log", href: "/income/log", icon: FileText },
      { label: "Income Sources", href: "/income/sources", icon: Building2 },
      { label: "Recurring Income", href: "/income/recurring", icon: RefreshCw },
      { label: "Income Categories", href: "/income/categories", icon: Tags },
    ],
  },
  {
    heading: "Debts",
    items: [{ label: "Debt Manager", href: "/debts", icon: Wallet }],
  },
  {
    heading: "Workspace",
    items: [
      { label: "Tasks & Notes", href: "/tasks", icon: CheckSquare },
      { label: "Analytics", href: "/analytics", icon: LineChart },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
