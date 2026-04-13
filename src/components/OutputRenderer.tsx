"use client";

import {
  classifySectionTitle,
  parseOutput,
  parseTableRows,
  partitionByH3,
  planBodyRender,
  type BodyRenderPlan,
  type ParsedSection,
  type RenderChunk,
  type SectionCardGroup,
  type SectionVariant,
} from "@/lib/parseOutput";

export function OutputRenderer({
  text,
  accent,
  researchMode = true,
}: {
  text: string;
  accent: string;
  /** When false, section accents are neutral (operations / data workflows). */
  researchMode?: boolean;
}) {
  if (!text) return null;
  const sections = parseOutput(text);
  const h3groups = partitionByH3(sections);

  return (
    <div className="space-y-2 font-sans text-[13px] leading-relaxed text-fp-text-secondary">
      {h3groups.map((g, gi) => (
        <H3Section
          key={gi}
          h3Title={g.h3Title}
          body={g.body}
          accent={accent}
          researchMode={researchMode}
        />
      ))}
    </div>
  );
}

function resolveVariant(
  v: SectionVariant,
  researchMode: boolean,
): SectionVariant {
  if (!researchMode) return "default";
  return v;
}

function H3Section({
  h3Title,
  body,
  accent,
  researchMode,
}: {
  h3Title: string | null;
  body: ParsedSection[];
  accent: string;
  researchMode: boolean;
}) {
  const fromTitle = h3Title ? classifySectionTitle(h3Title) : null;
  const blockVariant = resolveVariant(
    fromTitle?.variant ?? "default",
    researchMode,
  );
  const plan = planBodyRender(body);
  const thematic = !!h3Title;

  const outerClass = thematic
    ? thematicWrapClass(blockVariant)
    : "mt-6 first:mt-0";

  return (
    <div className={outerClass}>
      {h3Title ? (
        <h3 className="mb-3 font-sans text-lg font-medium text-fp-text-primary">
          {h3Title}
        </h3>
      ) : null}
      <BodyContent
        plan={plan}
        accent={accent}
        researchMode={researchMode}
        suppressCardBorder={thematic}
      />
    </div>
  );
}

function thematicWrapClass(v: SectionVariant): string {
  const base = "mt-6 first:mt-0 border-l-[3px] pl-5";
  switch (v) {
    case "bull":
      return `${base} border-fp-bull-accent`;
    case "bear":
      return `${base} border-fp-bear-accent`;
    case "metrics":
      return `${base} border-fp-border-hover`;
    case "variant":
      return `${base} border-fp-neutral-border`;
    case "surprise":
      return `${base} border-fp-warning`;
    case "consensus":
      return `${base} border-fp-border-hover`;
    default:
      return `${base} border-fp-border`;
  }
}

