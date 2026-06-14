import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={RefreshCw} title="Recurring Income" description="Automate your regular, repeating income." />
      <ComingSoon feature="Recurring Income" />
    </div>
  );
}
