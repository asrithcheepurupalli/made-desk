import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { hasClerk } from "@/lib/env";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api/public(.*)"]);

const clerkHandler = hasClerk()
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : null;

export default function proxy(req: NextRequest, event: any) {
  if (!clerkHandler) {
    return NextResponse.next();
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
