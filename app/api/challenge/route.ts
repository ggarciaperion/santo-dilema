import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const data = await storage.getChallengeData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ salesAmount: 0, goal: 5000, active: true, deadline: '2026-03-28' });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const current = await storage.getChallengeData();
    const updated = { ...current, ...body };
    await storage.saveChallengeData(updated);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
