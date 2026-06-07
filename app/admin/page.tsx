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
    complements[`extra-salsa-${salsa.id}`] = {
      name: `Extra salsa - ${salsa.name}`,
      price: 3.00
    };
  });

  return complements;
};

const availableComplements = generateAvailableComplements();

// ── PEDIDOS DE PRUEBA ────────────────────────────────────────────────────────
const _ago = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();
const MOCK_ORDERS: any[] = [
  { id: "SD-T001", name: "Carlos Mendoza", phone: "987654321", address: "Recojo en tienda",
    status: "pending", createdAt: _ago(6), totalItems: 2, totalPrice: 38, paymentMethod: "yape",
    paymentProofPath: "https://via.placeholder.com/400x600/9333ea/ffffff?text=Comprobante+Yape",
    completedOrders: [
      { name: "Chicken FAT", quantity: 1, price: 19, category: "fat", salsas: ["barbecue"], complementIds: ["coca-cola"] },
      { name: "Chicken FAT", quantity: 1, price: 19, category: "fat", salsas: ["buffalo-picante"], complementIds: [] },
    ] },
  { id: "SD-T002", name: "Lucía Torres", phone: "976543210", address: "Jr. Los Pinos 456, Huaral",
    status: "pendiente-verificacion", createdAt: _ago(14), totalItems: 3, totalPrice: 62,
    paymentMethod: "anticipado", notes: "Sin cebolla por favor", deliveryCost: 5,
    completedOrders: [
      { name: "Chicken FAT", quantity: 2, price: 19, category: "fat", salsas: ["ahumada"], complementIds: ["inka-cola"] },
      { name: "Pollo Grillado FIT", quantity: 1, price: 24, category: "fit", salsas: [], complementIds: [] },
    ] },
  { id: "SD-T003", name: "Andrés Silva", phone: "945678901", address: "Recojo en tienda",
    status: "confirmed", createdAt: _ago(22), confirmedAt: _ago(17), totalItems: 1, totalPrice: 29,
    paymentMethod: "efectivo",
    completedOrders: [
      { name: "Taco Duo", quantity: 1, price: 29, category: "taco", salsas: ["santo-crujiente", "tex-dilema"], complementIds: [] },
    ] },
  { id: "SD-T004", name: "María García", phone: "912345678", address: "Av. Grau 234, Huaral",
    status: "confirmed", createdAt: _ago(38), confirmedAt: _ago(30), totalItems: 4, totalPrice: 86,
    paymentMethod: "plin", deliveryCost: 7,
    completedOrders: [
      { name: "Chicken FAT", quantity: 2, price: 19, category: "fat", salsas: ["honey-mustard"], complementIds: ["papas-fritas", "coca-cola"] },
      { name: "Pollo Grillado FIT", quantity: 1, price: 24, category: "fit", salsas: [], complementIds: ["agua-mineral"] },
      { name: "Extra papas", quantity: 1, price: 5, category: "fit", salsas: [], complementIds: [] },
    ] },
  { id: "SD-T005", name: "Roberto Quispe", phone: "965432109", address: "Urb. Las Flores 567",
    status: "en-camino", createdAt: _ago(58), confirmedAt: _ago(50), enCaminoAt: _ago(12),
    totalItems: 2, totalPrice: 43, paymentMethod: "contraentrega-yape-plin", deliveryCost: 5,
    completedOrders: [
      { name: "Chicken FAT", quantity: 1, price: 19, category: "fat", salsas: ["anticuchos"], complementIds: ["sprite"] },
      { name: "Pollo Grillado FIT", quantity: 1, price: 24, category: "fit", salsas: [], complementIds: [] },
    ] },
  { id: "SD-T006", name: "Patricia Limas", phone: "934567890", address: "Recojo en tienda",
    status: "delivered", createdAt: _ago(95), confirmedAt: _ago(85), deliveredAt: _ago(18),
    totalItems: 3, totalPrice: 57, paymentMethod: "efectivo",
    completedOrders: [
      { name: "Chicken FAT", quantity: 3, price: 19, category: "fat", salsas: ["macerichada"], complementIds: [] },
    ] },
  { id: "SD-T007", name: "Jorge Ramírez", phone: "923456789", address: "Calle Real 890",
    status: "programado", createdAt: _ago(42), totalItems: 2, totalPrice: 48,
    paymentMethod: "contraentrega-yape-plin", deliveryCost: 5,
    scheduledTime: "20:30", scheduledDate: new Date().toLocaleDateString('en-CA'),
    completedOrders: [
      { name: "Chicken FAT", quantity: 1, price: 19, category: "fat", salsas: ["teriyaki"], complementIds: ["fanta"] },
      { name: "Pollo Grillado FIT", quantity: 1, price: 24, category: "fit", salsas: [], complementIds: ["agua-mineral"] },
    ] },
];

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
  status: "pending" | "pendiente-verificacion" | "confirmed" | "en-camino" | "delivered" | "cancelled";
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

