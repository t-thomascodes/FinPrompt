import { NextResponse } from "next/server";
import { CATEGORIES as INITIAL_CATEGORIES } from "@/lib/categories";
import {
  ensureSeedData,
  loadCategoriesFromDb,
  loadLogsListForAppState,
} from "@/lib/db/workflowDb";
import { SEED_LOGS } from "@/lib/seedLogs";
import { getSupabaseAdmin } from "@/lib/supabase/adminClient";
import { formatSupabaseError } from "@/lib/supabase/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        persistence: "local" as const,
        categories: structuredClone(INITIAL_CATEGORIES),
        logs: structuredClone(SEED_LOGS),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  try {
    try {
      await ensureSeedData(supabase);
    } catch (seedErr) {
      console.error(
        "[FinPrompt] ensureSeedData:",
        formatSupabaseError(seedErr),
        seedErr,
      );
    }

    const [categories, logs] = await Promise.all([
      loadCategoriesFromDb(supabase),
      loadLogsListForAppState(supabase),
    ]);
    return NextResponse.json(
      {
        persistence: "supabase" as const,
        categories,
        logs,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (e) {
    const msg = formatSupabaseError(e);
    console.error("[FinPrompt] app-state:", msg, e);
    return NextResponse.json(
      {
        persistence: "local" as const,
        categories: structuredClone(INITIAL_CATEGORIES),
        logs: structuredClone(SEED_LOGS),
        warning: `Supabase unavailable (${msg}). Using local demo data.`,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
