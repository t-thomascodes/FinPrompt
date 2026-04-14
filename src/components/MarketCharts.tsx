"use client";

import type { MarketDataBundle } from "@/lib/marketDataTypes";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartFont = {
  fontSize: 11,
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
};

function quarterTick(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  const q = Math.floor((m - 1) / 3) + 1;
  return `Q${q} '${String(y).slice(-2)}`;
}

type Props = {
  bundle: MarketDataBundle;
  workflowId: string;
  accent: string;
};

export function MarketCharts({ bundle, workflowId, accent }: Props) {
  const showRev = workflowId === "bull-bear" || workflowId === "comp-analysis";
  const showEps = workflowId === "earnings-prep";

  const pricePts = bundle.priceHistory.filter((p) => p.close > 0);
  const last = pricePts.length ? pricePts[pricePts.length - 1] : null;
  const target = bundle.trading.targetMean;

  const revRows = [...bundle.quarters]
    .reverse()
    .map((q) => ({
      label: quarterTick(q.periodEnd),
      revenue: q.revenue != null ? q.revenue / 1e9 : null,
    }))
    .filter((r) => r.revenue != null);

  const epsRows = [...bundle.quarters].reverse().map((q) => ({
    label: quarterTick(q.periodEnd),
    actual: q.epsActual,
    estimate: q.epsEstimate,
    beat: q.epsSurprise === "BEAT",
    miss: q.epsSurprise === "MISS",
  }));

  const beatColor = "#0F6E56";
  const missColor = "#A32D2D";
  const estColor = "rgba(100,116,139,0.55)";

  if (!pricePts.length && !((showRev && revRows.length) || (showEps && epsRows.length))) {
    return null;
  }

  return (
    <div className="mb-0 space-y-4">
      {pricePts.length ? (
        <div className="w-full">
          <div className="mb-1.5 font-sans text-[11px] font-semibold text-fp-text-muted">
            1-year price
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pricePts} margin={{ top: 2, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fpPriceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ ...chartFont, fill: "#8A8A8A" }}
                  tickFormatter={(v) => String(v).slice(5)}
                  minTickGap={28}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ ...chartFont, fill: "#8A8A8A" }}
                  width={44}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: chartFont.fontFamily,
                    fontSize: 11,
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  formatter={(val) =>
                    typeof val === "number"
                      ? [`$${val.toFixed(2)}`, "Close"]
                      : ["", ""]
                  }
                  labelFormatter={(l) => l}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={accent}
                  strokeWidth={1.5}
                  fill="url(#fpPriceFill)"
                  dot={false}
                  isAnimationActive={false}
                />
                {target != null && target > 0 ? (
                  <ReferenceLine
                    y={target}
                    stroke={accent}
                    strokeDasharray="5 5"
                    strokeOpacity={0.65}
                  />
                ) : null}
                {last ? (
                  <ReferenceDot
                    x={last.date}
                    y={last.close}
                    r={5}
                    fill={accent}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {target != null ? (
            <div className="mt-1 font-sans text-[10px] text-fp-text-muted">
              Dashed line: analyst mean target ${target.toFixed(2)}
            </div>
          ) : null}
        </div>
      ) : null}

      {showRev && revRows.length ? (
        <div className="w-full">
          <div className="mb-1.5 font-sans text-[11px] font-semibold text-fp-text-muted">
            Quarterly revenue (billions)
          </div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revRows} margin={{ top: 2, right: 8, left: 0, bottom: 2 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ ...chartFont, fill: "#8A8A8A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ ...chartFont, fill: "#8A8A8A" }}
                  width={36}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: chartFont.fontFamily,
                    fontSize: 11,
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  formatter={(val) =>
                    typeof val === "number"
                      ? [`${val.toFixed(3)}B`, "Revenue"]
                      : ["", ""]
                  }
                />
                <Bar dataKey="revenue" fill={accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {showEps && epsRows.some((r) => r.actual != null || r.estimate != null) ? (
        <div className="w-full">
          <div className="mb-1.5 font-sans text-[11px] font-semibold text-fp-text-muted">
            EPS actual vs estimate
          </div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={epsRows} margin={{ top: 2, right: 8, left: 0, bottom: 2 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ ...chartFont, fill: "#8A8A8A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ ...chartFont, fill: "#8A8A8A" }}
                  width={36}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: chartFont.fontFamily,
                    fontSize: 11,
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: chartFont.fontFamily, fontSize: 11 }} />
                <Bar dataKey="estimate" name="Estimate" fill={estColor} isAnimationActive={false} />
                <Bar dataKey="actual" name="Actual" isAnimationActive={false}>
                  {epsRows.map((row, i) => (
                    <Cell
                      key={i}
                      fill={
                        row.actual == null
                          ? "rgba(0,0,0,0.12)"
                          : row.beat
                            ? beatColor
                            : row.miss
                              ? missColor
                              : "#64748b"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
