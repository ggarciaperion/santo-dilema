"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar token en localStorage
        localStorage.setItem("admin_token", data.token);
        // Redirigir al panel de administración
        router.push("/admin");
      } else {
        setError(data.error || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1F1] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/3334.png"
            alt="Santo Dilema"
            width={180}
            height={70}
            className="mx-auto object-contain"
            priority
          />
          <p className="text-gray-400 text-xs font-semibold mt-3 uppercase tracking-widest">Panel de Administración</p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Usuario */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-300 focus:border-[#F58424] focus:outline-none transition-all text-sm"
                placeholder="Ingresa tu usuario"
                required
                autoFocus
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-300 focus:border-[#F58424] focus:outline-none transition-all text-sm"
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm text-center font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F58424] hover:bg-orange-600 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Verificando…" : "Ingresar"}
            </button>
          </form>

          {/* Información */}
          <div className="mt-5 text-center">
            <p className="text-gray-300 text-xs">
              Acceso restringido solo para administradores
            </p>
          </div>
        </div>

        {/* Nota para desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-700 text-xs text-center font-medium">
              DEV: Usuario: admin / Contraseña: dilema2026
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
