import OpenAI from "openai";
import { NextResponse } from "next/server";
import { discoverPeerTickersViaOpenAI } from "@/lib/discoverPeerTickers";
import {
  enrichTickerData,
  enrichTickerDataWithPeers,
  parsePeerTickersFromVariable,
} from "@/lib/marketData";
import type { EnrichTickerResult } from "@/lib/marketData";
import { fillTemplate } from "@/lib/template";
import { insertWorkflowLog } from "@/lib/db/workflowDb";
import { fingerprintPromptTemplate } from "@/lib/promptTemplateFingerprint";
import type { ExecuteRequestBody, ExecuteResponseBody } from "@/lib/types";
import type { MarketDataBundle } from "@/lib/marketDataTypes";
import { getSupabaseAdmin } from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const maxDuration = 120;

const DEFAULT_MODEL = "gpt-4o";

export async function POST(req: Request) {
  let body: ExecuteRequestBody;
  try {
    body = (await req.json()) as ExecuteRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.template || typeof body.variables !== "object" || !body.variables) {
    return NextResponse.json({ error: "template and variables required" }, { status: 400 });
  }

  const { fingerprint, excerpt } = fingerprintPromptTemplate(body.template);

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "Workflow execution is not available on this server." },
      { status: 503 },
    );
  }

  const client = new OpenAI({ apiKey: openaiKey });

  let marketData = "";
  let marketDataStructured: MarketDataBundle | null = null;
  let hadData = false;
  const enrich = body.enrichTicker?.trim();
  const ticker = enrich
    ? (body.variables[enrich] ?? "").trim().toUpperCase()
    : "";

  if (enrich && ticker) {
    const peerVarKey = body.enrichPeerTickers?.trim();
    const peerRaw =
      peerVarKey && body.variables[peerVarKey] != null
        ? String(body.variables[peerVarKey]).trim()
        : "";
    const peerFieldWasTouched = peerRaw.length > 0;
    let peerList = peerRaw ? parsePeerTickersFromVariable(peerRaw) : [];

    let primaryPrefetch: EnrichTickerResult | undefined;

    // Only auto-discover peers when the field is left blank—never when the user typed
    // something that failed parsing (avoids replacing one intended peer with 4+ suggestions).
    if (peerVarKey && peerList.length === 0 && !peerFieldWasTouched) {
      primaryPrefetch = await enrichTickerData(ticker);
      try {
        const companyName = String(
          body.variables.COMPANY_NAME ??
            body.variables.company_name ??
            body.variables.Company_Name ??
            "",
        );
        const discovered = await discoverPeerTickersViaOpenAI(client, {
          ticker,
          companyName,
          marketSnippet: primaryPrefetch.formatted,
        });
        if (discovered.length > 0) {
          peerList = discovered;
        }
      } catch (e) {
        console.warn(
          "[Meridian] peer discovery failed; using primary ticker data only:",
          e,
        );
      }
    }

    let enriched: EnrichTickerResult;
    if (peerVarKey && peerList.length > 0) {
      enriched = await enrichTickerDataWithPeers(ticker, peerList, {
        primary: primaryPrefetch,
      });
    } else {
      enriched = primaryPrefetch ?? (await enrichTickerData(ticker));
    }
    marketData = enriched.formatted;
    marketDataStructured = enriched.structured;
    hadData = enriched.hadData;
  }

  const fullPrompt = fillTemplate(body.template, {
    ...body.variables,
    MARKET_DATA: marketData,
  });

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  let output = "";
  try {
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: fullPrompt }],
    });
    output = completion.choices[0]?.message?.content ?? "";
  } catch (e) {
    console.error("[Meridian] workflow execution request failed:", e);
    return NextResponse.json(
      { error: "Workflow execution failed. Please try again." },
      { status: 502 },
    );
  }

  let logId: string | null = null;
  let logSaveError: string | null = null;
  const meta = body.logMeta;
  const supabase = getSupabaseAdmin();
  if (supabase && meta?.promptId && meta.categoryId) {
    logId = await insertWorkflowLog(supabase, {
      promptId: meta.promptId,
      promptTitle: meta.promptTitle,
      categoryId: meta.categoryId,
      inputs: meta.inputs,
      variables: body.variables,
      output: output || "No response.",
      marketData,
      marketDataStructured,
      hadData,
      fullPrompt,
      promptTemplate: body.template,
      fullPromptFingerprint: fingerprint,
      fullPromptExcerpt: excerpt,
    });
    if (!logId) {
      logSaveError =
        "This run was not saved to the database and will disappear after refresh. Check the server log for details.";
    }
  }

  const res: ExecuteResponseBody = {
    output: output || "No response.",
    marketData,
    hadData,
    fullPrompt,
    marketDataStructured,
    logId,
    logSaveError,
    fullPromptFingerprint: fingerprint,
    fullPromptExcerpt: excerpt,
  };
  return NextResponse.json(res);
}
