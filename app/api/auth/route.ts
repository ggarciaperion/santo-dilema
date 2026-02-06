import { NextResponse } from "next/server";

// Usuario maestro (en producción, esto debería estar en variables de entorno)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "santo2024";

// POST - Login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Usuario y contraseña son requeridos" }, { status: 400 });
    }

    // Verificar credenciales
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // En una aplicación real, aquí se crearía un JWT o session token
      // Por simplicidad, retornamos un token simple
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      return NextResponse.json({
        success: true,
        token,
        message: "Login exitoso"
      });
    } else {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }
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

    // Verificación simple del token
    // En producción, aquí verificarías un JWT
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [username] = decoded.split(':');

      if (username === ADMIN_USERNAME) {
        return NextResponse.json({ authenticated: true, username });
      }
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.error("Error verificando sesión:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
