"use client";

import { useMemo, useState } from "react";
import {
  formatVolumeAbbrev,
  parseMarketDataForDisplay,
  parsePriceNum,
  sentimentTone,
  type ParsedMarketDisplay,
} from "@/lib/parseMarketDataDisplay";

type Props = {
  marketData: string;
  dataLoading: boolean;
  accent: string;
};

function WeekRangeBar({
  low,
  high,
  current,
}: {
  low: number;
  high: number;
  current: number;
}) {
  const span = high - low;
  const pct = span > 0 ? ((current - low) / span) * 100 : 50;
  const clamped = Math.min(100, Math.max(0, pct));

  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between font-sans text-[11px] text-fp-text-muted">
        <span>52-week range</span>
        <span className="font-mono text-fp-text-secondary">
          ${low.toFixed(2)} — ${high.toFixed(2)}
        </span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-fp-badge bg-black/[0.06]"
        role="img"
        aria-label={`Price at ${clamped.toFixed(0)} percent from 52-week low to high`}
      >
        <div
          className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-fp-bear-accent/50 via-fp-sentiment-mid/40 to-fp-sentiment-bull/50"
          aria-hidden
        />
        <div
          className="absolute bottom-0 top-0 w-[3px] -translate-x-1/2 bg-fp-text-primary"
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-fp-text-muted">
        <span>${low.toFixed(2)}</span>
        <span className="font-medium text-fp-text-primary">
          ${current.toFixed(2)}
        </span>
        <span>${high.toFixed(2)}</span>
      </div>
    </div>
  );
}

function TopMetricCell({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="rounded-fp-card bg-fp-surface-secondary px-3 py-3">
      <div className="font-sans text-[11px] text-fp-text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg font-medium text-fp-text-primary">
        {value}
      </div>
    </div>
  );
}

