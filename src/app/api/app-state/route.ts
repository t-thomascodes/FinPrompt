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

export async function GET() {
  const supabase = getSupabaseAdmin();
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
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
          "X-Meridian-Logs-Count": String(SEED_LOGS.length),
        },
      },
    );
  }

  try {
    try {
      await ensureSeedData(supabase);
    } catch (seedErr) {
      console.error(
        "[Meridian] ensureSeedData:",
        formatSupabaseError(seedErr),
        seedErr,
      );
    }

    let categories = structuredClone(INITIAL_CATEGORIES);
    let logs = structuredClone(SEED_LOGS);
    let variantLabels: Record<string, string> = {};
    let partialWarning: string | undefined;

    try {
      categories = await loadCategoriesFromDb(supabase);
    } catch (catErr) {
      const msg = formatSupabaseError(catErr);
      console.error("[Meridian] app-state loadCategoriesFromDb:", msg, catErr);
      partialWarning = "Categories could not be loaded from the database; using defaults.";
    }

    try {
      logs = await loadLogsListForAppState(supabase);
    } catch (logErr) {
      const msg = formatSupabaseError(logErr);
      console.error("[Meridian] app-state loadLogsListForAppState:", msg, logErr);
      partialWarning =
        (partialWarning ? `${partialWarning} ` : "") +
        "Workflow logs could not be loaded; using demo logs until the error is fixed.";
    }

    try {
      variantLabels = await loadVariantLabelsFromDb(supabase);
    } catch (labelErr) {
      const msg = formatSupabaseError(labelErr);
      console.error("[Meridian] app-state loadVariantLabelsFromDb:", msg, labelErr);
      partialWarning =
        (partialWarning ? `${partialWarning} ` : "") +
        "Custom prompt names could not be loaded from the database.";
    }

    return NextResponse.json(
      {
        persistence: "supabase" as const,
        categories,
        logs,
        variantLabels,
        ...(partialWarning ? { warning: partialWarning } : {}),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
          "X-Meridian-Logs-Count": String(logs.length),
        },
      },
    );
  } catch (e) {
    const msg = formatSupabaseError(e);
    console.error("[Meridian] app-state:", msg, e);
    return NextResponse.json(
      {
        persistence: "local" as const,
        categories: structuredClone(INITIAL_CATEGORIES),
        logs: structuredClone(SEED_LOGS),
        variantLabels: {} as Record<string, string>,
        warning: `Supabase unavailable (${msg}). Using local demo data.`,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
          "X-Meridian-Logs-Count": String(SEED_LOGS.length),
        },
      },
    );
  }
}
