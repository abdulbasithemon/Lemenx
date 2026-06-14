import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={FileText} title="Income Log" description="A detailed record of every income entry." />
      <ComingSoon feature="Income Log" />
    </div>
  );
}