function FundamentalsPanel({ d }: { d: ParsedMarketDisplay }) {
  const pairs: { label: string; value: string }[] = [];
  if (d.revenueTtm) pairs.push({ label: "Revenue", value: d.revenueTtm });
  if (d.ebitda) pairs.push({ label: "EBITDA", value: d.ebitda });
  if (d.grossMargin) pairs.push({ label: "Gross margin", value: d.grossMargin });
  if (d.opMargin) pairs.push({ label: "Op margin", value: d.opMargin });
  if (d.roe) pairs.push({ label: "ROE", value: d.roe });
  if (d.revGrowth) pairs.push({ label: "Rev growth", value: d.revGrowth });
  if (d.enterpriseValue)
    pairs.push({ label: "Enterprise value", value: d.enterpriseValue });
  if (d.forwardPe) pairs.push({ label: "Fwd P/E", value: d.forwardPe });
  if (d.peg) pairs.push({ label: "PEG", value: d.peg });

  if (!pairs.length) return null;

  return (
    <div className="rounded-fp-card bg-fp-surface-secondary p-3 sm:p-4">
      <div className="mb-2 font-sans text-xs font-semibold text-fp-text-primary">
        Fundamentals
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {pairs.slice(0, 8).map((p) => (
          <div key={p.label} className="min-w-0">
            <div className="font-sans text-[13px] text-fp-text-muted">
              {p.label}
            </div>
            <div className="truncate font-mono text-[13px] text-fp-text-primary">
              {p.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsPanel({
  news,
}: {
  news: ParsedMarketDisplay["news"];
}) {
  if (!news.length) return null;

  return (
    <div className="rounded-fp-card bg-fp-surface-secondary p-3 sm:p-4">
      <div className="mb-2 font-sans text-xs font-semibold text-fp-text-primary">
        News sentiment
      </div>
      <ul className="space-y-2">
        {news.slice(0, 5).map((n, i) => {
          const tone = sentimentTone(n.sentiment);
          const dot =
            tone === "bull"
              ? "bg-fp-sentiment-bull"
              : tone === "bear"
                ? "bg-fp-sentiment-bear"
                : "bg-fp-sentiment-mid";
          return (
            <li key={i} className="flex gap-2 text-left">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`}
                aria-hidden
              />
              <span className="line-clamp-2 font-sans text-xs text-fp-text-secondary">
                {n.title}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MarketDataPanel({ marketData, dataLoading, accent }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const parsed = useMemo(
    () => parseMarketDataForDisplay(marketData),
    [marketData],
  );

  if (!marketData && !dataLoading) return null;

  const priceNum = parsePriceNum(parsed?.price);
  const lowNum = parsePriceNum(parsed?.weekLow);
  const highNum = parsePriceNum(parsed?.weekHigh);
  const showRangeBar =
    priceNum != null &&
    lowNum != null &&
    highNum != null &&
    highNum > lowNum;

  const up = parsed?.isUp === true;
  const down = parsed?.isUp === false;
  const volDisp = formatVolumeAbbrev(parsed?.volume);

  return (
    <div
      className="mb-5 rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface shadow-fp-card"
      aria-busy={dataLoading}
    >
      <div className="border-b-[0.5px] border-fp-border px-4 py-3 sm:px-5">
        {dataLoading && !parsed?.price ? (
          <div className="animate-pulse space-y-3">
            <div className="h-7 w-56 rounded bg-fp-surface-secondary" />
            <div className="h-10 w-40 rounded bg-fp-surface-secondary" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded bg-fp-surface-secondary" />
              ))}
            </div>
          </div>
        ) : parsed ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[22px] font-medium leading-tight text-fp-text-primary">
                {parsed.name ?? parsed.symbol ?? "—"}
              </span>
              {parsed.symbol ? (
                <span
                  className="rounded-fp-badge border-[0.5px] border-fp-border bg-fp-surface-secondary px-2 py-0.5 font-mono text-[11px] text-fp-text-secondary"
                  style={{ borderColor: `${accent}55` }}
                >
                  {parsed.symbol}
                </span>
              ) : null}
              <span className="rounded-fp-badge bg-fp-research-light px-2 py-0.5 font-sans text-[10px] font-semibold text-fp-research">
                LIVE DATA
              </span>
            </div>
            {parsed.sectorLine ? (
              <div className="mt-1 font-sans text-xs text-fp-text-muted">
                {parsed.sectorLine}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-end gap-4">
              {parsed.price ? (
                <div className="font-mono text-[36px] font-medium leading-none tracking-tight text-fp-text-primary">
                  ${parsed.price}
                </div>
              ) : null}
              <div className="flex flex-wrap items-baseline gap-3">
                {parsed.change != null && parsed.changePercent ? (
                  <div
                    className={`font-mono text-[15px] font-medium ${
                      up
                        ? "text-fp-research"
                        : down
                          ? "text-fp-risk"
                          : "text-fp-text-muted"
                    }`}
                  >
                    <span aria-hidden className="mr-0.5">
                      {up ? "\u25B2" : down ? "\u25BC" : "—"}
                    </span>
                    {parsed.change} ({parsed.changePercent})
                  </div>
                ) : null}
                {volDisp ? (
                  <div className="font-sans text-xs text-fp-text-muted">
                    Vol:{" "}
                    <span className="font-mono text-fp-text-secondary">
                      {volDisp}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <TopMetricCell label="P/E ratio" value={parsed.pe} />
              <TopMetricCell label="Market cap" value={parsed.marketCap} />
              <TopMetricCell label="Beta" value={parsed.beta} />
              <TopMetricCell
                label="Analyst target"
                value={parsed.target ? `$${parsed.target}` : undefined}
              />
            </div>

            {showRangeBar ? (
              <WeekRangeBar
                low={lowNum!}
                high={highNum!}
                current={priceNum!}
              />
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <FundamentalsPanel d={parsed} />
              <NewsPanel news={parsed.news} />
            </div>
          </>
        ) : (
          <p className="font-mono text-[11px] text-fp-text-muted">
            {marketData.slice(0, 280)}
            {marketData.length > 280 ? "…" : ""}
          </p>
        )}
      </div>

      <div className="px-4 py-3 sm:px-5">
        {marketData.length > 0 && parsed ? (
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="font-sans text-[10px] font-medium uppercase tracking-wide text-fp-text-muted hover:text-fp-text-secondary"
          >
            {showRaw ? "Hide" : "Show"} raw feed
          </button>
        ) : null}
        {showRaw && marketData ? (
          <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface-secondary p-3 font-mono text-[10px] text-fp-text-muted">
            {marketData}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
