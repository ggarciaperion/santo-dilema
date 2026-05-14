"use client";
// ADMIN v3.0 — Reingeniería completa: dashboard focalizado, 4 tabs esenciales

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Menu products reference ───────────────────────────────────────────────
const MENU_PRODUCTS = [
  { id: "pequeno-dilema",      name: "Pequeño Dilema",      category: "fat",  price: 22.00 },
  { id: "duo-dilema",          name: "Dúo Dilema",          category: "fat",  price: 34.00 },
  { id: "santo-pecado",        name: "Santo Pecado",        category: "fat",  price: 47.00 },
  { id: "chiguan-alitas",      name: "4 Alitas · Chiguan",  category: "fat",  price: 12.00 },
  { id: "ensalada-clasica",    name: "Clásica Fresh Bowl",  category: "fit",  price: 18.50 },
  { id: "ensalada-proteica",   name: "César Power Bowl",    category: "fit",  price: 20.00 },
  { id: "ensalada-caesar",     name: "Protein Fit Bowl",    category: "fit",  price: 20.00 },
  { id: "ensalada-mediterranea", name: "Tuna Fresh Bowl",   category: "fit",  price: 23.50 },
  { id: "cobb-supreme-bowl",   name: "Cobb Supreme Bowl",   category: "fit",  price: 23.50 },
  { id: "crispy-chicken-bowl", name: "Crispy Chicken Bowl", category: "fit",  price: 22.50 },
  { id: "pasta-power-bowl",    name: "Pasta Power Bowl",    category: "fit",  price: 22.50 },
  { id: "taco-duo",            name: "Dúo de Tacos",        category: "taco", price: 24.90 },
];

const SALSAS: { id: string; name: string }[] = [
  { id: "barbecue",       name: "BBQ Ahumada" },
  { id: "buffalo-picante",name: "Santo Picante" },
  { id: "ahumada",        name: "Acevichada Imperial" },
  { id: "parmesano-ajo",  name: "Crispy Celestial" },
  { id: "anticuchos",     name: "Parrillera" },
  { id: "honey-mustard",  name: "Honey Mustard" },
  { id: "teriyaki",       name: "Oriental Teriyaki" },
  { id: "macerichada",    name: "Sweet & Sour" },
];

const COMPLEMENTS: Record<string, string> = {
  "agua-mineral": "Agua mineral",
  "coca-cola": "Coca Cola 500ml",
  "inka-cola": "Inka Cola 500ml",
  "sprite": "Sprite 500ml",
  "fanta": "Fanta 500ml",
  "extra-papas": "Extra papas",
  "extra-salsa": "Extra salsa",
  "extra-aderezo": "Extra aderezo",
  "pollo-grillado": "Pollo grillado",
  "nachos": "Nachos",
  "chifles": "Chifles",
  "papas-fritas": "Papas fritas",
};

interface Order {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalItems?: number;
  totalPrice?: number;
  comboDiscount?: number;
  couponDiscount?: number;
  deliveryCost?: number;
  deliveryOption?: string;
  paymentMethod?: string;
  paymentProofPath?: string;
  status: "pending" | "pendiente-verificacion" | "confirmed" | "en-camino" | "delivered" | "cancelled";
  createdAt: string;
  completedOrders?: any[];
  cart?: any[];
  isCanje?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

// ─── Time Counter ─────────────────────────────────────────────────────────
function TimeCounter({ createdAt, status, audioCtx, onOvertime }: {
  createdAt: string; status: string; audioCtx?: AudioContext | null; onOvertime?: () => void;
}) {
  const [elapsed, setElapsed] = useState("");
  const [isOvertime, setIsOvertime] = useState(false);
  const alertedRef = useRef(false);
  const mountRef = useRef(Date.now());
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
        [0, 0.35, 0.7].forEach(d => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880; osc.type = "square";
          gain.gain.setValueAtTime(0.3, ctx.currentTime + d);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d + 0.3);
          osc.start(ctx.currentTime + d); osc.stop(ctx.currentTime + d + 0.3);
        });
      } catch {}
    };
    const tick = () => {
      const created = new Date(createdAt);
      let diff = Math.floor((Date.now() - created.getTime()) / 1000);
      if (diff > 4 * 3600) diff -= 5 * 3600;
      diff = Math.max(diff, Math.floor((Date.now() - mountRef.current) / 1000));
      const m = Math.floor(diff / 60), s = diff % 60;
      if (m >= 20 && !alertedRef.current) {
        setIsOvertime(true); alertedRef.current = true;
        playAlert(); onOvertimeRef.current?.();
      }
      setElapsed(m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt, status]);

  return (
    <span className={`font-mono text-sm font-bold ${isOvertime ? "text-red-400 animate-pulse" : "text-amber-400"}`}>
      {isOvertime ? "⚠️ " : "⏱ "}{elapsed}
    </span>
  );
}

