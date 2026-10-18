import { NextRequest, NextResponse } from "next/server";
import { getTrackedLinkByCode, recordClick } from "@/lib/data/trackedLinks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const link = await getTrackedLinkByCode(code);

  if (!link) {
    return NextResponse.redirect(new URL("https://made-by-ac.com", request.url));
  }

  await recordClick(link.id, {
    userAgent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
  });

  return NextResponse.redirect(link.target_url);
}
