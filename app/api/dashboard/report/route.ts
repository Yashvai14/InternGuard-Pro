import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company_name");
    const params = new URLSearchParams();
    if (company) params.set("company_name", company);

    const res = await fetch(`${BACKEND_URL}/dashboard/report?${params.toString()}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Backend error" }, { status: res.status });
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get("Content-Disposition") || 'attachment; filename="report.csv"';

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": contentDisposition,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 502 });
  }
}
