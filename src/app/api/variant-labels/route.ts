import { NextResponse } from "next/server";
import {
  deleteVariantLabelRow,
  upsertVariantLabelRow,
} from "@/lib/db/workflowDb";
import { getSupabaseAdmin } from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" as const };

const MAX_KEY_LEN = 32_000;
const MAX_LABEL_LEN = 120;

type PutBody = {
  promptId?: string;
  variantKey?: string;
  label?: string;
};

export async function PUT(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503, headers: NO_STORE },
    );
  }

  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: NO_STORE });
  }

  const promptId = body.promptId;
  const variantKey = body.variantKey;
  if (typeof promptId !== "string" || !promptId.trim()) {
    return NextResponse.json({ error: "promptId required" }, { status: 400, headers: NO_STORE });
  }
  if (typeof variantKey !== "string") {
    return NextResponse.json({ error: "variantKey required" }, { status: 400, headers: NO_STORE });
  }
  if (variantKey.length > MAX_KEY_LEN) {
    return NextResponse.json({ error: "variantKey too long" }, { status: 400, headers: NO_STORE });
  }

  const label = typeof body.label === "string" ? body.label.trim() : "";

  if (!label) {
    const ok = await deleteVariantLabelRow(supabase, promptId, variantKey);
    if (!ok) {
      return NextResponse.json({ error: "Delete failed" }, { status: 500, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  if (label.length > MAX_LABEL_LEN) {
    return NextResponse.json(
      { error: `label must be at most ${MAX_LABEL_LEN} characters` },
      { status: 400, headers: NO_STORE },
    );
  }

  const ok = await upsertVariantLabelRow(supabase, promptId, variantKey, label);
  if (!ok) {
    return NextResponse.json({ error: "Save failed" }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
