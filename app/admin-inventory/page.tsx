"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InventoryAdminPage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch("/api/inventory-v2/analytics?type=dashboard");
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      // Set default stats if API fails
      setDashboardStats({
        totalItems: 0,
        activeItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        criticalStockItems: 0,
        totalInventoryValue: 0,
        totalPurchasesThisMonth: 0,
        totalWasteThisMonth: 0,
        activeSuppliers: 0,
        expiringItemsNext7Days: 0,
        expiringItemsNext30Days: 0,
        movementsToday: 0,
        movementsThisWeek: 0,
        pendingPurchaseOrders: 0,
        partialPurchaseOrders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-2xl text-fuchsia-400 animate-pulse">
          Cargando sistema de inventario...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black border-b-2 border-fuchsia-500/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-fuchsia-400 neon-glow-purple mb-2">
                🏭 Sistema de Inventario Avanzado
              </h1>
              <p className="text-gray-400">
                Santo Dilema - Control Total de Inventario y Compras
              </p>
            </div>
            <Link
              href="/admin"
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-all border-2 border-gray-700"
            >
              ← Volver al Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="bg-gray-900 border-b-2 border-fuchsia-500/20 sticky top-[88px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: "dashboard", label: "📊 Dashboard" },
              { key: "items", label: "📦 Artículos" },
              { key: "purchases", label: "🛒 Compras" },
              { key: "suppliers", label: "🏢 Proveedores" },
              { key: "movements", label: "📋 Movimientos" },
              { key: "analytics", label: "📈 Analytics" },
              { key: "reorder", label: "🔔 Reorden" },
            ].map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`px-6 py-4 font-bold transition-all whitespace-nowrap ${
                  activeSection === section.key
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500 bg-fuchsia-500/10"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeSection === "dashboard" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-white">Dashboard General</h2>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Artículos"
                value={dashboardStats?.totalItems || 0}
                subtitle={`${dashboardStats?.activeItems || 0} activos`}
                icon="📦"
                color="fuchsia"
              />
              <StatCard
                title="Valor Inventario"
                value={`S/ ${(dashboardStats?.totalInventoryValue || 0).toFixed(2)}`}
                subtitle="Valorización total"
                icon="💰"
                color="green"
              />
              <StatCard
                title="Stock Crítico"
                value={dashboardStats?.criticalStockItems || 0}
                subtitle={`${dashboardStats?.lowStockItems || 0} stock bajo`}
                icon="⚠️"
                color="red"
                alert={dashboardStats?.criticalStockItems > 0}
              />
              <StatCard
                title="Compras Este Mes"
                value={`S/ ${(dashboardStats?.totalPurchasesThisMonth || 0).toFixed(2)}`}
                subtitle={`${dashboardStats?.pendingPurchaseOrders || 0} pendientes`}
                icon="🛒"
                color="cyan"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Mermas del Mes"
                value={`S/ ${(dashboardStats?.totalWasteThisMonth || 0).toFixed(2)}`}
                subtitle="Pérdidas y desperdicios"
                icon="🗑️"
                color="orange"
              />
              <StatCard
                title="Proveedores Activos"
                value={dashboardStats?.activeSuppliers || 0}
                subtitle="Con compras recientes"
                icon="🏢"
                color="purple"
              />
              <StatCard
                title="Movimientos Hoy"
                value={dashboardStats?.movementsToday || 0}
                subtitle={`${dashboardStats?.movementsThisWeek || 0} esta semana`}
                icon="📋"
                color="blue"
              />
            </div>

            {/* Info Section */}
            <div className="bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-pink-500/10 border-2 border-fuchsia-500/30 rounded-xl p-8">
              <h3 className="text-2xl font-black text-fuchsia-400 mb-4">
                🚀 Sistema de Inventario Profesional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    Características Principales
                  </h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>15 unidades de medida (kg, g, l, unidades, paquetes, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>13 categorías de productos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Control de stock con alertas automáticas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Gestión completa de proveedores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Órdenes de compra sofisticadas</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Analytics Avanzado
                  </h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Análisis ABC de productos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Rotación de inventario</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Valorización de stock (FIFO y promedio)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Sugerencias automáticas de reorden</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Seguimiento de lotes y vencimientos</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
                <p className="text-amber-400 font-bold mb-2">📖 Documentación Completa Disponible</p>
                <p className="text-amber-300 text-sm mb-3">
                  Lee la guía completa del sistema en el archivo INVENTORY_SYSTEM_GUIDE.md
                  para conocer todas las funcionalidades, ejemplos de uso de APIs y mejores prácticas.
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://github.com/ggarciaperion/santo-dilema/blob/main/INVENTORY_SYSTEM_GUIDE.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                  >
                    Ver Documentación en GitHub
                  </a>
                </div>
              </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl">🚧</span>
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-2">
                    Interfaz de Usuario en Desarrollo
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Las APIs REST están completamente funcionales. La interfaz de usuario
                    para las secciones de Artículos, Compras, Proveedores, Movimientos y
                    Analytics está en desarrollo y estará disponible próximamente.
                  </p>
                  <p className="text-sm text-gray-400">
                    <strong>Mientras tanto:</strong> Puedes usar las APIs directamente para:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-400">
                    <div>• GET/POST /api/inventory-v2/items</div>
                    <div>• GET/POST /api/inventory-v2/suppliers</div>
                    <div>• GET/POST /api/inventory-v2/purchases</div>
                    <div>• GET/POST /api/inventory-v2/movements</div>
                    <div>• GET /api/inventory-v2/analytics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection !== "dashboard" && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🚧</span>
            <h2 className="text-3xl font-black text-fuchsia-400 mb-4">
              Sección en Desarrollo
            </h2>
            <p className="text-xl text-gray-400 mb-6">
              Esta sección estará disponible próximamente
            </p>
            <p className="text-gray-500">
              Las APIs están funcionando. Puedes usar Postman o similar para probarlas.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// StatCard Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  alert,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  alert?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    fuchsia: "border-fuchsia-500/50 bg-fuchsia-500/5",
    green: "border-green-500/50 bg-green-500/5",
    red: "border-red-500/50 bg-red-500/5",
    cyan: "border-cyan-500/50 bg-cyan-500/5",
    orange: "border-orange-500/50 bg-orange-500/5",
    purple: "border-purple-500/50 bg-purple-500/5",
    blue: "border-blue-500/50 bg-blue-500/5",
  };

  return (
    <div
      className={`rounded-xl border-2 p-6 ${
        colorClasses[color] || colorClasses.fuchsia
      } ${alert ? "animate-pulse" : ""}`}
    >
      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl">{icon}</span>
        <div>
          <p className="text-gray-400 text-sm font-semibold">{title}</p>
        </div>
      </div>
      <p className="text-4xl font-black text-white mb-2">{value}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}
