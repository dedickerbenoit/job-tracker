import { useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Briefcase, MessageSquare, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationStore } from "@/stores/applicationStore";
import { STATUS_CONFIG, CHART_COLORS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { ApplicationStatus, ApplicationSource } from "@/types";

export default function StatsView() {
  const stats = useApplicationStore((s) => s.stats);
  const statsLoading = useApplicationStore((s) => s.statsLoading);
  const fetchStats = useApplicationStore((s) => s.fetchStats);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (statsLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-2 h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare chart data
  const statusData = Object.entries(stats.by_status)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status as ApplicationStatus]?.label ?? status,
      value: count,
      color: CHART_COLORS.status[status as ApplicationStatus],
    }));

  const sourceData = Object.entries(stats.by_source)
    .filter(([_, count]) => count > 0)
    .map(([source, count]) => ({
      name: source.charAt(0).toUpperCase() + source.slice(1),
      value: count,
      color: CHART_COLORS.source[source as ApplicationSource],
    }));

  // Metric calculations
  const interviewCount = stats.by_status.interview ?? 0;
  const activePipeline =
    (stats.by_status.applied ?? 0) +
    (stats.by_status.follow_up ?? 0) +
    interviewCount +
    (stats.by_status.offer ?? 0);
  const appliedAndBeyond = activePipeline + (stats.by_status.rejected ?? 0);
  const responseRate =
    appliedAndBeyond > 0
      ? Math.round(
          ((interviewCount + (stats.by_status.offer ?? 0)) / appliedAndBeyond) *
            100,
        )
      : 0;

  const metrics = [
    {
      label: t.stats.totalApplications,
      value: stats.total,
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      label: t.stats.activePipeline,
      value: activePipeline,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: t.stats.ongoingInterviews,
      value: interviewCount,
      icon: MessageSquare,
      color: "text-purple-600",
    },
    {
      label: t.stats.responseRate,
      value: `${responseRate}%`,
      icon: Percent,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {m.label}
              </CardTitle>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.stats.byStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                {t.common.noData}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={(props: { name?: string; percent?: number }) =>
                      `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Source bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.stats.bySource}</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                {t.common.noData}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name={t.stats.applications}>
                    {sourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
