/** Subscription plan definitions for LemenX. */

export type PlanId = "FREE" | "PREMIUM" | "BUSINESS" | "ENTERPRISE";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number; // USD
  priceYearly: number; // USD
  bdtMonthly: number; // BDT for UddoktaPay
  highlighted?: boolean;
  limits: {
    users: number; // -1 = unlimited
    transactionsPerMonth: number;
    notes: number;
    storageMb: number;
    customDomains: number;
    apiAccess: boolean;
    analytics: boolean;
  };
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    name: "Free",
    description: "Everything you need to get started.",
    priceMonthly: 0,
    priceYearly: 0,
    bdtMonthly: 0,
    limits: {
      users: 1,
      transactionsPerMonth: 100,
      notes: 50,
      storageMb: 100,
      customDomains: 0,
      apiAccess: false,
      analytics: false,
    },
    features: [
      "1 workspace user",
      "100 transactions / month",
      "50 notes",
      "100 MB storage",
      "Subdomain (you.lemenx.com)",
    ],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    description: "For individuals who want more power.",
    priceMonthly: 9,
    priceYearly: 90,
    bdtMonthly: 990,
    highlighted: true,
    limits: {
      users: 3,
      transactionsPerMonth: -1,
      notes: -1,
      storageMb: 5120,
      customDomains: 1,
      apiAccess: false,
      analytics: true,
    },
    features: [
      "Up to 3 users",
      "Unlimited transactions",
      "Unlimited notes",
      "5 GB storage",
      "1 custom domain",
      "Advanced analytics",
    ],
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    description: "For growing teams that need scale.",
    priceMonthly: 29,
    priceYearly: 290,
    bdtMonthly: 3190,
    limits: {
      users: 10,
      transactionsPerMonth: -1,
      notes: -1,
      storageMb: 51200,
      customDomains: 5,
      apiAccess: true,
      analytics: true,
    },
    features: [
      "Up to 10 users",
      "Unlimited transactions & notes",
      "50 GB storage",
      "5 custom domains",
      "API access",
      "Advanced analytics",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    description: "Custom solutions for large organizations.",
    priceMonthly: -1,
    priceYearly: -1,
    bdtMonthly: -1,
    limits: {
      users: -1,
      transactionsPerMonth: -1,
      notes: -1,
      storageMb: -1,
      customDomains: -1,
      apiAccess: true,
      analytics: true,
    },
    features: [
      "Unlimited users",
      "Unlimited everything",
      "Unlimited storage",
      "Unlimited custom domains",
      "Full API access",
      "Dedicated support & SLA",
      "SSO / SAML",
    ],
  },
};

export const PLAN_LIST = Object.values(PLANS);
