import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={Building2} title="Income Sources" description="Where your income comes from." />
      <ComingSoon feature="Income Sources" />
    </div>
  );
}
