import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import nodemailer from "nodemailer";

function getPeruNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
}

function getMD(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// GET — Obtener cumpleaños próximos (hoy, mañana, esta semana, este mes)
export async function GET() {
  try {
    const profiles = await storage.getCustomerProfiles();
    const orders = await storage.getOrders();
    const settings = await storage.getBirthdaySettings();

    const now = getPeruNow();
    const todayMD   = getMD(now);
    const tomorrowMD = getMD(addDays(now, 1));
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

    // Enriquecer perfiles con datos de pedidos
    const customerMap = new Map<string, any>();
    orders.forEach((o: any) => {
      if (!o.phone) return;
      const isDelivered = o.status === "delivered" || o.status?.toLowerCase() === "entregado";
      if (!isDelivered) return;
      if (!customerMap.has(o.phone)) {
        customerMap.set(o.phone, { name: o.name, phone: o.phone, totalOrders: 0, totalSpent: 0, lastOrderDate: o.createdAt });
      }
      const c = customerMap.get(o.phone);
      c.totalOrders += 1;
      c.totalSpent += o.totalPrice || 0;
      if (new Date(o.createdAt) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = o.createdAt;
        c.name = o.name;
      }
    });

    const withBirthday = profiles.filter((p: any) => p.birthday);

    const enrich = (p: any) => {
      const orderData = customerMap.get(p.phone) || { name: p.name || p.phone, totalOrders: 0, totalSpent: 0, lastOrderDate: null };
      return {
        phone: p.phone,
        name: orderData.name || p.name || p.phone,
        birthday: p.birthday, // MM-DD
        totalOrders: orderData.totalOrders,
        totalSpent: orderData.totalSpent,
        lastOrderDate: orderData.lastOrderDate,
      };
    };

    return NextResponse.json({
      today:    withBirthday.filter((p: any) => p.birthday === todayMD).map(enrich),
      tomorrow: withBirthday.filter((p: any) => p.birthday === tomorrowMD).map(enrich),
      thisWeek: withBirthday.filter((p: any) => {
        if (!p.birthday) return false;
        for (let i = 0; i <= 7; i++) {
          if (p.birthday === getMD(addDays(now, i))) return true;
        }
        return false;
      }).map(enrich),
      thisMonth: withBirthday.filter((p: any) => p.birthday?.startsWith(currentMonth)).map(enrich),
      settings,
    });
  } catch (err) {
    console.error("Error en birthday-alerts GET:", err);
    return NextResponse.json({ error: "Error al obtener alertas" }, { status: 500 });
  }
}

// POST — Enviar alerta por email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customers, emailTo, subject, preview } = body;

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: "No hay clientes para alertar" }, { status: 400 });
    }

    const settings = await storage.getBirthdaySettings();
    const recipientEmail = emailTo || settings.recipientEmail || process.env.BIRTHDAY_EMAIL_TO;

    if (!recipientEmail) {
      return NextResponse.json({ error: "No hay email destinatario configurado" }, { status: 400 });
    }

    const emailUser = process.env.BIRTHDAY_EMAIL_USER;
    const emailPass = process.env.BIRTHDAY_EMAIL_PASS;
    const emailHost = process.env.BIRTHDAY_EMAIL_HOST || "smtp.gmail.com";
    const emailPort = parseInt(process.env.BIRTHDAY_EMAIL_PORT || "587");

    if (!emailUser || !emailPass) {
      return NextResponse.json({ error: "Credenciales SMTP no configuradas en .env.local" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: { user: emailUser, pass: emailPass },
    });

    const now = getPeruNow();
    const dateStr = now.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const customerRows = customers.map((c: any) => {
      const [mm, dd] = (c.birthday || "").split("-");
      const bdStr = dd && mm ? `${dd}/${mm}` : "—";
      const lastOrder = c.lastOrderDate
        ? new Date(c.lastOrderDate).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" })
        : "—";
      const waMsg = encodeURIComponent(
        (settings.waTemplate || "Hola {{nombre}}! Feliz cumpleaños!").replace("{{nombre}}", c.name.split(" ")[0])
      );
      const waLink = `https://wa.me/51${c.phone}?text=${waMsg}`;
      return `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:14px 16px;font-weight:700;color:#111;">${c.name}</td>
          <td style="padding:14px 16px;color:#666;font-family:monospace;">${c.phone}</td>
          <td style="padding:14px 16px;color:#d97706;font-weight:700;text-align:center;">${bdStr}</td>
          <td style="padding:14px 16px;text-align:center;color:#555;">${c.totalOrders}</td>
          <td style="padding:14px 16px;text-align:right;font-weight:700;color:#059669;">S/ ${(c.totalSpent || 0).toFixed(0)}</td>
          <td style="padding:14px 16px;text-align:center;color:#888;font-size:12px;">${lastOrder}</td>
          <td style="padding:14px 16px;text-align:center;">
            <a href="${waLink}" style="background:#25D366;color:#fff;padding:6px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:700;">💬 WA</a>
          </td>
        </tr>`;
    }).join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:700px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#111827,#1f2937);padding:32px 32px 24px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:40px;">🎂</div>
        <div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;">Alerta de Cumpleaños</h1>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:14px;">Santo Dilema · ${dateStr}</p>
        </div>
      </div>
    </div>

    <!-- Resumen -->
    <div style="padding:24px 32px 0;">
      <div style="background:#fef3c7;border-radius:12px;padding:16px 20px;border-left:4px solid #d97706;">
        <p style="margin:0;color:#92400e;font-size:15px;font-weight:700;">
          ${customers.length === 1
            ? `1 cliente cumple años ${subject?.includes("mañana") ? "mañana" : "hoy"}.`
            : `${customers.length} clientes cumplen años ${subject?.includes("mañana") ? "mañana" : "hoy"}.`
          }
          Envíales un saludo personalizado.
        </p>
      </div>
    </div>

    <!-- Tabla de clientes -->
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 16px;text-align:left;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Nombre</th>
            <th style="padding:10px 16px;text-align:left;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Teléfono</th>
            <th style="padding:10px 16px;text-align:center;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Cumple</th>
            <th style="padding:10px 16px;text-align:center;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Pedidos</th>
            <th style="padding:10px 16px;text-align:right;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Total</th>
            <th style="padding:10px 16px;text-align:center;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Últ. compra</th>
            <th style="padding:10px 16px;text-align:center;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Acción</th>
          </tr>
        </thead>
        <tbody>
          ${customerRows}
        </tbody>
      </table>
    </div>

    <!-- Mensaje WA sugerido -->
    <div style="padding:0 32px 24px;">
      <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e5e7eb;">
        <p style="margin:0 0 10px;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Mensaje de WhatsApp sugerido</p>
        <p style="margin:0;color:#4b5563;font-size:13px;white-space:pre-line;line-height:1.6;">${
          (settings.waTemplate || "Hola {{nombre}}! Feliz cumpleaños desde Santo Dilema!")
            .replace(/{{nombre}}/g, "[nombre del cliente]")
        }</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
        Santo Dilema · Panel Administrativo · Alerta automática de cumpleaños
      </p>
    </div>
  </div>
</body>
</html>`;

    if (preview) {
      return NextResponse.json({ html, recipientEmail });
    }

    await transporter.sendMail({
      from: process.env.BIRTHDAY_EMAIL_FROM || `Santo Dilema <${emailUser}>`,
      to: recipientEmail,
      subject: subject || `🎂 ${customers.length > 1 ? `${customers.length} clientes cumplen` : `${customers[0].name} cumple`} años — Santo Dilema`,
      html,
    });

    // Registrar último envío
    await storage.saveBirthdaySettings({
      ...settings,
      lastAlertSent: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, sentTo: recipientEmail, count: customers.length });
  } catch (err: any) {
    console.error("Error en birthday-alerts POST:", err);
    return NextResponse.json({ error: err.message || "Error al enviar alerta" }, { status: 500 });
  }
}

// PATCH — Guardar configuración de cumpleaños
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const current = await storage.getBirthdaySettings();
    await storage.saveBirthdaySettings({ ...current, ...body });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en birthday-alerts PATCH:", err);
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
