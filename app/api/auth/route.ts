import { NextResponse } from "next/server";

const isProduction = process.env.VERCEL === "1";

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = isProduction
  ? (process.env.ADMIN_PASSWORD ?? "")
  : (process.env.ADMIN_PASSWORD || "dilema2026");

// Operator credentials (solo pedidos)
const OPERATOR_USERNAME = process.env.OPERATOR_USERNAME || "pedidos";
const OPERATOR_PASSWORD = isProduction
  ? (process.env.OPERATOR_PASSWORD ?? "")
  : (process.env.OPERATOR_PASSWORD || "santo2026");

type Role = "admin" | "operator";

// Token format: base64(username:role:timestamp)
// Backwards compat: base64(username:timestamp) → role = "admin"
function decodeToken(token: string): { username: string; role: Role } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const parts = decoded.split(":");
    if (parts.length === 3) {
      const [username, role] = parts;
      if (role !== "admin" && role !== "operator") return null;
      return { username, role: role as Role };
    }
    // Backwards compat: old tokens have 2 parts
    if (parts.length === 2) {
      const [username] = parts;
      if (username === ADMIN_USERNAME) return { username, role: "admin" };
    }
    return null;
  } catch {
    return null;
  }
}

function makeToken(username: string, role: Role): string {
  return Buffer.from(`${username}:${role}:${Date.now()}`).toString("base64");
}

// POST - Login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Usuario y contraseña son requeridos" }, { status: 400 });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        token: makeToken(username, "admin"),
        role: "admin",
        message: "Login exitoso",
      });
    }

    if (username === OPERATOR_USERNAME && password === OPERATOR_PASSWORD) {
      return NextResponse.json({
        success: true,
        token: makeToken(username, "operator"),
        role: "operator",
        message: "Login exitoso",
      });
    }

    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

// GET - Verificar sesión
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify username matches known accounts
    if (
      decoded.username === ADMIN_USERNAME ||
      decoded.username === OPERATOR_USERNAME
    ) {
      return NextResponse.json({
        authenticated: true,
        username: decoded.username,
        role: decoded.role,
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.error("Error verificando sesión:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
