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
import { Eye, EyeOff } from "lucide-react";
import { useApplicationStore } from "@/stores/applicationStore";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { KanbanColumn } from "@/components/applications/KanbanColumn";
import { KanbanCard } from "@/components/applications/KanbanCard";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { DeleteConfirmModal } from "@/components/applications/DeleteConfirmModal";
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
  const [showRejected, setShowRejected] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [deleteApp, setDeleteApp] = useState<Application | null>(null);

  useEffect(() => {
    fetchApplications({ per_page: 100 });
  }, [fetchApplications]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columns = useMemo(
    () =>
      KANBAN_COLUMNS.map((status) => ({
        status,
        items: applications.filter((app) => app.status === status),
      })),
    [applications],
  );

  // Rejected apps separated
  const rejectedApps = useMemo(
    () => applications.filter((app) => app.status === "rejected"),
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
    async (appId: number, newStatus: ApplicationStatus) => {
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

      const newStatus = over.id as ApplicationStatus;
      // Accept kanban columns + rejected (when visible)
      if (!KANBAN_COLUMNS.includes(newStatus) && newStatus !== "rejected")
        return;

      if (app.status === newStatus) return;

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
        {KANBAN_COLUMNS.map((status) => (
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
      {/* Toggle rejected button */}
      <div className="mb-3 flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRejected((v) => !v)}
          className="gap-1.5 text-muted-foreground"
        >
          {showRejected ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {showRejected
            ? t.kanban.hideRejected
            : `${t.kanban.showRejected} (${t.kanban.rejectedCount(rejectedApps.length)})`}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(({ status, items }) => (
            <KanbanColumn
              key={status}
              status={status}
              items={items}
              onEditApp={setEditApp}
              onDeleteApp={setDeleteApp}
            />
          ))}
          {showRejected && (
            <KanbanColumn
              status="rejected"
              items={rejectedApps}
              onEditApp={setEditApp}
              onDeleteApp={setDeleteApp}
            />
          )}
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
              {confirmDrop &&
                t.kanban.confirmRejectDescription(
                  confirmDrop.app.title,
                  confirmDrop.app.company,
                )}
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

      {/* Edit modal (quick action) */}
      <ApplicationModal
        open={!!editApp}
        onClose={() => setEditApp(null)}
        application={editApp ?? undefined}
      />

      {/* Delete modal (quick action) */}
      {deleteApp && (
        <DeleteConfirmModal
          open
          onClose={() => setDeleteApp(null)}
          application={deleteApp}
        />
      )}
    </>
  );
}
