import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payment = new Payment(client);

    const response = await payment.create({
      body: {
        token: body.token,
        issuer_id: body.issuer_id,
        payment_method_id: body.payment_method_id,
        transaction_amount: Number(body.transaction_amount),
        installments: Number(body.installments) || 1,
        description: "Santo Dilema - Pedido",
        three_d_secure_mode: "optional",
        payer: {
          email: body.payer?.email || "cliente@santodilema.com",
          identification: body.payer?.identification,
        },
      },
    });

    return NextResponse.json({
      status: response.status,
      status_detail: response.status_detail,
      id: response.id,
    });
  } catch (error: any) {
    const detail = error?.cause ?? error?.message ?? String(error);
    console.error("MP Payment error:", detail);
    return NextResponse.json(
      { error: String(detail), status: "error", status_detail: String(detail) },
      { status: 500 }
    );
  }
}
