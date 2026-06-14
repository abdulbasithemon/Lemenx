import { Tags } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={Tags} title="Income Categories" description="Organize income into meaningful buckets." />
      <ComingSoon feature="Income Categories" />
    </div>
  );
}
