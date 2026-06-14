import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Construction className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-semibold">{feature} is coming up next</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          This module is scaffolded and ready. We&apos;ll build it out together,
          one menu at a time.
        </p>
      </CardContent>
    </Card>
  );
}
