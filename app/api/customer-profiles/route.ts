import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const profiles = await storage.getCustomerProfiles();
    if (phone) {
      return NextResponse.json(profiles.find((p: any) => p.phone === phone) || { phone, tags: [] });
    }
    return NextResponse.json(profiles);
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { phone, birthday, tags, notes, name, address } = await request.json();
    if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });
    if (birthday && !/^\d{2}-\d{2}$/.test(birthday)) {
      return NextResponse.json({ error: "birthday must be MM-DD" }, { status: 400 });
    }
    const profile = await storage.upsertCustomerProfile({
      phone,
      birthday: birthday || undefined,
      tags: tags || [],
      notes: notes || undefined,
      nameOverride: name !== undefined ? name : undefined,
      addressOverride: address !== undefined ? address : undefined,
    });
    return NextResponse.json({ success: true, profile });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
