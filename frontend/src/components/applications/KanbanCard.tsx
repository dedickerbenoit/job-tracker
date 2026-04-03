import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SourceBadge } from "@/components/applications/SourceBadge";
import { useApplicationStore } from "@/stores/applicationStore";
import { cn } from "@/lib/utils";
import type { Application } from "@/types";

interface KanbanCardProps {
  application: Application;
  isDragging?: boolean;
}

export const KanbanCard = memo(function KanbanCard({
  application,
  isDragging = false,
}: KanbanCardProps) {
  const setSelectedApplication = useApplicationStore(
    (s) => s.setSelectedApplication,
  );

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => !isDragging && setSelectedApplication(application)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isDragging) setSelectedApplication(application);
      }}
      className={cn(
        "cursor-grab space-y-1.5 p-3 transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "rotate-2 shadow-lg opacity-90",
      )}
    >
      <div className="text-sm font-medium leading-tight">
        {application.title}
      </div>
      <div className="text-xs text-muted-foreground">{application.company}</div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span className="truncate">{application.location}</span>
      </div>
      <div className="flex items-center justify-between pt-1">
        <SourceBadge source={application.source} />
        <span className="text-[0.65rem] text-muted-foreground">
          {formatDistanceToNow(new Date(application.created_at), {
            addSuffix: true,
            locale: fr,
          })}
        </span>
      </div>
    </Card>
  );
});
