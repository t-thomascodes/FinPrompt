import { buildPptxBuffer } from "@/lib/exportPptx";
import type { ExportPayload, ExportRequestBody } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: ExportRequestBody;
  try {
    body = (await req.json()) as ExportRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { filename, ...rest } = body;
  const payload = rest as ExportPayload;
  if (!payload.title || payload.output == null) {
    return new Response(JSON.stringify({ error: "title and output required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buf = await buildPptxBuffer(payload);
  const name = filename || "meridian_export.pptx";
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
