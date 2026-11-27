import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Fast, optimistic check at the edge. Signed-out visitors to the home page
// see the public landing page in place of the dashboard; everywhere else they
// go to sign-in. Layouts and API routes still validate the session itself.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/landing", request.url));
  }
  return NextResponse.redirect(new URL("/sign-in", request.url));
}

export const config = {
  matcher: [
    // Public: APIs, assets, auth pages, the landing page and link-preview images.
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets|landing|opengraph-image).*)",
  ],
};
