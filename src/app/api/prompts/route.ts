import { NextResponse } from "next/server";
import type { PromptTemplate } from "@/lib/types";
import { upsertPromptRow } from "@/lib/db/workflowDb";
import { getSupabaseAdmin } from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

type PutBody = {
  categoryId?: string;
  prompt?: PromptTemplate;
  sortOrder?: number;
};

export async function PUT(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.categoryId || !body.prompt?.id || !body.prompt.template) {
    return NextResponse.json(
      { error: "categoryId and prompt (id, template) required" },
      { status: 400 },
    );
  }

  const ok = await upsertPromptRow(
    supabase,
    body.categoryId,
    body.prompt,
    typeof body.sortOrder === "number" ? body.sortOrder : 0,
  );
  if (!ok) {
    return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
