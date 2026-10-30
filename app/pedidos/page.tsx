"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// ── Constantes compartidas con admin ──────────────────────────────────────────

const salsas: { id: string; name: string }[] = [
  { id: "barbecue", name: "BBQ ahumada" },
  { id: "buffalo-picante", name: "Santo Picante" },
  { id: "ahumada", name: "Acevichada Imperial" },
  { id: "parmesano-ajo", name: "Crispy Celestial" },
  { id: "anticuchos", name: "Parrillera" },
  { id: "honey-mustard", name: "Honey mustard" },
  { id: "teriyaki", name: "Oriental Teriyaki" },
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
    "pollo-grillado": { name: "Pollo grillado", price: 5.00 },
    "nachos": { name: "Nachos", price: 0 },
    "chifles": { name: "Chifles", price: 0 },
    "papas-fritas": { name: "Papas fritas", price: 0 },
  };
  salsas.forEach(salsa => {
    complements[`extra-salsa-${salsa.id}`] = { name: `Extra salsa - ${salsa.name}`, price: 3.00 };
    if (salsa.id !== 'anticuchos') {
      complements[`burger-salsa-${salsa.id}`] = { name: `Salsa gratis — ${salsa.name}`, price: 0 };
    }
  });
  return complements;
};

const availableComplements = generateAvailableComplements();

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  cart?: any[];
  totalItems?: number;
  totalPrice?: number;
  timestamp?: string;
  status: "pending" | "pendiente-verificacion" | "confirmed" | "en-camino" | "delivered" | "cancelled" | "programado";
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  enCaminoAt?: string;
  deliveredAt?: string;
  paymentMethod?: string;
  paymentProofPath?: string;
  isCanje?: boolean;
  canjeNote?: string;
}

// ── TimeCounter ───────────────────────────────────────────────────────────────

