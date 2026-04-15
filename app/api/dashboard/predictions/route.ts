import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get("label")) params.set("label", searchParams.get("label")!);
    if (searchParams.get("marked") !== null && searchParams.get("marked") !== "")
      params.set("marked", searchParams.get("marked")!);
    if (searchParams.get("limit")) params.set("limit", searchParams.get("limit")!);
    if (searchParams.get("offset")) params.set("offset", searchParams.get("offset")!);

    const res = await fetch(`${BACKEND_URL}/dashboard/predictions?${params.toString()}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || "Backend error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 502 });
  }
}
