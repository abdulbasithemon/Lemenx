import { StickyNote } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function Page() {
  return (
    <div>
      <PageHeader icon={StickyNote} title="Notes" description="Capture ideas, plans, and everything in between." />
      <ComingSoon feature="Notes" />
    </div>
  );
}
