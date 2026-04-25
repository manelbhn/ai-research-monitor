import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/waitlist-admin";
import { listWaitlistSignups } from "@/lib/waitlist-db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedAdminRequest(request)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const rows = await listWaitlistSignups();
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        companyName: row.company_name,
        phoneNumber: row.phone_number,
        role: row.role,
        focus: row.focus,
        createdAt: row.created_at,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Server error. Please try again." }, { status: 500 });
  }
}
