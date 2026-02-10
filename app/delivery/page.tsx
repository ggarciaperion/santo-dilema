"use client";
// VERSION: 2.5.4 - Método de pago simplificado: contraentrega solo efectivo

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Definiciones de salsas y complementos (igual que en admin)
const salsas: { id: string; name: string }[] = [
  { id: "barbecue", name: "BBQ ahumada" },
  { id: "buffalo-picante", name: "Santo Picante" },
  { id: "ahumada", name: "Acevichada Imperial" },
  { id: "parmesano-ajo", name: "Crispy Celestial" },
  { id: "anticuchos", name: "Parrillera" },
  { id: "honey-mustard", name: "Honey mustard" },
  { id: "teriyaki", name: "Teriyaki" },
  { id: "macerichada", name: "Sweet & Sour" },
];

const generateAvailableComplements = () => {
  const complements: Record<string, { name: string; price: number }> = {
    "agua-mineral": { name: "Agua mineral", price: 4.00 },
    "coca-cola": { name: "Coca Cola 500ml", price: 4.00 },
    "inka-cola": { name: "Inka Cola 500ml", price: 4.00 },
    "sprite": { name: "Sprite 500ml", price: 4.00 },
    "fanta": { name: "Fanta 500ml", price: 4.00 },
    "extra-papas": { name: "Extra papas", price: 4.00 },
    "extra-salsa": { name: "Extra salsa", price: 3.00 },
    "extra-aderezo": { name: "Extra aderezo", price: 3.00 },
    "pollo-grillado": { name: "Pollo grillado", price: 5.00 }
  };

  salsas.forEach(salsa => {
    complements[`extra-salsa-${salsa.id}`] = {
      name: `Extra salsa - ${salsa.name}`,
      price: 3.00
    };
  });

  return complements;
};

const availableComplements = generateAvailableComplements();

interface Order {
  id: string;
  name: string;
  phone: string;
  address: string;
  completedOrders: any[];
  totalPrice: number;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  paymentMethod?: string;
  cantoCancelo?: string;
}

// Componente de contador de tiempo para delivery
function DeliveryTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateElapsed = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      let diff = Math.floor((now - start) / 1000);

      if (diff < 0) diff = 0;

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      setElapsed({ minutes, seconds });
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="inline-flex items-center gap-2 bg-orange-600/30 border-2 border-orange-500/70 rounded-lg px-3 py-2 shadow-lg">
      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-orange-300 font-mono font-black text-lg">
        {String(elapsed.minutes).padStart(2, '0')}:{String(elapsed.seconds).padStart(2, '0')}
      </span>
      <span className="text-orange-400 text-sm font-bold">min</span>
    </div>
  );
}

// PIN por defecto: 1234 (puede ser cambiado desde variables de entorno)
const DELIVERY_PIN = process.env.NEXT_PUBLIC_DELIVERY_PIN || "1234";

