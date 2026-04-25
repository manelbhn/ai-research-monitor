import { NextRequest } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/waitlist-admin";
import { listWaitlistSignups } from "@/lib/waitlist-db";
import { toWaitlistCsv } from "@/lib/waitlist-csv";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedAdminRequest(request)) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const rows = await listWaitlistSignups();
    const csv = toWaitlistCsv(rows);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch {
    return Response.json({ success: false, message: "Server error. Please try again." }, { status: 500 });
  }
}
