import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={Settings} title="Settings" description="Manage your workspace, profile, and billing." />
      <ComingSoon feature="Settings" />
    </div>
  );
}
