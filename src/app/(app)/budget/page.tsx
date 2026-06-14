import { PieChart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={PieChart} title="Budget" description="Plan and monitor your spending limits." />
      <ComingSoon feature="Budget" />
    </div>
  );
}
