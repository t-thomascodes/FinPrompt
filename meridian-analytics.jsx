import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from "recharts";
import {
  AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Database,
  GitFork, Shield, Star, Sparkles, Users, XCircle, Check, Clock,
  BarChart3, Target, Zap, Eye, ChevronDown, ChevronUp
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   SIMULATED DB DATA — Shaped exactly like your Supabase tables.
   Replace with: const { data: logs } = await supabase.from('workflow_logs')...
   ═══════════════════════════════════════════════════════════════════════ */

const categories = [
  { id: "equity-research", label: "Equity Research", icon: "TrendingUp", color: "#16A34A", sort_order: 1 },
  { id: "risk-compliance", label: "Risk & Compliance", icon: "Shield", color: "#D97706", sort_order: 2 },
  { id: "fund-operations", label: "Fund Operations", icon: "Settings", color: "#2563EB", sort_order: 3 },
  { id: "data-analysis", label: "Data Analysis", icon: "BarChart", color: "#7C3AED", sort_order: 4 },
];

const prompts = [
  { id: "bull-bear", category_id: "equity-research", title: "Bull/Bear Case Generator", enrich_ticker: "true" },
  { id: "dcf-val", category_id: "equity-research", title: "DCF Valuation", enrich_ticker: "true" },
  { id: "earnings-preview", category_id: "equity-research", title: "Earnings Preview", enrich_ticker: "true" },
  { id: "risk-scan", category_id: "risk-compliance", title: "Risk Exposure Scan", enrich_ticker: "false" },
  { id: "reg-review", category_id: "risk-compliance", title: "Regulatory Filing Review", enrich_ticker: "true" },
  { id: "nav-recon", category_id: "fund-operations", title: "NAV Reconciliation", enrich_ticker: "false" },
  { id: "trade-break", category_id: "fund-operations", title: "Trade Break Analysis", enrich_ticker: "false" },
  { id: "factor-decomp", category_id: "data-analysis", title: "Factor Decomposition", enrich_ticker: "true" },
  { id: "sector-heat", category_id: "data-analysis", title: "Sector Heatmap", enrich_ticker: "true" },
];

// Generate realistic workflow_logs shaped like your schema
function generateLogs() {
  const tickers = ["AAPL", "MSFT", "NVDA", "TSLA", "JPM", "GS", "META", "AMZN", "GOOG", "BRK.B"];
  const logs = [];
  const now = Date.now();
  const dayMs = 86400000;

  // Generate ~85 logs over the past 30 days
  for (let i = 0; i < 85; i++) {
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const hasData = Math.random() > 0.12;
    const rated = Math.random() > 0.2;
    // Ratings skew based on template — some templates are just better
    let ratingBase = prompt.id === "nav-recon" ? 4.5 : prompt.id === "reg-review" ? 3.2 : prompt.id === "bull-bear" ? 4.3 : 3.8;
    const rating = rated ? Math.max(1, Math.min(5, Math.round(ratingBase + (Math.random() - 0.5) * 2))) : null;

    logs.push({
      id: `log-${String(i).padStart(4, "0")}`,
      prompt_id: prompt.id,
      prompt_title: prompt.title,
      category_id: prompt.category_id,
      inputs: ticker,
      variables: { ticker, timeframe: "1Y" },
      output: `Analysis output for ${ticker}...`,
      market_data: hasData ? `Market data for ${ticker}` : null,
      market_data_structured: hasData ? { ticker, price: (100 + Math.random() * 400).toFixed(2) } : null,
      had_data: hasData,
      rating,
      full_prompt: `Analyze ${ticker}...`,
      created_at: new Date(now - daysAgo * dayMs - Math.random() * dayMs).toISOString(),
      full_prompt_fingerprint: `fp-${prompt.id}-${i}`,
      full_prompt_excerpt: `Analyze ${ticker} with...`,
    });
  }

  return logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

const workflowLogs = generateLogs();

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — Your Meridian palette
   ═══════════════════════════════════════════════════════════════════════ */

const C = {
  bg: "#FAFAF9", surface: "#FFFFFF", border: "#E7E5E4", borderLight: "#F5F5F4",
  text: "#1C1917", textSec: "#78716C", textMuted: "#A8A29E",
  green: "#16A34A", greenBg: "#F0FDF4", amber: "#D97706", amberBg: "#FFFBEB",
  red: "#DC2626", redBg: "#FEF2F2", blue: "#2563EB", blueBg: "#EFF6FF",
  violet: "#7C3AED", accent: "#1C1917",
};
const ff = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', monospace";

/* ═══════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════ */

function KPICard({ label, value, sub, signal, sigColor }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 22px", flex: 1, minWidth: 155 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8, fontFamily: ff }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: C.text, fontFamily: mono, letterSpacing: -1 }}>{value}</span>
        {signal && <span style={{ fontSize: 12, fontWeight: 600, color: sigColor || C.textSec, display: "flex", alignItems: "center", gap: 3, fontFamily: ff }}>{signal}</span>}
      </div>
      <div style={{ fontSize: 12, color: C.textSec, marginTop: 4, fontFamily: ff }}>{sub}</div>
    </div>
  );
}

function SectionLabel({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, marginTop: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.4, fontFamily: ff }}>{children}</div>
      {right}
    </div>
  );
}

