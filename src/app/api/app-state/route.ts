import { NextResponse } from "next/server";
import { CATEGORIES as INITIAL_CATEGORIES } from "@/lib/categories";
import {
  ensureSeedData,
  loadCategoriesFromDb,
  loadLogsListForAppState,
  loadVariantLabelsFromDb,
} from "@/lib/db/workflowDb";
import { SEED_LOGS } from "@/lib/seedLogs";
import { getSupabaseAdmin } from "@/lib/supabase/adminClient";
import { formatSupabaseError } from "@/lib/supabase/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
} as const;

export async function GET() {
  const supabase = getSupabaseAdmin();
  console.log("[Meridian] env url:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "[Meridian] env key tail:",
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-10) ?? "MISSING",
  );
  if (!supabase) {
    return NextResponse.json(
      {
        persistence: "local" as const,
        categories: structuredClone(INITIAL_CATEGORIES),
        logs: structuredClone(SEED_LOGS),
        variantLabels: {} as Record<string, string>,
      },
      {
        headers: {
          ...NO_STORE_HEADERS,
          "X-Meridian-Logs-Count": String(SEED_LOGS.length),
        },
      },
    );
  }

  try {
    const { count: rawCount, error: rawCountError } = await supabase
      .from("workflow_logs")
      .select("*", { count: "exact", head: true });
    console.log("[Meridian] raw count check:", {
      rawCount,
      rawCountError: rawCountError?.message,
    });
    await ensureSeedData(supabase);
    const [categories, logs, variantLabels] = await Promise.all([
      loadCategoriesFromDb(supabase),
      loadLogsListForAppState(supabase),
      loadVariantLabelsFromDb(supabase),
    ]);

    return NextResponse.json(
      {
        persistence: "supabase" as const,
        categories,
        logs,
        variantLabels,
      },
      {
        headers: {
          ...NO_STORE_HEADERS,
          "X-Meridian-Logs-Count": String(logs.length),
        },
      },
    );
  } catch (e) {
    const msg = formatSupabaseError(e);
    console.error("[Meridian] app-state:", msg, e);
    return NextResponse.json(
      {
        persistence: "supabase" as const,
        error: msg,
      },
      {
        status: 503,
        headers: {
          ...NO_STORE_HEADERS,
          "X-Meridian-Logs-Count": "0",
        },
      },
    );
  }
}
