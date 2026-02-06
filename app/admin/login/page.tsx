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
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-black/50 rounded-2xl p-6 border-2 border-fuchsia-500/30 backdrop-blur-sm">
            <h1 className="text-4xl font-black text-fuchsia-400 neon-glow-purple mb-2">
              SANTO DILEMA
            </h1>
            <p className="text-gray-400 text-sm">Panel de Administración</p>
          </div>
        </div>

        {/* Formulario de Login */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border-2 border-fuchsia-500/30 p-8 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-6 text-center">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Usuario */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-fuchsia-500 focus:outline-none transition-all"
                placeholder="Ingresa tu usuario"
                required
                autoFocus
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-fuchsia-500 focus:outline-none transition-all"
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

          {/* Información */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              Acceso restringido solo para administradores
            </p>
          </div>
        </div>

        {/* Nota para desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-xs text-center font-medium">
              DEV: Usuario: admin / Contraseña: santo2024
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
