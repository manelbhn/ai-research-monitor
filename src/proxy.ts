import { NextRequest, NextResponse } from "next/server";

const WAITLIST_ROUTE = "/waitlist";

function isExcludedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".gif") ||
    pathname === WAITLIST_ROUTE
  );
}

export function proxy(request: NextRequest) {
  const waitlistOnlyMode = process.env.WAITLIST_ONLY_MODE === "true";
  if (!waitlistOnlyMode) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = WAITLIST_ROUTE;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: "/:path*",
};
