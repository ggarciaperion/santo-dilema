"use client";
// VERSION: 3.0.0 - REDESIGN: Panel de admin simplificado y reorganizado

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

interface Order {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  cart?: any[];
  completedOrders?: any[];
  totalItems?: number;
  totalPrice?: number;
  status: "pending" | "pendiente-verificacion" | "confirmed" | "en-camino" | "delivered" | "cancelled";
  createdAt: string;
  confirmedAt?: string;
  enCaminoAt?: string;
  deliveredAt?: string;
  paymentMethod?: string;
  paymentProofPath?: string;
  comboDiscount?: number;
  couponDiscount?: number;
  deliveryOption?: string;
}

interface Product {
  id: string;
  productId?: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  type: "inventory" | "sale";
  components?: Array<{ productName: string; quantity: number; unit: string }>;
  active: boolean;
  createdAt: string;
}

interface InventoryPurchase {
  id: string;
  supplier: string;
  supplierRuc?: string;
  supplierPhone?: string;
  paymentMethod: string;
  items: Array<{
    productName: string;
    quantity: number;
    unit: string;
    volume: number;
    unitCost: number;
    total: number;
    category?: string;
  }>;
  totalAmount: number;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
}

// ============================================================================
// COMPONENTE: CONTADOR DE TIEMPO
// ============================================================================

