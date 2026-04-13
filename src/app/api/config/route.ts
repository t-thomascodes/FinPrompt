import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    alphaVantageConfigured: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
  });
}