// Componente para el contador de tiempo
function TimeCounter({ createdAt, status, onOvertime, audioCtx }: { createdAt: string; orderId: string; status: string; onOvertime?: () => void; audioCtx?: AudioContext | null }) {
  const [elapsed, setElapsed] = useState("");
  const [isOvertime, setIsOvertime] = useState(false);
  const alertedRef = useRef(false);
  // Momento en que este pedido apareció en pantalla — fallback ante desfase de reloj
  const mountTimeRef = useRef<number>(Date.now());
  // Evitar que callbacks (referencia nueva en cada render) disparen re-montajes del efecto
  const onOvertimeRef = useRef(onOvertime);
  const audioCtxRef = useRef(audioCtx);
  useEffect(() => { onOvertimeRef.current = onOvertime; }, [onOvertime]);
  useEffect(() => { audioCtxRef.current = audioCtx; }, [audioCtx]);

  useEffect(() => {
    if (status === 'cancelled' || status === 'delivered') return;

    const playAlert = () => {
      try {
        // Usar el AudioContext ya inicializado por el admin (requiere interacción previa del usuario)
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        [0, 0.35, 0.7].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = 'square';
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

      // Corrección para timestamps en formato antiguo (Lima-hora almacenada como UTC, 5h offset)
      if (diff > 4 * 60 * 60) diff -= 5 * 60 * 60;

      // Tiempo local desde que el pedido apareció en pantalla
      const localDiff = Math.floor((Date.now() - mountTimeRef.current) / 1000);

      // Usar siempre el mayor de los dos valores:
      // - si diff < 0 (reloj server adelantado): localDiff arranca desde 0 sin congelarse
      // - cuando los relojes se sincronizan: evita que el contador retroceda (no-jump)
      // - para pedidos pre-existentes cargados al abrir admin: diff real es mayor, se usa ese
      diff = Math.max(diff, localDiff);

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      if (minutes >= 20 && !alertedRef.current &&
          (status === 'pending' || status === 'pendiente-verificacion' || status === 'confirmed' || status === 'en-camino')) {
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
  // onOvertime excluido de deps — se accede vía ref para evitar reinicios del intervalo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt, status]);

  return (
    <span className={`font-mono text-lg font-black ${isOvertime ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
      {isOvertime ? '⚠️ ' : ''}{elapsed}
    </span>
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
  // Set permanente: una vez anunciado como entregado, NUNCA se vuelve a anunciar
  const announcedDeliveredRef = useRef<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [showMockData, setShowMockData] = useState(true);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [chartTimeFilter, setChartTimeFilter] = useState<"days" | "weeks" | "months" | "years">("days");
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "customers" | "analytics" | "financial" | "marketing" | "carta">("orders");
  const [overtimeOrderIds, setOvertimeOrderIds] = useState<Set<string>>(new Set());
  const [menuStock, setMenuStock] = useState<Record<string, boolean>>({});
  const [menuStockSaving, setMenuStockSaving] = useState<string | null>(null);
  const [challengeData, setChallengeData] = useState<{ salesAmount: number; goal: number; active: boolean; deadline: string }>({ salesAmount: 0, goal: 5000, active: true, deadline: '2026-03-28' });
  const [challengeSalesInput, setChallengeSalesInput] = useState('');
  const [challengeSaving, setChallengeSaving] = useState(false);
  const [menuDiscounts, setMenuDiscounts] = useState<Record<string, number>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>({});
  const [discountSaving, setDiscountSaving] = useState<string | null>(null);
  const [menuPrices, setMenuPrices] = useState<Record<string, number>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [priceSaving, setPriceSaving] = useState<string | null>(null);
  const [financialSection, setFinancialSection] = useState<"dashboard" | "purchases" | "products" | "stock" | "canjes">("dashboard");
  const [canjeModal, setCanjeModal] = useState<{ orderId: string } | null>(null);
  const [canjeNoteInput, setCanjeNoteInput] = useState("");
  const [canjeSaving, setCanjeSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  // Estados de filtro de fechas para la pestaña "Gestión de Pedidos"
  const [ordersDateFrom, setOrdersDateFrom] = useState<string>("");
  const [ordersDateTo, setOrdersDateTo] = useState<string>("");
  const [isOrdersDateFiltered, setIsOrdersDateFiltered] = useState(false);
  const [showOrdersDateModal, setShowOrdersDateModal] = useState(false);
  // Estados de filtro de fechas para la pestaña "Analytics & CRM"
  const [analyticsDateFrom, setAnalyticsDateFrom] = useState<string>("");
  const [analyticsDateTo, setAnalyticsDateTo] = useState<string>("");
  const [isAnalyticsDateFiltered, setIsAnalyticsDateFiltered] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customerSegment, setCustomerSegment] = useState<string>("all");
  const [deliveryToast, setDeliveryToast] = useState<{ orderId: string; customerName: string } | null>(null);
  const [customerSortKey, setCustomerSortKey] = useState<string>("totalOrders");
  const [customerSortDir, setCustomerSortDir] = useState<"asc" | "desc">("desc");
  // CRM
  const [customerProfiles, setCustomerProfiles] = useState<any[]>([]);
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [crmEditPhone, setCrmEditPhone] = useState('');
  const [crmForm, setCrmForm] = useState({ birthday: '', tags: [] as string[], notes: '' });
  const [crmSaving, setCrmSaving] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignSegment, setCampaignSegment] = useState('inactive30');
  const [customersView, setCustomersView] = useState<'list' | 'dashboard' | 'birthdays'>('list');
  // CRM ficha estados
  const [customerModalTab, setCustomerModalTab] = useState<'overview' | 'orders' | 'addresses'>('overview');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({ name: '', phone: '', address: '' });
  const [editCustomerSaving, setEditCustomerSaving] = useState(false);
  const [primaryAddressMap, setPrimaryAddressMap] = useState<Record<string, string>>({});
  // Sistema de alertas de cumpleaños
  const [birthdayAlerts, setBirthdayAlerts] = useState<{ today: any[]; tomorrow: any[]; thisWeek: any[]; thisMonth: any[]; settings: any } | null>(null);
  const [birthdayAlertsLoading, setBirthdayAlertsLoading] = useState(false);
  const [showBirthdaySettings, setShowBirthdaySettings] = useState(false);
  const [bdSettingsForm, setBdSettingsForm] = useState({ waTemplate: '', recipientEmail: '', alertDaysBefore: 1 });
  const [bdSettingsSaving, setBdSettingsSaving] = useState(false);
  const [bdSendingEmail, setBdSendingEmail] = useState(false);
  const [bdEmailResult, setBdEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [salesDateFrom, setSalesDateFrom] = useState<string>("");
  const [salesDateTo, setSalesDateTo] = useState<string>("");
  const [isSalesDateFiltered, setIsSalesDateFiltered] = useState(false);
  const [salesDateInitialized, setSalesDateInitialized] = useState(false);
  const [dashboardDateFrom, setDashboardDateFrom] = useState<string>("");
  const [dashboardDateTo, setDashboardDateTo] = useState<string>("");
  const [isDashboardDateFiltered, setIsDashboardDateFiltered] = useState(false);
  const [dashboardDateInitialized, setDashboardDateInitialized] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [cajaData, setCajaData] = useState<{ snapshotBalance: number; snapshotDate: string; snapshotCreatedAt?: string } | null>(null);
  const [cajaEditMode, setCajaEditMode] = useState(false);
  const [cajaEditBalance, setCajaEditBalance] = useState("");
  const [cajaEditDate, setCajaEditDate] = useState("");
  const [deductions, setDeductions] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false);
  const [newMaterialForm, setNewMaterialForm] = useState({ productName: "", unit: "" });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", category: "fit", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] as Array<{ productName: string; unit: string; quantity: number }> });
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucherPath, setSelectedVoucherPath] = useState<string>("");
  const [selectedVoucherOrder, setSelectedVoucherOrder] = useState<any>(null);
  const [inventoryForm, setInventoryForm] = useState({
    supplier: "",
    supplierRuc: "",
    supplierPhone: "",
    paymentMethod: "plin-yape",
    category: "operativos",
    items: [{ productName: "", quantity: 0, unit: "kg", volume: 0, unitCost: 0, total: 0 }],
    totalAmount: 0,
    purchaseDate: new Date().toISOString().split('T')[0]
  });
  const [promotions, setPromotions] = useState<any[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [marketingSection, setMarketingSection] = useState<"promotions" | "campaigns" | "loyalty" | "challenge">("promotions");
  const [inventorySection, setInventorySection] = useState<"purchases" | "stock">("purchases");
  const [purchasesSubTab, setPurchasesSubTab] = useState<"history" | "stock">("history"); // Sub-tabs dentro de Compras y Gastos
  const [inventorySearchTerm, setInventorySearchTerm] = useState<string>("");
  const [stockSearchTerm, setStockSearchTerm] = useState<string>("");
  const [stockConsumptions, setStockConsumptions] = useState<Map<string, number>>(new Map());
  const [showHistoricalSaleModal, setShowHistoricalSaleModal] = useState(false);
  const [historicalSaleRegistered, setHistoricalSaleRegistered] = useState(false);
  const [inventoryDateFilter, setInventoryDateFilter] = useState<string>("");
  const [inventoryMonthFilter, setInventoryMonthFilter] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>("all");
  const [liquidadoFilter, setLiquidadoFilter] = useState<'all' | 'pendiente' | 'liquidado'>('all');
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

  // Salsa promos
  const [salsaPromos, setSalsaPromos] = useState<any[]>([]);
  const [showSalsaPromoModal, setShowSalsaPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [promoForm, setPromoForm] = useState({ productId: 'pequeno-dilema', salsas: [] as string[], promoPrice: 0, active: true });
  const [promoSaving, setPromoSaving] = useState(false);

  // Resetear cliente seleccionado cuando cambia el segmento de clientes
  useEffect(() => {
    setSelectedCustomer(null);
  }, [customerSegment]);

  // Cargar alertas de cumpleaños al entrar al tab clientes
  useEffect(() => {
    if (activeTab !== 'customers') return;
    setBirthdayAlertsLoading(true);
    fetch('/api/birthday-alerts')
      .then(r => r.json())
      .then(data => {
        setBirthdayAlerts(data);
        if (data.settings) {
          setBdSettingsForm({
            waTemplate: data.settings.waTemplate || '',
            recipientEmail: data.settings.recipientEmail || '',
            alertDaysBefore: data.settings.alertDaysBefore ?? 1,
          });
        }
      })
      .catch(() => setBirthdayAlerts(null))
      .finally(() => setBirthdayAlertsLoading(false));
  }, [activeTab]);

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
      const now = new Date();
      const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const firstDayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`;

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
    loadCatalogProducts();
    loadMenuStock();
    loadMenuDiscounts();
    loadMenuPrices();
    loadChallengeData();
    checkHistoricalSale();
    loadCustomerProfiles();
    loadSalsaPromos();
    loadCaja();
    // Auto-refresh cada 10 segundos
    const interval = setInterval(() => {
      loadOrders();
      loadProducts();
      loadInventory();
      loadDeductions();
      loadPromotions();
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
          // announcedDeliveredRef es permanente: si ya fue anunciado, NUNCA vuelve a disparar
          if (announcedDeliveredRef.current.has(order.id)) return false;
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
          // Registrar PERMANENTEMENTE para que nunca vuelva a disparar (race condition + refresh)
          newlyDelivered.forEach((o: Order) => {
            announcedDeliveredRef.current.add(o.id);
            previousOrderStatusRef.current.set(o.id, 'delivered');
          });
          console.log(`🔊 [ADMIN] Llamando a playDeliveryConfirmSound()...`);
          playDeliveryConfirmSound();
          // Mostrar toast con el primer pedido entregado detectado
          const firstDelivered = newlyDelivered[0];
          setDeliveryToast({ orderId: firstDelivered.id, customerName: firstDelivered.name || 'Cliente' });
          setTimeout(() => setDeliveryToast(null), 6000);
        }
      } else {
        // Primera carga: pre-registrar todos los ya-entregados para que NUNCA disparen notificación
        data.forEach((order: Order) => {
          if (order.status === 'delivered') {
            announcedDeliveredRef.current.add(order.id);
          }
        });
        console.log("📋 [ADMIN] Primera carga de pedidos (no reproducir sonido)");
      }

      // Actualizar refs con los datos actuales
      previousOrderIdsRef.current = new Set(data.map((o: Order) => o.id));
      previousOrderStatusRef.current = new Map(data.map((o: Order) => [o.id, o.status]));
      console.log(`💾 [ADMIN] Refs actualizados - IDs: ${previousOrderIdsRef.current.size}, Status: ${previousOrderStatusRef.current.size}`);

      const unique = data.filter((o: Order, i: number, arr: Order[]) => arr.findIndex((x: Order) => x.id === o.id) === i);
      setOrders(unique);
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

  const loadChallengeData = async () => {
    try {
      const res = await fetch("/api/challenge");
      const data = await res.json();
      setChallengeData(data);
      setChallengeSalesInput(String(data.salesAmount));
    } catch (error) {
      console.error("Error al cargar desafío:", error);
    }
  };

  const saveChallengeData = async (updates: Partial<typeof challengeData>) => {
    setChallengeSaving(true);
    try {
      const res = await fetch("/api/challenge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const result = await res.json();
      if (result.success) setChallengeData(result.data);
    } catch (error) {
      console.error("Error al guardar desafío:", error);
    } finally {
      setChallengeSaving(false);
    }
  };

  const loadMenuDiscounts = async () => {
    try {
      const res = await fetch("/api/menu-discounts");
      const data = await res.json();
      setMenuDiscounts(data);
      const inputs: Record<string, string> = {};
      Object.entries(data).forEach(([id, price]) => { inputs[id] = String(price); });
      setDiscountInputs(inputs);
    } catch (error) {
      console.error("Error al cargar descuentos:", error);
    }
  };

  const loadMenuPrices = async () => {
    try {
      const res = await fetch("/api/menu-prices");
      const data = await res.json();
      setMenuPrices(data);
      const inputs: Record<string, string> = {};
      Object.entries(data).forEach(([id, price]) => { inputs[id] = String(price); });
      setPriceInputs(inputs);
    } catch (error) {
      console.error("Error al cargar precios:", error);
    }
  };

  const savePrice = async (productId: string, defaultPrice: number) => {
    const inputVal = priceInputs[productId] || '';
    const price = parseFloat(inputVal);
    const validPrice = !isNaN(price) && price > 0 ? price : 0;
    setPriceSaving(productId);
    try {
      await fetch("/api/menu-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, price: validPrice }),
      });
      setMenuPrices(prev => {
        const next = { ...prev };
        if (validPrice <= 0) { delete next[productId]; } else { next[productId] = validPrice; }
        return next;
      });
      if (validPrice <= 0) setPriceInputs(prev => { const n = { ...prev }; delete n[productId]; return n; });
    } catch (error) {
      console.error("Error al guardar precio:", error);
    } finally {
      setPriceSaving(null);
    }
  };

  const saveDiscount = async (productId: string, originalPrice: number) => {
    const inputVal = discountInputs[productId] || '';
    const price = parseFloat(inputVal);
    const validPrice = !isNaN(price) && price > 0 && price < originalPrice ? price : 0;
    setDiscountSaving(productId);
    try {
      await fetch("/api/menu-discounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, price: validPrice }),
      });
      setMenuDiscounts(prev => {
        const next = { ...prev };
        if (validPrice <= 0) { delete next[productId]; } else { next[productId] = validPrice; }
        return next;
      });
      if (validPrice <= 0) {
        setDiscountInputs(prev => { const n = { ...prev }; delete n[productId]; return n; });
      }
    } catch (error) {
      console.error("Error al guardar descuento:", error);
    } finally {
      setDiscountSaving(null);
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

  const loadCaja = async () => {
    try {
      const response = await fetch("/api/caja");
      const data = await response.json();
      setCajaData(data);
    } catch (error) {
      console.error("Error al cargar caja:", error);
    }
  };

  const saveCajaSnapshot = async () => {
    const balance = parseFloat(cajaEditBalance);
    if (isNaN(balance) || !cajaEditDate) return;
    try {
      await fetch("/api/caja", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotBalance: balance, snapshotDate: cajaEditDate }),
      });
      setCajaEditMode(false);
      loadCaja();
    } catch (error) {
      console.error("Error al guardar caja:", error);
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


  const loadCustomerProfiles = async () => {
    try {
      const res = await fetch("/api/customer-profiles");
      const data = await res.json();
      setCustomerProfiles(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadSalsaPromos = async () => {
    try {
      const res = await fetch('/api/salsa-promos');
      const data = await res.json();
      setSalsaPromos(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleSavePromo = async () => {
    setPromoSaving(true);
    try {
      if (editingPromo) {
        await fetch(`/api/salsa-promos?id=${editingPromo.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promoForm),
        });
      } else {
        await fetch('/api/salsa-promos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promoForm),
        });
      }
      await loadSalsaPromos();
      setShowSalsaPromoModal(false);
      setEditingPromo(null);
    } finally { setPromoSaving(false); }
  };

  const handleDeletePromo = async (id: string) => {
    await fetch(`/api/salsa-promos?id=${id}`, { method: 'DELETE' });
    loadSalsaPromos();
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

      // Si el nuevo estado es "delivered" o "cancelled", quitar borde overtime
      if (newStatus === "delivered" || newStatus === "cancelled") {
        setOvertimeOrderIds(prev => { const next = new Set(prev); next.delete(orderId); return next; });
      }

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

  // Función para marcar/desmarcar una orden como canje
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

  // Función para aplicar filtro de fechas en la pestaña "Gestión de Pedidos"
  const applyOrdersDateFilter = () => {
    if (ordersDateFrom && ordersDateTo) {
      setIsOrdersDateFiltered(true);
      setShowOrdersDateModal(false);
    }
  };

  const clearOrdersDateFilter = () => {
    setOrdersDateFrom("");
    setOrdersDateTo("");
    setIsOrdersDateFiltered(false);
    setShowOrdersDateModal(false);
  };

  // Función para aplicar filtro de fechas en la pestaña "Analytics & CRM"
  const applyAnalyticsDateFilter = () => {
    if (analyticsDateFrom && analyticsDateTo) {
      setIsAnalyticsDateFiltered(true);
    }
  };

  const clearAnalyticsDateFilter = () => {
    setAnalyticsDateFrom("");
    setAnalyticsDateTo("");
    setIsAnalyticsDateFiltered(false);
  };

  // Verificar si ya existe la venta histórica
  const checkHistoricalSale = async () => {
    try {
      const response = await fetch("/api/historical-sale");
      const data = await response.json();
      setHistoricalSaleRegistered(data.exists);
    } catch (error) {
      console.error("Error al verificar venta histórica:", error);
    }
  };

  // Registrar venta histórica del 13 de febrero
  const registerHistoricalSale = async () => {
    try {
      const response = await fetch("/api/historical-sale", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        alert("✅ Venta histórica del 13 de febrero registrada exitosamente");
        setHistoricalSaleRegistered(true);
        setShowHistoricalSaleModal(false);
        loadOrders(); // Recargar pedidos
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error al registrar venta histórica:", error);
      alert("❌ Error al registrar la venta histórica");
    }
  };

  // Exportar todos los pedidos a CSV (formato tabla Excel mejorado)
  const exportOrdersToCSV = () => {
    const allOrders = orders;
    if (allOrders.length === 0) return;

    // Ordenar por fecha (más recientes primero)
    const sortedOrders = [...allOrders].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const headers = [
      "N°",
      "ID Pedido",
      "Fecha",
      "Hora",
      "Cliente",
      "Teléfono",
      "Dirección",
      "Productos",
      "Cantidad Items",
      "Subtotal",
      "Descuento Combo",
      "Descuento Cupón",
      "Costo Delivery",
      "TOTAL",
      "Zona",
      "Método Pago",
      "Estado",
      "Cupón Usado",
      "Canje",
      "Nota Canje"
    ];

    const rows = sortedOrders.map((order: any, index: number) => {
      const orderDate = new Date(order.createdAt);
      const fecha = orderDate.toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora = orderDate.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' });

      // Productos en lista vertical (salto de línea)
      const productos = (order.cart || [])
        .map((item: any) => `${item.name} x${item.quantity}`)
        .join('\n');

      const cantidadItems = (order.cart || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

      // Calcular subtotal (total - delivery + descuentos)
      const subtotal = (order.totalPrice || 0) - (order.deliveryCost || 0) + (order.comboDiscount || 0) + (order.couponDiscount || 0);

      // Estado traducido
      const estadoMap: Record<string, string> = {
        'pending': 'Pendiente',
        'in-progress': 'En Preparación',
        'ready': 'Listo',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado',
        'Entregado': 'Entregado'
      };
      const estadoTraducido = estadoMap[order.status] || order.status || '';

      return [
        index + 1, // Número correlativo
        order.id,
        fecha,
        hora,
        order.name,
        order.phone,
        order.address,
        productos,
        cantidadItems,
        subtotal.toFixed(2),
        (order.comboDiscount || 0).toFixed(2),
        (order.couponDiscount || 0).toFixed(2),
        (order.deliveryCost || 0).toFixed(2),
        (order.totalPrice || 0).toFixed(2),
        order.deliveryOption === 'centro' ? 'Chancay centro' : order.deliveryOption === 'alrededores' ? 'Chancay alrededores' : 'Recojo en tienda',
        order.paymentMethod || '',
        estadoTraducido,
        order.couponCode || 'Sin cupón',
        order.isCanje ? 'SÍ' : 'NO',
        order.canjeNote || '',
      ];
    });

    // Usar TABULADORES en lugar de comas para que Excel lo abra correctamente
    const tsvContent = [headers, ...rows]
      .map(row => row.map((cell: any) => String(cell).replace(/\t/g, ' ')).join('\t'))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    link.href = url;
    link.download = `pedidos-santo-dilema-${now}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Pedidos efectivos: reales + mock si está activado
  const effectiveOrders = showMockData ? [...MOCK_ORDERS, ...orders] : orders;

  // Filtrar pedidos según el filtro de fecha (pestaña "Gestión de Pedidos")
  let dateFilteredOrders = effectiveOrders;

  if (isOrdersDateFiltered && ordersDateFrom && ordersDateTo) {
    // Filtro por rango de fechas personalizado
    dateFilteredOrders = effectiveOrders.filter((order) => {
      const orderDateStr = new Date(order.createdAt).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      return orderDateStr >= ordersDateFrom && orderDateStr <= ordersDateTo;
    });
  } else {
    // Por defecto, solo pedidos de hoy (mock siempre pasan como son de hoy)
    dateFilteredOrders = effectiveOrders.filter((order) => isSameDayPeru(order.createdAt));
  }

  // Para estados activos usamos todos los pedidos (igual que los carteles).
  // Para "all" y "delivered" usamos solo los de hoy/rango seleccionado.
  const activeStatuses = new Set(['pending', 'pendiente-verificacion', 'confirmed', 'en-camino', 'programado']);
  const gridBase = (filter !== 'all' && filter !== 'delivered' && activeStatuses.has(filter))
    ? effectiveOrders
    : dateFilteredOrders;

  // Filtrar pedidos por estado y búsqueda
  const filteredOrders = gridBase.filter((order) => {
    // Filtro por estado: "pending" engloba también pendiente-verificacion
    const statusMatch =
      filter === "all" ||
      order.status === filter ||
      (filter === "pending" && order.status === "pendiente-verificacion");

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
    programado: "bg-indigo-500/20 text-indigo-300 border-indigo-500",
  };

  const statusLabels = {
    pending: "Pendiente",
    "pendiente-verificacion": "Por Verificar",
    confirmed: "Confirmado",
    "en-camino": "En Camino",
    delivered: "Entregado",
    cancelled: "Cancelado",
    programado: "Programado",
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
      await fetch(`/api/products?id=${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
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
          category: "operativos",
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

  const toggleLiquidado = async (purchaseId: string, currentValue: boolean) => {
    try {
      await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: purchaseId, liquidado: !currentValue }),
      });
      loadInventory();
    } catch (error) {
      console.error('Error al actualizar estado de liquidación:', error);
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

  // Agrupar pedidos por cliente (DNI) - con filtro de fechas (usa filtro de Analytics)
  const getCustomersData = () => {
    const customersMap = new Map();

    // Usar pedidos filtrados por fecha
    const ordersToProcess = isAnalyticsDateFiltered && analyticsDateFrom && analyticsDateTo
      ? orders.filter((order: any) => {
          const orderDate = getPeruDate(order.createdAt);
          // Crear fechas en zona horaria de Perú (UTC-5)
          const fromDate = new Date(analyticsDateFrom + "T00:00:00-05:00");
          const toDate = new Date(analyticsDateTo + "T23:59:59-05:00");
          return orderDate >= fromDate && orderDate <= toDate;
        })
      : orders;

    ordersToProcess.forEach((order: any) => {
      const phone = order.phone;
      if (!phone) return;

      // Solo contabilizar pedidos entregados
      const isDelivered =
        order.status === "delivered" ||
        order.status === "Entregado" ||
        order.status?.toLowerCase() === "entregado";

      if (!isDelivered) {
        // No procesar pedidos que no están entregados
        return;
      }

      if (!customersMap.has(phone)) {
        customersMap.set(phone, {
          phone: phone,
          name: order.name,
          address: order.address,
          orders: [],
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt,
          addressSet: new Set<string>(),
          addressList: [] as string[],
        });
      }

      const customer = customersMap.get(phone);
      customer.orders.push(order);
      customer.totalOrders += 1;
      customer.totalSpent += order.totalPrice || 0;

      // Acumular historial de direcciones únicas
      if (order.address && order.address.trim()) {
        const normalizedAddr = order.address.trim();
        if (!customer.addressSet.has(normalizedAddr)) {
          customer.addressSet.add(normalizedAddr);
          customer.addressList.push(normalizedAddr);
        }
      }

      // Actualizar última orden si es más reciente
      if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt;
        customer.name = order.name;
        customer.address = order.address;
      }
    });

    const base = Array.from(customersMap.values()).sort((a, b) => b.totalOrders - a.totalOrders);
    return base.map((c: any) => {
      const profile = customerProfiles.find((p: any) => p.phone === c.phone);
      return {
        ...c,
        avgTicket: c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0,
        addressHistory: c.addressList || [],
        birthday: profile?.birthday,
        tags: profile?.tags || [],
        notes: profile?.notes,
        name: profile?.nameOverride || c.name,
        address: profile?.addressOverride || c.address,
      };
    });
  };

  const allCustomers = activeTab === "customers" || activeTab === "analytics" ? getCustomersData() : [];

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

      inactive30: allCustomers.filter((c: any) => {
        const last = getPeruDate(c.lastOrderDate);
        return last < new Date(now.getTime() - 30*24*60*60*1000) && last >= new Date(now.getTime() - 60*24*60*60*1000);
      }),
      inactive60: allCustomers.filter((c: any) => {
        const last = getPeruDate(c.lastOrderDate);
        return last < new Date(now.getTime() - 60*24*60*60*1000) && last >= new Date(now.getTime() - 90*24*60*60*1000);
      }),
      inactive90: allCustomers.filter((c: any) => {
        const last = getPeruDate(c.lastOrderDate);
        return last < new Date(now.getTime() - 90*24*60*60*1000);
      }),

    };
  };

  const customerSegments = getCustomerSegments();
  const segmentCustomers = customerSegment === 'birthday'
    ? allCustomers.filter((c: any) => !!c.birthday)
    : customerSegments[customerSegment as keyof typeof customerSegments] || allCustomers;

  // CRM Dashboard
  const getCrmDashboard = () => {
    const now = getPeruDate();
    const todayMD = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const total = allCustomers.length;
    const repeaters = allCustomers.filter((c: any) => c.totalOrders >= 2).length;
    const avgTicket = total > 0 ? allCustomers.reduce((s: number, c: any) => s + (c.avgTicket||0), 0) / total : 0;
    const avgFrequency = total > 0 ? (allCustomers.reduce((s: number, c: any) => s + c.totalOrders, 0) / total).toFixed(1) : '0';
    return {
      total, repeaters,
      repurchaseRate: total > 0 ? Math.round((repeaters/total)*100) : 0,
      avgTicket, avgFrequency,
      birthdaysToday: allCustomers.filter((c: any) => c.birthday === todayMD),
    };
  };
  const crmDashboard = activeTab === 'customers' ? getCrmDashboard() : null;

  // Calcular badge de cumpleaños por cliente
  const getBirthdayBadge = (birthday: string | undefined): null | 'today' | 'tomorrow' | 'week' | 'month' => {
    if (!birthday) return null;
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    const todayMD = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (birthday === todayMD) return 'today';
    const tom = new Date(now); tom.setDate(tom.getDate() + 1);
    const tomMD = `${String(tom.getMonth()+1).padStart(2,'0')}-${String(tom.getDate()).padStart(2,'0')}`;
    if (birthday === tomMD) return 'tomorrow';
    for (let i = 2; i <= 7; i++) {
      const d = new Date(now); d.setDate(d.getDate() + i);
      if (birthday === `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`) return 'week';
    }
    if (birthday.startsWith(String(now.getMonth()+1).padStart(2,'0'))) return 'month';
    return null;
  };

  const getCampaignTemplate = (segment: string, customer: any): string => {
    const first = (customer?.name || 'amigo').split(' ')[0];
    const msgs: Record<string, string> = {
      vip:        `Hola ${first}! 👑 Eres uno de nuestros clientes más especiales en Santo Dilema.\nTenemos algo exclusivo para ti esta semana. Escríbenos y te contamos 🌶️\nwww.santodilema.com`,
      new:        `Hola ${first}! Gracias por tu primer pedido en Santo Dilema 🔥\nEsperamos que hayas disfrutado. Vuelve cuando quieras 😊\nwww.santodilema.com`,
      recurrent:  `Hola ${first}! 🙌 Eres de los que más nos visitan y lo apreciamos.\nTenemos novedades en carta — pide cuando quieras en www.santodilema.com`,
      inactive30: `Hola ${first}! Hace un mes que no te vemos por Santo Dilema 😢\nTe extrañamos. Nuestras alitas siguen igual de buenas 🔥\nwww.santodilema.com`,
      inactive60: `Hola ${first}! Han pasado 2 meses desde tu último pedido en Santo Dilema.\nTenemos novedades en carta 🌶️\nwww.santodilema.com`,
      inactive90: `Hola ${first}! Te echamos de menos en Santo Dilema 🥺\nHace 3 meses que no sabemos de ti. Seguimos con el mismo sabor 🔥\nwww.santodilema.com`,
      birthday:   `Hola ${first}! Hoy es tu día especial 🎉\nDesde Santo Dilema te deseamos un feliz cumpleaños!\nEscríbenos para reclamar tu regalo de cumpleaños 🎁\n🌶️ Santo Dilema`,
    };
    return msgs[segment] || msgs['inactive30'];
  };
  const buildWhatsApp = (phone: string, msg: string) =>
    `https://wa.me/51${phone}?text=${encodeURIComponent(msg)}`;

  const handleCrmSave = async () => {
    setCrmSaving(true);
    try {
      const parts = (crmForm.birthday || '').split('/');
      const birthdayForApi = parts.length === 2 && parts[0].length === 2 && parts[1].length === 2
        ? `${parts[1]}-${parts[0]}`
        : undefined;
      await fetch('/api/customer-profiles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: crmEditPhone, birthday: birthdayForApi, tags: crmForm.tags, notes: crmForm.notes }),
      });
      await loadCustomerProfiles();
      // Actualizar selectedCustomer para que el modal refleje los datos recién guardados
      if (selectedCustomer?.phone === crmEditPhone) {
        setSelectedCustomer((prev: any) => ({
          ...prev,
          birthday: birthdayForApi,
          tags: crmForm.tags,
          notes: crmForm.notes,
        }));
      }
      setShowCrmModal(false);
    } finally { setCrmSaving(false); }
  };

  // Filtrar clientes por búsqueda en tiempo real
  const customers = segmentCustomers.filter((customer: any) => {
    if (customerSearchTerm === "") return true;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(customerSearchTerm) ||
      customer.address?.toLowerCase().includes(searchLower)
    );
  });

  // Analytics - con filtro de fechas (usa filtro de Analytics)
  const getAnalytics = () => {
    const now = getPeruDate();

    // Filtrar solo pedidos entregados
    let deliveredOrders = orders.filter((order: any) =>
      order.status === "delivered" ||
      order.status === "Entregado" ||
      order.status?.toLowerCase() === "entregado"
    );

    // Si hay filtro de fechas aplicado, filtrar por ese rango
    if (isAnalyticsDateFiltered && analyticsDateFrom && analyticsDateTo) {
      // Crear fechas en zona horaria de Perú (UTC-5)
      const filterStart = new Date(analyticsDateFrom + "T00:00:00-05:00");
      const filterEnd = new Date(analyticsDateTo + "T23:59:59-05:00");

      deliveredOrders = deliveredOrders.filter((order: any) => {
        const orderDate = getPeruDate(order.createdAt);
        return orderDate >= filterStart && orderDate <= filterEnd;
      });
    }

    // Si hay filtro activo, usar directamente los pedidos filtrados para TODOS los cálculos
    let todayOrders, dailySales, currentMonthOrders, monthlySales;
    let lastMonthOrders, lastMonthSales, progressPercentage, lastMonthAverageTicket, totalRevenue;

    // Calcular métricas de canje (sobre TODOS los pedidos, sin filtro de fechas)
    const allCanjeOrders = orders.filter((o: any) => o.isCanje);
    const todayCanjeOrders = allCanjeOrders.filter((o: any) => isSameDayPeru(o.createdAt));
    const nowForCanje = getPeruDate();
    const firstDayCurrentMonthForCanje = new Date(nowForCanje.getFullYear(), nowForCanje.getMonth(), 1);
    const lastDayCurrentMonthForCanje = new Date(nowForCanje.getFullYear(), nowForCanje.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthCanjeOrders = allCanjeOrders.filter((o: any) => {
      const d = getPeruDate(o.createdAt);
      return d >= firstDayCurrentMonthForCanje && d <= lastDayCurrentMonthForCanje;
    });
    const canjeStats = {
      dailyCanjeCount: todayCanjeOrders.length,
      dailyCanjeValue: todayCanjeOrders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0),
      monthlyCanjeCount: monthCanjeOrders.length,
      monthlyCanjeValue: monthCanjeOrders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0),
      totalCanjeCount: allCanjeOrders.length,
      totalCanjeValue: allCanjeOrders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0),
    };

    if (isAnalyticsDateFiltered && analyticsDateFrom && analyticsDateTo) {
      // MODO FILTRADO: usar deliveredOrders (ya filtrados) para todos los cálculos
      // Excluir canjes de las ventas reales
      const realDelivered = deliveredOrders.filter((o: any) => !o.isCanje);
      todayOrders = realDelivered;
      dailySales = realDelivered.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
      currentMonthOrders = realDelivered;
      monthlySales = dailySales;
      lastMonthOrders = [];
      lastMonthSales = 0;
      progressPercentage = 0;
      lastMonthAverageTicket = 0;
      totalRevenue = dailySales;
    } else {
      // MODO NORMAL: usar rangos de fechas predeterminados
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Excluir canjes de ventas reales
      const realDeliveredOrders = deliveredOrders.filter((o: any) => !o.isCanje);

      todayOrders = realDeliveredOrders.filter((order: any) => {
        const orderDate = getPeruDate(order.createdAt);
        return orderDate >= startOfToday && orderDate <= endOfToday;
      });
      dailySales = todayOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

      currentMonthOrders = realDeliveredOrders.filter((order: any) => {
        const orderDate = getPeruDate(order.createdAt);
        return orderDate >= firstDayOfCurrentMonth && orderDate <= lastDayOfCurrentMonth;
      });
      monthlySales = currentMonthOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

      lastMonthOrders = realDeliveredOrders.filter((order: any) => {
        const orderDate = getPeruDate(order.createdAt);
        return orderDate >= firstDayOfLastMonth && orderDate <= lastDayOfLastMonth;
      });
      lastMonthSales = lastMonthOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

      progressPercentage = lastMonthSales > 0 ? (monthlySales / lastMonthSales) * 100 : 0;
      lastMonthAverageTicket = lastMonthOrders.length > 0 ? lastMonthSales / lastMonthOrders.length : 0;
      totalRevenue = realDeliveredOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
    }

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

    // Órdenes del día (solo entregadas) - respeta el filtro activo
    const todayDeliveredOrders = isAnalyticsDateFiltered && analyticsDateFrom && analyticsDateTo
      ? deliveredOrders
      : todayOrders;

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
      beveragesSoldToday,
      ...canjeStats
    };
  };

  const analytics = activeTab === "analytics" ? getAnalytics() : {
    dailySales: 0,
    monthlySales: 0,
    progressPercentage: 0,
    lastMonthAverageTicket: 0,
    todayAverageTicket: 0,
    totalRevenue: 0,
    todayDeliveredOrdersCount: 0,
    currentMonthOrdersCount: 0,
    lastMonthOrdersCount: 0,
    ordersProgressPercentage: 0,
    lastMonthSales: 0,
    topProducts: [],
    leastSoldProducts: [],
    allProducts: [],
    productsArray: [],
    currentMonthProductsArray: [],
    lastMonthProductsWithComparison: [],
    topDaysLastMonth: [],
    topProductLastMonth: null,
    leastProductLastMonth: null,
    frequentCustomers: [],
    inactiveCustomers: [],
    allComplementsList: [],
    paymentMethodsArray: [],
    mostUsedPaymentMethod: { method: 'Sin datos', count: 0 },
    peakHour: "",
    peakHourCount: 0,
    mostSoldComplement: null,
    allComplements: [],
    complementsByCategory: {},
    conversionRate: 0,
    menusSoldToday: [],
    beveragesSoldToday: [],
    dailyCanjeCount: 0,
    dailyCanjeValue: 0,
    monthlyCanjeCount: 0,
    monthlyCanjeValue: 0,
    totalCanjeCount: 0,
    totalCanjeValue: 0,
  };

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

  const chartData = activeTab === "analytics" ? getChartData() : [];

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (el useEffect redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Toast de pedido entregado */}
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

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200 flex flex-col z-40">
        <div className="flex items-center justify-center px-4 py-5 border-b border-gray-100">
          <Image src="/logoprincipal.png" alt="Santo Dilema" width={140} height={140} className="" />
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "orders" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            <span>📦</span>
            <span>Pedidos</span>
            {(() => {
              const n = orders.filter((o: any) => o.status === "pending" || o.status === "pendiente-verificacion").length;
              return n > 0 ? <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{n}</span> : null;
            })()}
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "analytics" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            <span>📊</span>
            <span>Inicio</span>
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "customers" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            <span>👥</span>
            <span>Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "financial" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            <span>💰</span>
            <span>Finanzas</span>
          </button>
          <button
            onClick={() => setActiveTab("carta")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "carta" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            <span>🍽️</span>
            <span>Carta</span>
          </button>
        </nav>
        <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <span>←</span>
            <span>Ver sitio</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
          >
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 min-h-screen overflow-y-auto">

      {activeTab === "orders" ? (
        <>
          {/* Carteles de estado con pedidos */}
          <section className="px-6 py-4">
            {(() => {
              // Carteles activos usan TODOS los pedidos (no solo hoy)
              // para que nunca queden vacíos si hay pedidos sin procesar de días anteriores
              const lanes = [
                { key: "all" as const,       label: isOrdersDateFiltered ? "Total Filtrado" : "Total Hoy", icon: "📋", accent: "border-gray-400",    stripe: "bg-gray-400",    dotColor: "bg-gray-400",    headerText: "text-gray-500",   countText: "text-gray-900",   orders: dateFilteredOrders },
                { key: "pending" as const,    label: "Pendientes",     icon: "⏳", accent: "border-amber-400",   stripe: "bg-amber-400",   dotColor: "bg-amber-400",   headerText: "text-amber-600",  countText: "text-amber-600",  orders: effectiveOrders.filter((o: any) => o.status === "pending" || o.status === "pendiente-verificacion") },
                { key: "confirmed" as const,  label: "Confirmados",    icon: "✅", accent: "border-sky-400",     stripe: "bg-sky-400",     dotColor: "bg-sky-400",     headerText: "text-sky-600",    countText: "text-sky-600",    orders: effectiveOrders.filter((o: any) => o.status === "confirmed") },
                { key: "en-camino" as const,  label: "En Camino",      icon: "🛵", accent: "border-blue-400",    stripe: "bg-blue-500",    dotColor: "bg-blue-500",    headerText: "text-blue-600",   countText: "text-blue-600",   orders: effectiveOrders.filter((o: any) => o.status === "en-camino") },
                { key: "delivered" as const,  label: "Entregados Hoy", icon: "📦", accent: "border-emerald-400", stripe: "bg-emerald-400", dotColor: "bg-emerald-400", headerText: "text-emerald-600",countText: "text-emerald-600",orders: dateFilteredOrders.filter((o: any) => o.status === "delivered") },
                { key: "programado" as const, label: "Programados",    icon: "🗓", accent: "border-indigo-400",  stripe: "bg-indigo-400",  dotColor: "bg-indigo-400",  headerText: "text-indigo-600", countText: "text-indigo-600", orders: effectiveOrders.filter((o: any) => o.status === "programado") },
              ];
              return (
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                  {lanes.map((lane) => {
                    const isActive = filter === lane.key;
                    return (
                      <button
                        key={lane.key}
                        onClick={() => setFilter(lane.key)}
                        className={`bg-white rounded-2xl border-2 flex flex-col overflow-hidden text-left transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                          isActive
                            ? `${lane.accent} shadow-lg`
                            : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                        }`}
                      >
                        {/* Franja de color */}
                        <div className={`h-1.5 w-full flex-shrink-0 ${lane.stripe}`} />

                        {/* Contenido limpio */}
                        <div className="px-4 py-3 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xl leading-none">{lane.icon}</span>
                            {isActive && <span className={`w-2 h-2 rounded-full ${lane.dotColor}`} />}
                          </div>
                          <span className={`text-3xl font-black leading-none ${lane.countText}`}>
                            {lane.orders.length}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${isActive ? lane.headerText : "text-gray-400"}`}>
                            {lane.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </section>

      {/* Barra de herramientas */}
      <section className="px-6 pb-6">
        <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-end">
          <div className="flex gap-2 justify-end">
            {/* Toggle datos de prueba */}
            <button
              onClick={() => setShowMockData(prev => !prev)}
              className={`px-3 py-3 border rounded-lg text-xs font-bold transition-all ${
                showMockData
                  ? "bg-violet-50 border-violet-300 text-violet-600 hover:bg-violet-100"
                  : "bg-white border-gray-200 text-gray-400 hover:border-gray-400"
              }`}
              title={showMockData ? "Ocultar pedidos de prueba" : "Mostrar pedidos de prueba"}
            >
              {showMockData ? "🧪 Prueba ON" : "🧪 Prueba OFF"}
            </button>

            {/* Botón exportar CSV */}
            <button
              onClick={exportOrdersToCSV}
              className="px-3 py-3 bg-white border border-gray-200 rounded-lg text-green-600 hover:text-green-700 hover:border-green-300 transition-all"
              title="Exportar TODOS los pedidos a CSV"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Botón de calendario */}
            <button
              onClick={() => setShowOrdersDateModal(true)}
              className="px-3 py-3 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-all"
              title="Filtrar por fechas"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Buscador en tiempo real */}
          <div className="relative flex-1 md:flex-initial">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pedido, cliente, dirección, menú..."
              className="w-full md:w-80 px-4 py-3 pl-10 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all text-sm"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Modal de filtro de fechas - Gestión de Pedidos */}
      {showOrdersDateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowOrdersDateModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-gray-900 mb-4">Filtrar por Fechas</h3>

            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm font-semibold block mb-2">Desde:</label>
                <input
                  type="date"
                  value={ordersDateFrom}
                  onChange={(e) => setOrdersDateFrom(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-400 transition-all [color-scheme:light]"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm font-semibold block mb-2">Hasta:</label>
                <input
                  type="date"
                  value={ordersDateTo}
                  onChange={(e) => setOrdersDateTo(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-gray-400 transition-all [color-scheme:light]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={applyOrdersDateFilter}
                  disabled={!ordersDateFrom || !ordersDateTo}
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  Aplicar Filtro
                </button>
                {isOrdersDateFiltered && (
                  <button
                    onClick={clearOrdersDateFilter}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setShowOrdersDateModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all"
                >
                  Cerrar
                </button>
              </div>

              {isOrdersDateFiltered && ordersDateFrom && ordersDateTo && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">
                    📊 Filtrando desde <span className="text-gray-900 font-bold">{new Date(ordersDateFrom + 'T12:00:00').toLocaleDateString('es-PE')}</span> hasta <span className="text-gray-900 font-bold">{new Date(ordersDateTo + 'T12:00:00').toLocaleDateString('es-PE')}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <section className="px-6 pb-12">
        {/* Banner datos de prueba */}
        {showMockData && (
          <div className="mb-4 flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
            <span className="text-violet-500 text-base">🧪</span>
            <p className="text-xs font-semibold text-violet-700 flex-1">
              Mostrando <strong>{MOCK_ORDERS.length} pedidos de prueba</strong> para validar el diseño.
              Los pedidos reales aparecerán cuando lleguen.
            </p>
            <button
              onClick={() => setShowMockData(false)}
              className="text-violet-400 hover:text-violet-600 text-xs font-bold transition-colors"
            >
              Ocultar
            </button>
          </div>
        )}
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
              const isOvertime = overtimeOrderIds.has(order.id) && order.status !== 'delivered' && order.status !== 'cancelled';
              const cardRing = isOvertime
                ? 'ring-2 ring-red-300 shadow-xl shadow-red-100 overtime-pulse'
                : order.status === 'pending'                ? 'ring-1 ring-amber-200 shadow-md shadow-amber-50'
                : order.status === 'pendiente-verificacion' ? 'ring-1 ring-purple-200 shadow-md shadow-purple-50'
                : order.status === 'confirmed'              ? 'ring-1 ring-sky-200 shadow-md shadow-sky-50'
                : order.status === 'en-camino'              ? 'ring-2 ring-blue-300 shadow-lg shadow-blue-100'
                : order.status === 'delivered'              ? 'ring-1 ring-gray-200 shadow-sm opacity-60'
                : order.status === 'programado'             ? 'ring-1 ring-indigo-200 shadow-md shadow-indigo-50'
                : 'ring-1 ring-gray-200 shadow-sm opacity-50';
              const stripeColor = isOvertime ? 'bg-red-500'
                : order.status === 'pending'                ? 'bg-amber-400'
                : order.status === 'pendiente-verificacion' ? 'bg-purple-400'
                : order.status === 'confirmed'              ? 'bg-sky-400'
                : order.status === 'en-camino'              ? 'bg-blue-500'
                : order.status === 'delivered'              ? 'bg-emerald-400'
                : order.status === 'programado'             ? 'bg-indigo-400'
                : 'bg-gray-300';
              const DRINK_IDS = new Set(['agua-mineral','coca-cola','inka-cola','sprite','fanta']);
              const SIDE_IDS  = new Set(['papas-fritas','nachos','chifles']);
              const tacoNames: Record<string,string> = {'santo-crujiente':'Crunch Supreme','tex-dilema':'Tex Supreme','santo-bacon':'Bacon Deluxe'};
              const allItems: any[] = (order as any).completedOrders || [];
              const CAT: Record<string,{dot:string;bg:string;text:string;label:string}> = {
                fat:  {dot:'bg-orange-400', bg:'bg-orange-50',  text:'text-orange-700', label:'FAT'},
                fit:  {dot:'bg-green-400',  bg:'bg-green-50',   text:'text-green-700',  label:'FIT'},
                taco: {dot:'bg-yellow-400', bg:'bg-yellow-50',  text:'text-yellow-700', label:'TACO'},
              };
              return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 ${cardRing}`}
              >
                {/* ── FRANJA DE COLOR ── */}
                <div className={`h-1.5 w-full flex-shrink-0 ${stripeColor}`} />

                {/* ── CABECERA: ID · ESTADO · HORA · TIMER · ELIMINAR ── */}
                <div className="px-4 pt-3 pb-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-black text-gray-900 tracking-tight">{order.id}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                        {isOvertime && <span className="text-[9px] font-black text-red-500 uppercase animate-pulse">⚠ TARDE</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-gray-400 tabular-nums">
                          {new Date(order.createdAt).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-gray-200">·</span>
                        <TimeCounter
                          createdAt={order.createdAt}
                          orderId={order.id}
                          status={order.status}
                          audioCtx={audioContext}
                          onOvertime={() => setOvertimeOrderIds(prev => new Set(prev).add(order.id))}
                        />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`¿Eliminar pedido ${order.id}?`)) return;
                        await fetch(`/api/orders?id=${order.id}`, { method: 'DELETE' });
                        setOrders(prev => prev.filter(o => o.id !== order.id));
                      }}
                      className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all text-xs mt-0.5"
                    >✕</button>
                  </div>
                  {/* Pedido programado */}
                  {(order as any).scheduledTime && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1">
                      <span className="text-indigo-500 text-xs">🗓</span>
                      <span className="text-xs font-bold text-indigo-700">
                        {(() => {
                          const [hh, mm] = ((order as any).scheduledTime as string).split(':');
                          const h = parseInt(hh);
                          const schedDate = (order as any).scheduledDate as string | undefined;
                          let day = 'Hoy';
                          if (schedDate) {
                            const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
                            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                            if (schedDate !== todayStr) {
                              const d = new Date(schedDate + 'T12:00:00');
                              const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
                              day = `${days[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
                            }
                          }
                          return `${day} ${h > 12 ? h-12 : h}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── PRODUCTOS ── */}
                <div className="mx-4 mb-0">
                  <div className="h-px bg-gray-100" />
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pt-2.5 pb-1.5">Productos</p>
                </div>
                <div className="px-4 pb-3 flex-1 space-y-2.5">
                  {allItems.length > 0 ? (() => {
                    const seen = new Set<string>();
                    return allItems.map((item: any, idx: number) => {
                      // ── COMBO ──
                      if (item.comboGroupId) {
                        if (seen.has(item.comboGroupId)) return null;
                        seen.add(item.comboGroupId);
                        const grp = allItems.filter((i: any) => i.comboGroupId === item.comboGroupId);
                        const cp = item.comboPrice || 0;
                        const sv = +((item.comboOriginalTotal || cp) - cp).toFixed(2);
                        return (
                          <div key={`c-${item.comboGroupId}`} className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-2.5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">🔥</span>
                                <span className="text-xs font-black text-amber-800">{item.comboName || 'Combo'}</span>
                                {sv > 0 && <span className="text-[9px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">-S/{sv.toFixed(0)}</span>}
                              </div>
                              <span className="text-sm font-black text-amber-800">S/{cp.toFixed(2)}</span>
                            </div>
                            {grp.map((gi: any, gi_i: number) => {
                              const salsas_ = gi.salsas || [];
                              const comps = gi.complementIds || [];
                              const drinks = comps.filter((c: string) => DRINK_IDS.has(c));
                              const sides = comps.filter((c: string) => SIDE_IDS.has(c));
                              const extras = comps.filter((c: string) => !DRINK_IDS.has(c) && !SIDE_IDS.has(c));
                              return (
                                <div key={gi_i} className="mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{gi.quantity}</span>
                                    <span className="text-xs font-bold text-gray-800 flex-1">{gi.name}</span>
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-1 pl-7">
                                    {salsas_.map((sId: string, i: number) => (
                                      <span key={i} className="inline-flex items-center bg-red-50 border border-red-200 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                        🌶 {gi.productId === 'taco-duo' ? (tacoNames[sId] || sId) : (salsas.find((s: any) => s.id === sId)?.name || sId)}
                                      </span>
                                    ))}
                                    {drinks.map((c: string, i: number) => (
                                      <span key={i} className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                        🥤 {availableComplements[c]?.name || c}
                                      </span>
                                    ))}
                                    {sides.map((c: string, i: number) => (
                                      <span key={i} className="inline-flex items-center bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                        🍟 {availableComplements[c]?.name || c}
                                      </span>
                                    ))}
                                    {extras.length > 0 && (() => {
                                      const counts: Record<string, number> = {};
                                      extras.forEach((c: string) => { counts[c] = (counts[c] || 0) + 1; });
                                      return Object.entries(counts).map(([cId, n], i) => (
                                        <span key={i} className="inline-flex items-center bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                          + {n > 1 ? `${n}× ` : ''}{availableComplements[cId]?.name || cId}
                                        </span>
                                      ));
                                    })()}
                                    {comps.length === 0 && salsas_.length === 0 && gi.category === 'fat' && (
                                      <span className="text-[9px] text-gray-400 italic">sin salsa · sin bebida</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // ── PRODUCTO NORMAL ──
                      const qty = item.quantity || 0;
                      const cf = 1 - ((order as any).couponDiscount || 0) / 100;
                      const amt = (item.price || 0) * cf * qty;
                      const cat = item.category as string;
                      const cfg = CAT[cat] || { dot: 'bg-gray-300', bg: 'bg-gray-50', text: 'text-gray-600', label: '' };
                      const salsas_: string[] = item.salsas || [];
                      const comps: string[] = item.complementIds || [];
                      const drinks = comps.filter((c: string) => DRINK_IDS.has(c));
                      const sides = comps.filter((c: string) => SIDE_IDS.has(c));
                      const extras = comps.filter((c: string) => !DRINK_IDS.has(c) && !SIDE_IDS.has(c));
                      return (
                        <div key={idx} className={`rounded-xl p-2.5 ${cfg.bg} border border-gray-100`}>
                          <div className="flex items-start gap-2.5">
                            <div className={`w-6 h-6 rounded-full ${cfg.dot} text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5`}>{qty}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <span className="text-[13px] font-bold text-gray-900 leading-tight">{item.name}</span>
                                <span className={`text-[13px] font-black flex-shrink-0 ${cfg.text}`}>S/{amt.toFixed(2)}</span>
                              </div>
                              {cfg.label && <span className={`text-[9px] font-black uppercase tracking-wider ${cfg.text} opacity-60`}>{cfg.label}</span>}
                              {/* Tags de salsas / bebidas / acompañamientos */}
                              {(salsas_.length > 0 || drinks.length > 0 || sides.length > 0 || extras.length > 0) && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {salsas_.map((sId: string, i: number) => (
                                    <span key={i} className="inline-flex items-center bg-white border border-red-200 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                      🌶 {item.productId === 'taco-duo' ? (tacoNames[sId] || sId) : (salsas.find((s: any) => s.id === sId)?.name || sId)}
                                    </span>
                                  ))}
                                  {drinks.map((c: string, i: number) => (
                                    <span key={i} className="inline-flex items-center bg-white border border-blue-200 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                      🥤 {availableComplements[c]?.name || c}
                                    </span>
                                  ))}
                                  {sides.map((c: string, i: number) => (
                                    <span key={i} className="inline-flex items-center bg-white border border-yellow-200 text-yellow-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                      🍟 {availableComplements[c]?.name || c}
                                    </span>
                                  ))}
                                  {extras.length > 0 && (() => {
                                    const counts: Record<string, number> = {};
                                    extras.forEach((c: string) => { counts[c] = (counts[c] || 0) + 1; });
                                    return Object.entries(counts).map(([cId, n], i) => (
                                      <span key={i} className="inline-flex items-center bg-white border border-gray-200 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                        + {n > 1 ? `${n}× ` : ''}{availableComplements[cId]?.name || cId}
                                      </span>
                                    ));
                                  })()}
                                </div>
                              )}
                              {comps.length === 0 && salsas_.length === 0 && cat === 'fat' && (
                                <p className="text-[9px] text-gray-400 italic mt-1">sin salsa · sin bebida</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })() : order.cart && Array.isArray(order.cart) && order.cart.length > 0 ? (
                    order.cart.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{item.quantity || 1}</div>
                        <span className="flex-1 text-[13px] font-bold text-gray-900 truncate">{item.product?.name || item.name}</span>
                        <span className="text-[13px] font-black text-gray-700">S/{((item.product?.price || item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                    ))
                  ) : <p className="text-xs text-gray-400 italic">Sin productos</p>}
                </div>

                {/* ── NOTA DEL PEDIDO ── */}
                {order.notes && (
                  <div className="mx-4 mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs font-semibold text-amber-800 leading-snug">{order.notes}</p>
                  </div>
                )}

                {/* ── CLIENTE ── */}
                <div className="mx-4 mb-3">
                  <div className="h-px bg-gray-100 mb-2" />
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Cliente</p>
                  <div className="space-y-1.5">
                    <p className="text-sm font-black text-gray-900">{order.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">📱</span>
                      <span className="text-xs text-gray-600 font-mono">{order.phone}</span>
                    </div>
                    {(order as any).deliveryCost > 0 ? (
                      <div className="flex items-start gap-2">
                        <span className="text-xs">🛵</span>
                        <div>
                          <span className="text-xs font-bold text-sky-600">Delivery · +S/{((order as any).deliveryCost || 0).toFixed(2)}</span>
                          {order.address && order.address !== 'Recojo en tienda' && (
                            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{order.address}</p>
                          )}
                          {(order as any).deliveryCustomLocation && (
                            <p className="text-[10px] text-sky-400 italic leading-tight">{(order as any).deliveryCustomLocation}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🏪</span>
                        <span className="text-xs font-bold text-emerald-600">Recojo en tienda</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RASTRO DE TIEMPOS ── */}
                {(() => {
                  const steps = [
                    { label: 'Ingresó',   time: order.createdAt,   color: 'text-gray-400' },
                    { label: 'Confirmó',  time: order.confirmedAt, color: 'text-sky-500' },
                    { label: 'Salió',     time: order.enCaminoAt,  color: 'text-blue-500' },
                    { label: 'Entregado', time: order.deliveredAt, color: 'text-emerald-500' },
                  ];
                  const filled = steps.filter(s => s.time);
                  if (filled.length < 2) return null;
                  return (
                    <div className="mx-4 mb-3 bg-gray-50 rounded-xl px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
                      {filled.map((step, i) => {
                        const prev = filled[i - 1];
                        const elapsed = prev ? Math.round((new Date(step.time!).getTime() - new Date(prev.time!).getTime()) / 60000) : null;
                        return (
                          <div key={i} className="flex items-center gap-1">
                            <span className={`text-[10px] font-mono font-bold ${step.color}`}>
                              {new Date(step.time!).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[9px] ${step.color}`}>{step.label}</span>
                            {elapsed !== null && <span className="text-[9px] text-amber-400 font-bold">+{elapsed}m</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ── TOTAL + PAGO ── */}
                <div className="mx-4 mb-3">
                  <div className="h-px bg-gray-100 mb-2" />
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                        Total{(order as any).deliveryCost > 0 ? ' · incl. delivery' : ''}
                      </p>
                      <p className="text-2xl font-black text-gray-900 tabular-nums leading-none">
                        S/{(typeof order.totalPrice === 'number' ? order.totalPrice : 0).toFixed(2)}
                      </p>
                      {(order as any).couponDiscount > 0 && (
                        <p className="text-[9px] text-purple-500 font-semibold mt-0.5">cupón -{(order as any).couponDiscount}%</p>
                      )}
                      {(() => {
                        const items = (order as any).completedOrders;
                        if (!items) return null;
                        const seen2 = new Set<string>(); let s = 0;
                        items.forEach((it: any) => { if (it.comboGroupId && !seen2.has(it.comboGroupId)) { seen2.add(it.comboGroupId); s += (it.comboOriginalTotal || 0) - (it.comboPrice || 0); } });
                        return s > 0 ? <p className="text-[9px] text-amber-500 font-semibold mt-0.5">🔥 ahorro S/{s.toFixed(2)}</p> : null;
                      })()}
                    </div>
                    {/* ── PAGO ── */}
                    {(() => {
                      const pm = order.paymentMethod;
                      const isYapeAnticipado = pm === 'anticipado' || pm === 'yape' || pm === 'plin';
                      const isYapeEntrega    = pm === 'contraentrega-yape-plin';
                      const hasProof         = !!order.paymentProofPath;
                      const openVoucher = () => {
                        setSelectedVoucherPath(order.paymentProofPath || '');
                        setSelectedVoucherOrder(order);
                        setShowVoucherModal(true);
                      };

                      // Solo anticipado = pago adelantado → puede tener comprobante
                      if (isYapeAnticipado) {
                        return (
                          <div className="flex flex-col gap-1 min-w-[88px]">
                            <div className="rounded-xl px-3 py-2 text-center text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <p className="text-[10px]">✓ PAGADO</p>
                              <p className="text-[9px] font-medium opacity-70">Yape / Plin</p>
                            </div>
                            {hasProof ? (
                              <button
                                onClick={openVoucher}
                                className="rounded-xl px-2 py-1.5 text-center text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 transition-all flex items-center justify-center gap-1"
                              >
                                🟣 Ver comprobante
                              </button>
                            ) : (
                              <div className="rounded-xl px-2 py-1.5 text-center text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-300">
                                ⚠ Sin comprobante
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Yape/Plin al recibir
                      if (isYapeEntrega) {
                        return (
                          <div className="rounded-xl px-3 py-2 text-center text-xs font-black bg-amber-100 text-amber-700 border border-amber-200 min-w-[80px]">
                            <p>YAPE</p><p className="text-[9px] font-medium opacity-70">al recibir</p>
                          </div>
                        );
                      }

                      // Otros métodos de pago
                      return (
                        <div className={`rounded-xl px-3 py-2 text-center text-xs font-black min-w-[80px] ${
                          pm === 'tarjeta-mp'                    ? 'bg-blue-100    text-blue-700    border border-blue-200'   :
                          pm === 'contraentrega-efectivo-exacto' ? 'bg-orange-100  text-orange-700  border border-orange-200' :
                          pm === 'contraentrega-efectivo-cambio' ? 'bg-orange-100  text-orange-700  border border-orange-200' :
                          'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {pm === 'tarjeta-mp' ? (
                            <><p className="text-[10px]">✓ PAGADO</p><p className="text-[9px] font-medium opacity-70">Mercado Pago</p></>
                          ) : pm === 'contraentrega-efectivo-exacto' ? (
                            <><p>EFECTIVO</p><p className="text-[9px] font-medium opacity-70">exacto</p></>
                          ) : pm === 'contraentrega-efectivo-cambio' ? (
                            <><p>EFECTIVO</p>
                              {(order as any).cantoCancelo && (
                                <p className="text-[9px] font-medium opacity-70">
                                  vuelto S/{(parseFloat((order as any).cantoCancelo) - (typeof order.totalPrice === 'number' ? order.totalPrice : 0)).toFixed(2)}
                                </p>
                              )}
                            </>
                          ) : pm === 'efectivo' ? (
                            <p>EFECTIVO</p>
                          ) : <p className="text-[10px]">{pm}</p>}
                          {hasProof && (
                            <button
                              onClick={openVoucher}
                              className="mt-1 text-[9px] underline opacity-60 block w-full"
                            >ver comprobante</button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ── BOTÓN DE ACCIÓN ── */}
                {order.status === 'pending' && (
                  <div className="flex mt-auto">
                    <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">
                      ✓ Confirmar pedido
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-4 bg-amber-600 hover:bg-red-600 text-white/70 hover:text-white border-l border-amber-700 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                  </div>
                )}
                {order.status === 'pendiente-verificacion' && (
                  <div className="flex mt-auto">
                    <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">
                      ✓ Verificar y confirmar
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-4 bg-purple-700 hover:bg-red-600 text-white/70 hover:text-white border-l border-purple-800 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                  </div>
                )}
                {order.status === 'programado' && (
                  <div className="flex mt-auto">
                    <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">
                      ✓ Aceptar programado
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-4 bg-indigo-700 hover:bg-red-600 text-white/70 hover:text-white border-l border-indigo-800 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                  </div>
                )}
                {order.status === 'confirmed' && (
                  <div className="flex mt-auto">
                    <button onClick={() => updateOrderStatus(order.id, 'en-camino')} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">
                      🛵 Enviar en camino
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-4 bg-sky-600 hover:bg-red-600 text-white/70 hover:text-white border-l border-sky-700 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                  </div>
                )}
                {order.status === 'en-camino' && (
                  <div className="flex mt-auto">
                    <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 text-sm font-black uppercase tracking-wide transition-all rounded-bl-2xl">
                      ✓ Marcar entregado
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-4 bg-emerald-600 hover:bg-red-600 text-white/70 hover:text-white border-l border-emerald-700 text-sm font-bold transition-all rounded-br-2xl">✕</button>
                  </div>
                )}
                {order.status === 'delivered' && (
                  <div className="flex mt-auto">
                    <div className="flex-1 bg-emerald-50 text-emerald-600 py-2.5 text-xs font-black text-center uppercase tracking-wide rounded-bl-2xl">✓ Entregado</div>
                    <button onClick={async () => { if (!confirm('¿Eliminar?')) return; await fetch(`/api/orders?id=${order.id}`, { method: 'DELETE' }); setOrders(prev => prev.filter(o => o.id !== order.id)); }}
                      className="px-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-400 border-l border-gray-100 text-xs transition-all rounded-br-2xl">🗑</button>
                  </div>
                )}
                {order.status === 'cancelled' && (
                  <div className="flex mt-auto">
                    <div className="flex-1 bg-red-50 text-red-400 py-2.5 text-xs font-black text-center uppercase tracking-wide rounded-bl-2xl">✕ Cancelado</div>
                    <button onClick={async () => { if (!confirm('¿Eliminar?')) return; await fetch(`/api/orders?id=${order.id}`, { method: 'DELETE' }); setOrders(prev => prev.filter(o => o.id !== order.id)); }}
                      className="px-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-400 border-l border-gray-100 text-xs transition-all rounded-br-2xl">🗑</button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </section>
        </>
      ) : activeTab === "customers" ? (
        /* Customers Tab */
        <>
          {/* Banner alertas cumpleaños */}
          {(() => {
            const todayList = birthdayAlerts?.today || [];
            const tomorrowList = birthdayAlerts?.tomorrow || [];
            if (!birthdayAlertsLoading && todayList.length === 0 && tomorrowList.length === 0) return null;
            return (
              <div className="px-6 pt-5 space-y-3">
                {birthdayAlertsLoading && (
                  <div className="bg-pink-50 border border-pink-100 rounded-xl px-4 py-3 flex items-center gap-2">
                    <span className="text-pink-400 animate-pulse">🎂</span>
                    <span className="text-xs text-pink-500 font-medium">Verificando cumpleaños...</span>
                  </div>
                )}
                {todayList.length > 0 && (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🎂</span>
                          <span className="text-sm font-black text-rose-700">
                            {todayList.length === 1 ? `${todayList[0].name} cumple años HOY` : `${todayList.length} clientes cumplen años HOY`}
                          </span>
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">HOY</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {todayList.map((c: any) => {
                            const waMsg = (birthdayAlerts?.settings?.waTemplate || 'Hola {{nombre}}! Feliz cumpleanos desde Santo Dilema!')
                              .replace('{{nombre}}', c.name.split(' ')[0]);
                            return (
                              <div key={c.phone} className="flex items-center gap-2 bg-white border border-pink-100 rounded-xl px-3 py-1.5">
                                <span className="text-sm font-bold text-gray-900">{c.name}</span>
                                <span className="text-xs text-gray-400 font-mono">{c.phone}</span>
                                <a href={buildWhatsApp(c.phone, waMsg)} target="_blank" rel="noopener noreferrer"
                                   className="text-[10px] font-bold bg-green-100 text-green-700 hover:bg-green-200 px-2 py-0.5 rounded-full transition-all">
                                  💬 WA
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        disabled={bdSendingEmail}
                        onClick={async () => {
                          setBdSendingEmail(true);
                          setBdEmailResult(null);
                          try {
                            const r = await fetch('/api/birthday-alerts', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ customers: todayList, subject: `🎂 ${todayList.length > 1 ? todayList.length + ' clientes cumplen' : todayList[0].name + ' cumple'} años HOY — Santo Dilema` }),
                            });
                            const d = await r.json();
                            setBdEmailResult(d.success ? { ok: true, msg: `Email enviado a ${d.sentTo}` } : { ok: false, msg: d.error || 'Error' });
                          } finally { setBdSendingEmail(false); }
                        }}
                        className="flex-shrink-0 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                      >
                        {bdSendingEmail ? '...' : '📧 Enviar alerta'}
                      </button>
                    </div>
                    {bdEmailResult && (
                      <p className={`text-[11px] font-bold mt-2 ${bdEmailResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                        {bdEmailResult.ok ? '✓ ' : '✗ '}{bdEmailResult.msg}
                      </p>
                    )}
                  </div>
                )}
                {tomorrowList.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🎁</span>
                          <span className="text-sm font-black text-amber-700">
                            {tomorrowList.length === 1 ? `${tomorrowList[0].name} cumple años MAÑANA` : `${tomorrowList.length} clientes cumplen años MAÑANA`}
                          </span>
                          <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">MAÑANA</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tomorrowList.map((c: any) => (
                            <div key={c.phone} className="flex items-center gap-2 bg-white border border-amber-100 rounded-xl px-3 py-1.5">
                              <span className="text-sm font-bold text-gray-900">{c.name}</span>
                              <span className="text-xs text-gray-400 font-mono">{c.phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        disabled={bdSendingEmail}
                        onClick={async () => {
                          setBdSendingEmail(true);
                          setBdEmailResult(null);
                          try {
                            const r = await fetch('/api/birthday-alerts', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ customers: tomorrowList, subject: `🎁 ${tomorrowList.length > 1 ? tomorrowList.length + ' clientes cumplen' : tomorrowList[0].name + ' cumple'} años MAÑANA — Santo Dilema` }),
                            });
                            const d = await r.json();
                            setBdEmailResult(d.success ? { ok: true, msg: `Email enviado a ${d.sentTo}` } : { ok: false, msg: d.error || 'Error' });
                          } finally { setBdSendingEmail(false); }
                        }}
                        className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                      >
                        {bdSendingEmail ? '...' : '📧 Alerta previa'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Customer Stats */}
          <section className="px-6 py-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <span className="text-gray-700">👥</span> Clientes
                  <span className="text-xs font-normal text-gray-500 ml-1">— click para ver ficha completa</span>
                </h2>
                <button
                  onClick={() => setShowBirthdaySettings(s => !s)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${showBirthdaySettings ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                >
                  🎂 Configurar alertas
                </button>
              </div>

              {/* Panel de configuración de alertas */}
              {showBirthdaySettings && (
                <div className="mb-4 bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900">Configuración de alertas de cumpleaños</p>
                    <span className="text-[10px] text-gray-400">Los cambios se guardan automáticamente</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email destinatario de alertas</label>
                      <input
                        type="email"
                        value={bdSettingsForm.recipientEmail}
                        onChange={e => setBdSettingsForm(f => ({ ...f, recipientEmail: e.target.value }))}
                        placeholder="tucorreo@gmail.com"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Configurar BIRTHDAY_EMAIL_USER y BIRTHDAY_EMAIL_PASS en .env.local (Gmail)</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Días de anticipación</label>
                      <select
                        value={bdSettingsForm.alertDaysBefore}
                        onChange={e => setBdSettingsForm(f => ({ ...f, alertDaysBefore: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400"
                      >
                        <option value={0}>El mismo día</option>
                        <option value={1}>1 día antes</option>
                        <option value={2}>2 días antes</option>
                        <option value={3}>3 días antes</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mensaje de WhatsApp para cumpleaños (editable)</label>
                    <textarea
                      value={bdSettingsForm.waTemplate}
                      onChange={e => setBdSettingsForm(f => ({ ...f, waTemplate: e.target.value }))}
                      rows={6}
                      placeholder="Hola {{nombre}}! Feliz cumpleanos..."
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 resize-none font-mono leading-relaxed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Usa {'{{nombre}}'} para insertar el nombre del cliente automáticamente.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={bdSettingsSaving}
                      onClick={async () => {
                        setBdSettingsSaving(true);
                        try {
                          await fetch('/api/birthday-alerts', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(bdSettingsForm),
                          });
                          setBirthdayAlerts(prev => prev ? { ...prev, settings: { ...prev.settings, ...bdSettingsForm } } : prev);
                        } finally { setBdSettingsSaving(false); }
                      }}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      {bdSettingsSaving ? 'Guardando...' : '✓ Guardar configuración'}
                    </button>
                    <button onClick={() => setShowBirthdaySettings(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all">
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

            <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCustomerSegment("all")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "all"
                      ? "bg-fuchsia-600 text-white "
                      : "bg-white text-gray-400 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  Todos ({customerSegments.all.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("vip")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "vip"
                      ? "bg-amber-600 text-white"
                      : "bg-white text-gray-400 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  👑 VIP ({customerSegments.vip.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("new")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "new"
                      ? "bg-cyan-600 text-white"
                      : "bg-white text-gray-400 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  ✨ Nuevos ({customerSegments.new.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("active")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "active"
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-400 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  🟢 Activos ({customerSegments.active.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("recurrent")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "recurrent"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-400 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  🔁 Recurrentes ({customerSegments.recurrent.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("inactive")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "inactive"
                      ? "bg-red-600 text-white"
                      : "bg-white text-gray-400 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  💤 Inactivos ({customerSegments.inactive.length})
                </button>
                <button
                  onClick={() => setCustomerSegment("birthday")}
                  className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 text-sm ${
                    customerSegment === "birthday"
                      ? "bg-pink-600 text-white"
                      : "bg-white text-gray-400 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  🎂 Cumpleaños ({allCustomers.filter((c: any) => !!c.birthday).length})
                </button>
              </div>
            </div>
          </section>

          {/* Customers Table */}
          <section className="px-6 pb-12">
            {/* CRM Ficha completa del cliente */}
            {selectedCustomer && (() => {
              // ── Métricas del cliente ──────────────────────────────────
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
              const topProduct = topProducts[0];
              const daysSince = Math.floor((new Date().getTime() - new Date(selectedCustomer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
              const sortedOrders = [...selectedCustomer.orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              // Frecuencia: días promedio entre pedidos
              let freqLabel = '—';
              if (sortedOrders.length >= 2) {
                const oldest = new Date(sortedOrders[sortedOrders.length - 1].createdAt).getTime();
                const newest = new Date(sortedOrders[0].createdAt).getTime();
                const avgDays = Math.round((newest - oldest) / (1000 * 60 * 60 * 24) / (sortedOrders.length - 1));
                freqLabel = avgDays <= 7 ? 'Semanal' : avgDays <= 15 ? 'Quincenal' : avgDays <= 35 ? 'Mensual' : `c/${avgDays}d`;
              }

              const segmentInfo = selectedCustomer.totalOrders > 3
                ? { label: 'VIP', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' }
                : selectedCustomer.totalOrders > 1
                  ? { label: 'Recurrente', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' }
                  : daysSince > 30
                    ? { label: 'Inactivo', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' }
                    : { label: 'Nuevo', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' };

              const addressHistory: string[] = selectedCustomer.addressHistory || (selectedCustomer.address ? [selectedCustomer.address] : []);
              const currentPrimary = primaryAddressMap[selectedCustomer.phone] || addressHistory[0] || selectedCustomer.address || '';

              const closeModal = () => {
                setSelectedCustomer(null);
                setCustomerModalTab('overview');
                setExpandedOrderId(null);
                setEditingCustomer(false);
              };

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeModal}>
                  <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

                    {/* ── HEADER ──────────────────────────────────────── */}
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-2xl px-6 py-5">
                      <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-sm">✕</button>

                      {editingCustomer ? (
                        /* ── MODO EDICIÓN ── */
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Editar datos del cliente</p>
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Nombre</label>
                              <input
                                value={editCustomerForm.name}
                                onChange={e => setEditCustomerForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Teléfono <span className="text-gray-600 normal-case">(no editable)</span></label>
                              <input
                                value={editCustomerForm.phone}
                                readOnly
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400 font-mono cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Dirección principal</label>
                              <input
                                value={editCustomerForm.address}
                                onChange={e => setEditCustomerForm(f => ({ ...f, address: e.target.value }))}
                                className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={async () => {
                                setEditCustomerSaving(true);
                                try {
                                  await fetch('/api/customer-profiles', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      action: 'upsert',
                                      phone: selectedCustomer.phone,
                                      name: editCustomerForm.name,
                                      address: editCustomerForm.address,
                                      birthday: selectedCustomer.birthday || '',
                                      tags: selectedCustomer.tags || [],
                                      notes: selectedCustomer.notes || '',
                                    }),
                                  });
                                  // Actualizar el cliente seleccionado localmente
                                  setSelectedCustomer((prev: any) => ({
                                    ...prev,
                                    name: editCustomerForm.name,
                                    phone: editCustomerForm.phone,
                                    address: editCustomerForm.address,
                                  }));
                                  setEditingCustomer(false);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setEditCustomerSaving(false);
                                }
                              }}
                              disabled={editCustomerSaving}
                              className="flex-1 bg-white text-gray-900 font-bold text-sm py-2 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
                            >
                              {editCustomerSaving ? 'Guardando...' : '✓ Guardar cambios'}
                            </button>
                            <button onClick={() => setEditingCustomer(false)} className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-all">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── VISTA NORMAL ── */
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                            {selectedCustomer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-xl font-black text-white">{selectedCustomer.name}</h2>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${segmentInfo.bg} ${segmentInfo.text}`}>{segmentInfo.label}</span>
                            </div>
                            <p className="text-gray-300 text-sm font-mono mt-1">{selectedCustomer.phone}</p>
                            {currentPrimary && <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {currentPrimary}</p>}
                            {selectedCustomer.birthday && <p className="text-gray-400 text-xs mt-0.5">🎂 {selectedCustomer.birthday.split('-')[1]}/{selectedCustomer.birthday.split('-')[0]}</p>}
                          </div>
                          <button
                            onClick={() => {
                              setEditCustomerForm({ name: selectedCustomer.name, phone: selectedCustomer.phone, address: currentPrimary });
                              setEditingCustomer(true);
                            }}
                            className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-all"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── TABS ────────────────────────────────────────── */}
                    <div className="flex border-b border-gray-100 bg-white px-4">
                      {(['overview', 'orders', 'addresses'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setCustomerModalTab(tab)}
                          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${customerModalTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                        >
                          {tab === 'overview' ? '📊 Resumen' : tab === 'orders' ? `📦 Pedidos (${sortedOrders.length})` : `📍 Direcciones (${addressHistory.length})`}
                        </button>
                      ))}
                    </div>

                    {/* ── CONTENIDO ───────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto">

                      {/* TAB: RESUMEN ───────────────────────────────── */}
                      {customerModalTab === 'overview' && (
                        <div className="p-5 space-y-5">
                          {/* KPIs principales */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                              <p className="text-2xl font-black text-gray-900">{selectedCustomer.totalOrders}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Pedidos</p>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                              <p className="text-2xl font-black text-amber-600">S/{selectedCustomer.totalSpent.toFixed(0)}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Total gastado</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                              <p className="text-2xl font-black text-blue-600">S/{(selectedCustomer.avgTicket||0).toFixed(0)}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Ticket prom.</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                              <p className="text-2xl font-black text-gray-500">{daysSince}d</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Última compra</p>
                            </div>
                          </div>

                          {/* Resumen comercial */}
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Resumen comercial</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase">Última compra</p>
                                <p className="font-bold text-gray-800">{new Date(selectedCustomer.lastOrderDate).toLocaleDateString("es-PE", { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase">Frecuencia</p>
                                <p className="font-bold text-gray-800">{freqLabel}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase">Producto favorito</p>
                                <p className="font-bold text-gray-800 truncate">{topProduct ? `${topProduct.name} (×${topProduct.qty})` : '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase">Registrado</p>
                                <p className="font-bold text-gray-800">{(() => {
                                  const oldest = [...selectedCustomer.orders].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
                                  return oldest ? new Date(oldest.createdAt).toLocaleDateString("es-PE", { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
                                })()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase">Estado</p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${segmentInfo.bg} ${segmentInfo.text}`}>{segmentInfo.label}</span>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase">Dirección activa</p>
                                <p className="font-bold text-gray-800 text-xs truncate">{currentPrimary || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase">Cumpleaños</p>
                                <p className="font-bold text-gray-800">
                                  {selectedCustomer.birthday
                                    ? (() => { const [mm, dd] = selectedCustomer.birthday.split('-'); return `${dd}/${mm}`; })()
                                    : <span className="text-gray-400 font-normal text-xs">No registrado</span>}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Productos más comprados */}
                          {topProducts.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Productos favoritos</p>
                              <div className="space-y-1.5">
                                {topProducts.map((p, i) => (
                                  <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-gray-300'}`}>{i + 1}</span>
                                    <span className="flex-1 text-sm text-gray-800 font-medium truncate">{p.name}</span>
                                    <span className="text-xs font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.qty}×</span>
                                    <span className="text-xs text-amber-600 font-black w-16 text-right">S/{p.revenue.toFixed(0)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sección cumpleaños — accionable */}
                          {(() => {
                            const bdBadge = getBirthdayBadge(selectedCustomer.birthday);
                            const waMsg = (birthdayAlerts?.settings?.waTemplate || '🎉 ¡Hola {{nombre}}!\n\nTodo el equipo de Santo Dilema te desea un muy feliz cumpleaños. 🥳🎂\n\nGracias por elegirnos y ser parte de nuestra comunidad.\n\nQueremos celebrarlo contigo — ¡tenemos una sorpresa especial para ti!\n\n¡Esperamos verte pronto!\n\nEquipo Santo Dilema ❤️')
                              .replace(/{{nombre}}/g, selectedCustomer.name.split(' ')[0]);
                            return (
                              <div className={`rounded-xl p-4 border ${bdBadge === 'today' ? 'bg-pink-50 border-pink-200' : bdBadge === 'tomorrow' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">🎂</span>
                                    <div>
                                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cumpleaños</p>
                                      <p className="text-sm font-bold text-gray-900">
                                        {selectedCustomer.birthday
                                          ? (() => {
                                              const [mm, dd] = selectedCustomer.birthday.split('-');
                                              return `${dd}/${mm}`;
                                            })()
                                          : 'No registrado'}
                                        {bdBadge === 'today' && <span className="ml-2 bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">HOY</span>}
                                        {bdBadge === 'tomorrow' && <span className="ml-2 bg-orange-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">MAÑANA</span>}
                                        {bdBadge === 'week' && <span className="ml-2 bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">esta semana</span>}
                                        {bdBadge === 'month' && <span className="ml-2 bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded-full">este mes</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setCrmEditPhone(selectedCustomer.phone);
                                      setCrmForm({ birthday: selectedCustomer.birthday ? `${selectedCustomer.birthday.split('-')[1]}/${selectedCustomer.birthday.split('-')[0]}` : '', tags: selectedCustomer.tags || [], notes: selectedCustomer.notes || '' });
                                      setShowCrmModal(true);
                                    }}
                                    className="text-[10px] font-bold text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg transition-all"
                                  >
                                    {selectedCustomer.birthday ? 'Cambiar' : '+ Agregar'}
                                  </button>
                                </div>
                                {selectedCustomer.birthday && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mensaje de felicitación</p>
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                      <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{waMsg}</p>
                                    </div>
                                    <a
                                      href={buildWhatsApp(selectedCustomer.phone, waMsg)}
                                      target="_blank" rel="noopener noreferrer"
                                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        bdBadge === 'today'
                                          ? 'bg-pink-600 hover:bg-pink-700 text-white'
                                          : bdBadge === 'tomorrow'
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                      }`}
                                    >
                                      💬 {bdBadge === 'today' ? 'Felicitar AHORA por WhatsApp' : bdBadge === 'tomorrow' ? 'Preparar felicitación (cumple mañana)' : 'Enviar felicitación por WhatsApp'}
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Notas y etiquetas */}
                          {(selectedCustomer.notes || (selectedCustomer.tags || []).length > 0) && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              {(selectedCustomer.tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {(selectedCustomer.tags || []).map((t: string) => (
                                    <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">{t}</span>
                                  ))}
                                </div>
                              )}
                              {selectedCustomer.notes && <p className="text-xs text-gray-500 italic">&quot;{selectedCustomer.notes}&quot;</p>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB: PEDIDOS ───────────────────────────────── */}
                      {customerModalTab === 'orders' && (
                        <div className="p-5 space-y-3">
                          {sortedOrders.map((order: any) => {
                            const isExpanded = expandedOrderId === order.id;
                            const orderItems = order.completedOrders || order.cart || [];
                            const subtotal = orderItems.reduce((acc: number, it: any) => acc + ((it.finalPrice ?? it.price ?? 0) * (it.quantity || 0)), 0);
                            const couponDiscount = order.couponDiscount || 0;
                            const comboDiscount = order.comboDiscount || 0;
                            const deliveryCost = order.deliveryCost || 0;
                            const payMethodLabels: Record<string, string> = {
                              yape: 'Yape', plin: 'Plin', efectivo: 'Efectivo', transferencia: 'Transferencia',
                              anticipado: 'Anticipado', tarjeta: 'Tarjeta', otro: 'Otro'
                            };
                            const orderStatus = statusLabels[order.status as keyof typeof statusLabels] || order.status;
                            const orderStatusColor = statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-600 border-gray-200';
                            const orderAddr = order.address || order.deliveryCustomLocation || '';

                            return (
                              <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Fila principal del pedido */}
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-sm font-black text-gray-900">{order.id}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${orderStatusColor}`}>{orderStatus}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-black text-amber-600 text-sm">S/ {(order.totalPrice || 0).toFixed(2)}</span>
                                      <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-[11px] text-gray-400">
                                      {new Date(order.createdAt).toLocaleDateString("es-PE", { day: '2-digit', month: '2-digit', year: '2-digit' })}{' '}
                                      {new Date(order.createdAt).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {order.paymentMethod && (
                                      <span className="text-[11px] text-gray-400">{payMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
                                    )}
                                    {orderAddr && <span className="text-[11px] text-gray-400 truncate max-w-[200px]">📍 {orderAddr}</span>}
                                  </div>
                                </button>

                                {/* Detalle expandible */}
                                {isExpanded && (
                                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
                                    {/* Productos */}
                                    {orderItems.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Productos</p>
                                        <div className="space-y-1.5">
                                          {orderItems.map((it: any, idx2: number) => {
                                            const itemName = it.name || it.product?.name || 'Producto';
                                            const itemQty = it.quantity || 1;
                                            const itemPrice = it.finalPrice ?? it.price ?? it.product?.price ?? 0;
                                            const salsas = it.salsaIds || it.salsas || [];
                                            const complements = it.complementIds || [];
                                            return (
                                              <div key={idx2} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{itemQty}</span>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-bold text-gray-900 truncate">{itemName}</p>
                                                  {salsas.length > 0 && <p className="text-[10px] text-red-500 mt-0.5">🌶 {salsas.join(', ')}</p>}
                                                  {complements.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">+ {complements.join(', ')}</p>}
                                                </div>
                                                <span className="text-sm font-black text-gray-700 flex-shrink-0">S/{(itemPrice * itemQty).toFixed(2)}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Subtotales y descuentos */}
                                    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 space-y-1.5">
                                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Desglose de pago</p>
                                      <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-bold">S/{subtotal.toFixed(2)}</span>
                                      </div>
                                      {couponDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-purple-600">
                                          <span>Cupón {order.couponCode ? `(${order.couponCode})` : ''} -{couponDiscount}%</span>
                                          <span className="font-bold">-S/{(subtotal * couponDiscount / 100).toFixed(2)}</span>
                                        </div>
                                      )}
                                      {comboDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-600">
                                          <span>Descuento combo</span>
                                          <span className="font-bold">-S/{comboDiscount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      {deliveryCost > 0 && (
                                        <div className="flex justify-between text-sm text-gray-600">
                                          <span>Delivery</span>
                                          <span className="font-bold">+S/{deliveryCost.toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-1.5 mt-1">
                                        <span>Total pagado</span>
                                        <span className="text-amber-600">S/{(order.totalPrice || 0).toFixed(2)}</span>
                                      </div>
                                    </div>

                                    {/* Info logística */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {orderAddr && (
                                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                                          <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Dirección de entrega</p>
                                          <p className="text-gray-700 font-medium">{orderAddr}</p>
                                        </div>
                                      )}
                                      {order.paymentMethod && (
                                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                                          <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Método de pago</p>
                                          <p className="text-gray-700 font-medium capitalize">{payMethodLabels[order.paymentMethod] || order.paymentMethod}</p>
                                        </div>
                                      )}
                                      {order.deliveredAt && (
                                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                                          <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Hora de entrega</p>
                                          <p className="text-gray-700 font-medium">{new Date(order.deliveredAt).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                      )}
                                      {order.notes && (
                                        <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 col-span-2">
                                          <p className="text-[9px] text-amber-600 uppercase font-bold mb-0.5">Nota del cliente</p>
                                          <p className="text-gray-700 font-medium">{order.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TAB: DIRECCIONES ───────────────────────────── */}
                      {customerModalTab === 'addresses' && (
                        <div className="p-5">
                          {addressHistory.length === 0 ? (
                            <div className="text-center py-10">
                              <p className="text-4xl mb-2">📍</p>
                              <p className="text-gray-400 text-sm">Sin direcciones registradas</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                                {addressHistory.length} {addressHistory.length === 1 ? 'dirección registrada' : 'direcciones registradas'}
                              </p>
                              {addressHistory.map((addr, i) => {
                                const isPrimary = addr === currentPrimary;
                                return (
                                  <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border transition-all ${isPrimary ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                                    <span className={`text-lg flex-shrink-0 mt-0.5 ${isPrimary ? '' : 'opacity-40'}`}>📍</span>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${isPrimary ? 'text-white' : 'text-gray-800'}`}>{addr}</p>
                                      {isPrimary && <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">Dirección principal</p>}
                                    </div>
                                    {!isPrimary && (
                                      <button
                                        onClick={() => setPrimaryAddressMap(prev => ({ ...prev, [selectedCustomer.phone]: addr }))}
                                        className="flex-shrink-0 text-[10px] font-bold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-all"
                                      >
                                        Marcar principal
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── FOOTER ──────────────────────────────────────── */}
                    <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 rounded-b-2xl flex items-center justify-between">
                      <p className="text-[10px] text-gray-400">{selectedCustomer.phone} · {selectedCustomer.totalOrders} pedido{selectedCustomer.totalOrders !== 1 ? 's' : ''}</p>
                      <button onClick={closeModal} className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 px-4 py-1.5 rounded-lg transition-all">
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {loading ? (
              <div className="text-center py-12">
                <p className="text-2xl text-gray-700 ">Cargando clientes...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
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
                      placeholder="Buscar cliente por nombre, teléfono o dirección..."
                      className="w-full px-4 py-3 pl-10 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all"
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
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
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
                      setCustomerSortDir(key === "name" || key === "phone" ? "asc" : "desc");
                    }
                  };
                  const SortIcon = ({ col }: { col: string }) => {
                    if (customerSortKey !== col) return <span className="text-gray-600 ml-1">↕</span>;
                    return <span className="text-gray-600 ml-1">{customerSortDir === "asc" ? "↑" : "↓"}</span>;
                  };
                  const sortedCustomers = [...customers].sort((a: any, b: any) => {
                    let aVal: any, bVal: any;
                    if (customerSortKey === "phone") { aVal = a.phone || ""; bVal = b.phone || ""; }
                    else if (customerSortKey === "name") { aVal = a.name || ""; bVal = b.name || ""; }
                    else if (customerSortKey === "address") { aVal = a.address || ""; bVal = b.address || ""; }
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
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xl">
                      <table className="w-full">
                        <thead className="bg-white border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Estado</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort("name")}>
                              Nombre <SortIcon col="name" />
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none hidden md:table-cell" onClick={() => handleSort("phone")}>
                              Teléfono <SortIcon col="phone" />
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort("totalOrders")}>
                              Pedidos <SortIcon col="totalOrders" />
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort("totalSpent")}>
                              Total <SortIcon col="totalSpent" />
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none hidden xl:table-cell" onClick={() => handleSort("address")}>
                              Dirección <SortIcon col="address" />
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none hidden lg:table-cell" onClick={() => handleSort("lastOrderDate")}>
                              Última Compra <SortIcon col="lastOrderDate" />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCustomers.map((customer: any, idx: number) => {
                            const daysSinceLastOrder = Math.floor((new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
                            const segBadge = customer.totalOrders > 3
                              ? { label: "VIP", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" }
                              : customer.totalOrders > 1
                                ? { label: "Recurrente", cls: "bg-blue-500/20 text-blue-300 border-blue-500/40" }
                                : daysSinceLastOrder > 30
                                  ? { label: "Inactivo", cls: "bg-red-500/20 text-red-300 border-red-500/40" }
                                  : { label: "Nuevo", cls: "bg-green-500/20 text-green-300 border-green-500/40" };
                            const bdBadge = getBirthdayBadge(customer.birthday);
                            const rowHighlight = bdBadge === 'today'
                              ? 'bg-pink-50 hover:bg-pink-100/70'
                              : bdBadge === 'tomorrow'
                                ? 'bg-orange-50 hover:bg-orange-100/70'
                                : `hover:bg-fuchsia-500/5 ${idx % 2 === 0 ? "bg-black/10" : ""}`;
                            return (
                              <tr
                                key={customer.phone}
                                onClick={() => setSelectedCustomer(customer)}
                                className={`border-b border-gray-200/60 cursor-pointer transition-colors ${rowHighlight}`}
                              >
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${segBadge.cls}`}>{segBadge.label}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-semibold text-gray-800">{customer.name}</p>
                                    {bdBadge === 'today' && <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">🎂 HOY</span>}
                                    {bdBadge === 'tomorrow' && <span className="bg-orange-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">🎁 MAÑANA</span>}
                                    {bdBadge === 'week' && <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">🎂 esta semana</span>}
                                    {bdBadge === 'month' && <span className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded-full">🗓 este mes</span>}
                                  </div>
                                  <p className="text-xs text-gray-500 sm:hidden">{customer.phone}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 font-mono hidden md:table-cell">{customer.phone}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-block w-8 h-8 leading-8 rounded-full bg-fuchsia-500/15 text-gray-700 font-black text-sm text-center">
                                    {customer.totalOrders}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-amber-400 font-black text-sm">
                                  S/ {customer.totalSpent.toFixed(0)}
                                </td>
                                <td className="px-4 py-3 hidden xl:table-cell">
                                  {customer.address ? (
                                    <p className="text-xs text-gray-600 max-w-[180px] truncate" title={customer.address}>{customer.address}</p>
                                  ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                  )}
                                  {(customer.addressHistory?.length || 0) > 1 && (
                                    <span className="text-[10px] text-indigo-400">{customer.addressHistory.length} direcciones</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-400 text-xs hidden lg:table-cell">
                                  {new Date(customer.lastOrderDate).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                                  {daysSinceLastOrder <= 7 && <span className="block text-green-400 text-[10px]">hace {daysSinceLastOrder}d</span>}
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
          {/* Dashboard CRM - integrado en tab Inicio */}
          {false && crmDashboard && (
            <section className="px-6 py-6 space-y-6">
              {/* 4 KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border-2 border-fuchsia-500/40 p-4 text-center">
                  <p className="text-3xl font-black text-gray-700">{crmDashboard.total}</p>
                  <p className="text-xs text-gray-400 uppercase mt-1">Clientes totales</p>
                </div>
                <div className="bg-white rounded-xl border-2 border-green-500/40 p-4 text-center">
                  <p className="text-3xl font-black text-green-400">{crmDashboard.repurchaseRate}%</p>
                  <p className="text-xs text-gray-400 uppercase mt-1">Tasa recompra</p>
                </div>
                <div className="bg-white rounded-xl border-2 border-amber-500/40 p-4 text-center">
                  <p className="text-3xl font-black text-amber-400">S/ {crmDashboard.avgTicket.toFixed(0)}</p>
                  <p className="text-xs text-gray-400 uppercase mt-1">Ticket promedio</p>
                </div>
                <div className="bg-white rounded-xl border-2 border-cyan-500/40 p-4 text-center">
                  <p className="text-3xl font-black text-cyan-400">{crmDashboard.avgFrequency}</p>
                  <p className="text-xs text-gray-400 uppercase mt-1">Pedidos/cliente</p>
                </div>
              </div>

              {/* Clientes en riesgo */}
              <div className="bg-white rounded-xl border-2 border-red-500/30 p-5">
                <h3 className="text-sm font-black text-red-400 uppercase tracking-wider mb-4">Clientes en riesgo — Lanzar reactivación</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '30 días', seg: 'inactive30' },
                    { label: '60 días', seg: 'inactive60' },
                    { label: '90+ días', seg: 'inactive90' },
                  ].map(({ label, seg }) => (
                    <button key={seg}
                      onClick={() => { setCampaignSegment(seg); setShowCampaignModal(true); }}
                      className="bg-gray-100 border border-gray-200 hover:border-fuchsia-500 rounded-lg p-3 text-center transition-all">
                      <p className="text-2xl font-black text-gray-900">{(customerSegments as any)[seg]?.length ?? 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Inactivos {label}</p>
                      <p className="text-xs text-gray-700 mt-1">Enviar WhatsApp →</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lanzar campaña por segmento */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">Lanzar campaña WhatsApp</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: '👑 VIP', seg: 'vip' },
                    { label: '✨ Nuevos', seg: 'new' },
                    { label: '🔁 Recurrentes', seg: 'recurrent' },
                    { label: '💤 Inactivos 30d', seg: 'inactive30' },
                    { label: '💤 Inactivos 60d', seg: 'inactive60' },
                    { label: '💀 Inactivos 90d', seg: 'inactive90' },
                  ].map(({ label, seg }) => (
                    <button key={seg}
                      onClick={() => { setCampaignSegment(seg); setShowCampaignModal(true); }}
                      className="bg-gray-100 border border-gray-200 hover:border-fuchsia-500 rounded-lg p-3 text-left transition-all">
                      <p className="text-gray-800 font-bold text-sm">{label}</p>
                      <p className="text-gray-500 text-xs">{(customerSegments as any)[seg]?.length ?? 0} clientes</p>
                      <p className="text-gray-700 text-xs mt-1">Generar mensajes →</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Cumpleaños - integrado como segmento en lista de clientes */}
          {false && crmDashboard && (
            <section className="px-6 py-6 space-y-4">
              {crmDashboard.birthdaysToday.length > 0 && (
                <div className="bg-pink-900/20 border-2 border-pink-500 rounded-xl p-4">
                  <h3 className="text-pink-400 font-black text-sm uppercase mb-3">🎂 Cumpleaños hoy ({crmDashboard.birthdaysToday.length})</h3>
                  {crmDashboard.birthdaysToday.map((c: any) => (
                    <div key={c.phone} className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 mb-2">
                      <div>
                        <p className="text-gray-800 font-bold text-sm">{c.name}</p>
                        <p className="text-gray-400 text-xs">{c.phone}</p>
                      </div>
                      <a href={buildWhatsApp(c.phone, getCampaignTemplate('birthday', c))}
                         target="_blank" rel="noopener noreferrer"
                         className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold">
                        Felicitar 🎉
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-gray-700 font-black text-sm uppercase mb-3">
                  Todos los cumpleaños registrados ({allCustomers.filter((c: any) => c.birthday).length})
                </h3>
                {allCustomers.filter((c: any) => c.birthday).length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">
                    Sin cumpleaños registrados. Edita un cliente en &quot;Clientes&quot; para añadir su cumpleaños.
                  </p>
                ) : (
                  [...allCustomers.filter((c: any) => c.birthday)]
                    .sort((a: any, b: any) => a.birthday.localeCompare(b.birthday))
                    .map((c: any) => {
                      const [mm, dd] = c.birthday.split('-');
                      const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                      return (
                        <div key={c.phone} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-0">
                          <span className="text-xl font-black text-gray-700 w-8 text-center">{dd}</span>
                          <span className="text-gray-500 text-xs w-8">{meses[parseInt(mm)-1]}</span>
                          <span className="flex-1 text-gray-800 text-sm">{c.name}</span>
                          <span className="text-gray-500 text-xs">{c.phone}</span>
                        </div>
                      );
                    })
                )}
              </div>
            </section>
          )}
        </>
      ) : activeTab === "analytics" ? (
        /* Analytics Tab */
        <>
          {/* Date Filter - Only for Analytics */}
          <section className="px-6 pt-4">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Quick period buttons */}
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Período:</span>
                {(() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
                  const weekStr = weekAgo.toISOString().split("T")[0];
                  const monthStart = new Date(); monthStart.setDate(1);
                  const monthStr = monthStart.toISOString().split("T")[0];
                  const periods = [
                    { label: "Hoy", from: todayStr, to: todayStr },
                    { label: "Esta semana", from: weekStr, to: todayStr },
                    { label: "Este mes", from: monthStr, to: todayStr },
                  ];
                  return periods.map(({ label, from, to }) => {
                    const isActive = isAnalyticsDateFiltered && analyticsDateFrom === from && analyticsDateTo === to;
                    return (
                      <button
                        key={label}
                        onClick={() => { setAnalyticsDateFrom(from); setAnalyticsDateTo(to); setIsAnalyticsDateFiltered(true); }}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                          isActive
                            ? "bg-fuchsia-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  });
                })()}

                {/* Divider */}
                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Custom date pickers */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Desde:</label>
                  <input
                    type="date"
                    value={analyticsDateFrom}
                    onChange={(e) => setAnalyticsDateFrom(e.target.value)}
                    className="px-2 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none cursor-pointer [color-scheme:light]"
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                  <label className="text-xs text-gray-400">Hasta:</label>
                  <input
                    type="date"
                    value={analyticsDateTo}
                    onChange={(e) => setAnalyticsDateTo(e.target.value)}
                    className="px-2 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none cursor-pointer [color-scheme:light]"
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                  <button
                    onClick={applyAnalyticsDateFilter}
                    disabled={!analyticsDateFrom || !analyticsDateTo}
                    className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aplicar
                  </button>
                </div>

                {isAnalyticsDateFiltered && (
                  <button
                    onClick={clearAnalyticsDateFilter}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-all"
                  >
                    ✕ Limpiar
                  </button>
                )}

                {isAnalyticsDateFiltered && analyticsDateFrom && analyticsDateTo && (
                  <span className="text-xs text-green-400 font-bold">
                    ✓ {new Date(analyticsDateFrom + "T12:00:00").toLocaleDateString("es-PE")} — {new Date(analyticsDateTo + "T12:00:00").toLocaleDateString("es-PE")}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="px-6 py-8">
            {/* CARTELES PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* 1. VENTAS DEL DÍA */}
              <div className="bg-white rounded-xl border-2 border-cyan-500/50 p-6">
                <p className="text-cyan-400 text-sm font-bold mb-2">💰 Ventas del Día</p>
                <p className="text-4xl font-black text-cyan-400">S/ {analytics.dailySales.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {isAnalyticsDateFiltered && analyticsDateFrom && analyticsDateTo ? `${new Date(analyticsDateFrom).toLocaleDateString("es-PE")} - ${new Date(analyticsDateTo).toLocaleDateString("es-PE")}` : new Date().toLocaleDateString("es-PE")}
                </p>
              </div>

              {/* 2. PEDIDOS ENTREGADOS DEL DÍA */}
              <div className="bg-white rounded-xl border-2 border-green-500/50 p-6">
                <p className="text-green-400 text-sm font-bold mb-2">📦 Pedidos Entregados</p>
                <p className="text-4xl font-black text-green-400">{analytics.todayDeliveredOrdersCount}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {isAnalyticsDateFiltered ? "Del período filtrado" : "Hoy"}
                </p>
              </div>

              {/* 3. ACUMULADO DEL MES */}
              <div className="bg-white rounded-xl border-2 border-purple-500/50 p-6">
                <p className="text-purple-400 text-sm font-bold mb-2">📊 Acumulado del Mes</p>
                <p className="text-4xl font-black text-purple-400">S/ {analytics.monthlySales.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {analytics.currentMonthOrdersCount} pedidos
                </p>
              </div>

              {/* 4. TICKET PROMEDIO DEL DÍA */}
              <div className="bg-white rounded-xl border-2 border-amber-500/50 p-6">
                <p className="text-amber-400 text-sm font-bold mb-2">🎫 Ticket Promedio</p>
                <p className="text-4xl font-black text-amber-400">S/ {analytics.todayAverageTicket.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {isAnalyticsDateFiltered ? "Del período filtrado" : "Del día"} ({analytics.todayDeliveredOrdersCount} pedidos)
                </p>
              </div>
            </div>

            {/* SECCIÓN: PRODUCTOS ENTREGADOS DEL PERÍODO */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8">
              <h3 className="text-2xl font-black text-gray-700 mb-2">📦 Productos Entregados {isAnalyticsDateFiltered ? "del Período" : "del Mes"}</h3>
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
                          className={`bg-gray-100 rounded-lg p-4 border-2 ${
                            isMostSold ? 'border-green-500/50 bg-green-500/5' :
                            isLeastSold ? 'border-red-500/50 bg-red-500/5' :
                            'border-gray-200/50'
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
                          <p className="text-gray-900 font-bold text-base mb-1">{product.name}</p>
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
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">% del total</p>
                              <p className="text-sm font-black text-gray-700">{revenuePercentage.toFixed(1)}%</p>
                            </div>
                            <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mt-1">
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
                <div className="bg-white rounded-xl border-2 border-green-500/50 p-6">
                  <p className="text-green-400 text-sm font-bold mb-2">💳 Método de Pago Preferido</p>
                  <p className="text-2xl font-black text-gray-900 mb-1">
                    {analytics.mostUsedPaymentMethod.method === 'anticipado' ? '💰 Anticipado' :
                     analytics.mostUsedPaymentMethod.method === 'contraentrega-efectivo-exacto' ? '💵 Efectivo Exacto' :
                     analytics.mostUsedPaymentMethod.method === 'contraentrega-efectivo-cambio' ? '💵 Con Cambio' :
                     analytics.mostUsedPaymentMethod.method}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">{analytics.mostUsedPaymentMethod.count} pedidos ({((analytics.mostUsedPaymentMethod.count / analytics.currentMonthOrdersCount) * 100).toFixed(0)}%)</p>
                </div>

                {/* 2. HORARIO PICO */}
                <div className="bg-white rounded-xl border-2 border-amber-500/50 p-6">
                  <p className="text-amber-400 text-sm font-bold mb-2">⏰ Horario Pico</p>
                  <p className="text-2xl font-black text-gray-900 mb-1">{analytics.peakHour}</p>
                  <p className="text-gray-400 text-xs mt-2">{analytics.peakHourCount} pedidos en esa hora</p>
                </div>

                {/* 3. TASA DE CONVERSIÓN */}
                <div className="bg-white rounded-xl border-2 border-cyan-500/50 p-6">
                  <p className="text-cyan-400 text-sm font-bold mb-2">📈 Tasa de Conversión</p>
                  <p className="text-3xl font-black text-gray-900 mb-1">{analytics.conversionRate.toFixed(1)}%</p>
                  <p className="text-gray-400 text-xs mt-2">Pedidos confirmados vs totales</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN: DISTRIBUCIÓN DE MÉTODOS DE PAGO - formato filas */}
            <div className="bg-white rounded-xl border-2 border-blue-500/30 p-6 mb-8">
              <h3 className="text-xl font-black text-blue-400 mb-4">💳 Distribución de Métodos de Pago</h3>
              <div className="space-y-3">
                {analytics.paymentMethodsArray.map((pm: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-44 flex-shrink-0">
                      <p className="text-gray-800 font-bold text-sm">
                        {pm.method === 'anticipado' ? '💰 Anticipado' :
                         pm.method === 'contraentrega-efectivo-exacto' ? '💵 Efectivo Exacto' :
                         pm.method === 'contraentrega-efectivo-cambio' ? '💵 Con Cambio' :
                         pm.method}
                      </p>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden border border-blue-500/20">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-end pr-2 transition-all duration-300"
                        style={{ width: `${(pm.count / analytics.currentMonthOrdersCount) * 100}%` }}
                      >
                        <span className="text-gray-700 font-black text-xs">{pm.count}</span>
                      </div>
                    </div>
                    <div className="w-14 text-right flex-shrink-0">
                      <span className="text-cyan-400 font-black text-sm">{((pm.count / analytics.currentMonthOrdersCount) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>



          </section>
        </>
      ) : activeTab === "financial" ? (
        /* Financial Tab */
        <>
          <section className="px-6 py-8">
            <h2 className="text-3xl font-black text-gray-700  mb-6">💰 Módulo Financiero</h2>

            {/* Sub-tabs del Módulo Financiero */}
            <div className="flex gap-2 mb-8 border-b-2 border-gray-100">
              <button
                onClick={() => setFinancialSection("dashboard")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  financialSection === "dashboard"
                    ? "text-gray-700 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setFinancialSection("purchases")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  financialSection === "purchases"
                    ? "text-gray-700 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                🛒 Compras y Gastos
              </button>
              {/* Stock de Empaques ELIMINADO - Sistema ahora es 100% manual */}
            </div>

            {/* DASHBOARD FINANCIERO */}
            {financialSection === "dashboard" && (() => {
              // Normaliza: quita tildes, mayúsculas, espacios extra
              const normalize = (s: string) =>
                s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

              const saleProducts = products.filter((p: any) => p.type === "sale");

              // Filtrar pedidos entregados por fecha (excluir canjes de ventas reales)
              let deliveredOrders = orders.filter((o: any) =>
                !o.isCanje &&
                (o.status === "delivered" || o.status === "Entregado" || o.status?.toLowerCase() === "entregado")
              );

              if (isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo) {
                const fromDate = new Date(dashboardDateFrom + "T00:00:00-05:00");
                const toDate = new Date(dashboardDateTo + "T23:59:59-05:00");
                deliveredOrders = deliveredOrders.filter((o: any) => {
                  const orderDate = getPeruDate(o.createdAt);
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

              // ============================================
              // FLUJO DE CAJA REAL - Dinero que entra vs sale
              // ============================================

              // 💰 INGRESOS: Dinero que entra (Ventas)
              const totalVentas = deliveredOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

              // 💸 EGRESOS: Dinero que sale (Compras REALES registradas)
              let filteredPurchases = inventory;
              if (isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo) {
                filteredPurchases = inventory.filter((purchase: any) => {
                  const d = (purchase.purchaseDate || "").slice(0, 10);
                  return d >= dashboardDateFrom && d <= dashboardDateTo;
                });
              }

              // Separar COMPRAS REALES por categoría
              const comprasInsumos = filteredPurchases
                .filter(p => (p.category || "operativos") === "operativos")
                .reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);

              const gastosFijos = filteredPurchases
                .filter(p => (p.category || "operativos") === "fijos")
                .reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);

              const gastosPersonal = filteredPurchases
                .filter(p => (p.category || "operativos") === "personal")
                .reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);

              const gastosMarketing = filteredPurchases
                .filter(p => (p.category || "operativos") === "marketing")
                .reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);

              const totalCompras = comprasInsumos + gastosFijos + gastosPersonal + gastosMarketing;

              // 💰 CAJA CORRIENTE
              // El snapshot representa el saldo REAL en un momento dado.
              // Solo sumamos/restamos transacciones ocurridas DESPUÉS de ese momento exacto.
              const cajaSnapshot = cajaData?.snapshotBalance || 0;
              const cajaSnapshotDate = cajaData?.snapshotDate || "";
              const cajaSnapshotTs = cajaData?.snapshotCreatedAt || "";
              const ventasDesdeSnapshot = cajaSnapshotTs
                ? orders.filter((o: any) =>
                    !o.isCanje &&
                    (o.status === "delivered" || o.status === "Entregado" || o.status?.toLowerCase() === "entregado") &&
                    (o.createdAt || "") > cajaSnapshotTs
                  ).reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0)
                : 0;
              const pagosDesdeSnapshot = cajaSnapshotTs
                ? inventory.filter((p: any) =>
                    (p.createdAt || "") > cajaSnapshotTs
                  ).reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0)
                : 0;
              const cajaActual = cajaSnapshot + ventasDesdeSnapshot - pagosDesdeSnapshot;

              // 📊 INDICADORES DE FLUJO DE CAJA
              const cajaUtilidad = totalVentas - totalCompras; // Dinero real que queda
              const margenCaja = totalVentas > 0 ? (cajaUtilidad / totalVentas) * 100 : 0; // % de utilidad sobre ventas
              const recuperacionCapital = totalCompras > 0 ? (totalVentas / totalCompras) * 100 : 0; // Cuánto recuperaste de lo invertido
              const roi = totalCompras > 0 ? (cajaUtilidad / totalCompras) * 100 : 0; // Retorno sobre inversión

              return (
                <div>
                  {/* Header con filtros */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Dashboard Financiero</h3>
                      {isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo ? (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {new Date(dashboardDateFrom + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(dashboardDateTo + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-0.5">Histórico completo</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setDashboardDateFrom(today);
                            setDashboardDateTo(today);
                            setIsDashboardDateFiltered(true);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isDashboardDateFiltered && dashboardDateFrom === new Date().toISOString().split('T')[0] && dashboardDateTo === new Date().toISOString().split('T')[0] ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
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
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        >
                          Este mes
                        </button>
                        <button
                          onClick={() => {
                            setDashboardDateFrom("");
                            setDashboardDateTo("");
                            setIsDashboardDateFiltered(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${!isDashboardDateFiltered ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                        >
                          Histórico
                        </button>
                      </div>

                      <div className="flex gap-2 items-center text-xs">
                        <input
                          type="date"
                          value={dashboardDateFrom}
                          onChange={(e) => {
                            setDashboardDateFrom(e.target.value);
                            if (e.target.value && dashboardDateTo) setIsDashboardDateFiltered(true);
                          }}
                          className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 text-xs focus:outline-none focus:border-gray-400"
                        />
                        <span className="text-gray-300">—</span>
                        <input
                          type="date"
                          value={dashboardDateTo}
                          onChange={(e) => {
                            setDashboardDateTo(e.target.value);
                            if (dashboardDateFrom && e.target.value) setIsDashboardDateFiltered(true);
                          }}
                          className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 text-xs focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ===== NIVEL 1: KPIs PRINCIPALES ===== */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Ventas */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ventas</p>
                      <p className="text-3xl font-black text-gray-900">S/ {totalVentas.toFixed(0)}</p>
                      <p className="text-xs text-gray-400 mt-2">{deliveredOrders.length} pedidos entregados</p>
                    </div>

                    {/* Gastos */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Gastos</p>
                      <p className="text-3xl font-black text-gray-900">S/ {totalCompras.toFixed(0)}</p>
                      <p className="text-xs text-gray-400 mt-2">{filteredPurchases.length} compras registradas</p>
                    </div>

                    {/* Utilidad */}
                    <div className={`bg-white border rounded-xl p-5 ${cajaUtilidad >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Utilidad</p>
                      <p className={`text-3xl font-black ${cajaUtilidad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        S/ {cajaUtilidad.toFixed(0)}
                      </p>
                      <p className={`text-xs mt-2 font-medium ${cajaUtilidad >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {margenCaja.toFixed(1)}% margen sobre ventas
                      </p>
                    </div>

                    {/* Ticket promedio */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ticket promedio</p>
                      <p className="text-3xl font-black text-gray-900">
                        S/ {deliveredOrders.length > 0 ? (totalVentas / deliveredOrders.length).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">por pedido</p>
                    </div>
                  </div>

                  {/* ===== NIVEL 2: CAJA + DESGLOSE EGRESOS ===== */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

                    {/* CAJA CORRIENTE */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Caja actual</p>
                          <p className={`text-4xl font-black ${cajaActual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            S/ {cajaActual.toFixed(2)}
                          </p>
                          {cajaData ? (
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Base ({new Date(cajaData.snapshotDate + "T12:00:00").toLocaleDateString("es-PE")})</span>
                                <span className="font-semibold text-gray-700">S/ {cajaSnapshot.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>+ Ventas posteriores</span>
                                <span className="font-semibold text-emerald-600">S/ {ventasDesdeSnapshot.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>− Pagos realizados</span>
                                <span className="font-semibold text-red-500">S/ {pagosDesdeSnapshot.toFixed(2)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-3">Configura el saldo inicial para llevar la caja.</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {!cajaEditMode ? (
                            <button
                              onClick={() => {
                                setCajaEditBalance(cajaData ? String(cajaData.snapshotBalance) : "");
                                setCajaEditDate(cajaData?.snapshotDate || new Date().toLocaleDateString("en-CA"));
                                setCajaEditMode(true);
                              }}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                            >
                              {cajaData ? "Ajustar" : "Configurar"}
                            </button>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 min-w-[220px]">
                              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Establecer base</p>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Saldo en caja (S/)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={cajaEditBalance}
                                  onChange={(e) => setCajaEditBalance(e.target.value)}
                                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-gray-500 focus:outline-none"
                                  placeholder="521.80"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Fecha de corte</label>
                                <input
                                  type="date"
                                  value={cajaEditDate}
                                  onChange={(e) => setCajaEditDate(e.target.value)}
                                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-gray-500 focus:outline-none [color-scheme:light]"
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={saveCajaSnapshot}
                                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-1.5 rounded-lg text-sm font-bold"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setCajaEditMode(false)}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                              <p className="text-xs text-gray-400">Las ventas y pagos posteriores se suman/restan automáticamente.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DESGLOSE EGRESOS */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Desglose de gastos</p>
                      <div className="space-y-2">
                        {[
                          { label: "Insumos operativos", value: comprasInsumos },
                          { label: "Gastos fijos", value: gastosFijos },
                          { label: "Personal", value: gastosPersonal },
                          { label: "Marketing", value: gastosMarketing },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 flex-1">{label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-gray-400 rounded-full"
                                style={{ width: totalCompras > 0 ? `${(value / totalCompras) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 w-20 text-right">S/ {value.toFixed(0)}</span>
                          </div>
                        ))}
                        <div className="pt-2 mt-1 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-700">Total gastos</span>
                          <span className="text-sm font-black text-gray-900">S/ {totalCompras.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ===== NIVEL 3: RECUPERACIÓN ===== */}
                  <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recuperación de inversión</p>
                      <span className={`text-sm font-black ${recuperacionCapital >= 100 ? 'text-emerald-600' : 'text-gray-700'}`}>
                        {recuperacionCapital.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${recuperacionCapital >= 100 ? 'bg-emerald-500' : 'bg-gray-400'}`}
                        style={{ width: `${Math.min(recuperacionCapital, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>
                        {recuperacionCapital >= 100
                          ? `Excedente: S/ ${(totalVentas - totalCompras).toFixed(2)}`
                          : `Falta recuperar: S/ ${(totalCompras - totalVentas).toFixed(2)}`}
                      </span>
                      <span>ROI: {roi.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Aviso */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-700 mb-1">Registra todas tus compras para ver datos reales</p>
                    <p className="text-xs text-amber-600">
                      Si no has registrado compras de ingredientes (pollo, lechuga, pan, salsas, gas, etc.), tu utilidad estará inflada.
                      Ve a <strong>Compras y Gastos</strong> y registra cada gasto.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* COMPRAS Y GASTOS */}
            {financialSection === "purchases" && (
              <>
                {(() => {
                  // Filtrar inventario usando LOS MISMOS FILTROS del Dashboard
                  let filteredInventory = inventory;

                  // Aplicar el mismo filtro de fechas que usa el Dashboard
                  if (isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo) {
                    const fromDate = new Date(dashboardDateFrom + "T00:00:00-05:00");
                    const toDate = new Date(dashboardDateTo + "T23:59:59-05:00");
                    filteredInventory = filteredInventory.filter((purchase: any) => {
                      const purchaseDate = getPeruDate(purchase.purchaseDate);
                      return purchaseDate >= fromDate && purchaseDate <= toDate;
                    });
                  }

                  // Filtro por categoría
                  if (inventoryCategoryFilter !== "all") {
                    const purchaseCategory = (purchase: any) => purchase.category || "operativos";
                    filteredInventory = filteredInventory.filter((purchase: any) => {
                      return purchaseCategory(purchase) === inventoryCategoryFilter;
                    });
                  }

                  // Filtro por búsqueda en tiempo real (nombre, proveedor, método de pago)
                  if (inventorySearchTerm) {
                    const searchLower = inventorySearchTerm.toLowerCase();
                    filteredInventory = filteredInventory.filter((purchase: any) => {
                      const hasMatchingProduct = purchase.items.some((item: any) =>
                        item.productName.toLowerCase().includes(searchLower)
                      );
                      const hasMatchingSupplier = purchase.supplier?.toLowerCase().includes(searchLower);
                      const hasMatchingPhone = purchase.supplierPhone?.includes(inventorySearchTerm);
                      const hasMatchingPayment = purchase.paymentMethod?.toLowerCase().includes(searchLower);

                      return hasMatchingProduct || hasMatchingSupplier || hasMatchingPhone || hasMatchingPayment;
                    });
                  }

                  // Filtro por estado de liquidación
                  if (liquidadoFilter !== 'all') {
                    filteredInventory = filteredInventory.filter((purchase: any) =>
                      liquidadoFilter === 'liquidado' ? !!purchase.liquidado : !purchase.liquidado
                    );
                  }

                  return (
                    <>
                <div className="mb-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">💰 Compras y Gastos</h3>

                    {/* Indicador de filtro sincronizado */}
                    {isDashboardDateFiltered && dashboardDateFrom && dashboardDateTo && (
                      <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-xs text-gray-500">
                        Filtrado: {new Date(dashboardDateFrom + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(dashboardDateTo + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>

                  {/* Header con botón Nueva Compra */}
                  <div className="flex justify-end items-center mb-4">
                    <button
                      onClick={() => {
                        setShowInventoryModal(true);
                        setProductSearchTerms([""]);
                      }}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold transition-all"
                    >
                      + Nueva Compra
                    </button>
                  </div>
                </div>

                {/* ========== HISTORIAL DE COMPRAS ========== */}
                  <>
                    {/* Resumen por categoría + estado de liquidación */}
                    {(() => {
                      const operativos = filteredInventory.filter(p => (p.category || "operativos") === "operativos").reduce((sum, p) => sum + p.totalAmount, 0);
                      const fijos = filteredInventory.filter(p => (p.category || "operativos") === "fijos").reduce((sum, p) => sum + p.totalAmount, 0);
                      const personal = filteredInventory.filter(p => (p.category || "operativos") === "personal").reduce((sum, p) => sum + p.totalAmount, 0);
                      const marketing = filteredInventory.filter(p => (p.category || "operativos") === "marketing").reduce((sum, p) => sum + p.totalAmount, 0);
                      const total = filteredInventory.reduce((sum, p) => sum + p.totalAmount, 0);
                      const pendiente = filteredInventory.filter((p: any) => !p.liquidado).reduce((s: number, p: any) => s + p.totalAmount, 0);
                      const liquidadoTotal = filteredInventory.filter((p: any) => !!p.liquidado).reduce((s: number, p: any) => s + p.totalAmount, 0);
                      const nPendiente = filteredInventory.filter((p: any) => !p.liquidado).length;
                      const nLiquidado = filteredInventory.filter((p: any) => !!p.liquidado).length;

                      return (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                          {/* Categorías */}
                          <div className="bg-white border border-gray-100 rounded-xl p-4 col-span-2 lg:col-span-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Gastos por categoría</p>
                            <div className="space-y-2">
                              {[
                                { label: "Operativos", value: operativos },
                                { label: "Fijos", value: fijos },
                                { label: "Personal", value: personal },
                                { label: "Marketing", value: marketing },
                              ].map(({ label, value }) => (
                                <div key={label} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-24">{label}</span>
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="h-full bg-gray-400 rounded-full"
                                      style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 w-20 text-right">S/ {value.toFixed(0)}</span>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-gray-100 flex justify-between">
                                <span className="text-xs font-bold text-gray-700">Total</span>
                                <span className="text-sm font-black text-gray-900">S/ {total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Pendiente reembolso */}
                          <div className="bg-white border border-amber-100 rounded-xl p-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pendiente</p>
                            <p className="text-2xl font-black text-amber-600">S/ {pendiente.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 mt-2">{nPendiente} gasto{nPendiente !== 1 ? 's' : ''} sin liquidar</p>
                          </div>

                          {/* Liquidado */}
                          <div className="bg-white border border-emerald-100 rounded-xl p-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Liquidado</p>
                            <p className="text-2xl font-black text-emerald-600">S/ {liquidadoTotal.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 mt-2">{nLiquidado} gasto{nLiquidado !== 1 ? 's' : ''} reembolsado{nLiquidado !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Filtros */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => setInventoryCategoryFilter("all")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          inventoryCategoryFilter === "all"
                            ? "bg-fuchsia-600 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setInventoryCategoryFilter("operativos")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          inventoryCategoryFilter === "operativos"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        🍖 Operativos
                      </button>
                      <button
                        onClick={() => setInventoryCategoryFilter("fijos")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          inventoryCategoryFilter === "fijos"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        🏢 Fijos
                      </button>
                      <button
                        onClick={() => setInventoryCategoryFilter("personal")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          inventoryCategoryFilter === "personal"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        👥 Personal
                      </button>
                      <button
                        onClick={() => setInventoryCategoryFilter("marketing")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          inventoryCategoryFilter === "marketing"
                            ? "bg-orange-600 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        📢 Marketing
                      </button>
                      {/* Separador visual */}
                      <span className="w-px bg-gray-200 self-stretch mx-1" />
                      <button
                        onClick={() => setLiquidadoFilter('all')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          liquidadoFilter === 'all'
                            ? "bg-gray-600 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        Todos los estados
                      </button>
                      <button
                        onClick={() => setLiquidadoFilter('pendiente')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          liquidadoFilter === 'pendiente'
                            ? "bg-amber-600 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        ⏳ Pendientes
                      </button>
                      <button
                        onClick={() => setLiquidadoFilter('liquidado')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          liquidadoFilter === 'liquidado'
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        ✅ Liquidados
                      </button>
                    </div>

                {/* Buscador en tiempo real */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Buscar por producto, proveedor, teléfono o método de pago..."
                      value={inventorySearchTerm}
                      onChange={(e) => setInventorySearchTerm(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none text-sm"
                    />
                    {inventorySearchTerm && (
                      <button
                        onClick={() => setInventorySearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {inventorySearchTerm && (
                    <p className="text-xs text-gray-700 mt-2">
                      📊 Mostrando {filteredInventory.length} resultado{filteredInventory.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Inventory List - Formato Tabla Excel */}
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                  {filteredInventory.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xl text-gray-400">
                        {inventorySearchTerm ? `No se encontraron resultados para "${inventorySearchTerm}"` : 'No hay compras en este mes'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-left">FECHA</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-left">PROVEEDOR</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-center">CATEGORÍA</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-left">PRODUCTO</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-center">CANTIDAD</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-center">UND</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-center">PAGO</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-right">TOTAL</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-right">COSTO UNITARIO</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-center">ESTADO</th>
                            <th className="border border-gray-200 px-3 py-2 text-xs font-bold text-gray-400 text-center">ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory.map((purchase) =>
                            purchase.items.map((item: any, itemIdx: number) => (
                              <tr key={`${purchase.id}-${itemIdx}`} className="hover:bg-gray-50 transition-all">
                                <td className="border border-gray-200 px-3 py-2 text-xs text-gray-500">
                                  {new Date(purchase.purchaseDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  <p className="text-xs font-bold text-gray-600">{purchase.supplier}</p>
                                  {purchase.supplierPhone && <p className="text-xs text-gray-500">{purchase.supplierPhone}</p>}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-center">
                                  {(() => {
                                    const category = purchase.category || "operativos";
                                    const categoryConfig: Record<string, {icon: string, color: string, label: string}> = {
                                      operativos: { icon: "🍖", color: "text-blue-400", label: "Operativos" },
                                      fijos: { icon: "🏢", color: "text-purple-400", label: "Fijos" },
                                      personal: { icon: "👥", color: "text-green-400", label: "Personal" },
                                      marketing: { icon: "📢", color: "text-orange-400", label: "Marketing" }
                                    };
                                    const config = categoryConfig[category] || categoryConfig.operativos;
                                    return (
                                      <span className={`text-xs font-bold ${config.color}`}>
                                        {config.icon} {config.label}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-xs text-gray-800 font-bold">
                                  {item.productName || '-'}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-center text-xs text-gray-700">
                                  {item.originalQuantity || item.quantity}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-center text-xs text-gray-500">
                                  {item.unit}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-center text-xs text-gray-500 font-medium">
                                  {purchase.paymentMethod === 'plin-yape' && 'PLIN-YAPE'}
                                  {purchase.paymentMethod === 'efectivo' && 'EFECTIVO'}
                                  {purchase.paymentMethod === 'transferencia' && 'TRANSFERENCIA'}
                                  {purchase.paymentMethod === 'tarjeta' && 'TARJETA'}
                                </td>
                                {(() => {
                                  // Operativos: unitCost=total pagado, total=costo/unidad (fórmula inversa)
                                  // Marketing/Personal/Fijos: unitCost=costo/unidad, total=total pagado
                                  const isOperativos = (purchase.category || "operativos") === "operativos";
                                  const displayTotal = isOperativos ? item.unitCost : item.total;
                                  const displayUnit  = isOperativos ? item.total    : item.unitCost;
                                  return (
                                    <>
                                      <td className="border border-gray-200 px-3 py-2 text-right">
                                        <p className="text-xs font-bold text-gray-700">S/ {displayTotal.toFixed(2)}</p>
                                      </td>
                                      <td className="border border-gray-200 px-3 py-2 text-right">
                                        <p className="text-xs font-semibold text-gray-500">S/ {displayUnit.toFixed(2)}</p>
                                      </td>
                                    </>
                                  );
                                })()}
                                {itemIdx === 0 ? (
                                  <td
                                    className="border border-gray-200 px-2 py-2 text-center"
                                    rowSpan={purchase.items.length}
                                  >
                                    <button
                                      onClick={() => toggleLiquidado(purchase.id, !!(purchase as any).liquidado)}
                                      title={(purchase as any).liquidado ? 'Marcar como pendiente' : 'Marcar como liquidado'}
                                      className={`flex flex-col items-center gap-0.5 mx-auto px-2 py-1.5 rounded-lg border transition-all active:scale-95 min-w-[80px] ${
                                        (purchase as any).liquidado
                                          ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                                          : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                                      }`}
                                    >
                                      <span className="text-base leading-none">
                                        {(purchase as any).liquidado ? '✅' : '⏳'}
                                      </span>
                                      <span className={`text-[10px] font-black uppercase leading-none mt-0.5 ${
                                        (purchase as any).liquidado ? 'text-emerald-600' : 'text-amber-600'
                                      }`}>
                                        {(purchase as any).liquidado ? 'Liquidado' : 'Pendiente'}
                                      </span>
                                    </button>
                                  </td>
                                ) : null}
                                <td className="border border-gray-200 px-3 py-2 text-center">
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
                    <div className="bg-white rounded-xl border-2 border-fuchsia-500 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-black text-gray-700">Detalle de Compra</h3>
                        <button
                          onClick={() => setShowInventoryDetailModal(false)}
                          className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Información del Proveedor */}
                      <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-700 mb-3">📋 Información del Proveedor</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400">Proveedor:</p>
                            <p className="text-gray-800 font-bold">{selectedPurchaseDetail.supplier}</p>
                          </div>
                          {selectedPurchaseDetail.supplierRuc && (
                            <div>
                              <p className="text-gray-400">RUC:</p>
                              <p className="text-gray-800 font-bold">{selectedPurchaseDetail.supplierRuc}</p>
                            </div>
                          )}
                          {selectedPurchaseDetail.supplierPhone && (
                            <div>
                              <p className="text-gray-400">Teléfono:</p>
                              <p className="text-gray-800 font-bold">{selectedPurchaseDetail.supplierPhone}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400">Fecha de Compra:</p>
                            <p className="text-gray-800 font-bold">
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
                      <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-cyan-500/30">
                        <h4 className="text-sm font-bold text-cyan-400 mb-3">🛒 Productos Comprados</h4>
                        <div className="space-y-2">
                          {selectedPurchaseDetail.items.map((item: any, idx: number) => {
                            const isOperativos = (selectedPurchaseDetail.category || "operativos") === "operativos";
                            const displayTotal = isOperativos ? item.unitCost : item.total;
                            const displayUnit  = isOperativos ? item.total    : item.unitCost;
                            return (
                              <div key={idx} className="flex justify-between items-center bg-white rounded px-3 py-2">
                                <div className="flex-1">
                                  <p className="text-gray-800 font-bold text-sm">{item.productName}</p>
                                  <p className="text-xs text-gray-400">
                                    {item.originalQuantity || item.quantity} {item.unit} x S/ {displayUnit.toFixed(2)}
                                  </p>
                                </div>
                                <p className="text-gray-700 font-bold">S/ {displayTotal.toFixed(2)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Total y Notas */}
                      <div className="bg-gray-100 rounded-lg p-4 border border-amber-500/30">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-gray-400">Total de la Compra:</p>
                          <p className="text-2xl font-black text-amber-400">S/ {selectedPurchaseDetail.totalAmount.toFixed(2)}</p>
                        </div>
                        {selectedPurchaseDetail.notes && (
                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <p className="text-gray-400 text-xs mb-1">Notas:</p>
                            <p className="text-gray-700 text-sm">{selectedPurchaseDetail.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                  </>
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

              // --- Rendimiento: cruzar catálogo con pedidos entregados (excluir canjes) ---
              let deliveredOrders = orders.filter((o: any) =>
                !o.isCanje &&
                (o.status === "delivered" || o.status === "Entregado" || o.status?.toLowerCase() === "entregado")
              );

              // Filtro por fechas
              if (isSalesDateFiltered && salesDateFrom && salesDateTo) {
                const fromDate = new Date(salesDateFrom + "T00:00:00-05:00");
                const toDate = new Date(salesDateTo + "T23:59:59-05:00");
                deliveredOrders = deliveredOrders.filter((o: any) => {
                  const orderDate = getPeruDate(o.createdAt);
                  return orderDate >= fromDate && orderDate <= toDate;
                });
              }
              // Mapa nombre normalizado → { qty, revenue, originalName }
              const soldMap: Record<string, { qty: number; revenue: number; originalName: string }> = {};
              const addToSoldMap = (name: string, qty: number, revenue: number) => {
                const key = normalize(name);
                if (!key) return;
                if (!soldMap[key]) soldMap[key] = { qty: 0, revenue: 0, originalName: name };
                soldMap[key].qty += qty;
                soldMap[key].revenue += revenue;
              };

              deliveredOrders.forEach((order: any) => {
                const items = order.completedOrders || order.cart || [];
                const couponFactor = 1 - (order.couponDiscount || 0) / 100;
                items.forEach((item: any) => {
                  // 1. Menú principal (Pequeño Dilema, Dúo Dilema, Santo Pecado, ensaladas)
                  const menuName = item.name || item.product?.name || "";
                  const qty = item.quantity || 0;
                  const price = (item.finalPrice ?? item.price ?? item.product?.price ?? 0) * couponFactor;
                  if (menuName) addToSoldMap(menuName, qty, price * qty);

                  // 2. Complementos y extras pagados (bebidas, papas extras, salsas extras)
                  // NO incluye salsas base que vienen con el menú
                  const compIds: string[] = item.complementIds || [];
                  compIds.forEach((compId: string) => {
                    const comp = availableComplements[compId];
                    if (comp) addToSoldMap(comp.name, 1, comp.price);
                  });
                });
              });

              // Construir filas de rendimiento: TODOS los productos vendidos
              const perfRowsMap = new Map<string, any>();

              // 1. Primero agregar productos del catálogo (con costo conocido)
              saleProducts.forEach((p: any) => {
                const key = normalize(p.name || "");
                const sold = soldMap[key] || { qty: 0, revenue: 0 };
                const cost = p.cost || 0;
                const totalCost = cost * sold.qty;
                const netProfit = sold.revenue - totalCost;
                const margin = cost > 0 ? (sold.qty > 0 ? (netProfit / totalCost) * 100 : ((p.price - cost) / cost) * 100) : 0;
                perfRowsMap.set(key, { ...p, sold: sold.qty, revenue: sold.revenue, totalCost, netProfit, margin });
              });

              // 2. Agregar items vendidos que NO están en el catálogo (complementos, extras)
              Object.keys(soldMap).forEach((key) => {
                if (!perfRowsMap.has(key)) {
                  const sold = soldMap[key];
                  const originalName = sold.originalName || key;

                  // Detectar venta histórica del día de apertura
                  const isHistoricalSale = originalName.toLowerCase().includes("venta") &&
                                          (originalName.toLowerCase().includes("apertura") ||
                                           originalName.toLowerCase().includes("histórica") ||
                                           originalName.toLowerCase().includes("historica"));

                  // Buscar en availableComplements o products sin filtrar
                  const complement = Object.values(availableComplements).find(
                    (c: any) => c && c.name && normalize(c.name) === key
                  );
                  const productMatch = products.find((p: any) => p && p.name && normalize(p.name) === key);

                  const product = complement || productMatch;

                  // Si es venta histórica, asignar 50% del revenue como costo
                  const cost = isHistoricalSale
                    ? (sold.revenue * 0.5) / sold.qty  // 50% del total como costo unitario
                    : (product?.cost || 0);

                  const price = product?.price || (sold.qty > 0 ? sold.revenue / sold.qty : 0);
                  const category = product?.category || "complemento";

                  const totalCost = cost * sold.qty;
                  const netProfit = sold.revenue - totalCost;
                  const margin = cost > 0 ? (sold.qty > 0 ? (netProfit / totalCost) * 100 : 0) : 0;

                  perfRowsMap.set(key, {
                    id: key,
                    name: originalName,
                    category,
                    price,
                    cost,
                    sold: sold.qty,
                    revenue: sold.revenue,
                    totalCost,
                    netProfit,
                    margin,
                    type: "sale"
                  });
                }
              });

              const perfRows = Array.from(perfRowsMap.values()).sort((a: any, b: any) => b.sold - a.sold);

              // KPIs globales - Calcular revenue directo de pedidos (más preciso)
              const totalRevenue = deliveredOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
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
                        className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm"
                      >
                        + Nuevo Producto
                      </button>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-black/60 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">Categoría</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-green-400 uppercase">Precio Venta</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-red-400 uppercase">Costo</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-purple-400 uppercase">Margen</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>
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
                                <tr key={product.id} className={`border-b border-gray-100 hover:bg-fuchsia-500/5 transition-all ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                                  <td className="px-4 py-3 text-gray-800 font-bold text-sm">{product.name}</td>
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
                    <div className="bg-white rounded-lg border-2 border-amber-500/30 p-4 mb-5">
                      <div className="flex flex-col gap-3">
                        {/* Indicador período activo */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Mostrando:</span>
                          {isSalesDateFiltered && salesDateFrom && salesDateTo ? (
                            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold">
                              📅 {new Date(salesDateFrom + "T12:00:00").toLocaleDateString("es-PE", { day: '2-digit', month: 'short' })} - {new Date(salesDateTo + "T12:00:00").toLocaleDateString("es-PE", { day: '2-digit', month: 'short' })}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-200 border border-gray-300 rounded-full text-gray-500 text-xs font-bold">
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
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold text-xs"
                          >
                            Ver histórico
                          </button>

                          <div className="w-px h-6 bg-gray-200 mx-1"></div>

                          {/* Date pickers */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400">Desde:</label>
                            <input
                              type="date"
                              value={salesDateFrom}
                              onChange={(e) => setSalesDateFrom(e.target.value)}
                              className="px-2 py-1 text-xs rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none [color-scheme:light]"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400">Hasta:</label>
                            <input
                              type="date"
                              value={salesDateTo}
                              onChange={(e) => setSalesDateTo(e.target.value)}
                              className="px-2 py-1 text-xs rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none [color-scheme:light]"
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
                      <div className="bg-white rounded-xl border border-green-500/40 p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Ingresos Totales</p>
                        <p className="text-xl font-black text-green-400">S/ {totalRevenue.toFixed(2)}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-red-500/40 p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Costo Total</p>
                        <p className="text-xl font-black text-red-400">S/ {totalCostAll.toFixed(2)}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-amber-500/40 p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Utilidad Operativa</p>
                        <p className={`text-xl font-black ${totalProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>S/ {totalProfit.toFixed(2)}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-purple-500/40 p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Margen Promedio</p>
                        <p className={`text-xl font-black ${avgMargin >= 50 ? 'text-green-400' : avgMargin >= 30 ? 'text-amber-400' : 'text-red-400'}`}>{avgMargin.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Tabla de rendimiento */}
                    <div className="bg-white rounded-xl border-2 border-amber-500/30 overflow-hidden">
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
                              <tr key={row.id} className={`border-b border-amber-500/10 hover:bg-amber-500/5 transition-all ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                                <td className="px-4 py-3 text-gray-800 font-bold text-sm">{row.name}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-gray-700 font-black text-sm">{row.sold}</span>
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
                              <td className="px-4 py-3 text-gray-800 font-black text-sm">TOTAL</td>
                              <td className="px-4 py-3 text-center text-gray-700 font-black text-sm">
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
              <div className="bg-white rounded-xl border-2 border-purple-500 p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
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
                    className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
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
                    <div className="bg-gray-100 rounded-lg border-2 border-purple-500/30 p-8 text-center">
                      <p className="text-gray-400 text-lg">No hay componentes configurados</p>
                      <p className="text-gray-500 text-sm mt-2">Haz clic en "Agregar Componente" para empezar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-gray-100 rounded-lg border border-purple-500/30">
                        <div className="col-span-4 text-xs font-bold text-purple-400">INGREDIENTE/EMPAQUE</div>
                        <div className="col-span-2 text-xs font-bold text-purple-400">CANTIDAD</div>
                        <div className="col-span-2 text-xs font-bold text-purple-400">UNIDAD</div>
                        <div className="col-span-3 text-xs font-bold text-purple-400">COSTO (S/)</div>
                        <div className="col-span-1 text-xs font-bold text-purple-400 text-center"></div>
                      </div>

                      {/* Components - MANUAL INPUT */}
                      {recipeComponents.map((component, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-gray-100 rounded-lg p-3 border border-purple-500/20">
                          {/* Nombre del ingrediente/empaque - INPUT MANUAL */}
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={component.productName || ""}
                              onChange={(e) => updateRecipeComponent(idx, 'productName', e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 rounded bg-white border border-purple-200 text-gray-900 text-sm focus:border-purple-400 focus:outline-none"
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
                              className="w-full px-3 py-2 rounded bg-white border border-purple-200 text-gray-900 text-sm text-center focus:border-purple-400 focus:outline-none"
                              placeholder="0"
                            />
                          </div>

                          {/* Unidad - SELECT MANUAL */}
                          <div className="col-span-2">
                            <select
                              value={component.unit || ""}
                              onChange={(e) => updateRecipeComponent(idx, 'unit', e.target.value)}
                              className="w-full px-3 py-2 rounded bg-white border border-purple-200 text-gray-900 text-sm focus:border-purple-400 focus:outline-none"
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
                              className="w-full px-3 py-2 rounded bg-white border border-purple-200 text-gray-900 text-sm focus:border-purple-400 focus:outline-none"
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
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveRecipe}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition-all "
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
              <div className="bg-white rounded-xl border-2 border-fuchsia-500 p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-black text-gray-700">
                    {editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                  </h3>
                  <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none text-sm"
                      placeholder="Ej: PEQUEÑO DILEMA, COCA-COLA, EXTRA PAPAS"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoría *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none text-sm"
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
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-green-500/30 text-green-400 focus:border-green-400 focus:outline-none text-sm font-bold"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-red-400 uppercase mb-1">Costo (S/) *</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={productForm.cost}
                        onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-red-500/30 text-red-400 focus:border-red-400 focus:outline-none text-sm font-bold"
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
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    className="flex-1 bg-white hover:bg-gray-800 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
                </div>
              </div>
            </div>
            );
          })()}

            {/* CANJES eliminado */}
            {false && (() => {
              const canjeOrders = orders.filter((o: any) => o.isCanje);
              const nonCanjeOrders = orders.filter((o: any) => !o.isCanje);

              return (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-orange-400 mb-1">🎁 Gestión de Canjes / Cortesías</h3>
                    <p className="text-gray-500 text-sm">
                      Las órdenes marcadas como canje <span className="text-orange-300 font-bold">no se contabilizan en las ventas</span>. Uso interno — el equipo de cocina no ve esta clasificación.
                    </p>
                  </div>

                  {/* Resumen */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-orange-500/10 rounded-xl border border-orange-500/30 p-4">
                      <p className="text-orange-400 text-xs font-black uppercase tracking-wider mb-1">Canjes hoy</p>
                      <p className="text-orange-400 text-3xl font-black">{analytics.dailyCanjeCount}</p>
                      <p className="text-orange-300 text-sm font-bold mt-1">S/ {(analytics.dailyCanjeValue || 0).toFixed(2)} valor referencial</p>
                    </div>
                    <div className="bg-orange-500/10 rounded-xl border border-orange-500/30 p-4">
                      <p className="text-orange-400 text-xs font-black uppercase tracking-wider mb-1">Canjes este mes</p>
                      <p className="text-orange-400 text-3xl font-black">{analytics.monthlyCanjeCount}</p>
                      <p className="text-orange-300 text-sm font-bold mt-1">S/ {(analytics.monthlyCanjeValue || 0).toFixed(2)} valor referencial</p>
                    </div>
                    <div className="bg-orange-500/10 rounded-xl border border-orange-500/30 p-4">
                      <p className="text-orange-400 text-xs font-black uppercase tracking-wider mb-1">Total histórico</p>
                      <p className="text-orange-400 text-3xl font-black">{analytics.totalCanjeCount}</p>
                      <p className="text-orange-300 text-sm font-bold mt-1">S/ {(analytics.totalCanjeValue || 0).toFixed(2)} valor referencial</p>
                    </div>
                  </div>

                  {/* Lista de canjes */}
                  {canjeOrders.length > 0 && (
                    <div className="mb-10">
                      <h4 className="text-sm font-black text-orange-400 uppercase tracking-wider mb-3">Órdenes marcadas como canje ({canjeOrders.length})</h4>
                      <div className="space-y-2">
                        {canjeOrders.map((order: any) => (
                          <div key={order.id} className="bg-white rounded-xl border border-orange-500/40 p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-orange-400 font-black text-xs">🎁 CANJE</span>
                                <span className="text-gray-400 text-xs font-mono">{order.id}</span>
                                <span className="text-gray-500 text-xs">
                                  {new Date(order.createdAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
                                </span>
                              </div>
                              <p className="text-gray-800 font-bold text-sm truncate">{order.name}</p>
                              {order.canjeNote && (
                                <p className="text-orange-300 text-xs mt-0.5 italic">"{order.canjeNote}"</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(order.cart || []).slice(0, 3).map((item: any, idx: number) => (
                                  <span key={idx} className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {item.name || item.product?.name} x{item.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-orange-400 font-black text-lg">S/ {(order.totalPrice || 0).toFixed(2)}</p>
                              <button
                                onClick={() => handleToggleCanje(order.id, false, "")}
                                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-3 py-1 rounded-lg mt-1 font-bold"
                              >
                                ↩ Desmarcar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marcar órdenes como canje */}
                  <div>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Marcar una orden como canje</h4>
                    <p className="text-gray-600 text-xs mb-4">Selecciona la orden y confirma para excluirla de las ventas.</p>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {nonCanjeOrders.slice(0, 50).map((order: any) => (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-gray-400 text-xs font-mono">{order.id}</span>
                              <span className="text-gray-500 text-xs">
                                {new Date(order.createdAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                                order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                                order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>{order.status}</span>
                            </div>
                            <p className="text-gray-800 font-bold text-sm truncate">{order.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(order.cart || []).slice(0, 3).map((item: any, idx: number) => (
                                <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {item.name || item.product?.name} x{item.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-gray-700 font-black text-sm">S/ {(order.totalPrice || 0).toFixed(2)}</p>
                            <button
                              onClick={() => { setCanjeModal({ orderId: order.id }); setCanjeNoteInput(""); }}
                              className="text-xs text-orange-400 border border-orange-500/40 hover:border-orange-400 px-3 py-1 rounded-lg mt-1 font-bold"
                            >
                              🎁 Marcar canje
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

        </>
      ) : activeTab === "marketing" ? (
        /* Marketing Tab */
        <>
          <section className="px-6 py-8">
            <h2 className="text-3xl font-black text-gray-700  mb-6">Promociones</h2>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-8 border-b-2 border-gray-100">
              <button
                onClick={() => setMarketingSection("promotions")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  marketingSection === "promotions"
                    ? "text-gray-700 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                🎟️ Promociones y Cupones
              </button>
              <button
                onClick={() => setMarketingSection("campaigns")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  marketingSection === "campaigns"
                    ? "text-gray-700 border-b-4 border-fuchsia-500"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                📢 Campañas de Marketing
              </button>
              <button
                onClick={() => setMarketingSection("challenge")}
                className={`px-6 py-3 font-bold transition-all text-sm ${
                  marketingSection === "challenge"
                    ? "text-red-400 border-b-4 border-red-500"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                🔥 Desafío del Cliente
              </button>
            </div>

            {marketingSection === "promotions" && (
              <>


                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Promociones Activas</h3>
                    <p className="text-gray-400 text-sm">Gestiona descuentos, cupones y ofertas especiales</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPromotion(null);
                      resetPromotionForm();
                      setShowPromotionModal(true);
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold transition-all  transform hover:scale-105"
                  >
                    + Nueva Promoción
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <p className="text-gray-400 text-sm font-semibold">Total Promociones</p>
                    <p className="text-5xl font-black text-gray-900 mt-2">{promotions.length}</p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-green-500/50 p-6">
                    <p className="text-green-400 text-sm font-bold">Activas</p>
                    <p className="text-5xl font-black text-green-400 mt-2">
                      {promotions.filter((p) => p.active).length}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-amber-500/50 p-6">
                    <p className="text-amber-400 text-sm font-bold">Uso Total</p>
                    <p className="text-5xl font-black text-amber-400 mt-2">
                      {promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-red-500/50 p-6">
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
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-2xl text-gray-400">No hay promociones creadas</p>
                    </div>
                  ) : (
                    promotions.map((promo) => {
                      const isExpired = new Date(promo.endDate) < new Date();
                      const daysLeft = Math.ceil((new Date(promo.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={promo.id} className={`bg-white rounded-xl border-2 p-6 transition-all ${promo.active ? 'border-gray-200 hover:border-fuchsia-500' : 'border-gray-200 opacity-60'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-black text-gray-900">{promo.name}</h3>
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
                                  <span className="text-gray-800 font-bold ml-2">
                                    {promo.type === 'percentage' ? `${promo.value}% DESC` :
                                     promo.type === 'fixed' ? `S/ ${promo.value} DESC` :
                                     promo.type === 'shipping' ? 'Envío Gratis' : 'Combo'}
                                  </span>
                                </div>
                                {promo.minAmount > 0 && (
                                  <div>
                                    <span className="text-gray-500">Compra mín:</span>
                                    <span className="text-gray-800 font-bold ml-2">S/ {promo.minAmount}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-500">Segmento:</span>
                                  <span className="text-gray-800 font-bold ml-2 capitalize">{promo.targetSegment}</span>
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
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
                <div className="text-center py-12">
                  <h3 className="text-2xl font-bold text-gray-700 mb-4">Campañas Segmentadas</h3>
                  <p className="text-gray-400 mb-6">
                    Crea campañas de marketing dirigidas a segmentos específicos de clientes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="bg-gray-100 rounded-lg p-6 border border-gray-100">
                      <div className="text-4xl mb-3">👑</div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">Clientes VIP</h4>
                      <p className="text-sm text-gray-400 mb-4">Promociones exclusivas para tus mejores clientes</p>
                      <p className="text-2xl font-black text-gray-700">{customerSegments.vip.length} clientes</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-6 border border-gray-100">
                      <div className="text-4xl mb-3">💤</div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">Clientes Inactivos</h4>
                      <p className="text-sm text-gray-400 mb-4">Recupera clientes que dejaron de comprar</p>
                      <p className="text-2xl font-black text-red-400">{customerSegments.inactive.length} clientes</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-6 border border-gray-100">
                      <div className="text-4xl mb-3">✨</div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">Nuevos Clientes</h4>
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
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
                <div className="text-center py-12">
                  <h3 className="text-2xl font-bold text-gray-700 mb-4">Programa de Fidelización</h3>
                  <p className="text-gray-400 mb-8">
                    Sistema de puntos y recompensas para incentivar compras recurrentes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <div className="bg-gray-100 rounded-lg p-6 border border-amber-500/30 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">⭐</span>
                        <h4 className="text-xl font-bold text-amber-400">Sistema de Puntos</h4>
                      </div>
                      <ul className="space-y-3 text-sm text-gray-500">
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
                    <div className="bg-gray-100 rounded-lg p-6 border border-purple-500/30 text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">🎁</span>
                        <h4 className="text-xl font-bold text-purple-400">Beneficios VIP</h4>
                      </div>
                      <ul className="space-y-3 text-sm text-gray-500">
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
                  <div className="mt-8 p-6 bg-fuchsia-500/10 rounded-lg border border-gray-200 max-w-2xl mx-auto">
                    <p className="text-gray-600 text-sm">
                      💡 <strong>Próximamente:</strong> Integración automática de puntos y niveles de fidelización con cada compra
                    </p>
                  </div>
                </div>
              </div>
            )}

            {marketingSection === "challenge" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border-2 border-red-500/30 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-red-400 flex items-center gap-2">🔥 Desafío del Cliente — Marzo 2026</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Termómetro de ventas visible en las páginas FAT, FIT y Home. Sorteo: sábado 28 de marzo.
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-black ${challengeData.active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-200/50 text-gray-400 border border-gray-300'}`}>
                      {challengeData.active ? '● ACTIVO' : '○ INACTIVO'}
                    </div>
                  </div>
                </div>

                {/* Progreso actual */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-gray-800 font-bold text-sm uppercase tracking-wider mb-4">📊 Progreso Actual</h4>
                  <div className="space-y-3">
                    {/* Barra */}
                    <div className="relative h-10 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}>
                      <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-yellow-400/60 z-10" />
                      <div
                        className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.max(45, Math.min(45 + (challengeData.salesAmount / challengeData.goal) * 55, 100))}%`,
                          background: challengeData.salesAmount >= challengeData.goal
                            ? 'linear-gradient(to right, #f59e0b, #ef4444, #fbbf24)'
                            : 'linear-gradient(to right, #7f1d1d, #dc2626, #ef4444, #f87171)',
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-gray-900 font-black text-sm drop-shadow-lg">
                          S/ {challengeData.salesAmount.toLocaleString()} / S/ {challengeData.goal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-semibold">
                      <span>S/ 0</span>
                      <span className="text-yellow-400/70">🏆 Meta: S/ {challengeData.goal.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] uppercase font-bold">Ventas actuales</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">S/ {challengeData.salesAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] uppercase font-bold">Progreso</p>
                        <p className="text-2xl font-black text-red-400 mt-1">{Math.round((challengeData.salesAmount / challengeData.goal) * 100)}%</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] uppercase font-bold">Faltan</p>
                        <p className="text-2xl font-black text-amber-400 mt-1">S/ {Math.max(0, challengeData.goal - challengeData.salesAmount).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actualizar ventas */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-gray-800 font-bold text-sm uppercase tracking-wider mb-4">✏️ Actualizar Ventas de Marzo</h4>
                  <p className="text-gray-500 text-xs mb-4">
                    Ingresa el monto total de ventas acumuladas en marzo. El termómetro se actualiza en tiempo real para todos los clientes.
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10000"
                        placeholder="Ej: 2350.50"
                        value={challengeSalesInput}
                        onChange={e => setChallengeSalesInput(e.target.value)}
                        className="w-full bg-gray-100 border-2 border-gray-300 rounded-xl pl-9 pr-4 py-3 text-gray-900 text-lg font-bold focus:border-red-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        const amount = parseFloat(challengeSalesInput);
                        if (!isNaN(amount) && amount >= 0) {
                          await saveChallengeData({ salesAmount: amount });
                        }
                      }}
                      disabled={challengeSaving}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black rounded-xl transition-all hover:scale-105"
                    >
                      {challengeSaving ? 'Guardando...' : '🔥 Actualizar'}
                    </button>
                  </div>
                </div>

                {/* Activar / Desactivar + Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="text-gray-800 font-bold text-sm uppercase tracking-wider mb-3">⚡ Estado del Desafío</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveChallengeData({ active: true })}
                        disabled={challengeSaving || challengeData.active}
                        className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white"
                      >
                        ✅ Activar
                      </button>
                      <button
                        onClick={() => saveChallengeData({ active: false })}
                        disabled={challengeSaving || !challengeData.active}
                        className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all bg-gray-600 hover:bg-gray-500 disabled:opacity-40 text-white"
                      >
                        ⏸ Desactivar
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="text-gray-800 font-bold text-sm uppercase tracking-wider mb-3">🎯 Meta de ventas</h4>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">S/</span>
                        <input
                          type="number"
                          step="100"
                          min="500"
                          defaultValue={challengeData.goal}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) saveChallengeData({ goal: val });
                          }}
                          className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-gray-900 text-sm font-bold focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premio */}
                <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/10 border border-yellow-500/20 rounded-xl p-5">
                  <h4 className="text-yellow-300 font-bold text-sm uppercase tracking-wider mb-2">🏡 Premio del Sorteo</h4>
                  <p className="text-gray-900 font-black text-lg">Full Day en Casa de Campo</p>
                  <p className="text-gray-400 text-xs mt-1">Sorteo en vivo — Sábado 28 de Marzo 2026. Entre todos los clientes que compraron en marzo.</p>
                </div>
              </div>
            )}
          </section>

          {/* Promotion Modal */}
          {showPromotionModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl border-2 border-fuchsia-500 p-6 max-w-2xl w-full my-8">
                <h3 className="text-2xl font-black text-gray-700 mb-4">
                  {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={promotionForm.name}
                        onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                        placeholder="Black Friday 2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Código de Cupón (opcional)</label>
                      <input
                        type="text"
                        value={promotionForm.code}
                        onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none uppercase"
                        placeholder="VERANO2024"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={promotionForm.description}
                      onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                      rows={2}
                      placeholder="Descripción de la promoción"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                      <select
                        value={promotionForm.type}
                        onChange={(e) => setPromotionForm({ ...promotionForm, type: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                      >
                        <option value="percentage">Porcentaje</option>
                        <option value="fixed">Monto Fijo</option>
                        <option value="shipping">Envío Gratis</option>
                        <option value="combo">Combo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        {promotionForm.type === 'percentage' ? 'Porcentaje (%)' : 'Monto (S/)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={promotionForm.value}
                        onChange={(e) => setPromotionForm({ ...promotionForm, value: parseFloat(e.target.value) || 0 })}
                        disabled={promotionForm.type === 'shipping'}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none disabled:opacity-50"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Compra Mínima</label>
                      <input
                        type="number"
                        step="0.01"
                        value={promotionForm.minAmount}
                        onChange={(e) => setPromotionForm({ ...promotionForm, minAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Inicio</label>
                      <input
                        type="date"
                        value={promotionForm.startDate}
                        onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [color-scheme:light]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Fin</label>
                      <input
                        type="date"
                        value={promotionForm.endDate}
                        onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [color-scheme:light]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Límite de Uso</label>
                      <input
                        type="number"
                        value={promotionForm.usageLimit}
                        onChange={(e) => setPromotionForm({ ...promotionForm, usageLimit: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                        placeholder="0 = ilimitado"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Segmento de Clientes</label>
                    <select
                      value={promotionForm.targetSegment}
                      onChange={(e) => setPromotionForm({ ...promotionForm, targetSegment: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
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
                    <label className="text-sm text-gray-600">Promoción activa</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPromotionModal(false);
                      setEditingPromotion(null);
                      resetPromotionForm();
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}
                    disabled={!promotionForm.name || !promotionForm.startDate || !promotionForm.endDate}
                    className="flex-1 bg-white hover:bg-gray-800 text-gray-900 px-4 py-2 rounded-lg font-bold transition-all  disabled:opacity-50 disabled:cursor-not-allowed"
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
        <section className="px-6 py-8">
          <h2 className="text-3xl font-black text-gray-700  mb-2">Stock de Carta</h2>
          <p className="text-gray-400 text-sm mb-8">
            Activa el sello <span className="text-red-400 font-bold">AGOTADO</span> para que los clientes no puedan pedir ese plato.
            El cambio se refleja en la carta al instante.
          </p>

          {/* FAT GROUP — Alitas, Salsas y Promociones */}
          <div className="bg-gray-50 rounded-2xl border border-red-500/20 p-6 mb-6">
            <h2 className="text-lg font-black text-red-400 mb-6 flex items-center gap-2 border-b border-red-500/20 pb-3">
              🥩 FAT — Alitas
            </h2>

            <div className="mb-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Productos</h3>
            {/* Stock FAT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { id: "pequeno-dilema", name: "Pequeño Dilema", defaultPrice: 22.00 },
                { id: "duo-dilema", name: "Dúo Dilema", defaultPrice: 34.00 },
                { id: "santo-pecado", name: "Santo Pecado", defaultPrice: 47.00 },
              ].map((item) => {
                const isSoldOut = !!menuStock[item.id];
                const isSaving = menuStockSaving === item.id;
                const hasDiscount = !!menuDiscounts[item.id];
                const isSavingDiscount = discountSaving === item.id;
                const isSavingPrice = priceSaving === item.id;
                const effectivePrice = menuPrices[item.id] || item.defaultPrice;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border-2 p-5 transition-all ${
                      isSoldOut ? "border-red-600/60 opacity-70" : hasDiscount ? "border-amber-500/50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-gray-800 font-bold text-base">{item.name}</p>
                        {hasDiscount ? (
                          <p className="text-xs mt-0.5">
                            <span className="text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                            <span className="text-amber-400 font-black ml-1.5">S/ {menuDiscounts[item.id].toFixed(2)}</span>
                          </p>
                        ) : (
                          <p className="text-amber-400 text-sm font-bold">S/ {effectivePrice.toFixed(2)}</p>
                        )}
                        {isSoldOut && <span className="text-red-400 text-xs font-black tracking-widest">AGOTADO</span>}
                      </div>
                      <button
                        onClick={() => toggleMenuStock(item.id, isSoldOut)}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${
                          isSoldOut ? "bg-green-700 hover:bg-green-600 text-white" : "bg-red-700 hover:bg-red-600 text-white"
                        } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isSaving ? "..." : isSoldOut ? "Disponible" : "Agotar"}
                      </button>
                    </div>
                    {/* Precio real */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <input
                        type="number" step="0.50" min="0.50"
                        placeholder={`Precio real (actual: S/ ${effectivePrice.toFixed(2)})`}
                        value={priceInputs[item.id] || ''}
                        onChange={e => setPriceInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:border-red-400 focus:outline-none"
                      />
                      <button
                        onClick={() => savePrice(item.id, item.defaultPrice)}
                        disabled={isSavingPrice}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-red-700 hover:bg-red-600 text-white ${isSavingPrice ? 'opacity-50' : ''}`}
                      >
                        {isSavingPrice ? '...' : '💰 Precio'}
                      </button>
                    </div>
                    {/* Precio oferta */}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number" step="0.50" min="0" max={effectivePrice - 0.5}
                        placeholder="Precio oferta (menor al real)"
                        value={discountInputs[item.id] || ''}
                        onChange={e => setDiscountInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        onClick={() => saveDiscount(item.id, effectivePrice)}
                        disabled={isSavingDiscount}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${hasDiscount ? 'bg-amber-600 hover:bg-amber-500' : 'bg-gray-200 hover:bg-gray-600'} text-white ${isSavingDiscount ? 'opacity-50' : ''}`}
                      >
                        {isSavingDiscount ? '...' : hasDiscount ? '🏷️ Actualizar' : '🏷️ Oferta'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            <div className="mt-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Salsas</h3>
            <p className="text-gray-500 text-xs mb-4">
              Al agotar una salsa los clientes no podrán seleccionarla al pedir. El cambio se refleja al instante.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {salsas.map((salsa) => {
                const stockId = `salsa-${salsa.id}`;
                const isSoldOut = !!menuStock[stockId];
                const isSaving = menuStockSaving === stockId;
                return (
                  <div
                    key={stockId}
                    className={`bg-white rounded-xl border-2 p-4 flex items-center justify-between transition-all ${
                      isSoldOut ? "border-red-600/60 opacity-70" : "border-amber-700/40"
                    }`}
                  >
                    <div>
                      <p className="text-gray-800 font-bold text-sm">{salsa.name}</p>
                      {isSoldOut && (
                        <span className="text-red-400 text-xs font-black tracking-widest">AGOTADO</span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleMenuStock(stockId, isSoldOut)}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 ${
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

            {(() => {
            const FAT_SALSAS = [
              { id: 'barbecue', name: 'BBQ Ahumada' },
              { id: 'buffalo-picante', name: 'Santo Picante' },
              { id: 'ahumada', name: 'Acevichada Imperial' },
              { id: 'parmesano-ajo', name: 'Crispy Celestial' },
              { id: 'anticuchos', name: 'Parrillera' },
              { id: 'honey-mustard', name: 'Honey Mustard' },
              { id: 'teriyaki', name: 'Oriental Teriyaki' },
              { id: 'macerichada', name: 'Sweet & Sour' },
            ];
            const FAT_PRODUCTS = [
              { id: 'pequeno-dilema', name: 'Pequeño Dilema' },
              { id: 'duo-dilema', name: 'Dúo Dilema' },
              { id: 'santo-pecado', name: 'Santo Pecado' },
            ];
            return (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-700 flex items-center gap-2">
                      🌶️ Promociones de Salsas FAT
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      Define combos de salsas con precio especial. Si el cliente selecciona las salsas indicadas, el precio baja automáticamente.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPromo(null);
                      setPromoForm({ productId: 'pequeno-dilema', salsas: [], promoPrice: 0, active: true });
                      setShowSalsaPromoModal(true);
                    }}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    + Nueva promo
                  </button>
                </div>
                {salsaPromos.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                    <p className="text-gray-500 text-sm">Sin promociones activas. Crea una para ofrecer precios especiales por combinación de salsas.</p>
                    <p className="text-gray-600 text-xs mt-2">Las promos hardcodeadas (Teriyaki S/18, Barbecue+Ahumada S/32, etc.) siguen activas como fallback.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {salsaPromos.map((promo: any) => {
                      const prodName = FAT_PRODUCTS.find(p => p.id === promo.productId)?.name || promo.productId;
                      return (
                        <div key={promo.id} className={`bg-white rounded-xl border-2 p-4 ${promo.active ? 'border-fuchsia-500/50' : 'border-gray-200 opacity-60'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-gray-900 font-black text-sm">{prodName}</p>
                              <p className="text-gray-700 text-xl font-black">S/ {promo.promoPrice}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => {
                                setEditingPromo(promo);
                                setPromoForm({ productId: promo.productId, salsas: promo.salsas, promoPrice: promo.promoPrice, active: promo.active });
                                setShowSalsaPromoModal(true);
                              }} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-2 py-1 rounded">Editar</button>
                              <button onClick={() => handleDeletePromo(promo.id)} className="text-xs text-red-400 hover:text-red-200 border border-red-900 hover:border-red-700 px-2 py-1 rounded">✕</button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {promo.salsas.map((sId: string) => (
                              <span key={sId} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {FAT_SALSAS.find(s => s.id === sId)?.name || sId}
                              </span>
                            ))}
                          </div>
                          <p className={`text-[10px] mt-2 font-bold ${promo.active ? 'text-green-400' : 'text-gray-500'}`}>
                            {promo.active ? '● Activa' : '○ Inactiva'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Modal crear/editar promo */}
                {showSalsaPromoModal && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-xl border-2 border-fuchsia-500 p-5 max-w-md w-full">
                      <h3 className="text-lg font-black text-gray-700 mb-4">
                        {editingPromo ? 'Editar Promo' : 'Nueva Promo de Salsas'}
                      </h3>

                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Producto FAT</label>
                        <select
                          value={promoForm.productId}
                          onChange={e => setPromoForm({ ...promoForm, productId: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm"
                        >
                          {FAT_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-400 mb-2">Salsas que activan la promo (todas deben estar seleccionadas)</label>
                        <div className="flex flex-wrap gap-2">
                          {FAT_SALSAS.map(s => {
                            const sel = promoForm.salsas.includes(s.id);
                            return (
                              <button key={s.id}
                                onClick={() => setPromoForm(f => ({
                                  ...f,
                                  salsas: sel ? f.salsas.filter(x => x !== s.id) : [...f.salsas, s.id]
                                }))}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${sel ? 'bg-amber-500 border-amber-400 text-black' : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-amber-500'}`}>
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Precio con promo (S/)</label>
                        <input
                          type="number" min="0" step="0.5"
                          value={promoForm.promoPrice || ''}
                          onChange={e => setPromoForm({ ...promoForm, promoPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm"
                          placeholder="ej: 18"
                        />
                      </div>

                      <div className="mb-5 flex items-center gap-3">
                        <button
                          onClick={() => setPromoForm(f => ({ ...f, active: !f.active }))}
                          className={`relative w-10 h-6 rounded-full transition-all ${promoForm.active ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${promoForm.active ? 'left-5' : 'left-1'}`} />
                        </button>
                        <span className="text-xs text-gray-400">{promoForm.active ? 'Activa' : 'Inactiva'}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePromo}
                          disabled={promoSaving || promoForm.salsas.length === 0 || !promoForm.promoPrice}
                          className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold text-sm"
                        >
                          {promoSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => { setShowSalsaPromoModal(false); setEditingPromo(null); }}
                          className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          </div>

          {/* FIT */}
          <div>
            <h3 className="text-xl font-black text-cyan-400 mb-4 flex items-center gap-2">
              🥗 Carta FIT
            </h3>
            {/* Stock FIT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "ensalada-clasica", name: "CLÁSICA FRESH BOWL", defaultPrice: 18.50 },
                { id: "ensalada-proteica", name: "CÉSAR POWER BOWL", defaultPrice: 22.50 },
                { id: "ensalada-caesar", name: "PROTEIN FIT BOWL", defaultPrice: 23.50 },
                { id: "ensalada-mediterranea", name: "TUNA FRESH BOWL", defaultPrice: 23.50 },
                { id: "cobb-supreme-bowl", name: "COBB SUPREME BOWL", defaultPrice: 23.50 },
                { id: "crispy-chicken-bowl", name: "CRISPY CHICKEN BOWL", defaultPrice: 22.50 },
                { id: "pasta-power-bowl", name: "PASTA POWER BOWL", defaultPrice: 22.50 },
              ].map((item) => {
                const isSoldOut = !!menuStock[item.id];
                const isSaving = menuStockSaving === item.id;
                const hasDiscount = !!menuDiscounts[item.id];
                const isSavingDiscount = discountSaving === item.id;
                const isSavingPrice = priceSaving === item.id;
                const effectivePrice = menuPrices[item.id] || item.defaultPrice;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border-2 p-5 transition-all ${
                      isSoldOut ? "border-red-600/60 opacity-70" : hasDiscount ? "border-cyan-500/50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-gray-800 font-bold text-base">{item.name}</p>
                        {hasDiscount ? (
                          <p className="text-xs mt-0.5">
                            <span className="text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                            <span className="text-cyan-400 font-black ml-1.5">S/ {menuDiscounts[item.id].toFixed(2)}</span>
                          </p>
                        ) : (
                          <p className="text-cyan-400 text-sm font-bold">S/ {effectivePrice.toFixed(2)}</p>
                        )}
                        {isSoldOut && <span className="text-red-400 text-xs font-black tracking-widest">AGOTADO</span>}
                      </div>
                      <button
                        onClick={() => toggleMenuStock(item.id, isSoldOut)}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${
                          isSoldOut ? "bg-green-700 hover:bg-green-600 text-white" : "bg-red-700 hover:bg-red-600 text-white"
                        } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isSaving ? "..." : isSoldOut ? "Disponible" : "Agotar"}
                      </button>
                    </div>
                    {/* Precio real */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <input
                        type="number" step="0.50" min="0.50"
                        placeholder={`Precio real (actual: S/ ${effectivePrice.toFixed(2)})`}
                        value={priceInputs[item.id] || ''}
                        onChange={e => setPriceInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        onClick={() => savePrice(item.id, item.defaultPrice)}
                        disabled={isSavingPrice}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-cyan-700 hover:bg-cyan-600 text-white ${isSavingPrice ? 'opacity-50' : ''}`}
                      >
                        {isSavingPrice ? '...' : '💰 Precio'}
                      </button>
                    </div>
                    {/* Precio oferta */}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number" step="0.50" min="0" max={effectivePrice - 0.5}
                        placeholder="Precio oferta (menor al real)"
                        value={discountInputs[item.id] || ''}
                        onChange={e => setDiscountInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                      <button
                        onClick={() => saveDiscount(item.id, effectivePrice)}
                        disabled={isSavingDiscount}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${hasDiscount ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-gray-200 hover:bg-gray-600'} text-white ${isSavingDiscount ? 'opacity-50' : ''}`}
                      >
                        {isSavingDiscount ? '...' : hasDiscount ? '🏷️ Actualizar' : '🏷️ Oferta'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TACOS */}
          <div className="mt-10">
            <h3 className="text-xl font-black text-orange-400 mb-4 flex items-center gap-2">
              🌮 Carta Tacos
            </h3>

            {/* Precio del Dúo */}
            {(() => {
              const duoId = "taco-duo";
              const defaultPrice = 24.90;
              const hasDiscount = !!menuDiscounts[duoId];
              const isSavingDiscount = discountSaving === duoId;
              const isSavingPrice = priceSaving === duoId;
              const effectivePrice = menuPrices[duoId] || defaultPrice;
              return (
                <div className={`bg-white rounded-xl border-2 p-5 mb-6 max-w-md transition-all ${hasDiscount ? "border-orange-500/50" : "border-gray-200"}`}>
                  <p className="text-gray-900 font-bold text-base mb-1">DÚO DE TACOS</p>
                  {hasDiscount ? (
                    <p className="text-sm mb-3">
                      <span className="text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                      <span className="text-orange-400 font-black ml-1.5">S/ {menuDiscounts[duoId].toFixed(2)}</span>
                      <span className="text-gray-500 text-xs ml-2">(precio en oferta)</span>
                    </p>
                  ) : (
                    <p className="text-orange-400 text-sm font-bold mb-3">S/ {effectivePrice.toFixed(2)}</p>
                  )}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <input
                      type="number" step="0.50" min="0.50"
                      placeholder={`Nuevo precio (actual: S/ ${effectivePrice.toFixed(2)})`}
                      value={priceInputs[duoId] || ''}
                      onChange={e => setPriceInputs(prev => ({ ...prev, [duoId]: e.target.value }))}
                      className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:border-orange-400 focus:outline-none"
                    />
                    <button
                      onClick={() => savePrice(duoId, defaultPrice)}
                      disabled={isSavingPrice}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs bg-orange-700 hover:bg-orange-600 text-white transition-all ${isSavingPrice ? 'opacity-50' : ''}`}
                    >
                      {isSavingPrice ? '...' : '💰 Guardar precio'}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number" step="0.50" min="0" max={effectivePrice - 0.5}
                      placeholder="Precio oferta (menor al actual)"
                      value={discountInputs[duoId] || ''}
                      onChange={e => setDiscountInputs(prev => ({ ...prev, [duoId]: e.target.value }))}
                      className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      onClick={() => saveDiscount(duoId, effectivePrice)}
                      disabled={isSavingDiscount}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${hasDiscount ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-200 hover:bg-gray-600'} text-white ${isSavingDiscount ? 'opacity-50' : ''}`}
                    >
                      {isSavingDiscount ? '...' : hasDiscount ? '🏷️ Actualizar oferta' : '🏷️ Poner oferta'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Agotado por sabor */}
            <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide font-bold">Disponibilidad de sabores</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "santo-crujiente", name: "CRUNCH SUPREME" },
                { id: "tex-dilema",      name: "TEX SUPREME" },
                { id: "santo-bacon",     name: "BACON DELUXE" },
              ].map((item) => {
                const isSoldOut = !!menuStock[item.id];
                const isSaving = menuStockSaving === item.id;
                return (
                  <div key={item.id} className={`bg-white rounded-xl border-2 p-4 flex items-center justify-between transition-all ${isSoldOut ? "border-red-600/60 opacity-70" : "border-orange-700/40"}`}>
                    <div>
                      <p className="text-gray-800 font-bold text-sm">{item.name}</p>
                      {isSoldOut && <span className="text-red-400 text-xs font-black tracking-widest">AGOTADO</span>}
                    </div>
                    <button
                      onClick={() => toggleMenuStock(item.id, isSoldOut)}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 ${isSoldOut ? "bg-green-700 hover:bg-green-600 text-white" : "bg-red-700 hover:bg-red-600 text-white"} ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isSaving ? "..." : isSoldOut ? "Disponible" : "Agotar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COMBOS */}
          <div className="mt-10">
            <h3 className="text-xl font-black text-violet-400 mb-4 flex items-center gap-2">
              🎁 Combos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: "combo-chiguan",      name: "Combo Chiguan",      defaultPrice: 20.00, includes: "4 alitas + Crunch Supreme Taco" },
                { id: "combo-perfecto",     name: "Combo Perfecto",     defaultPrice: 40.00, includes: "Pequeño Dilema + Ensalada FIT" },
                { id: "combo-especial",     name: "Combo Especial",     defaultPrice: 42.00, includes: "Pequeño Dilema + Dúo de Tacos" },
                { id: "combo-alitas",       name: "Combo Alitas",       defaultPrice: 52.00, includes: "Pequeño Dilema + Dúo Dilema" },
                { id: "combo-santo-dilema", name: "Combo Santo Dilema", defaultPrice: 76.00, includes: "Dúo Dilema + Ensalada FIT + Dúo Tacos" },
              ].map((item) => {
                const isSoldOut = !!menuStock[item.id];
                const isSaving = menuStockSaving === item.id;
                const hasDiscount = !!menuDiscounts[item.id];
                const isSavingDiscount = discountSaving === item.id;
                const isSavingPrice = priceSaving === item.id;
                const effectivePrice = menuPrices[item.id] || item.defaultPrice;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border-2 p-5 transition-all ${
                      isSoldOut ? "border-red-600/60 opacity-70" : hasDiscount ? "border-violet-500/50" : "border-violet-700/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-gray-800 font-bold text-base">{item.name}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{item.includes}</p>
                        {hasDiscount ? (
                          <p className="text-xs mt-1">
                            <span className="text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                            <span className="text-violet-400 font-black ml-1.5">S/ {menuDiscounts[item.id].toFixed(2)}</span>
                          </p>
                        ) : (
                          <p className="text-violet-400 text-sm font-bold mt-1">S/ {effectivePrice.toFixed(2)}</p>
                        )}
                        {isSoldOut && <span className="text-red-400 text-xs font-black tracking-widest">AGOTADO</span>}
                      </div>
                      <button
                        onClick={() => toggleMenuStock(item.id, isSoldOut)}
                        disabled={isSaving}
                        className={`shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 ${
                          isSoldOut ? "bg-green-700 hover:bg-green-600 text-white" : "bg-red-700 hover:bg-red-600 text-white"
                        } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isSaving ? "..." : isSoldOut ? "Disponible" : "Agotar"}
                      </button>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-200 mt-3">
                      <input
                        type="number" step="0.50" min="0.50"
                        placeholder={`Precio (actual: S/ ${effectivePrice.toFixed(2)})`}
                        value={priceInputs[item.id] || ""}
                        onChange={e => setPriceInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:border-violet-400 focus:outline-none"
                      />
                      <button
                        onClick={() => savePrice(item.id, item.defaultPrice)}
                        disabled={isSavingPrice}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs bg-violet-700 hover:bg-violet-600 text-white transition-all ${isSavingPrice ? "opacity-50" : ""}`}
                      >
                        {isSavingPrice ? "..." : "💰 Precio"}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number" step="0.50" min="0" max={effectivePrice - 0.5}
                        placeholder="Precio oferta (menor al real)"
                        value={discountInputs[item.id] || ""}
                        onChange={e => setDiscountInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        onClick={() => saveDiscount(item.id, effectivePrice)}
                        disabled={isSavingDiscount}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${hasDiscount ? "bg-violet-600 hover:bg-violet-500" : "bg-gray-200 hover:bg-gray-600"} text-white ${isSavingDiscount ? "opacity-50" : ""}`}
                      >
                        {isSavingDiscount ? "..." : hasDiscount ? "🏷️ Actualizar" : "🏷️ Oferta"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ==================== MODAL DE INVENTARIO (GLOBAL) ==================== */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[96vh] overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-base font-bold text-gray-900">Registrar gasto</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {({
                    operativos: "Insumos y materiales de operación",
                    fijos: "Alquiler, servicios y gastos recurrentes",
                    personal: "Salarios y pagos a empleados",
                    marketing: "Publicidad, promociones y canjes",
                  } as Record<string,string>)[inventoryForm.category] || "Selecciona el tipo de gasto"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInventoryModal(false);
                  setInventoryForm({ supplier: "", supplierRuc: "", supplierPhone: "", paymentMethod: "plin-yape", category: "operativos", items: [{ productName: "", quantity: 0, unit: "KG", volume: 1, unitCost: 0, total: 0 }], totalAmount: 0, purchaseDate: new Date().toISOString().split("T")[0] });
                  setProductSearchTerms([""]);
                  setActiveDropdownIndex(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* TIPO DE GASTO */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tipo de gasto</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { value: "operativos", label: "Operativos", desc: "Insumos", icon: "🛒" },
                    { value: "fijos", label: "Fijos", desc: "Alquiler, luz", icon: "🏢" },
                    { value: "personal", label: "Personal", desc: "Salarios", icon: "👥" },
                    { value: "marketing", label: "Marketing", desc: "Publicidad", icon: "📢" },
                  ] as const).map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setInventoryForm({ ...inventoryForm, category: cat.value, items: [{ productName: "", quantity: 0, unit: "KG", volume: 1, unitCost: 0, total: 0 }], totalAmount: 0 })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        inventoryForm.category === cat.value
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-100 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="text-xl mb-1">{cat.icon}</div>
                      <p className="text-xs font-bold text-gray-900">{cat.label}</p>
                      <p className="text-xs text-gray-400">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* INFO BASE */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {inventoryForm.category === "personal" ? "Nombre del empleado" : "Proveedor / A quién le pagaste"}
                  </label>
                  <input
                    type="text"
                    value={inventoryForm.supplier}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, supplier: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                    placeholder={inventoryForm.category === "personal" ? "NOMBRE COMPLETO" : "MERCADO, WONG..."}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={inventoryForm.purchaseDate}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [color-scheme:light]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pago</label>
                  <select
                    value={inventoryForm.paymentMethod}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                  >
                    <option value="plin-yape">Plin / Yape</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              {/* ===== OPERATIVOS ===== */}
              {inventoryForm.category === "operativos" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Productos comprados</p>
                    <button
                      onClick={addInventoryItem}
                      className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
                    >
                      + Añadir fila
                    </button>
                  </div>
                  <div className="grid grid-cols-[1fr_64px_80px_88px_28px] gap-2 px-1 mb-1">
                    <p className="text-xs font-semibold text-gray-400">Producto</p>
                    <p className="text-xs font-semibold text-gray-400 text-center">Cant.</p>
                    <p className="text-xs font-semibold text-gray-400 text-center">Unidad</p>
                    <p className="text-xs font-semibold text-gray-400 text-right">Total S/</p>
                    <span />
                  </div>
                  <div className="space-y-2">
                    {inventoryForm.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_64px_80px_88px_28px] gap-2 items-center">
                        <input
                          type="text"
                          value={item.productName || ""}
                          onChange={(e) => updateInventoryItem(idx, "productName", e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                          placeholder="Pollo, pan, gas..."
                        />
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => updateInventoryItem(idx, "quantity", parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 text-center focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="1"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateInventoryItem(idx, "unit", e.target.value)}
                          className="w-full px-2 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                        >
                          <option value="KG">KG</option>
                          <option value="UNIDAD">UND</option>
                          <option value="PAQUETE">PKT</option>
                          <option value="CAJA">CAJA</option>
                          <option value="BOLSA">BOLSA</option>
                          <option value="LITRO">LTR</option>
                          <option value="CIENTO">CIEN</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost === 0 ? "" : item.unitCost}
                          onChange={(e) => updateInventoryItem(idx, "unitCost", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 text-right focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                        />
                        {inventoryForm.items.length > 1 ? (
                          <button
                            onClick={() => removeInventoryItem(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 text-xs font-bold transition-all"
                          >
                            ✕
                          </button>
                        ) : <span />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== FIJOS ===== */}
              {inventoryForm.category === "fijos" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Concepto</p>
                  <div className="flex flex-wrap gap-2">
                    {["ALQUILER", "LUZ", "AGUA", "GAS", "INTERNET", "TELÉFONO", "OTRO"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          const newItems = [...inventoryForm.items];
                          newItems[0] = { ...newItems[0], productName: opt, unit: "SERVICIO", quantity: 1, volume: 1 };
                          setInventoryForm({ ...inventoryForm, items: newItems });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          inventoryForm.items[0]?.productName === opt
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {inventoryForm.items[0]?.productName === "OTRO" && (
                    <input
                      type="text"
                      value={(inventoryForm.items[0] as any)?.category || ""}
                      onChange={(e) => {
                        const newItems = [...inventoryForm.items];
                        (newItems[0] as any).category = e.target.value.toUpperCase();
                        setInventoryForm({ ...inventoryForm, items: newItems });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                      placeholder="Describe el gasto..."
                    />
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Monto (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inventoryForm.items[0]?.unitCost === 0 ? "" : inventoryForm.items[0]?.unitCost}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const newItems = [...inventoryForm.items];
                        newItems[0] = { ...newItems[0], unitCost: amount, total: amount };
                        setInventoryForm({ ...inventoryForm, items: newItems, totalAmount: amount });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* ===== PERSONAL ===== */}
              {inventoryForm.category === "personal" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detalle del pago</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Días trabajados</label>
                      <input
                        type="number"
                        min="0"
                        value={inventoryForm.items[0]?.quantity === 0 ? "" : inventoryForm.items[0]?.quantity}
                        onChange={(e) => {
                          const days = parseInt(e.target.value) || 0;
                          const dailyRate = inventoryForm.items[0]?.unitCost || 0;
                          const newItems = [...inventoryForm.items];
                          newItems[0] = { ...newItems[0], quantity: days, unit: "DÍA", volume: 1, total: days * dailyRate };
                          setInventoryForm({ ...inventoryForm, items: newItems, totalAmount: days * dailyRate });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pago por día (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={inventoryForm.items[0]?.unitCost === 0 ? "" : inventoryForm.items[0]?.unitCost}
                        onChange={(e) => {
                          const dailyRate = parseFloat(e.target.value) || 0;
                          const days = inventoryForm.items[0]?.quantity || 0;
                          const newItems = [...inventoryForm.items];
                          newItems[0] = { ...newItems[0], unitCost: dailyRate, unit: "DÍA", volume: 1, total: days * dailyRate };
                          setInventoryForm({ ...inventoryForm, items: newItems, totalAmount: days * dailyRate });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {(inventoryForm.items[0]?.quantity || 0) > 0 && (inventoryForm.items[0]?.unitCost || 0) > 0 && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">{inventoryForm.items[0]?.quantity} días × S/ {(inventoryForm.items[0]?.unitCost || 0).toFixed(2)}</span>
                      <span className="text-base font-black text-gray-900">S/ {inventoryForm.totalAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ===== MARKETING ===== */}
              {inventoryForm.category === "marketing" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detalle</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Descripción</label>
                    <input
                      type="text"
                      value={inventoryForm.items[0]?.productName || ""}
                      onChange={(e) => {
                        const newItems = [...inventoryForm.items];
                        newItems[0] = { ...newItems[0], productName: e.target.value.toUpperCase(), unit: "CAMPAÑA", quantity: 1, volume: 1 };
                        setInventoryForm({ ...inventoryForm, items: newItems });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none"
                      placeholder="Instagram Ads, canje influencer, flyers..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tipo</label>
                    <div className="flex gap-2">
                      {(["PAGO", "CANJE"] as const).map(tipo => (
                        <button
                          key={tipo}
                          onClick={() => {
                            const newItems = [...inventoryForm.items];
                            (newItems[0] as any).category = tipo;
                            setInventoryForm({ ...inventoryForm, items: newItems });
                          }}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                            (inventoryForm.items[0] as any)?.category === tipo
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {tipo === "PAGO" ? "Pago en efectivo / transferencia" : "Canje por menús"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(inventoryForm.items[0] as any)?.category === "PAGO" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Monto pagado (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={inventoryForm.items[0]?.unitCost === 0 ? "" : inventoryForm.items[0]?.unitCost}
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          const newItems = [...inventoryForm.items];
                          newItems[0] = { ...newItems[0], unitCost: amount, total: amount };
                          setInventoryForm({ ...inventoryForm, items: newItems, totalAmount: amount });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  {(inventoryForm.items[0] as any)?.category === "CANJE" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cant. menús entregados</label>
                        <input
                          type="number"
                          min="0"
                          value={inventoryForm.items[0]?.quantity === 0 ? "" : inventoryForm.items[0]?.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            const cost = inventoryForm.items[0]?.unitCost || 0;
                            const newItems = [...inventoryForm.items];
                            newItems[0] = { ...newItems[0], quantity: qty, total: qty * cost };
                            setInventoryForm({ ...inventoryForm, items: newItems, totalAmount: qty * cost });
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Costo por menú (S/)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={inventoryForm.items[0]?.unitCost === 0 ? "" : inventoryForm.items[0]?.unitCost}
                          onChange={(e) => {
                            const cost = parseFloat(e.target.value) || 0;
                            const qty = inventoryForm.items[0]?.quantity || 0;
                            const newItems = [...inventoryForm.items];
                            newItems[0] = { ...newItems[0], unitCost: cost, total: qty * cost };
                            setInventoryForm({ ...inventoryForm, items: newItems, totalAmount: qty * cost });
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TOTAL + GUARDAR */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Total a registrar</p>
                    {inventoryForm.category === "operativos" && (
                      <p className="text-xs text-gray-400">{inventoryForm.items.length} producto{inventoryForm.items.length !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                  <p className="text-3xl font-black text-gray-900">S/ {inventoryForm.totalAmount.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowInventoryModal(false);
                      setInventoryForm({ supplier: "", supplierRuc: "", supplierPhone: "", paymentMethod: "plin-yape", category: "operativos", items: [{ productName: "", quantity: 0, unit: "KG", volume: 1, unitCost: 0, total: 0 }], totalAmount: 0, purchaseDate: new Date().toISOString().split("T")[0] });
                      setProductSearchTerms([""]);
                      setActiveDropdownIndex(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 text-sm rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateInventory}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 text-sm rounded-xl font-bold transition-all"
                  >
                    Guardar gasto
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* Modal de Edición de Compra */}
      {showInventoryEditModal && editingPurchase && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl border-2 border-amber-500 p-4 max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl font-black text-amber-400 mb-3">✏️ Editar Compra</h3>

            {/* Información Compacta en Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">RUC</label>
                <input
                  type="text"
                  defaultValue={editingPurchase.supplierRuc}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, supplierRuc: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-white border border-gray-200 text-gray-900 focus:border-amber-400 focus:outline-none"
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
                  className="w-full px-2 py-1.5 text-sm rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none"
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
                  className="w-full px-2 py-1.5 text-sm rounded bg-white border border-gray-200 text-gray-900 focus:border-amber-400 focus:outline-none"
                  maxLength={9}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">Fecha de compra *</label>
                <input
                  type="date"
                  defaultValue={editingPurchase.purchaseDate}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, purchaseDate: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none [color-scheme:light]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">Método de pago *</label>
                <select
                  defaultValue={editingPurchase.paymentMethod}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, paymentMethod: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none"
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
                <h4 className="text-sm font-bold text-gray-800">📋 Artículos</h4>
              </div>

              {/* Encabezados de columnas */}
              <div className="bg-gray-100 rounded-lg p-2 mb-2">
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
                  <div key={idx} className="bg-gray-100 rounded p-2 border border-amber-500/20">
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
                          className="w-full px-2 py-1.5 text-xs rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none"
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
                          className="w-full px-2 py-1.5 text-xs rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none"
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
                          className="w-full px-2 py-1.5 text-xs rounded bg-white border border-amber-200 text-gray-900 text-center focus:border-amber-400 focus:outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          className="w-full px-1 py-1.5 text-xs rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none"
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
                          className="w-full px-2 py-1.5 text-xs rounded bg-white border border-amber-200 text-gray-900 focus:border-amber-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-lg font-bold transition-all"
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

      {/* Modal para ver comprobante de pago — mejorado */}
      {showVoucherModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowVoucherModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🟣</span>
                <div>
                  <p className="text-white font-black text-sm leading-tight">Comprobante Yape</p>
                  {selectedVoucherOrder && (
                    <p className="text-purple-200 text-[10px] font-medium leading-tight">
                      {selectedVoucherOrder.id} · {selectedVoucherOrder.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold transition-all flex items-center justify-center text-sm"
              >×</button>
            </div>

            {/* Datos del pedido */}
            {selectedVoucherOrder && (
              <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between flex-shrink-0">
                <div className="flex gap-4 text-xs text-gray-500">
                  <div>
                    <p className="font-semibold text-gray-400 uppercase tracking-wide text-[9px]">Pedido</p>
                    <p className="font-black text-gray-800">{selectedVoucherOrder.id}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400 uppercase tracking-wide text-[9px]">Cliente</p>
                    <p className="font-black text-gray-800">{selectedVoucherOrder.name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400 uppercase tracking-wide text-[9px]">Total</p>
                    <p className="font-black text-purple-700">S/ {(selectedVoucherOrder.totalPrice || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400 uppercase tracking-wide text-[9px]">Hora</p>
                    <p className="font-black text-gray-800">
                      {new Date(selectedVoucherOrder.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Imagen comprobante */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
              {selectedVoucherPath ? (
                <img
                  src={selectedVoucherPath}
                  alt="Comprobante de pago"
                  className="max-w-full h-auto rounded-xl border border-gray-200 shadow-md object-contain"
                  style={{ maxHeight: '55vh' }}
                />
              ) : (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-400 font-semibold text-sm">No hay comprobante disponible</p>
                  <p className="text-gray-300 text-xs mt-1">El cliente no adjuntó una captura de pago</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="px-5 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
              {selectedVoucherPath && (
                <a
                  href={selectedVoucherPath}
                  download={`comprobante-${selectedVoucherOrder?.id || 'pedido'}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 text-xs font-black text-center transition-all"
                >
                  ⬇ Descargar
                </a>
              )}
              <button
                onClick={() => setShowVoucherModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2.5 text-xs font-black transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación - Venta Histórica */}
      {showHistoricalSaleModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHistoricalSaleModal(false)}
        >
          <div
            className="bg-white rounded-xl border-2 border-orange-500 max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-black text-orange-400 mb-4">
              📅 Registrar Venta Histórica
            </h3>
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-4">
              <p className="text-gray-600 text-sm mb-2">
                <strong>Fecha:</strong> 13 de febrero 2026 (Día de apertura)
              </p>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Monto:</strong> S/ 250.00
              </p>
              <p className="text-gray-400 text-xs mt-3">
                ⚠️ Esta venta se perdió por un error del sistema y se recuperará con esta acción. Solo se registrará el monto total, sin detalle de pedidos individuales.
              </p>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Esta acción registrará la venta del día de apertura en el sistema para que se contabilice correctamente en los históricos y analytics.
            </p>
            <div className="flex gap-3">
              <button
                onClick={registerHistoricalSale}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
              >
                ✅ Confirmar Registro
              </button>
              <button
                onClick={() => setShowHistoricalSaleModal(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CRM Edit */}
      {showCrmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCrmModal(false)}>
          <div className="bg-white rounded-xl border-2 border-fuchsia-500 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-700">Perfil CRM</h2>
              <button onClick={() => setShowCrmModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>

            {/* Cumpleaños */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cumpleaños (DD/MM)</label>
              <input
                type="text"
                value={crmForm.birthday}
                onChange={e => {
                  const val = e.target.value.replace(/[^\d/]/g, '').slice(0, 5);
                  setCrmForm(f => ({ ...f, birthday: val }));
                }}
                placeholder="15/03"
                maxLength={5}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Etiquetas */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {['vip', 'influencer', 'corporativo', 'fiel', 'problematico'].map(tag => (
                  <button key={tag}
                    onClick={() => setCrmForm(f => ({
                      ...f,
                      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
                    }))}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                      crmForm.tags.includes(tag)
                        ? 'bg-fuchsia-600 text-white border-fuchsia-500'
                        : 'bg-gray-100 text-gray-400 border-gray-300 hover:border-fuchsia-500'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notas</label>
              <textarea
                value={crmForm.notes}
                onChange={e => setCrmForm(f => ({ ...f, notes: e.target.value.slice(0, 500) }))}
                placeholder="Preferencias, alergias, observaciones..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 text-sm resize-none focus:outline-none focus:border-gray-400"
              />
              <p className="text-[10px] text-gray-600 mt-1">{crmForm.notes.length}/500</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCrmSave}
                disabled={crmSaving}
                className="flex-1 bg-white hover:bg-gray-800 disabled:opacity-50 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm transition-all"
              >
                {crmSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setShowCrmModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Campaña WhatsApp */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCampaignModal(false)}>
          <div className="bg-white rounded-xl border-2 border-fuchsia-500 w-full max-w-lg p-5 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-700">Campaña WhatsApp</h2>
              <button onClick={() => setShowCampaignModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>

            {/* Selector de segmento */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: 'VIP', seg: 'vip' },
                { label: 'Nuevos', seg: 'new' },
                { label: 'Recurrentes', seg: 'recurrent' },
                { label: 'Inac. 30d', seg: 'inactive30' },
                { label: 'Inac. 60d', seg: 'inactive60' },
                { label: 'Inac. 90d', seg: 'inactive90' },
              ].map(({ label, seg }) => (
                <button key={seg}
                  onClick={() => setCampaignSegment(seg)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    campaignSegment === seg ? 'bg-fuchsia-600 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200 hover:border-fuchsia-500'
                  }`}>
                  {label} ({(customerSegments as any)[seg]?.length ?? 0})
                </button>
              ))}
            </div>

            {/* Preview del mensaje */}
            <div className="bg-gray-100 rounded-lg p-3 mb-4 border border-gray-200">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Vista previa del mensaje</p>
              <p className="text-xs text-gray-500 whitespace-pre-wrap">{getCampaignTemplate(campaignSegment, { name: 'Cliente' })}</p>
            </div>

            {/* Lista de clientes */}
            <div className="overflow-y-auto flex-1 max-h-72 space-y-2 pr-1">
              {((customerSegments as any)[campaignSegment] || []).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Sin clientes en este segmento</p>
              ) : (
                ((customerSegments as any)[campaignSegment] || []).map((c: any) => (
                  <div key={c.phone} className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-gray-800 text-sm font-bold">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.phone}</p>
                    </div>
                    <a href={buildWhatsApp(c.phone, getCampaignTemplate(campaignSegment, c))}
                       target="_blank" rel="noopener noreferrer"
                       className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap">
                      Enviar →
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar canje */}
      {canjeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl border-2 border-orange-500 p-5 max-w-sm w-full">
            <h3 className="text-lg font-black text-orange-400 mb-1">🎁 Marcar como Canje</h3>
            <p className="text-gray-400 text-sm mb-4">
              Esta orden <span className="text-orange-300 font-bold">no se contará en las ventas</span>. Quedará registrada en el módulo financiero para auditoría interna.
            </p>
            <input
              type="text"
              value={canjeNoteInput}
              onChange={e => setCanjeNoteInput(e.target.value)}
              placeholder="Motivo: Influencer @usuario, Cortesía proveedor..."
              className="w-full px-3 py-2 mb-4 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-orange-500/50"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleCanje(canjeModal.orderId, true, canjeNoteInput)}
                disabled={canjeSaving}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold text-sm"
              >
                {canjeSaving ? "Guardando..." : "Confirmar Canje"}
              </button>
              <button
                onClick={() => setCanjeModal(null)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm hover:border-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