function Pill({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, fontWeight: 500, padding: "5px 14px", borderRadius: 6,
      border: `1px solid ${active ? (color || C.accent) : C.border}`,
      background: active ? (color || C.accent) : C.surface,
      color: active ? "#fff" : C.textSec, cursor: "pointer", fontFamily: ff, transition: "all 0.15s",
    }}>{children}</button>
  );
}

function StatusDot({ color }) {
  return <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function Stars({ rating, size = 12 }) {
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= rating ? "#F59E0B" : "none"} color={i <= rating ? "#F59E0B" : "#D6D3D1"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function PBar({ value, max = 100, color = C.green, h = 5 }) {
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: C.borderLight, overflow: "hidden" }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", borderRadius: h, background: color, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Badge({ children, color = C.textSec, bg }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: bg || (color + "14"), color, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: ff }}>
      {children}
    </span>
  );
}

function CTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", fontFamily: ff }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ fontSize: 11, color: p.color || C.textSec, marginTop: 2 }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
}

function InsightCard({ icon: Icon, iconColor, iconBg, title, body }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={14} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: ff }}>{title}</div>
        <div style={{ fontSize: 11.5, color: C.textSec, marginTop: 3, lineHeight: 1.5, fontFamily: ff }}>{body}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANALYTICS ENGINE — All computed from workflow_logs
   ═══════════════════════════════════════════════════════════════════════ */

