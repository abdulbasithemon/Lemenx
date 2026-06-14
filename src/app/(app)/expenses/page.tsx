import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={Receipt} title="Expenses" description="Track and categorize where your money goes." />
      <ComingSoon feature="Expenses" />
    </div>
  );
}
