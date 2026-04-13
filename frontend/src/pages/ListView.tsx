import { useEffect, useState, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Pencil,
  Trash2,
  Eye,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { SourceBadge } from "@/components/applications/SourceBadge";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { DeleteConfirmModal } from "@/components/applications/DeleteConfirmModal";
import { useApplicationStore } from "@/stores/applicationStore";
import { useDebounce } from "@/hooks/useDebounce";
import { STATUS_CONFIG, SOURCE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type {
  Application,
  ApplicationFilters,
  ApplicationStatus,
  ApplicationSource,
} from "@/types";

const SORTABLE_COLUMNS = [
  { key: "title", label: t.list.columns.title },
  { key: "company", label: t.list.columns.company },
  { key: "status", label: t.list.columns.status },
  { key: "created_at", label: t.list.columns.date },
] as const;

function SortIcon({
  column,
  sort,
  direction,
}: {
  column: string;
  sort?: string;
  direction?: string;
}) {
  if (sort !== column) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return direction === "asc" ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
}

export default function ListView() {
  const applications = useApplicationStore((s) => s.applications);
  const pagination = useApplicationStore((s) => s.pagination);
  const loading = useApplicationStore((s) => s.loading);
  const fetchApplications = useApplicationStore((s) => s.fetchApplications);
  const setSelectedApplication = useApplicationStore(
    (s) => s.setSelectedApplication,
  );

  const [filters, setFilters] = useState<ApplicationFilters>({
    sort: "created_at",
    direction: "desc",
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const isInitialMount = useRef(true);

  const [editApp, setEditApp] = useState<Application | null>(null);
  const [deleteApp, setDeleteApp] = useState<Application | null>(null);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const doFetch = useCallback(
    (overrides?: Partial<ApplicationFilters>) => {
      const merged = { ...filtersRef.current, ...overrides };
      setFilters(merged);
      fetchApplications(merged);
    },
    [fetchApplications],
  );

  // Initial fetch
  useEffect(() => {
    fetchApplications(filters);
  }, [fetchApplications]); // only once on mount

  // Search debounce — skip initial mount to avoid double-fetch
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    doFetch({ search: debouncedSearch || undefined, page: 1 });
  }, [debouncedSearch, doFetch]);

  const handleSort = (key: string) => {
    const newDirection =
      filters.sort === key && filters.direction === "asc" ? "desc" : "asc";
    doFetch({ sort: key, direction: newDirection, page: 1 });
  };

  const handlePageChange = (page: number) => {
    doFetch({ page });
  };

  const handleReset = () => {
    setSearchInput("");
    const reset: ApplicationFilters = {
      sort: "created_at",
      direction: "desc",
      page: 1,
    };
    setFilters(reset);
    fetchApplications(reset);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t.search.searchPlaceholder}
          className="w-52"
        />

        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            doFetch({
              status: v === "all" ? undefined : (v as ApplicationStatus),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-40">
            <span>
              {filters.status
                ? STATUS_CONFIG[filters.status]?.label
                : t.status.allStatuses}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.status.allStatuses}</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.source ?? "all"}
          onValueChange={(v) =>
            doFetch({
              source: v === "all" ? undefined : (v as ApplicationSource),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-40">
            <span>
              {filters.source
                ? SOURCE_CONFIG[filters.source]?.label
                : t.source.allSources}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.source.allSources}</SelectItem>
            {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-1 h-4 w-4" />
          {t.common.reset}
        </Button>

        {pagination && (
          <span className="ml-auto text-sm text-muted-foreground">
            {pagination.total}{" "}
            {pagination.total > 1
              ? t.application.plural
              : t.application.singular}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer px-4 py-2.5 text-left font-medium select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon
                      column={col.key}
                      sort={filters.sort}
                      direction={filters.direction}
                    />
                  </span>
                </th>
              ))}
              <th className="px-4 py-2.5 text-left font-medium">
                {t.list.columns.location}
              </th>
              <th className="px-4 py-2.5 text-left font-medium">
                {t.list.columns.source}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">
                {t.common.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && applications.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : applications.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {t.application.noneFound}
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => setSelectedApplication(app)}
                  className={cn(
                    "cursor-pointer border-b transition-colors hover:bg-muted/50",
                    loading && "opacity-60",
                  )}
                >
                  <td className="px-4 py-3 font-medium">{app.title}</td>
                  <td className="px-4 py-3">{app.company}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(app.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.location}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={app.source} />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t.list.viewDetail}
                        onClick={() => setSelectedApplication(app)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t.common.edit}
                        onClick={() => setEditApp(app)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t.common.delete}
                        onClick={() => setDeleteApp(app)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.current_page <= 1}
            onClick={() => handlePageChange(pagination.current_page - 1)}
          >
            {t.common.previous}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t.common.page} {pagination.current_page} / {pagination.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() => handlePageChange(pagination.current_page + 1)}
          >
            {t.common.next}
          </Button>
        </div>
      )}

      {/* Edit modal */}
      {editApp && (
        <ApplicationModal
          open={!!editApp}
          onClose={() => setEditApp(null)}
          application={editApp}
        />
      )}

      {/* Delete modal */}
      {deleteApp && (
        <DeleteConfirmModal
          open={!!deleteApp}
          onClose={() => setDeleteApp(null)}
          application={deleteApp}
        />
      )}
    </div>
  );
}
