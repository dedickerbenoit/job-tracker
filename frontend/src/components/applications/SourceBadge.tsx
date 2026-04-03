import { Badge } from "@/components/ui/badge";
import { SOURCE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ApplicationSource } from "@/types";

interface SourceBadgeProps {
  source: ApplicationSource;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgColor,
        config.color,
        "border-transparent text-xs",
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
