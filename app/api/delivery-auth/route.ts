import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    // El PIN vive solo en el servidor (sin NEXT_PUBLIC_)
    const validPin = process.env.DELIVERY_PIN || "1234";

    if (pin === validPin) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
