"use client";
// VERSION: 2.5.3 - FIX: Sonido de entrega confirmada con useRef para status

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Definiciones de salsas y complementos (igual que en checkout)
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
    "extra-papas": { name: "Extra papas", price: 5.00 },
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
  dni?: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
  cart?: any[];
  totalItems?: number;
  totalPrice?: number;
  timestamp?: string;
  status: "pending" | "pendiente-verificacion" | "confirmed" | "en-camino" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  enCaminoAt?: string;
  deliveredAt?: string;
  paymentMethod?: string;
  paymentProofPath?: string;
}

// Componente para el contador de tiempo
function TimeCounter({ createdAt, orderId, status }: { createdAt: string; orderId: string; status: string }) {
  const [elapsed, setElapsed] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    // Si el pedido está cancelado o entregado, detener el contador y cerrar alerta
    if (status === 'cancelled' || status === 'delivered') {
      setShowAlert(false); // Cerrar alerta si está abierta
      return; // No iniciar el interval
    }

    const updateElapsed = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      let diff = Math.floor((now - created) / 1000); // diferencia en segundos

      // Asegurar que no sea negativo (inicia en 0)
      if (diff < 0) {
        diff = 0;
      }

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      // Alerta a los 20 minutos SOLO si el pedido está pendiente o confirmado
      if (minutes >= 20 && !alerted && (status === 'pending' || status === 'pendiente-verificacion' || status === 'confirmed' || status === 'en-camino')) {
        setShowAlert(true);
        setAlerted(true);
      }

      if (minutes > 0) {
        setElapsed(`${minutes}m ${seconds}s`);
      } else {
        setElapsed(`${seconds}s`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [createdAt, alerted, status]);

  return (
    <>
      <span className="font-mono text-lg font-black text-yellow-400">{elapsed}</span>

      {/* Alerta de 20 minutos */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowAlert(false)}>
          <div className="bg-red-600 rounded-xl p-8 max-w-md mx-4 shadow-2xl animate-pulse" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-3xl font-black text-white mb-4">¡ALERTA DE TIEMPO!</h3>
              <p className="text-xl text-white mb-2">
                El pedido <span className="font-mono font-black">#{orderId}</span>
              </p>
              <p className="text-2xl font-black text-yellow-300 mb-6">
                ¡Lleva más de 20 minutos en cola!
              </p>
              <button
                onClick={() => setShowAlert(false)}
                className="bg-white text-red-600 px-8 py-3 rounded-lg font-black text-lg hover:bg-gray-100 transition-all"
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const response = await fetch(`/api/auth?token=${token}`);
        const data = await response.json();

        if (data.authenticated) {
          setIsAuthenticated(true);
          setCheckingAuth(false);
        } else {
          localStorage.removeItem("admin_token");
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  // Helper para obtener fecha/hora en zona horaria de Perú (UTC-5)
  const getPeruDate = (date?: Date | string) => {
    const d = date ? new Date(date) : new Date();
    // Convertir a hora de Perú (UTC-5)
    return new Date(d.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  };

  // Helper para verificar si dos fechas son del mismo día en Perú
  const isSameDayPeru = (date1: Date | string, date2?: Date | string) => {
    const d1 = getPeruDate(date1);
    const d2 = date2 ? getPeruDate(date2) : getPeruDate();

    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Helper para obtener nombre del mes en español
  const getMonthName = (yearMonth: string) => {
    const months = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];
    const [year, month] = yearMonth.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const previousOrderStatusRef = useRef<Map<string, string>>(new Map());
  const [filter, setFilter] = useState<string>("all");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [chartTimeFilter, setChartTimeFilter] = useState<"days" | "weeks" | "months" | "years">("days");
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "customers" | "analytics" | "financial" | "marketing" | "carta">("orders");
  const [menuStock, setMenuStock] = useState<Record<string, boolean>>({});
  const [menuStockSaving, setMenuStockSaving] = useState<string | null>(null);
  const [financialSection, setFinancialSection] = useState<"dashboard" | "purchases" | "products" | "stock">("dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customerSegment, setCustomerSegment] = useState<string>("all");
  const [deliveryToast, setDeliveryToast] = useState<{ orderId: string; customerName: string } | null>(null);
  const [customerSortKey, setCustomerSortKey] = useState<string>("totalOrders");
  const [customerSortDir, setCustomerSortDir] = useState<"asc" | "desc">("desc");
  const [salesDateFrom, setSalesDateFrom] = useState<string>("");
  const [salesDateTo, setSalesDateTo] = useState<string>("");
  const [isSalesDateFiltered, setIsSalesDateFiltered] = useState(false);
  const [salesDateInitialized, setSalesDateInitialized] = useState(false);
  const [dashboardDateFrom, setDashboardDateFrom] = useState<string>("");
  const [dashboardDateTo, setDashboardDateTo] = useState<string>("");
  const [isDashboardDateFiltered, setIsDashboardDateFiltered] = useState(false);
  const [dashboardDateInitialized, setDashboardDateInitialized] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false);
  const [newMaterialForm, setNewMaterialForm] = useState({ productName: "", unit: "" });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", category: "fit", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] as Array<{ productName: string; unit: string; quantity: number }> });
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucherPath, setSelectedVoucherPath] = useState<string>("");
  const [inventoryForm, setInventoryForm] = useState({
    supplier: "",
    supplierRuc: "",
    supplierPhone: "",
    paymentMethod: "plin-yape",
    items: [{ productName: "", quantity: 0, unit: "kg", volume: 0, unitCost: 0, total: 0 }],
    totalAmount: 0,
    purchaseDate: new Date().toISOString().split('T')[0]
  });
  const [promotions, setPromotions] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [promo30Data, setPromo30Data] = useState<any>({ active: true, count: 0, limit: 30, orders: [] });
  const [promoFit30Data, setPromoFit30Data] = useState<any>({ active: true, count: 0, limit: 30, orders: [] });
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [marketingSection, setMarketingSection] = useState<"promotions" | "campaigns" | "loyalty">("promotions");
  const [inventorySection, setInventorySection] = useState<"purchases" | "stock">("purchases");
  const [purchasesSubTab, setPurchasesSubTab] = useState<"history" | "stock">("history"); // Sub-tabs dentro de Compras y Gastos
  const [inventorySearchTerm, setInventorySearchTerm] = useState<string>("");
  const [stockSearchTerm, setStockSearchTerm] = useState<string>("");
  const [stockConsumptions, setStockConsumptions] = useState<Map<string, number>>(new Map());
  const [inventoryDateFilter, setInventoryDateFilter] = useState<string>("");
  const [inventoryMonthFilter, setInventoryMonthFilter] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showInventoryDetailModal, setShowInventoryDetailModal] = useState(false);
  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<any>(null);
  const [showInventoryEditModal, setShowInventoryEditModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipeProduct, setEditingRecipeProduct] = useState<any>(null);
  const [recipeComponents, setRecipeComponents] = useState<Array<{ productName: string; unit: string; quantity: number; cost?: number }>>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingCatalogProduct, setEditingCatalogProduct] = useState<any>(null);
  const [catalogForm, setCatalogForm] = useState({ productId: "", name: "", category: "", unit: "" });
  const [productSearchTerms, setProductSearchTerms] = useState<string[]>([]);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [promotionForm, setPromotionForm] = useState({
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed" | "combo" | "shipping",
    value: 0,
    minAmount: 0,
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    active: true,
    code: "",
    usageLimit: 0,
    targetSegment: "all"
  });

  // Resetear cliente seleccionado cuando cambia el segmento de clientes
  useEffect(() => {
    setSelectedCustomer(null);
  }, [customerSegment]);

  // Inicializar filtro de fechas en Productos de Venta (mes actual por defecto)
  useEffect(() => {
    if (activeTab === "financial" && financialSection === "products" && !salesDateInitialized) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const todayStr = today.toISOString().split('T')[0];
      const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

      setSalesDateFrom(firstDayStr);
      setSalesDateTo(todayStr);
      setIsSalesDateFiltered(true);
      setSalesDateInitialized(true);
    }
  }, [activeTab, financialSection, salesDateInitialized]);

  // Inicializar filtro de fechas en Dashboard (mes actual por defecto)
  useEffect(() => {
    if (activeTab === "financial" && financialSection === "dashboard" && !dashboardDateInitialized) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const todayStr = today.toISOString().split('T')[0];
      const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

      setDashboardDateFrom(firstDayStr);
      setDashboardDateTo(todayStr);
      setIsDashboardDateFiltered(true);
      setDashboardDateInitialized(true);
    }
  }, [activeTab, financialSection, dashboardDateInitialized]);

  // Inicializar AudioContext con interacción del usuario (requerido por navegadores)
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextInitialized) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          setAudioContext(ctx);
          setAudioContextInitialized(true);
          console.log("✅ AudioContext inicializado");
          // Remover listeners después de inicializar
          document.removeEventListener('click', initAudio);
          document.removeEventListener('keydown', initAudio);
        } catch (error) {
          console.error("Error al inicializar AudioContext:", error);
        }
      }
    };

    // Escuchar clicks o teclas para inicializar el audio
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, [audioContextInitialized]);

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadInventory();
    loadDeductions();
    loadPromotions();
    loadCoupons();
    loadPromo30();
    loadPromoFit30();
    loadCatalogProducts();
    loadMenuStock();
    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      loadOrders();
      loadProducts();
      loadInventory();
      loadDeductions();
      loadPromotions();
      loadCoupons();
      loadPromo30();
      loadPromoFit30();
      loadCatalogProducts();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.product-autocomplete')) {
        setActiveDropdownIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      console.log(`📊 [ADMIN] loadOrders - Total pedidos recibidos: ${data.length}`);
      console.log(`📊 [ADMIN] IDs previos guardados: ${previousOrderIdsRef.current.size}`);

      // Detectar NUEVOS pedidos por ID usando useRef (evita stale closure)
      if (previousOrderIdsRef.current.size > 0) {
        const currentIds = new Set(data.map((o: Order) => o.id));
        const newOrders = data.filter((order: Order) => !previousOrderIdsRef.current.has(order.id));

        console.log(`📊 [ADMIN] IDs actuales: ${currentIds.size}`);
        console.log(`📊 [ADMIN] Nuevos pedidos detectados: ${newOrders.length}`);

        if (newOrders.length > 0) {
          console.log(`🔔 [ADMIN] ¡${newOrders.length} pedido(s) NUEVO(S) detectado(s)!`);
          console.log(`🔔 [ADMIN] IDs nuevos:`, newOrders.map(o => o.id));
          console.log(`🔔 [ADMIN] Llamando a playNotificationSound()...`);
          playNotificationSound();
        } else {
          console.log(`✅ [ADMIN] No hay pedidos nuevos (solo actualizaciones)`);
        }

        // Detectar pedidos recién entregados (delivery confirmó entrega) usando useRef
        const newlyDelivered = data.filter((order: Order) => {
          const previousStatus = previousOrderStatusRef.current.get(order.id);
          const isNewlyDelivered = previousStatus !== 'delivered' && previousStatus !== undefined && order.status === 'delivered';

          if (isNewlyDelivered) {
            console.log(`📦 [ADMIN] Pedido ${order.id} cambió: ${previousStatus} → ${order.status}`);
          }

          return isNewlyDelivered;
        });

        if (newlyDelivered.length > 0) {
          console.log(`✅ [ADMIN] ¡${newlyDelivered.length} pedido(s) ENTREGADO(S) por delivery!`);
          console.log(`✅ [ADMIN] IDs entregados:`, newlyDelivered.map(o => o.id));
          console.log(`🔊 [ADMIN] Llamando a playDeliveryConfirmSound()...`);
          playDeliveryConfirmSound();
          // Mostrar toast con el primer pedido entregado detectado
          const firstDelivered = newlyDelivered[0];
          setDeliveryToast({ orderId: firstDelivered.id, customerName: firstDelivered.name || 'Cliente' });
          setTimeout(() => setDeliveryToast(null), 6000);
        }
      } else {
        // Primera carga - solo guardar sin reproducir sonido
        console.log("📋 [ADMIN] Primera carga de pedidos (no reproducir sonido)");
      }

      // Actualizar refs con los datos actuales
      previousOrderIdsRef.current = new Set(data.map((o: Order) => o.id));
      previousOrderStatusRef.current = new Map(data.map((o: Order) => [o.id, o.status]));
      console.log(`💾 [ADMIN] Refs actualizados - IDs: ${previousOrderIdsRef.current.size}, Status: ${previousOrderStatusRef.current.size}`);

      setOrders(data);
    } catch (error) {
      console.error("❌ [ADMIN] Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuStock = async () => {
    try {
      const res = await fetch("/api/menu-stock");
      const data = await res.json();
      setMenuStock(data);
    } catch (error) {
      console.error("Error al cargar menu stock:", error);
    }
  };

  const toggleMenuStock = async (productId: string, currentValue: boolean) => {
    setMenuStockSaving(productId);
    try {
      await fetch("/api/menu-stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, soldOut: !currentValue }),
      });
      setMenuStock((prev) => ({ ...prev, [productId]: !currentValue }));
    } catch (error) {
      console.error("Error al actualizar menu stock:", error);
    } finally {
      setMenuStockSaving(null);
    }
  };

  // Función para reproducir sonido de notificación (2+ segundos)
  const playNotificationSound = () => {
    console.log("🔊 [ADMIN] ═══ playNotificationSound INICIADO ═══");
    try {
      // Usar el audioContext inicializado o crear uno nuevo
      let ctx = audioContext;
      if (!ctx) {
        console.log("📢 [ADMIN] Creando NUEVO AudioContext...");
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        setAudioContextInitialized(true);
        console.log("✅ [ADMIN] AudioContext creado exitosamente");
      } else {
        console.log("✅ [ADMIN] Usando AudioContext existente");
      }

      console.log(`🎵 [ADMIN] Estado del AudioContext: ${ctx.state}`);

      // Resume el contexto si está suspendido (requerido en Chrome/Edge)
      if (ctx.state === 'suspended') {
        console.log("⏸️ [ADMIN] AudioContext está SUSPENDIDO, intentando resume...");
        ctx.resume().then(() => {
          console.log("▶️ [ADMIN] AudioContext RESUMIDO exitosamente");
        });
      }

      // Función para crear un beep con volumen y duración personalizados
      const playBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.4) => {
        const oscillator = ctx!.createOscillator();
        const gainNode = ctx!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx!.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope: fade in y fade out suaves
        gainNode.gain.setValueAtTime(0, ctx!.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx!.currentTime + startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx!.currentTime + startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0.001, ctx!.currentTime + startTime + duration);

        oscillator.start(ctx!.currentTime + startTime);
        oscillator.stop(ctx!.currentTime + startTime + duration);
      };

      // Secuencia de beeps tipo "notificación de pedido" - Duración total: 2.5 segundos
      // Patrón: BEEP-BEEP-BEEEEP (ding-ding-dooong)
      console.log("🎶 [ADMIN] Reproduciendo secuencia de tonos...");
      playBeep(880, 0, 0.3, 0.5);        // Primer tono (La alto)
      playBeep(880, 0.35, 0.3, 0.5);     // Segundo tono (repetición)
      playBeep(1047, 0.75, 0.8, 0.6);    // Tercer tono largo (Do más alto y sostenido)

      // Tono de confirmación final (más suave)
      playBeep(784, 1.6, 0.4, 0.3);      // Cuarto tono (Sol, confirmación suave)

      console.log("✅ [ADMIN] ═══ Sonido de NUEVO PEDIDO reproducido exitosamente ═══");
      console.log(`🎵 [ADMIN] Estado final del AudioContext: ${ctx.state}`);
    } catch (error) {
      console.error("❌ [ADMIN] ERROR al reproducir sonido:", error);
      console.error("❌ [ADMIN] Stack trace:", error);
    }
  };

  const playDeliveryConfirmSound = () => {
    console.log("🚚 [ADMIN] ═══ playDeliveryConfirmSound INICIADO ═══");
    try {
      // Usar el audioContext inicializado o crear uno nuevo
      let ctx = audioContext;
      if (!ctx) {
        console.log("📢 [ADMIN] Creando NUEVO AudioContext para sonido de entrega...");
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        setAudioContextInitialized(true);
        console.log("✅ [ADMIN] AudioContext creado exitosamente");
      } else {
        console.log("✅ [ADMIN] Usando AudioContext existente");
      }

      console.log(`🎵 [ADMIN] Estado del AudioContext: ${ctx.state}`);

      // Resume el contexto si está suspendido
      if (ctx.state === 'suspended') {
        console.log("⏸️ [ADMIN] AudioContext está SUSPENDIDO, intentando resume...");
        ctx.resume().then(() => {
          console.log("▶️ [ADMIN] AudioContext RESUMIDO exitosamente");
        });
      }

      // Función para crear un beep
      const playBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
        const oscillator = ctx!.createOscillator();
        const gainNode = ctx!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx!.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, ctx!.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx!.currentTime + startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.001, ctx!.currentTime + startTime + duration);

        oscillator.start(ctx!.currentTime + startTime);
        oscillator.stop(ctx!.currentTime + startTime + duration);
      };

      // Sonido de confirmación tipo "check" - Patrón ascendente más agudo
      console.log("🎶 [ADMIN] Reproduciendo sonido de ENTREGA CONFIRMADA...");
      playBeep(1300, 0, 0.15, 0.5);      // Mi6
      playBeep(1600, 0.15, 0.2, 0.6);    // Sol#6
      playBeep(2000, 0.35, 0.3, 0.7);    // Si6 (más largo y fuerte)

      console.log("✅ [ADMIN] ═══ Sonido de ENTREGA CONFIRMADA reproducido exitosamente ═══");
      console.log(`🎵 [ADMIN] Estado final del AudioContext: ${ctx.state}`);
    } catch (error) {
      console.error("❌ [ADMIN] ERROR al reproducir sonido de confirmación:", error);
      console.error("❌ [ADMIN] Stack trace:", error);
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

  const loadDeductions = async () => {
    try {
      const response = await fetch("/api/deductions");
      const data = await response.json();
      setDeductions(data);
    } catch (error) {
      console.error("Error al cargar deducciones:", error);
    }
  };

  const loadPromotions = async () => {
    try {
      const response = await fetch("/api/promotions");
      const data = await response.json();
      setPromotions(data);
    } catch (error) {
      console.error("Error al cargar promociones:", error);
    }
  };

  const loadCoupons = async () => {
    try {
      const response = await fetch("/api/coupons");
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      console.error("Error al cargar cupones:", error);
    }
  };

  const loadPromo30 = async () => {
    try {
      const response = await fetch("/api/promo30");
      const data = await response.json();
      setPromo30Data(data);
    } catch (error) {
      console.error("Error al cargar promo30:", error);
    }
  };

  const loadPromoFit30 = async () => {
    try {
      const response = await fetch("/api/promofit30");
      const data = await response.json();
      setPromoFit30Data(data);
    } catch (error) {
      console.error("Error al cargar promoFit30:", error);
    }
  };

  const loadCatalogProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setCatalogProducts(data);
    } catch (error) {
      console.error("Error al cargar catálogo de productos:", error);
    }
  };


  const handleCreateCatalogProduct = async () => {
    try {
      if (!catalogForm.name.trim()) {
        alert("El nombre del producto es requerido");
        return;
      }

      if (!catalogForm.category.trim()) {
        alert("La categoría es requerida");
        return;
      }

      if (!catalogForm.unit.trim()) {
        alert("La unidad de medida es requerida");
        return;
      }

      const isEditing = !!editingCatalogProduct;
      const url = isEditing
        ? `/api/products?id=${editingCatalogProduct.id}`
        : "/api/products";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catalogForm),
      });

      if (response.ok) {
        await loadCatalogProducts();
        setShowCatalogModal(false);
        setCatalogForm({ productId: "", name: "", category: "", unit: "" });
        setEditingCatalogProduct(null);
        alert(isEditing ? "Producto actualizado exitosamente" : "Producto registrado exitosamente");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "No se pudo " + (isEditing ? "actualizar" : "registrar") + " el producto"}`);
      }
    } catch (error) {
      console.error("Error al crear/actualizar producto:", error);
      alert("Error al procesar el producto");
    }
  };

  const handleDeleteCatalogProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto del catálogo?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadCatalogProducts();
        alert("Producto eliminado exitosamente");
      } else {
        alert("Error al eliminar producto");
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("Error al eliminar producto");
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      // Buscar el pedido para obtener su información
      const order = orders.find((o) => o.id === orderId);

      // Si el nuevo estado es "delivered", deducir stock automáticamente
      if (newStatus === "delivered" && order && order.status !== "delivered") {
        await deductStockFromOrder(order);
      }

      await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      loadOrders();
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
    }
  };

  // Función para deducir stock automáticamente cuando se entrega un pedido
  const deductStockFromOrder = async (order: Order) => {
    try {
      // Calcular los componentes/empaques usados
      const itemsToDeduct: Array<{ productName: string; quantity: number; unit: string }> = [];

      // Recorrer los productos del carrito (soportar tanto completedOrders como cart)
      const orderItems = (order as any).completedOrders || order.cart || [];
      orderItems.forEach((cartItem: any) => {
        // Buscar el producto en la lista de productos para obtener su receta
        const itemName = cartItem.name || cartItem.product?.name;
        const product = products.find((p: any) => p.name === itemName);

        if (product && product.components && product.components.length > 0) {
          // Si el producto tiene componentes/receta, calcular cuánto se usó
          product.components.forEach((component: any) => {
            const totalUsed = component.quantity * cartItem.quantity;

            // Buscar si ya existe este componente en la lista
            const existingItem = itemsToDeduct.find(
              (item) => item.productName === component.productName && item.unit === component.unit
            );

            if (existingItem) {
              existingItem.quantity += totalUsed;
            } else {
              itemsToDeduct.push({
                productName: component.productName,
                quantity: totalUsed,
                unit: component.unit
              });
            }
          });
        }
      });

      // Si hay componentes para deducir, registrar la deducción
      if (itemsToDeduct.length > 0) {
        const deduction = {
          orderId: order.id,
          orderName: order.name,
          items: itemsToDeduct,
          deductionDate: new Date().toISOString(),
        };

        // Guardar la deducción en el sistema
        const response = await fetch("/api/deductions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deduction),
        });

        if (response.ok) {
          console.log("✅ Stock deducido automáticamente:", itemsToDeduct);
          // Recargar deducciones para actualizar el stock
          loadDeductions();
        } else {
          console.error("❌ Error al registrar deducción automática");
        }
      } else {
        console.log("ℹ️ No hay componentes configurados para los productos de este pedido");
      }
    } catch (error) {
      console.error("Error al deducir stock:", error);
    }
  };

  // Función para aplicar filtro de fechas
  const applyDateFilter = () => {
    if (dateFrom && dateTo) {
      setIsDateFiltered(true);
      setShowDateModal(false);
    }
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
    setIsDateFiltered(false);
    setShowDateModal(false);
  };

  // Filtrar pedidos según el filtro de fecha
  let dateFilteredOrders = orders;

  if (isDateFiltered && dateFrom && dateTo) {
    // Filtro por rango de fechas personalizado
    dateFilteredOrders = orders.filter((order) => {
      const orderDate = getPeruDate(order.createdAt);
      const fromDate = getPeruDate(dateFrom);
      const toDate = getPeruDate(dateTo);
      toDate.setHours(23, 59, 59, 999);

      return orderDate >= fromDate && orderDate <= toDate;
    });
  } else {
    // Por defecto, solo pedidos de hoy
    dateFilteredOrders = orders.filter((order) => isSameDayPeru(order.createdAt));
  }

  // Filtrar pedidos por estado y búsqueda
  const filteredOrders = dateFilteredOrders.filter((order) => {
    // Filtro por estado
    const statusMatch = filter === "all" || order.status === filter;

    // Filtro de búsqueda en tiempo real
    const searchMatch = searchTerm === "" ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((order as any).completedOrders && (order as any).completedOrders.some((item: any) => {
        const productName = item.product?.name || item.name || '';
        return productName.toLowerCase().includes(searchTerm.toLowerCase());
      })) ||
      (order.cart && order.cart.some((item: any) => {
        const productName = item.product?.name || item.name || '';
        return productName.toLowerCase().includes(searchTerm.toLowerCase());
      }));

    return statusMatch && searchMatch;
  });

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
    "pendiente-verificacion": "bg-purple-500/20 text-purple-400 border-purple-500",
    confirmed: "bg-cyan-500/20 text-cyan-400 border-cyan-500",
    "en-camino": "bg-blue-500/20 text-blue-400 border-blue-500",
    delivered: "bg-green-500/20 text-green-400 border-green-500",
    cancelled: "bg-red-500/20 text-red-400 border-red-500",
  };

  const statusLabels = {
    pending: "Pendiente",
    "pendiente-verificacion": "Por Verificar",
    confirmed: "Confirmado",
    "en-camino": "En Camino",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  // Product CRUD functions
  const handleCreateProduct = async () => {
    try {
      // Siempre marcar como producto de venta (type: "sale") cuando se crea desde Órdenes
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productForm, type: "sale" }),
      });
      loadProducts();
      setShowProductModal(false);
      setProductForm({ name: "", category: "fit", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] });
    } catch (error) {
      console.error("Error al crear producto:", error);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productForm, id: editingProduct.id }),
      });
      loadProducts();
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: "", category: "fit", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] });
    } catch (error) {
      console.error("Error al actualizar producto:", error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      loadProducts();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  // Funciones para configurar recetas
  const openRecipeModal = (product: any) => {
    setEditingRecipeProduct(product);
    setRecipeComponents(product.components || []);
    setShowRecipeModal(true);
  };

  const addRecipeComponent = () => {
    setRecipeComponents([...recipeComponents, { productName: "", unit: "UNIDAD", quantity: 1, cost: 0 }]);
  };

  const updateRecipeComponent = (index: number, field: string, value: any) => {
    const updated = [...recipeComponents];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeComponents(updated);
  };

  const removeRecipeComponent = (index: number) => {
    setRecipeComponents(recipeComponents.filter((_, i) => i !== index));
  };

  const saveRecipe = async () => {
    try {
      if (!editingRecipeProduct) return;

      // Validar que todos los componentes tengan nombre
      const invalidComponents = recipeComponents.filter(c => !c.productName.trim());
      if (invalidComponents.length > 0) {
        alert("Por favor completa todos los nombres de componentes");
        return;
      }

      // Actualizar el producto con la nueva receta
      const response = await fetch(`/api/products?id=${editingRecipeProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components: recipeComponents }),
      });

      if (response.ok) {
        alert("✅ Receta guardada exitosamente!");
        setShowRecipeModal(false);
        setEditingRecipeProduct(null);
        setRecipeComponents([]);
        loadProducts();
      } else {
        alert("Error al guardar la receta");
      }
    } catch (error) {
      console.error("Error al guardar receta:", error);
      alert("Error al guardar la receta");
    }
  };

  const openEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      cost: product.cost,
      active: product.active,
      stock: product.stock || 0,
      minStock: product.minStock || 10,
      maxStock: product.maxStock || 100,
      components: product.components || [],
    });
    setShowProductModal(true);
  };

  // Inventory functions
  const handleCreateInventory = async () => {
    try {
      console.log("📦 Datos a enviar:", inventoryForm);
      console.log("📦 Items a enviar:", inventoryForm.items);
      console.log("📦 Total de items:", inventoryForm.items.length);
      console.log("📦 Detalle de cada item:");
      inventoryForm.items.forEach((item, idx) => {
        console.log(`   Item ${idx + 1}:`, {
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          volume: item.volume,
          unitCost: item.unitCost,
          total: item.total
        });
      });

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inventoryForm),
      });

      console.log("📦 Response status:", response.status);
      console.log("📦 Response ok:", response.ok);

      if (response.ok) {
        const savedData = await response.json();
        console.log("📦 Datos guardados en servidor:", savedData);
        await loadInventory();
        setShowInventoryModal(false);
        setInventoryForm({
          supplier: "",
          supplierRuc: "",
          supplierPhone: "",
          paymentMethod: "plin-yape",
          items: [{ productName: "", quantity: 0, unit: "kg", volume: 0, unitCost: 0, total: 0 }],
          totalAmount: 0,
          purchaseDate: new Date().toISOString().split('T')[0]
        });
        setProductSearchTerms([""]);
        alert("Compra registrada exitosamente");
      } else {
        const errorData = await response.json();
        console.error("❌ Error al registrar compra:", errorData);
        alert("Error al registrar la compra. Por favor, intenta de nuevo.");
      }
    } catch (error) {
      console.error("❌ Error de conexión:", error);
      alert("Error de conexión. Por favor, intenta de nuevo.");
    }
  };

  const handleDeleteInventory = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;
    try {
      await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
      loadInventory();
    } catch (error) {
      console.error("Error al eliminar compra:", error);
    }
  };

  const addInventoryItem = () => {
    setInventoryForm({
      ...inventoryForm,
      items: [...inventoryForm.items, { productName: "", quantity: 0, unit: "kg", volume: 0, unitCost: 0, total: 0 }]
    });
    setProductSearchTerms([...productSearchTerms, ""]);
  };

  const removeInventoryItem = (index: number) => {
    const newItems = inventoryForm.items.filter((_, i) => i !== index);
    const newSearchTerms = productSearchTerms.filter((_, i) => i !== index);
    setInventoryForm({ ...inventoryForm, items: newItems });
    setProductSearchTerms(newSearchTerms);
  };

  const updateInventoryItem = (index: number, field: string, value: any) => {
    const newItems = [...inventoryForm.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate unit cost (Costo total / (Cantidad × Volumen))
    if (field === 'quantity' || field === 'unitCost' || field === 'volume') {
      const quantity = newItems[index].quantity || 0;
      const volume = newItems[index].volume || 1;
      const totalUnits = quantity * volume;

      if (totalUnits > 0) {
        newItems[index].total = newItems[index].unitCost / totalUnits;
      } else {
        newItems[index].total = 0;
      }
    }

    // Calculate total amount
    const totalAmount = newItems.reduce((sum, item) => sum + item.unitCost, 0);

    setInventoryForm({ ...inventoryForm, items: newItems, totalAmount });
  };

  // Promotion CRUD functions
  const handleCreatePromotion = async () => {
    try {
      await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promotionForm),
      });
      loadPromotions();
      setShowPromotionModal(false);
      resetPromotionForm();
    } catch (error) {
      console.error("Error al crear promoción:", error);
    }
  };

  const handleUpdatePromotion = async () => {
    try {
      await fetch("/api/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...promotionForm, id: editingPromotion.id }),
      });
      loadPromotions();
      setShowPromotionModal(false);
      setEditingPromotion(null);
      resetPromotionForm();
    } catch (error) {
      console.error("Error al actualizar promoción:", error);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta promoción?")) return;
    try {
      await fetch(`/api/promotions?id=${id}`, { method: "DELETE" });
      loadPromotions();
    } catch (error) {
      console.error("Error al eliminar promoción:", error);
    }
  };

  const openEditPromotion = (promo: any) => {
    setEditingPromotion(promo);
    setPromotionForm({
      name: promo.name,
      description: promo.description,
      type: promo.type,
      value: promo.value,
      minAmount: promo.minAmount || 0,
      applicableProducts: promo.applicableProducts || [],
      applicableCategories: promo.applicableCategories || [],
      startDate: promo.startDate.split('T')[0],
      endDate: promo.endDate.split('T')[0],
      active: promo.active,
      code: promo.code || "",
      usageLimit: promo.usageLimit || 0,
      targetSegment: promo.targetSegment || "all"
    });
    setShowPromotionModal(true);
  };

  const resetPromotionForm = () => {
    setPromotionForm({
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      minAmount: 0,
      applicableProducts: [],
      applicableCategories: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      active: true,
      code: "",
      usageLimit: 0,
      targetSegment: "all"
    });
  };

  // Agrupar pedidos por cliente (DNI) - con filtro de fechas
  const getCustomersData = () => {
    const customersMap = new Map();

    // Usar pedidos filtrados por fecha
    const ordersToProcess = isDateFiltered && dateFrom && dateTo
      ? orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          const fromDate = new Date(dateFrom);
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          return orderDate >= fromDate && orderDate <= toDate;
        })
      : orders;

    ordersToProcess.forEach((order: any) => {
      const dni = order.dni;
      if (!dni) return;

      // Solo contabilizar pedidos entregados
      const isDelivered =
        order.status === "delivered" ||
        order.status === "Entregado" ||
        order.status?.toLowerCase() === "entregado";

      if (!isDelivered) {
        // No procesar pedidos que no están entregados
        return;
      }

      if (!customersMap.has(dni)) {
        customersMap.set(dni, {
          dni: dni,
          name: order.name,
          phone: order.phone,
          address: order.address,
          email: order.email || "",
          orders: [],
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt,
        });
      }

      const customer = customersMap.get(dni);
      customer.orders.push(order);
      customer.totalOrders += 1;
      customer.totalSpent += order.totalPrice || 0;

      // Actualizar última orden si es más reciente
      if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt;
        customer.name = order.name;
        customer.phone = order.phone;
        customer.address = order.address;
        customer.email = order.email || "";
      }
    });

    return Array.from(customersMap.values()).sort((a, b) => b.totalOrders - a.totalOrders);
  };

  const allCustomers = getCustomersData();

  // Segmentación avanzada de clientes
  const getCustomerSegments = () => {
    const now = getPeruDate(); // Usar hora de Perú
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Obtener primer y último día del mes actual en Perú
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Obtener primer y último día del mes pasado en Perú
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return {
      all: allCustomers,

      // VIP: Mejores clientes del mes pasado (5+ pedidos O S/ 200+ gastados en el mes pasado)
      vip: allCustomers.filter((c: any) => {
        if (!c.orders || c.orders.length === 0) return false;
        const lastMonthOrders = c.orders.filter((order: any) => {
          const isDelivered =
            order.status === "delivered" ||
            order.status === "Entregado" ||
            order.status?.toLowerCase() === "entregado";
          if (!isDelivered) return false;
          const orderDate = getPeruDate(order.createdAt);
          return orderDate >= firstDayOfLastMonth && orderDate <= lastDayOfLastMonth;
        });
        const lastMonthSpent = lastMonthOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
        return lastMonthOrders.length >= 5 || lastMonthSpent >= 200;
      }),

      // NUEVOS: Primer pedido en el mes actual
      new: allCustomers.filter((c: any) => {
        if (!c.orders || c.orders.length === 0) return false;
        // Filtrar solo pedidos entregados
        const deliveredOrders = c.orders.filter((order: any) =>
          order.status === "delivered" ||
          order.status === "Entregado" ||
          order.status?.toLowerCase() === "entregado"
        );
        if (deliveredOrders.length === 0) return false;
        // Encontrar el primer pedido entregado del cliente
        const firstOrder = deliveredOrders.reduce((earliest: any, order: any) => {
          return new Date(order.createdAt) < new Date(earliest.createdAt) ? order : earliest;
        });
        const firstOrderDate = getPeruDate(firstOrder.createdAt);
        return firstOrderDate >= firstDayOfCurrentMonth && firstOrderDate <= lastDayOfCurrentMonth;
      }),

      // ACTIVOS: Al menos un pedido en el mes actual
      active: allCustomers.filter((c: any) => {
        if (!c.orders || c.orders.length === 0) return false;
        const currentMonthOrders = c.orders.filter((order: any) => {
          const isDelivered =
            order.status === "delivered" ||
            order.status === "Entregado" ||
            order.status?.toLowerCase() === "entregado";
          if (!isDelivered) return false;
          const orderDate = getPeruDate(order.createdAt);
          return orderDate >= firstDayOfCurrentMonth && orderDate <= lastDayOfCurrentMonth;
        });
        return currentMonthOrders.length >= 1;
      }),

      // RECURRENTES: Al menos 4 pedidos en el mes pasado
      recurrent: allCustomers.filter((c: any) => {
        if (!c.orders || c.orders.length < 4) return false;
        const lastMonthOrders = c.orders.filter((order: any) => {
          const isDelivered =
            order.status === "delivered" ||
            order.status === "Entregado" ||
            order.status?.toLowerCase() === "entregado";
          if (!isDelivered) return false;
          const orderDate = getPeruDate(order.createdAt);
          return orderDate >= firstDayOfLastMonth && orderDate <= lastDayOfLastMonth;
        });
        return lastMonthOrders.length >= 4;
      }),

      // INACTIVOS: Más de 15 días sin comprar
      inactive: allCustomers.filter((c: any) => {
        const lastOrder = getPeruDate(c.lastOrderDate);
        return lastOrder < fifteenDaysAgo;
      }),

      // EMAIL PENDIENTE: Clientes sin email registrado
      email_pending: allCustomers.filter((c: any) => !c.email || c.email.trim() === ""),
    };
  };

  const customerSegments = getCustomerSegments();
  const segmentCustomers = customerSegments[customerSegment as keyof typeof customerSegments] || allCustomers;

  // Filtrar clientes por búsqueda en tiempo real
  const customers = segmentCustomers.filter((customer: any) => {
    if (customerSearchTerm === "") return true;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.dni?.toLowerCase().includes(searchLower) ||
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(customerSearchTerm) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower)
    );
  });

  // Analytics - con filtro de fechas
  const getAnalytics = () => {
    const now = getPeruDate();

    // Filtrar solo pedidos entregados
    let deliveredOrders = orders.filter((order: any) =>
      order.status === "delivered" ||
      order.status === "Entregado" ||
      order.status?.toLowerCase() === "entregado"
    );

    // Si hay filtro de fechas aplicado, filtrar por ese rango
    if (isDateFiltered && dateFrom && dateTo) {
      const filterStart = new Date(dateFrom + "T00:00:00");
      const filterEnd = new Date(dateTo + "T23:59:59");

      deliveredOrders = deliveredOrders.filter((order: any) => {
        const orderDate = getPeruDate(order.createdAt);
        return orderDate >= filterStart && orderDate <= filterEnd;
      });
    }

    // Definir rangos de fechas
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. VENTAS DEL DÍA - Importe S/ del día en curso
    const todayOrders = deliveredOrders.filter((order: any) => {
      const orderDate = getPeruDate(order.createdAt);
      return orderDate >= startOfToday && orderDate <= endOfToday;
    });
    const dailySales = todayOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

    // 2. VENTAS DEL MES - Importe S/ del mes en curso
    const currentMonthOrders = deliveredOrders.filter((order: any) => {
      const orderDate = getPeruDate(order.createdAt);
      return orderDate >= firstDayOfCurrentMonth && orderDate <= lastDayOfCurrentMonth;
    });
    const monthlySales = currentMonthOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

    // 3. VENTAS DEL MES ANTERIOR - Para comparación
    const lastMonthOrders = deliveredOrders.filter((order: any) => {
      const orderDate = getPeruDate(order.createdAt);
      return orderDate >= firstDayOfLastMonth && orderDate <= lastDayOfLastMonth;
    });
    const lastMonthSales = lastMonthOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

    // PORCENTAJE DE AVANCE - Mes actual sobre mes anterior
    const progressPercentage = lastMonthSales > 0 ? (monthlySales / lastMonthSales) * 100 : 0;

    // 4. TICKET PROMEDIO - Promedio del mes anterior
    const lastMonthAverageTicket = lastMonthOrders.length > 0
      ? lastMonthSales / lastMonthOrders.length
      : 0;

    // 5. INGRESOS TOTALES - Desde el día uno
    const totalRevenue = deliveredOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

    // NUEVO: Productos vendidos en el MES ACTUAL (ordenados de mayor a menor)
    const currentMonthProductSales = new Map();
    currentMonthOrders.forEach((order: any) => {
      const orderItems = order.completedOrders || order.cart || [];
      const couponFactor = 1 - (order.couponDiscount || 0) / 100;
      if (orderItems.length > 0) {
        orderItems.forEach((item: any) => {
          const productId = item.productId || item.product?.id;
          const productName = item.name || item.product?.name;
          const productPrice = (item.finalPrice ?? item.price ?? item.product?.price ?? 0) * couponFactor;
          const quantity = item.quantity;

          if (currentMonthProductSales.has(productId)) {
            const existing = currentMonthProductSales.get(productId);
            existing.quantity += quantity;
            existing.revenue += productPrice * quantity;
          } else {
            currentMonthProductSales.set(productId, {
              id: productId,
              name: productName,
              quantity: quantity,
              revenue: productPrice * quantity,
              category: item.category || item.product?.category
            });
          }
        });
      }
    });
    const currentMonthProductsArray = Array.from(currentMonthProductSales.values()).sort((a, b) => b.quantity - a.quantity);

    // Productos vendidos de TODOS LOS TIEMPOS (para mantener compatibilidad con otros componentes)
    const productSales = new Map();
    deliveredOrders.forEach((order: any) => {
      const orderItems = order.completedOrders || order.cart || [];
      const couponFactor = 1 - (order.couponDiscount || 0) / 100;
      if (orderItems.length > 0) {
        orderItems.forEach((item: any) => {
          const productId = item.productId || item.product?.id;
          const productName = item.name || item.product?.name;
          const productPrice = (item.finalPrice ?? item.price ?? item.product?.price ?? 0) * couponFactor;
          const quantity = item.quantity;

          if (productSales.has(productId)) {
            const existing = productSales.get(productId);
            existing.quantity += quantity;
            existing.revenue += productPrice * quantity;
          } else {
            productSales.set(productId, {
              name: productName,
              quantity: quantity,
              revenue: productPrice * quantity,
              category: item.category || item.product?.category
            });
          }
        });
      }
    });

    const productsArray = Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity);

    // NUEVO: Ranking de los 5 días con más órdenes del mes anterior
    const dayOrdersMap = new Map<string, number>();
    lastMonthOrders.forEach((order: any) => {
      const orderDate = getPeruDate(order.createdAt);
      const dayKey = orderDate.toLocaleDateString("es-PE"); // Formato: dd/mm/yyyy
      dayOrdersMap.set(dayKey, (dayOrdersMap.get(dayKey) || 0) + 1);
    });
    const topDaysLastMonth = Array.from(dayOrdersMap.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // NUEVO: Productos del mes anterior CON COMPARACIÓN vs mes actual
    const lastMonthProductSales = new Map();
    lastMonthOrders.forEach((order: any) => {
      const orderItems = order.completedOrders || order.cart || [];
      const couponFactor = 1 - (order.couponDiscount || 0) / 100;
      if (orderItems.length > 0) {
        orderItems.forEach((item: any) => {
          const productId = item.productId || item.product?.id;
          const productName = item.name || item.product?.name;
          const productPrice = (item.finalPrice ?? item.price ?? item.product?.price ?? 0) * couponFactor;
          const quantity = item.quantity;

          if (lastMonthProductSales.has(productId)) {
            const existing = lastMonthProductSales.get(productId);
            existing.quantity += quantity;
            existing.revenue += productPrice * quantity;
          } else {
            lastMonthProductSales.set(productId, {
              id: productId,
              name: productName,
              quantity: quantity,
              revenue: productPrice * quantity,
              category: item.category || item.product?.category
            });
          }
        });
      }
    });

    const lastMonthProductsArray = Array.from(lastMonthProductSales.values()).sort((a, b) => b.quantity - a.quantity);

    // Crear mapas de posiciones para comparación
    const lastMonthPositions = new Map();
    lastMonthProductsArray.forEach((product: any, index) => {
      lastMonthPositions.set(product.id, index + 1);
    });

    const currentMonthPositions = new Map();
    currentMonthProductsArray.forEach((product: any, index) => {
      currentMonthPositions.set(product.id, index + 1);
    });

    // Agregar comparación a productos del mes anterior
    const lastMonthProductsWithComparison = lastMonthProductsArray.map((product: any) => {
      const lastMonthPos = lastMonthPositions.get(product.id);
      const currentMonthPos = currentMonthPositions.get(product.id);

      let trend = "new"; // Producto nuevo (no estaba en mes actual)
      let positionChange = 0;

      if (currentMonthPos !== undefined) {
        // Comparar posiciones: si bajó el número de posición = subió en ranking (mejor)
        positionChange = lastMonthPos - currentMonthPos;
        if (positionChange > 0) {
          trend = "up"; // Subió en el ranking
        } else if (positionChange < 0) {
          trend = "down"; // Bajó en el ranking
        } else {
          trend = "same"; // Se mantuvo
        }
      }

      // Diferencia de ventas
      const lastMonthQuantity = product.quantity;
      const currentMonthProduct = currentMonthProductSales.get(product.id);
      const currentMonthQuantity = currentMonthProduct?.quantity || 0;
      const salesDifference = currentMonthQuantity - lastMonthQuantity;

      return {
        ...product,
        trend,
        positionChange: Math.abs(positionChange),
        salesDifference,
        lastMonthQuantity,
        currentMonthQuantity
      };
    });

    const topProductLastMonth = lastMonthProductsArray[0] || null;
    const leastProductLastMonth = lastMonthProductsArray[lastMonthProductsArray.length - 1] || null;

    // Órdenes del día (solo entregadas)
    const todayDeliveredOrders = deliveredOrders.filter((order: any) => {
      const orderDate = getPeruDate(order.createdAt);
      return orderDate >= startOfToday && orderDate <= endOfToday;
    });

    // Progreso de órdenes: mes actual vs mes anterior
    const ordersProgressPercentage = lastMonthOrders.length > 0
      ? (currentMonthOrders.length / lastMonthOrders.length) * 100
      : 0;

    // Clientes frecuentes (solo con pedidos entregados, 3+ pedidos)
    const frequentCustomers = allCustomers.filter((c: any) => c.totalOrders >= 3);

    // Clientes inactivos (más de 15 días sin comprar)
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const inactiveCustomers = allCustomers.filter((c: any) =>
      getPeruDate(c.lastOrderDate) < fifteenDaysAgo
    );

    // Ticket promedio del día
    const todayAverageTicket = todayDeliveredOrders.length > 0
      ? dailySales / todayDeliveredOrders.length
      : 0;

    // DATOS ADICIONALES ÚTILES

    // 1. Método de pago más usado
    const paymentMethodCount = new Map<string, number>();
    currentMonthOrders.forEach((order: any) => {
      const method = order.paymentMethod || 'No especificado';
      paymentMethodCount.set(method, (paymentMethodCount.get(method) || 0) + 1);
    });
    const paymentMethodsArray = Array.from(paymentMethodCount.entries())
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);
    const mostUsedPaymentMethod = paymentMethodsArray[0] || { method: 'Sin datos', count: 0 };

    // 2. Horarios pico - Análisis por hora del día
    const hourlyOrders = new Map<number, number>();
    currentMonthOrders.forEach((order: any) => {
      const orderDate = getPeruDate(order.createdAt);
      const hour = orderDate.getHours();
      hourlyOrders.set(hour, (hourlyOrders.get(hour) || 0) + 1);
    });
    const peakHourData = Array.from(hourlyOrders.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)[0];
    const peakHour = peakHourData ? `${peakHourData.hour}:00 - ${peakHourData.hour + 1}:00` : 'Sin datos';
    const peakHourCount = peakHourData?.count || 0;

    // 3. Complementos/extras más vendidos - TODOS, agrupados por categoría
    const complementSales = new Map<string, { id: string; name: string; count: number; revenue: number; category: string }>();
    currentMonthOrders.forEach((order: any) => {
      const orderItems = order.completedOrders || order.cart || [];
      orderItems.forEach((item: any) => {
        const complementIds = item.complementIds || [];
        complementIds.forEach((compId: string) => {
          const complement = availableComplements[compId];
          if (complement) {
            // Determinar categoría
            let category = 'Otros';
            if (compId.startsWith('extra-salsa-')) {
              category = 'Salsas';
            } else if (['agua-mineral', 'coca-cola', 'inka-cola', 'sprite', 'fanta'].includes(compId)) {
              category = 'Bebidas';
            } else if (['extra-papas', 'extra-salsa', 'extra-aderezo', 'pollo-grillado'].includes(compId)) {
              category = 'Extras';
            }

            if (complementSales.has(compId)) {
              const existing = complementSales.get(compId)!;
              existing.count += 1;
              existing.revenue += complement.price;
            } else {
              complementSales.set(compId, {
                id: compId,
                name: complement.name,
                count: 1,
                revenue: complement.price,
                category
              });
            }
          }
        });
      });
    });

    const allComplements = Array.from(complementSales.values()).sort((a, b) => b.count - a.count);
    const mostSoldComplement = allComplements[0] || { name: 'Sin datos', count: 0, revenue: 0 };

    // Agrupar por categoría
    const complementsByCategory = {
      'Bebidas': allComplements.filter(c => c.category === 'Bebidas'),
      'Extras': allComplements.filter(c => c.category === 'Extras'),
      'Salsas': allComplements.filter(c => c.category === 'Salsas'),
      'Otros': allComplements.filter(c => c.category === 'Otros')
    };

    // Lista de IDs de bebidas conocidas
    const beverageIds = ['agua-mineral', 'coca-cola', 'inka-cola', 'sprite', 'fanta'];

    // 4a. Menús del día (excluyendo items sin nombre válido)
    const menuSalesToday = new Map<string, { name: string; quantity: number }>();
    todayOrders.forEach((order: any) => {
      const orderItems = order.completedOrders || order.cart || [];
      orderItems.forEach((item: any) => {
        const productName = (item.name || item.product?.name || '').trim();
        if (!productName) return; // Omitir items sin nombre
        const quantity = item.quantity || 0;
        if (quantity <= 0) return;

        if (menuSalesToday.has(productName)) {
          menuSalesToday.get(productName)!.quantity += quantity;
        } else {
          menuSalesToday.set(productName, { name: productName, quantity });
        }
      });
    });
    const menusSoldToday = Array.from(menuSalesToday.values()).sort((a, b) => b.quantity - a.quantity);

    // 4b. Bebidas vendidas hoy (de los complementIds)
    const beverageSalesToday = new Map<string, { name: string; quantity: number }>();
    todayOrders.forEach((order: any) => {
      const orderItems = order.completedOrders || order.cart || [];
      orderItems.forEach((item: any) => {
        const complementIds: string[] = item.complementIds || [];
        complementIds.forEach((compId: string) => {
          if (beverageIds.includes(compId)) {
            const bev = availableComplements[compId];
            if (!bev) return;
            if (beverageSalesToday.has(compId)) {
              beverageSalesToday.get(compId)!.quantity += 1;
            } else {
              beverageSalesToday.set(compId, { name: bev.name, quantity: 1 });
            }
          }
        });
      });
    });
    const beveragesSoldToday = Array.from(beverageSalesToday.values()).sort((a, b) => b.quantity - a.quantity);

    // 5. Tasa de conversión (pedidos confirmados vs totales)
    const confirmedOrders = orders.filter((o: any) =>
      o.status === "confirmed" ||
      o.status === "en-camino" ||
      o.status === "delivered"
    );
    const conversionRate = orders.length > 0 ? (confirmedOrders.length / orders.length) * 100 : 0;

    return {
      dailySales,
      monthlySales,
      lastMonthSales,
      progressPercentage,
      lastMonthAverageTicket,
      todayAverageTicket,
      totalRevenue,
      topProducts: productsArray.slice(0, 5),
      leastSoldProducts: productsArray.slice(-5).reverse(),
      allProducts: productsArray,
      currentMonthOrdersCount: currentMonthOrders.length,
      lastMonthOrdersCount: lastMonthOrders.length,
      frequentCustomers,
      inactiveCustomers,
      topDaysLastMonth,
      topProductLastMonth,
      leastProductLastMonth,
      currentMonthProductsArray,
      lastMonthProductsWithComparison,
      todayDeliveredOrdersCount: todayDeliveredOrders.length,
      ordersProgressPercentage,
      // Datos adicionales
      mostUsedPaymentMethod,
      paymentMethodsArray,
      peakHour,
      peakHourCount,
      mostSoldComplement,
      allComplements,
      complementsByCategory,
      conversionRate,
      menusSoldToday,
      beveragesSoldToday
    };
  };

  const analytics = getAnalytics();

  // Generar datos para la gráfica de órdenes entregadas en línea de tiempo
  const getChartData = () => {
    const deliveredOrders = orders.filter((order: any) =>
      order.status === "delivered" ||
      order.status === "Entregado" ||
      order.status?.toLowerCase() === "entregado"
    );

    const dataMap = new Map<string, number>();

    deliveredOrders.forEach((order: any) => {
      const orderDate = getPeruDate(order.createdAt);
      let key = "";

      if (chartTimeFilter === "days") {
        // Agrupar por día (últimos 30 días)
        key = orderDate.toLocaleDateString("es-PE");
      } else if (chartTimeFilter === "weeks") {
        // Agrupar por semana (últimas 12 semanas)
        const weekStart = new Date(orderDate);
        weekStart.setDate(orderDate.getDate() - orderDate.getDay());
        key = weekStart.toLocaleDateString("es-PE");
      } else if (chartTimeFilter === "months") {
        // Agrupar por mes
        key = `${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
      } else if (chartTimeFilter === "years") {
        // Agrupar por año
        key = orderDate.getFullYear().toString();
      }

      dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });

    // Convertir a array y ordenar
    const chartData = Array.from(dataMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => {
        if (chartTimeFilter === "years") {
          return parseInt(a.label) - parseInt(b.label);
        }
        return 0; // Para días, semanas y meses mantener orden
      });

    return chartData;
  };

  const chartData = getChartData();

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (el useEffect redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Toast de pedido entregado */}
      {deliveryToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-900 border border-green-500 rounded-xl px-5 py-4 shadow-2xl max-w-xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="text-green-300 text-xs font-bold uppercase tracking-wider mb-0.5">Pedido entregado</p>
              <p className="text-white font-black text-base">#{deliveryToast.orderId}</p>
              <p className="text-green-400 text-sm font-medium">{deliveryToast.customerName}</p>
            </div>
            <button onClick={() => setDeliveryToast(null)} className="text-green-500 hover:text-white text-sm leading-none mt-0.5">✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b-2 border-fuchsia-500 neon-border-purple">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.jpg"
                alt="Santo Dilema"
                width={60}
                height={60}
                className="rounded-full neon-border-purple"
              />
              <div>
                <h1 className="text-4xl font-black text-fuchsia-400 neon-glow-purple">
                  Panel de Administración
                </h1>
                <p className="text-amber-400 mt-1 gold-glow">Santo Dilema - Gestión de Pedidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                title="Cerrar Sesión"
              >
                🚪 Salir
              </button>
              <Link
                href="/"
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-lg font-bold transition-all neon-border-purple transform hover:scale-105"
              >
                ← Volver al Sitio
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <section className="container mx-auto px-4 pt-6">
        <div className="flex gap-2 border-b-2 border-fuchsia-500/30">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "orders"
                ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            📦 Gestión de Pedidos
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "customers"
                ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            👥 Base de Clientes
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "analytics"
                ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            📊 Analytics & CRM
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "financial"
                ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            💰 Financiero
          </button>
          <button
            onClick={() => setActiveTab("marketing")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "marketing"
                ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            🎯 Marketing
          </button>
          <button
            onClick={() => setActiveTab("carta")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "carta"
                ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            🍽️ Carta
          </button>
        </div>
      </section>

      {activeTab === "orders" ? (
        <>
          {/* Stats - Solo pedidos de HOY en hora de Perú */}
          <section className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-5 gap-3">
              <button
                onClick={() => setFilter("all")}
                className={`bg-gray-900 rounded-xl border-2 p-3 transition-all hover:scale-105 cursor-pointer ${
                  filter === "all"
                    ? "border-fuchsia-500 neon-border-purple shadow-xl"
                    : "border-fuchsia-500/30 hover:border-fuchsia-500/60"
                }`}
              >
                <p className="text-gray-400 text-xs font-semibold text-left leading-tight">
                  Total {isDateFiltered ? "(Filtrado)" : "(Hoy)"}
                </p>
                <p className="text-3xl font-black text-white mt-1 text-left">{dateFilteredOrders.length}</p>
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`bg-gray-900 rounded-xl border-2 p-3 transition-all hover:scale-105 cursor-pointer ${
                  filter === "pending"
                    ? "border-yellow-500 shadow-xl shadow-yellow-500/50"
                    : "border-yellow-500/50 hover:border-yellow-500"
                }`}
              >
                <p className="text-yellow-400 text-xs font-bold text-left">Pendientes</p>
                <p className="text-3xl font-black text-yellow-400 mt-1 text-left">
                  {dateFilteredOrders.filter((o) => o.status === "pending").length}
                </p>
              </button>
              <button
                onClick={() => setFilter("confirmed")}
                className={`bg-gray-900 rounded-xl border-2 p-3 transition-all hover:scale-105 cursor-pointer ${
                  filter === "confirmed"
                    ? "border-cyan-500 shadow-xl shadow-cyan-500/50"
                    : "border-cyan-500/50 hover:border-cyan-500"
                }`}
              >
                <p className="text-cyan-400 text-xs font-bold text-left">Confirmados</p>
                <p className="text-3xl font-black text-cyan-400 mt-1 text-left">
                  {dateFilteredOrders.filter((o) => o.status === "confirmed").length}
                </p>
              </button>
              <button
                onClick={() => setFilter("en-camino")}
                className={`bg-gray-900 rounded-xl border-2 p-3 transition-all hover:scale-105 cursor-pointer ${
                  filter === "en-camino"
                    ? "border-blue-500 shadow-xl shadow-blue-500/50"
                    : "border-blue-500/50 hover:border-blue-500"
                }`}
              >
                <p className="text-blue-400 text-xs font-bold text-left">🚚 En Camino</p>
                <p className="text-3xl font-black text-blue-400 mt-1 text-left">
                  {dateFilteredOrders.filter((o) => o.status === "en-camino").length}
                </p>
              </button>
              <button
                onClick={() => setFilter("delivered")}
                className={`bg-gray-900 rounded-xl border-2 p-3 transition-all hover:scale-105 cursor-pointer ${
                  filter === "delivered"
                    ? "border-green-500 shadow-xl shadow-green-500/50"
                    : "border-green-500/50 hover:border-green-500"
                }`}
              >
                <p className="text-green-400 text-xs font-bold text-left">Entregados</p>
                <p className="text-3xl font-black text-green-400 mt-1 text-left">
                  {dateFilteredOrders.filter((o) => o.status === "delivered").length}
                </p>
              </button>
            </div>
          </section>

      {/* Barra de herramientas */}
      <section className="container mx-auto px-4 pb-6">
        <div className="flex gap-2 items-center justify-end">
          {/* Botón de calendario */}
          <button
            onClick={() => setShowDateModal(true)}
            className="px-3 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-all"
            title="Filtrar por fechas"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Buscador en tiempo real */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pedido, cliente, dirección, menú..."
              className="w-full sm:w-80 px-4 py-3 pl-10 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Modal de filtro de fechas */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowDateModal(false)}>
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border-2 border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-white mb-4">Filtrar por Fechas</h3>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm font-semibold block mb-2">Desde:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-fuchsia-500 transition-all"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold block mb-2">Hasta:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-fuchsia-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={applyDateFilter}
                  disabled={!dateFrom || !dateTo}
                  className="flex-1 px-6 py-3 bg-fuchsia-600 text-white rounded-lg font-bold hover:bg-fuchsia-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all"
                >
                  Aplicar Filtro
                </button>
                {isDateFiltered && (
                  <button
                    onClick={clearDateFilter}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setShowDateModal(false)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-all"
                >
                  Cerrar
                </button>
              </div>

              {isDateFiltered && dateFrom && dateTo && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">
                    📊 Filtrando desde <span className="text-white font-bold">{new Date(dateFrom).toLocaleDateString('es-PE')}</span> hasta <span className="text-white font-bold">{new Date(dateTo).toLocaleDateString('es-PE')}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <section className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-2xl text-fuchsia-400 neon-glow-purple">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-xl border-2 border-fuchsia-500/30">
            <p className="text-2xl text-gray-400">No hay pedidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-gray-900 rounded-lg overflow-hidden shadow-2xl transition-all ${
                  order.status === 'pending' ? 'ring-2 ring-yellow-500/50' :
                  order.status === 'pendiente-verificacion' ? 'ring-2 ring-purple-500/50' :
                  order.status === 'confirmed' ? 'ring-2 ring-cyan-500/50' :
                  order.status === 'en-camino' ? 'ring-2 ring-blue-500/50' :
                  order.status === 'delivered' ? 'ring-2 ring-green-500/30 opacity-60' :
                  'ring-2 ring-red-500/30 opacity-50'
                }`}
              >
                {/* LAYOUT HORIZONTAL TIPO CINTA */}
                <div className="flex items-center gap-3 p-3">

                  {/* HEADER: ESTADO Y NÚMERO */}
                  <div className={`flex-shrink-0 px-3 py-2 rounded ${
                    order.status === 'pending' ? 'bg-yellow-500/20' :
                    order.status === 'pendiente-verificacion' ? 'bg-purple-500/20' :
                    order.status === 'confirmed' ? 'bg-cyan-500/20' :
                    order.status === 'en-camino' ? 'bg-blue-500/20' :
                    order.status === 'delivered' ? 'bg-green-500/20' :
                    'bg-red-500/20'
                  }`}>
                    <span className={`px-2 py-0.5 rounded text-xs font-black uppercase block mb-1 ${
                      statusColors[order.status]
                    }`}>
                      {statusLabels[order.status]}
                    </span>
                    <span className="font-mono font-black text-base text-white block">#{order.id}</span>
                    <p className="text-[10px] text-gray-300 font-medium mt-1">
                      {new Date(order.createdAt).toLocaleString("es-PE", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {/* CONTADOR DE TIEMPO EN COLA */}
                    <div className="mt-2">
                      <TimeCounter createdAt={order.createdAt} orderId={order.id} status={order.status} />
                    </div>

                    {/* RASTRO DE TIEMPOS POR ETAPA */}
                    {(() => {
                      const steps: { label: string; time: string | undefined; color: string }[] = [
                        { label: 'Ingresó', time: order.createdAt, color: 'text-gray-400' },
                        { label: 'Confirmado', time: order.confirmedAt, color: 'text-cyan-400' },
                        { label: 'En camino', time: order.enCaminoAt, color: 'text-blue-400' },
                        { label: 'Entregado', time: order.deliveredAt, color: 'text-green-400' },
                      ];
                      const filled = steps.filter(s => s.time);
                      if (filled.length < 2) return null;
                      return (
                        <div className="mt-2 border-t border-white/10 pt-2 space-y-0.5">
                          {filled.map((step, i) => {
                            const prev = filled[i - 1];
                            const elapsed = prev
                              ? Math.round((new Date(step.time!).getTime() - new Date(prev.time!).getTime()) / 60000)
                              : null;
                            return (
                              <div key={i} className="flex items-center gap-1 text-[9px]">
                                <span className={`font-mono font-bold ${step.color}`}>
                                  {new Date(step.time!).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-gray-500">{step.label}</span>
                                {elapsed !== null && (
                                  <span className="text-yellow-500 font-bold">+{elapsed}m</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* SECCIÓN 1: PRODUCTOS */}
                  <div className="flex-1 bg-black rounded border border-white/10 px-3 py-2">
                    <h3 className="text-xs font-black text-white uppercase mb-2">🍽️ PEDIDO</h3>
                    <div className="flex flex-wrap gap-2">
                      {(order as any).completedOrders && Array.isArray((order as any).completedOrders) && (order as any).completedOrders.length > 0 ? (
                        (order as any).completedOrders.map((item: any, idx: number) => {
                          const productName = item.name || 'Sin nombre';
                          // Usar finalPrice (promo 30%) si existe, sino precio catálogo
                          const basePrice = item.finalPrice ?? item.price ?? 0;
                          // Aplicar factor del cupón 13% si el pedido lo tiene
                          const couponFactor = 1 - ((order as any).couponDiscount || 0) / 100;
                          const productPrice = basePrice * couponFactor;
                          const catalogPrice = item.price || 0;
                          const quantity = item.quantity || 0;
                          const itemSalsas = item.salsas || [];
                          const itemComplementIds = item.complementIds || [];
                          const hasItemDiscount = item.finalPrice != null || (order as any).couponDiscount > 0;

                          // Calcular precio total del item (producto + complementos)
                          let itemTotal = productPrice * quantity;
                          itemComplementIds.forEach((compId: string) => {
                            const complement = availableComplements[compId];
                            if (complement) {
                              itemTotal += complement.price * couponFactor;
                            }
                          });

                          return (
                            <div key={idx} className="bg-white/5 rounded px-2 py-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-fuchsia-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-black text-sm">{quantity}</span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold text-white">{productName}</h4>
                                  {hasItemDiscount ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-gray-500 line-through text-xs">S/ {(catalogPrice * quantity).toFixed(2)}</span>
                                      <span className="text-sm font-black text-cyan-400">S/ {(productPrice * quantity).toFixed(2)}</span>
                                      {item.finalPrice != null && <span className="text-[9px] bg-green-600/30 text-green-400 px-1 rounded font-bold">-30%</span>}
                                      {(order as any).couponDiscount > 0 && <span className="text-[9px] bg-purple-600/30 text-purple-400 px-1 rounded font-bold">-{(order as any).couponDiscount}%</span>}
                                    </div>
                                  ) : (
                                    <span className="text-sm font-black text-cyan-400">S/ {(productPrice * quantity).toFixed(2)}</span>
                                  )}
                                </div>
                              </div>

                              {/* Mostrar salsas si existen */}
                              {itemSalsas.length > 0 && (
                                <div className="mt-1 ml-8 text-[10px] text-yellow-300">
                                  <span className="font-bold">🌶️ Salsas: </span>
                                  {itemSalsas.map((salsaId: string) => {
                                    const salsa = salsas.find(s => s.id === salsaId);
                                    return salsa?.name || salsaId;
                                  }).join(', ')}
                                </div>
                              )}

                              {/* Mostrar complementos si existen - agrupados por tipo */}
                              {itemComplementIds.length > 0 && (() => {
                                // Agrupar complementos duplicados
                                const complementCounts: { [key: string]: number } = {};
                                itemComplementIds.forEach((compId: string) => {
                                  complementCounts[compId] = (complementCounts[compId] || 0) + 1;
                                });

                                return (
                                  <div className="mt-1 ml-8 space-y-0.5">
                                    {Object.entries(complementCounts).map(([compId, count], compIdx) => {
                                      const complement = availableComplements[compId];
                                      if (!complement) return null;
                                      const totalPrice = complement.price * count;
                                      return (
                                        <div key={compIdx} className="text-[10px] text-green-300 flex items-center gap-1">
                                          <span className="font-bold">+</span>
                                          {count > 1 && <span className="text-green-400 font-black">{count}x</span>}
                                          <span>{complement.name}</span>
                                          <span className="text-green-400 font-bold">S/ {totalPrice.toFixed(2)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })
                      ) : order.cart && Array.isArray(order.cart) && order.cart.length > 0 ? (
                        order.cart.map((item: any, idx: number) => {
                          const productName = item.product?.name || item.name || 'Sin nombre';
                          const productPrice = item.product?.price || item.price || 0;
                          const quantity = item.quantity || 0;
                          const subtotal = productPrice * quantity;

                          return (
                            <div key={idx} className="flex items-center gap-2 bg-white/5 rounded px-2 py-1">
                              <div className="w-6 h-6 rounded bg-fuchsia-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-black text-sm">{quantity}</span>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">{productName}</h4>
                                <span className="text-sm font-black text-cyan-400">S/ {subtotal.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500">Sin productos</span>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN 2: CLIENTE */}
                  <div className="flex-shrink-0 w-48 bg-gray-800 rounded px-3 py-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">👤 Cliente</h4>
                    <p className="text-xs font-bold text-white mb-1 truncate">{order.name}</p>
                    <p className="text-xs font-bold text-white flex items-center gap-1 mb-1">
                      <span>📱</span>
                      <span className="font-mono">{order.phone}</span>
                    </p>
                    <p className="text-xs font-bold text-white flex items-start gap-1">
                      <span>📍</span>
                      <span className="line-clamp-2">{order.address}</span>
                    </p>
                  </div>

                  {/* SECCIÓN 3: TOTAL */}
                  <div className="flex-shrink-0 bg-gradient-to-br from-cyan-600 to-blue-600 rounded px-3 py-2 text-center min-w-[100px]">
                    <p className="text-[10px] text-cyan-100 font-bold uppercase mb-0.5">Total</p>
                    <p className="text-xl font-black text-white">
                      S/ {(typeof order.totalPrice === 'number' ? order.totalPrice : 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-cyan-100">{order.totalItems || 0} items</p>
                    {(order as any).couponDiscount > 0 && (
                      <p className="text-[9px] bg-purple-900/60 text-purple-200 rounded px-1 mt-1 font-bold">
                        Cupón -{(order as any).couponDiscount}% aplicado
                      </p>
                    )}
                  </div>

                  {/* SECCIÓN 4: PAGO */}
                  <div className={`flex-shrink-0 rounded px-3 py-2 min-w-[110px] ${
                    order.paymentMethod === 'anticipado' ? 'bg-gradient-to-br from-green-600 to-emerald-600' :
                    order.paymentMethod === 'contraentrega-yape-plin' ? 'bg-gradient-to-br from-yellow-600 to-amber-600' :
                    'bg-gradient-to-br from-orange-600 to-red-600'
                  }`}>
                    <p className="text-[10px] text-white/80 font-bold uppercase mb-0.5">Pago</p>
                    {order.paymentMethod === 'anticipado' ? (
                      <div>
                        <p className="text-sm font-black text-white">✓ PAGADO</p>
                        <p className="text-[10px] text-white/80">Yape/Plin</p>
                        {order.paymentProofPath && (
                          <button
                            onClick={() => {
                              setSelectedVoucherPath(order.paymentProofPath || "");
                              setShowVoucherModal(true);
                            }}
                            className="mt-1 w-full bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                          >
                            📄 Ver comprobante
                          </button>
                        )}
                      </div>
                    ) : order.paymentMethod === 'contraentrega-yape-plin' ? (
                      <div>
                        <p className="text-sm font-black text-white">YAPE/PLIN</p>
                        <p className="text-[10px] text-white/80">Al recibir</p>
                      </div>
                    ) : order.paymentMethod === 'contraentrega-efectivo-exacto' ? (
                      <div>
                        <p className="text-sm font-black text-white">EFECTIVO</p>
                        <p className="text-[10px] text-white/80">Exacto</p>
                      </div>
                    ) : order.paymentMethod === 'contraentrega-efectivo-cambio' ? (
                      <div>
                        <p className="text-sm font-black text-white">EFECTIVO</p>
                        {(order as any).cantoCancelo && (
                          <>
                            <p className="text-[10px] text-white/90 font-bold">
                              Cancela con: S/ {parseFloat((order as any).cantoCancelo).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-white/90 font-bold">
                              Vuelto: S/ {(parseFloat((order as any).cantoCancelo) - (typeof order.totalPrice === 'number' ? order.totalPrice : 0)).toFixed(2)}
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-black text-white">Contraentrega</p>
                    )}
                  </div>

                  {/* NOTA SI EXISTE */}
                  {order.notes && (
                    <div className="flex-shrink-0 bg-yellow-500/20 border border-yellow-500 rounded px-2 py-2 max-w-[150px]">
                      <p className="text-[10px] text-yellow-400 font-bold uppercase mb-1">⚠️ NOTA</p>
                      <p className="text-xs font-medium text-yellow-100 line-clamp-2">{order.notes}</p>
                    </div>
                  )}

                  {/* BOTONES DE ACCIÓN */}
                  <div className="flex-shrink-0 flex gap-2">
                    {order.status === "pendiente-verificacion" && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, "confirmed")}
                          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-4 py-2 rounded text-xs font-black uppercase transition-all"
                        >
                          ✓ Verificar y Confirmar
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black uppercase transition-all"
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {order.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, "confirmed")}
                          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded text-xs font-black uppercase transition-all"
                        >
                          ✓ Confirmar
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black uppercase transition-all"
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, "en-camino")}
                          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded text-xs font-black uppercase transition-all"
                        >
                          🚚 En Camino
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black uppercase transition-all"
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {order.status === "en-camino" && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, "delivered")}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded text-xs font-black uppercase transition-all"
                        >
                          ✓ Entregado
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black uppercase transition-all"
                        >
                          ✕ Cancelar
                        </button>
                      </>
                    )}
                    {order.status === "delivered" && (
                      <div className="bg-green-900/50 border border-green-500 text-green-400 px-4 py-2 rounded text-xs font-black text-center uppercase">
                        ✓ Entregado
                      </div>
                    )}
                    {order.status === "cancelled" && (
                      <div className="bg-red-900/50 border border-red-500 text-red-400 px-4 py-2 rounded text-xs font-black text-center uppercase">
                        ✕ Cancelado
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      ) : activeTab === "customers" ? (
        /* Customers Tab */
        <>
          {/* Customer Stats */}
          <section className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-fuchsia-400 neon-glow-purple mb-4">
                Segmentación de Clientes
              </h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCustomerSegment("all")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "all"
                      ? "bg-fuchsia-600 text-white neon-border-purple"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 border-2 border-gray-700"
                  }`}
                >
                  Todos ({customerSegments.all.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("vip")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "vip"
                      ? "bg-amber-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 border-2 border-gray-700"
                  }`}
                >
                  👑 VIP ({customerSegments.vip.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("new")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "new"
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 border-2 border-gray-700"
                  }`}
                >
                  ✨ Nuevos ({customerSegments.new.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("active")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "active"
                      ? "bg-green-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 border-2 border-gray-700"
                  }`}
                >
                  🟢 Activos ({customerSegments.active.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("recurrent")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "recurrent"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 border-2 border-gray-700"
                  }`}
                >
                  🔁 Recurrentes ({customerSegments.recurrent.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("inactive")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "inactive"
                      ? "bg-red-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 border-2 border-gray-700"
                  }`}
                >
                  💤 Inactivos ({customerSegments.inactive.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("email_pending")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "email_pending"
                      ? "bg-orange-600 text-white"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 border-2 border-gray-700"
                  }`}
                >
                  📧 Email Pendiente ({customerSegments.email_pending.length})
                </button>
              </div>
            </div>
          </section>

          {/* Customers Table */}
          <section className="container mx-auto px-4 pb-12">
            {/* Modal de detalle de cliente */}
            {selectedCustomer && (() => {
              // Calcular productos más comprados
              const productCount: Record<string, { name: string; qty: number; revenue: number }> = {};
              selectedCustomer.orders.forEach((order: any) => {
                const items = order.completedOrders || order.cart || [];
                const couponFactor = 1 - (order.couponDiscount || 0) / 100;
                items.forEach((item: any) => {
                  const name = item.name || item.product?.name || 'Sin nombre';
                  const qty = item.quantity || 0;
                  const price = (item.finalPrice ?? item.price ?? item.product?.price ?? 0) * couponFactor;
                  if (!productCount[name]) productCount[name] = { name, qty: 0, revenue: 0 };
                  productCount[name].qty += qty;
                  productCount[name].revenue += price * qty;
                });
              });
              const topProducts = Object.values(productCount).sort((a, b) => b.qty - a.qty).slice(0, 5);
              const daysSince = Math.floor((new Date().getTime() - new Date(selectedCustomer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedCustomer(null)}>
                  <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    {/* Header del modal */}
                    <div className="flex items-start justify-between p-4 border-b border-fuchsia-500/30">
                      <div>
                        <h2 className="text-xl font-black text-white">{selectedCustomer.name}</h2>
                        <p className="text-gray-400 text-xs mt-0.5">DNI {selectedCustomer.dni} · {selectedCustomer.phone}{selectedCustomer.email ? ` · ${selectedCustomer.email}` : ''}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{selectedCustomer.address}</p>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-white text-xl leading-none ml-4">✕</button>
                    </div>

                    {/* KPIs compactos */}
                    <div className="grid grid-cols-3 gap-3 p-4">
                      <div className="bg-black/50 rounded-lg p-3 border border-fuchsia-500/20 text-center">
                        <p className="text-2xl font-black text-fuchsia-400">{selectedCustomer.totalOrders}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pedidos</p>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-amber-500/30 text-center">
                        <p className="text-2xl font-black text-amber-400">S/ {selectedCustomer.totalSpent.toFixed(0)}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total gastado</p>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-cyan-500/20 text-center">
                        <p className="text-2xl font-black text-cyan-400">{daysSince}d</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Última compra</p>
                      </div>
                    </div>

                    {/* Productos más comprados */}
                    {topProducts.length > 0 && (
                      <div className="px-4 pb-3">
                        <p className="text-xs font-black text-fuchsia-400 uppercase tracking-wider mb-2">Productos favoritos</p>
                        <div className="space-y-1.5">
                          {topProducts.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 bg-black/40 rounded px-3 py-1.5">
                              <span className="text-[10px] font-black text-gray-500 w-4">{i + 1}</span>
                              <span className="flex-1 text-sm text-white font-medium">{p.name}</span>
                              <span className="text-xs font-black text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full">{p.qty}x</span>
                              <span className="text-xs text-amber-400 font-bold w-16 text-right">S/ {p.revenue.toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Historial de pedidos */}
                    <div className="px-4 pb-4">
                      <p className="text-xs font-black text-fuchsia-400 uppercase tracking-wider mb-2">Historial ({selectedCustomer.orders.length} pedidos)</p>
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {[...selectedCustomer.orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order: any) => (
                          <div key={order.id} className="bg-black/50 rounded-lg px-3 py-2 border border-fuchsia-500/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-fuchsia-400">#{order.id}</span>
                                <span className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleDateString("es-PE", { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[order.status as keyof typeof statusColors]}`}>
                                  {statusLabels[order.status as keyof typeof statusLabels]}
                                </span>
                              </div>
                              <span className="text-amber-400 font-black text-sm">S/ {order.totalPrice?.toFixed(2) || "0.00"}</span>
                            </div>
                            {/* Items compactos */}
                            {(() => {
                              const items = order.completedOrders || order.cart || [];
                              if (!items.length) return null;
                              return (
                                <p className="text-[10px] text-gray-500 mt-0.5 ml-1">
                                  {items.map((it: any) => `${it.name || it.product?.name || '?'} x${it.quantity || 0}`).join(' · ')}
                                </p>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {loading ? (
              <div className="text-center py-12">
                <p className="text-2xl text-fuchsia-400 neon-glow-purple">Cargando clientes...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl border-2 border-fuchsia-500/30">
                <p className="text-2xl text-gray-400">No hay clientes registrados</p>
              </div>
            ) : (
              <>
                {/* Buscador de clientes */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      placeholder="Buscar cliente por DNI, nombre, teléfono, email..."
                      className="w-full px-4 py-3 pl-10 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 transition-all"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    {customerSearchTerm && (
                      <button
                        onClick={() => setCustomerSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  const handleSort = (key: string) => {
                    if (customerSortKey === key) {
                      setCustomerSortDir(d => d === "asc" ? "desc" : "asc");
                    } else {
                      setCustomerSortKey(key);
                      setCustomerSortDir(key === "name" || key === "dni" ? "asc" : "desc");
                    }
                  };
                  const SortIcon = ({ col }: { col: string }) => {
                    if (customerSortKey !== col) return <span className="text-gray-600 ml-1">↕</span>;
                    return <span className="text-fuchsia-300 ml-1">{customerSortDir === "asc" ? "↑" : "↓"}</span>;
                  };
                  const sortedCustomers = [...customers].sort((a: any, b: any) => {
                    let aVal: any, bVal: any;
                    if (customerSortKey === "dni") { aVal = a.dni || ""; bVal = b.dni || ""; }
                    else if (customerSortKey === "name") { aVal = a.name || ""; bVal = b.name || ""; }
                    else if (customerSortKey === "phone") { aVal = a.phone || ""; bVal = b.phone || ""; }
                    else if (customerSortKey === "totalOrders") { aVal = a.totalOrders; bVal = b.totalOrders; }
                    else if (customerSortKey === "totalSpent") { aVal = a.totalSpent; bVal = b.totalSpent; }
                    else if (customerSortKey === "lastOrderDate") { aVal = new Date(a.lastOrderDate).getTime(); bVal = new Date(b.lastOrderDate).getTime(); }
                    else { aVal = 0; bVal = 0; }
                    if (typeof aVal === "string") {
                      return customerSortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                    }
                    return customerSortDir === "asc" ? aVal - bVal : bVal - aVal;
                  });

                  return (
                    <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-fuchsia-500/10 border-b-2 border-fuchsia-500/30">
                          <tr>
                            <th className="text-left p-3 text-fuchsia-400 font-bold cursor-pointer hover:text-fuchsia-200 select-none" onClick={() => handleSort("dni")}>
                              DNI <SortIcon col="dni" />
                            </th>
                            <th className="text-left p-3 text-fuchsia-400 font-bold cursor-pointer hover:text-fuchsia-200 select-none" onClick={() => handleSort("name")}>
                              Nombre <SortIcon col="name" />
                            </th>
                            <th className="text-left p-3 text-fuchsia-400 font-bold cursor-pointer hover:text-fuchsia-200 select-none hidden md:table-cell" onClick={() => handleSort("phone")}>
                              Teléfono <SortIcon col="phone" />
                            </th>
                            <th className="text-center p-3 text-fuchsia-400 font-bold cursor-pointer hover:text-fuchsia-200 select-none" onClick={() => handleSort("totalOrders")}>
                              Pedidos <SortIcon col="totalOrders" />
                            </th>
                            <th className="text-right p-3 text-fuchsia-400 font-bold cursor-pointer hover:text-fuchsia-200 select-none" onClick={() => handleSort("totalSpent")}>
                              Total Gastado <SortIcon col="totalSpent" />
                            </th>
                            <th className="text-center p-3 text-fuchsia-400 font-bold cursor-pointer hover:text-fuchsia-200 select-none hidden lg:table-cell" onClick={() => handleSort("lastOrderDate")}>
                              Última Compra <SortIcon col="lastOrderDate" />
                            </th>
                            <th className="text-center p-3 text-fuchsia-400 font-bold hidden lg:table-cell">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCustomers.map((customer: any, idx: number) => {
                            const daysSinceLastOrder = Math.floor((new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
                            return (
                              <tr
                                key={customer.dni}
                                onClick={() => setSelectedCustomer(customer)}
                                className={`border-b border-fuchsia-500/10 hover:bg-fuchsia-500/5 cursor-pointer transition-all ${idx % 2 === 0 ? "bg-black/20" : ""}`}
                              >
                                <td className="p-3 text-fuchsia-400 font-bold text-sm">{customer.dni}</td>
                                <td className="p-3 text-white text-sm">{customer.name}</td>
                                <td className="p-3 text-gray-300 text-sm hidden md:table-cell">{customer.phone}</td>
                                <td className="p-3 text-center">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 font-bold text-sm">
                                    {customer.totalOrders}
                                  </span>
                                </td>
                                <td className="p-3 text-right text-amber-400 font-black text-sm gold-glow">
                                  S/ {customer.totalSpent.toFixed(2)}
                                </td>
                                <td className="p-3 text-center text-gray-300 text-sm hidden lg:table-cell">
                                  {new Date(customer.lastOrderDate).toLocaleDateString("es-PE")}
                                </td>
                                <td className="p-3 text-center hidden lg:table-cell">
                                  {customer.totalOrders > 1 ? (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500">⭐ Recurrente</span>
                                  ) : daysSinceLastOrder > 30 ? (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500">⚠️ Inactivo</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500">🆕 Nuevo</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </>
            )}
          </section>
        </>
      ) : activeTab === "analytics" ? (
        /* Analytics Tab */
        <>
          {/* Date Filter - Only for Analytics */}
          <section className="container mx-auto px-4 pt-4">
            <div className="bg-gray-900 rounded-lg border-2 border-fuchsia-500/30 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-fuchsia-400">Desde:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none cursor-pointer [color-scheme:dark]"
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-fuchsia-400">Hasta:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none cursor-pointer [color-scheme:dark]"
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
                <button
                  onClick={() => {
                    if (dateFrom && dateTo) {
                      setIsDateFiltered(true);
                    }
                  }}
                  disabled={!dateFrom || !dateTo}
                  className="px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar Filtro
                </button>
                {isDateFiltered && (
                  <button
                    onClick={() => {
                      setIsDateFiltered(false);
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-all"
                  >
                    Limpiar Filtro
                  </button>
                )}
                {isDateFiltered && (
                  <span className="text-sm text-green-400 font-bold">
                    ✓ Mostrando datos del {new Date(dateFrom).toLocaleDateString("es-PE")} al {new Date(dateTo).toLocaleDateString("es-PE")}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-8">
            {/* CARTELES PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* 1. VENTAS DEL DÍA */}
              <div className="bg-gray-900 rounded-xl border-2 border-cyan-500/50 p-6">
                <p className="text-cyan-400 text-sm font-bold mb-2">💰 Ventas del Día</p>
                <p className="text-4xl font-black text-cyan-400">S/ {analytics.dailySales.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {isDateFiltered ? `${new Date(dateFrom).toLocaleDateString("es-PE")} - ${new Date(dateTo).toLocaleDateString("es-PE")}` : new Date().toLocaleDateString("es-PE")}
                </p>
              </div>

              {/* 2. PEDIDOS ENTREGADOS DEL DÍA */}
              <div className="bg-gray-900 rounded-xl border-2 border-green-500/50 p-6">
                <p className="text-green-400 text-sm font-bold mb-2">📦 Pedidos Entregados</p>
                <p className="text-4xl font-black text-green-400">{analytics.todayDeliveredOrdersCount}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {isDateFiltered ? "Del período filtrado" : "Hoy"}
                </p>
              </div>

              {/* 3. ACUMULADO DEL MES */}
              <div className="bg-gray-900 rounded-xl border-2 border-purple-500/50 p-6">
                <p className="text-purple-400 text-sm font-bold mb-2">📊 Acumulado del Mes</p>
                <p className="text-4xl font-black text-purple-400">S/ {analytics.monthlySales.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {analytics.currentMonthOrdersCount} pedidos
                </p>
              </div>

              {/* 4. TICKET PROMEDIO DEL DÍA */}
              <div className="bg-gray-900 rounded-xl border-2 border-amber-500/50 p-6">
                <p className="text-amber-400 text-sm font-bold mb-2">🎫 Ticket Promedio</p>
                <p className="text-4xl font-black text-amber-400">S/ {analytics.todayAverageTicket.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {isDateFiltered ? "Del período filtrado" : "Del día"} ({analytics.todayDeliveredOrdersCount} pedidos)
                </p>
              </div>
            </div>

            {/* SECCIÓN: PRODUCTOS ENTREGADOS DEL PERÍODO */}
            <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 p-6 mb-8">
              <h3 className="text-2xl font-black text-fuchsia-400 mb-2">📦 Productos Entregados {isDateFiltered ? "del Período" : "del Mes"}</h3>
              <p className="text-gray-400 text-sm mb-4">
                Ranking de productos por cantidad vendida • Identifica los más y menos vendidos
              </p>
              {analytics.currentMonthProductsArray.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay productos vendidos en este período</p>
              ) : (() => {
                // Calcular total de ingresos del período
                const totalRevenue = analytics.currentMonthProductsArray.reduce((sum: number, p: any) => sum + p.revenue, 0);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.currentMonthProductsArray.map((product: any, idx: number) => {
                      const isMostSold = idx === 0;
                      const isLeastSold = idx === analytics.currentMonthProductsArray.length - 1;
                      const revenuePercentage = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;

                      return (
                        <div
                          key={idx}
                          className={`bg-black/50 rounded-lg p-4 border-2 ${
                            isMostSold ? 'border-green-500/50 bg-green-500/5' :
                            isLeastSold ? 'border-red-500/50 bg-red-500/5' :
                            'border-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`text-3xl font-black ${
                              isMostSold ? 'text-green-400' :
                              isLeastSold ? 'text-red-400' :
                              'text-gray-400'
                            }`}>
                              #{idx + 1}
                            </span>
                            {isMostSold && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">🔥 MÁS VENDIDO</span>}
                            {isLeastSold && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold">❄️ MENOS VENDIDO</span>}
                          </div>
                          <p className="text-white font-bold text-base mb-1">{product.name}</p>
                          <p className="text-gray-400 text-xs mb-3">{product.category}</p>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-xs text-gray-500">Cantidad</p>
                              <p className="text-xl font-black text-cyan-400">{product.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Ingresos</p>
                              <p className="text-xl font-black text-amber-400">S/ {product.revenue.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">% del total</p>
                              <p className="text-sm font-black text-fuchsia-400">{revenuePercentage.toFixed(1)}%</p>
                            </div>
                            <div className="bg-black/50 rounded-full h-1.5 overflow-hidden mt-1">
                              <div
                                className="h-full bg-gradient-to-r from-fuchsia-600 to-pink-600"
                                style={{ width: `${revenuePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* SECCIÓN: INSIGHTS DEL NEGOCIO */}
            <div className="mb-8">
              <h3 className="text-2xl font-black text-cyan-400 mb-4">📊 Insights del Negocio</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. MÉTODO DE PAGO MÁS USADO */}
                <div className="bg-gray-900 rounded-xl border-2 border-green-500/50 p-6">
                  <p className="text-green-400 text-sm font-bold mb-2">💳 Método de Pago Preferido</p>
                  <p className="text-2xl font-black text-white mb-1">
                    {analytics.mostUsedPaymentMethod.method === 'anticipado' ? '💰 Anticipado' :
                     analytics.mostUsedPaymentMethod.method === 'contraentrega-efectivo-exacto' ? '💵 Efectivo Exacto' :
                     analytics.mostUsedPaymentMethod.method === 'contraentrega-efectivo-cambio' ? '💵 Con Cambio' :
                     analytics.mostUsedPaymentMethod.method}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">{analytics.mostUsedPaymentMethod.count} pedidos ({((analytics.mostUsedPaymentMethod.count / analytics.currentMonthOrdersCount) * 100).toFixed(0)}%)</p>
                </div>

                {/* 2. HORARIO PICO */}
                <div className="bg-gray-900 rounded-xl border-2 border-amber-500/50 p-6">
                  <p className="text-amber-400 text-sm font-bold mb-2">⏰ Horario Pico</p>
                  <p className="text-2xl font-black text-white mb-1">{analytics.peakHour}</p>
                  <p className="text-gray-400 text-xs mt-2">{analytics.peakHourCount} pedidos en esa hora</p>
                </div>

                {/* 3. TASA DE CONVERSIÓN */}
                <div className="bg-gray-900 rounded-xl border-2 border-cyan-500/50 p-6">
                  <p className="text-cyan-400 text-sm font-bold mb-2">📈 Tasa de Conversión</p>
                  <p className="text-3xl font-black text-white mb-1">{analytics.conversionRate.toFixed(1)}%</p>
                  <p className="text-gray-400 text-xs mt-2">Pedidos confirmados vs totales</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN: DISTRIBUCIÓN DE MÉTODOS DE PAGO - formato filas */}
            <div className="bg-gray-900 rounded-xl border-2 border-blue-500/30 p-6 mb-8">
              <h3 className="text-xl font-black text-blue-400 mb-4">💳 Distribución de Métodos de Pago</h3>
              <div className="space-y-3">
                {analytics.paymentMethodsArray.map((pm: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-44 flex-shrink-0">
                      <p className="text-white font-bold text-sm">
                        {pm.method === 'anticipado' ? '💰 Anticipado' :
                         pm.method === 'contraentrega-efectivo-exacto' ? '💵 Efectivo Exacto' :
                         pm.method === 'contraentrega-efectivo-cambio' ? '💵 Con Cambio' :
                         pm.method}
                      </p>
                    </div>
                    <div className="flex-1 bg-black/50 rounded-full h-6 overflow-hidden border border-blue-500/20">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-end pr-2 transition-all duration-300"
                        style={{ width: `${(pm.count / analytics.currentMonthOrdersCount) * 100}%` }}
                      >
                        <span className="text-white font-black text-xs">{pm.count}</span>
                      </div>
                    </div>
                    <div className="w-14 text-right flex-shrink-0">
                      <span className="text-cyan-400 font-black text-sm">{((pm.count / analytics.currentMonthOrdersCount) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN: CONTROL DE STOCK DEL DÍA */}
            {(analytics.menusSoldToday.length > 0 || analytics.beveragesSoldToday.length > 0) && (
              <div className="bg-gray-900 rounded-xl border-2 border-cyan-500/30 p-6 mb-8">
                <h3 className="text-xl font-black text-cyan-400 mb-2">📋 Control de Stock Hoy</h3>
                <p className="text-gray-400 text-sm mb-5">Unidades despachadas del día • Para reposición de insumos</p>

                {/* Menús */}
                {analytics.menusSoldToday.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3 opacity-70">🍽️ Menús</h4>
                    <div className="space-y-2">
                      {analytics.menusSoldToday.map((menu: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-cyan-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-black text-sm">{menu.quantity}</span>
                          </div>
                          <p className="text-white font-bold text-sm">{menu.name}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-700 pt-3">
                      <p className="text-gray-400 text-xs font-bold">Total menús</p>
                      <p className="text-xl font-black text-cyan-400">
                        {analytics.menusSoldToday.reduce((sum: number, m: any) => sum + m.quantity, 0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bebidas */}
                {analytics.beveragesSoldToday.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3 opacity-70">🥤 Bebidas</h4>
                    <div className="space-y-2">
                      {analytics.beveragesSoldToday.map((bev: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-black text-sm">{bev.quantity}</span>
                          </div>
                          <p className="text-white font-bold text-sm">{bev.name}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-700 pt-3">
                      <p className="text-gray-400 text-xs font-bold">Total bebidas</p>
                      <p className="text-xl font-black text-green-400">
                        {analytics.beveragesSoldToday.reduce((sum: number, b: any) => sum + b.quantity, 0)}
                      </p>
                    </div>
                  </div>
                )}

                {analytics.beveragesSoldToday.length === 0 && (
                  <p className="text-gray-500 text-xs italic mt-2">No se vendieron bebidas hoy</p>
                )}
              </div>
            )}

            {/* SECCIÓN: TODOS LOS COMPLEMENTOS/EXTRAS POR CATEGORÍA */}
            {analytics.allComplements.length > 0 && (
              <div className="bg-gray-900 rounded-xl border-2 border-purple-500/30 p-6 mb-8">
                <h3 className="text-xl font-black text-purple-400 mb-2">🌟 Ranking de Extras, Complementos y Salsas</h3>
                <p className="text-gray-400 text-sm mb-4">Todos los complementos vendidos • Organizado por categoría y ranking</p>

                <div className="space-y-6">
                  {Object.entries(analytics.complementsByCategory).map(([category, items]: [string, any[]]) => (
                    items.length > 0 && (
                      <div key={category}>
                        <h4 className="text-lg font-black text-cyan-400 mb-3">{category}</h4>
                        <div className="space-y-2">
                          {items.map((comp: any, idx: number) => (
                            <div key={comp.id} className="bg-black/50 rounded-lg p-3 border border-purple-500/20 flex items-center justify-between hover:border-purple-500/40 transition-all">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-lg font-black text-purple-400 w-8">#{idx + 1}</span>
                                {idx === 0 && (
                                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">👑</span>
                                )}
                                <p className="text-white font-bold text-sm">{comp.name}</p>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <p className="text-xs text-gray-500">Vendidos</p>
                                  <p className="text-lg font-black text-cyan-400">{comp.count}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Ingresos</p>
                                  <p className="text-lg font-black text-amber-400">S/ {comp.revenue.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

          </section>
        </>
      ) : activeTab === "financial" ? (
        /* Financial Tab */
        <>
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-black text-fuchsia-400 neon-glow-purple mb-6">💰 Módulo Financiero</h2>

            {/* Sub-tabs del Módulo Financiero */}
            <div className="flex gap-2 mb-8 border-b-2 border-fuchsia-500/20">
              <button
                onClick={() => setFinancialSection("dashboard")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  financialSection === "dashboard"
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setFinancialSection("purchases")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  financialSection === "purchases"
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                🛒 Compras y Gastos
              </button>
              <button
                onClick={() => setFinancialSection("products")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  financialSection === "products"
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                🍗 Productos de Venta
              </button>
              {/* Stock de Empaques ELIMINADO - Sistema ahora es 100% manual */}
            </div>

            {/* DASHBOARD FINANCIERO */}
            {financialSection === "dashboard" && (() => {
              // Normaliza: quita tildes, mayúsculas, espacios extra
              const normalize = (s: string) =>
                s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

              const saleProducts = products.filter((p: any) => p.type === "sale");

              // Filtrar pedidos entregados por fecha
              let deliveredOrders = orders.filter((o: any) =>
                o.status === "delivered" || o.status === "Entregado"
              );

              if (isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo) {
                const fromDate = new Date(dashboardDateFrom + "T00:00:00");
                const toDate = new Date(dashboardDateTo + "T23:59:59");
                deliveredOrders = deliveredOrders.filter((o: any) => {
                  const orderDate = new Date(o.createdAt);
                  return orderDate >= fromDate && orderDate <= toDate;
                });
              }

              // Construir soldMap (igual que en Productos de Venta)
              const soldMap: Record<string, { qty: number; revenue: number }> = {};
              const addToSoldMap = (name: string, qty: number, revenue: number) => {
                const key = normalize(name);
                if (!key) return;
                if (!soldMap[key]) soldMap[key] = { qty: 0, revenue: 0 };
                soldMap[key].qty += qty;
                soldMap[key].revenue += revenue;
              };

              deliveredOrders.forEach((order: any) => {
                const items = order.completedOrders || order.cart || [];
                const couponFactor = 1 - (order.couponDiscount || 0) / 100;
                items.forEach((item: any) => {
                  // 1. Menú principal
                  const menuName = item.name || item.product?.name || "";
                  const qty = item.quantity || 0;
                  const price = (item.finalPrice ?? item.price ?? item.product?.price ?? 0) * couponFactor;
                  if (menuName) addToSoldMap(menuName, qty, price * qty);

                  // 2. Salsas
                  const itemSalsas: string[] = item.salsas || [];
                  itemSalsas.forEach((salsaId: string) => {
                    const salsa = salsas.find(s => s.id === salsaId);
                    if (salsa) addToSoldMap(salsa.name, 1, 0);
                  });

                  // 3. Complementos pagados
                  const compIds: string[] = item.complementIds || [];
                  compIds.forEach((compId: string) => {
                    const comp = availableComplements[compId];
                    if (comp) addToSoldMap(comp.name, 1, comp.price);
                  });
                });
              });

              // Calcular VENTAS y COGS
              let totalRevenue = 0;
              let totalCOGS = 0;
              saleProducts.forEach((p: any) => {
                const key = normalize(p.name || "");
                const sold = soldMap[key] || { qty: 0, revenue: 0 };
                const cost = p.cost || 0;
                totalRevenue += sold.revenue;
                totalCOGS += cost * sold.qty;
              });

              // Calcular GASTOS OPERATIVOS (compras/gastos del periodo)
              let filteredPurchases = inventory;
              if (isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo) {
                const fromDate = new Date(dashboardDateFrom + "T00:00:00");
                const toDate = new Date(dashboardDateTo + "T23:59:59");
                filteredPurchases = inventory.filter((purchase: any) => {
                  const purchaseDate = new Date(purchase.purchaseDate);
                  return purchaseDate >= fromDate && purchaseDate <= toDate;
                });
              }
              const gastosOperativos = filteredPurchases.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);

              // KPIs
              const margenBruto = totalCOGS > 0 ? ((totalRevenue - totalCOGS) / totalCOGS) * 100 : 0;
              const utilidadOperativa = totalRevenue - totalCOGS - gastosOperativos;
              const margenNeto = totalRevenue > 0 ? (utilidadOperativa / totalRevenue) * 100 : 0;

              return (
                <div>
                  {/* Header con filtros */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <h3 className="text-2xl font-black text-cyan-400">📊 Dashboard Financiero</h3>

                    {/* Filtros rápidos y manuales */}
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setDashboardDateFrom(today);
                            setDashboardDateTo(today);
                            setIsDashboardDateFiltered(true);
                          }}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          Hoy
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                            setDashboardDateFrom(firstDay.toISOString().split('T')[0]);
                            setDashboardDateTo(today.toISOString().split('T')[0]);
                            setIsDashboardDateFiltered(true);
                          }}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          Mes actual
                        </button>
                        <button
                          onClick={() => {
                            setDashboardDateFrom("");
                            setDashboardDateTo("");
                            setIsDashboardDateFiltered(false);
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          Ver histórico
                        </button>
                      </div>

                      {/* Selectores de fecha */}
                      <div className="flex gap-2 items-center text-xs">
                        <input
                          type="date"
                          value={dashboardDateFrom}
                          onChange={(e) => {
                            setDashboardDateFrom(e.target.value);
                            if (e.target.value && dashboardDateTo) setIsDashboardDateFiltered(true);
                          }}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                        <span className="text-gray-400">→</span>
                        <input
                          type="date"
                          value={dashboardDateTo}
                          onChange={(e) => {
                            setDashboardDateTo(e.target.value);
                            if (dashboardDateFrom && e.target.value) setIsDashboardDateFiltered(true);
                          }}
                          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Indicador del periodo */}
                  {isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo && (
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg px-4 py-2 mb-6 text-xs text-cyan-300">
                      📅 Mostrando datos del {new Date(dashboardDateFrom + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} al {new Date(dashboardDateTo + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  )}

                  {/* KPIs Grid - 2 filas x 3 columnas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Fila 1: Ventas, COGS, Margen Bruto */}

                    {/* Ventas */}
                    <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-xl border-2 border-green-500/50 p-5">
                      <p className="text-green-400 text-xs font-bold mb-1.5 uppercase">💵 Ventas</p>
                      <p className="text-4xl font-black text-green-400">S/ {totalRevenue.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{deliveredOrders.length} pedidos entregados</p>
                    </div>

                    {/* COGS */}
                    <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 rounded-xl border-2 border-orange-500/50 p-5">
                      <p className="text-orange-400 text-xs font-bold mb-1.5 uppercase">🍖 Costo de Ventas (COGS)</p>
                      <p className="text-4xl font-black text-orange-400">S/ {totalCOGS.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1.5">Costo de productos vendidos</p>
                    </div>

                    {/* Margen Bruto */}
                    <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 rounded-xl border-2 border-emerald-500/50 p-5">
                      <p className="text-emerald-400 text-xs font-bold mb-1.5 uppercase">📊 Margen Bruto</p>
                      <p className="text-4xl font-black text-emerald-400">{margenBruto.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        S/ {(totalRevenue - totalCOGS).toFixed(2)}
                      </p>
                    </div>

                    {/* Fila 2: Gastos Operativos, Utilidad Operativa, Margen Neto */}

                    {/* Gastos Operativos */}
                    <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-xl border-2 border-red-500/50 p-5">
                      <p className="text-red-400 text-xs font-bold mb-1.5 uppercase">📉 Gastos Operativos</p>
                      <p className="text-4xl font-black text-red-400">S/ {gastosOperativos.toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{filteredPurchases.length} compras/gastos</p>
                    </div>

                    {/* Utilidad Operativa */}
                    <div className={`bg-gradient-to-br ${utilidadOperativa >= 0 ? 'from-fuchsia-900/40 to-fuchsia-800/20 border-fuchsia-500/50' : 'from-amber-900/40 to-amber-800/20 border-amber-500/50'} rounded-xl border-2 p-5`}>
                      <p className={`${utilidadOperativa >= 0 ? 'text-fuchsia-400' : 'text-amber-400'} text-xs font-bold mb-1.5 uppercase`}>
                        ✅ Utilidad Operativa
                      </p>
                      <p className={`text-4xl font-black ${utilidadOperativa >= 0 ? 'text-fuchsia-400' : 'text-amber-400'}`}>
                        S/ {utilidadOperativa.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">Ventas - COGS - Gastos</p>
                    </div>

                    {/* Margen Neto */}
                    <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 rounded-xl border-2 border-cyan-500/50 p-5">
                      <p className="text-cyan-400 text-xs font-bold mb-1.5 uppercase">📈 Margen Neto</p>
                      <p className="text-4xl font-black text-cyan-400">{margenNeto.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {margenNeto >= 30 ? '¡Excelente!' : margenNeto >= 15 ? 'Bueno' : margenNeto >= 0 ? 'Mejorable' : 'Negativo'}
                      </p>
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="bg-cyan-900/10 border border-cyan-500/30 rounded-lg p-4 mt-6">
                    <p className="text-cyan-300 text-xs">
                      <span className="font-bold">💡 Información:</span> Este dashboard integra datos de ventas (Productos de Venta) y gastos operativos (Compras y Gastos) para darte una visión completa de tu negocio.
                      El <strong>Margen Bruto</strong> muestra rentabilidad de productos, mientras que el <strong>Margen Neto</strong> considera todos los gastos operativos.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* COMPRAS Y GASTOS */}
            {financialSection === "purchases" && (
              <>
                {(() => {
                  // Filtrar inventario
                  const filteredInventory = inventory.filter((purchase) => {
                    // Filtro por mes (por defecto mes actual)
                    if (inventoryMonthFilter) {
                      const purchaseDate = new Date(purchase.purchaseDate);
                      const purchaseYearMonth = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
                      if (purchaseYearMonth !== inventoryMonthFilter) {
                        return false;
                      }
                    }

                    // Filtro por fecha específica
                    if (inventoryDateFilter) {
                      const purchaseDate = new Date(purchase.purchaseDate).toISOString().split('T')[0];
                      if (purchaseDate !== inventoryDateFilter) {
                        return false;
                      }
                    }

                    // Filtro por nombre de producto
                    if (inventorySearchTerm) {
                      const searchLower = inventorySearchTerm.toLowerCase();
                      const hasMatchingProduct = purchase.items.some((item: any) =>
                        item.productName.toLowerCase().includes(searchLower)
                      );
                      if (!hasMatchingProduct) {
                        return false;
                      }
                    }

                    return true;
                  });

                  return (
                    <>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-4">💰 Compras y Gastos {getMonthName(inventoryMonthFilter)}</h3>

                  {/* Sub-tabs */}
                  <div className="flex gap-2 mb-4 border-b-2 border-fuchsia-500/20">
                    <button
                      onClick={() => setPurchasesSubTab("history")}
                      className={`px-6 py-3 font-bold transition-all text-sm ${
                        purchasesSubTab === "history"
                          ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      📋 Historial de Compras
                    </button>
                    <button
                      onClick={() => setPurchasesSubTab("stock")}
                      className={`px-6 py-3 font-bold transition-all text-sm ${
                        purchasesSubTab === "stock"
                          ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      📦 Control de Stock
                    </button>
                  </div>

                  {/* Header con filtros y botón */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <input
                        type="month"
                        value={inventoryMonthFilter}
                        onChange={(e) => setInventoryMonthFilter(e.target.value)}
                        className="px-3 py-2 text-sm rounded bg-black border border-gray-700 text-white focus:border-fuchsia-400 focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    {purchasesSubTab === "history" && (
                      <button
                        onClick={() => {
                          console.log('🔥 Click en Nueva Compra');
                          setShowInventoryModal(true);
                          setProductSearchTerms([""]);
                        }}
                        className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
                      >
                        + Nueva Compra
                      </button>
                    )}
                  </div>
                </div>

                {/* ========== HISTORIAL DE COMPRAS ========== */}
                {purchasesSubTab === "history" && (
                  <>
                    {/* Pequeño cartel con totales */}
                    <div className="flex gap-3 mb-6">
                  <div className="bg-gray-900/50 rounded px-3 py-1.5 border border-fuchsia-500/20">
                    <p className="text-xs text-gray-400">Compras del mes</p>
                    <p className="text-sm font-bold text-fuchsia-400">
                      S/ {filteredInventory.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded px-3 py-1.5 border border-cyan-500/20">
                    <p className="text-xs text-gray-400">Compras totales</p>
                    <p className="text-sm font-bold text-cyan-400">
                      S/ {inventory.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Inventory List - Formato Tabla Excel */}
                <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 overflow-hidden">
                  {filteredInventory.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xl text-gray-400">No hay compras en este mes</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-black/50">
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-left">FECHA</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-left">PROVEEDOR</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-left">PRODUCTO</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-center">CANTIDAD</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-center">UND</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-center">PAGO</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-right">TOTAL</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-right">COSTO UNITARIO</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-center">ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory.map((purchase) =>
                            purchase.items.map((item: any, itemIdx: number) => (
                              <tr key={`${purchase.id}-${itemIdx}`} className="hover:bg-fuchsia-500/5 transition-all">
                                <td className="border border-gray-700 px-3 py-2 text-xs text-gray-300">
                                  {new Date(purchase.purchaseDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </td>
                                <td className="border border-gray-700 px-3 py-2">
                                  <p className="text-xs font-bold text-white">{purchase.supplier}</p>
                                  {purchase.supplierPhone && <p className="text-xs text-gray-500">{purchase.supplierPhone}</p>}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-xs text-white font-bold">
                                  {item.productName || '-'}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-center text-xs text-white">
                                  {item.quantity}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-center text-xs text-gray-300">
                                  {item.unit}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-center text-xs text-cyan-400">
                                  {purchase.paymentMethod === 'plin-yape' && 'PLIN-YAPE'}
                                  {purchase.paymentMethod === 'efectivo' && 'EFECTIVO'}
                                  {purchase.paymentMethod === 'transferencia' && 'TRANSFERENCIA'}
                                  {purchase.paymentMethod === 'tarjeta' && 'TARJETA'}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-right">
                                  <p className="text-xs font-bold text-fuchsia-400">S/ {item.unitCost.toFixed(2)}</p>
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-right">
                                  <p className="text-xs font-bold text-amber-400">S/ {item.total.toFixed(2)}</p>
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-center">
                                  {itemIdx === 0 && (
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingPurchase(purchase);
                                          setShowInventoryEditModal(true);
                                        }}
                                        className="text-amber-400 hover:text-amber-300 text-sm"
                                        title="Editar"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => handleDeleteInventory(purchase.id)}
                                        className="text-red-400 hover:text-red-300 text-sm font-bold"
                                        title="Eliminar"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal de Detalles */}
                {showInventoryDetailModal && selectedPurchaseDetail && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-black text-fuchsia-400">Detalle de Compra</h3>
                        <button
                          onClick={() => setShowInventoryDetailModal(false)}
                          className="text-gray-400 hover:text-white text-2xl"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Información del Proveedor */}
                      <div className="bg-black/50 rounded-lg p-4 mb-4 border border-fuchsia-500/30">
                        <h4 className="text-sm font-bold text-fuchsia-400 mb-3">📋 Información del Proveedor</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400">Proveedor:</p>
                            <p className="text-white font-bold">{selectedPurchaseDetail.supplier}</p>
                          </div>
                          {selectedPurchaseDetail.supplierRuc && (
                            <div>
                              <p className="text-gray-400">RUC:</p>
                              <p className="text-white font-bold">{selectedPurchaseDetail.supplierRuc}</p>
                            </div>
                          )}
                          {selectedPurchaseDetail.supplierPhone && (
                            <div>
                              <p className="text-gray-400">Teléfono:</p>
                              <p className="text-white font-bold">{selectedPurchaseDetail.supplierPhone}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400">Fecha de Compra:</p>
                            <p className="text-white font-bold">
                              {new Date(selectedPurchaseDetail.purchaseDate).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Método de Pago:</p>
                            <p className="text-cyan-400 font-bold uppercase">{selectedPurchaseDetail.paymentMethod.replace('-', ' ')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Productos Comprados */}
                      <div className="bg-black/50 rounded-lg p-4 mb-4 border border-cyan-500/30">
                        <h4 className="text-sm font-bold text-cyan-400 mb-3">🛒 Productos Comprados</h4>
                        <div className="space-y-2">
                          {selectedPurchaseDetail.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-900 rounded px-3 py-2">
                              <div className="flex-1">
                                <p className="text-white font-bold text-sm">{item.productName}</p>
                                <p className="text-xs text-gray-400">
                                  {item.quantity} {item.unit} x S/ {item.unitCost.toFixed(2)}
                                </p>
                              </div>
                              <p className="text-fuchsia-400 font-bold">S/ {item.total.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total y Notas */}
                      <div className="bg-black/50 rounded-lg p-4 border border-amber-500/30">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-gray-400">Total de la Compra:</p>
                          <p className="text-2xl font-black text-amber-400">S/ {selectedPurchaseDetail.totalAmount.toFixed(2)}</p>
                        </div>
                        {selectedPurchaseDetail.notes && (
                          <div className="border-t border-gray-700 pt-3 mt-3">
                            <p className="text-gray-400 text-xs mb-1">Notas:</p>
                            <p className="text-white text-sm">{selectedPurchaseDetail.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                  </>
                )}

                {/* ========== CONTROL DE STOCK (NUEVA SECCIÓN) ========== */}
                {purchasesSubTab === "stock" && (
                  <div className="space-y-4">
                    {/* Encabezado */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-cyan-400">📦 Control de Stock</h3>
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={stockSearchTerm}
                        onChange={(e) => setStockSearchTerm(e.target.value)}
                        className="px-4 py-2 rounded bg-gray-900 border border-cyan-500/30 text-white focus:border-cyan-400 focus:outline-none text-sm"
                      />
                    </div>

                    {/* Tabla de Stock */}
                    <div className="bg-black/50 rounded-lg border border-cyan-500/20 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-cyan-900/20 border-b border-cyan-500/30">
                              <th className="px-4 py-3 text-left text-xs font-bold text-cyan-400">Producto</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-cyan-400">Categoría</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-green-400">Stock Actual</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-cyan-400">Unidad</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-red-400">Consumo Hoy</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-amber-400">Nuevo Stock</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-fuchsia-400">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Agrupar items por producto
                              const stockMap = new Map<string, { productName: string; category: string; unit: string; totalStock: number }>();

                              inventory.forEach((purchase: any) => {
                                purchase.items.forEach((item: any) => {
                                  // Excluir categoría SERVICIO
                                  if (item.category === "SERVICIO") return;

                                  const key = `${item.productName}-${item.unit}`;
                                  const existing = stockMap.get(key);
                                  const itemStock = (item.quantity || 0) * (item.volume || 1);

                                  if (existing) {
                                    existing.totalStock += itemStock;
                                  } else {
                                    stockMap.set(key, {
                                      productName: item.productName,
                                      category: item.category || "SIN CATEGORÍA",
                                      unit: item.unit,
                                      totalStock: itemStock
                                    });
                                  }
                                });
                              });

                              // Filtrar por búsqueda
                              const filteredStock = Array.from(stockMap.values()).filter(item =>
                                item.productName.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                                item.category.toLowerCase().includes(stockSearchTerm.toLowerCase())
                              );

                              if (filteredStock.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                      {inventory.length === 0
                                        ? "No hay compras registradas. Registra tu primera compra para comenzar el control de stock."
                                        : "No se encontraron productos."}
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredStock.map((item, idx) => {
                                const key = `${item.productName}-${item.unit}`;
                                const consumption = stockConsumptions.get(key) || 0;
                                const newStock = item.totalStock - consumption;

                                return (
                                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-900/50">
                                    <td className="px-4 py-3 text-sm text-white font-medium">{item.productName}</td>
                                    <td className="px-4 py-3 text-xs text-gray-300">
                                      <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700">
                                        {item.category === "INSUMO" && "🥘 INSUMO"}
                                        {item.category === "EMPAQUE" && "📦 EMPAQUE"}
                                        {item.category === "SERVICIO" && "⚡ SERVICIO"}
                                        {item.category === "UTENCILIO" && "🔧 UTENCILIO"}
                                        {!["INSUMO", "EMPAQUE", "SERVICIO", "UTENCILIO"].includes(item.category) && item.category}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-green-400 font-black text-base">{item.totalStock.toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs text-gray-400 font-medium">{item.unit}</td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max={item.totalStock}
                                        value={consumption === 0 ? '' : consumption}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          const newConsumptions = new Map(stockConsumptions);
                                          newConsumptions.set(key, Math.min(value, item.totalStock));
                                          setStockConsumptions(newConsumptions);
                                        }}
                                        className="w-20 px-2 py-1 text-sm rounded bg-red-900/30 border border-red-500/50 text-red-300 text-center focus:border-red-400 focus:outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`font-black text-base ${newStock < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                                        {newStock.toLocaleString()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={async () => {
                                          if (consumption > 0 && confirm(`¿Confirmar consumo de ${consumption} ${item.unit} de ${item.productName}?`)) {
                                            try {
                                              // Registrar deducción
                                              const response = await fetch("/api/deductions", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  orderId: "MANUAL",
                                                  orderName: "Consumo Manual",
                                                  items: [{
                                                    productName: item.productName,
                                                    quantity: consumption,
                                                    unit: item.unit
                                                  }],
                                                  deductionDate: new Date().toISOString().split('T')[0]
                                                })
                                              });

                                              if (!response.ok) {
                                                throw new Error("Error al guardar el consumo");
                                              }

                                              // Recargar inventario para actualizar stock
                                              const inventoryResponse = await fetch("/api/inventory");
                                              const updatedInventory = await inventoryResponse.json();
                                              setInventory(updatedInventory);

                                              // Limpiar consumo después de guardar
                                              const newConsumptions = new Map(stockConsumptions);
                                              newConsumptions.delete(key);
                                              setStockConsumptions(newConsumptions);

                                              // Mostrar confirmación
                                              alert(`✅ Consumo registrado: ${consumption} ${item.unit} de ${item.productName}`);
                                            } catch (error) {
                                              console.error("Error al guardar consumo:", error);
                                              alert("❌ Error al guardar el consumo. Intenta nuevamente.");
                                            }
                                          }
                                        }}
                                        disabled={consumption === 0}
                                        className="px-3 py-1 text-xs rounded font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      >
                                        Guardar
                                      </button>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="bg-cyan-900/10 border border-cyan-500/30 rounded-lg p-4">
                      <p className="text-cyan-300 text-xs">
                        <span className="font-bold">💡 Instrucciones:</span> Ingresa la cantidad consumida en la columna "Consumo Hoy" y presiona "Guardar" para actualizar el stock.
                      </p>
                    </div>
                  </div>
                )}
                    </>
                  );
                })()}
              </>
            )}

            {/* PRODUCTOS DE VENTA */}
            {financialSection === "products" && (() => {
              // Normaliza: quita tildes, mayúsculas, espacios extra → "Dúo Dilema" = "DUO DILEMA" = "duo dilema"
              const normalize = (s: string) =>
                s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

              const saleProducts = products.filter((p: any) => p.type === "sale");

              // --- Rendimiento: cruzar catálogo con pedidos entregados ---
              let deliveredOrders = orders.filter((o: any) =>
                o.status === "delivered" || o.status === "Entregado"
              );

              // Filtro por fechas
              if (isSalesDateFiltered && salesDateFrom && salesDateTo) {
                const fromDate = new Date(salesDateFrom + "T00:00:00");
                const toDate = new Date(salesDateTo + "T23:59:59");
                deliveredOrders = deliveredOrders.filter((o: any) => {
                  const orderDate = new Date(o.createdAt);
                  return orderDate >= fromDate && orderDate <= toDate;
                });
              }
              // Mapa nombre normalizado → { qty, revenue }
              const soldMap: Record<string, { qty: number; revenue: number }> = {};
              const addToSoldMap = (name: string, qty: number, revenue: number) => {
                const key = normalize(name);
                if (!key) return;
                if (!soldMap[key]) soldMap[key] = { qty: 0, revenue: 0 };
                soldMap[key].qty += qty;
                soldMap[key].revenue += revenue;
              };

              deliveredOrders.forEach((order: any) => {
                const items = order.completedOrders || order.cart || [];
                const couponFactor = 1 - (order.couponDiscount || 0) / 100;
                items.forEach((item: any) => {
                  // 1. Menú principal
                  const menuName = item.name || item.product?.name || "";
                  const qty = item.quantity || 0;
                  const price = (item.finalPrice ?? item.price ?? item.product?.price ?? 0) * couponFactor;
                  if (menuName) addToSoldMap(menuName, qty, price * qty);

                  // 2. Salsas (array de IDs de salsas base incluidas en el menú)
                  const itemSalsas: string[] = item.salsas || [];
                  itemSalsas.forEach((salsaId: string) => {
                    const salsa = salsas.find(s => s.id === salsaId);
                    if (salsa) addToSoldMap(salsa.name, 1, 0); // incluidas en precio, costo 0 o lo defines tú
                  });

                  // 3. Complementos pagados (bebidas, extras, salsas extra)
                  const compIds: string[] = item.complementIds || [];
                  compIds.forEach((compId: string) => {
                    const comp = availableComplements[compId];
                    if (comp) addToSoldMap(comp.name, 1, comp.price);
                  });
                });
              });

              // Construir filas de rendimiento cruzando catálogo + ventas
              const perfRows = saleProducts.map((p: any) => {
                const key = normalize(p.name || "");
                const sold = soldMap[key] || { qty: 0, revenue: 0 };
                const cost = p.cost || 0;
                const totalCost = cost * sold.qty;
                const netProfit = sold.revenue - totalCost;
                const margin = cost > 0 ? (sold.qty > 0 ? (netProfit / totalCost) * 100 : ((p.price - cost) / cost) * 100) : 0;
                return { ...p, sold: sold.qty, revenue: sold.revenue, totalCost, netProfit, margin };
              }).sort((a: any, b: any) => b.sold - a.sold);

              // KPIs globales
              const totalRevenue = perfRows.reduce((s: number, r: any) => s + r.revenue, 0);
              const totalCostAll = perfRows.reduce((s: number, r: any) => s + r.totalCost, 0);
              const totalProfit = totalRevenue - totalCostAll;
              // Margen promedio: solo productos con ventas
              const soldProducts = perfRows.filter((r: any) => r.sold > 0);
              const avgMargin = soldProducts.length > 0 ? soldProducts.reduce((s: number, r: any) => s + r.margin, 0) / soldProducts.length : 0;

              const catLabel: Record<string, string> = {
                fat: "🍗 FAT", fit: "🥗 FIT", bebida: "🥤 Bebida",
                complemento: "➕ Complemento", extra: "⚡ Extra",
                "extra-papas": "🍟 Extra Papas", "extra-salsas": "🌶️ Extra Salsas",
              };

              return (
                <div className="space-y-8">
                  {/* ── SECCIÓN 1: CATÁLOGO ── */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-black text-cyan-400">📋 Catálogo de Productos</h3>
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({ name: "", category: "fat", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] });
                          setShowProductModal(true);
                        }}
                        className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm"
                      >
                        + Nuevo Producto
                      </button>
                    </div>

                    <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-black/60 border-b-2 border-fuchsia-500/30">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-fuchsia-400 uppercase">Producto</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-fuchsia-400 uppercase hidden md:table-cell">Categoría</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-green-400 uppercase">Precio Venta</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-red-400 uppercase">Costo</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-purple-400 uppercase">Margen</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-fuchsia-400 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleProducts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                                Sin productos registrados. Usa "+ Nuevo Producto" para empezar.
                              </td>
                            </tr>
                          ) : (
                            saleProducts.map((product: any, idx: number) => {
                              const margin = (product.cost || 0) > 0
                                ? ((product.price - (product.cost || 0)) / (product.cost || 0)) * 100 : 0;
                              return (
                                <tr key={product.id} className={`border-b border-fuchsia-500/10 hover:bg-fuchsia-500/5 transition-all ${idx % 2 === 0 ? 'bg-black/20' : ''}`}>
                                  <td className="px-4 py-3 text-white font-bold text-sm">{product.name}</td>
                                  <td className="px-4 py-3 hidden md:table-cell">
                                    <span className="text-xs text-gray-400">{catLabel[product.category] || product.category}</span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-green-400 font-black text-sm">S/ {(product.price || 0).toFixed(2)}</td>
                                  <td className="px-4 py-3 text-right text-red-400 text-sm">S/ {(product.cost || 0).toFixed(2)}</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`font-black text-sm ${margin >= 50 ? 'text-green-400' : margin >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                                      {margin.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex gap-1 justify-center">
                                      <button onClick={() => openEditProduct(product)} className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded text-xs font-bold">Editar</button>
                                      <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Eliminar</button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── SECCIÓN 2: RENDIMIENTO DE VENTAS ── */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-black text-amber-400">📊 Rendimiento de Ventas (Pedidos Entregados)</h3>
                    </div>

                    {/* Filtro de fechas */}
                    <div className="bg-gray-900 rounded-lg border-2 border-amber-500/30 p-4 mb-5">
                      <div className="flex flex-col gap-3">
                        {/* Indicador período activo */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Mostrando:</span>
                          {isSalesDateFiltered ? (
                            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold">
                              📅 {new Date(salesDateFrom).toLocaleDateString("es-PE", { day: '2-digit', month: 'short' })} - {new Date(salesDateTo).toLocaleDateString("es-PE", { day: '2-digit', month: 'short' })}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-full text-gray-300 text-xs font-bold">
                              📊 Histórico completo
                            </span>
                          )}
                        </div>

                        {/* Controles */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Botones rápidos */}
                          <button
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              setSalesDateFrom(today);
                              setSalesDateTo(today);
                              setIsSalesDateFiltered(true);
                            }}
                            className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg font-bold text-xs"
                          >
                            Hoy
                          </button>
                          <button
                            onClick={() => {
                              const today = new Date();
                              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                              setSalesDateFrom(firstDay.toISOString().split('T')[0]);
                              setSalesDateTo(today.toISOString().split('T')[0]);
                              setIsSalesDateFiltered(true);
                            }}
                            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-xs"
                          >
                            Mes actual
                          </button>
                          <button
                            onClick={() => {
                              setIsSalesDateFiltered(false);
                              setSalesDateFrom("");
                              setSalesDateTo("");
                            }}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-xs"
                          >
                            Ver histórico
                          </button>

                          <div className="w-px h-6 bg-gray-700 mx-1"></div>

                          {/* Date pickers */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400">Desde:</label>
                            <input
                              type="date"
                              value={salesDateFrom}
                              onChange={(e) => setSalesDateFrom(e.target.value)}
                              className="px-2 py-1 text-xs rounded bg-black border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none [color-scheme:dark]"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400">Hasta:</label>
                            <input
                              type="date"
                              value={salesDateTo}
                              onChange={(e) => setSalesDateTo(e.target.value)}
                              className="px-2 py-1 text-xs rounded bg-black border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none [color-scheme:dark]"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (salesDateFrom && salesDateTo) setIsSalesDateFiltered(true);
                            }}
                            disabled={!salesDateFrom || !salesDateTo}
                            className="px-3 py-1.5 bg-fuchsia-700 hover:bg-fuchsia-600 text-white rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      <div className="bg-gray-900 rounded-xl border border-green-500/40 p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Ingresos Totales</p>
                        <p className="text-xl font-black text-green-400">S/ {totalRevenue.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-900 rounded-xl border border-red-500/40 p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Costo Total</p>
                        <p className="text-xl font-black text-red-400">S/ {totalCostAll.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-900 rounded-xl border border-amber-500/40 p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Utilidad Operativa</p>
                        <p className={`text-xl font-black ${totalProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>S/ {totalProfit.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-900 rounded-xl border border-purple-500/40 p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Margen Promedio</p>
                        <p className={`text-xl font-black ${avgMargin >= 50 ? 'text-green-400' : avgMargin >= 30 ? 'text-amber-400' : 'text-red-400'}`}>{avgMargin.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Tabla de rendimiento */}
                    <div className="bg-gray-900 rounded-xl border-2 border-amber-500/30 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-black/60 border-b-2 border-amber-500/30">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-amber-400 uppercase">Producto</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-amber-400 uppercase">Uds. Vendidas</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-green-400 uppercase">Ingresos</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-red-400 uppercase">Costo Total</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-amber-400 uppercase">Utilidad Operativa</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-purple-400 uppercase">Margen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perfRows.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                                Registra productos en el catálogo para ver el rendimiento.
                              </td>
                            </tr>
                          ) : (
                            perfRows.map((row: any, idx: number) => (
                              <tr key={row.id} className={`border-b border-amber-500/10 hover:bg-amber-500/5 transition-all ${idx % 2 === 0 ? 'bg-black/20' : ''}`}>
                                <td className="px-4 py-3 text-white font-bold text-sm">{row.name}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-fuchsia-400 font-black text-sm">{row.sold}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-green-400 font-bold text-sm">S/ {row.revenue.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-red-400 text-sm">S/ {row.totalCost.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`font-black text-sm ${row.netProfit >= 0 ? 'text-amber-400' : 'text-red-500'}`}>
                                    S/ {row.netProfit.toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`font-black text-sm ${row.margin >= 50 ? 'text-green-400' : row.margin >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {row.margin.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {perfRows.length > 0 && (
                          <tfoot className="border-t-2 border-amber-500/30 bg-black/40">
                            <tr>
                              <td className="px-4 py-3 text-white font-black text-sm">TOTAL</td>
                              <td className="px-4 py-3 text-center text-fuchsia-400 font-black text-sm">
                                {perfRows.reduce((s: number, r: any) => s + r.sold, 0)}
                              </td>
                              <td className="px-4 py-3 text-right text-green-400 font-black text-sm">S/ {totalRevenue.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-red-400 font-black text-sm">S/ {totalCostAll.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-amber-400 font-black text-sm">S/ {totalProfit.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-purple-400 font-black text-sm">{avgMargin.toFixed(1)}%</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* STOCK DE EMPAQUES - ELIMINADO (Sistema ahora es 100% manual) */}
          </section>

          {/* Recipe Configuration Modal */}
          {showRecipeModal && editingRecipeProduct && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-gray-900 rounded-xl border-2 border-purple-500 p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-purple-400">🧾 Configurar Receta</h3>
                    <p className="text-cyan-400 text-lg font-bold mt-1">{editingRecipeProduct.name}</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Define qué empaques/insumos se usan para preparar este producto y en qué cantidades
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRecipeModal(false);
                      setEditingRecipeProduct(null);
                      setRecipeComponents([]);
                    }}
                    className="text-gray-400 hover:text-white text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Components List */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-bold text-cyan-400">Componentes de la Receta</h4>
                    <button
                      onClick={addRecipeComponent}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm"
                    >
                      + Agregar Componente
                    </button>
                  </div>

                  {recipeComponents.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg border-2 border-purple-500/30 p-8 text-center">
                      <p className="text-gray-400 text-lg">No hay componentes configurados</p>
                      <p className="text-gray-500 text-sm mt-2">Haz clic en "Agregar Componente" para empezar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-black/50 rounded-lg border border-purple-500/30">
                        <div className="col-span-4 text-xs font-bold text-purple-400">INGREDIENTE/EMPAQUE</div>
                        <div className="col-span-2 text-xs font-bold text-purple-400">CANTIDAD</div>
                        <div className="col-span-2 text-xs font-bold text-purple-400">UNIDAD</div>
                        <div className="col-span-3 text-xs font-bold text-purple-400">COSTO (S/)</div>
                        <div className="col-span-1 text-xs font-bold text-purple-400 text-center"></div>
                      </div>

                      {/* Components - MANUAL INPUT */}
                      {recipeComponents.map((component, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-gray-800 rounded-lg p-3 border border-purple-500/20">
                          {/* Nombre del ingrediente/empaque - INPUT MANUAL */}
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={component.productName || ""}
                              onChange={(e) => updateRecipeComponent(idx, 'productName', e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 rounded bg-black border border-purple-500/30 text-white text-sm focus:border-purple-400 focus:outline-none"
                              placeholder="Ej: PECHUGA, CAJA, LECHUGA"
                            />
                          </div>

                          {/* Cantidad - INPUT MANUAL */}
                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={component.quantity}
                              onChange={(e) => updateRecipeComponent(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 rounded bg-black border border-purple-500/30 text-white text-sm text-center focus:border-purple-400 focus:outline-none"
                              placeholder="0"
                            />
                          </div>

                          {/* Unidad - SELECT MANUAL */}
                          <div className="col-span-2">
                            <select
                              value={component.unit || ""}
                              onChange={(e) => updateRecipeComponent(idx, 'unit', e.target.value)}
                              className="w-full px-3 py-2 rounded bg-black border border-purple-500/30 text-white text-sm focus:border-purple-400 focus:outline-none"
                            >
                              <option value="">Seleccionar</option>
                              <option value="UNIDAD">UNIDAD</option>
                              <option value="KG">KG</option>
                              <option value="GRAMOS">GRAMOS</option>
                              <option value="LITROS">LITROS</option>
                              <option value="ML">ML</option>
                              <option value="CIENTO">CIENTO</option>
                              <option value="PAQUETE">PAQUETE</option>
                            </select>
                          </div>

                          {/* Costo - INPUT MANUAL */}
                          <div className="col-span-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={component.cost || 0}
                              onChange={(e) => updateRecipeComponent(idx, 'cost', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 rounded bg-black border border-purple-500/30 text-white text-sm focus:border-purple-400 focus:outline-none"
                              placeholder="0.00"
                            />
                          </div>

                          {/* Delete Button */}
                          <div className="col-span-1 text-center">
                            <button
                              onClick={() => removeRecipeComponent(idx)}
                              className="text-red-400 hover:text-red-300 font-bold text-lg"
                              title="Eliminar componente"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Costo Total de la Receta */}
                {recipeComponents.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border-2 border-purple-500/50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 text-sm font-semibold">Costo Total de la Receta</p>
                        <p className="text-xs text-gray-500 mt-1">{recipeComponents.length} componentes</p>
                      </div>
                      <p className="text-3xl font-black text-purple-400">
                        S/ {recipeComponents.reduce((sum, comp) => sum + (comp.cost || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}


                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRecipeModal(false);
                      setEditingRecipeProduct(null);
                      setRecipeComponents([]);
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveRecipe}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition-all neon-border-purple"
                  >
                    ✓ Guardar Receta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Modal - SIMPLE Y MANUAL */}
          {showProductModal && (() => {
            const price = productForm.price || 0;
            const cost = productForm.cost || 0;
            const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
            return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-black text-fuchsia-400">
                    {editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                  </h3>
                  <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-fuchsia-400 uppercase mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none text-sm"
                      placeholder="Ej: PEQUEÑO DILEMA, COCA-COLA, EXTRA PAPAS"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fuchsia-400 uppercase mb-1">Categoría *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none text-sm"
                    >
                      <option value="fat">🍗 FAT (Alitas)</option>
                      <option value="fit">🥗 FIT (Ensaladas)</option>
                      <option value="bebida">🥤 Bebida</option>
                      <option value="complemento">➕ Complemento</option>
                      <option value="extra">⚡ Extra</option>
                      <option value="extra-papas">🍟 Extra Papas</option>
                      <option value="extra-salsas">🌶️ Extra Salsas</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-green-400 uppercase mb-1">Precio de Venta (S/) *</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-green-500/30 text-green-400 focus:border-green-400 focus:outline-none text-sm font-bold"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-red-400 uppercase mb-1">Costo (S/) *</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={productForm.cost}
                        onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-red-500/30 text-red-400 focus:border-red-400 focus:outline-none text-sm font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Preview margen */}
                  {price > 0 && (
                    <div className={`rounded-lg px-4 py-2 text-center border ${margin >= 50 ? 'bg-green-900/20 border-green-500/30' : margin >= 30 ? 'bg-amber-900/20 border-amber-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                      <p className="text-xs text-gray-400">Margen calculado</p>
                      <p className={`text-2xl font-black ${margin >= 50 ? 'text-green-400' : margin >= 30 ? 'text-amber-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Utilidad por unidad: S/ {(price - cost).toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => { setShowProductModal(false); setEditingProduct(null); setProductForm({ name: "", category: "fat", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] }); }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
                </div>
              </div>
            </div>
            );
          })()}
        </>
      ) : activeTab === "marketing-OLD-DELETE" ? (
        /* OLD INVENTORY SECTION - TO BE DELETED */
        <>
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-black text-fuchsia-400 neon-glow-purple mb-6">VIEJO - ELIMINAR</h2>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-8 border-b-2 border-fuchsia-500/20">
              <button
                onClick={() => setInventorySection("purchases")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  inventorySection === "purchases"
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                🛒 Compras y Gastos
              </button>
              <button
                onClick={() => setInventorySection("stock")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  inventorySection === "stock"
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                📊 Control de Stock
              </button>
            </div>

            {inventorySection === "purchases" && (
              <>
                {(() => {
                  // Filtrar inventario
                  const filteredInventory = inventory.filter((purchase) => {
                    // Filtro por mes (por defecto mes actual)
                    if (inventoryMonthFilter) {
                      const purchaseDate = new Date(purchase.purchaseDate);
                      const purchaseYearMonth = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
                      if (purchaseYearMonth !== inventoryMonthFilter) {
                        return false;
                      }
                    }

                    // Filtro por fecha específica
                    if (inventoryDateFilter) {
                      const purchaseDate = new Date(purchase.purchaseDate).toISOString().split('T')[0];
                      if (purchaseDate !== inventoryDateFilter) {
                        return false;
                      }
                    }

                    // Filtro por nombre de producto
                    if (inventorySearchTerm) {
                      const searchLower = inventorySearchTerm.toLowerCase();
                      const hasMatchingProduct = purchase.items.some((item: any) =>
                        item.productName.toLowerCase().includes(searchLower)
                      );
                      if (!hasMatchingProduct) {
                        return false;
                      }
                    }

                    return true;
                  });

                  return (
                    <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-white">Compras {getMonthName(inventoryMonthFilter)}</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="month"
                      value={inventoryMonthFilter}
                      onChange={(e) => setInventoryMonthFilter(e.target.value)}
                      className="px-3 py-2 text-sm rounded bg-black border border-gray-700 text-white focus:border-fuchsia-400 focus:outline-none [color-scheme:dark]"
                    />
                    <button
                      onClick={() => {
                        console.log('🔥 Click en Nueva Compra');
                        setShowInventoryModal(true);
                        setProductSearchTerms([""]);
                      }}
                      className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
                    >
                      + Nueva Compra
                    </button>
                  </div>
                </div>

                {/* Pequeño cartel con totales */}
                <div className="flex gap-3 mb-6">
                  <div className="bg-gray-900/50 rounded px-3 py-1.5 border border-fuchsia-500/20">
                    <p className="text-xs text-gray-400">Compras del mes</p>
                    <p className="text-sm font-bold text-fuchsia-400">
                      S/ {filteredInventory.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded px-3 py-1.5 border border-cyan-500/20">
                    <p className="text-xs text-gray-400">Compras totales</p>
                    <p className="text-sm font-bold text-cyan-400">
                      S/ {inventory.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Inventory List - Formato Tabla Excel */}
                <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 overflow-hidden">
                  {filteredInventory.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xl text-gray-400">No hay compras en este mes</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-black/50">
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-left">FECHA</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-left">PROVEEDOR</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-left">PRODUCTO</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-center">CANTIDAD</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-center">UND</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-center">PAGO</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-right">TOTAL</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-right">COSTO UNITARIO</th>
                            <th className="border border-gray-700 px-3 py-2 text-xs font-bold text-gray-400 text-center">ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory.map((purchase) =>
                            purchase.items.map((item: any, itemIdx: number) => (
                              <tr key={`${purchase.id}-${itemIdx}`} className="hover:bg-fuchsia-500/5 transition-all">
                                <td className="border border-gray-700 px-3 py-2 text-xs text-gray-300">
                                  {new Date(purchase.purchaseDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </td>
                                <td className="border border-gray-700 px-3 py-2">
                                  <p className="text-xs font-bold text-white">{purchase.supplier}</p>
                                  {purchase.supplierPhone && <p className="text-xs text-gray-500">{purchase.supplierPhone}</p>}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-xs text-white font-bold">
                                  {item.productName || '-'}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-center text-xs text-white">
                                  {item.quantity}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-center text-xs text-gray-300">
                                  {item.unit}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-center text-xs text-cyan-400">
                                  {purchase.paymentMethod === 'plin-yape' && 'PLIN-YAPE'}
                                  {purchase.paymentMethod === 'efectivo' && 'EFECTIVO'}
                                  {purchase.paymentMethod === 'transferencia' && 'TRANSFERENCIA'}
                                  {purchase.paymentMethod === 'tarjeta' && 'TARJETA'}
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-right">
                                  <p className="text-xs font-bold text-fuchsia-400">S/ {item.unitCost.toFixed(2)}</p>
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-right">
                                  <p className="text-xs font-bold text-amber-400">S/ {item.total.toFixed(2)}</p>
                                </td>
                                <td className="border border-gray-700 px-3 py-2 text-center">
                                  {itemIdx === 0 && (
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingPurchase(purchase);
                                          setShowInventoryEditModal(true);
                                        }}
                                        className="text-amber-400 hover:text-amber-300 text-sm"
                                        title="Editar"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => handleDeleteInventory(purchase.id)}
                                        className="text-red-400 hover:text-red-300 text-sm font-bold"
                                        title="Eliminar"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal de Detalles */}
                {showInventoryDetailModal && selectedPurchaseDetail && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-black text-fuchsia-400">Detalle de Compra</h3>
                        <button
                          onClick={() => setShowInventoryDetailModal(false)}
                          className="text-gray-400 hover:text-white text-2xl"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Información del Proveedor */}
                      <div className="bg-black/50 rounded-lg p-4 mb-4 border border-fuchsia-500/30">
                        <h4 className="text-sm font-bold text-fuchsia-400 mb-3">📋 Información del Proveedor</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400">Proveedor:</p>
                            <p className="text-white font-bold">{selectedPurchaseDetail.supplier}</p>
                          </div>
                          {selectedPurchaseDetail.supplierRuc && (
                            <div>
                              <p className="text-gray-400">RUC:</p>
                              <p className="text-white font-bold">{selectedPurchaseDetail.supplierRuc}</p>
                            </div>
                          )}
                          {selectedPurchaseDetail.supplierPhone && (
                            <div>
                              <p className="text-gray-400">Teléfono:</p>
                              <p className="text-white font-bold">{selectedPurchaseDetail.supplierPhone}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400">Fecha de Compra:</p>
                            <p className="text-white font-bold">
                              {new Date(selectedPurchaseDetail.purchaseDate).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Método de Pago:</p>
                            <p className="text-white font-bold">
                              {selectedPurchaseDetail.paymentMethod === 'plin-yape' && '📱 Plin / Yape'}
                              {selectedPurchaseDetail.paymentMethod === 'efectivo' && '💵 Efectivo'}
                              {selectedPurchaseDetail.paymentMethod === 'transferencia' && '🏦 Transferencia'}
                              {selectedPurchaseDetail.paymentMethod === 'tarjeta' && '💳 Tarjeta'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">ID de Compra:</p>
                            <p className="text-white font-bold">#{selectedPurchaseDetail.id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Artículos */}
                      <div className="bg-black/50 rounded-lg p-4 mb-4 border border-fuchsia-500/30">
                        <h4 className="text-sm font-bold text-fuchsia-400 mb-3">📦 Artículos Comprados</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-900">
                                <th className="border border-gray-700 px-2 py-2 text-xs font-bold text-gray-400 text-left">Producto</th>
                                <th className="border border-gray-700 px-2 py-2 text-xs font-bold text-gray-400 text-center">Cantidad</th>
                                <th className="border border-gray-700 px-2 py-2 text-xs font-bold text-gray-400 text-center">Unidad</th>
                                <th className="border border-gray-700 px-2 py-2 text-xs font-bold text-gray-400 text-right">Total</th>
                                <th className="border border-gray-700 px-2 py-2 text-xs font-bold text-gray-400 text-right">C. Unit.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPurchaseDetail.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="border border-gray-700 px-2 py-2 text-xs text-white">{item.productName}</td>
                                  <td className="border border-gray-700 px-2 py-2 text-xs text-center text-white">{item.quantity}</td>
                                  <td className="border border-gray-700 px-2 py-2 text-xs text-center text-gray-300">{item.unit}</td>
                                  <td className="border border-gray-700 px-2 py-2 text-xs text-right text-fuchsia-400 font-bold">
                                    S/ {item.unitCost.toFixed(2)}
                                  </td>
                                  <td className="border border-gray-700 px-2 py-2 text-xs text-right text-amber-400 font-bold">
                                    S/ {item.total.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-lg p-4 border-2 border-fuchsia-500/50 mb-4">
                        <div className="flex justify-between items-center">
                          <p className="text-white font-bold">TOTAL DE LA COMPRA</p>
                          <p className="text-3xl font-black text-fuchsia-400">
                            S/ {selectedPurchaseDetail.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Notas */}
                      {selectedPurchaseDetail.notes && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400">
                            <span className="font-bold text-amber-400">📝 Notas:</span> {selectedPurchaseDetail.notes}
                          </p>
                        </div>
                      )}

                      {/* Botón Cerrar */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => setShowInventoryDetailModal(false)}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-all"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                    </>
                  );
                })()}
              </>
            )}

            {inventorySection === "stock" && (
              <>
                {(() => {
                  // Calcular stock basado en compras
                  const stockMap = new Map<string, { productName: string; unit: string; totalQuantity: number; purchases: number }>();

                  inventory.forEach((purchase) => {
                    purchase.items.forEach((item: any) => {
                      // Excluir categoría SERVICIO
                      if (item.category === "SERVICIO") return;

                      const key = `${item.productName}-${item.unit}`;
                      // Calcular stock: cantidad × volumen
                      const stockQuantity = item.quantity * (item.volume || 1);

                      if (stockMap.has(key)) {
                        const existing = stockMap.get(key)!;
                        existing.totalQuantity += stockQuantity;
                        existing.purchases += 1;
                      } else {
                        stockMap.set(key, {
                          productName: item.productName,
                          unit: item.unit,
                          totalQuantity: stockQuantity,
                          purchases: 1
                        });
                      }
                    });
                  });

                  // Restar deducciones del stock
                  deductions.forEach((deduction: any) => {
                    deduction.items.forEach((item: any) => {
                      const key = `${item.productName}-${item.unit}`;
                      if (stockMap.has(key)) {
                        const existing = stockMap.get(key)!;
                        existing.totalQuantity -= item.quantity;
                      }
                    });
                  });

                  const stockItems = Array.from(stockMap.values()).sort((a, b) =>
                    a.productName.localeCompare(b.productName)
                  );

                  // Filtrar items de stock según búsqueda
                  const filteredStockItems = stockItems.filter((item) => {
                    if (!stockSearchTerm) return true;
                    const searchLower = stockSearchTerm.toLowerCase();
                    return item.productName.toLowerCase().includes(searchLower);
                  });

                  return (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-white">Control de Stock</h3>
                        <input
                          type="text"
                          value={stockSearchTerm}
                          onChange={(e) => setStockSearchTerm(e.target.value)}
                          placeholder="🔍 Buscar producto..."
                          className="px-3 py-2 text-sm rounded bg-black border border-gray-700 text-white focus:border-cyan-400 focus:outline-none w-64"
                        />
                      </div>

                      {/* Tabla de Stock */}
                      <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 overflow-hidden">
                        {filteredStockItems.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-xl text-gray-400">No hay stock registrado</p>
                          </div>
                        ) : (
                          <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <thead className="bg-black">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-fuchsia-400 border border-fuchsia-500/30">PRODUCTO</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-fuchsia-400 border border-fuchsia-500/30">UNIDAD</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-fuchsia-400 border border-fuchsia-500/30">CANTIDAD EN STOCK</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-fuchsia-400 border border-fuchsia-500/30"># COMPRAS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredStockItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-black/50 transition-all">
                                  <td className="px-6 py-3 text-white font-bold border border-fuchsia-500/10">{item.productName}</td>
                                  <td className="px-6 py-3 text-center text-cyan-400 font-bold border border-fuchsia-500/10">
                                    {item.unit}
                                  </td>
                                  <td className="px-6 py-3 text-center text-green-400 font-black text-lg border border-fuchsia-500/10">
                                    {item.totalQuantity}
                                  </td>
                                  <td className="px-6 py-3 text-center text-gray-400 border border-fuchsia-500/10">
                                    {item.purchases}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}

          </section>

          {/* Catalog Product Modal */}
          {showCatalogModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-6 max-w-md w-full">
                <h3 className="text-xl font-black text-fuchsia-400 mb-4">
                  {editingCatalogProduct ? '✏️ Editar Producto' : '📦 Nuevo Producto'}
                </h3>

                <div className="space-y-4">
                  {editingCatalogProduct && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">ID del Producto</label>
                      <input
                        type="text"
                        value={catalogForm.productId}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded cursor-not-allowed"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Nombre del Producto *</label>
                    <input
                      type="text"
                      value={catalogForm.name}
                      onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value.toUpperCase() })}
                      placeholder="NOMBRE DEL PRODUCTO"
                      className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded focus:border-fuchsia-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Categoría *</label>
                    <select
                      value={catalogForm.category}
                      onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded focus:border-fuchsia-400 focus:outline-none"
                    >
                      <option value="">Seleccionar categoría *</option>
                      <option value="EMPAQUE">EMPAQUE</option>
                      <option value="INSUMO">INSUMO</option>
                      <option value="SERVICIO">SERVICIO</option>
                      <option value="COSTO FIJO">COSTO FIJO</option>
                      <option value="UTENCILIO">UTENCILIO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Unidad de Medida *</label>
                    <select
                      value={catalogForm.unit}
                      onChange={(e) => setCatalogForm({ ...catalogForm, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded focus:border-fuchsia-400 focus:outline-none"
                    >
                      <option value="">Seleccionar unidad *</option>
                      <option value="UNIDAD">UNIDAD</option>
                      <option value="KG">KG</option>
                      <option value="LITROS">LITROS</option>
                      <option value="GRAMOS">GRAMOS</option>
                      <option value="SERVICIO">SERVICIO</option>
                      <option value="CIENTO">CIENTO</option>
                      <option value="MEDIO MILLAR">MEDIO MILLAR</option>
                      <option value="MILLAR">MILLAR</option>
                      <option value="PAQUETE">PAQUETE</option>
                      <option value="CAJA">CAJA</option>
                      <option value="BOLSA">BOLSA</option>
                      <option value="BALDE">BALDE</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCatalogModal(false);
                      setCatalogForm({ productId: "", name: "", category: "", unit: "" });
                      setEditingCatalogProduct(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateCatalogProduct}
                    className="flex-1 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg font-bold transition-all"
                  >
                    Registrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL ELIMINADO - AHORA ESTÁ FUERA DE LOS TABS */}
          {false && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-4 max-w-5xl w-full max-h-[95vh] overflow-y-auto" style={{ position: 'relative' }}>
                <h3 className="text-xl font-black text-fuchsia-400 mb-3">📦 Registrar Nueva Compra</h3>

                {/* Información Compacta en Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">RUC</label>
                    <input
                      type="text"
                      value={inventoryForm.supplierRuc}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, supplierRuc: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm rounded bg-black border border-gray-700 text-white focus:border-fuchsia-400 focus:outline-none"
                      placeholder="20123456789"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fuchsia-400 mb-1">Nombre del proveedor *</label>
                    <input
                      type="text"
                      value={inventoryForm.supplier}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, supplier: e.target.value.toUpperCase() })}
                      className="w-full px-2 py-1.5 text-sm rounded bg-black border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                      placeholder="Nombre proveedor"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={inventoryForm.supplierPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setInventoryForm({ ...inventoryForm, supplierPhone: value });
                      }}
                      className="w-full px-2 py-1.5 text-sm rounded bg-black border border-gray-700 text-white focus:border-fuchsia-400 focus:outline-none"
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fuchsia-400 mb-1">Fecha de compra *</label>
                    <input
                      type="date"
                      value={inventoryForm.purchaseDate}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, purchaseDate: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm rounded bg-black border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fuchsia-400 mb-1">Método de pago *</label>
                    <select
                      value={inventoryForm.paymentMethod}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, paymentMethod: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm rounded bg-black border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                    >
                      <option value="plin-yape">📱 Plin / Yape</option>
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="transferencia">🏦 Transferencia</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                    </select>
                  </div>
                </div>

                {/* Lista de Artículos */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-white">📋 Artículos</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowNewMaterialForm(!showNewMaterialForm)}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                      >
                        + Nuevo Material
                      </button>
                      <button
                        onClick={addInventoryItem}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                      >
                        + Item
                      </button>
                    </div>
                  </div>

                  {/* Formulario para nuevo material */}
                  {showNewMaterialForm && (
                    <div className="bg-gray-900 rounded-lg p-3 mb-3 border border-amber-500/30">
                      <p className="text-sm font-bold text-amber-400 mb-2">Agregar Nuevo Material al Catálogo</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1">Nombre del Material *</label>
                          <input
                            type="text"
                            placeholder="Ej: TENEDORES TRANSPARENTES"
                            value={newMaterialForm.productName}
                            onChange={(e) => setNewMaterialForm({ ...newMaterialForm, productName: e.target.value.toUpperCase() })}
                            className="w-full px-2 py-1.5 text-sm rounded bg-black border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1">Unidad de Medida *</label>
                          <select
                            value={newMaterialForm.unit}
                            onChange={(e) => setNewMaterialForm({ ...newMaterialForm, unit: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm rounded bg-black border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="UNIDAD">UNIDAD</option>
                            <option value="KG">KG</option>
                            <option value="LITROS">LITROS</option>
                            <option value="GRAMOS">GRAMOS</option>
                            <option value="CIENTO">CIENTO</option>
                            <option value="MEDIO MILLAR">MEDIO MILLAR</option>
                            <option value="MILLAR">MILLAR</option>
                            <option value="PAQUETE">PAQUETE</option>
                            <option value="CAJA">CAJA</option>
                            <option value="BOLSA">BOLSA</option>
                            <option value="BALDE">BALDE</option>
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => {
                              setShowNewMaterialForm(false);
                              setNewMaterialForm({ productName: "", unit: "" });
                            }}
                            className="flex-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition-all"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={async () => {
                              if (newMaterialForm.productName && newMaterialForm.unit) {
                                try {
                                  // Crear el material en el catálogo de productos
                                  const response = await fetch("/api/products", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      name: newMaterialForm.productName,
                                      category: "EMPAQUE", // Categoría por defecto
                                      unit: newMaterialForm.unit,
                                      price: 0,
                                      cost: 0,
                                      active: true,
                                      stock: 0,
                                      minStock: 10,
                                      maxStock: 100,
                                    }),
                                  });

                                  if (response.ok) {
                                    await loadCatalogProducts(); // Recargar catálogo
                                    setShowNewMaterialForm(false);
                                    setNewMaterialForm({ productName: "", unit: "" });
                                    alert(`✅ Material "${newMaterialForm.productName}" agregado al catálogo`);
                                  }
                                } catch (error) {
                                  console.error("Error al crear material:", error);
                                  alert("Error al crear el material");
                                }
                              }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded font-bold transition-all"
                          >
                            Crear Material
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Encabezados de columnas */}
                  <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-2">
                    <div className="col-span-3">
                      <p className="text-xs font-bold text-gray-400">Producto</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs font-bold text-gray-400">Cantidad</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-400">Unidad de medida</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-400">Volumen</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-400">Costo total</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-400">Costo unitario</p>
                    </div>
                  </div>

                  <div className="space-y-2 pr-1">
                    {inventoryForm.items.map((item, idx) => (
                      <div key={idx} className="bg-black/50 rounded p-2 border border-fuchsia-500/20">
                        <div className="grid grid-cols-12 gap-2">
                          {/* Producto */}
                          <div className="col-span-12 md:col-span-3 relative product-autocomplete">
                            <label className="block md:hidden text-xs font-bold text-gray-400 mb-1">Producto</label>
                            <input
                              type="text"
                              value={item.productName || ""}
                              onChange={(e) => {
                                console.log('🔥 onChange ejecutado:', e.target.value);
                                updateInventoryItem(idx, 'productName', e.target.value);
                                const newSearchTerms = [...productSearchTerms];
                                newSearchTerms[idx] = e.target.value;
                                setProductSearchTerms(newSearchTerms);
                                setActiveDropdownIndex(idx);
                              }}
                              onFocus={() => {
                                console.log('🔥 onFocus ejecutado, idx:', idx);
                                setActiveDropdownIndex(idx);
                              }}
                              placeholder="Escribir o seleccionar producto *"
                              className="w-full px-2 py-1 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                            />
                            {activeDropdownIndex === idx && (item.productName?.length >= 3 || !item.productName) && (
                              <div className="absolute z-[200] w-full mt-1 bg-gray-800 border border-fuchsia-500/30 rounded max-h-40 overflow-y-auto shadow-2xl" style={{ position: 'absolute' }}>
                                {(() => {
                                  const searchTerm = item.productName?.toLowerCase() || "";

                                  // Obtener materiales únicos del inventario (compras registradas)
                                  const materialsMap = new Map<string, { productName: string; unit: string; productId?: string }>();

                                  inventory.forEach((purchase: any) => {
                                    purchase.items.forEach((purchaseItem: any) => {
                                      const key = `${purchaseItem.productName}-${purchaseItem.unit}`;
                                      if (!materialsMap.has(key)) {
                                        materialsMap.set(key, {
                                          productName: purchaseItem.productName,
                                          unit: purchaseItem.unit,
                                        });
                                      }
                                    });
                                  });

                                  // También agregar materiales del catálogo con categoría de inventario
                                  const materialCategories = ['EMPAQUE', 'INSUMO', 'SERVICIO', 'COSTO FIJO', 'UTENCILIO'];
                                  catalogProducts.forEach((product: any) => {
                                    if (materialCategories.includes(product.category)) {
                                      const key = `${product.name}-${product.unit}`;
                                      if (!materialsMap.has(key)) {
                                        materialsMap.set(key, {
                                          productName: product.name,
                                          unit: product.unit,
                                          productId: product.productId,
                                        });
                                      }
                                    }
                                  });

                                  // Convertir a array y filtrar por búsqueda
                                  const allMaterials = Array.from(materialsMap.values());
                                  const filteredProducts = searchTerm.length >= 3
                                    ? allMaterials.filter(m =>
                                        m.productName.toLowerCase().includes(searchTerm) ||
                                        m.productId?.toLowerCase().includes(searchTerm)
                                      )
                                    : allMaterials;

                                  // Ordenar alfabéticamente
                                  filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));

                                  if (filteredProducts.length === 0) {
                                    return (
                                      <div className="px-3 py-2 text-xs text-gray-400">
                                        No se encontraron materiales
                                      </div>
                                    );
                                  }

                                  return filteredProducts.map((material, materialIdx) => (
                                    <div
                                      key={`${material.productName}-${material.unit}-${materialIdx}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('🔥 onMouseDown - Material a seleccionar:', material.productName);

                                        // Actualizar el nombre del producto y la unidad
                                        const newItems = [...inventoryForm.items];
                                        newItems[idx] = {
                                          ...newItems[idx],
                                          productName: material.productName,
                                          unit: material.unit
                                        };

                                        setInventoryForm({ ...inventoryForm, items: newItems });

                                        // Actualizar searchTerms
                                        const newSearchTerms = [...productSearchTerms];
                                        newSearchTerms[idx] = material.productName;
                                        setProductSearchTerms(newSearchTerms);

                                        // Cerrar dropdown
                                        setActiveDropdownIndex(null);

                                        console.log('🔥 Material guardado:', material.productName);
                                      }}
                                      className="px-3 py-2 text-xs text-white hover:bg-fuchsia-500/20 cursor-pointer border-b border-fuchsia-500/10 last:border-b-0"
                                    >
                                      <div className="font-bold">{material.productName}</div>
                                      <div className="text-cyan-400 text-[10px] mt-0.5">
                                        {material.productId && `ID: ${material.productId} • `}
                                        Unidad: {material.unit}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            )}
                          </div>
                          {/* Cantidad */}
                          <div className="col-span-6 md:col-span-1">
                            <label className="block md:hidden text-xs font-bold text-gray-400 mb-1">Cantidad</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => updateInventoryItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                          </div>
                          {/* Unidad */}
                          <div className="col-span-6 md:col-span-2">
                            <label className="block md:hidden text-xs font-bold text-gray-400 mb-1">Unidad de medida</label>
                            <select
                              value={item.unit}
                              onChange={(e) => updateInventoryItem(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                            >
                              <option value="">Seleccionar</option>
                              <option value="UNIDAD">UNIDAD</option>
                              <option value="KG">KG</option>
                              <option value="LITROS">LITROS</option>
                              <option value="GRAMOS">GRAMOS</option>
                              <option value="SERVICIO">SERVICIO</option>
                              <option value="CIENTO">CIENTO</option>
                              <option value="MEDIO MILLAR">MEDIO MILLAR</option>
                              <option value="MILLAR">MILLAR</option>
                              <option value="PAQUETE">PAQUETE</option>
                              <option value="CAJA">CAJA</option>
                              <option value="BOLSA">BOLSA</option>
                              <option value="BALDE">BALDE</option>
                            </select>
                          </div>
                          {/* Volumen */}
                          <div className="col-span-6 md:col-span-2">
                            <label className="block md:hidden text-xs font-bold text-gray-400 mb-1">Volumen (unid/pres.)</label>
                            <input
                              type="number"
                              step="1"
                              value={item.volume || ''}
                              onChange={(e) => updateInventoryItem(idx, 'volume', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder=""
                            />
                          </div>
                          {/* Costo total */}
                          <div className="col-span-6 md:col-span-2">
                            <label className="block md:hidden text-xs font-bold text-gray-400 mb-1">Costo total</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitCost === 0 ? '' : item.unitCost}
                              onChange={(e) => updateInventoryItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                          </div>
                          {/* Costo unitario */}
                          <div className="col-span-6 md:col-span-2">
                            <label className="block md:hidden text-xs font-bold text-gray-400 mb-1">Costo unitario</label>
                            <input
                              type="text"
                              value={`S/ ${item.total.toFixed(2)}`}
                              disabled
                              className="w-full px-2 py-1 text-xs rounded bg-gray-800 border border-fuchsia-500/30 text-amber-400 font-bold"
                            />
                          </div>
                          {inventoryForm.items.length > 1 && (
                            <div className="col-span-12 md:col-span-0 md:flex items-center justify-center hidden">
                              <button
                                onClick={() => removeInventoryItem(idx)}
                                className="text-red-400 hover:text-red-300 text-xs"
                                title="Eliminar"
                              >
                                ❌
                              </button>
                            </div>
                          )}
                        </div>
                        {inventoryForm.items.length > 1 && (
                          <div className="md:hidden mt-1 text-right">
                            <button
                              onClick={() => removeInventoryItem(idx)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              ❌ Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 rounded-lg p-3 border-2 border-fuchsia-500/50 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Total de la Compra</p>
                      <p className="text-xs text-gray-500">{inventoryForm.items.length} item(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-fuchsia-400">
                        S/ {inventoryForm.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{inventoryForm.paymentMethod}</p>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowInventoryModal(false);
                      setInventoryForm({
                        supplier: "",
                        supplierRuc: "",
                        supplierPhone: "",
                        paymentMethod: "plin-yape",
                        items: [{ productName: "", quantity: 0, unit: "kg", volume: 0, unitCost: 0, total: 0 }],
                        totalAmount: 0,
                        purchaseDate: new Date().toISOString().split('T')[0]
                      });
                      setProductSearchTerms([""]);
                      setActiveDropdownIndex(null);
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 text-sm rounded-lg font-bold transition-all"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    onClick={handleCreateInventory}
                    className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-4 py-2 text-sm rounded-lg font-bold transition-all neon-border-purple transform hover:scale-105"
                  >
                    ✅ Registrar Compra
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : activeTab === "marketing" ? (
        /* Marketing Tab */
        <>
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-black text-fuchsia-400 neon-glow-purple mb-6">Marketing y Fidelización</h2>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-8 border-b-2 border-fuchsia-500/20">
              <button
                onClick={() => setMarketingSection("promotions")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  marketingSection === "promotions"
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                🎟️ Promociones y Cupones
              </button>
              <button
                onClick={() => setMarketingSection("campaigns")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  marketingSection === "campaigns"
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                📢 Campañas de Marketing
              </button>
              <button
                onClick={() => setMarketingSection("loyalty")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  marketingSection === "loyalty"
                    ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                🏆 Programa de Fidelización
              </button>
            </div>

            {marketingSection === "promotions" && (
              <>
                {/* Promoción 30% - Salsas Exclusivas */}
                <div className="mb-8 bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-red-500 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 flex items-center gap-2">
                        🔥 Promo 30% — Salsas Exclusivas de la Casa
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">Parrillera · Honey Mustard · Teriyaki · Sweet & Sour</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Estado</p>
                        {promo30Data.active ? (
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">Activa</span>
                        ) : (
                          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">Agotada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Órdenes utilizadas</span>
                      <span className="text-white font-black text-lg">{promo30Data.count} / {promo30Data.limit}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          promo30Data.count >= promo30Data.limit
                            ? 'bg-red-500'
                            : promo30Data.count >= promo30Data.limit * 0.8
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (promo30Data.count / promo30Data.limit) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500 text-xs">0</span>
                      <span className="text-gray-400 text-xs font-semibold">
                        {promo30Data.active
                          ? `Quedan ${promo30Data.limit - promo30Data.count} lugares`
                          : 'Promoción agotada'}
                      </span>
                      <span className="text-gray-500 text-xs">{promo30Data.limit}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-black/50 rounded-lg p-4 border border-red-500/30">
                      <p className="text-gray-400 text-xs mb-1">Total Registradas</p>
                      <p className="text-3xl font-black text-white">{promo30Data.count} / 30</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-4 border border-orange-500/40">
                      <p className="text-orange-400 text-xs mb-1">Disponibles</p>
                      <p className="text-3xl font-black text-orange-400">{Math.max(0, promo30Data.limit - promo30Data.count)}</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-4 border border-gray-600/40">
                      <p className="text-gray-400 text-xs mb-1">% Completado</p>
                      <p className="text-3xl font-black text-white">
                        {promo30Data.limit > 0 ? Math.round((promo30Data.count / promo30Data.limit) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Tabla de órdenes */}
                  {!promo30Data.orders || promo30Data.orders.length === 0 ? (
                    <div className="text-center py-8 bg-black/30 rounded-lg">
                      <p className="text-gray-400">No hay órdenes registradas aún</p>
                      <p className="text-gray-500 text-sm mt-2">Se registran automáticamente cuando un cliente paga con salsas exclusivas de la casa</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-red-500/30">
                            <th className="text-left py-3 px-4 text-red-400 font-bold text-sm">#</th>
                            <th className="text-left py-3 px-4 text-red-400 font-bold text-sm">DNI</th>
                            <th className="text-left py-3 px-4 text-red-400 font-bold text-sm">Cliente</th>
                            <th className="text-left py-3 px-4 text-red-400 font-bold text-sm">Orden ID</th>
                            <th className="text-left py-3 px-4 text-red-400 font-bold text-sm">Salsas</th>
                            <th className="text-left py-3 px-4 text-red-400 font-bold text-sm">Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promo30Data.orders.map((order: any, index: number) => (
                            <tr key={index} className="border-b border-gray-800 hover:bg-black/30 transition-colors">
                              <td className="py-3 px-4 text-orange-400 font-black text-sm">{index + 1}</td>
                              <td className="py-3 px-4 text-white text-sm font-mono">{order.dni || '-'}</td>
                              <td className="py-3 px-4 text-white text-sm">{order.customerName}</td>
                              <td className="py-3 px-4">
                                <code className="text-red-400 text-xs bg-black/50 px-2 py-1 rounded">{order.orderId}</code>
                              </td>
                              <td className="py-3 px-4 text-gray-400 text-xs">{(order.sauces || []).join(', ')}</td>
                              <td className="py-3 px-4 text-gray-400 text-xs">
                                {new Date(order.registeredAt).toLocaleDateString('es-PE', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Promo FIT 30% */}
                <div className="mb-8 bg-gradient-to-r from-cyan-900/30 to-teal-900/30 border-2 border-cyan-500 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center gap-2">
                        🥗 Promo 30% FIT — Bowls con Descuento
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">30% descuento en todos los bowls FIT — primeras 30 órdenes</p>
                    </div>
                    <div>
                      {promoFit30Data.active ? (
                        <span className="px-4 py-2 rounded-full text-sm font-black bg-green-500/20 text-green-400 border border-green-500/50">
                          ✅ ACTIVA
                        </span>
                      ) : (
                        <span className="px-4 py-2 rounded-full text-sm font-black bg-red-500/20 text-red-400 border border-red-500/50">
                          🔴 AGOTADA
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-black text-lg">{promoFit30Data.count} / {promoFit30Data.limit}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-56 h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              promoFit30Data.count >= promoFit30Data.limit
                                ? 'bg-red-500'
                                : promoFit30Data.count >= promoFit30Data.limit * 0.8
                                ? 'bg-orange-500'
                                : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, (promoFit30Data.count / promoFit30Data.limit) * 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs">
                          {promoFit30Data.active
                            ? `Quedan ${promoFit30Data.limit - promoFit30Data.count} lugares`
                            : 'Agotada'}
                        </span>
                        <span className="text-gray-500 text-xs">{promoFit30Data.limit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-black/50 rounded-lg p-4 border border-cyan-500/30">
                      <p className="text-gray-400 text-xs mb-1">Total Órdenes</p>
                      <p className="text-3xl font-black text-white">{promoFit30Data.count} / 30</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-4 border border-cyan-500/30">
                      <p className="text-gray-400 text-xs mb-1">Disponibles</p>
                      <p className="text-3xl font-black text-cyan-400">{Math.max(0, promoFit30Data.limit - promoFit30Data.count)}</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-4 border border-cyan-500/30">
                      <p className="text-gray-400 text-xs mb-1">% Completado</p>
                      <p className="text-3xl font-black text-orange-400">
                        {promoFit30Data.limit > 0 ? Math.round((promoFit30Data.count / promoFit30Data.limit) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Tabla de órdenes */}
                  {!promoFit30Data.orders || promoFit30Data.orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-4xl mb-2">🥗</p>
                      <p>Aún no hay órdenes FIT registradas en esta promo</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-cyan-500/30">
                      <table className="w-full">
                        <thead className="bg-black/50">
                          <tr>
                            <th className="text-left py-3 px-4 text-cyan-400 font-bold text-sm">#</th>
                            <th className="text-left py-3 px-4 text-cyan-400 font-bold text-sm">DNI</th>
                            <th className="text-left py-3 px-4 text-cyan-400 font-bold text-sm">Cliente</th>
                            <th className="text-left py-3 px-4 text-cyan-400 font-bold text-sm">Orden ID</th>
                            <th className="text-left py-3 px-4 text-cyan-400 font-bold text-sm">Producto</th>
                            <th className="text-left py-3 px-4 text-cyan-400 font-bold text-sm">Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promoFit30Data.orders.map((order: any, index: number) => (
                            <tr key={index} className="border-b border-gray-800 hover:bg-black/30 transition-colors">
                              <td className="py-3 px-4 text-cyan-400 font-black text-sm">{index + 1}</td>
                              <td className="py-3 px-4 text-white text-sm font-mono">{order.dni || '-'}</td>
                              <td className="py-3 px-4 text-white text-sm">{order.customerName}</td>
                              <td className="py-3 px-4">
                                <code className="text-cyan-400 text-xs bg-black/50 px-2 py-1 rounded">{order.orderId}</code>
                              </td>
                              <td className="py-3 px-4 text-gray-400 text-xs">{order.productId || '-'}</td>
                              <td className="py-3 px-4 text-gray-400 text-xs">
                                {new Date(order.registeredAt).toLocaleDateString('es-PE', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Promoción 13% - Sección Especial */}
                <div className="mb-8 bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 border-2 border-fuchsia-500 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 flex items-center gap-2">
                        🎁 Promoción 13% - Primeros 13 Clientes
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">Cupones de descuento para pedidos con salsas promocionales</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Válido hasta</p>
                      <p className="text-lg font-bold text-fuchsia-400">28 Feb 2026</p>
                    </div>
                  </div>

                  {/* Coupon Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-black/50 rounded-lg p-4 border border-fuchsia-500/30">
                      <p className="text-gray-400 text-xs mb-1">Total Generados</p>
                      <p className="text-3xl font-black text-white">{coupons.length} / 13</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-4 border border-green-500/50">
                      <p className="text-green-400 text-xs mb-1">Pendientes</p>
                      <p className="text-3xl font-black text-green-400">
                        {coupons.filter(c => c.status === 'pending').length}
                      </p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-4 border border-amber-500/50">
                      <p className="text-amber-400 text-xs mb-1">Usados</p>
                      <p className="text-3xl font-black text-amber-400">
                        {coupons.filter(c => c.status === 'used').length}
                      </p>
                    </div>
                  </div>

                  {/* Coupon Table */}
                  {coupons.length === 0 ? (
                    <div className="text-center py-8 bg-black/30 rounded-lg">
                      <p className="text-gray-400">No hay cupones generados aún</p>
                      <p className="text-gray-500 text-sm mt-2">Los cupones se generan automáticamente cuando un cliente hace un pedido con las salsas promocionales</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-fuchsia-500/30">
                            <th className="text-left py-3 px-4 text-fuchsia-400 font-bold text-sm">DNI</th>
                            <th className="text-left py-3 px-4 text-fuchsia-400 font-bold text-sm">Cliente</th>
                            <th className="text-left py-3 px-4 text-fuchsia-400 font-bold text-sm">Código</th>
                            <th className="text-center py-3 px-4 text-fuchsia-400 font-bold text-sm">Estado</th>
                            <th className="text-center py-3 px-4 text-fuchsia-400 font-bold text-sm">Descuento</th>
                            <th className="text-left py-3 px-4 text-fuchsia-400 font-bold text-sm">Creado</th>
                            <th className="text-left py-3 px-4 text-fuchsia-400 font-bold text-sm">Usado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map((coupon, index) => (
                            <tr key={coupon.id} className="border-b border-gray-800 hover:bg-black/30 transition-colors">
                              <td className="py-3 px-4 text-white text-sm font-mono">{coupon.dni}</td>
                              <td className="py-3 px-4 text-white text-sm">{coupon.customerName}</td>
                              <td className="py-3 px-4">
                                <code className="text-fuchsia-400 text-xs font-bold bg-black/50 px-2 py-1 rounded">
                                  {coupon.code}
                                </code>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {coupon.status === 'pending' ? (
                                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                                    Pendiente
                                  </span>
                                ) : (
                                  <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">
                                    Usado
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-green-400 font-bold">
                                {coupon.discount}%
                              </td>
                              <td className="py-3 px-4 text-gray-400 text-xs">
                                {new Date(coupon.createdAt).toLocaleDateString('es-PE', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-3 px-4 text-gray-400 text-xs">
                                {coupon.usedAt ? new Date(coupon.usedAt).toLocaleDateString('es-PE', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Promociones Activas</h3>
                    <p className="text-gray-400 text-sm">Gestiona descuentos, cupones y ofertas especiales</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPromotion(null);
                      resetPromotionForm();
                      setShowPromotionModal(true);
                    }}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-lg font-bold transition-all neon-border-purple transform hover:scale-105"
                  >
                    + Nueva Promoción
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 p-6">
                    <p className="text-gray-400 text-sm font-semibold">Total Promociones</p>
                    <p className="text-5xl font-black text-white mt-2">{promotions.length}</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl border-2 border-green-500/50 p-6">
                    <p className="text-green-400 text-sm font-bold">Activas</p>
                    <p className="text-5xl font-black text-green-400 mt-2">
                      {promotions.filter((p) => p.active).length}
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-xl border-2 border-amber-500/50 p-6">
                    <p className="text-amber-400 text-sm font-bold">Uso Total</p>
                    <p className="text-5xl font-black text-amber-400 mt-2">
                      {promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-xl border-2 border-red-500/50 p-6">
                    <p className="text-red-400 text-sm font-bold">Por Vencer (7 días)</p>
                    <p className="text-5xl font-black text-red-400 mt-2">
                      {promotions.filter((p) => {
                        const daysLeft = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return daysLeft <= 7 && daysLeft >= 0;
                      }).length}
                    </p>
                  </div>
                </div>

                {/* Promotions List */}
                <div className="space-y-4">
                  {promotions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-xl border-2 border-fuchsia-500/30">
                      <p className="text-2xl text-gray-400">No hay promociones creadas</p>
                    </div>
                  ) : (
                    promotions.map((promo) => {
                      const isExpired = new Date(promo.endDate) < new Date();
                      const daysLeft = Math.ceil((new Date(promo.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={promo.id} className={`bg-gray-900 rounded-xl border-2 p-6 transition-all ${promo.active ? 'border-fuchsia-500/30 hover:border-fuchsia-500' : 'border-gray-700 opacity-60'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-black text-white">{promo.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  promo.active ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-gray-500/20 text-gray-400 border border-gray-500'
                                }`}>
                                  {promo.active ? 'Activa' : 'Inactiva'}
                                </span>
                                {promo.code && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500">
                                    CÓDIGO: {promo.code}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-400 text-sm mb-3">{promo.description}</p>
                              <div className="flex gap-6 text-sm">
                                <div>
                                  <span className="text-gray-500">Tipo:</span>
                                  <span className="text-white font-bold ml-2">
                                    {promo.type === 'percentage' ? `${promo.value}% DESC` :
                                     promo.type === 'fixed' ? `S/ ${promo.value} DESC` :
                                     promo.type === 'shipping' ? 'Envío Gratis' : 'Combo'}
                                  </span>
                                </div>
                                {promo.minAmount > 0 && (
                                  <div>
                                    <span className="text-gray-500">Compra mín:</span>
                                    <span className="text-white font-bold ml-2">S/ {promo.minAmount}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-500">Segmento:</span>
                                  <span className="text-white font-bold ml-2 capitalize">{promo.targetSegment}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Usado:</span>
                                  <span className="text-amber-400 font-bold ml-2">{promo.usageCount || 0} veces</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {isExpired ? (
                                <span className="text-red-400 font-bold text-sm">Expirada</span>
                              ) : daysLeft <= 7 ? (
                                <span className="text-orange-400 font-bold text-sm">Vence en {daysLeft} días</span>
                              ) : (
                                <span className="text-green-400 font-bold text-sm">Vigente</span>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(promo.startDate).toLocaleDateString('es-PE')} - {new Date(promo.endDate).toLocaleDateString('es-PE')}
                              </p>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => openEditPromotion(promo)}
                                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeletePromotion(promo.id)}
                                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {marketingSection === "campaigns" && (
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 p-8">
                <div className="text-center py-12">
                  <h3 className="text-2xl font-bold text-fuchsia-400 mb-4">Campañas Segmentadas</h3>
                  <p className="text-gray-400 mb-6">
                    Crea campañas de marketing dirigidas a segmentos específicos de clientes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="bg-black/50 rounded-lg p-6 border border-fuchsia-500/20">
                      <div className="text-4xl mb-3">👑</div>
                      <h4 className="text-lg font-bold text-white mb-2">Clientes VIP</h4>
                      <p className="text-sm text-gray-400 mb-4">Promociones exclusivas para tus mejores clientes</p>
                      <p className="text-2xl font-black text-fuchsia-400">{customerSegments.vip.length} clientes</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-6 border border-fuchsia-500/20">
                      <div className="text-4xl mb-3">💤</div>
                      <h4 className="text-lg font-bold text-white mb-2">Clientes Inactivos</h4>
                      <p className="text-sm text-gray-400 mb-4">Recupera clientes que dejaron de comprar</p>
                      <p className="text-2xl font-black text-red-400">{customerSegments.inactive.length} clientes</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-6 border border-fuchsia-500/20">
                      <div className="text-4xl mb-3">✨</div>
                      <h4 className="text-lg font-bold text-white mb-2">Nuevos Clientes</h4>
                      <p className="text-sm text-gray-400 mb-4">Bienvenida y primera compra especial</p>
                      <p className="text-2xl font-black text-cyan-400">{customerSegments.new.length} clientes</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-8">
                    Las campañas se integran con las promociones activas para enviar ofertas personalizadas
                  </p>
                </div>
              </div>
            )}

            {marketingSection === "loyalty" && (
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 p-8">
                <div className="text-center py-12">
                  <h3 className="text-2xl font-bold text-fuchsia-400 mb-4">Programa de Fidelización</h3>
                  <p className="text-gray-400 mb-8">
                    Sistema de puntos y recompensas para incentivar compras recurrentes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <div className="bg-black/50 rounded-lg p-6 border border-amber-500/30 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">⭐</span>
                        <h4 className="text-xl font-bold text-amber-400">Sistema de Puntos</h4>
                      </div>
                      <ul className="space-y-3 text-sm text-gray-300">
                        <li className="flex items-center gap-2">
                          <span className="text-amber-400">•</span>
                          <span>1 punto por cada S/ 10 gastado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-amber-400">•</span>
                          <span>100 puntos = S/ 10 de descuento</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-amber-400">•</span>
                          <span>Puntos acumulables sin vencimiento</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-black/50 rounded-lg p-6 border border-purple-500/30 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">🎁</span>
                        <h4 className="text-xl font-bold text-purple-400">Beneficios VIP</h4>
                      </div>
                      <ul className="space-y-3 text-sm text-gray-300">
                        <li className="flex items-center gap-2">
                          <span className="text-purple-400">•</span>
                          <span>Acceso anticipado a nuevos productos</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-purple-400">•</span>
                          <span>Envío gratis en compras mayores a S/ 50</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-purple-400">•</span>
                          <span>Descuentos exclusivos en cumpleaños</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-8 p-6 bg-fuchsia-500/10 rounded-lg border border-fuchsia-500/30 max-w-2xl mx-auto">
                    <p className="text-fuchsia-300 text-sm">
                      💡 <strong>Próximamente:</strong> Integración automática de puntos y niveles de fidelización con cada compra
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Promotion Modal */}
          {showPromotionModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-6 max-w-2xl w-full my-8">
                <h3 className="text-2xl font-black text-fuchsia-400 mb-4">
                  {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={promotionForm.name}
                        onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                        placeholder="Black Friday 2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Código de Cupón (opcional)</label>
                      <input
                        type="text"
                        value={promotionForm.code}
                        onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none uppercase"
                        placeholder="VERANO2024"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-400 mb-1">Descripción</label>
                    <textarea
                      value={promotionForm.description}
                      onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                      rows={2}
                      placeholder="Descripción de la promoción"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Tipo</label>
                      <select
                        value={promotionForm.type}
                        onChange={(e) => setPromotionForm({ ...promotionForm, type: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                      >
                        <option value="percentage">Porcentaje</option>
                        <option value="fixed">Monto Fijo</option>
                        <option value="shipping">Envío Gratis</option>
                        <option value="combo">Combo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">
                        {promotionForm.type === 'percentage' ? 'Porcentaje (%)' : 'Monto (S/)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={promotionForm.value}
                        onChange={(e) => setPromotionForm({ ...promotionForm, value: parseFloat(e.target.value) || 0 })}
                        disabled={promotionForm.type === 'shipping'}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none disabled:opacity-50"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Compra Mínima</label>
                      <input
                        type="number"
                        step="0.01"
                        value={promotionForm.minAmount}
                        onChange={(e) => setPromotionForm({ ...promotionForm, minAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Fecha Inicio</label>
                      <input
                        type="date"
                        value={promotionForm.startDate}
                        onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Fecha Fin</label>
                      <input
                        type="date"
                        value={promotionForm.endDate}
                        onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Límite de Uso</label>
                      <input
                        type="number"
                        value={promotionForm.usageLimit}
                        onChange={(e) => setPromotionForm({ ...promotionForm, usageLimit: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                        placeholder="0 = ilimitado"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-400 mb-1">Segmento de Clientes</label>
                    <select
                      value={promotionForm.targetSegment}
                      onChange={(e) => setPromotionForm({ ...promotionForm, targetSegment: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                    >
                      <option value="all">Todos los clientes</option>
                      <option value="vip">Clientes VIP</option>
                      <option value="frequent">Clientes Frecuentes</option>
                      <option value="new">Clientes Nuevos</option>
                      <option value="inactive">Clientes Inactivos</option>
                      <option value="at_risk">Clientes en Riesgo</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={promotionForm.active}
                      onChange={(e) => setPromotionForm({ ...promotionForm, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm text-white">Promoción activa</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPromotionModal(false);
                      setEditingPromotion(null);
                      resetPromotionForm();
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}
                    disabled={!promotionForm.name || !promotionForm.startDate || !promotionForm.endDate}
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg font-bold transition-all neon-border-purple disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingPromotion ? 'Guardar' : 'Crear Promoción'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : activeTab === "carta" ? (
        /* Carta Tab — control de stock de menús */
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-black text-fuchsia-400 neon-glow-purple mb-2">Stock de Carta</h2>
          <p className="text-gray-400 text-sm mb-8">
            Activa el sello <span className="text-red-400 font-bold">AGOTADO</span> para que los clientes no puedan pedir ese plato.
            El cambio se refleja en la carta al instante.
          </p>

          {/* FAT */}
          <div className="mb-10">
            <h3 className="text-xl font-black text-red-400 mb-4 flex items-center gap-2">
              🥩 Carta FAT
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "pequeno-dilema", name: "Pequeño Dilema", price: "S/ 18.50" },
                { id: "duo-dilema", name: "Dúo Dilema", price: "S/ 33.50" },
                { id: "santo-pecado", name: "Santo Pecado", price: "S/ 45.00" },
              ].map((item) => {
                const isSoldOut = !!menuStock[item.id];
                const isSaving = menuStockSaving === item.id;
                return (
                  <div
                    key={item.id}
                    className={`bg-gray-900 rounded-xl border-2 p-5 flex items-center justify-between transition-all ${
                      isSoldOut ? "border-red-600/60 opacity-70" : "border-gray-700"
                    }`}
                  >
                    <div>
                      <p className="text-white font-bold text-base">{item.name}</p>
                      <p className="text-gray-400 text-sm">{item.price}</p>
                      {isSoldOut && (
                        <span className="text-red-400 text-xs font-black tracking-widest">AGOTADO</span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleMenuStock(item.id, isSoldOut)}
                      disabled={isSaving}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${
                        isSoldOut
                          ? "bg-green-700 hover:bg-green-600 text-white"
                          : "bg-red-700 hover:bg-red-600 text-white"
                      } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isSaving ? "..." : isSoldOut ? "Disponible" : "Agotar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FIT */}
          <div>
            <h3 className="text-xl font-black text-cyan-400 mb-4 flex items-center gap-2">
              🥗 Carta FIT
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "ensalada-clasica", name: "CLÁSICA FRESH BOWL", price: "S/ 18.90" },
                { id: "ensalada-proteica", name: "CÉSAR POWER BOWL", price: "S/ 24.90" },
                { id: "ensalada-caesar", name: "PROTEIN FIT BOWL", price: "S/ 22.90" },
                { id: "ensalada-mediterranea", name: "TUNA FRESH BOWL", price: "S/ 21.90" },
              ].map((item) => {
                const isSoldOut = !!menuStock[item.id];
                const isSaving = menuStockSaving === item.id;
                return (
                  <div
                    key={item.id}
                    className={`bg-gray-900 rounded-xl border-2 p-5 flex items-center justify-between transition-all ${
                      isSoldOut ? "border-red-600/60 opacity-70" : "border-gray-700"
                    }`}
                  >
                    <div>
                      <p className="text-white font-bold text-base">{item.name}</p>
                      <p className="text-gray-400 text-sm">{item.price}</p>
                      {isSoldOut && (
                        <span className="text-red-400 text-xs font-black tracking-widest">AGOTADO</span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleMenuStock(item.id, isSoldOut)}
                      disabled={isSaving}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${
                        isSoldOut
                          ? "bg-green-700 hover:bg-green-600 text-white"
                          : "bg-red-700 hover:bg-red-600 text-white"
                      } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isSaving ? "..." : isSoldOut ? "Disponible" : "Agotar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ==================== MODAL DE INVENTARIO (GLOBAL) ==================== */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-4 max-w-5xl w-full max-h-[95vh] overflow-y-auto" style={{ position: 'relative' }}>
            <h3 className="text-xl font-black text-fuchsia-400 mb-3">📦 Registrar Nueva Compra</h3>

            {/* Información Compacta en Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">RUC</label>
                <input
                  type="text"
                  value={inventoryForm.supplierRuc}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, supplierRuc: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-gray-700 text-white focus:border-fuchsia-400 focus:outline-none"
                  placeholder="20123456789"
                  maxLength={11}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fuchsia-400 mb-1">Nombre del proveedor *</label>
                <input
                  type="text"
                  value={inventoryForm.supplier}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, supplier: e.target.value.toUpperCase() })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                  placeholder="Nombre proveedor"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={inventoryForm.supplierPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setInventoryForm({ ...inventoryForm, supplierPhone: value });
                  }}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-gray-700 text-white focus:border-fuchsia-400 focus:outline-none"
                  maxLength={9}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fuchsia-400 mb-1">Fecha de compra *</label>
                <input
                  type="date"
                  value={inventoryForm.purchaseDate}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, purchaseDate: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fuchsia-400 mb-1">Método de pago *</label>
                <select
                  value={inventoryForm.paymentMethod}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, paymentMethod: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                >
                  <option value="plin-yape">📱 Plin / Yape</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                </select>
              </div>
            </div>

            {/* Lista de Artículos */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-white">📋 Artículos</h4>
                <button
                  onClick={addInventoryItem}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                >
                  + Item
                </button>
              </div>

              {/* Encabezados de columnas */}
              <div className="bg-gray-800 rounded-lg p-2 mb-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <p className="text-xs font-bold text-fuchsia-400">Producto</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-fuchsia-400">Categoría</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-fuchsia-400 text-center">Compra</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-fuchsia-400">Und.</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-cyan-400 text-center" title="Contenido por unidad de compra">x</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-green-400 text-center" title="Stock total que ingresa">= Stock</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-fuchsia-400">Costo S/</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-amber-400">Total S/</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pr-1">
                {inventoryForm.items.map((item, idx) => (
                  <div key={idx} className="bg-black/50 rounded p-2 border border-fuchsia-500/20">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Producto */}
                      <div className="col-span-12 md:col-span-3">
                        <input
                          type="text"
                          value={item.productName || ""}
                          onChange={(e) => updateInventoryItem(idx, 'productName', e.target.value.toUpperCase())}
                          className="w-full px-2 py-1.5 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                        />
                      </div>

                      {/* Categoría */}
                      <div className="col-span-12 md:col-span-2">
                        <select
                          value={item.category || ""}
                          onChange={(e) => updateInventoryItem(idx, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                        >
                          <option value="">-- Tipo --</option>
                          <option value="INSUMO">🥘 INSUMO</option>
                          <option value="EMPAQUE">📦 EMPAQUE</option>
                          <option value="SERVICIO">⚡ SERVICIO</option>
                          <option value="UTENCILIO">🔧 UTENCILIO</option>
                        </select>
                      </div>

                      {/* Cantidad Comprada */}
                      <div className="col-span-3 md:col-span-1">
                        <input
                          type="number"
                          step="1"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => updateInventoryItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white text-center focus:border-fuchsia-400 focus:outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Unidad de Compra */}
                      <div className="col-span-4 md:col-span-1">
                        <select
                          value={item.unit}
                          onChange={(e) => updateInventoryItem(idx, 'unit', e.target.value)}
                          className="w-full px-1 py-1.5 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                        >
                          <option value="">-</option>
                          <option value="PAQUETE">PKT</option>
                          <option value="CAJA">CAJA</option>
                          <option value="BOLSA">BOLSA</option>
                          <option value="KG">KG</option>
                          <option value="UNIDAD">UND</option>
                          <option value="CIENTO">CIEN</option>
                        </select>
                      </div>

                      {/* Multiplicador (Contenido por unidad) */}
                      <div className="col-span-2 md:col-span-1">
                        <input
                          type="number"
                          step="1"
                          value={item.volume === 0 ? '' : item.volume}
                          onChange={(e) => updateInventoryItem(idx, 'volume', parseInt(e.target.value) || 1)}
                          title="Contenido por unidad. Ej: Si cada paquete tiene 100 bolsas, escribe 100"
                          className="w-full px-2 py-1.5 text-xs rounded bg-cyan-900/30 border border-cyan-500/50 text-cyan-300 text-center focus:border-cyan-400 focus:outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Stock Total (Auto-calculado) */}
                      <div className="col-span-3 md:col-span-1">
                        <div className="w-full px-2 py-1.5 text-xs rounded bg-green-900/30 border border-green-500/50 text-green-400 text-center font-black">
                          {(item.quantity * (item.volume || 1)).toLocaleString()}
                        </div>
                      </div>

                      {/* Costo Unitario */}
                      <div className="col-span-6 md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitCost === 0 ? '' : item.unitCost}
                          onChange={(e) => updateInventoryItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs rounded bg-gray-900 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Total */}
                      <div className="col-span-6 md:col-span-1">
                        <div className="w-full px-2 py-1.5 text-xs rounded bg-amber-900/30 border border-amber-500/50 text-amber-400 font-black text-right">
                          {item.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {inventoryForm.items.length > 1 && (
                      <div className="mt-1 text-right">
                        <button
                          onClick={() => removeInventoryItem(idx)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ❌ Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 rounded-lg p-3 border-2 border-fuchsia-500/50 mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Total de la Compra</p>
                  <p className="text-xs text-gray-500">{inventoryForm.items.length} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-fuchsia-400">
                    S/ {inventoryForm.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">{inventoryForm.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowInventoryModal(false);
                  setInventoryForm({
                    supplier: "",
                    supplierRuc: "",
                    supplierPhone: "",
                    paymentMethod: "plin-yape",
                    items: [{ productName: "", quantity: 0, unit: "KG", volume: 0, unitCost: 0, total: 0 }],
                    totalAmount: 0,
                    purchaseDate: new Date().toISOString().split('T')[0]
                  });
                  setProductSearchTerms([""]);
                  setActiveDropdownIndex(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 text-sm rounded-lg font-bold transition-all"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={handleCreateInventory}
                className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-4 py-2 text-sm rounded-lg font-bold transition-all neon-border-purple transform hover:scale-105"
              >
                ✅ Registrar Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Compra */}
      {showInventoryEditModal && editingPurchase && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-xl border-2 border-amber-500 p-4 max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl font-black text-amber-400 mb-3">✏️ Editar Compra</h3>

            {/* Información Compacta en Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">RUC</label>
                <input
                  type="text"
                  defaultValue={editingPurchase.supplierRuc}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, supplierRuc: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-gray-700 text-white focus:border-amber-400 focus:outline-none"
                  placeholder="20123456789"
                  maxLength={11}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">Nombre del proveedor *</label>
                <input
                  type="text"
                  defaultValue={editingPurchase.supplier}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, supplier: e.target.value.toUpperCase() })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none"
                  placeholder="Nombre proveedor"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Teléfono</label>
                <input
                  type="tel"
                  defaultValue={editingPurchase.supplierPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setEditingPurchase({ ...editingPurchase, supplierPhone: value });
                  }}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-gray-700 text-white focus:border-amber-400 focus:outline-none"
                  maxLength={9}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">Fecha de compra *</label>
                <input
                  type="date"
                  defaultValue={editingPurchase.purchaseDate}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, purchaseDate: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">Método de pago *</label>
                <select
                  defaultValue={editingPurchase.paymentMethod}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, paymentMethod: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-black border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="plin-yape">📱 Plin / Yape</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                </select>
              </div>
            </div>

            {/* Lista de Artículos */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-white">📋 Artículos</h4>
              </div>

              {/* Encabezados de columnas */}
              <div className="bg-gray-800 rounded-lg p-2 mb-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <p className="text-xs font-bold text-amber-400">Producto</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-amber-400">Categoría</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-amber-400 text-center">Compra</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-amber-400">Und.</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-cyan-400 text-center" title="Contenido por unidad de compra">x</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-green-400 text-center" title="Stock total que ingresa">= Stock</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-amber-400">Costo S/</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-amber-400">Total S/</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pr-1">
                {editingPurchase.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-black/50 rounded p-2 border border-amber-500/20">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Producto */}
                      <div className="col-span-12 md:col-span-3">
                        <input
                          type="text"
                          defaultValue={item.productName || ""}
                          onChange={(e) => {
                            const newItems = [...editingPurchase.items];
                            newItems[idx].productName = e.target.value.toUpperCase();
                            setEditingPurchase({ ...editingPurchase, items: newItems });
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded bg-gray-900 border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      {/* Categoría */}
                      <div className="col-span-12 md:col-span-2">
                        <select
                          defaultValue={item.category || ""}
                          onChange={(e) => {
                            const newItems = [...editingPurchase.items];
                            newItems[idx].category = e.target.value;
                            setEditingPurchase({ ...editingPurchase, items: newItems });
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded bg-gray-900 border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none"
                        >
                          <option value="">-- Tipo --</option>
                          <option value="INSUMO">🥘 INSUMO</option>
                          <option value="EMPAQUE">📦 EMPAQUE</option>
                          <option value="SERVICIO">⚡ SERVICIO</option>
                          <option value="UTENCILIO">🔧 UTENCILIO</option>
                        </select>
                      </div>

                      {/* Cantidad Comprada */}
                      <div className="col-span-3 md:col-span-1">
                        <input
                          type="number"
                          step="1"
                          defaultValue={item.quantity}
                          onChange={(e) => {
                            const newItems = [...editingPurchase.items];
                            const quantity = parseInt(e.target.value) || 0;
                            newItems[idx].quantity = quantity;
                            newItems[idx].total = quantity * newItems[idx].unitCost;
                            setEditingPurchase({ ...editingPurchase, items: newItems, totalAmount: newItems.reduce((sum, i) => sum + i.total, 0) });
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded bg-gray-900 border border-amber-500/30 text-white text-center focus:border-amber-400 focus:outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Unidad de Compra */}
                      <div className="col-span-4 md:col-span-1">
                        <select
                          defaultValue={item.unit}
                          onChange={(e) => {
                            const newItems = [...editingPurchase.items];
                            newItems[idx].unit = e.target.value;
                            setEditingPurchase({ ...editingPurchase, items: newItems });
                          }}
                          className="w-full px-1 py-1.5 text-xs rounded bg-gray-900 border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none"
                        >
                          <option value="">-</option>
                          <option value="PAQUETE">PKT</option>
                          <option value="CAJA">CAJA</option>
                          <option value="BOLSA">BOLSA</option>
                          <option value="KG">KG</option>
                          <option value="UNIDAD">UND</option>
                          <option value="CIENTO">CIEN</option>
                        </select>
                      </div>

                      {/* Multiplicador (Contenido por unidad) */}
                      <div className="col-span-2 md:col-span-1">
                        <input
                          type="number"
                          step="1"
                          defaultValue={item.volume || 1}
                          onChange={(e) => {
                            const newItems = [...editingPurchase.items];
                            newItems[idx].volume = parseInt(e.target.value) || 1;
                            setEditingPurchase({ ...editingPurchase, items: newItems });
                          }}
                          title="Contenido por unidad. Ej: Si cada paquete tiene 100 bolsas, escribe 100"
                          className="w-full px-2 py-1.5 text-xs rounded bg-cyan-900/30 border border-cyan-500/50 text-cyan-300 text-center focus:border-cyan-400 focus:outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Stock Total (Auto-calculado) */}
                      <div className="col-span-3 md:col-span-1">
                        <div className="w-full px-2 py-1.5 text-xs rounded bg-green-900/30 border border-green-500/50 text-green-400 text-center font-black">
                          {(item.quantity * (item.volume || 1)).toLocaleString()}
                        </div>
                      </div>

                      {/* Costo Unitario */}
                      <div className="col-span-6 md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={item.unitCost}
                          onChange={(e) => {
                            const newItems = [...editingPurchase.items];
                            const unitCost = parseFloat(e.target.value) || 0;
                            newItems[idx].unitCost = unitCost;
                            newItems[idx].total = newItems[idx].quantity * unitCost;
                            setEditingPurchase({ ...editingPurchase, items: newItems, totalAmount: newItems.reduce((sum, i) => sum + i.total, 0) });
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded bg-gray-900 border border-amber-500/30 text-white focus:border-amber-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Total */}
                      <div className="col-span-6 md:col-span-1">
                        <div className="w-full px-2 py-1.5 text-xs rounded bg-amber-900/30 border border-amber-500/50 text-amber-400 font-black text-right">
                          {item.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-3 border-2 border-amber-500/50 mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Total de la Compra</p>
                  <p className="text-xs text-gray-500">{editingPurchase.items.length} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-amber-400">
                    S/ {editingPurchase.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">{editingPurchase.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowInventoryEditModal(false);
                  setEditingPurchase(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 text-sm rounded-lg font-bold transition-all"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/inventory', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editingPurchase)
                    });
                    if (response.ok) {
                      const updatedInventory = await response.json();
                      setInventory(updatedInventory);
                      setShowInventoryEditModal(false);
                      setEditingPurchase(null);
                    }
                  } catch (error) {
                    console.error('Error al actualizar compra:', error);
                    alert('Error al actualizar la compra');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-4 py-2 text-sm rounded-lg font-bold transition-all transform hover:scale-105"
              >
                ✅ Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver comprobante de pago */}
      {showVoucherModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVoucherModal(false)}
        >
          <div
            className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Comprobante de Pago</h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {selectedVoucherPath ? (
                <img
                  src={selectedVoucherPath}
                  alt="Comprobante de pago"
                  className="w-full h-auto rounded-lg border-2 border-green-500/30"
                />
              ) : (
                <p className="text-gray-400 text-center py-8">No hay comprobante disponible</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
