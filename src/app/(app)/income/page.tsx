import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={LayoutGrid} title="Income Dashboard" description="An overview of your earnings and trends." />
      <ComingSoon feature="Income Dashboard" />
    </div>
  );
}
