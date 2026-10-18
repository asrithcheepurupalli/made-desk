import { NextRequest, NextResponse } from "next/server";
import { getTrackedLinkByCode, recordClick } from "@/lib/data/trackedLinks";

// Messaging apps fetch a link right after it's sent to build the preview card.
// That hit comes from the app itself, not the person it was sent to, so it must
// not count as a click. Matched against each app's own fetcher user agent.
//
// A real tap inside WhatsApp's own in-app browser ALSO carries "WhatsApp/x.x.x.x"
// in its user agent, appended after a full real-browser string (Mozilla/... Chrome/...
// Mobile Safari/...). The bare preview-fetcher never has that real-browser prefix, so
// that's the actual signal: no "Mozilla" token means it's the bot, not a person.
const PREVIEW_BOT_RE = /WhatsApp|facebookexternalhit|Facebot|Slackbot|TelegramBot|TwitterBot|Discordbot|LinkedInBot|SkypeUriPreview|Googlebot|bingbot/i;

function isPreviewBot(userAgent: string | null): boolean {
  if (!userAgent || !PREVIEW_BOT_RE.test(userAgent)) return false;
  return !/Mozilla/i.test(userAgent);
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
