import { LineChart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={LineChart} title="Analytics" description="Deep insights across your finances." />
      <ComingSoon feature="Analytics" />
    </div>
  );
}
