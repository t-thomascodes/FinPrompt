import OpenAI from "openai";
import { NextResponse } from "next/server";
import { enrichTickerData } from "@/lib/marketData";
import { fillTemplate } from "@/lib/template";
import type { ExecuteRequestBody, ExecuteResponseBody } from "@/lib/types";

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
  const enrich = body.enrichTicker?.trim();
  const ticker = enrich
    ? (body.variables[enrich] ?? "").trim().toUpperCase()
    : "";

  if (enrich && ticker) {
    const enriched = await enrichTickerData(ticker, process.env.ALPHA_VANTAGE_API_KEY);
    marketData = enriched.formatted;
  }

  const hadData =
    Boolean(enrich && ticker && process.env.ALPHA_VANTAGE_API_KEY) &&
    marketData.includes("---") &&
    !marketData.startsWith("[");

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

  const res: ExecuteResponseBody = {
    output: output || "No response.",
    marketData,
    hadData,
    fullPrompt,
  };
  return NextResponse.json(res);
}
