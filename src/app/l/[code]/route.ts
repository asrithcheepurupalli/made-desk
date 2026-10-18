import { NextRequest, NextResponse } from "next/server";
import { getTrackedLinkByCode, recordClick } from "@/lib/data/trackedLinks";

// Messaging apps fetch a link right after it's sent to build the preview card.
// That hit comes from the app itself, not the person it was sent to, so it must
// not count as a click. Matched against each app's own fetcher user agent.
const PREVIEW_BOT_RE = /WhatsApp|facebookexternalhit|Facebot|Slackbot|TelegramBot|TwitterBot|Discordbot|LinkedInBot|SkypeUriPreview|Googlebot|bingbot/i;

function isPreviewBot(userAgent: string | null): boolean {
  return !!userAgent && PREVIEW_BOT_RE.test(userAgent);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const link = await getTrackedLinkByCode(code);

  if (!link) {
    return NextResponse.redirect(new URL("https://made-by-ac.com", request.url));
  }

  const userAgent = request.headers.get("user-agent");
  if (!isPreviewBot(userAgent)) {
    await recordClick(link.id, {
      userAgent,
      referrer: request.headers.get("referer"),
    });
  }

  return NextResponse.redirect(link.target_url);
}
