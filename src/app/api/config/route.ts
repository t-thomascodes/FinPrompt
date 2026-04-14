import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/adminClient";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    supabaseConfigured: isSupabaseConfigured(),
  });
}
