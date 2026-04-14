import { NextResponse } from "next/server";
import {
  deleteWorkflowLog,
  getWorkflowLogById,
  updateLogRating,
} from "@/lib/db/workflowDb";
import { getSupabaseAdmin } from "@/lib/supabase/adminClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" as const };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503, headers: NO_STORE },
    );
  }

  const { id } = params;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Invalid log id" },
      { status: 400, headers: NO_STORE },
    );
  }

  const log = await getWorkflowLogById(supabase, id);
  if (!log) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  }
  return NextResponse.json({ log }, { headers: NO_STORE });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503, headers: NO_STORE },
    );
  }

  const { id } = params;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Invalid log id" },
      { status: 400, headers: NO_STORE },
    );
  }

  let body: { rating?: number };
  try {
    body = (await req.json()) as { rating?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: NO_STORE });
  }

  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be 0–5" },
      { status: 400, headers: NO_STORE },
    );
  }

  const ok = await updateLogRating(supabase, id, Math.round(rating));
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503, headers: NO_STORE },
    );
  }

  const { id } = params;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Invalid log id" },
      { status: 400, headers: NO_STORE },
    );
  }

  const ok = await deleteWorkflowLog(supabase, id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
