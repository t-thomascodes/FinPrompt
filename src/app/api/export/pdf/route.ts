import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Legacy path: PDF is generated in the browser (see ExportBar + downloadHybridMemoPdf).
 * This handler exists so outdated cached JS that still POSTs here gets JSON instead of an HTML 404.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "PDF is created in your browser now. Hard refresh this page (e.g. Cmd+Shift+R), then click PDF again.",
    },
    { status: 410 },
  );
}
