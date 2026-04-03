import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useApplicationStore } from "@/stores/applicationStore";
import { STATUS_ORDER } from "@/lib/constants";
import { KanbanColumn } from "@/components/applications/KanbanColumn";
import { KanbanCard } from "@/components/applications/KanbanCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import type { Application, ApplicationStatus } from "@/types";

export default function KanbanView() {
  const applications = useApplicationStore((s) => s.applications);
  const loading = useApplicationStore((s) => s.loading);
  const fetchApplications = useApplicationStore((s) => s.fetchApplications);
  const updateStatus = useApplicationStore((s) => s.updateStatus);

  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [confirmDrop, setConfirmDrop] = useState<{
    app: Application;
    newStatus: ApplicationStatus;
  } | null>(null);

  useEffect(() => {
    fetchApplications({ per_page: 100 });
  }, [fetchApplications]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Group applications by status
  const columns = useMemo(
    () => STATUS_ORDER.map((status) => ({
      status,
      items: applications.filter((app) => app.status === status),
    })),
    [applications],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const app = applications.find((a) => a.id === event.active.id);
      setActiveApp(app ?? null);
    },
    [applications],
  );

  const performStatusUpdate = useCallback(
    async (appId: number, newStatus: string) => {
      try {
        await updateStatus(appId, newStatus);
      } catch {
        toast.error(t.toast.errorStatusChange);
      }
    },
    [updateStatus],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveApp(null);
      const { active, over } = event;
      if (!over) return;

      const app = applications.find((a) => a.id === active.id);
      if (!app) return;

      // The over.id is the column status
      const newStatus = over.id as string;
      if (!STATUS_ORDER.includes(newStatus as ApplicationStatus)) return;

      // Confirm if dropping to "rejected"
      if (newStatus === "rejected") {
        setConfirmDrop({ app, newStatus });
        return;
      }

      performStatusUpdate(app.id, newStatus);
    },
    [applications, performStatusUpdate],
  );

  const handleConfirmReject = () => {
    if (confirmDrop) {
      performStatusUpdate(confirmDrop.app.id, confirmDrop.newStatus);
      setConfirmDrop(null);
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="w-72 shrink-0 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(({ status, items }) => (
            <KanbanColumn key={status} status={status} items={items} />
          ))}
        </div>

        <DragOverlay>
          {activeApp ? <KanbanCard application={activeApp} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Rejection confirmation dialog */}
      <Dialog
        open={!!confirmDrop}
        onOpenChange={(v) => !v && setConfirmDrop(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.kanban.confirmRejectTitle}</DialogTitle>
            <DialogDescription>
              {confirmDrop && t.kanban.confirmRejectDescription(confirmDrop.app.title, confirmDrop.app.company)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDrop(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              {t.kanban.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
