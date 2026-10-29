"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PedidosLoginPage() {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("pedidos_token", data.token);
        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/pedidos");
        }
      } else {
        setError(data.error || "Credenciales inválidas");
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-black/50 rounded-2xl p-6 border-2 border-orange-500/30 backdrop-blur-sm">
            <div className="flex justify-center mb-3">
              <Image src="/logoprincipal.png" alt="Santo Dilema" width={120} height={60} />
            </div>
            <p className="text-gray-400 text-sm">Gestión de Pedidos</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border-2 border-orange-500/30 p-8 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-6 text-center">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-all"
                placeholder="Ingresa tu usuario"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-all"
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">Acceso para operadores y administradores</p>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 space-y-1">
            <p className="text-yellow-400 text-xs text-center font-medium">
              DEV — Operador: pedidos / santo2026
            </p>
            <p className="text-yellow-600 text-xs text-center">
              Admin: admin / dilema2026 (redirige a /admin)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
