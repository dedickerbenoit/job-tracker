import { Badge } from "@/components/ui/badge";
import { SOURCE_CONFIG } from "@/lib/constants";
import { LinkedInIcon, IndeedIcon } from "@/components/icons/SourceIcons";
import { cn } from "@/lib/utils";
import type { ApplicationSource } from "@/types";

const SOURCE_ICONS: Partial<
  Record<ApplicationSource, React.FC<{ size?: number }>>
> = {
  linkedin: LinkedInIcon,
  indeed: IndeedIcon,
};

interface SourceBadgeProps {
  source: ApplicationSource;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  const Icon = SOURCE_ICONS[source];
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-muted text-foreground border-transparent text-xs gap-1",
        className,
      )}
    >
      {Icon && <Icon size={12} />}
      {config.label}
    </Badge>
  );
}
