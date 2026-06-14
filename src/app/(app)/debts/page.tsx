import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={Wallet} title="Debt Manager" description="Track what you owe and what's owed to you." />
      <ComingSoon feature="Debt Manager" />
    </div>
  );
}
