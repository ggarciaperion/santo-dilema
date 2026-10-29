import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG, WEBP o PDF." }, { status: 400 });
    }

    const maxMB = 10;
    if (file.size > maxMB * 1024 * 1024) {
      return NextResponse.json({ error: `El archivo supera ${maxMB} MB` }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder:        "santo-dilema/receipts",
      public_id:     `receipt-${Date.now()}`,
      resource_type: "auto",
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Error subiendo comprobante:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
