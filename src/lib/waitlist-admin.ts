import { NextRequest } from "next/server";

export function isAuthorizedAdminRequest(request: NextRequest): boolean {
  const configuredToken = process.env.WAITLIST_ADMIN_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const bearerHeader = request.headers.get("authorization") || "";
  const bearerToken = bearerHeader.startsWith("Bearer ") ? bearerHeader.slice(7).trim() : "";
  const queryToken = request.nextUrl.searchParams.get("token")?.trim() || "";

  return bearerToken === configuredToken || queryToken === configuredToken;
}
