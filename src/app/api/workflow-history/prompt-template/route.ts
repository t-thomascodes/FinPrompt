import { NextResponse } from "next/server";
import { resolveWorkflowPromptTemplate } from "@/lib/db/workflowDb";
import { getSupabaseAdmin } from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const promptId = searchParams.get("promptId")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId")?.trim() ?? "";
  const fingerprint = searchParams.get("fingerprint")?.trim() ?? "";
  if (!promptId || !fingerprint) {
    return NextResponse.json(
      { error: "promptId and fingerprint are required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const result = await resolveWorkflowPromptTemplate(
    supabase,
    promptId,
    categoryId,
    fingerprint,
  );

  if ("error" in result) {
    if (result.error === "legacy_variant") {
      return NextResponse.json(
        {
          error:
            "This group uses legacy tracking. Open a run and use View prompt on the detail page.",
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Could not resolve this template. It may be an older or edited version." },
      { status: 404 },
    );
  }

  return NextResponse.json({ template: result.template });
}