function TimeCounter({ createdAt, status }: { createdAt: string; status: string }) {
  const [elapsed, setElapsed] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    if (status === 'cancelled' || status === 'delivered') {
      setShowAlert(false);
      return;
    }

    const updateElapsed = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      let diff = Math.floor((now - created) / 1000);
      if (diff < 0) diff = 0;

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      if (minutes >= 20 && !alerted && (status === 'pending' || status === 'pendiente-verificacion' || status === 'confirmed' || status === 'en-camino')) {
        setShowAlert(true);
        setAlerted(true);
      }

      setElapsed(minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [createdAt, status, alerted]);

  return (
    <div className={`text-sm font-semibold ${showAlert ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
      ⏱️ {elapsed}
      {showAlert && <span className="ml-2 text-xs">¡MÁS DE 20 MIN!</span>}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminPanel() {
  const router = useRouter();

  // ============================================================================
  // ESTADOS PRINCIPALES
  // ============================================================================

  const [activeTab, setActiveTab] = useState<"hoy" | "finanzas" | "historial" | "clientes" | "configuracion">("hoy");
  const [loading, setLoading] = useState(true);

  // Datos
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryPurchase[]>([]);

  // Notificaciones de audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousOrderIdsRef = useRef(new Set<string>());
  const previousOrderStatusRef = useRef(new Map<string, string>());
  const [deliveryToast, setDeliveryToast] = useState<{ orderId: string; customerName: string } | null>(null);

  // ============================================================================
  // FUNCIONES DE AUTENTICACIÓN
  // ============================================================================

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
    }
  }, [router]);

  // ============================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================================================

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      // Detectar nuevos pedidos
      if (previousOrderIdsRef.current.size > 0) {
        const newOrders = data.filter((order: Order) => !previousOrderIdsRef.current.has(order.id));
        if (newOrders.length > 0) {
          playNotificationSound();
        }

        // Detectar pedidos entregados
        const newlyDelivered = data.filter((order: Order) => {
          const previousStatus = previousOrderStatusRef.current.get(order.id);
          return previousStatus !== 'delivered' && previousStatus !== undefined && order.status === 'delivered';
        });

        if (newlyDelivered.length > 0) {
          playDeliveryConfirmSound();
          const firstDelivered = newlyDelivered[0];
          setDeliveryToast({ orderId: firstDelivered.id, customerName: firstDelivered.name || 'Cliente' });
          setTimeout(() => setDeliveryToast(null), 6000);
        }
      }

      previousOrderIdsRef.current = new Set(data.map((o: Order) => o.id));
      previousOrderStatusRef.current = new Map(data.map((o: Order) => [o.id, o.status]));
      setOrders(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    }
  };

  // ============================================================================
  // FUNCIONES DE AUDIO
  // ============================================================================

  const playNotificationSound = () => {
    try {
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);

      setTimeout(() => {
        const osc2 = ctx!.createOscillator();
        const gain2 = ctx!.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx!.destination);
        osc2.frequency.value = 1000;
        gain2.gain.value = 0.3;
        osc2.start(ctx!.currentTime);
        osc2.stop(ctx!.currentTime + 0.2);
      }, 300);
    } catch (error) {
      console.error("Error al reproducir sonido:", error);
    }
  };

  const playDeliveryConfirmSound = () => {
    try {
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
      }

      const playTone = (freq: number, duration: number, delay: number) => {
        setTimeout(() => {
          const osc = ctx!.createOscillator();
          const gain = ctx!.createGain();
          osc.connect(gain);
          gain.connect(ctx!.destination);
          osc.frequency.value = freq;
          gain.gain.value = 0.3;
          osc.start(ctx!.currentTime);
          osc.stop(ctx!.currentTime + duration);
        }, delay);
      };

      playTone(600, 0.15, 0);
      playTone(800, 0.15, 150);
      playTone(1000, 0.3, 300);
    } catch (error) {
      console.error("Error al reproducir sonido de entrega:", error);
    }
  };

  // ============================================================================
  // ACTUALIZACIÓN DE ESTADO DE PEDIDO
  // ============================================================================

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      loadOrders();
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
    }
  };

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadInventory();

    const interval = setInterval(() => {
      loadOrders();
      loadProducts();
      loadInventory();
    }, 10000); // Auto-refresh cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // CÁLCULOS PARA LA PESTAÑA "HOY"
  // ============================================================================

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const todayDelivered = todayOrders.filter(o => o.status === 'delivered');
  const todayRevenue = todayDelivered.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const todayPending = todayOrders.filter(o => o.status === 'pending' || o.status === 'pendiente-verificacion');
  const todayInProgress = todayOrders.filter(o => o.status === 'confirmed' || o.status === 'en-camino');

  // ============================================================================
  // CÁLCULOS PARA FINANZAS (MES ACTUAL)
  // ============================================================================

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthOrders = orders.filter(o => o.createdAt.startsWith(currentMonth) && o.status === 'delivered');
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const monthExpenses = inventory
    .filter(i => i.purchaseDate.startsWith(currentMonth))
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const monthProfit = monthRevenue - monthExpenses;
  const monthMargin = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(1) : '0';

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍗 Santo Dilema</h1>
              <p className="text-sm text-gray-500">Panel de Administración</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("admin_token");
                router.push("/admin/login");
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: "hoy", label: "📦 HOY", count: todayOrders.length },
              { id: "finanzas", label: "💰 FINANZAS", count: null },
              { id: "historial", label: "📊 HISTORIAL", count: orders.length },
              { id: "clientes", label: "👥 CLIENTES", count: null },
              { id: "configuracion", label: "⚙️ CONFIG", count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* DELIVERY TOAST */}
      {deliveryToast && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold">¡Pedido Entregado!</p>
              <p className="text-sm">{deliveryToast.orderId} - {deliveryToast.customerName}</p>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ====================================================================== */}
        {/* PESTAÑA: HOY */}
        {/* ====================================================================== */}

        {activeTab === "hoy" && (
          <div className="space-y-6">

            {/* RESUMEN DEL DÍA */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📅 Resumen del Día - {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Ventas Hoy</div>
                  <div className="text-2xl font-bold text-green-700">S/.{todayRevenue.toFixed(2)}</div>
                  <div className="text-xs text-green-600 mt-1">{todayDelivered.length} entregados</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Total Pedidos</div>
                  <div className="text-2xl font-bold text-blue-700">{todayOrders.length}</div>
                  <div className="text-xs text-blue-600 mt-1">hoy</div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="text-sm text-yellow-600 font-medium">⏳ Pendientes</div>
                  <div className="text-2xl font-bold text-yellow-700">{todayPending.length}</div>
                  <div className="text-xs text-yellow-600 mt-1">por confirmar</div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="text-sm text-orange-600 font-medium">🚚 En Proceso</div>
                  <div className="text-2xl font-bold text-orange-700">{todayInProgress.length}</div>
                  <div className="text-xs text-orange-600 mt-1">confirmados/enviados</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">Ticket Promedio</div>
                  <div className="text-2xl font-bold text-purple-700">
                    S/.{todayDelivered.length > 0 ? (todayRevenue / todayDelivered.length).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">por pedido</div>
                </div>
              </div>
            </div>

            {/* PEDIDOS DEL DÍA */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Pedidos de Hoy</h3>
                <span className="text-sm text-gray-500">Actualización automática cada 10s</span>
              </div>

              {todayOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">📭 No hay pedidos hoy todavía</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayOrders
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((order) => (
                      <div
                        key={order.id}
                        className={`border rounded-lg p-5 ${
                          order.status === 'pending' || order.status === 'pendiente-verificacion'
                            ? 'border-yellow-300 bg-yellow-50'
                            : order.status === 'confirmed' || order.status === 'en-camino'
                            ? 'border-orange-300 bg-orange-50'
                            : order.status === 'delivered'
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">#{order.id}</h4>
                            <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleTimeString('es-PE')}</p>
                          </div>
                          <TimeCounter createdAt={order.createdAt} status={order.status} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Cliente</p>
                            <p className="font-semibold text-gray-900">{order.name}</p>
                            <p className="text-sm text-gray-600">{order.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Dirección</p>
                            <p className="text-sm text-gray-700">{order.address}</p>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Productos:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {order.completedOrders?.map((item, idx) => (
                              <li key={idx}>• {item.name} x{item.quantity}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-2xl font-bold text-gray-900">
                            S/.{(order.totalPrice || 0).toFixed(2)}
                          </div>

                          <div className="flex gap-2">
                            {order.status === 'pending' || order.status === 'pendiente-verificacion' ? (
                              <>
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                                >
                                  ✅ Confirmar
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                  ❌
                                </button>
                              </>
                            ) : order.status === 'confirmed' ? (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'en-camino')}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                              >
                                🚚 En Camino
                              </button>
                            ) : order.status === 'en-camino' ? (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                              >
                                ✅ Entregado
                              </button>
                            ) : order.status === 'delivered' ? (
                              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                                ✅ Completado
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* PESTAÑA: FINANZAS */}
        {/* ====================================================================== */}

        {activeTab === "finanzas" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Resumen Financiero - {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</h2>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 font-medium">📈 Ingresos</div>
                  <div className="text-2xl font-bold text-green-700">S/.{monthRevenue.toFixed(2)}</div>
                  <div className="text-xs text-green-600 mt-1">{monthOrders.length} pedidos</div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="text-sm text-red-600 font-medium">📉 Gastos</div>
                  <div className="text-2xl font-bold text-red-700">S/.{monthExpenses.toFixed(2)}</div>
                  <div className="text-xs text-red-600 mt-1">compras</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">💵 Ganancia</div>
                  <div className="text-2xl font-bold text-blue-700">S/.{monthProfit.toFixed(2)}</div>
                  <div className="text-xs text-blue-600 mt-1">neta</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">📊 Margen</div>
                  <div className="text-2xl font-bold text-purple-700">{monthMargin}%</div>
                  <div className="text-xs text-purple-600 mt-1">promedio</div>
                </div>
              </div>

              <p className="text-center text-gray-500 text-sm">🚧 Detalles de gastos, costos por producto y márgenes en desarrollo...</p>
            </div>
          </div>
        )}

        {/* OTRAS PESTAÑAS EN DESARROLLO */}
        {activeTab !== "hoy" && activeTab !== "finanzas" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">🚧 Sección en desarrollo</p>
              <p className="text-sm">Esta pestaña se está construyendo...</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
