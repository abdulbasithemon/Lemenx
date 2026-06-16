"use client";

import * as React from "react";
import {
  Settings,
  User,
  Building2,
  CreditCard,
  Globe,
  Users,
  Bell,
  Shield,
  Camera,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";
import { PLAN_LIST } from "@/constants/plans";

/* ------------------------------------------------------------------ */
/*  Tiny reusable field row                                             */
/* ------------------------------------------------------------------ */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                     */
/* ------------------------------------------------------------------ */
function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  1. Profile tab                                                      */
/* ------------------------------------------------------------------ */
function ProfileTab() {
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Section
        title="Your Profile"
        description="This information is about you personally, not your workspace."
      >
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {getInitials("Admin User")}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF · max 2 MB</p>
            <Button variant="outline" size="sm" className="mt-2">Upload photo</Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input placeholder="Abdul" defaultValue="Abdul" />
          </Field>
          <Field label="Last name">
            <Input placeholder="Basith" defaultValue="Basith" />
          </Field>
        </div>

        <Field label="Email address" hint="Used to log in and receive notifications.">
          <Input type="email" placeholder="you@example.com" defaultValue="abdulbasithimon@gmail.com" />
        </Field>

        <Field label="Phone number (optional)">
          <Input type="tel" placeholder="+880 1XXX XXXXXX" />
        </Field>

        <Field label="Bio (optional)" hint="A short bio shown to your workspace members.">
          <Textarea placeholder="Tell your team a little about yourself…" rows={3} />
        </Field>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="min-w-[120px]">
            {saved ? (
              <><Check className="h-4 w-4" /> Saved!</>
            ) : (
              "Save profile"
            )}
          </Button>
        </div>
      </Section>

      {/* Password */}
      <Section
        title="Change password"
        description="Must be at least 8 characters with a number and a special character."
      >
        <Field label="Current password">
          <Input type="password" placeholder="••••••••" />
        </Field>
        <Field label="New password">
          <Input type="password" placeholder="••••••••" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" placeholder="••••••••" />
        </Field>
        <div className="flex justify-end">
          <Button>Update password</Button>
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Workspace tab                                                    */
/* ------------------------------------------------------------------ */
function WorkspaceTab() {
  const [copied, setCopied] = React.useState(false);

  const copySubdomain = () => {
    navigator.clipboard.writeText("abemuth.lemenx.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Section
        title="Workspace details"
        description="General information about your LemenX workspace."
      >
        <Field label="Workspace name" hint="Shown in the sidebar and your workspace URL.">
          <Input defaultValue="Abemuth" />
        </Field>

        <Field label="Workspace URL">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground">
              abemuth.lemenx.com
            </div>
            <Button variant="outline" size="icon" onClick={copySubdomain}>
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </Field>

        <Field label="Description (optional)" hint="Helps team members understand the workspace purpose.">
          <Textarea placeholder="e.g. Personal finance workspace for the Abemuth family" rows={3} />
        </Field>

        <Field label="Currency" hint="Used across all finance modules.">
          <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="BDT">BDT — Bangladeshi Taka (৳)</option>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="EUR">EUR — Euro (€)</option>
            <option value="GBP">GBP — British Pound (£)</option>
          </select>
        </Field>

        <Field label="Timezone">
          <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (UTC-5)</option>
            <option value="Europe/London">Europe/London (UTC+0)</option>
          </select>
        </Field>

        <div className="flex justify-end">
          <Button>Save workspace</Button>
        </div>
      </Section>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium">Delete workspace</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this workspace and all its data.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Billing tab                                                      */
/* ------------------------------------------------------------------ */
function BillingTab() {
  const currentPlan = "FREE";

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <Section title="Current plan" description="Your active subscription details.">
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">Free plan</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              1 user · 100 transactions/mo · 50 notes · 100 MB storage
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">৳0</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
        </div>
      </Section>

      {/* Upgrade plans */}
      <Section title="Upgrade your plan" description="Choose a plan that scales with you.">
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_LIST.filter((p) => p.id !== "FREE" && p.id !== "ENTERPRISE").map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border p-5 transition-shadow hover:shadow-md",
                plan.highlighted ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <p className="font-semibold">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold">
                ${plan.priceMonthly}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">৳{plan.bdtMonthly}/mo</p>
              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className="mt-4 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                disabled={plan.id === currentPlan}
              >
                Upgrade to {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* Payment method */}
      <Section title="Payment method" description="Manage your saved payment methods.">
        <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground">No payment method added yet.</p>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Add card
          </Button>
        </div>
      </Section>

      {/* Invoice history */}
      <Section title="Invoice history" description="Download past invoices for your records.">
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No invoices yet — they&apos;ll appear here after your first payment.
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Custom Domain tab                                                */
/* ------------------------------------------------------------------ */
function DomainTab() {
  const [domain, setDomain] = React.useState("");
  const verificationStatus: "unverified" | "pending" | "verified" = "unverified";

  const StatusIcon = {
    verified: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    pending: <Clock className="h-5 w-5 text-amber-500" />,
    unverified: <XCircle className="h-5 w-5 text-muted-foreground" />,
  }[verificationStatus];

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardContent className="flex items-start gap-3 pt-5">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Premium feature
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Custom domains are available on Premium, Business, and Enterprise plans.
            </p>
          </div>
        </CardContent>
      </Card>

      <Section
        title="Custom domain"
        description="Point your own domain (e.g. finance.yourname.com) to your LemenX workspace."
      >
        <Field label="Your domain" hint="Enter the domain or subdomain you want to use.">
          <div className="flex gap-2">
            <Input
              placeholder="finance.yourcompany.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <Button disabled={!domain}>Add domain</Button>
          </div>
        </Field>
      </Section>

      <Section
        title="DNS setup instructions"
        description="Add these records to your domain provider (Cloudflare, GoDaddy, Namecheap, etc.)"
      >
        <div className="space-y-3">
          {[
            { type: "CNAME", name: "finance", value: "cname.lemenx.com", ttl: "Auto" },
            { type: "TXT", name: "_lemenx-verify", value: "lemenx-verify=abc123xyz", ttl: "300" },
          ].map((record) => (
            <div
              key={record.type}
              className="grid grid-cols-4 gap-2 rounded-lg bg-muted p-3 font-mono text-xs"
            >
              <div>
                <p className="font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</p>
                <p className="mt-1 font-semibold text-primary">{record.type}</p>
              </div>
              <div>
                <p className="font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Name</p>
                <p className="mt-1">{record.name}</p>
              </div>
              <div className="col-span-2">
                <p className="font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Value</p>
                <p className="mt-1 break-all">{record.value}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          DNS changes can take up to 48 hours to propagate. Click &quot;Verify DNS&quot; once you&apos;ve added the records.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4" />
            Open domain provider
          </Button>
          <Button>Verify DNS</Button>
        </div>
      </Section>

      <Section title="SSL certificate" description="Free SSL is automatically provisioned once your domain is verified.">
        <div className="flex items-center gap-3 rounded-lg border p-4">
          {StatusIcon}
          <div>
            <p className="text-sm font-medium capitalize">{verificationStatus}</p>
            <p className="text-xs text-muted-foreground">
              Add your domain above and verify DNS to enable SSL.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Members tab                                                      */
/* ------------------------------------------------------------------ */
const MOCK_MEMBERS = [
  { name: "Abdul Basith", email: "abdulbasithimon@gmail.com", role: "Owner", initials: "AB" },
];

function MembersTab() {
  return (
    <div className="space-y-6">
      <Section
        title="Workspace members"
        description="Manage who has access to this workspace."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Invite member
          </Button>
        }
      >
        <div className="space-y-3">
          {MOCK_MEMBERS.map((m) => (
            <div key={m.email} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {m.initials}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <Badge variant={m.role === "Owner" ? "default" : "secondary"}>{m.role}</Badge>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pending invitations" description="Members who haven't accepted yet.">
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No pending invitations.
        </div>
      </Section>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-5">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Free plan: 1 member only</p>
            <p className="text-xs text-muted-foreground">
              Upgrade to Premium (3 members) or Business (10 members) to invite your team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  6. Notifications tab                                                */
/* ------------------------------------------------------------------ */
const NOTIFICATION_ITEMS = [
  { id: "budget_alert", label: "Budget alerts", desc: "Notify when you exceed a budget limit", default: true },
  { id: "large_txn", label: "Large transactions", desc: "Notify for transactions above ৳10,000", default: true },
  { id: "monthly_report", label: "Monthly report", desc: "Email summary of your monthly finances", default: true },
  { id: "debt_due", label: "Debt due reminders", desc: "Remind 7 days before a debt is due", default: true },
  { id: "login_alert", label: "Login from new device", desc: "Security alert for new sign-ins", default: true },
  { id: "product_updates", label: "Product updates", desc: "New features and announcements from LemenX", default: false },
];

function NotificationsTab() {
  const [states, setStates] = React.useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_ITEMS.map((n) => [n.id, n.default]))
  );

  return (
    <div className="space-y-6">
      <Section title="Email notifications" description="Choose which emails you want to receive.">
        <div className="space-y-4">
          {NOTIFICATION_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={states[item.id]}
                onCheckedChange={(v) => setStates((s) => ({ ...s, [item.id]: v }))}
              />
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex justify-end">
          <Button>Save preferences</Button>
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  7. Security tab                                                     */
/* ------------------------------------------------------------------ */
function SecurityTab() {
  return (
    <div className="space-y-6">
      <Section
        title="Two-factor authentication"
        description="Add an extra layer of security to your account."
      >
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Authenticator app</p>
              <p className="text-xs text-muted-foreground">
                Use Google Authenticator or Authy to generate one-time codes.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">Enable 2FA</Button>
        </div>
      </Section>

      <Section title="Active sessions" description="Devices currently logged in to your account.">
        <div className="space-y-3">
          {[
            { device: "MacBook Pro · Safari", location: "Dhaka, Bangladesh", current: true, time: "Now" },
            { device: "iPhone 15 · Mobile app", location: "Dhaka, Bangladesh", current: false, time: "2 hours ago" },
          ].map((session) => (
            <div key={session.device} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{session.device}</p>
                  {session.current && <Badge variant="success" className="text-[10px]">Current</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10">
            Revoke all other sessions
          </Button>
        </div>
      </Section>

      <Section title="Login history" description="Recent sign-in activity for your account.">
        <div className="space-y-1">
          {[
            { event: "Sign in", device: "MacBook Pro", location: "Dhaka, BD", time: "Today 9:41 AM", ok: true },
            { event: "Sign in", device: "iPhone 15", location: "Dhaka, BD", time: "Today 7:22 AM", ok: true },
            { event: "Failed sign in", device: "Unknown", location: "Unknown", time: "Yesterday 11:02 PM", ok: false },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2 text-sm hover:bg-muted/50">
              {log.ok
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                : <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
              <span className="flex-1 font-medium">{log.event}</span>
              <span className="text-muted-foreground">{log.device}</span>
              <span className="hidden text-muted-foreground sm:inline">{log.location}</span>
              <span className="text-muted-foreground">{log.time}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page root                                                           */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "workspace",     label: "Workspace",     icon: Building2 },
  { id: "billing",       label: "Billing",       icon: CreditCard },
  { id: "domain",        label: "Domain",        icon: Globe },
  { id: "members",       label: "Members",       icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security",      label: "Security",      icon: Shield },
] as const;

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Manage your profile, workspace, billing, and security."
      />

      <Tabs defaultValue="profile">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-auto gap-1 rounded-xl bg-muted p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
              >
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="workspace"><WorkspaceTab /></TabsContent>
        <TabsContent value="billing"><BillingTab /></TabsContent>
        <TabsContent value="domain"><DomainTab /></TabsContent>
        <TabsContent value="members"><MembersTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
      </Tabs>
    </div>
  );
}
