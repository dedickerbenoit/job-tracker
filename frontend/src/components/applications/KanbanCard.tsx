import { memo, useState, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRightLeft,
  ExternalLink,
  StickyNote,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "@/components/applications/SourceBadge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useApplicationStore } from "@/stores/applicationStore";
import { STATUS_CONFIG, STATUS_ORDER } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { toast } from "sonner";
import type { Application, ApplicationStatus } from "@/types";

interface KanbanCardProps {
  application: Application;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const KanbanCard = memo(function KanbanCard({
  application,
  isDragging = false,
  onEdit,
  onDelete,
}: KanbanCardProps) {
  const setSelectedApplication = useApplicationStore(
    (s) => s.setSelectedApplication,
  );
  const updateApplication = useApplicationStore((s) => s.updateApplication);
  const updateStatus = useApplicationStore((s) => s.updateStatus);

  const [isHovered, setIsHovered] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const handleStatusChange = useCallback(
    async (newStatus: ApplicationStatus) => {
      try {
        await updateStatus(application.id, newStatus);
      } catch {
        toast.error(t.toast.errorStatusChange);
      }
    },
    [application.id, updateStatus],
  );

  const handleSaveNote = useCallback(async () => {
    if (!noteValue.trim() || savingNote) return;
    setSavingNote(true);
    const existingNotes = application.notes ?? "";
    const separator = existingNotes ? "\n" : "";
    const newNotes = existingNotes + separator + noteValue.trim();
    try {
      await updateApplication(application.id, { notes: newNotes });
      toast.success(t.quickActions.noteSaved);
      setNoteValue("");
      setShowNoteInput(false);
    } catch {
      toast.error(t.toast.errorUpdating);
    } finally {
      setSavingNote(false);
    }
  }, [
    application.id,
    application.notes,
    noteValue,
    savingNote,
    updateApplication,
  ]);

  const isFollowUp = application.status === "follow_up";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!noteValue.trim()) setShowNoteInput(false);
      }}
    >
      <Card
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        role="button"
        tabIndex={0}
        onClick={() => !isDragging && setSelectedApplication(application)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isDragging)
            setSelectedApplication(application);
        }}
        className={cn(
          "relative cursor-grab space-y-1 p-3 transition-shadow hover:shadow-md active:cursor-grabbing",
          isDragging && "rotate-2 shadow-lg opacity-90",
        )}
      >
        {/* Title */}
        <div className="text-sm font-semibold leading-tight">
          {application.title}
        </div>

        {/* Company + follow_up badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {application.company}
          </span>
          {isFollowUp && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-medium text-amber-700">
              {t.kanban.followUpBadge}
            </span>
          )}
        </div>

        {/* Source + date (discreet) */}
        <div className="flex items-center justify-between pt-0.5 opacity-70">
          <SourceBadge source={application.source} />
          <span className="text-[0.6rem] text-muted-foreground">
            {formatDistanceToNow(new Date(application.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>

        {/* Quick actions overlay (hover) */}
        {isHovered && !isDragging && (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 rounded-b-lg bg-background/90 px-2 py-1.5 backdrop-blur-sm"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <TooltipProvider delay={300}>
              {/* Change status */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-xs" />}
                      />
                    }
                  >
                    <ArrowRightLeft className="size-3" />
                  </TooltipTrigger>
                  <TooltipContent>{t.quickActions.changeStatus}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" side="top" sideOffset={4}>
                  {STATUS_ORDER.filter((s) => s !== application.status).map(
                    (s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => handleStatusChange(s)}
                      >
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            STATUS_CONFIG[s].bgColor,
                          )}
                        />
                        {STATUS_CONFIG[s].label}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Open link */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        if (/^https?:\/\//i.test(application.url)) {
                          window.open(
                            application.url,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }
                      }}
                    />
                  }
                >
                  <ExternalLink className="size-3" />
                </TooltipTrigger>
                <TooltipContent>{t.quickActions.openLink}</TooltipContent>
              </Tooltip>

              {/* Quick note */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowNoteInput((v) => !v)}
                    />
                  }
                >
                  <StickyNote className="size-3" />
                </TooltipTrigger>
                <TooltipContent>{t.quickActions.addNote}</TooltipContent>
              </Tooltip>

              {/* Edit */}
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-xs" onClick={onEdit} />
                    }
                  >
                    <Pencil className="size-3" />
                  </TooltipTrigger>
                  <TooltipContent>{t.quickActions.edit}</TooltipContent>
                </Tooltip>
              )}

              {/* Delete */}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-red-400"
                        onClick={onDelete}
                      />
                    }
                  >
                    <Trash2 className="size-3" />
                  </TooltipTrigger>
                  <TooltipContent>{t.quickActions.delete}</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        )}
      </Card>

      {/* Inline note input */}
      {showNoteInput && (
        <div
          className="mt-1 px-1"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-primary disabled:opacity-50"
            placeholder={t.quickActions.notePlaceholder}
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNote();
              if (e.key === "Escape") {
                setNoteValue("");
                setShowNoteInput(false);
              }
            }}
            disabled={savingNote}
            autoFocus
          />
        </div>
      )}
    </div>
  );
});
