import type {
  ApplicationStatus,
  ApplicationSource,
  ApplicationEventType,
} from "@/types";
import { t } from "@/lib/i18n";

// ── Status configuration ──

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bgColor: string }
> = {
  to_apply: {
    label: t.status.to_apply,
    color: "text-slate-700",
    bgColor: "bg-slate-100",
  },
  applied: {
    label: t.status.applied,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  follow_up: {
    label: t.status.follow_up,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  interview: {
    label: t.status.interview,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  offer: {
    label: t.status.offer,
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  rejected: {
    label: t.status.rejected,
    color: "text-red-400",
    bgColor: "bg-red-50",
  },
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "to_apply",
  "applied",
  "follow_up",
  "interview",
  "offer",
  "rejected",
];

export const KANBAN_COLUMNS: ApplicationStatus[] = [
  "to_apply",
  "applied",
  "follow_up",
  "interview",
  "offer",
];

// ── Source configuration ──

export const SOURCE_CONFIG: Record<
  ApplicationSource,
  { label: string; brandColor?: string }
> = {
  linkedin: {
    label: t.source.linkedin,
    brandColor: "#0A66C2",
  },
  indeed: {
    label: t.source.indeed,
    brandColor: "#2164F3",
  },
  hellowork: {
    label: t.source.hellowork,
    brandColor: "#FF6600",
  },
  manual: {
    label: t.source.manual,
  },
};

// ── Event type configuration ──

export const EVENT_TYPE_CONFIG: Record<
  ApplicationEventType,
  { label: string; icon: string; color: string }
> = {
  created: { label: t.event.created, icon: "Plus", color: "bg-green-500" },
  status_changed: {
    label: t.event.status_changed,
    icon: "ArrowRightLeft",
    color: "bg-blue-500",
  },
  updated: { label: t.event.updated, icon: "Pencil", color: "bg-amber-500" },
  deleted: { label: t.event.deleted, icon: "Trash2", color: "bg-red-500" },
};

// ── Chart colors (matching theme) ──

export const CHART_COLORS = {
  status: {
    to_apply: "#64748b",
    applied: "#3b82f6",
    follow_up: "#f59e0b",
    interview: "#2563eb",
    offer: "#22c55e",
    rejected: "#f87171",
  },
  source: {
    linkedin: "#0a66c2",
    indeed: "#2557a7",
    hellowork: "#ff6600",
    manual: "#6b7280",
  },
} as const;