function TimeCounter({ createdAt, status, onOvertime, audioCtx }: {
  createdAt: string;
  orderId: string;
  status: string;
  onOvertime?: () => void;
  audioCtx?: AudioContext | null;
}) {
  const [elapsed, setElapsed] = useState("");
  const [isOvertime, setIsOvertime] = useState(false);
  const alertedRef = useRef(false);
  const mountTimeRef = useRef<number>(Date.now());
  const onOvertimeRef = useRef(onOvertime);
  const audioCtxRef = useRef(audioCtx);
  useEffect(() => { onOvertimeRef.current = onOvertime; }, [onOvertime]);
  useEffect(() => { audioCtxRef.current = audioCtx; }, [audioCtx]);

  useEffect(() => {
    if (status === "cancelled" || status === "delivered") return;

    const playAlert = () => {
      try {
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        [0, 0.35, 0.7].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = "square";
          gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.3);
        });
      } catch {}
    };

    const updateElapsed = () => {
      const created = new Date(createdAt);
      let diff = Math.floor((Date.now() - created.getTime()) / 1000);
      if (diff > 4 * 60 * 60) diff -= 5 * 60 * 60;
      const localDiff = Math.floor((Date.now() - mountTimeRef.current) / 1000);
      diff = Math.max(diff, localDiff);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      if (
        minutes >= 20 &&
        !alertedRef.current &&
        (status === "pending" || status === "pendiente-verificacion" || status === "confirmed" || status === "en-camino")
      ) {
        setIsOvertime(true);
        alertedRef.current = true;
        playAlert();
        onOvertimeRef.current?.();
      }
      setElapsed(minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt, status]);

  return (
    <span className={`font-mono text-lg font-black ${isOvertime ? "text-red-400 animate-pulse" : "text-yellow-400"}`}>
      {isOvertime ? "⚠️ " : ""}{elapsed}
    </span>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PedidosPage() {
  const router = useRouter();
  // DEV BYPASS: activo solo cuando NODE_ENV === 'development'
  const DEV_BYPASS = process.env.NODE_ENV === 'development';
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_BYPASS);
  const [userRole, setUserRole] = useState<"admin" | "operator" | null>(DEV_BYPASS ? "operator" : null);
  const [checkingAuth, setCheckingAuth] = useState(!DEV_BYPASS);

  useEffect(() => {
    if (DEV_BYPASS) return; // Skip auth in development
    const token = localStorage.getItem('pedidos_token');
    if (!token) { setCheckingAuth(false); router.push('/pedidos/login'); return; }
    try {
      const parts = atob(token).split(':');
      if (parts.length === 3 && (parts[1] === 'admin' || parts[1] === 'operator')) {
        setIsAuthenticated(true);
        setUserRole(parts[1] as "admin" | "operator");
      } else {
        localStorage.removeItem('pedidos_token');
        router.push('/pedidos/login');
      }
    } catch {
      localStorage.removeItem('pedidos_token');
      router.push('/pedidos/login');
    }
    setCheckingAuth(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("pedidos_token");
    router.push("/pedidos/login");
  };

  // ── State ─────────────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const [orders, setOrders] = useState<Order[]>([
    { id: "#2910-01", name: "Carlos Quispe", phone: "987654321", address: "Jr. Lima 123, Chancay", status: "pending", createdAt: now, totalPrice: 22, paymentMethod: "contraentrega-efectivo-exacto", cart: [{ name: "Pequeño Dilema", quantity: 1, price: 22 }], completedOrders: [{ productId: "pequeno-dilema", name: "Pequeño Dilema", quantity: 1, salsas: ["barbecue"], complementIds: ["coca-cola"], price: 22, finalPrice: 22, category: "fat" }] } as any,
    { id: "#2910-02", name: "María Torres", phone: "912345678", address: "Av. Grau 456, Chancay", status: "confirmed", createdAt: now, confirmedAt: now, totalPrice: 41, deliveryCost: 3, paymentMethod: "anticipado", deliveryOption: "centro", cart: [{ name: "Dúo Dilema", quantity: 1, price: 34 }, { name: "Inka Cola 500ml", quantity: 1, price: 4 }], completedOrders: [{ productId: "duo-dilema", name: "Dúo Dilema", quantity: 1, salsas: ["teriyaki", "buffalo-picante"], complementIds: ["inka-cola"], price: 34, finalPrice: 34, category: "fat" }] } as any,
    { id: "#2910-03", name: "Luis Ramírez", phone: "945678901", address: "Jr. Bolívar 321, Chancay", status: "en-camino", createdAt: now, confirmedAt: now, enCaminoAt: now, totalPrice: 32.90, deliveryCost: 5, paymentMethod: "contraentrega-efectivo-cambio", cantoCancelo: "50", deliveryOption: "alrededores", cart: [{ name: "Dúo de Tacos", quantity: 1, price: 24.90 }], completedOrders: [{ productId: "taco-duo", name: "Dúo de Tacos", quantity: 1, salsas: ["santo-crujiente", "tex-dilema"], price: 24.90, finalPrice: 24.90, category: "taco" }] } as any,
    { id: "#2910-04", name: "Ana Flores", phone: "934567890", address: "Recojo en tienda", status: "delivered", createdAt: now, confirmedAt: now, enCaminoAt: now, deliveredAt: now, totalPrice: 25, paymentMethod: "contraentrega-yape-plin", deliveryOption: "recojo", cart: [{ name: "CÉSAR POWER BOWL", quantity: 1, price: 20 }], completedOrders: [{ productId: "ensalada-proteica", name: "CÉSAR POWER BOWL", quantity: 1, complementIds: ["extra-papas"], price: 20, finalPrice: 20, category: "fit" }] } as any,
    { id: "#2910-05", name: "Rosa Mendoza", phone: "967890123", address: "Calle Real 789, Chancay", status: "programado", createdAt: now, scheduledDate: new Date().toLocaleDateString("en-CA"), scheduledTime: "20:30", totalPrice: 47, paymentMethod: "anticipado", deliveryOption: "centro", deliveryCost: 0, cart: [{ name: "TUNA FRESH BOWL", quantity: 2, price: 23.50 }], completedOrders: [{ productId: "ensalada-mediterranea", name: "TUNA FRESH BOWL", quantity: 2, price: 23.50, finalPrice: 23.50, category: "fit" }] } as any,
  ]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const [overtimeOrderIds, setOvertimeOrderIds] = useState<Set<string>>(new Set());
  const [ordersDateFrom, setOrdersDateFrom] = useState("");
  const [ordersDateTo, setOrdersDateTo] = useState("");
  const [isOrdersDateFiltered, setIsOrdersDateFiltered] = useState(false);
  const [showOrdersDateModal, setShowOrdersDateModal] = useState(false);
  const [canjeModal, setCanjeModal] = useState<{ orderId: string } | null>(null);
  const [canjeNoteInput, setCanjeNoteInput] = useState("");
  const [canjeSaving, setCanjeSaving] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucherPath, setSelectedVoucherPath] = useState("");
  const [selectedVoucherOrder, setSelectedVoucherOrder] = useState<any>(null);
  const [deliveryToast, setDeliveryToast] = useState<{ orderId: string; customerName: string } | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const previousOrderStatusRef = useRef<Map<string, string>>(new Map());
  const announcedDeliveredRef = useRef<Set<string>>(new Set());

  // ── Audio init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextInitialized) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          setAudioContext(ctx);
          setAudioContextInitialized(true);
          document.removeEventListener("click", initAudio);
          document.removeEventListener("keydown", initAudio);
        } catch {}
      }
    };
    document.addEventListener("click", initAudio);
    document.addEventListener("keydown", initAudio);
    return () => {
      document.removeEventListener("click", initAudio);
      document.removeEventListener("keydown", initAudio);
    };
  }, [audioContextInitialized]);

  // ── Auto-refresh ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadOrders();
    loadProducts();
    const interval = setInterval(() => {
      loadOrders();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPeruDate = (date?: Date | string) => {
    const d = date ? new Date(date) : new Date();
    return new Date(d.toLocaleString("en-US", { timeZone: "America/Lima" }));
  };

  const isSameDayPeru = (date1: Date | string, date2?: Date | string) => {
    const d1 = getPeruDate(date1);
    const d2 = date2 ? getPeruDate(date2) : getPeruDate();
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  // ── Sound ─────────────────────────────────────────────────────────────────
  const playNotificationSound = () => {
    try {
      let ctx = audioContext;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        setAudioContextInitialized(true);
      }
      if (ctx.state === "suspended") ctx.resume();
      const playBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.4) => {
        const osc = ctx!.createOscillator();
        const gain = ctx!.createGain();
        osc.connect(gain); gain.connect(ctx!.destination);
        osc.frequency.value = frequency; osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx!.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(volume, ctx!.currentTime + startTime + 0.05);
        gain.gain.linearRampToValueAtTime(volume * 0.7, ctx!.currentTime + startTime + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0.001, ctx!.currentTime + startTime + duration);
        osc.start(ctx!.currentTime + startTime); osc.stop(ctx!.currentTime + startTime + duration);
      };
      playBeep(880, 0, 0.3, 0.5);
      playBeep(880, 0.35, 0.3, 0.5);
      playBeep(1047, 0.75, 0.8, 0.6);
      playBeep(784, 1.6, 0.4, 0.3);
    } catch {}
  };

  const playDeliveryConfirmSound = () => {
    try {
      let ctx = audioContext;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        setAudioContextInitialized(true);
      }
      if (ctx.state === "suspended") ctx.resume();
      const playBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
        const osc = ctx!.createOscillator();
        const gain = ctx!.createGain();
        osc.connect(gain); gain.connect(ctx!.destination);
        osc.frequency.value = frequency; osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx!.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(volume, ctx!.currentTime + startTime + 0.05);
        gain.gain.linearRampToValueAtTime(0.001, ctx!.currentTime + startTime + duration);
        osc.start(ctx!.currentTime + startTime); osc.stop(ctx!.currentTime + startTime + duration);
      };
      playBeep(1300, 0, 0.15, 0.5);
      playBeep(1600, 0.15, 0.2, 0.6);
      playBeep(2000, 0.35, 0.3, 0.7);
    } catch {}
  };

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch {}
  };

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      if (previousOrderIdsRef.current.size > 0) {
        const newOrders = data.filter((o: Order) => !previousOrderIdsRef.current.has(o.id));
        if (newOrders.length > 0) playNotificationSound();

        const newlyDelivered = data.filter((o: Order) => {
          if (announcedDeliveredRef.current.has(o.id)) return false;
          const prev = previousOrderStatusRef.current.get(o.id);
          return prev !== "delivered" && prev !== undefined && o.status === "delivered";
        });

        if (newlyDelivered.length > 0) {
          newlyDelivered.forEach((o: Order) => {
            announcedDeliveredRef.current.add(o.id);
            previousOrderStatusRef.current.set(o.id, "delivered");
          });
          playDeliveryConfirmSound();
          const first = newlyDelivered[0];
          setDeliveryToast({ orderId: first.id, customerName: first.name || "Cliente" });
          setTimeout(() => setDeliveryToast(null), 6000);
        }
      } else {
        data.forEach((o: Order) => {
          if (o.status === "delivered") announcedDeliveredRef.current.add(o.id);
        });
      }

      previousOrderIdsRef.current = new Set(data.map((o: Order) => o.id));
      previousOrderStatusRef.current = new Map(data.map((o: Order) => [o.id, o.status]));
      const unique = data.filter((o: Order, i: number, arr: Order[]) => arr.findIndex((x: Order) => x.id === o.id) === i);
      setOrders(unique);
    } catch {
      console.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  // ── Acciones ──────────────────────────────────────────────────────────────
  const deductStockFromOrder = async (order: Order) => {
    try {
      const items: Array<{ productName: string; quantity: number; unit: string }> = [];
      const orderItems = (order as any).completedOrders || order.cart || [];
      orderItems.forEach((cartItem: any) => {
        const itemName = cartItem.name || cartItem.product?.name;
        const product = products.find((p: any) => p.name === itemName);
        if (product?.components?.length > 0) {
          product.components.forEach((comp: any) => {
            const total = comp.quantity * cartItem.quantity;
            const existing = items.find((i) => i.productName === comp.productName && i.unit === comp.unit);
            if (existing) { existing.quantity += total; } else { items.push({ productName: comp.productName, quantity: total, unit: comp.unit }); }
          });
        }
      });
      if (items.length > 0) {
        await fetch("/api/deductions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, orderName: order.name, items, deductionDate: new Date().toISOString() }),
        });
      }
    } catch {}
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (newStatus === "delivered" || newStatus === "cancelled") {
        setOvertimeOrderIds(prev => { const next = new Set(prev); next.delete(orderId); return next; });
      }
      if (newStatus === "delivered" && order && order.status !== "delivered") {
        await deductStockFromOrder(order);
      }
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      loadOrders();
    } catch {
      console.error("Error al actualizar pedido");
    }
  };

  const handleToggleCanje = async (orderId: string, markAs: boolean, note: string) => {
    setCanjeSaving(true);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, isCanje: markAs, canjeNote: note }),
      });
      await loadOrders();
      setCanjeModal(null);
    } finally {
      setCanjeSaving(false);
    }
  };

  const applyOrdersDateFilter = () => {
    if (ordersDateFrom && ordersDateTo) {
      setIsOrdersDateFiltered(true);
      setShowOrdersDateModal(false);
    }
  };

  const clearOrdersDateFilter = () => {
    setOrdersDateFrom(""); setOrdersDateTo("");
    setIsOrdersDateFiltered(false);
    setShowOrdersDateModal(false);
  };

  const exportOrdersToCSV = () => {
    if (orders.length === 0) return;
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const headers = ["N°","ID Pedido","Fecha","Hora","Cliente","Teléfono","Dirección","Productos","Cantidad","Total","Método Pago","Estado"];
    const rows = sorted.map((o: any, i: number) => {
      const d = new Date(o.createdAt);
      const fecha = d.toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" });
      const hora = d.toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" });
      const productos = (o.cart || []).map((it: any) => `${it.name} x${it.quantity}`).join("; ");
      const cantidad = (o.cart || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const estadoMap: Record<string, string> = { pending: "Pendiente", confirmed: "Confirmado", "en-camino": "En Camino", delivered: "Entregado", cancelled: "Cancelado" };
      return [i+1, o.id, fecha, hora, o.name, o.phone, o.address, productos, cantidad, (o.totalPrice||0).toFixed(2), o.paymentMethod||"", estadoMap[o.status]||o.status||""];
    });
    const content = [headers, ...rows].map(r => r.map((c: any) => String(c).replace(/\t/g, " ")).join("\t")).join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedidos-${new Date().toLocaleDateString("es-PE").replace(/\//g, "-")}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  let dateFilteredOrders = orders;
  if (isOrdersDateFiltered && ordersDateFrom && ordersDateTo) {
    dateFilteredOrders = orders.filter((o) => {
      const s = new Date(o.createdAt).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
      return s >= ordersDateFrom && s <= ordersDateTo;
    });
  } else {
    // Por defecto: solo pedidos de hoy (hora de Lima)
    dateFilteredOrders = orders.filter((o) => isSameDayPeru(o.createdAt));
  }

  const filteredOrders = dateFilteredOrders.filter((o) => {
    const statusMatch =
      filter === "all" ||
      o.status === filter ||
      (filter === "pending" && o.status === "pendiente-verificacion");
    const searchMatch =
      searchTerm === "" ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm) ||
      o.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((o as any).completedOrders?.some((it: any) => (it.name || "").toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (o.cart?.some((it: any) => (it.name || it.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase())));
    return statusMatch && searchMatch;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
    "pendiente-verificacion": "bg-purple-500/20 text-purple-400 border-purple-500",
    confirmed: "bg-cyan-500/20 text-cyan-400 border-cyan-500",
    "en-camino": "bg-blue-500/20 text-blue-400 border-blue-500",
    delivered: "bg-green-500/20 text-green-400 border-green-500",
    cancelled: "bg-red-500/20 text-red-400 border-red-500",
    programado: "bg-indigo-500/20 text-indigo-300 border-indigo-500",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    "pendiente-verificacion": "Por Verificar",
    confirmed: "Confirmado",
    "en-camino": "En Camino",
    delivered: "Entregado",
    cancelled: "Cancelado",
    programado: "Programado",
  };

  // ── Loading / unauth ──────────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Delivery toast ── */}
      {deliveryToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-green-200 rounded-xl px-5 py-4 shadow-2xl max-w-xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-0.5">Pedido entregado</p>
              <p className="text-gray-900 font-black text-base">#{deliveryToast.orderId}</p>
              <p className="text-green-600 text-sm font-medium">{deliveryToast.customerName}</p>
            </div>
            <button onClick={() => setDeliveryToast(null)} className="text-green-600 hover:text-green-800 text-sm leading-none mt-0.5">✕</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Image src="/logoprincipal.png" alt="Santo Dilema" width={80} height={40} />
            <div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-wide">Pedidos</p>
              <p className="text-[10px] text-gray-400">Operador{userRole === "admin" ? " · Admin" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userRole === "admin" && (
              <Link
                href="/admin"
                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-all"
              >
                Panel completo
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-all"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">

        {/* ── Carteles de estado ── */}
        <section className="px-4 py-4">
          {(() => {
            const lanes = [
              { key: "all" as const,       label: isOrdersDateFiltered ? "Total Filtrado" : "Total Hoy", icon: "📋", accent: "border-gray-400",    stripe: "bg-gray-400",    dotColor: "bg-gray-400",    headerText: "text-gray-500",   countText: "text-gray-900",   orders: dateFilteredOrders },
              { key: "confirmed" as const,  label: "Confirmados",    icon: "✅", accent: "border-sky-400",     stripe: "bg-sky-400",     dotColor: "bg-sky-400",     headerText: "text-sky-600",    countText: "text-sky-600",    orders: dateFilteredOrders.filter((o) => o.status === "confirmed") },
              { key: "en-camino" as const,  label: "En Camino",      icon: "🛵", accent: "border-blue-400",    stripe: "bg-blue-500",    dotColor: "bg-blue-500",    headerText: "text-blue-600",   countText: "text-blue-600",   orders: dateFilteredOrders.filter((o) => o.status === "en-camino") },
              { key: "delivered" as const,  label: "Entregados Hoy", icon: "📦", accent: "border-emerald-400", stripe: "bg-emerald-400", dotColor: "bg-emerald-400", headerText: "text-emerald-600",countText: "text-emerald-600",orders: dateFilteredOrders.filter((o) => o.status === "delivered") },
            ];
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {lanes.map((lane) => {
                  const isActive = filter === lane.key;
                  return (
                    <button
                      key={lane.key}
                      onClick={() => setFilter(lane.key)}
                      className={`bg-white rounded-2xl border-2 flex flex-col overflow-hidden text-left transition-all duration-150 cursor-pointer select-none active:scale-95 ${isActive ? `${lane.accent} shadow-lg` : "border-gray-100 hover:border-gray-200 hover:shadow-md"}`}
                    >
                      <div className={`h-1.5 w-full flex-shrink-0 ${lane.stripe}`} />
                      <div className="px-4 py-3 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xl leading-none">{lane.icon}</span>
                          {isActive && <span className={`w-2 h-2 rounded-full ${lane.dotColor}`} />}
                        </div>
                        <span className={`text-3xl font-black leading-none ${lane.countText}`}>{lane.orders.length}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${isActive ? lane.headerText : "text-gray-400"}`}>{lane.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </section>

        {/* ── Barra de herramientas ── */}
        <section className="px-4 pb-4">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-end">
            <div className="flex gap-2 justify-end">
              <button
                onClick={exportOrdersToCSV}
                className="px-3 py-3 bg-white border border-gray-200 rounded-lg text-green-600 hover:text-green-700 hover:border-green-300 transition-all"
                title="Exportar a CSV"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={() => setShowOrdersDateModal(true)}
                className={`px-3 py-3 bg-white border rounded-lg transition-all ${isOrdersDateFiltered ? "border-blue-400 text-blue-600" : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-400"}`}
                title="Filtrar por fechas"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <div className="relative flex-1 md:flex-initial">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar pedido, cliente, dirección, menú..."
                className="w-full md:w-80 px-4 py-3 pl-10 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all text-sm"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Modal filtro de fechas ── */}
        {showOrdersDateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowOrdersDateModal(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-black text-gray-900 mb-4">Filtrar por Fechas</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-600 text-sm font-semibold block mb-2">Desde:</label>
                  <input type="date" value={ordersDateFrom} onChange={(e) => setOrdersDateFrom(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-400 transition-all [color-scheme:light]" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-semibold block mb-2">Hasta:</label>
                  <input type="date" value={ordersDateTo} onChange={(e) => setOrdersDateTo(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-400 transition-all [color-scheme:light]" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={applyOrdersDateFilter} disabled={!ordersDateFrom || !ordersDateTo} className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all">Aplicar Filtro</button>
                  {isOrdersDateFiltered && <button onClick={clearOrdersDateFilter} className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all">Limpiar</button>}
                  <button onClick={() => setShowOrdersDateModal(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all">Cerrar</button>
                </div>
                {isOrdersDateFiltered && ordersDateFrom && ordersDateTo && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">
                      📊 Desde <span className="text-gray-900 font-bold">{new Date(ordersDateFrom + "T12:00:00").toLocaleDateString("es-PE")}</span> hasta <span className="text-gray-900 font-bold">{new Date(ordersDateTo + "T12:00:00").toLocaleDateString("es-PE")}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Lista de pedidos ── */}
        <section className="px-4 pb-12">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-2xl text-gray-600">Cargando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-xl font-bold text-gray-400">Sin pedidos</p>
              <p className="text-sm text-gray-300 mt-1">
                {filter !== "all" ? `No hay pedidos con estado "${filter}" en este momento` : "No hay pedidos para hoy todavía"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const isOvertime = overtimeOrderIds.has(order.id) && order.status !== "delivered" && order.status !== "cancelled";
                const cardRing = isOvertime
                  ? "ring-2 ring-red-300 shadow-xl shadow-red-100 overtime-pulse"
                  : order.status === "pending"                ? "ring-1 ring-amber-200 shadow-md shadow-amber-50"
                  : order.status === "pendiente-verificacion" ? "ring-1 ring-purple-200 shadow-md shadow-purple-50"
                  : order.status === "confirmed"              ? "ring-1 ring-sky-200 shadow-md shadow-sky-50"
                  : order.status === "en-camino"              ? "ring-2 ring-blue-300 shadow-lg shadow-blue-100"
                  : order.status === "delivered"              ? "ring-1 ring-gray-200 shadow-sm opacity-60"
                  : order.status === "programado"             ? "ring-1 ring-indigo-200 shadow-md shadow-indigo-50"
                  : "ring-1 ring-gray-200 shadow-sm opacity-50";
                const stripeColor = isOvertime ? "bg-red-500"
                  : order.status === "pending"                ? "bg-amber-400"
                  : order.status === "pendiente-verificacion" ? "bg-purple-400"
                  : order.status === "confirmed"              ? "bg-sky-400"
                  : order.status === "en-camino"              ? "bg-blue-500"
                  : order.status === "delivered"              ? "bg-emerald-400"
                  : order.status === "programado"             ? "bg-indigo-400"
                  : "bg-gray-300";
                const DRINK_IDS = new Set(["agua-mineral","coca-cola","inka-cola","sprite","fanta"]);
                const SIDE_IDS  = new Set(["papas-fritas","nachos","chifles"]);
                const tacoNames: Record<string,string> = { "santo-crujiente":"Crunch Supreme","tex-dilema":"Tex Supreme","santo-bacon":"Bacon Deluxe" };
                const burgerNames: Record<string,string> = { "santo-smash":"Santo Smash","bacon-pecado":"Bacon Pecado","chicken-grill":"Chicken Grill","dilema-veggie":"Dilema Veggie","marina-crunch":"Marina Crunch","tentacion-tropical":"Tentación Tropical" };
                void burgerNames;
                const allItems: any[] = (order as any).completedOrders || [];
                const effectiveTotal = (() => {
                  if (!allItems.length) return order.totalPrice || 0;
                  const hasCombo = allItems.some((it: any) => it.comboGroupId);
                  if (!hasCombo) return order.totalPrice || 0;
                  const seen = new Set<string>();
                  const sub = allItems.reduce((s: number, it: any) => {
                    if (it.comboGroupId) {
                      if (seen.has(it.comboGroupId)) return s;
                      seen.add(it.comboGroupId);
                      return s + (it.comboPrice || 0);
                    }
                    return s + (it.finalPrice ?? it.originalPrice ?? 0) * (it.quantity || 1);
                  }, 0);
                  return sub + ((order as any).deliveryCost || 0);
                })();
                const CAT: Record<string,{dot:string;bg:string;text:string;label:string}> = {
                  fat:    {dot:"bg-orange-400", bg:"bg-orange-50",  text:"text-orange-700", label:"FAT"},
                  fit:    {dot:"bg-green-400",  bg:"bg-green-50",   text:"text-green-700",  label:"FIT"},
                  taco:   {dot:"bg-yellow-400", bg:"bg-yellow-50",  text:"text-yellow-700", label:"TACO"},
                  burger: {dot:"bg-pink-400",   bg:"bg-pink-50",    text:"text-pink-700",   label:"BURGER"},
                  bebida: {dot:"bg-blue-400",   bg:"bg-blue-50",    text:"text-blue-700",   label:"BEBIDA"},
                };
                return (
                  <div key={order.id} className={`bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 ${cardRing}`}>
                    <div className={`h-1 w-full flex-shrink-0 ${stripeColor}`} />

                    {/* Cabecera compacta */}
                    <div className="px-4 pt-2.5 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                          <span className="font-mono text-sm font-black text-gray-900 tracking-tight">{order.id}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                          {isOvertime && <span className="text-[9px] font-black text-red-500 uppercase animate-pulse">⚠ TARDE</span>}
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Eliminar pedido ${order.id}?`)) return;
                            await fetch(`/api/orders?id=${order.id}`, { method: "DELETE" });
                            setOrders(prev => prev.filter(o => o.id !== order.id));
                          }}
                          className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all text-xs"
                        >✕</button>
                      </div>
                      <div className="flex items-center justify-between mt-0.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm font-black text-gray-900 truncate">{order.name}</span>
                          <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">{order.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-gray-400 tabular-nums">
                            {new Date(order.createdAt).toLocaleString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-gray-200">·</span>
                          <TimeCounter createdAt={order.createdAt} orderId={order.id} status={order.status} audioCtx={audioContext} onOvertime={() => setOvertimeOrderIds(prev => new Set(prev).add(order.id))} />
                        </div>
                      </div>
                      {(order as any).scheduledTime && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1">
                          <span className="text-indigo-500 text-xs">🗓</span>
                          <span className="text-xs font-bold text-indigo-700">
                            {(() => {
                              const [hh, mm] = ((order as any).scheduledTime as string).split(":");
                              const h = parseInt(hh);
                              const schedDate = (order as any).scheduledDate as string | undefined;
                              let day = "Hoy";
                              if (schedDate) {
                                const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
                                const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
                                if (schedDate !== todayStr) {
                                  const d = new Date(schedDate + "T12:00:00");
                                  const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
                                  day = `${days[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
                                }
                              }
                              return `${day} ${h > 12 ? h-12 : h}:${mm} ${h >= 12 ? "PM" : "AM"}`;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Productos */}
                    <div className="mx-4 mb-0">
                      <div className="h-px bg-gray-100" />
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pt-2 pb-1">Productos</p>
                    </div>
                    <div className="px-4 pb-2.5 flex-1 space-y-0.5">
                      {allItems.length > 0 ? (() => {
                        const seen = new Set<string>();
                        const lines: React.ReactNode[] = [];
                        allItems.forEach((item: any, idx: number) => {
                          if (item.comboGroupId) {
                            if (seen.has(item.comboGroupId)) return;
                            seen.add(item.comboGroupId);
                            const grp = allItems.filter((i: any) => i.comboGroupId === item.comboGroupId);
                            lines.push(
                              <p key={`ch-${item.comboGroupId}`} className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">
                                {item.comboName || "Combo"}
                              </p>
                            );
                            grp.forEach((gi: any, gi_i: number) => {
                              const salsas_ = gi.salsas || [];
                              const comps: string[] = gi.complementIds || [];
                              const drinks = comps.filter((c: string) => DRINK_IDS.has(c));
                              const sides = comps.filter((c: string) => SIDE_IDS.has(c));
                              const extras = comps.filter((c: string) => !DRINK_IDS.has(c) && !SIDE_IDS.has(c));
                              const isTaco = gi.productId === "taco-duo";
                              const isBurger = gi.productId === "burger-duo" || gi.productId === "burger-trio";
                              const salsaCounts_: Record<string, number> = {};
                              salsas_.forEach((sId: string) => { salsaCounts_[sId] = (salsaCounts_[sId] || 0) + 1; });
                              const varNames = [...new Set<string>(salsas_)].map((sId: string) => {
                                const name = isTaco ? (tacoNames[sId] || sId) : isBurger ? sId : (salsas.find((s) => s.id === sId)?.name || sId);
                                return salsaCounts_[sId] > 1 ? `${name} ×${salsaCounts_[sId]}` : name;
                              });
                              const varStr = varNames.length === 0 ? "" :
                                isTaco || isBurger ? ` ${varNames.join(" y ")}` :
                                ` x ${varNames.join(" y ")}`;
                              const q = String(gi.quantity || 1).padStart(2, "0");
                              lines.push(
                                <p key={`ci-${item.comboGroupId}-${gi_i}`} className="text-sm font-semibold text-gray-800 pl-3">
                                  {q} {gi.name}{varStr}
                                </p>
                              );
                              drinks.forEach((c: string, i: number) => {
                                lines.push(<p key={`cd-${item.comboGroupId}-${gi_i}-d${i}`} className="text-sm text-gray-700 pl-3">{q} {availableComplements[c]?.name || c}</p>);
                              });
                              sides.forEach((c: string, i: number) => {
                                lines.push(<p key={`cs-${item.comboGroupId}-${gi_i}-s${i}`} className="text-sm text-gray-700 pl-3">{q} {availableComplements[c]?.name || c}</p>);
                              });
                              if (extras.length > 0) {
                                const counts: Record<string, number> = {};
                                extras.forEach((c: string) => { counts[c] = (counts[c] || 0) + 1; });
                                Object.entries(counts).forEach(([cId, n], i) => {
                                  lines.push(<p key={`ce-${item.comboGroupId}-${gi_i}-e${i}`} className="text-xs text-gray-500 pl-3">+ {n > 1 ? `${n}× ` : ""}{availableComplements[cId]?.name || cId}</p>);
                                });
                              }
                            });
                          } else {
                            const q = String(item.quantity || 1).padStart(2, "0");
                            const salsas_: string[] = item.salsas || [];
                            const comps: string[] = item.complementIds || [];
                            const drinks = comps.filter((c: string) => DRINK_IDS.has(c));
                            const sides = comps.filter((c: string) => SIDE_IDS.has(c));
                            const extras = comps.filter((c: string) => !DRINK_IDS.has(c) && !SIDE_IDS.has(c));
                            const isTaco = item.productId === "taco-duo";
                            const isBurger = item.productId === "burger-duo" || item.productId === "burger-trio";
                            const salsaCounts: Record<string, number> = {};
                            salsas_.forEach((sId: string) => { salsaCounts[sId] = (salsaCounts[sId] || 0) + 1; });
                            const varNames = [...new Set<string>(salsas_)].map((sId: string) => {
                              const name = isTaco ? (tacoNames[sId] || sId) : isBurger ? sId : (salsas.find((s) => s.id === sId)?.name || sId);
                              return salsaCounts[sId] > 1 ? `${name} ×${salsaCounts[sId]}` : name;
                            });
                            const varStr = varNames.length === 0 ? "" :
                              isTaco || isBurger ? ` ${varNames.join(" y ")}` :
                              ` x ${varNames.join(" y ")}`;
                            lines.push(
                              <p key={`i-${idx}`} className="text-sm font-semibold text-gray-900">
                                {q} {item.name}{varStr}
                              </p>
                            );
                            drinks.forEach((c: string, i: number) => {
                              lines.push(<p key={`d-${idx}-${i}`} className="text-sm text-gray-700">{q} {availableComplements[c]?.name || c}</p>);
                            });
                            sides.forEach((c: string, i: number) => {
                              lines.push(<p key={`s-${idx}-${i}`} className="text-sm text-gray-700">{q} {availableComplements[c]?.name || c}</p>);
                            });
                            if (extras.length > 0) {
                              const counts: Record<string, number> = {};
                              extras.forEach((c: string) => { counts[c] = (counts[c] || 0) + 1; });
                              Object.entries(counts).forEach(([cId, n], i) => {
                                lines.push(<p key={`e-${idx}-${i}`} className="text-xs text-gray-500">+ {n > 1 ? `${n}× ` : ""}{availableComplements[cId]?.name || cId}</p>);
                              });
                            }
                          }
                        });
                        return lines;
                      })() : order.cart && Array.isArray(order.cart) && order.cart.length > 0 ? (
                        order.cart.map((item: any, idx: number) => (
                          <p key={idx} className="text-sm font-semibold text-gray-900">
                            {String(item.quantity || 1).padStart(2, "0")} {item.product?.name || item.name}
                          </p>
                        ))
                      ) : <p className="text-xs text-gray-400 italic">Sin productos</p>}
                    </div>

                    {/* Nota — siempre visible */}
                    {order.notes && (
                      <div className="mx-4 mb-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                        <p className="text-xs font-semibold text-amber-800 leading-snug">{order.notes}</p>
                      </div>
                    )}

                    {/* Total + Pago */}
                    <div className="mx-4 mb-2">
                      <div className="h-px bg-gray-100 mb-2" />
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xl font-black text-gray-900 tabular-nums leading-none">S/{effectiveTotal.toFixed(2)}</p>
                          {((order as any).deliveryCost > 0 || (order as any).couponDiscount > 0) && (
                            <p className="text-[9px] text-gray-400 mt-0.5">
                              {(order as any).deliveryCost > 0 ? `+S/${((order as any).deliveryCost || 0).toFixed(2)} delivery` : ""}
                              {(order as any).couponDiscount > 0 ? `${(order as any).deliveryCost > 0 ? " · " : ""}cupón -${(order as any).couponDiscount}%` : ""}
                            </p>
                          )}
                          {(() => {
                            const items = (order as any).completedOrders;
                            if (!items) return null;
                            const seen2 = new Set<string>(); let s = 0;
                            items.forEach((it: any) => { if (it.comboGroupId && !seen2.has(it.comboGroupId)) { seen2.add(it.comboGroupId); s += (it.comboOriginalTotal || 0) - (it.comboPrice || 0); } });
                            return s > 0 ? <p className="text-[9px] text-amber-500 font-semibold">🔥 ahorro S/{s.toFixed(2)}</p> : null;
                          })()}
                        </div>
                        {(() => {
                          const pm = order.paymentMethod;
                          const isYapeAnticipado = pm === "anticipado" || pm === "yape" || pm === "plin";
                          const isYapeEntrega    = pm === "contraentrega-yape-plin";
                          const hasProof         = !!order.paymentProofPath;
                          const openVoucher = () => {
                            setSelectedVoucherPath(order.paymentProofPath || "");
                            setSelectedVoucherOrder(order);
                            setShowVoucherModal(true);
                          };
                          if (isYapeAnticipado) {
                            return (
                              <div className="flex flex-col gap-1 min-w-[88px]">
                                <div className="rounded-xl px-3 py-1.5 text-center text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <p className="text-[10px]">✓ PAGADO</p>
                                  <p className="text-[9px] font-medium opacity-70">Yape / Plin</p>
                                </div>
                                {hasProof ? (
                                  <button onClick={openVoucher} className="rounded-xl px-2 py-1 text-center text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 transition-all flex items-center justify-center gap-1">
                                    🟣 Ver comprobante
                                  </button>
                                ) : (
                                  <div className="rounded-xl px-2 py-1 text-center text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-300">⚠ Sin comprobante</div>
                                )}
                              </div>
                            );
                          }
                          if (isYapeEntrega) {
                            return (
                              <div className="rounded-xl px-3 py-1.5 text-center text-xs font-black bg-amber-100 text-amber-700 border border-amber-200 min-w-[80px]">
                                <p>YAPE</p><p className="text-[9px] font-medium opacity-70">al recibir</p>
                              </div>
                            );
                          }
                          return (
                            <div className={`rounded-xl px-3 py-1.5 text-center text-xs font-black min-w-[80px] ${
                              pm === "tarjeta-mp"                    ? "bg-blue-100    text-blue-700    border border-blue-200"   :
                              pm === "contraentrega-efectivo-exacto" ? "bg-orange-100  text-orange-700  border border-orange-200" :
                              pm === "contraentrega-efectivo-cambio" ? "bg-orange-100  text-orange-700  border border-orange-200" :
                              "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}>
                              {pm === "tarjeta-mp" ? (
                                <><p className="text-[10px]">✓ PAGADO</p><p className="text-[9px] font-medium opacity-70">Mercado Pago</p></>
                              ) : pm === "contraentrega-efectivo-exacto" ? (
                                <><p>EFECTIVO</p><p className="text-[9px] font-medium opacity-70">exacto</p></>
                              ) : pm === "contraentrega-efectivo-cambio" ? (
                                <><p>EFECTIVO</p>
                                  {(order as any).cantoCancelo && (
                                    <p className="text-[9px] font-medium opacity-70">
                                      vuelto S/{(parseFloat((order as any).cantoCancelo) - effectiveTotal).toFixed(2)}
                                    </p>
                                  )}
                                </>
                              ) : pm === "efectivo" ? (
                                <p>EFECTIVO</p>
                              ) : <p className="text-[10px]">{pm}</p>}
                              {hasProof && (
                                <button onClick={openVoucher} className="mt-1 text-[9px] underline opacity-60 block w-full">ver comprobante</button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Dirección */}
                    <div className="mx-4 mb-2 space-y-0.5">
                      {order.address && order.address !== "Recojo en tienda" && (
                        <p className="text-xs text-gray-500">{order.address}</p>
                      )}
                      {(order as any).deliveryCustomLocation && (
                        <p className="text-xs text-gray-400 italic">{(order as any).deliveryCustomLocation}</p>
                      )}
                      {(order as any).deliveryCost > 0 && (
                        <p className="text-xs text-gray-400">Delivery +S/{((order as any).deliveryCost || 0).toFixed(2)}</p>
                      )}
                    </div>

                    {/* Botones de acción */}
                    {order.status === "pending" && (
                      <div className="flex mt-auto">
                        <button onClick={() => updateOrderStatus(order.id, "confirmed")} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">✓ Confirmar pedido</button>
                        <button onClick={() => updateOrderStatus(order.id, "cancelled")} className="px-4 bg-amber-600 hover:bg-red-600 text-white/70 hover:text-white border-l border-amber-700 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                      </div>
                    )}
                    {order.status === "pendiente-verificacion" && (
                      <div className="flex mt-auto">
                        <button onClick={() => updateOrderStatus(order.id, "confirmed")} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">✓ Verificar y confirmar</button>
                        <button onClick={() => updateOrderStatus(order.id, "cancelled")} className="px-4 bg-purple-700 hover:bg-red-600 text-white/70 hover:text-white border-l border-purple-800 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                      </div>
                    )}
                    {order.status === "programado" && (
                      <div className="flex mt-auto">
                        <button onClick={() => updateOrderStatus(order.id, "confirmed")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">✓ Aceptar programado</button>
                        <button onClick={() => updateOrderStatus(order.id, "cancelled")} className="px-4 bg-indigo-700 hover:bg-red-600 text-white/70 hover:text-white border-l border-indigo-800 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                      </div>
                    )}
                    {order.status === "confirmed" && (
                      <div className="flex mt-auto">
                        <button onClick={() => updateOrderStatus(order.id, "en-camino")} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">🛵 Enviar en camino</button>
                        <button onClick={() => updateOrderStatus(order.id, "cancelled")} className="px-4 bg-sky-600 hover:bg-red-600 text-white/70 hover:text-white border-l border-sky-700 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                      </div>
                    )}
                    {order.status === "en-camino" && (
                      <div className="flex mt-auto">
                        <button onClick={() => updateOrderStatus(order.id, "delivered")} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">✓ Marcar entregado</button>
                        <button onClick={() => updateOrderStatus(order.id, "cancelled")} className="px-4 bg-emerald-600 hover:bg-red-600 text-white/70 hover:text-white border-l border-emerald-700 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                      </div>
                    )}
                    {order.status === "delivered" && (
                      <div className="flex mt-auto">
                        <div className="flex-1 bg-emerald-50 text-emerald-600 py-2.5 text-xs font-black text-center uppercase tracking-wide rounded-bl-2xl">✓ Entregado</div>
                        <button onClick={async () => { if (!confirm("¿Eliminar?")) return; await fetch(`/api/orders?id=${order.id}`, { method: "DELETE" }); setOrders(prev => prev.filter(o => o.id !== order.id)); }} className="px-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-400 border-l border-gray-100 text-xs transition-all rounded-br-2xl">🗑</button>
                      </div>
                    )}
                    {order.status === "cancelled" && (
                      <div className="flex mt-auto">
                        <div className="flex-1 bg-red-50 text-red-400 py-2.5 text-xs font-black text-center uppercase tracking-wide rounded-bl-2xl">✕ Cancelado</div>
                        <button onClick={async () => { if (!confirm("¿Eliminar?")) return; await fetch(`/api/orders?id=${order.id}`, { method: "DELETE" }); setOrders(prev => prev.filter(o => o.id !== order.id)); }} className="px-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-400 border-l border-gray-100 text-xs transition-all rounded-br-2xl">🗑</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Modal voucher ── */}
        {showVoucherModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowVoucherModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🟣</span>
                  <div>
                    <p className="text-white font-black text-sm leading-tight">Comprobante Yape</p>
                    {selectedVoucherOrder && (
                      <p className="text-purple-200 text-[10px] font-medium leading-tight">{selectedVoucherOrder.id} · {selectedVoucherOrder.name}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowVoucherModal(false)} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold transition-all flex items-center justify-center text-sm">×</button>
              </div>
              {selectedVoucherOrder && (
                <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <div><p className="font-semibold text-gray-400 uppercase tracking-wide text-[9px]">Pedido</p><p className="font-black text-gray-800">{selectedVoucherOrder.id}</p></div>
                    <div><p className="font-semibold text-gray-400 uppercase tracking-wide text-[9px]">Cliente</p><p className="font-black text-gray-800">{selectedVoucherOrder.name}</p></div>
                    <div><p className="font-semibold text-gray-400 uppercase tracking-wide text-[9px]">Total</p><p className="font-black text-purple-700">S/ {(selectedVoucherOrder.totalPrice || 0).toFixed(2)}</p></div>
                    <div><p className="font-semibold text-gray-400 uppercase tracking-wide text-[9px]">Hora</p><p className="font-black text-gray-800">{new Date(selectedVoucherOrder.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p></div>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
                {selectedVoucherPath ? (
                  <img src={selectedVoucherPath} alt="Comprobante" className="max-w-full h-auto rounded-xl border border-gray-200 shadow-md object-contain" style={{ maxHeight: "55vh" }} />
                ) : (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-gray-400 font-semibold text-sm">No hay comprobante disponible</p>
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
                {selectedVoucherPath && (
                  <a href={selectedVoucherPath} download={`comprobante-${selectedVoucherOrder?.id || "pedido"}.jpg`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 text-xs font-black text-center transition-all">
                    ⬇ Descargar
                  </a>
                )}
                <button onClick={() => setShowVoucherModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2.5 text-xs font-black transition-all">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal canje ── */}
        {canjeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-xl border-2 border-orange-500 p-5 max-w-sm w-full">
              <h3 className="text-lg font-black text-orange-400 mb-1">🎁 Marcar como Canje</h3>
              <p className="text-gray-400 text-sm mb-4">Esta orden no se contará en las ventas. Quedará registrada para auditoría.</p>
              <input
                type="text"
                value={canjeNoteInput}
                onChange={e => setCanjeNoteInput(e.target.value)}
                placeholder="Motivo: Influencer @usuario, Cortesía proveedor..."
                className="w-full px-3 py-2 mb-4 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500/50"
              />
              <div className="flex gap-2">
                <button onClick={() => handleToggleCanje(canjeModal.orderId, true, canjeNoteInput)} disabled={canjeSaving} className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold text-sm">
                  {canjeSaving ? "Guardando..." : "Confirmar Canje"}
                </button>
                <button onClick={() => setCanjeModal(null)} className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm hover:border-gray-400">Cancelar</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