// ─── Status helpers ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  "pending":                { label: "Nuevo",        color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/30",  dot: "bg-amber-400" },
  "pendiente-verificacion": { label: "Verificando",  color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", dot: "bg-orange-400" },
  "confirmed":              { label: "Confirmado",   color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/30",    dot: "bg-blue-400" },
  "en-camino":              { label: "En camino",    color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30", dot: "bg-purple-400" },
  "delivered":              { label: "Entregado",    color: "text-green-400",  bg: "bg-green-400/10 border-green-400/30",  dot: "bg-green-400" },
  "cancelled":              { label: "Cancelado",    color: "text-red-400",    bg: "bg-red-400/10 border-red-400/30",      dot: "bg-red-400" },
};

const PAYMENT_LABELS: Record<string, string> = {
  "efectivo": "Efectivo",
  "yape": "Yape",
  "plin": "Plin",
  "anticipado": "Transferencia",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = "amber", icon }: {
  label: string; value: string; sub?: string; color?: string; icon: string;
}) {
  const colors: Record<string, string> = {
    amber:  "border-amber-500/20  text-amber-400",
    green:  "border-green-500/20  text-green-400",
    blue:   "border-blue-500/20   text-blue-400",
    red:    "border-red-500/20    text-red-400",
    purple: "border-purple-500/20 text-purple-400",
  };
  return (
    <div className={`bg-white/[0.03] border rounded-2xl p-4 flex flex-col gap-1 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-black ${colors[color].split(" ")[1]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

// ─── Main Admin ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth]       = useState(true);

  // Data
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [inventory,     setInventory]     = useState<any[]>([]);
  const [menuStock,     setMenuStock]     = useState<Record<string, boolean>>({});
  const [menuDiscounts, setMenuDiscounts] = useState<Record<string, number>>({});
  const [menuPrices,    setMenuPrices]    = useState<Record<string, number>>({});
  const [products,      setProducts]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);

  // UI
  const [activeTab,    setActiveTab]    = useState<"dashboard"|"pedidos"|"finanzas"|"carta">("dashboard");
  const [orderFilter,  setOrderFilter]  = useState<"activos"|"hoy"|"todos">("activos");
  const [expandedId,   setExpandedId]   = useState<string|null>(null);
  const [voucherModal, setVoucherModal] = useState<string|null>(null);
  const [priceInputs,  setPriceInputs]  = useState<Record<string,string>>({});
  const [discInputs,   setDiscInputs]   = useState<Record<string,string>>({});
  const [savingId,     setSavingId]     = useState<string|null>(null);
  const [finMonth,     setFinMonth]     = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
  });

  // Audio + notifications
  const [audioCtx,          setAudioCtx]          = useState<AudioContext|null>(null);
  const [deliveryToast,     setDeliveryToast]     = useState<{id:string;name:string}|null>(null);
  const [overtimeIds,       setOvertimeIds]       = useState<Set<string>>(new Set());
  const previousIdsRef      = useRef<Set<string>>(new Set());
  const previousStatusRef   = useRef<Map<string,string>>(new Map());
  const announcedDelivRef   = useRef<Set<string>>(new Set());

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) { router.push("/admin/login"); return; }
      try {
        const r = await fetch(`/api/auth?token=${token}`);
        const d = await r.json();
        if (d.authenticated) { setIsAuthenticated(true); setCheckingAuth(false); }
        else { localStorage.removeItem("admin_token"); router.push("/admin/login"); }
      } catch { localStorage.removeItem("admin_token"); router.push("/admin/login"); }
    };
    check();
  }, [router]);

  // ── Audio init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = () => {
      if (audioCtx) return;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioCtx(ctx);
        document.removeEventListener("click",   init);
        document.removeEventListener("keydown", init);
      } catch {}
    };
    document.addEventListener("click",   init);
    document.addEventListener("keydown", init);
    return () => { document.removeEventListener("click",init); document.removeEventListener("keydown",init); };
  }, [audioCtx]);

  // ── Data loading ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    loadAll();
    const iv = setInterval(() => { loadOrders(); loadInventory(); }, 10000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadAll = () => {
    loadOrders(); loadInventory(); loadMenuStock();
    loadMenuDiscounts(); loadMenuPrices(); loadProducts();
  };

  const loadOrders = async () => {
    try {
      const r = await fetch("/api/orders");
      const data: Order[] = await r.json();
      if (previousIdsRef.current.size > 0) {
        const newOnes = data.filter(o => !previousIdsRef.current.has(o.id));
        if (newOnes.length > 0) playNewOrder();
        const newlyDelivered = data.filter(o =>
          !announcedDelivRef.current.has(o.id) &&
          previousStatusRef.current.get(o.id) !== "delivered" &&
          previousStatusRef.current.has(o.id) &&
          o.status === "delivered"
        );
        if (newlyDelivered.length > 0) {
          newlyDelivered.forEach(o => announcedDelivRef.current.add(o.id));
          playDelivered();
          setDeliveryToast({ id: newlyDelivered[0].id, name: newlyDelivered[0].name });
          setTimeout(() => setDeliveryToast(null), 5000);
        }
      } else {
        data.filter(o => o.status === "delivered").forEach(o => announcedDelivRef.current.add(o.id));
      }
      previousIdsRef.current    = new Set(data.map(o => o.id));
      previousStatusRef.current = new Map(data.map(o => [o.id, o.status]));
      const unique = data.filter((o,i,a) => a.findIndex(x=>x.id===o.id)===i);
      setOrders(unique);
    } catch {} finally { setLoading(false); }
  };

  const loadInventory     = async () => { try { const r=await fetch("/api/inventory"); setInventory(await r.json()); }catch{} };
  const loadMenuStock     = async () => { try { const r=await fetch("/api/menu-stock"); setMenuStock(await r.json()); }catch{} };
  const loadProducts      = async () => { try { const r=await fetch("/api/products"); setProducts(await r.json()); }catch{} };
  const loadMenuDiscounts = async () => {
    try {
      const r=await fetch("/api/menu-discounts"); const d=await r.json();
      setMenuDiscounts(d);
      const inp: Record<string,string>={};
      Object.entries(d).forEach(([k,v])=>{ inp[k]=String(v); });
      setDiscInputs(inp);
    }catch{}
  };
  const loadMenuPrices = async () => {
    try {
      const r=await fetch("/api/menu-prices"); const d=await r.json();
      setMenuPrices(d);
      const inp: Record<string,string>={};
      Object.entries(d).forEach(([k,v])=>{ inp[k]=String(v); });
      setPriceInputs(inp);
    }catch{}
  };

  // ── Audio ────────────────────────────────────────────────────────────────
  const beep = (ctx: AudioContext, freq: number, t: number, dur: number, vol=0.4) => {
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value=freq; osc.type="sine";
    g.gain.setValueAtTime(0,ctx.currentTime+t);
    g.gain.linearRampToValueAtTime(vol,ctx.currentTime+t+0.05);
    g.gain.linearRampToValueAtTime(0.001,ctx.currentTime+t+dur);
    osc.start(ctx.currentTime+t); osc.stop(ctx.currentTime+t+dur);
  };
  const playNewOrder = () => {
    try {
      const ctx = audioCtx ?? new (window.AudioContext||(window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);
      if (ctx.state==="suspended") ctx.resume();
      beep(ctx,880,0,0.3,0.5); beep(ctx,880,0.35,0.3,0.5); beep(ctx,1047,0.75,0.8,0.6); beep(ctx,784,1.6,0.4,0.3);
    }catch{}
  };
  const playDelivered = () => {
    try {
      const ctx = audioCtx ?? new (window.AudioContext||(window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);
      if (ctx.state==="suspended") ctx.resume();
      beep(ctx,523,0,0.2,0.3); beep(ctx,659,0.25,0.2,0.3); beep(ctx,784,0.5,0.2,0.3); beep(ctx,1047,0.75,0.6,0.4);
    }catch{}
  };

  // ── Order actions ────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: Order["status"]) => {
    if (status==="delivered"||status==="cancelled")
      setOvertimeIds(prev=>{const n=new Set(prev);n.delete(id);return n;});
    try {
      await fetch("/api/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});
      loadOrders();
    }catch{}
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("¿Eliminar este pedido?")) return;
    try { await fetch(`/api/orders?id=${id}`,{method:"DELETE"}); loadOrders(); }catch{}
  };

  // ── Menu actions ─────────────────────────────────────────────────────────
  const toggleStock = async (id: string, cur: boolean) => {
    setSavingId(id);
    try { await fetch("/api/menu-stock",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:id,soldOut:!cur})}); setMenuStock(p=>({...p,[id]:!cur})); }
    finally { setSavingId(null); }
  };
  const savePrice = async (id: string, def: number) => {
    const v=parseFloat(priceInputs[id]||"0");
    setSavingId(id+"_price");
    try {
      await fetch("/api/menu-prices",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:id,price:v>0?v:0})});
      setMenuPrices(p=>{const n={...p};if(v<=0)delete n[id];else n[id]=v;return n;});
    }finally{setSavingId(null);}
  };
  const saveDiscount = async (id: string, def: number) => {
    const v=parseFloat(discInputs[id]||"0");
    setSavingId(id+"_disc");
    try {
      await fetch("/api/menu-discounts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:id,price:v>0&&v<def?v:0})});
      setMenuDiscounts(p=>{const n={...p};if(v<=0||v>=def)delete n[id];else n[id]=v;return n;});
    }finally{setSavingId(null);}
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getPeruDate = (d?: Date|string) => new Date(new Date(d??Date.now()).toLocaleString("en-US",{timeZone:"America/Lima"}));
  const isSameDay   = (d: string) => { const a=getPeruDate(d),b=getPeruDate(); return a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear(); };
  const fmtSoles    = (n: number) => `S/ ${n.toFixed(2)}`;
  const fmtHour     = (s: string) => { try { return new Date(s).toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit",timeZone:"America/Lima"}); }catch{ return ""; } };
  const fmtDate     = (s: string) => { try { return new Date(s).toLocaleDateString("es-PE",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"America/Lima"}); }catch{ return ""; } };

  // ── Financial calculations ────────────────────────────────────────────────
  const delivered = orders.filter(o=>o.status==="delivered"&&!o.isCanje);

  const now        = getPeruDate();
  const startMonth = new Date(now.getFullYear(),now.getMonth(),1);
  const startToday = new Date(now.getFullYear(),now.getMonth(),now.getDate());

  const todayDelivered  = delivered.filter(o=>getPeruDate(o.createdAt)>=startToday);
  const monthDelivered  = delivered.filter(o=>getPeruDate(o.createdAt)>=startMonth);

  const todaySales   = todayDelivered.reduce((s,o)=>s+(o.totalPrice||0),0);
  const monthlySales = monthDelivered.reduce((s,o)=>s+(o.totalPrice||0),0);
  const avgTicket    = todayDelivered.length>0 ? todaySales/todayDelivered.length : 0;

  // Expenses for selected finance month
  const [finYear, finMonthNum] = finMonth.split("-").map(Number);
  const finMonthStart = new Date(finYear, finMonthNum-1, 1);
  const finMonthEnd   = new Date(finYear, finMonthNum, 0, 23, 59, 59);
  const finDelivered  = delivered.filter(o => { const d=getPeruDate(o.createdAt); return d>=finMonthStart&&d<=finMonthEnd; });
  const finSales      = finDelivered.reduce((s,o)=>s+(o.totalPrice||0),0);
  const finExpenses   = inventory
    .filter(p=>{ const d=new Date(p.purchaseDate||p.createdAt||""); return d>=finMonthStart&&d<=finMonthEnd; })
    .reduce((s,p)=>s+(p.totalAmount||0),0);
  const finProfit  = finSales - finExpenses;
  const finMargin  = finSales>0 ? (finProfit/finSales)*100 : 0;

  // Current month for dashboard
  const monthExpenses = inventory
    .filter(p=>{ const d=new Date(p.purchaseDate||p.createdAt||""); return d>=startMonth; })
    .reduce((s,p)=>s+(p.totalAmount||0),0);
  const monthProfit = monthlySales - monthExpenses;
  const monthMargin = monthlySales>0 ? (monthProfit/monthlySales)*100 : 0;

  // Daily breakdown for finance tab
  const dailyMap = new Map<string,{orders:number;sales:number}>();
  finDelivered.forEach(o=>{
    const d=getPeruDate(o.createdAt);
    const k=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
    const prev=dailyMap.get(k)||{orders:0,sales:0};
    dailyMap.set(k,{orders:prev.orders+1,sales:prev.sales+(o.totalPrice||0)});
  });
  const dailyRows = Array.from(dailyMap.entries()).sort((a,b)=>a[0].localeCompare(b[0])).reverse();

  // Monthly breakdown (all time)
  const monthlyMap = new Map<string,{orders:number;sales:number;expenses:number}>();
  delivered.forEach(o=>{
    const d=getPeruDate(o.createdAt);
    const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const prev=monthlyMap.get(k)||{orders:0,sales:0,expenses:0};
    monthlyMap.set(k,{...prev,orders:prev.orders+1,sales:prev.sales+(o.totalPrice||0)});
  });
  inventory.forEach(p=>{
    const d=new Date(p.purchaseDate||p.createdAt||"");
    const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const prev=monthlyMap.get(k)||{orders:0,sales:0,expenses:0};
    monthlyMap.set(k,{...prev,expenses:prev.expenses+(p.totalAmount||0)});
  });
  const monthlyRows = Array.from(monthlyMap.entries()).sort((a,b)=>b[0].localeCompare(a[0]));

  // ── Active orders filter ──────────────────────────────────────────────────
  const activeStatuses = ["pending","pendiente-verificacion","confirmed","en-camino"];
  const filteredOrders = (() => {
    if (orderFilter==="activos")  return [...orders].filter(o=>activeStatuses.includes(o.status)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    if (orderFilter==="hoy")      return [...orders].filter(o=>isSameDay(o.createdAt)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    return [...orders].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,100);
  })();

  const activeCount = orders.filter(o=>activeStatuses.includes(o.status)).length;

  // ── Product top sellers ───────────────────────────────────────────────────
  const productSales = new Map<string,{name:string;qty:number;revenue:number}>();
  monthDelivered.forEach(o=>{
    (o.completedOrders||o.cart||[]).forEach((item:any)=>{
      const id=item.productId||item.product?.id||"?";
      const name=item.name||item.product?.name||id;
      const qty=item.quantity||1;
      const rev=(item.finalPrice??item.price??0)*qty;
      const prev=productSales.get(id)||{name,qty:0,revenue:0};
      productSales.set(id,{name,qty:prev.qty+qty,revenue:prev.revenue+rev});
    });
  });
  const topProducts = Array.from(productSales.values()).sort((a,b)=>b.qty-a.qty).slice(0,6);

  // ── Month name ────────────────────────────────────────────────────────────
  const MONTHS=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const monthLabel = `${MONTHS[finMonthNum-1]} ${finYear}`;

  if (checkingAuth) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── DELIVERY TOAST ── */}
      {deliveryToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-green-900 border border-green-500 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-black text-green-300 text-sm">Pedido entregado</p>
            <p className="text-xs text-green-400">#{deliveryToast.id} · {deliveryToast.name}</p>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logoprincipal.png" alt="Santo Dilema" width={80} height={20} className="h-7 w-auto" />
            <span className="text-xs font-bold text-amber-400/60 uppercase tracking-widest hidden sm:block">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <span className="bg-amber-500 text-black text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse">
                {activeCount} activo{activeCount>1?"s":""}
              </span>
            )}
            <button
              onClick={()=>{ localStorage.removeItem("admin_token"); router.push("/admin/login"); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="max-w-6xl mx-auto px-4 flex gap-0 border-t border-white/5">
          {([
            { id: "dashboard", label: "Dashboard",  icon: "📊" },
            { id: "pedidos",   label: "Pedidos",    icon: "📦" },
            { id: "finanzas",  label: "Finanzas",   icon: "💰" },
            { id: "carta",     label: "Carta",      icon: "🍔" },
          ] as const).map(tab=>(
            <button
              key={tab.id}
              onClick={()=>setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab===tab.id
                  ? "text-amber-400 border-b-2 border-amber-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="hidden sm:inline">{tab.icon}</span>
              {tab.label}
              {tab.id==="pedidos" && activeCount>0 && (
                <span className="w-2 h-2 bg-amber-400 rounded-full absolute top-2 right-1" />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DASHBOARD                                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab==="dashboard" && (
          <div className="space-y-6">

            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard label="Ventas hoy"    value={fmtSoles(todaySales)}   sub={`${todayDelivered.length} pedido${todayDelivered.length!==1?"s":""}`}  icon="💵" color="amber" />
              <KpiCard label="Ticket prom."  value={fmtSoles(avgTicket)}    sub="hoy"                                                                    icon="🧾" color="blue"  />
              <KpiCard label="Ventas mes"    value={fmtSoles(monthlySales)} sub={`${monthDelivered.length} pedidos`}                                     icon="📈" color="amber" />
              <KpiCard label="Gastos mes"    value={fmtSoles(monthExpenses)}sub="compras + insumos"                                                      icon="🛒" color="red"   />
              <KpiCard label="Utilidad mes"  value={fmtSoles(monthProfit)}  sub={`Margen ${monthMargin.toFixed(1)}%`}                                    icon="💰" color={monthProfit>=0?"green":"red"} />
              <KpiCard label="Activos ahora" value={String(activeCount)}    sub="pedidos en curso"                                                       icon="🔥" color={activeCount>0?"purple":"amber"} />
            </div>

            {/* Top productos del mes */}
            {topProducts.length > 0 && (
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Top productos — este mes</h3>
                <div className="space-y-2">
                  {topProducts.map((p,i)=>(
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-600 w-4">{i+1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                          <span className="text-xs text-amber-400 font-bold ml-2">{p.qty} uds</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{width:`${Math.min(100,(p.qty/topProducts[0].qty)*100)}%`}}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{fmtSoles(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pedidos activos quick-view */}
            {activeCount > 0 && (
              <div className="bg-white/[0.03] border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Pedidos activos</h3>
                  <button onClick={()=>setActiveTab("pedidos")} className="text-xs text-gray-400 hover:text-amber-400 transition-colors">Ver todos →</button>
                </div>
                <div className="space-y-2">
                  {orders.filter(o=>activeStatuses.includes(o.status)).slice(0,5).map(o=>{
                    const sc=STATUS_CONFIG[o.status];
                    return (
                      <div key={o.id} className={`flex items-center gap-3 rounded-xl p-3 border ${sc.bg}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{o.name}</p>
                          <p className="text-xs text-gray-400 truncate">{o.address}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-amber-400">{fmtSoles(o.totalPrice||0)}</p>
                          <p className={`text-xs font-semibold ${sc.color}`}>{sc.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PEDIDOS                                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab==="pedidos" && (
          <div className="space-y-4">

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["activos","hoy","todos"] as const).map(f=>(
                <button
                  key={f}
                  onClick={()=>setOrderFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                    orderFilter===f
                      ? "bg-amber-500 text-black"
                      : "bg-white/5 text-gray-400 hover:bg-white/8 hover:text-white border border-white/8"
                  }`}
                >
                  {f==="activos" ? `Activos (${activeCount})` : f==="hoy" ? "Hoy" : "Todos"}
                </button>
              ))}
              {loading && <span className="text-xs text-gray-500 animate-pulse ml-2">Cargando…</span>}
            </div>

            {/* Order cards */}
            {filteredOrders.length===0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-semibold">Sin pedidos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order=>{
                  const sc=STATUS_CONFIG[order.status];
                  const isExpanded=expandedId===order.id;
                  const items=(order.completedOrders||order.cart||[]) as any[];
                  const isActive=activeStatuses.includes(order.status);
                  return (
                    <div key={order.id} className={`rounded-2xl border overflow-hidden transition-all ${
                      overtimeIds.has(order.id) ? "border-red-500/60 shadow-red-500/20 shadow-lg" : isActive ? "border-amber-500/25" : "border-white/8"
                    } bg-white/[0.03]`}>

                      {/* Card header */}
                      <div
                        className="p-4 cursor-pointer select-none"
                        onClick={()=>setExpandedId(isExpanded?null:order.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-white text-sm">{order.name}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                              {order.isCanje && <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">CANJE</span>}
                              {order.scheduledDate && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">Programado</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-gray-400 truncate">{order.address}</span>
                              <span className="text-xs text-gray-600">{fmtDate(order.createdAt)} {fmtHour(order.createdAt)}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-black text-amber-400 text-base">{fmtSoles(order.totalPrice||0)}</p>
                            <p className="text-xs text-gray-500">{PAYMENT_LABELS[order.paymentMethod||""]||order.paymentMethod||""}</p>
                          </div>
                        </div>

                        {/* Timer + quick info */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3">
                            {isActive && (
                              <TimeCounter
                                createdAt={order.createdAt}
                                status={order.status}
                                audioCtx={audioCtx}
                                onOvertime={()=>setOvertimeIds(prev=>{const n=new Set(prev);n.add(order.id);return n;})}
                              />
                            )}
                            <span className="text-xs text-gray-600">#{order.id}</span>
                          </div>
                          <span className="text-gray-500 text-xs">{isExpanded?"▲":"▼"}</span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-white/5 p-4 space-y-4">

                          {/* Items */}
                          {items.length>0 && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Pedido</p>
                              <div className="space-y-2">
                                {items.map((item:any,i:number)=>{
                                  const salsaNms = (item.salsas||[]).map((sid:string)=>SALSAS.find(s=>s.id===sid)?.name||sid);
                                  const compNms  = (item.complementIds||[]).map((cid:string)=>COMPLEMENTS[cid]||cid);
                                  return (
                                    <div key={i} className="flex gap-3 bg-white/[0.02] rounded-xl p-3">
                                      <span className="bg-amber-500/20 text-amber-400 font-black text-xs rounded-lg w-7 h-7 flex items-center justify-center flex-shrink-0">{item.quantity||1}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white">{item.name||item.product?.name}</p>
                                        {salsaNms.length>0 && <p className="text-xs text-amber-300/70 mt-0.5">🌶️ {salsaNms.join(", ")}</p>}
                                        {compNms.length>0  && <p className="text-xs text-green-300/70 mt-0.5">+ {compNms.join(", ")}</p>}
                                      </div>
                                      <span className="text-sm font-bold text-amber-400 flex-shrink-0">{fmtSoles((item.finalPrice??item.price??0)*(item.quantity||1))}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Discounts / delivery */}
                          {((order.comboDiscount||0)>0||(order.couponDiscount||0)>0||(order.deliveryCost||0)>0) && (
                            <div className="text-xs text-gray-400 space-y-1 bg-white/[0.02] rounded-xl p-3">
                              {(order.comboDiscount||0)>0  && <p>Combo desc: -S/ {(order.comboDiscount||0).toFixed(2)}</p>}
                              {(order.couponDiscount||0)>0  && <p>Cupón desc: -{order.couponDiscount}%</p>}
                              {(order.deliveryCost||0)>0   && <p>Delivery ({order.deliveryOption}): +S/ {order.deliveryCost?.toFixed(2)}</p>}
                            </div>
                          )}

                          {/* Customer info */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/[0.02] rounded-xl p-3">
                              <p className="text-gray-500 mb-1">Cliente</p>
                              <p className="font-semibold text-white">{order.name}</p>
                              <p className="text-gray-400">{order.phone}</p>
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-3">
                              <p className="text-gray-500 mb-1">Dirección</p>
                              <p className="font-semibold text-white">{order.address}</p>
                            </div>
                          </div>

                          {/* Scheduled */}
                          {order.scheduledDate && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
                              <span className="font-bold">📅 Programado para:</span> {order.scheduledDate} a las {order.scheduledTime}
                            </div>
                          )}

                          {/* Voucher */}
                          {order.paymentProofPath && (
                            <button
                              onClick={()=>setVoucherModal(order.paymentProofPath!)}
                              className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                            >
                              Ver comprobante de pago
                            </button>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {order.status==="pending" && (
                              <button onClick={()=>updateStatus(order.id,"confirmed")} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">✓ Confirmar</button>
                            )}
                            {order.status==="pendiente-verificacion" && (
                              <button onClick={()=>updateStatus(order.id,"confirmed")} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">✓ Verificar y confirmar</button>
                            )}
                            {order.status==="confirmed" && (
                              <button onClick={()=>updateStatus(order.id,"en-camino")} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">🛵 En camino</button>
                            )}
                            {order.status==="en-camino" && (
                              <button onClick={()=>updateStatus(order.id,"delivered")} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95">✅ Entregado</button>
                            )}
                            {order.status==="delivered" && (
                              <button onClick={()=>updateStatus(order.id,"en-camino")} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95">↩ Revertir</button>
                            )}
                            {!["delivered","cancelled"].includes(order.status) && (
                              <button onClick={()=>updateStatus(order.id,"cancelled")} className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-300 rounded-xl text-xs font-bold border border-red-500/30 transition-all active:scale-95">✕ Cancelar</button>
                            )}
                            {["delivered","cancelled"].includes(order.status) && (
                              <button onClick={()=>deleteOrder(order.id)} className="px-4 py-2 bg-gray-900 hover:bg-red-900/30 text-gray-500 hover:text-red-400 rounded-xl text-xs font-bold border border-white/8 hover:border-red-500/30 transition-all active:scale-95">🗑 Eliminar</button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FINANZAS                                                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab==="finanzas" && (
          <div className="space-y-6">

            {/* Month selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400 font-semibold">Mes:</label>
              <input
                type="month"
                value={finMonth}
                onChange={e=>setFinMonth(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
              <span className="text-sm font-bold text-amber-400">{monthLabel}</span>
            </div>

            {/* KPIs del mes seleccionado */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Ventas"   value={fmtSoles(finSales)}    sub={`${finDelivered.length} pedidos entregados`} icon="💵" color="amber" />
              <KpiCard label="Gastos"   value={fmtSoles(finExpenses)} sub="compras e insumos"                           icon="🛒" color="red"   />
              <KpiCard label="Utilidad" value={fmtSoles(finProfit)}   sub={`Margen ${finMargin.toFixed(1)}%`}           icon="💰" color={finProfit>=0?"green":"red"} />
              <KpiCard label="Ticket ø" value={fmtSoles(finDelivered.length>0?finSales/finDelivered.length:0)} sub="por pedido" icon="🧾" color="blue" />
            </div>

            {/* Historial mensual */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Historial mensual</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Mes</th>
                      <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Pedidos</th>
                      <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Ventas</th>
                      <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Gastos</th>
                      <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Utilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRows.length===0 ? (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-600 text-xs">Sin datos</td></tr>
                    ) : monthlyRows.map(([month,data])=>{
                      const [y,m]=month.split("-").map(Number);
                      const profit=data.sales-data.expenses;
                      return (
                        <tr key={month} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 font-semibold text-white">{MONTHS[m-1]} {y}</td>
                          <td className="px-5 py-3 text-right text-gray-300">{data.orders}</td>
                          <td className="px-5 py-3 text-right text-amber-400 font-bold">{fmtSoles(data.sales)}</td>
                          <td className="px-5 py-3 text-right text-red-400">{fmtSoles(data.expenses)}</td>
                          <td className={`px-5 py-3 text-right font-black ${profit>=0?"text-green-400":"text-red-400"}`}>{fmtSoles(profit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ventas por día del mes seleccionado */}
            {dailyRows.length>0 && (
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Ventas por día — {monthLabel}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Fecha</th>
                        <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Pedidos</th>
                        <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Total</th>
                        <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Ticket ø</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRows.map(([day,data])=>(
                        <tr key={day} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 font-semibold text-white">{day}</td>
                          <td className="px-5 py-3 text-right text-gray-300">{data.orders}</td>
                          <td className="px-5 py-3 text-right text-amber-400 font-bold">{fmtSoles(data.sales)}</td>
                          <td className="px-5 py-3 text-right text-gray-400">{fmtSoles(data.orders>0?data.sales/data.orders:0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Compras registradas del mes */}
            {inventory.filter(p=>{ const d=new Date(p.purchaseDate||p.createdAt||""); return d>=finMonthStart&&d<=finMonthEnd; }).length>0 && (
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Compras y gastos — {monthLabel}</h3>
                </div>
                <div className="space-y-2 p-4">
                  {inventory
                    .filter(p=>{ const d=new Date(p.purchaseDate||p.createdAt||""); return d>=finMonthStart&&d<=finMonthEnd; })
                    .sort((a,b)=>new Date(b.purchaseDate||b.createdAt).getTime()-new Date(a.purchaseDate||a.createdAt).getTime())
                    .map((p:any,i:number)=>(
                      <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{p.supplier||"Proveedor"}</p>
                          <p className="text-xs text-gray-500">{fmtDate(p.purchaseDate||p.createdAt)} · {p.category||"general"} · {p.paymentMethod||""}</p>
                        </div>
                        <span className="text-sm font-black text-red-400">{fmtSoles(p.totalAmount||0)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CARTA                                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab==="carta" && (
          <div className="space-y-6">
            <p className="text-xs text-gray-500">Gestiona disponibilidad y precios del menú en tiempo real.</p>

            {(["fat","fit","taco"] as const).map(cat=>{
              const catLabels: Record<string,string> = { fat:"🍗 Alitas", fit:"🥗 Ensaladas", taco:"🌮 Tacos" };
              const catColors: Record<string,string> = { fat:"border-red-500/20 text-red-400", fit:"border-cyan-500/20 text-cyan-400", taco:"border-green-500/20 text-green-400" };
              const prods = MENU_PRODUCTS.filter(p=>p.category===cat);
              return (
                <div key={cat} className={`bg-white/[0.03] border rounded-2xl overflow-hidden ${catColors[cat]}`}>
                  <div className={`px-5 py-3 border-b ${catColors[cat]}`}>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{catLabels[cat]}</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {prods.map(prod=>{
                      const isSoldOut = !!menuStock[prod.id];
                      const currentPrice = menuPrices[prod.id] || prod.price;
                      const discountPrice = menuDiscounts[prod.id];
                      return (
                        <div key={prod.id} className="px-5 py-4">
                          {/* Name + toggle */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className={`text-sm font-bold ${isSoldOut?"text-gray-500 line-through":"text-white"}`}>{prod.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Precio base: <span className="text-amber-400">S/ {prod.price.toFixed(2)}</span>
                                {currentPrice !== prod.price && <span className="text-blue-400 ml-2">→ S/ {currentPrice.toFixed(2)}</span>}
                                {discountPrice && <span className="text-green-400 ml-2">Oferta: S/ {discountPrice.toFixed(2)}</span>}
                              </p>
                            </div>
                            <button
                              onClick={()=>toggleStock(prod.id, isSoldOut)}
                              disabled={savingId===prod.id}
                              className={`relative w-12 h-6 rounded-full transition-all ${isSoldOut?"bg-red-500":"bg-green-500"} ${savingId===prod.id?"opacity-50":""}`}
                            >
                              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isSoldOut?"left-0.5":"left-6"}`} />
                            </button>
                          </div>
                          {isSoldOut && <p className="text-xs text-red-400 font-semibold mb-3">⚠️ Marcado como agotado</p>}

                          {/* Price & discount inputs */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Precio especial</label>
                              <div className="flex gap-1">
                                <input
                                  type="number" step="0.5" min="0"
                                  value={priceInputs[prod.id]||""}
                                  onChange={e=>setPriceInputs(p=>({...p,[prod.id]:e.target.value}))}
                                  placeholder={prod.price.toFixed(2)}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 w-0"
                                />
                                <button
                                  onClick={()=>savePrice(prod.id,prod.price)}
                                  disabled={savingId===prod.id+"_price"}
                                  className="text-[10px] font-bold bg-blue-600/50 hover:bg-blue-600 text-blue-200 px-2 rounded-lg transition-all disabled:opacity-50"
                                >
                                  {savingId===prod.id+"_price"?"…":"OK"}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Precio oferta</label>
                              <div className="flex gap-1">
                                <input
                                  type="number" step="0.5" min="0"
                                  value={discInputs[prod.id]||""}
                                  onChange={e=>setDiscInputs(p=>({...p,[prod.id]:e.target.value}))}
                                  placeholder="—"
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50 w-0"
                                />
                                <button
                                  onClick={()=>saveDiscount(prod.id,currentPrice)}
                                  disabled={savingId===prod.id+"_disc"}
                                  className="text-[10px] font-bold bg-amber-600/50 hover:bg-amber-600 text-amber-200 px-2 rounded-lg transition-all disabled:opacity-50"
                                >
                                  {savingId===prod.id+"_disc"?"…":"OK"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── VOUCHER MODAL ── */}
      {voucherModal && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={()=>setVoucherModal(null)}>
          <div className="relative max-w-sm w-full" onClick={e=>e.stopPropagation()}>
            <img src={voucherModal} alt="Comprobante" className="w-full rounded-2xl shadow-2xl" />
            <button onClick={()=>setVoucherModal(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/70 text-white rounded-full text-lg font-black hover:bg-black">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