export default function DeliveryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);

  // Cargar pedidos en camino
  const loadOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const allOrders = await response.json();

      // Filtrar solo pedidos "en-camino"
      const deliveryOrders = allOrders.filter((order: any) => order.status === "en-camino");
      setOrders(deliveryOrders);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    }
  };

  // Polling cada 5 segundos para actualizar la lista
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      const interval = setInterval(loadOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pin === DELIVERY_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      localStorage.setItem("delivery-auth", "true");
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    if (!confirm("¿Confirmar que el pedido fue entregado?")) {
      return;
    }

    setProcessingOrderId(orderId);

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: "delivered" }),
      });

      if (response.ok) {
        // Reproducir sonido de éxito ANTES de actualizar la lista
        await playSuccessSound();

        // Actualizar lista
        await loadOrders();

        // Mostrar modal de éxito
        setShowSuccessModal(true);

        // Auto-cerrar modal después de 2.5 segundos
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2500);
      } else {
        alert("Error al actualizar el pedido");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const playSuccessSound = async () => {
    try {
      console.log("🔊 [SAFARI] Intentando reproducir sonido de confirmación...");

      // SAFARI: Crear NUEVO AudioContext cada vez para mejor compatibilidad
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      console.log(`🎵 [SAFARI] Estado del AudioContext: ${ctx.state}`);

      // SAFARI: Siempre intentar resume primero
      if (ctx.state === 'suspended') {
        console.log("▶️ [SAFARI] Resumiendo AudioContext suspendido...");
        await ctx.resume();
        console.log("✅ [SAFARI] AudioContext resumido exitosamente");
      }

      // SAFARI: Pequeño delay para asegurar que el contexto está listo
      await new Promise(resolve => setTimeout(resolve, 50));

      const playBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.5) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        oscillator.start(ctx.currentTime + startTime);
        oscillator.stop(ctx.currentTime + startTime + duration);
      };

      // SAFARI: Tonos más agudos ascendentes con mayor volumen
      playBeep(1300, 0, 0.15, 0.6);      // E6
      playBeep(1600, 0.15, 0.2, 0.7);    // G#6
      playBeep(2000, 0.35, 0.3, 0.8);    // B6

      console.log("✅ [SAFARI] Sonido de confirmación reproducido en delivery");
    } catch (error) {
      console.error('❌ Error al reproducir sonido:', error);
    }
  };

  // Verificar autenticación previa
  useEffect(() => {
    const auth = localStorage.getItem("delivery-auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Inicializar AudioContext en primera interacción
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContextInitialized) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          setAudioContext(ctx);
          setAudioContextInitialized(true);
          console.log("✅ AudioContext inicializado");
        } catch (error) {
          console.error("❌ Error al inicializar AudioContext:", error);
        }
      }
    };

    // Inicializar al hacer clic o tocar la pantalla
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);

    return () => {
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };
  }, [audioContextInitialized]);

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-900 border-2 border-blue-500 rounded-xl p-8 max-w-md w-full shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
          </div>

          <h1 className="text-2xl font-black text-white text-center mb-2">
            🚚 Panel de Delivery
          </h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            Ingresa el PIN para acceder
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setPinError(false);
                }}
                placeholder="••••"
                className={`w-full px-6 py-4 rounded-lg bg-gray-800 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 ${
                  pinError ? "ring-2 ring-red-500" : "focus:ring-blue-500"
                }`}
                autoFocus
              />
              {pinError && (
                <p className="text-red-400 text-sm text-center mt-2">
                  ❌ PIN incorrecto
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-4 rounded-lg transition-all transform active:scale-95"
            >
              Ingresar
            </button>
          </form>

          <p className="text-gray-500 text-xs text-center mt-6">
            PIN por defecto: 1234 (configurable)
          </p>
        </div>
      </div>
    );
  }

  // Pantalla principal - Lista de pedidos
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-sm border-b border-blue-500/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <span className="text-blue-400 font-black text-sm">🚚 DELIVERY</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("delivery-auth");
              setIsAuthenticated(false);
              setPin("");
            }}
            className="text-gray-400 hover:text-white text-sm font-bold transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header de pedidos */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white mb-2">
            Pedidos para Entregar
          </h1>
          <p className="text-gray-400 text-sm">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} en camino
          </p>
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">
              No hay pedidos pendientes
            </h3>
            <p className="text-gray-400">
              Los nuevos pedidos aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-900 border-2 border-blue-500/30 rounded-xl overflow-hidden shadow-xl"
              >
                {/* Header del pedido */}
                <div className="bg-blue-500/20 border-b border-blue-500/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 font-black text-lg font-mono">
                      {order.id}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(order.createdAt).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Contador de tiempo */}
                  <div className="mb-3">
                    <DeliveryTimer startTime={order.updatedAt || order.createdAt} />
                  </div>

                  <div className="space-y-1">
                    <p className="text-white font-bold text-lg">📍 {order.name}</p>
                    <p className="text-gray-300 text-sm">📞 {order.phone}</p>
                    <p className="text-gray-300 text-sm">🏠 {order.address}</p>
                  </div>
                </div>

                {/* Productos */}
                <div className="p-4">
                  <h3 className="text-white font-bold mb-3 text-sm uppercase">
                    🍽️ Pedido:
                  </h3>
                  <div className="space-y-2 mb-4">
                    {order.completedOrders.map((item: any, idx: number) => {
                      const itemSalsas = item.salsas || [];
                      const itemComplementIds = item.complementIds || [];

                      let itemTotal = item.price * item.quantity;
                      itemComplementIds.forEach((compId: string) => {
                        const complement = availableComplements[compId];
                        if (complement) {
                          // Los complementos se cobran 1 sola vez, no por cantidad
                          itemTotal += complement.price;
                        }
                      });

                      return (
                        <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-black text-sm">
                                {item.quantity}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-bold">{item.name}</h4>
                              <p className="text-blue-400 font-black text-sm">
                                S/ {itemTotal.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Salsas */}
                          {itemSalsas.length > 0 && (
                            <div className="ml-11 text-xs text-yellow-300 mb-1">
                              <span className="font-bold">🌶️ </span>
                              {itemSalsas.map((salsaId: string) => {
                                const salsa = salsas.find(s => s.id === salsaId);
                                return salsa?.name || salsaId;
                              }).join(', ')}
                            </div>
                          )}

                          {/* Complementos */}
                          {itemComplementIds.length > 0 && (
                            <div className="ml-11 space-y-1">
                              {itemComplementIds.map((compId: string, compIdx: number) => {
                                const complement = availableComplements[compId];
                                if (!complement) return null;
                                return (
                                  <div key={compIdx} className="text-xs text-green-300">
                                    <span className="font-bold">+ </span>
                                    {complement.name}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Nota */}
                  {order.notes && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
                      <p className="text-yellow-300 text-sm font-bold mb-1">⚠️ NOTA:</p>
                      <p className="text-yellow-100 text-sm">{order.notes}</p>
                    </div>
                  )}

                  {/* Total y Botón */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <div>
                      <p className="text-gray-400 text-xs uppercase font-bold">Método de Pago</p>
                      <div className="mt-2 space-y-1">
                        {order.paymentMethod === 'anticipado' && (
                          <div className="bg-green-600/20 border border-green-500 rounded-lg px-3 py-2">
                            <p className="text-green-400 font-black text-sm">✅ PAGADO</p>
                            <p className="text-green-300 text-xs">Yape/Plin (anticipado)</p>
                          </div>
                        )}
                        {order.paymentMethod === 'contraentrega-efectivo-exacto' && (
                          <div className="bg-yellow-600/20 border border-yellow-500 rounded-lg px-3 py-2">
                            <p className="text-yellow-400 font-black text-sm">💵 EFECTIVO EXACTO</p>
                            <p className="text-yellow-300 text-xs">Cliente tiene monto exacto</p>
                            <p className="text-white font-black text-xl mt-1">S/ {order.totalPrice.toFixed(2)}</p>
                          </div>
                        )}
                        {order.paymentMethod === 'contraentrega-efectivo-cambio' && order.cantoCancelo && (
                          <div className="bg-orange-600/20 border border-orange-500 rounded-lg px-3 py-2">
                            <p className="text-orange-400 font-black text-sm">💵 EFECTIVO CON CAMBIO</p>
                            <p className="text-orange-300 text-xs">Cliente cancelará con:</p>
                            <p className="text-white font-black text-2xl mt-1">S/ {parseFloat(order.cantoCancelo).toFixed(2)}</p>
                            <div className="mt-2 pt-2 border-t border-orange-500/30">
                              <p className="text-orange-200 text-xs">Vuelto a entregar:</p>
                              <p className="text-green-400 font-black text-xl">
                                S/ {(parseFloat(order.cantoCancelo) - order.totalPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                        {!order.paymentMethod && (
                          <div className="bg-gray-600/20 border border-gray-500 rounded-lg px-3 py-2">
                            <p className="text-gray-400 font-black text-sm">Contraentrega</p>
                            <p className="text-white font-black text-xl mt-1">S/ {order.totalPrice.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsDelivered(order.id)}
                      disabled={processingOrderId === order.id}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-black px-8 py-4 rounded-lg transition-all transform active:scale-95 disabled:scale-100 shadow-lg"
                    >
                      {processingOrderId === order.id ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          Procesando...
                        </span>
                      ) : (
                        "✓ ENTREGADO"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            La lista se actualiza automáticamente cada 5 segundos
          </p>
        </div>
      </div>

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-green-900 to-emerald-900 border-4 border-green-400 rounded-3xl p-12 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            {/* Check animado */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg
                className="w-full h-full"
                viewBox="0 0 120 120"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Círculo */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="6"
                  className="animate-drawCircle"
                  style={{
                    strokeDasharray: 340,
                    strokeDashoffset: 340,
                    animation: 'drawCircle 0.6s ease-out forwards',
                  }}
                />
                {/* Check */}
                <path
                  d="M 35 60 L 52 77 L 85 44"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-drawCheck"
                  style={{
                    strokeDasharray: 80,
                    strokeDashoffset: 80,
                    animation: 'drawCheck 0.4s ease-out 0.6s forwards',
                  }}
                />
              </svg>
            </div>

            {/* Texto */}
            <h2 className="text-3xl font-black text-white text-center mb-3">
              ¡Entregado!
            </h2>
            <p className="text-green-200 text-center text-lg">
              Pedido confirmado exitosamente
            </p>
          </div>
        </div>
      )}

      {/* Estilos para las animaciones */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
