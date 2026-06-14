import { ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={ArrowLeftRight} title="Transactions" description="Every credit and debit across your accounts." />
      <ComingSoon feature="Transactions" />
    </div>
  );
}
