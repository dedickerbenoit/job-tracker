import { useEffect, useState, useMemo, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { formatDistanceToNow, format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationStore } from "@/stores/applicationStore";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_CONFIG } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { Application, ApplicationEventType } from "@/types";

const EVENT_ICONS: Record<ApplicationEventType, typeof Plus> = {
  created: Plus,
  status_changed: ArrowRightLeft,
  updated: Pencil,
  deleted: Trash2,
};

// Colors sourced from EVENT_TYPE_CONFIG in constants

export default function TimelineView() {
  const timelineEvents = useApplicationStore((s) => s.timelineEvents);
  const timelineLoading = useApplicationStore((s) => s.timelineLoading);
  const timelinePagination = useApplicationStore((s) => s.timelinePagination);
  const fetchTimeline = useApplicationStore((s) => s.fetchTimeline);
  const loadMoreTimeline = useApplicationStore((s) => s.loadMoreTimeline);
  const setSelectedApplication = useApplicationStore(
    (s) => s.setSelectedApplication,
  );
  const applications = useApplicationStore((s) => s.applications);

  const [typeFilter, setTypeFilter] = useState<ApplicationEventType | "all">(
    "all",
  );

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Initial fetch
  useEffect(() => {
    fetchTimeline(typeFilter === "all" ? {} : { type: typeFilter });
  }, [fetchTimeline, typeFilter]);

  // Infinite scroll
  useEffect(() => {
    if (
      inView &&
      !timelineLoading &&
      timelinePagination &&
      timelinePagination.current_page < timelinePagination.last_page
    ) {
      loadMoreTimeline();
    }
  }, [inView, timelineLoading, timelinePagination, loadMoreTimeline]);

  const todayCount = useMemo(
    () => timelineEvents.filter((e) => isToday(new Date(e.created_at))).length,
    [timelineEvents],
  );

  const handleEventClick = useCallback(
    (applicationId: number | null) => {
      if (!applicationId) return;
      const app = applications.find((a) => a.id === applicationId);
      if (app) {
        setSelectedApplication(app);
      } else {
        // App not in store — open modal immediately with a stub so the skeleton shows
        const stub: Application = {
          id: applicationId,
          title: "",
          company: "",
          location: "",
          url: "",
          source: "manual",
          status: "to_apply",
          status_label: "",
          applied_at: null,
          status_changed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSelectedApplication(stub);
      }
    },
    [applications, setSelectedApplication],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t.timeline.title}</h2>
          <p className="text-sm text-muted-foreground">
            {t.timeline.todayActions(todayCount)}
          </p>
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) =>
            setTypeFilter(v as ApplicationEventType | "all")
          }
        >
          <SelectTrigger className="w-44">
            <span>
              {typeFilter === "all"
                ? t.event.allTypes
                : EVENT_TYPE_CONFIG[typeFilter]?.label}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.event.allTypes}</SelectItem>
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {timelineLoading && timelineEvents.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : timelineEvents.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {t.application.noEvent}
        </div>
      ) : (
        <div className="relative ml-4">
          {timelineEvents.map((event) => {
            const Icon = EVENT_ICONS[event.type];
            const color = EVENT_TYPE_CONFIG[event.type].color;

            return (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.application_id)}
                className={cn(
                  "relative mb-6 last:mb-0",
                  event.application_id &&
                    "cursor-pointer hover:bg-muted/50 -ml-6 pl-6 rounded-md py-2 pr-2",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                      color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{event.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                      {" — "}
                      {format(new Date(event.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load more sentinel */}
          <div ref={loadMoreRef} className="h-4" />
          {timelineLoading && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {t.common.loading}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
