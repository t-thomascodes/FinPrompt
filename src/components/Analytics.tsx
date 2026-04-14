"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMeridian } from "@/context/MeridianContext";
import { normalizeStarRating } from "@/lib/normalizeRating";
import type { Category, WorkflowLog } from "@/lib/types";

const STAR_PATH =
  "M12 2.5l2.91 5.9 6.51.95-4.71 4.59 1.11 6.48L12 17.9 6.18 20.42l1.11-6.48L2.58 9.35l6.51-.95L12 2.5z";

const chartFont = {
  fontSize: 11,
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
};

function isRated(log: WorkflowLog): boolean {
  return normalizeStarRating(log.rating) > 0;
}

function getLogDate(log: WorkflowLog): Date | null {
  if (log.createdAt) {
    const d = new Date(log.createdAt);
    if (Number.isFinite(d.getTime())) return d;
  }
  const d2 = new Date(log.timestamp);
  if (Number.isFinite(d2.getTime())) return d2;
  return null;
}

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function tickerLabel(inputs: string): string {
  const t = inputs.trim();
  if (!t) return "—";
  const first = t.split(",")[0]?.trim().toUpperCase();
  return first && first.length > 0 ? first : "—";
}

function formatActivityTime(log: WorkflowLog): string {
  const d = log.createdAt ? new Date(log.createdAt) : new Date(log.timestamp);
  if (!Number.isFinite(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function StarRow({ value, size = 11 }: { value: number; size?: number }) {
  const v = normalizeStarRating(value);
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${v} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className="shrink-0"
          aria-hidden
        >
          <path
            d={STAR_PATH}
            fill={star <= v ? "#EF9F27" : "none"}
            stroke={star <= v ? "#E38B1F" : "#9CA3AF"}
            strokeWidth={star <= v ? 1 : 1.35}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

type TemplateAgg = {
  id: string;
  title: string;
  categoryId: string;
  categoryLabel: string;
  catColor: string;
  runs: number;
  ratedCount: number;
  ratings: number[];
  enriched: number;
  avgRating: number | null;
  passRate: number | null;
  enrichRate: number;
};

type CategoryAgg = {
  id: string;
  label: string;
  color: string;
  icon: string;
  runs: number;
  avgRating: number | null;
  enrichRate: number;
};

type Insight = {
  key: string;
  icon: string;
  iconWrapClass: string;
  title: string;
  body: string;
};

type AnalyticsModel = {
  total: number;
  ratedOutputs: number;
  avgRating: number;
  avgRatingDisplay: string;
  ratingRatePct: number;
  enrichRatePct: number;
  wowChange: number | null;
  thisWeekRuns: number;
  lastWeekRuns: number;
  byCategory: CategoryAgg[];
  byTemplate: TemplateAgg[];
  qualDist: { label: string; count: number; stars: number }[];
  timeline: { dayLabel: string; runs: number }[];
  topTickers: { ticker: string; count: number }[];
  insights: Insight[];
  activitySorted: WorkflowLog[];
};

function buildAnalytics(logs: WorkflowLog[], categories: Category[]): AnalyticsModel {
  const total = logs.length;
  const ratedLogs = logs.filter(isRated);
  const ratedOutputs = ratedLogs.length;
  const avgRating =
    ratedOutputs > 0
      ? ratedLogs.reduce((s, l) => s + normalizeStarRating(l.rating), 0) / ratedOutputs
      : 0;
  const avgRatingDisplay = ratedOutputs > 0 ? avgRating.toFixed(1) : "—";

  const enrichedCount = logs.filter((l) => l.hadData).length;
  const enrichRatePct = total > 0 ? Math.round((enrichedCount / total) * 100) : 0;
  const ratingRatePct = total > 0 ? Math.round((ratedOutputs / total) * 100) : 0;

  const nowMs = Date.now();
  const thisWeekStart = nowMs - 7 * 86_400_000;
  const lastWeekStart = nowMs - 14 * 86_400_000;
  const thisWeekRuns = logs.filter((l) => {
    const t = getLogDate(l)?.getTime();
    return t != null && t >= thisWeekStart && t <= nowMs;
  }).length;
  const lastWeekRuns = logs.filter((l) => {
    const t = getLogDate(l)?.getTime();
    return t != null && t >= lastWeekStart && t < thisWeekStart;
  }).length;
  const wowChange =
    lastWeekRuns > 0
      ? Math.round(((thisWeekRuns - lastWeekRuns) / lastWeekRuns) * 100)
      : null;

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const byCategory: CategoryAgg[] = categories
    .map((c) => {
      const catLogs = logs.filter((l) => l.categoryId === c.id);
      const cr = catLogs.filter(isRated);
      const ce = catLogs.filter((l) => l.hadData);
      const avgR =
        cr.length > 0
          ? cr.reduce((s, l) => s + normalizeStarRating(l.rating), 0) / cr.length
          : null;
      return {
        id: c.id,
        label: c.label,
        color: c.color,
        icon: c.icon,
        runs: catLogs.length,
        avgRating: avgR,
        enrichRate: catLogs.length > 0 ? Math.round((ce.length / catLogs.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.runs - a.runs);

  const templateMap = new Map<string, TemplateAgg>();
  for (const l of logs) {
    const key = l.promptId || `${l.categoryId}:${l.promptTitle}`;
    const cat = catMap.get(l.categoryId);
    const prev =
      templateMap.get(key) ??
      ({
        id: key,
        title: l.promptTitle,
        categoryId: l.categoryId,
        categoryLabel: cat?.label ?? l.categoryId,
        catColor: cat?.color ?? "#8A8A8A",
        runs: 0,
        ratedCount: 0,
        ratings: [] as number[],
        enriched: 0,
        avgRating: null,
        passRate: null,
        enrichRate: 0,
      } satisfies TemplateAgg);
    prev.runs += 1;
    if (isRated(l)) {
      prev.ratedCount += 1;
      prev.ratings.push(normalizeStarRating(l.rating));
    }
    if (l.hadData) prev.enriched += 1;
    templateMap.set(key, prev);
  }

  const byTemplate: TemplateAgg[] = Array.from(templateMap.values()).map((t) => {
    const avgR =
      t.ratings.length > 0
        ? t.ratings.reduce((a, b) => a + b, 0) / t.ratings.length
        : null;
    const pass =
      t.ratings.length > 0
        ? Math.round(
            (t.ratings.filter((r) => r >= 4).length / t.ratings.length) * 100,
          )
        : null;
    const enrichR = t.runs > 0 ? Math.round((t.enriched / t.runs) * 100) : 0;
    return {
      ...t,
      avgRating: avgR,
      passRate: pass,
      enrichRate: enrichR,
    };
  });

  const qualDist = [1, 2, 3, 4, 5].map((stars) => ({
    label: `${stars}\u2605`,
    stars,
    count: ratedLogs.filter((l) => normalizeStarRating(l.rating) === stars).length,
  }));

  const timeline: { dayLabel: string; runs: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const runs = logs.filter((l) => {
      const ld = getLogDate(l);
      return ld != null && sameLocalCalendarDay(ld, day);
    }).length;
    timeline.push({
      dayLabel: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      runs,
    });
  }

  const tickerCounts = new Map<string, number>();
  for (const l of logs) {
    const k = tickerLabel(l.inputs);
    tickerCounts.set(k, (tickerCounts.get(k) ?? 0) + 1);
  }
  const topTickers = Array.from(tickerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ticker, count]) => ({ ticker, count }));

  const insights: Insight[] = [];
  const withMinRated = byTemplate.filter((t) => t.ratedCount >= 3);
  const best =
    withMinRated.length > 0
      ? [...withMinRated].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))[0]
      : null;
  const worst =
    withMinRated.length > 0
      ? [...withMinRated].sort((a, b) => (a.avgRating ?? 0) - (b.avgRating ?? 0))[0]
      : null;

  if (best) {
    insights.push({
      key: "top",
      icon: "\u2728",
      iconWrapClass: "bg-fp-research-light text-fp-research",
      title: `${best.title} is your top performer`,
      body: `${(best.avgRating ?? 0).toFixed(1)} avg rating across ${best.ratedCount} rated runs${best.passRate != null ? ` with a ${best.passRate}% pass rate (\u22654\u2605)` : ""}. Consider using its prompt structure as a model for other templates.`,
    });
  }
  if (worst && best && worst.id !== best.id) {
    insights.push({
      key: "worst",
      icon: "\u26A0",
      iconWrapClass: "bg-fp-warning-light text-fp-warning",
      title: `${worst.title} has room to improve`,
      body: `${(worst.avgRating ?? 0).toFixed(1)} avg rating across ${worst.ratedCount} rated runs.${worst.passRate != null ? ` Only ${worst.passRate}% of rated outputs scored \u22654\u2605.` : ""} Review its prompt structure and inputs.`,
    });
  }

  if (categories.length > 1 && total > 0) {
    const minRuns = Math.min(...byCategory.map((c) => c.runs));
    const lowCats = byCategory.filter((c) => c.runs === minRuns);
    const lowest = lowCats[0];
    const topCat = byCategory[0];
    if (lowest && topCat && lowest.id !== topCat.id) {
      insights.push({
        key: "adopt",
        icon: "\u25CB",
        iconWrapClass: "bg-fp-operations-light text-fp-operations",
        title: `${lowest.label} has the lowest adoption`,
        body: `${lowest.runs} total runs vs ${topCat.runs} for ${topCat.label}. This workflow area may need enablement or more relevant templates.`,
      });
    }
  }

  const lowEnrichCandidates = byTemplate.filter((t) => t.runs >= 3 && t.enrichRate < 80);
  if (lowEnrichCandidates.length > 0) {
    const lowEnrich = [...lowEnrichCandidates].sort(
      (a, b) => a.enrichRate - b.enrichRate,
    )[0];
    if (lowEnrich) {
      insights.push({
        key: "enrich",
        icon: "\u25BC",
        iconWrapClass: "bg-fp-bear-light text-fp-bear",
        title: `${lowEnrich.title} has low data enrichment`,
        body: `Only ${lowEnrich.enrichRate}% of runs had live market data attached. Outputs without data may be less reliable for investment decisions.`,
      });
    }
  }

  const activitySorted = [...logs].sort((a, b) => {
    const ta = getLogDate(a)?.getTime() ?? 0;
    const tb = getLogDate(b)?.getTime() ?? 0;
    return tb - ta;
  });

  return {
    total,
    ratedOutputs,
    avgRating,
    avgRatingDisplay,
    ratingRatePct,
    enrichRatePct,
    wowChange,
    thisWeekRuns,
    lastWeekRuns,
    byCategory,
    byTemplate,
    qualDist,
    timeline,
    topTickers,
    insights,
    activitySorted,
  };
}

function useAnalytics(logs: WorkflowLog[], categories: Category[]) {
  return useMemo(
    () => buildAnalytics(logs, categories),
    [logs, categories],
  );
}

type SortKey =
  | "title"
  | "runs"
  | "passRate"
  | "avgRating"
  | "ratedCount"
  | "enrichRate";

function StatCard({
  label,
  value,
  sub,
  signal,
  signalClass,
}: {
  label: string;
  value: string;
  sub: string;
  signal?: string;
  signalClass?: string;
}) {
  return (
    <div className="min-w-[140px] flex-1 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary px-4 py-3.5 shadow-fp-card">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
        {label}
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <div className="font-mono text-2xl font-medium text-fp-text-primary">
          {value}
        </div>
        {signal ? (
          <span className={`text-xs font-semibold ${signalClass ?? "text-fp-text-secondary"}`}>
            {signal}
          </span>
        ) : null}
      </div>
      {sub ? (
        <div className="mt-1 text-[11px] text-fp-text-muted">{sub}</div>
      ) : null}
    </div>
  );
}

function ProgressMini({
  value,
  color,
  heightClass = "h-1",
}: {
  value: number;
  color: string;
  heightClass?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-sm bg-black/[0.06] ${heightClass}`}
    >
      <div
        className={`h-full rounded-sm ${heightClass}`}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

function SortChevron({ dir }: { dir: "asc" | "desc" }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className="shrink-0 text-fp-text-muted"
      aria-hidden
    >
      {dir === "desc" ? (
        <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      ) : (
        <path d="M2 6.5L5 3.5L8 6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      )}
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 16v-5M12 8h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="mx-auto text-fp-text-dim"
      aria-hidden
    >
      <path
        d="M2 12C4 8 7.5 5 12 5C16.5 5 20 8 22 12C20 16 16.5 19 12 19C7.5 19 4 16 2 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Analytics() {
  const { logs, categories, dataHydrated, setView, setViewingLog } = useMeridian();
  const a = useAnalytics(logs, categories);

  const [tab, setTab] = useState<"overview" | "templates" | "activity">("overview");
  const [sortCol, setSortCol] = useState<SortKey>("runs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [logLimit, setLogLimit] = useState(15);

  const sortedTemplates = useMemo(() => {
    const rows = [...a.byTemplate];
    rows.sort((x, y) => {
      if (sortCol === "title") {
        const c = x.title.localeCompare(y.title);
        return sortDir === "desc" ? -c : c;
      }
      const get = (t: TemplateAgg): number | null => {
        switch (sortCol) {
          case "runs":
            return t.runs;
          case "passRate":
            return t.passRate;
          case "avgRating":
            return t.avgRating;
          case "ratedCount":
            return t.ratedCount;
          case "enrichRate":
            return t.enrichRate;
          default:
            return t.runs;
        }
      };
      const av = get(x);
      const bv = get(y);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (sortDir === "desc") return bv - av;
      return av - bv;
    });
    return rows;
  }, [a.byTemplate, sortCol, sortDir]);

  const toggleSort = (col: SortKey) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortCol(col);
      setSortDir(col === "title" ? "asc" : "desc");
    }
  };

  const passBarColor = (p: number | null) => {
    if (p === null) return "#8A8A8A";
    if (p >= 80) return "#0F6E56";
    if (p >= 60) return "#BA7517";
    return "#A32D2D";
  };

  const enrichBarColor = (p: number) => (p >= 85 ? "#0F6E56" : "#BA7517");

  const chartAxisTick = {
    ...chartFont,
    fill: "#8A8A8A",
  };

  if (dataHydrated && logs.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <h2 className="m-0 text-base font-bold text-fp-text-primary">Analytics</h2>
        <p className="mb-5 mt-1 text-xs text-fp-text-muted">
          Track adoption, output quality, and data enrichment across workflows.
        </p>
        <div className="mt-16 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface px-6 py-12 text-center shadow-fp-card">
          <div className="mb-3 text-4xl text-fp-text-ghost">{"\u25CA"}</div>
          <p className="text-sm font-medium text-fp-text-secondary">No workflow runs yet</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-fp-text-muted">
            Run a workflow to start building an audit trail. KPIs, charts, and template
            effectiveness metrics will appear here from your live{" "}
            <span className="font-mono">workflow_logs</span> data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <h2 className="m-0 text-base font-bold text-fp-text-primary">Analytics</h2>
      <p className="mb-4 mt-1 text-xs text-fp-text-muted">
        Track adoption, output quality, and data enrichment across workflows.
      </p>

      <div className="mb-6 flex flex-wrap gap-0 border-b-[0.5px] border-fp-border">
        {(
          [
            { id: "overview" as const, label: "Overview" },
            { id: "templates" as const, label: "Template Effectiveness" },
            { id: "activity" as const, label: "Activity Log" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id === "activity") setLogLimit(15);
            }}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-fp-text-primary font-semibold text-fp-text-primary"
                : "border-transparent text-fp-text-muted hover:text-fp-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <StatCard
              label="Total Runs"
              value={String(a.total)}
              sub="All workflows"
              signal={
                a.wowChange !== null
                  ? `${a.wowChange >= 0 ? "+" : ""}${a.wowChange}% WoW`
                  : undefined
              }
              signalClass={
                a.wowChange === null
                  ? undefined
                  : a.wowChange >= 0
                    ? "text-fp-research"
                    : "text-fp-bear"
              }
            />
            <StatCard
              label="Avg Rating"
              value={a.avgRatingDisplay}
              sub={`across ${a.ratedOutputs} rated outputs`}
            />
            <StatCard
              label="Data Enriched"
              value={`${a.enrichRatePct}%`}
              sub="of runs had live market data"
              signal={a.enrichRatePct >= 85 ? "Healthy" : "Below target"}
              signalClass={a.enrichRatePct >= 85 ? "text-fp-research" : "text-fp-warning"}
            />
            <StatCard
              label="Rating Rate"
              value={`${a.ratingRatePct}%`}
              sub="of outputs received a quality rating"
              signal={a.ratingRatePct >= 70 ? "Good engagement" : "Below target"}
              signalClass={a.ratingRatePct >= 70 ? "text-fp-research" : "text-fp-warning"}
            />
          </div>

          {a.insights.length > 0 ? (
            <div className="mb-6">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
                Operational Insights
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {a.insights.map((ins) => (
                  <div
                    key={ins.key}
                    className="flex gap-3 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface px-3.5 py-3 shadow-fp-card"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-fp-btn text-sm ${ins.iconWrapClass}`}
                    >
                      {ins.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-fp-text-primary">
                        {ins.title}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-fp-text-muted">
                        {ins.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
            By Category
          </div>
          <div className="mb-6 overflow-hidden rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface shadow-fp-card">
            {a.byCategory.map((c, i) => (
              <div
                key={c.id}
                className={`flex flex-wrap items-center gap-3 px-3.5 py-3 sm:flex-nowrap ${
                  i < a.byCategory.length - 1 ? "border-b-[0.5px] border-fp-border" : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="text-sm" style={{ color: c.color }}>
                    {c.icon}
                  </span>
                  <span className="text-xs font-semibold text-fp-text-secondary">
                    {c.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-fp-text-primary">
                      {c.runs}
                    </div>
                    <div className="text-[10px] text-fp-text-muted">runs</div>
                  </div>
                  <div className="w-14 text-right">
                    <div
                      className={`font-mono text-sm font-bold ${c.avgRating != null ? "text-fp-data" : "text-fp-text-dim"}`}
                    >
                      {c.avgRating != null ? c.avgRating.toFixed(1) : "\u2014"}
                    </div>
                    <div className="text-[10px] text-fp-text-muted">avg</div>
                  </div>
                  <div className="w-28 shrink-0">
                    <ProgressMini value={c.enrichRate} color={c.color} />
                    <div className="mt-1 text-[10px] text-fp-text-muted">
                      {c.enrichRate}% enriched
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
            Output Volume {"\u2014"} Last 30 Days
          </div>
          <div className="mb-6 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface px-2 pb-2 pt-4 shadow-fp-card">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={a.timeline} margin={{ top: 2, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="dayLabel"
                    tick={chartAxisTick}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={chartAxisTick}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "0.5px solid rgba(0,0,0,0.08)",
                      borderRadius: 8,
                      fontSize: 11,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    labelStyle={{ color: "#1A1A1A", fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="runs"
                    name="Runs"
                    stroke="#1A1A1A"
                    strokeWidth={2}
                    fill="#1A1A1A"
                    fillOpacity={0.06}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
                Quality Distribution
              </div>
              <div className="rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface px-2 pb-2 pt-3 shadow-fp-card">
                <div className="h-[150px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={a.qualDist} barCategoryGap="28%" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={chartAxisTick}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={chartAxisTick}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#FFFFFF",
                          border: "0.5px solid rgba(0,0,0,0.08)",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Bar dataKey="count" name="Outputs" radius={[3, 3, 0, 0]}>
                        {a.qualDist.map((row) => {
                          const fill =
                            row.stars <= 2
                              ? "#A32D2D"
                              : row.stars === 3
                                ? "#BA7517"
                                : "#0F6E56";
                          return <Cell key={row.stars} fill={fill} fillOpacity={0.75} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-fp-text-muted">
                Most Analyzed Tickers
              </div>
              <div className="overflow-hidden rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface shadow-fp-card">
                {a.topTickers.length === 0 ? (
                  <div className="px-3.5 py-6 text-center text-xs text-fp-text-muted">
                    No ticker inputs yet
                  </div>
                ) : (
                  a.topTickers.map((row, i) => {
                    const max = a.topTickers[0]?.count ?? 1;
                    return (
                      <div
                        key={row.ticker}
                        className={`flex items-center gap-3 px-3.5 py-2.5 ${
                          i < a.topTickers.length - 1 ? "border-b-[0.5px] border-fp-border" : ""
                        }`}
                      >
                        <span className="w-16 shrink-0 font-mono text-xs font-semibold text-fp-text-primary">
                          {row.ticker}
                        </span>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <ProgressMini
                              value={(row.count / max) * 100}
                              color="#1A1A1A"
                              heightClass="h-[3px]"
                            />
                          </div>
                          <span className="w-6 shrink-0 text-right font-mono text-xs text-fp-text-muted">
                            {row.count}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {tab === "templates" ? (
        <>
          <div className="overflow-x-auto rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface shadow-fp-card">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-[0.5px] border-fp-border">
                  <th className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSort("title")}
                      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-fp-text-muted ${
                        sortCol === "title" ? "text-fp-text-secondary" : ""
                      }`}
                    >
                      Template
                      {sortCol === "title" ? <SortChevron dir={sortDir} /> : null}
                    </button>
                  </th>
                  {(
                    [
                      ["runs", "Runs"],
                      ["passRate", "Pass Rate"],
                      ["avgRating", "Avg Rating"],
                      ["ratedCount", "Rated"],
                      ["enrichRate", "Data Enriched"],
                    ] as const
                  ).map(([col, label]) => (
                    <th key={col} className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
                          sortCol === col ? "text-fp-text-secondary" : "text-fp-text-muted"
                        }`}
                      >
                        {label}
                        {sortCol === col ? <SortChevron dir={sortDir} /> : null}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTemplates.map((t, i) => (
                  <tr
                    key={t.id}
                    className={
                      i < sortedTemplates.length - 1 ? "border-b-[0.5px] border-fp-border" : ""
                    }
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-fp-text-primary">{t.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-fp-text-muted">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: t.catColor }}
                        />
                        {t.categoryLabel}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-sm font-semibold text-fp-text-primary">
                      {t.runs}
                    </td>
                    <td className="px-3 py-3">
                      {t.passRate !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 shrink-0">
                            <ProgressMini value={t.passRate} color={passBarColor(t.passRate)} />
                          </div>
                          <span
                            className="font-mono text-[11px] font-semibold"
                            style={{ color: passBarColor(t.passRate) }}
                          >
                            {t.passRate}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-fp-text-dim">{"\u2014"} no ratings</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {t.avgRating !== null ? (
                        <div className="flex items-center gap-2">
                          <StarRow value={Math.round(t.avgRating)} size={10} />
                          <span className="font-mono text-[11px] text-fp-text-secondary">
                            {t.avgRating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-fp-text-dim">{"\u2014"}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-fp-text-secondary">
                      {t.ratedCount}/{t.runs}
                      <span className="ml-1 text-[10px] text-fp-text-muted">
                        (
                        {t.runs > 0 ? Math.round((t.ratedCount / t.runs) * 100) : 0}
                        %)
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-28 shrink-0">
                          <ProgressMini
                            value={t.enrichRate}
                            color={enrichBarColor(t.enrichRate)}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-fp-text-muted">
                          {t.enrichRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary px-3.5 py-3 text-[11px] leading-relaxed text-fp-text-muted shadow-fp-card">
            <span className="font-semibold text-fp-text-secondary">How to read this:</span>{" "}
            Pass Rate = % of rated outputs that scored {"\u22654\u2605"}. Rated = how many runs
            received a quality rating (unrated runs are excluded from quality calculations).
            Data Enriched = % of runs where live market data was successfully attached.
          </div>
        </>
      ) : null}

      {tab === "activity" ? (
        <>
          <div className="mb-4 flex gap-3 rounded-fp-card border-[0.5px] border-fp-border bg-fp-operations-light px-3.5 py-3 text-xs leading-relaxed text-fp-text-secondary shadow-fp-card">
            <InfoIcon className="mt-0.5 shrink-0 text-fp-operations" />
            <div>
              <span className="font-semibold text-fp-operations">Audit Trail</span>
              {" \u2014 "}
              Every AI-generated output is logged with the template used, data inputs, whether
              market data was available, the user&apos;s quality rating, and timestamp. This log
              supports compliance review and output traceability.
            </div>
          </div>

          <div className="overflow-x-auto rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface shadow-fp-card">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-[0.5px] border-fp-border">
                  {["Time", "Template", "Ticker", "Data", "Rating", ""].map((h) => (
                    <th
                      key={h || "eye"}
                      className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-fp-text-muted ${
                        h === "Data" || h === "Rating" || h === ""
                          ? "text-center"
                          : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.activitySorted.slice(0, logLimit).map((l, i) => {
                  const cat = categories.find((c) => c.id === l.categoryId);
                  const rated = isRated(l);
                  const visLen = Math.min(logLimit, a.activitySorted.length);
                  return (
                    <tr
                      key={l.id}
                      className={i < visLen - 1 ? "border-b-[0.5px] border-fp-border" : ""}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 text-fp-text-secondary">
                        {formatActivityTime(l)}
                      </td>
                      <td className="max-w-[220px] px-3 py-2.5">
                        <div className="truncate font-medium text-fp-text-primary">
                          {l.promptTitle}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-fp-text-muted">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: cat?.color ?? "#8A8A8A" }}
                          />
                          {cat?.label ?? l.categoryId}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-fp-text-primary">
                        {tickerLabel(l.inputs)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {l.hadData ? (
                          <span className="rounded-fp-badge bg-fp-research-light px-2 py-px text-[9px] font-bold uppercase tracking-wide text-fp-research">
                            Yes
                          </span>
                        ) : (
                          <span className="rounded-fp-badge bg-fp-bear-light px-2 py-px text-[9px] font-bold uppercase tracking-wide text-fp-bear">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {rated ? (
                          <div className="flex justify-center">
                            <StarRow value={normalizeStarRating(l.rating)} size={10} />
                          </div>
                        ) : (
                          <span className="text-fp-text-dim">{"\u2014"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          className="inline-flex rounded-fp-btn p-1 text-fp-text-dim transition-colors hover:bg-fp-surface-secondary hover:text-fp-text-secondary"
                          aria-label="View output"
                          onClick={() => {
                            setViewingLog(l);
                            setView("logs");
                          }}
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {logLimit < a.activitySorted.length ? (
            <button
              type="button"
              className="mx-auto mt-3 block text-xs font-medium text-fp-operations hover:underline"
              onClick={() => setLogLimit((n) => n + 20)}
            >
              Show more ({a.activitySorted.length - logLimit} remaining)
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
