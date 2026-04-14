import { NextResponse } from "next/server";
import { getCachedMarketDataBundle } from "@/lib/marketDataBundle";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ticker = new URL(req.url).searchParams.get("ticker")?.trim();
  if (!ticker) {
    return NextResponse.json({ error: "ticker query parameter required" }, { status: 400 });
  }

  const bundle = await getCachedMarketDataBundle(ticker);
  return NextResponse.json(bundle);
}