function BodyContent({
  plan,
  accent,
  researchMode,
  suppressCardBorder,
}: {
  plan: BodyRenderPlan;
  accent: string;
  researchMode: boolean;
  suppressCardBorder: boolean;
}) {
  if (plan.mode === "flow") {
    return (
      <div className="space-y-2">
        {plan.sections.map((s, i) => (
          <SectionBlock key={i} s={s} accent={accent} />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {plan.chunks.map((c, i) => (
        <ChunkBlock
          key={i}
          chunk={c}
          accent={accent}
          researchMode={researchMode}
          suppressCardBorder={suppressCardBorder}
        />
      ))}
    </div>
  );
}

function isCardGroup(c: RenderChunk): c is SectionCardGroup {
  return "kind" in c && c.kind === "card";
}

function ChunkBlock({
  chunk,
  accent,
  researchMode,
  suppressCardBorder,
}: {
  chunk: RenderChunk;
  accent: string;
  researchMode: boolean;
  suppressCardBorder: boolean;
}) {
  if (isCardGroup(chunk)) {
    return (
      <SectionCard
        g={{
          ...chunk,
          variant: resolveVariant(chunk.variant, researchMode),
        }}
        accent={accent}
        suppressShell={suppressCardBorder}
      />
    );
  }
  return <SectionBlock s={chunk} accent={accent} />;
}

const sectionLabelClass: Partial<Record<SectionVariant, string>> = {
  bull: "text-fp-bull",
  bear: "text-fp-bear",
  variant: "text-fp-neutral",
  metrics: "text-fp-text-secondary",
  surprise: "text-fp-warning",
  consensus: "text-fp-text-muted",
};

function cardAccentClass(v: SectionVariant): string {
  switch (v) {
    case "bull":
      return "border-fp-bull-accent";
    case "bear":
      return "border-fp-bear-accent";
    case "metrics":
      return "border-fp-border-hover";
    case "variant":
      return "border-fp-neutral-border";
    case "surprise":
      return "border-fp-warning";
    case "consensus":
    case "neutral":
      return "border-fp-border-hover";
    default:
      return "border-transparent";
  }
}

function SectionCard({
  g,
  accent,
  suppressShell,
}: {
  g: SectionCardGroup;
  accent: string;
  /** When true, parent ### block already drew the accent border */
  suppressShell: boolean;
}) {
  const label = sectionLabelText(g.variant);
  const labelCls = sectionLabelClass[g.variant] ?? "text-fp-text-muted";
  const shell =
    suppressShell || g.variant === "default"
      ? "mt-4"
      : `mt-4 border-l-[3px] pl-5 ${cardAccentClass(g.variant)}`;

  if (g.layout === "metrics-grid" && g.bullets.length > 0) {
    return (
      <div className={shell}>
        <div className="space-y-3">
          {label ? (
            <div className={`font-sans text-sm font-medium ${labelCls}`}>
              {label}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {g.bullets.map((b, i) => (
              <MetricGridCard key={i} text={b} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shell} space-y-3`}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span
          className="font-mono text-[15px] font-medium text-fp-text-primary"
          style={{ color: accent }}
        >
          {g.level}.{" "}
        </span>
        <span className="font-sans text-sm font-medium text-fp-text-primary">
          {g.title}
        </span>
      </div>
      {g.subtitle ? (
        <p className="font-sans text-[13px] leading-[1.6] text-fp-text-secondary">
          <InlineMd text={g.subtitle} />
        </p>
      ) : null}
      {g.bullets.length > 0 ? (
        <ul className="space-y-4">
          {g.bullets.map((b, i) => (
            <li
              key={i}
              className="font-sans text-[13px] leading-[1.6] text-fp-text-secondary"
            >
              <span className="mr-1.5 font-mono text-xs text-fp-text-muted">
                {"\u25B8"}
              </span>
              <InlineMd text={b} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function sectionLabelText(v: SectionVariant): string | null {
  switch (v) {
    case "metrics":
      return "Key metrics to monitor";
    default:
      return null;
  }
}

function MetricGridCard({ text }: { text: string }) {
  const split = text.split(/\s*[—:–-]\s+/);
  const name = split[0]?.trim() ?? text;
  const note = split.slice(1).join(" — ").trim();
  return (
    <div className="rounded-fp-card bg-fp-surface-secondary px-3 py-2.5">
      <div className="font-sans text-[13px] font-medium text-fp-text-primary">
        <InlineMd text={name} />
      </div>
      {note ? (
        <div className="mt-1 font-sans text-xs text-fp-text-muted">
          <InlineMd text={note} />
        </div>
      ) : null}
    </div>
  );
}

function SectionBlock({ s, accent }: { s: ParsedSection; accent: string }) {
  switch (s.type) {
    case "heading":
      if (s.headingLevel === 2) {
        return (
          <div className="mt-4 font-sans text-base font-semibold text-fp-text-primary">
            {s.content}
          </div>
        );
      }
      return (
        <div className="mt-4 font-sans text-lg font-medium text-fp-text-primary">
          {s.content}
        </div>
      );
    case "numbered":
      return (
        <div className="mt-4 space-y-1">
          <div className="font-sans text-sm font-medium text-fp-text-primary">
            <span className="font-mono text-sm" style={{ color: accent }}>
              {s.level}.{" "}
            </span>
            {s.title}
          </div>
          {s.content ? (
            <p className="font-sans text-[13px] leading-[1.6] text-fp-text-secondary">
              <InlineMd text={s.content} />
            </p>
          ) : null}
        </div>
      );
    case "bullet":
      return (
        <div className="mt-1 pl-1 font-sans text-[13px] leading-[1.6] text-fp-text-secondary">
          <span className="font-mono text-xs text-fp-text-muted">{"\u25B8"}</span>{" "}
          <InlineMd text={s.content} />
        </div>
      );
    case "code":
      return (
        <pre className="mt-3 overflow-x-auto rounded-fp-card bg-fp-surface-secondary p-4 font-mono text-[12px] text-fp-text-secondary">
          {s.content}
        </pre>
      );
    case "table": {
      const rows = parseTableRows(s.content);
      if (!rows.length) return null;
      return (
        <div className="my-3 overflow-x-auto rounded-fp-card border-[0.5px] border-fp-border shadow-fp-card">
          <table className="w-full border-collapse text-left font-mono text-[12px]">
            <tbody>
              {rows.map((r, ri) => (
                <tr
                  key={ri}
                  className={
                    ri === 0
                      ? "bg-fp-surface-secondary font-semibold text-fp-text-primary"
                      : ri % 2 === 1
                        ? "bg-fp-bg/80"
                        : "bg-fp-surface"
                  }
                >
                  {r.map((c, ci) => (
                    <td
                      key={ci}
                      className="border-[0.5px] border-fp-border px-2 py-1.5 text-fp-text-secondary first:text-fp-text-primary"
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    default:
      return (
        <p className="font-sans text-[13px] leading-[1.7] text-fp-text-secondary">
          <InlineMd text={s.content} />
        </p>
      );
  }
}

function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\*\*(.+?)\*\*$/);
        if (m) {
          return (
            <strong key={i} className="font-medium text-fp-text-primary">
              {m[1]}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