function useAnalytics(logs) {
  return useMemo(() => {
    const total = logs.length;
    const rated = logs.filter(l => l.rating !== null);
    const enriched = logs.filter(l => l.had_data);
    const avgRating = rated.length > 0 ? (rated.reduce((s, l) => s + l.rating, 0) / rated.length) : 0;
    const ratingRate = total > 0 ? Math.round((rated.length / total) * 100) : 0;
    const enrichRate = total > 0 ? Math.round((enriched.length / total) * 100) : 0;

    // By category
    const byCat = categories.map(cat => {
      const catLogs = logs.filter(l => l.category_id === cat.id);
      const catRated = catLogs.filter(l => l.rating !== null);
      const catEnriched = catLogs.filter(l => l.had_data);
      return {
        ...cat,
        runs: catLogs.length,
        avgRating: catRated.length > 0 ? (catRated.reduce((s, l) => s + l.rating, 0) / catRated.length) : null,
        enrichRate: catLogs.length > 0 ? Math.round((catEnriched.length / catLogs.length) * 100) : 0,
        ratingRate: catLogs.length > 0 ? Math.round((catRated.length / catLogs.length) * 100) : 0,
      };
    }).sort((a, b) => b.runs - a.runs);

    // By template
    const templateMap = {};
    logs.forEach(l => {
      if (!templateMap[l.prompt_id]) {
        const p = prompts.find(p => p.id === l.prompt_id);
        const cat = categories.find(c => c.id === l.category_id);
        templateMap[l.prompt_id] = { id: l.prompt_id, title: l.prompt_title, category: cat?.label || "", catColor: cat?.color || C.textMuted, runs: 0, ratings: [], enriched: 0 };
      }
      templateMap[l.prompt_id].runs++;
      if (l.rating !== null) templateMap[l.prompt_id].ratings.push(l.rating);
      if (l.had_data) templateMap[l.prompt_id].enriched++;
    });
    const byTemplate = Object.values(templateMap).map(t => ({
      ...t,
      avgRating: t.ratings.length > 0 ? (t.ratings.reduce((a, b) => a + b, 0) / t.ratings.length) : null,
      passRate: t.ratings.length > 0 ? Math.round((t.ratings.filter(r => r >= 4).length / t.ratings.length) * 100) : null,
      enrichRate: t.runs > 0 ? Math.round((t.enriched / t.runs) * 100) : 0,
      ratedCount: t.ratings.length,
    })).sort((a, b) => b.runs - a.runs);

    // Quality distribution
    const qualDist = [1, 2, 3, 4, 5].map(r => ({
      label: `${r}\u2605`,
      count: rated.filter(l => l.rating === r).length,
    }));

    // Timeline — daily runs for last 30 days
    const timeline = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayLogs = logs.filter(l => l.created_at.split("T")[0] === dateStr);
      timeline.push({ date: dayLabel, runs: dayLogs.length });
    }

    // Top tickers
    const tickerMap = {};
    logs.forEach(l => {
      const t = l.inputs || "Unknown";
      tickerMap[t] = (tickerMap[t] || 0) + 1;
    });
    const topTickers = Object.entries(tickerMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([ticker, count]) => ({ ticker, count }));

    // Dynamic insights
    const insights = [];
    const bestTemplate = byTemplate.filter(t => t.ratings.length >= 3).sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))[0];
    const worstTemplate = byTemplate.filter(t => t.ratings.length >= 3).sort((a, b) => (a.avgRating || 0) - (b.avgRating || 0))[0];
    const lowestAdoption = byCat.filter(c => c.runs > 0).sort((a, b) => a.runs - b.runs)[0];
    const lowEnrichment = byTemplate.filter(t => t.runs >= 3 && t.enrichRate < 80).sort((a, b) => a.enrichRate - b.enrichRate)[0];

    if (bestTemplate) {
      insights.push({
        icon: Sparkles, iconColor: C.green, iconBg: C.greenBg,
        title: `${bestTemplate.title} is your top performer`,
        body: `${bestTemplate.avgRating.toFixed(1)} avg rating across ${bestTemplate.ratedCount} rated runs with a ${bestTemplate.passRate}% pass rate. Consider using its prompt structure as the model for other templates.`,
      });
    }
    if (worstTemplate && worstTemplate.id !== bestTemplate?.id) {
      insights.push({
        icon: AlertTriangle, iconColor: C.amber, iconBg: C.amberBg,
        title: `${worstTemplate.title} has room to improve`,
        body: `${worstTemplate.avgRating.toFixed(1)} avg rating across ${worstTemplate.ratedCount} rated runs. ${worstTemplate.passRate !== null ? `Only ${worstTemplate.passRate}% of outputs passed (\u22654\u2605).` : ""} Review its prompt structure.`,
      });
    }
    if (lowestAdoption && byCat.length > 1) {
      insights.push({
        icon: Users, iconColor: C.blue, iconBg: C.blueBg,
        title: `${lowestAdoption.label} has the lowest adoption`,
        body: `${lowestAdoption.runs} total runs vs ${byCat[0].runs} for ${byCat[0].label}. This team may need an enablement session or more relevant templates.`,
      });
    }
    if (lowEnrichment) {
      insights.push({
        icon: Database, iconColor: C.red, iconBg: C.redBg,
        title: `${lowEnrichment.title} has low data enrichment`,
        body: `Only ${lowEnrichment.enrichRate}% of runs had market data attached. Outputs without live data may be less reliable for investment decisions.`,
      });
    }

    // Week-over-week change
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const thisWeek = logs.filter(l => new Date(l.created_at) >= thisWeekStart).length;
    const lastWeek = logs.filter(l => new Date(l.created_at) >= lastWeekStart && new Date(l.created_at) < thisWeekStart).length;
    const wowChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

    return { total, avgRating, ratingRate, enrichRate, byCat, byTemplate, qualDist, timeline, topTickers, insights, thisWeek, wowChange };
  }, [logs]);
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function MeridianAnalytics() {
  const [tab, setTab] = useState("overview");
  const [sortCol, setSortCol] = useState("runs");
  const [sortDir, setSortDir] = useState("desc");
  const [logLimit, setLogLimit] = useState(15);

  const a = useAnalytics(workflowLogs);

  const sortedTemplates = useMemo(() => {
    return [...a.byTemplate].sort((x, y) => {
      const av = x[sortCol] ?? -1;
      const bv = y[sortCol] ?? -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [a.byTemplate, sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const thBase = { fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, padding: "10px 12px", textAlign: "left", borderBottom: `1px solid ${C.border}`, fontFamily: ff };

  const SH = ({ col, children, w, align }) => (
    <th onClick={() => toggleSort(col)} style={{
      ...thBase, width: w, cursor: "pointer", userSelect: "none", textAlign: align || "left",
      background: sortCol === col ? C.borderLight : "transparent",
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        {children}
        {sortCol === col ? (sortDir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />) : null}
      </span>
    </th>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "templates", label: "Template Effectiveness", icon: Target },
    { id: "log", label: "Activity Log", icon: Clock },
  ];

  /* ─── OVERVIEW ──────────────────────────────────────────────────── */
  const renderOverview = () => (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Total Runs" value={a.total}
          sub="all workflows"
          signal={a.wowChange !== null ? <>{a.wowChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {a.wowChange >= 0 ? "+" : ""}{a.wowChange}% WoW</> : null}
          sigColor={a.wowChange >= 0 ? C.green : C.red} />
        <KPICard label="Avg Rating" value={a.avgRating.toFixed(1)}
          sub={`across ${workflowLogs.filter(l => l.rating !== null).length} rated outputs`} />
        <KPICard label="Data Enriched" value={`${a.enrichRate}%`}
          sub="of runs had live market data"
          signal={a.enrichRate >= 85 ? "Healthy" : "Below target"} sigColor={a.enrichRate >= 85 ? C.green : C.amber} />
        <KPICard label="Rating Rate" value={`${a.ratingRate}%`}
          sub="of outputs received a rating"
          signal={a.ratingRate >= 70 ? "Good engagement" : "Needs attention"} sigColor={a.ratingRate >= 70 ? C.green : C.amber} />
      </div>

      {/* Dynamic insights */}
      {a.insights.length > 0 && (
        <>
          <SectionLabel>Operational Insights</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: a.insights.length > 2 ? "1fr 1fr" : "1fr", gap: 10 }}>
            {a.insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
          </div>
        </>
      )}

      {/* By Category */}
      <SectionLabel>By Category</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        {a.byCat.map((cat, i) => (
          <div key={cat.id} style={{
            padding: "14px 18px", display: "flex", alignItems: "center", gap: 16,
            borderBottom: i < a.byCat.length - 1 ? `1px solid ${C.borderLight}` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <StatusDot color={cat.color} />
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text, fontFamily: ff }}>{cat.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
              <div style={{ textAlign: "right", minWidth: 60 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: mono }}>{cat.runs}</div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: ff }}>runs</div>
              </div>
              <div style={{ textAlign: "right", minWidth: 50 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: cat.avgRating !== null ? C.text : C.textMuted, fontFamily: mono }}>
                  {cat.avgRating !== null ? cat.avgRating.toFixed(1) : "\u2014"}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: ff }}>avg</div>
              </div>
              <div style={{ width: 100 }}>
                <PBar value={cat.enrichRate} color={cat.color} h={4} />
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: ff, marginTop: 3 }}>{cat.enrichRate}% enriched</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Run Timeline */}
      <SectionLabel>Output Volume — Last 30 Days</SectionLabel>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 16px 12px" }}>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={a.timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textMuted, fontFamily: ff }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: C.textMuted, fontFamily: ff }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
            <Tooltip content={<CTooltip />} />
            <Area type="monotone" dataKey="runs" stroke={C.accent} fill={C.accent} fillOpacity={0.06} strokeWidth={2} dot={false} name="Runs" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quality + Tickers side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 32 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 14, fontFamily: ff }}>Quality Distribution</div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 12px 8px" }}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={a.qualDist} barCategoryGap="28%">
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.textMuted, fontFamily: ff }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.textMuted, fontFamily: ff }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                <Tooltip content={<CTooltip />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Outputs">
                  {a.qualDist.map((_, i) => <Cell key={i} fill={i >= 3 ? C.green : i >= 2 ? C.amber : C.red} fillOpacity={0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 14, fontFamily: ff }}>Most Analyzed Tickers</div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {a.topTickers.map((t, i) => (
              <div key={t.ticker} style={{
                padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: i < a.topTickers.length - 1 ? `1px solid ${C.borderLight}` : "none",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: mono, color: C.text }}>{t.ticker}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <PBar value={t.count} max={a.topTickers[0].count} color={C.accent} h={3} />
                  <span style={{ fontSize: 12, color: C.textSec, fontFamily: mono, minWidth: 24, textAlign: "right" }}>{t.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  /* ─── TEMPLATE EFFECTIVENESS ────────────────────────────────────── */
  const renderTemplates = () => (
    <>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ff, minWidth: 720 }}>
          <thead><tr>
            <th style={{ ...thBase, width: 200 }}>Template</th>
            <SH col="runs" w={65}>Runs</SH>
            <SH col="passRate" w={100}>Pass Rate</SH>
            <SH col="avgRating" w={90}>Avg Rating</SH>
            <SH col="ratedCount" w={80}>Rated</SH>
            <SH col="enrichRate" w={110}>Data Enriched</SH>
          </tr></thead>
          <tbody>
            {sortedTemplates.map((t, i) => {
              const pc = t.passRate === null ? C.textMuted : t.passRate >= 80 ? C.green : t.passRate >= 60 ? C.amber : C.red;
              return (
                <tr key={t.id} style={{ borderBottom: i < sortedTemplates.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: t.catColor }} />
                      {t.category}
                    </div>
                  </td>
                  <td style={{ padding: 12, fontSize: 14, fontWeight: 600, fontFamily: mono, color: C.text }}>{t.runs}</td>
                  <td style={{ padding: 12 }}>
                    {t.passRate !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <PBar value={t.passRate} color={pc} h={4} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: pc, fontFamily: mono, minWidth: 35 }}>{t.passRate}%</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: C.textMuted }}>\u2014 no ratings</span>
                    )}
                  </td>
                  <td style={{ padding: 12 }}>
                    {t.avgRating !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Stars rating={Math.round(t.avgRating)} size={11} />
                        <span style={{ fontSize: 12, fontFamily: mono, color: C.textSec }}>{t.avgRating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: C.textMuted }}>\u2014</span>
                    )}
                  </td>
                  <td style={{ padding: 12, fontSize: 12, fontFamily: mono, color: C.textSec }}>
                    {t.ratedCount}/{t.runs}
                    <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 4 }}>({t.runs > 0 ? Math.round((t.ratedCount / t.runs) * 100) : 0}%)</span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <PBar value={t.enrichRate} color={t.enrichRate >= 85 ? C.green : C.amber} h={4} />
                      <span style={{ fontSize: 11, fontFamily: mono, color: C.textMuted, minWidth: 30 }}>{t.enrichRate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, padding: "12px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11.5, color: C.textSec, lineHeight: 1.5, fontFamily: ff }}>
        <strong style={{ color: C.text }}>How to read this:</strong> Pass Rate = % of rated outputs that scored \u22654\u2605. Rated = how many runs received a quality rating (unrated runs are excluded from quality calculations). Data Enriched = % of runs where live market data was successfully attached.
      </div>
    </>
  );

  /* ─── ACTIVITY LOG ──────────────────────────────────────────────── */
  const renderLog = () => {
    const visibleLogs = workflowLogs.slice(0, logLimit);
    return (
      <>
        <div style={{ padding: "12px 16px", background: C.blueBg, border: `1px solid ${C.blue}22`, borderRadius: 8, fontSize: 12, color: C.text, lineHeight: 1.5, fontFamily: ff, marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Shield size={15} color={C.blue} style={{ flexShrink: 0, marginTop: 2 }} />
          <div><strong>Audit Trail</strong> \u2014 Every AI-generated output is logged with the template used, data inputs, whether market data was available, the user's quality rating, and timestamp. This log supports compliance review and output traceability.</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ff, minWidth: 700 }}>
            <thead><tr>
              {["Time", "Template", "Ticker", "Data", "Rating", ""].map((h, i) => (
                <th key={i} style={{ ...thBase, textAlign: h === "Data" || h === "Rating" ? "center" : "left", width: h === "Time" ? 160 : h === "Data" ? 60 : h === "Rating" ? 100 : h === "" ? 60 : undefined }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {visibleLogs.map((l, i) => {
                const cat = categories.find(c => c.id === l.category_id);
                const ts = new Date(l.created_at);
                const timeStr = ts.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " \u00B7 " + ts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <tr key={l.id} style={{ borderBottom: i < visibleLogs.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 12, color: C.textSec, fontFamily: ff }}>{timeStr}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text }}>{l.prompt_title}</div>
                      <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 3, background: cat?.color || C.textMuted }} />
                        {cat?.label}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12.5, fontWeight: 600, fontFamily: mono, color: C.text }}>{l.inputs}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {l.had_data
                        ? <Badge color={C.green} bg={C.greenBg}>Yes</Badge>
                        : <Badge color={C.red} bg={C.redBg}>No</Badge>}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {l.rating !== null ? <Stars rating={l.rating} size={11} /> : <span style={{ fontSize: 11, color: C.textMuted }}>\u2014</span>}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <Eye size={13} color={C.textMuted} style={{ cursor: "pointer" }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {logLimit < workflowLogs.length && (
          <button onClick={() => setLogLimit(l => l + 20)} style={{
            display: "block", margin: "12px auto 0", fontSize: 12, fontWeight: 500, color: C.blue,
            background: "none", border: "none", cursor: "pointer", fontFamily: ff, padding: "8px 16px",
          }}>
            Show more ({workflowLogs.length - logLimit} remaining)
          </button>
        )}
      </>
    );
  };

  /* ─── SHELL ─────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: ff, background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: ff }}>F</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>Meridian</div>
            <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: 0.3, textTransform: "uppercase" }}>AI Workflow Layer for Asset Management</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["Workflows", "Logs", "By workflow", "Analytics"].map(n => (
            <div key={n} style={{
              fontSize: 13, fontWeight: n === "Analytics" ? 600 : 400, color: n === "Analytics" ? C.text : C.textSec,
              padding: "6px 14px", borderRadius: 6, cursor: "pointer", background: n === "Analytics" ? C.borderLight : "transparent",
            }}>{n}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 28px 60px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.5 }}>Analytics</h2>
        <p style={{ fontSize: 13, color: C.textSec, margin: "4px 0 0" }}>
          Track adoption, output quality, and data enrichment across workflows.
        </p>

        <div style={{ display: "flex", gap: 2, marginTop: 20, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400, padding: "8px 18px",
              color: tab === t.id ? C.text : C.textSec, background: "transparent",
              border: "none", borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
              cursor: "pointer", fontFamily: ff, marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "overview" && renderOverview()}
        {tab === "templates" && renderTemplates()}
        {tab === "log" && renderLog()}
      </div>
    </div>
  );
}
