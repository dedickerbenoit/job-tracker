import { useEffect, useState } from "react";
import {
  ExternalLink,
  Pencil,
  Trash2,
  MapPin,
  Building2,
  Calendar,
  StickyNote,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { SourceBadge } from "@/components/applications/SourceBadge";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { DeleteConfirmModal } from "@/components/applications/DeleteConfirmModal";
import { useApplicationStore } from "@/stores/applicationStore";
import { applicationApi } from "@/services/api";
import { t } from "@/lib/i18n";
import type { Application, ApplicationEvent } from "@/types";
import { EVENT_TYPE_CONFIG } from "@/lib/constants";

interface ApplicationDetailModalProps {
  application: Application;
  open: boolean;
  onClose: () => void;
}

export function ApplicationDetailModal({
  application,
  open,
  onClose,
}: ApplicationDetailModalProps) {
  const [fullApp, setFullApp] = useState<Application | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const fetchApplication = useApplicationStore((s) => s.fetchApplication);

  useEffect(() => {
    if (!open || !application.id) return;
    setLoadingDetail(true);

    Promise.all([
      fetchApplication(application.id),
      applicationApi.timeline({ application_id: application.id, per_page: 20 }),
    ])
      .then(([app, timeline]) => {
        setFullApp(app);
        setEvents(timeline.data);
      })
      .finally(() => setLoadingDetail(false));
  }, [open, application.id, fetchApplication]);

  const displayApp = fullApp ?? application;
  const safeUrl = /^https?:\/\//i.test(displayApp.url) ? displayApp.url : '#';
  return (
    <>
      <Dialog
        open={open && !editModalOpen && !deleteModalOpen}
        onOpenChange={(v) => !v && onClose()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">
                  {displayApp.title}
                </DialogTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={displayApp.status} />
                  <SourceBadge source={displayApp.source} />
                </div>
              </div>
            </div>
          </DialogHeader>

          {loadingDetail ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info grid */}
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{displayApp.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{displayApp.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-primary underline-offset-4 hover:underline"
                  >
                    {safeUrl}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t.application.addedAgo}{" "}
                    {formatDistanceToNow(new Date(displayApp.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                    {" — "}
                    {format(
                      new Date(displayApp.created_at),
                      "dd/MM/yyyy HH:mm",
                    )}
                  </span>
                </div>
                {displayApp.applied_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {t.application.appliedOn}{" "}
                      {format(new Date(displayApp.applied_at), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {displayApp.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-1 text-sm font-medium">{t.application.description}</h4>
                    <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
                      {displayApp.description}
                    </p>
                  </div>
                </>
              )}

              {/* Notes */}
              {displayApp.notes && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <StickyNote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium">{t.application.notes}</h4>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {displayApp.notes}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Timeline / History */}
              {events.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-2 text-sm font-medium">{t.application.history}</h4>
                    <div className="space-y-2">
                      {events.map((event) => {
                        const cfg = EVENT_TYPE_CONFIG[event.type];
                        return (
                          <div
                            key={event.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="mt-0.5 text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(event.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                            <span className="text-muted-foreground">—</span>
                            <span>
                              <span className="font-medium">{cfg.label}</span>{" "}
                              <span className="text-muted-foreground">
                                {event.description}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(true)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              {t.common.edit}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t.common.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <ApplicationModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        application={fullApp ?? application}
      />

      {/* Delete modal */}
      <DeleteConfirmModal
        application={application}
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          onClose();
        }}
      />
    </>
  );
}
