import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customerName, externalReference, origin } = body;

    const baseUrl = origin || "https://www.santodilema.com";

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: items.map((item: { title: string; quantity: number; unit_price: number }) => ({
          id: item.title.replace(/\s+/g, "-").toLowerCase(),
          title: item.title,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price.toFixed(2)),
          currency_id: "PEN",
        })),
        payer: {
          name: customerName || "Cliente",
        },
        back_urls: {
          success: `${baseUrl}/checkout/mp-success`,
          failure: `${baseUrl}/checkout/mp-failure`,
          pending: `${baseUrl}/checkout/mp-pending`,
        },
        auto_return: "approved",
        external_reference: externalReference,
        statement_descriptor: "SANTO DILEMA",
      },
    });

    return NextResponse.json({ init_point: response.init_point });
  } catch (error: any) {
    console.error("MP Preference error:", error);
    return NextResponse.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}
