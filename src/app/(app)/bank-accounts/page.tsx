import { Landmark } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={Landmark} title="Bank Accounts" description="Manage your linked bank accounts and balances." />
      <ComingSoon feature="Bank Accounts" />
    </div>
  );
}
