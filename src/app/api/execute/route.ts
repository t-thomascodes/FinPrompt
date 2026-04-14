import OpenAI from "openai";
import { NextResponse } from "next/server";
import { enrichTickerData } from "@/lib/marketData";
import { fillTemplate } from "@/lib/template";
import { insertWorkflowLog } from "@/lib/db/workflowDb";
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

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server" },
      { status: 503 },
    );
  }

  let marketData = "";
  let marketDataStructured: MarketDataBundle | null = null;
  let hadData = false;
  const enrich = body.enrichTicker?.trim();
  const ticker = enrich
    ? (body.variables[enrich] ?? "").trim().toUpperCase()
    : "";

  if (enrich && ticker) {
    const enriched = await enrichTickerData(ticker);
    marketData = enriched.formatted;
    marketDataStructured = enriched.structured;
    hadData = enriched.hadData;
  }

  const fullPrompt = fillTemplate(body.template, {
    ...body.variables,
    MARKET_DATA: marketData,
  });

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  const client = new OpenAI({ apiKey: openaiKey });
  let output = "";
  try {
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: fullPrompt }],
    });
    output = completion.choices[0]?.message?.content ?? "";
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
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
  };
  return NextResponse.json(res);
}
