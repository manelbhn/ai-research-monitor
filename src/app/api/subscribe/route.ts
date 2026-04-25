import { NextRequest, NextResponse } from "next/server";
import { createWaitlistSignup } from "@/lib/waitlist-db";
import { validateWaitlistPayload, type WaitlistPayload } from "@/lib/waitlist-validation";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const inMemoryRateLimit = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(request: NextRequest): boolean {
  const key = getClientKey(request);
  const now = Date.now();
  const current = inMemoryRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    inMemoryRateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again in a minute." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as WaitlistPayload;
    const normalizedBody: WaitlistPayload = {
      fullName: body.fullName ?? body.name,
      email: body.email,
      companyName: body.companyName,
      phoneNumber: body.phoneNumber,
      role: body.role,
      focus: body.focus,
    };

    const parsed = validateWaitlistPayload(normalizedBody);
    if (!parsed.value) {
      return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    }

    const result = await createWaitlistSignup(parsed.value);
    const message = result.inserted
      ? "You are in. Welcome to the early-access list."
      : "You are already on the waitlist.";

    return NextResponse.json({
      success: true,
      message,
      position: result.position,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
