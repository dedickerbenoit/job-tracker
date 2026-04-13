import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "@/components/applications/KanbanCard";
import { STATUS_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { Application, ApplicationStatus } from "@/types";

interface KanbanColumnProps {
  status: ApplicationStatus;
  items: Application[];
  onEditApp?: (app: Application) => void;
  onDeleteApp?: (app: Application) => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  status,
  items,
  onEditApp,
  onDeleteApp,
}: KanbanColumnProps) {
  const config = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/50 transition-colors",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn("h-2.5 w-2.5 rounded-full", config.bgColor)} />
        <span className="text-sm font-medium">{config.label}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {items.map((app) => (
          <KanbanCard
            key={app.id}
            application={app}
            onEdit={onEditApp ? () => onEditApp(app) : undefined}
            onDelete={onDeleteApp ? () => onDeleteApp(app) : undefined}
          />
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <span className="text-xs text-muted-foreground">
              {t.application.emptyState}
            </span>
            <span className="text-[0.65rem] text-muted-foreground/60">
              {t.application.emptyStateAction}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
