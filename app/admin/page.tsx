"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt?: string;
  paymentMethod?: string;
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
      if (minutes >= 20 && !alerted && (status === 'pending' || status === 'confirmed')) {
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
  const [filter, setFilter] = useState<string>("all");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "customers" | "analytics" | "products" | "inventory" | "marketing">("orders");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customerSegment, setCustomerSegment] = useState<string>("all");
  const [inventory, setInventory] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false);
  const [newMaterialForm, setNewMaterialForm] = useState({ productName: "", unit: "" });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", category: "fit", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] as Array<{ productName: string; unit: string; quantity: number }> });
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
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [marketingSection, setMarketingSection] = useState<"promotions" | "campaigns" | "loyalty">("promotions");
  const [inventorySection, setInventorySection] = useState<"purchases" | "stock">("purchases");
  const [inventorySearchTerm, setInventorySearchTerm] = useState<string>("");
  const [stockSearchTerm, setStockSearchTerm] = useState<string>("");
  const [inventoryDateFilter, setInventoryDateFilter] = useState<string>("");
  const [inventoryMonthFilter, setInventoryMonthFilter] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showInventoryDetailModal, setShowInventoryDetailModal] = useState(false);
  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<any>(null);
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

      // Detectar nuevo pedido y reproducir sonido
      if (previousOrderCount > 0 && data.length > previousOrderCount) {
        // Nuevo pedido detectado - reproducir sonido
        playNotificationSound();
      }

      setPreviousOrderCount(data.length);
      setOrders(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para reproducir sonido de notificación (2+ segundos)
  const playNotificationSound = () => {
    try {
      // Usar el audioContext inicializado o crear uno nuevo
      let ctx = audioContext;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        setAudioContextInitialized(true);
      }

      // Resume el contexto si está suspendido (requerido en Chrome/Edge)
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log("🎵 AudioContext resumed");
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
      playBeep(880, 0, 0.3, 0.5);        // Primer tono (La alto)
      playBeep(880, 0.35, 0.3, 0.5);     // Segundo tono (repetición)
      playBeep(1047, 0.75, 0.8, 0.6);    // Tercer tono largo (Do más alto y sostenido)

      // Tono de confirmación final (más suave)
      playBeep(784, 1.6, 0.4, 0.3);      // Cuarto tono (Sol, confirmación suave)

      console.log("🔔 Sonido de nuevo pedido reproducido - Estado del contexto:", ctx.state);
    } catch (error) {
      console.error("❌ Error al reproducir sonido:", error);
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
      (order.cart && order.cart.some((item: any) => {
        const productName = item.product?.name || item.name || '';
        return productName.toLowerCase().includes(searchTerm.toLowerCase());
      }));

    return statusMatch && searchMatch;
  });

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
    confirmed: "bg-cyan-500/20 text-cyan-400 border-cyan-500",
    delivered: "bg-green-500/20 text-green-400 border-green-500",
    cancelled: "bg-red-500/20 text-red-400 border-red-500",
  };

  const statusLabels = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  // Product CRUD functions
  const handleCreateProduct = async () => {
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
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
      const isDelivered = order.status === "delivered" || order.status === "Entregado";
      if (!isDelivered) return;

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
          const isDelivered = order.status === "delivered" || order.status === "Entregado";
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
          order.status === "delivered" || order.status === "Entregado"
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
          const isDelivered = order.status === "delivered" || order.status === "Entregado";
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
          const isDelivered = order.status === "delivered" || order.status === "Entregado";
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
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Usar pedidos filtrados por fecha
    const ordersToAnalyze = isDateFiltered && dateFrom && dateTo
      ? orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          const fromDate = new Date(dateFrom);
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          return orderDate >= fromDate && orderDate <= toDate;
        })
      : orders;

    // Clientes inactivos (sin comprar en los últimos 30 días)
    const inactiveCustomers = customers.filter((c: any) =>
      new Date(c.lastOrderDate) < thirtyDaysAgo
    );

    // Clientes frecuentes (más de 3 pedidos)
    const frequentCustomers = customers.filter((c: any) => c.totalOrders >= 3);

    // Productos vendidos
    const productSales = new Map();
    ordersToAnalyze.forEach((order: any) => {
      if (order.cart) {
        order.cart.forEach((item: any) => {
          const productId = item.product.id;
          const productName = item.product.name;
          const quantity = item.quantity;

          if (productSales.has(productId)) {
            const existing = productSales.get(productId);
            existing.quantity += quantity;
            existing.revenue += item.product.price * quantity;
          } else {
            productSales.set(productId, {
              name: productName,
              quantity: quantity,
              revenue: item.product.price * quantity,
              category: item.product.category
            });
          }
        });
      }
    });

    const productsArray = Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity);

    // Ingresos totales (basado en pedidos filtrados)
    const totalRevenue = ordersToAnalyze.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

    // Pedidos en los últimos 30 días (o en el rango seleccionado)
    const recentOrders = ordersToAnalyze.filter((o: any) => new Date(o.createdAt) > thirtyDaysAgo);

    // Ticket promedio (basado en pedidos filtrados)
    const averageTicket = ordersToAnalyze.length > 0 ? totalRevenue / ordersToAnalyze.length : 0;

    return {
      inactiveCustomers,
      frequentCustomers,
      topProducts: productsArray.slice(0, 5),
      leastSoldProducts: productsArray.slice(-5).reverse(),
      totalRevenue,
      recentOrders: recentOrders.length,
      averageTicket,
      allProducts: productsArray
    };
  };

  const analytics = getAnalytics();

  return (
    <div className="min-h-screen bg-black">
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
            <Link
              href="/"
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-lg font-bold transition-all neon-border-purple transform hover:scale-105"
            >
              ← Volver al Sitio
            </Link>
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
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "products"
                ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            📋 Ordenes
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "inventory"
                ? "text-fuchsia-400 border-b-4 border-fuchsia-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            📦 Inventario
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
        </div>
      </section>

      {activeTab === "orders" ? (
        <>
          {/* Stats - Solo pedidos de HOY en hora de Perú */}
          <section className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setFilter("all")}
                className={`bg-gray-900 rounded-xl border-2 p-6 transition-all hover:scale-105 cursor-pointer ${
                  filter === "all"
                    ? "border-fuchsia-500 neon-border-purple shadow-xl"
                    : "border-fuchsia-500/30 hover:border-fuchsia-500/60"
                }`}
              >
                <p className="text-gray-400 text-sm font-semibold text-left">
                  Total Pedidos {isDateFiltered ? "(Filtrado)" : "(Hoy)"}
                </p>
                <p className="text-5xl font-black text-white mt-2 text-left">{dateFilteredOrders.length}</p>
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`bg-gray-900 rounded-xl border-2 p-6 transition-all hover:scale-105 cursor-pointer ${
                  filter === "pending"
                    ? "border-yellow-500 shadow-xl shadow-yellow-500/50"
                    : "border-yellow-500/50 hover:border-yellow-500"
                }`}
              >
                <p className="text-yellow-400 text-sm font-bold text-left">Pendientes</p>
                <p className="text-5xl font-black text-yellow-400 mt-2 text-left">
                  {dateFilteredOrders.filter((o) => o.status === "pending").length}
                </p>
              </button>
              <button
                onClick={() => setFilter("confirmed")}
                className={`bg-gray-900 rounded-xl border-2 p-6 transition-all hover:scale-105 cursor-pointer ${
                  filter === "confirmed"
                    ? "border-cyan-500 shadow-xl shadow-cyan-500/50"
                    : "border-cyan-500/50 hover:border-cyan-500"
                }`}
              >
                <p className="text-cyan-400 text-sm font-bold text-left">Confirmados</p>
                <p className="text-5xl font-black text-cyan-400 mt-2 text-left">
                  {dateFilteredOrders.filter((o) => o.status === "confirmed").length}
                </p>
              </button>
              <button
                onClick={() => setFilter("delivered")}
                className={`bg-gray-900 rounded-xl border-2 p-6 transition-all hover:scale-105 cursor-pointer ${
                  filter === "delivered"
                    ? "border-green-500 shadow-xl shadow-green-500/50"
                    : "border-green-500/50 hover:border-green-500"
                }`}
              >
                <p className="text-green-400 text-sm font-bold text-left">Entregados</p>
                <p className="text-5xl font-black text-green-400 mt-2 text-left">
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
                  order.status === 'confirmed' ? 'ring-2 ring-cyan-500/50' :
                  order.status === 'delivered' ? 'ring-2 ring-green-500/30 opacity-60' :
                  'ring-2 ring-red-500/30 opacity-50'
                }`}
              >
                {/* LAYOUT HORIZONTAL TIPO CINTA */}
                <div className="flex items-center gap-3 p-3">

                  {/* HEADER: ESTADO Y NÚMERO */}
                  <div className={`flex-shrink-0 px-3 py-2 rounded ${
                    order.status === 'pending' ? 'bg-yellow-500/20' :
                    order.status === 'confirmed' ? 'bg-cyan-500/20' :
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
                  </div>

                  {/* SECCIÓN 1: PRODUCTOS */}
                  <div className="flex-1 bg-black rounded border border-white/10 px-3 py-2">
                    <h3 className="text-xs font-black text-white uppercase mb-2">🍽️ PEDIDO</h3>
                    <div className="flex flex-wrap gap-2">
                      {order.cart && Array.isArray(order.cart) && order.cart.length > 0 ? (
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
                          onClick={() => updateOrderStatus(order.id, "delivered")}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded text-xs font-black uppercase transition-all"
                        >
                          ✓ Entregado
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black uppercase transition-all"
                        >
                          ✕
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
            {selectedCustomer ? (
              /* Customer Detail View */
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-6">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="mb-4 text-fuchsia-400 hover:text-fuchsia-300 font-bold transition-all"
                >
                  ← Volver a la lista
                </button>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">{selectedCustomer.name}</h2>
                    <p className="text-gray-400">DNI: {selectedCustomer.dni}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-fuchsia-400 neon-glow-purple">{selectedCustomer.totalOrders}</p>
                    <p className="text-sm text-gray-400">pedidos realizados</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-black/50 rounded-lg p-4 border border-fuchsia-500/20">
                    <p className="text-sm font-bold text-fuchsia-400 mb-2">Teléfono</p>
                    <p className="text-white text-lg">{selectedCustomer.phone}</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-fuchsia-500/20">
                    <p className="text-sm font-bold text-fuchsia-400 mb-2">Email</p>
                    <p className="text-white text-lg">{selectedCustomer.email || "No proporcionado"}</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-fuchsia-500/20">
                    <p className="text-sm font-bold text-fuchsia-400 mb-2">Última Compra</p>
                    <p className="text-white text-lg">{new Date(selectedCustomer.lastOrderDate).toLocaleDateString("es-PE")}</p>
                  </div>
                </div>

                <div className="bg-black/50 rounded-lg p-4 border border-fuchsia-500/20 mb-6">
                  <p className="text-sm font-bold text-fuchsia-400 mb-2">Dirección</p>
                  <p className="text-white text-lg">{selectedCustomer.address}</p>
                </div>

                <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30 mb-6">
                  <p className="text-2xl font-black text-amber-400 gold-glow">Total Gastado: S/ {selectedCustomer.totalSpent.toFixed(2)}</p>
                </div>

                <h3 className="text-xl font-black text-fuchsia-400 mb-4">Historial Completo de Pedidos</h3>
                <div className="space-y-3">
                  {selectedCustomer.orders.map((order: any) => (
                    <div key={order.id} className="bg-black/50 rounded-lg p-4 border border-fuchsia-500/20">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-white font-bold">Pedido #{order.id}</p>
                          <p className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleString("es-PE")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-black text-lg">S/ {order.totalPrice?.toFixed(2) || "0.00"}</p>
                          <span className={`text-xs px-3 py-1 rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                            {statusLabels[order.status as keyof typeof statusLabels]}
                          </span>
                        </div>
                      </div>
                      {order.cart && (
                        <div className="border-t border-fuchsia-500/20 pt-3 mt-3">
                          <p className="text-xs font-bold text-fuchsia-400 mb-2">Productos:</p>
                          <div className="space-y-1">
                            {order.cart.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-300">{item.product.name} x{item.quantity}</span>
                                <span className="text-white">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : loading ? (
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

                <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-fuchsia-500/10 border-b-2 border-fuchsia-500/30">
                    <tr>
                      <th className="text-left p-4 text-fuchsia-400 font-bold">DNI</th>
                      <th className="text-left p-4 text-fuchsia-400 font-bold">Nombre</th>
                      <th className="text-left p-4 text-fuchsia-400 font-bold">Teléfono</th>
                      <th className="text-center p-4 text-fuchsia-400 font-bold">Pedidos</th>
                      <th className="text-right p-4 text-fuchsia-400 font-bold">Total Gastado</th>
                      <th className="text-center p-4 text-fuchsia-400 font-bold">Última Compra</th>
                      <th className="text-center p-4 text-fuchsia-400 font-bold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer: any, idx: number) => {
                      const daysSinceLastOrder = Math.floor((new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr
                          key={customer.dni}
                          onClick={() => setSelectedCustomer(customer)}
                          className={`border-b border-fuchsia-500/10 hover:bg-fuchsia-500/5 cursor-pointer transition-all ${
                            idx % 2 === 0 ? "bg-black/20" : ""
                          }`}
                        >
                          <td className="p-4 text-fuchsia-400 font-bold hover:text-fuchsia-300">
                            {customer.dni}
                          </td>
                          <td className="p-4 text-white">{customer.name}</td>
                          <td className="p-4 text-gray-300">{customer.phone}</td>
                          <td className="p-4 text-center">
                            <span className="inline-block px-3 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-400 font-bold">
                              {customer.totalOrders}
                            </span>
                          </td>
                          <td className="p-4 text-right text-amber-400 font-black gold-glow">
                            S/ {customer.totalSpent.toFixed(2)}
                          </td>
                          <td className="p-4 text-center text-gray-300 text-sm">
                            {new Date(customer.lastOrderDate).toLocaleDateString("es-PE")}
                          </td>
                          <td className="p-4 text-center">
                            {customer.totalOrders > 1 ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500">
                                ⭐ Recurrente
                              </span>
                            ) : daysSinceLastOrder > 30 ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500">
                                ⚠️ Inactivo
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500">
                                🆕 Nuevo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 rounded-xl border-2 border-green-500/50 p-6">
                <p className="text-green-400 text-sm font-bold mb-2">Ingresos Totales</p>
                <p className="text-4xl font-black text-green-400">S/ {analytics.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-gray-900 rounded-xl border-2 border-cyan-500/50 p-6">
                <p className="text-cyan-400 text-sm font-bold mb-2">Ticket Promedio</p>
                <p className="text-4xl font-black text-cyan-400">S/ {analytics.averageTicket.toFixed(2)}</p>
              </div>
              <div className="bg-gray-900 rounded-xl border-2 border-amber-500/50 p-6">
                <p className="text-amber-400 text-sm font-bold mb-2">Pedidos (30 días)</p>
                <p className="text-4xl font-black text-amber-400">{analytics.recentOrders}</p>
              </div>
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/50 p-6">
                <p className="text-fuchsia-400 text-sm font-bold mb-2">Clientes Frecuentes</p>
                <p className="text-4xl font-black text-fuchsia-400">{analytics.frequentCustomers.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Top Products */}
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 p-6">
                <h3 className="text-xl font-black text-fuchsia-400 mb-4">🏆 Productos Más Vendidos</h3>
                <div className="space-y-3">
                  {analytics.topProducts.map((product: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-black/50 rounded-lg p-3 border border-fuchsia-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-fuchsia-400">{idx + 1}</span>
                        <div>
                          <p className="text-white font-bold text-sm">{product.name}</p>
                          <p className="text-gray-400 text-xs">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-black gold-glow">S/ {product.revenue.toFixed(2)}</p>
                        <p className="text-gray-400 text-xs">{product.quantity} unidades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Least Sold Products */}
              <div className="bg-gray-900 rounded-xl border-2 border-red-500/30 p-6">
                <h3 className="text-xl font-black text-red-400 mb-4">📉 Productos Menos Vendidos</h3>
                <div className="space-y-3">
                  {analytics.leastSoldProducts.map((product: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-black/50 rounded-lg p-3 border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-red-400">{idx + 1}</span>
                        <div>
                          <p className="text-white font-bold text-sm">{product.name}</p>
                          <p className="text-gray-400 text-xs">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-black gold-glow">S/ {product.revenue.toFixed(2)}</p>
                        <p className="text-gray-400 text-xs">{product.quantity} unidades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Segments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Frequent Customers */}
              <div className="bg-gray-900 rounded-xl border-2 border-amber-500/30 p-6">
                <h3 className="text-xl font-black text-amber-400 mb-4">⭐ Clientes Frecuentes (3+ pedidos)</h3>
                {analytics.frequentCustomers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No hay clientes frecuentes aún</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.frequentCustomers.slice(0, 5).map((customer: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-black/50 rounded-lg p-3 border border-amber-500/20 hover:border-amber-500/50 cursor-pointer transition-all" onClick={() => { setActiveTab("customers"); setSelectedCustomer(customer); }}>
                        <div>
                          <p className="text-white font-bold text-sm">{customer.name}</p>
                          <p className="text-gray-400 text-xs">DNI: {customer.dni}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-black gold-glow">{customer.totalOrders} pedidos</p>
                          <p className="text-gray-400 text-xs">S/ {customer.totalSpent.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    {analytics.frequentCustomers.length > 5 && (
                      <p className="text-center text-xs text-gray-400 pt-2">+ {analytics.frequentCustomers.length - 5} clientes más</p>
                    )}
                  </div>
                )}
              </div>

              {/* Inactive Customers */}
              <div className="bg-gray-900 rounded-xl border-2 border-red-500/30 p-6">
                <h3 className="text-xl font-black text-red-400 mb-4">⚠️ Clientes Inactivos (30+ días)</h3>
                {analytics.inactiveCustomers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No hay clientes inactivos</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.inactiveCustomers.slice(0, 5).map((customer: any, idx: number) => {
                      const daysSinceLastOrder = Math.floor((new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={idx} className="flex items-center justify-between bg-black/50 rounded-lg p-3 border border-red-500/20 hover:border-red-500/50 cursor-pointer transition-all" onClick={() => { setActiveTab("customers"); setSelectedCustomer(customer); }}>
                          <div>
                            <p className="text-white font-bold text-sm">{customer.name}</p>
                            <p className="text-gray-400 text-xs">DNI: {customer.dni}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-400 font-bold text-sm">{daysSinceLastOrder} días</p>
                            <p className="text-gray-400 text-xs">{customer.totalOrders} pedidos totales</p>
                          </div>
                        </div>
                      );
                    })}
                    {analytics.inactiveCustomers.length > 5 && (
                      <p className="text-center text-xs text-gray-400 pt-2">+ {analytics.inactiveCustomers.length - 5} clientes más</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      ) : activeTab === "products" ? (
        /* Products Tab */
        <>
          <section className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-fuchsia-400 neon-glow-purple">Gestión de Ordenes</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: "", category: "fit", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] });
                  setShowProductModal(true);
                }}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-lg font-bold transition-all neon-border-purple transform hover:scale-105"
              >
                + Nueva Orden
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 p-6">
                <p className="text-gray-400 text-sm font-semibold">Total Ordenes</p>
                <p className="text-5xl font-black text-white mt-2">{products.length}</p>
              </div>
              <div className="bg-gray-900 rounded-xl border-2 border-green-500/50 p-6">
                <p className="text-green-400 text-sm font-bold">Activos</p>
                <p className="text-5xl font-black text-green-400 mt-2">
                  {products.filter((p) => p.active).length}
                </p>
              </div>
              <div className="bg-gray-900 rounded-xl border-2 border-amber-500/50 p-6">
                <p className="text-amber-400 text-sm font-bold">Precio Promedio</p>
                <p className="text-4xl font-black text-amber-400 mt-2">
                  S/ {products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="bg-gray-900 rounded-xl border-2 border-purple-500/50 p-6">
                <p className="text-purple-400 text-sm font-bold">Margen Promedio</p>
                <p className="text-4xl font-black text-purple-400 mt-2">
                  {products.length > 0 ? (products.reduce((sum, p) => {
                    if (!p.price || p.price === 0) return sum;
                    return sum + ((p.price - p.cost) / p.price * 100);
                  }, 0) / products.length).toFixed(1) : '0'}%
                </p>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500/30 overflow-hidden">
              <table className="w-full">
                <thead className="bg-black border-b-2 border-fuchsia-500/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-fuchsia-400">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-fuchsia-400">Categoría</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-fuchsia-400">Precio Venta</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-fuchsia-400">Costo</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-fuchsia-400">Margen</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-fuchsia-400">Estado</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-fuchsia-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => {
                    const margin = product.price && product.price > 0
                      ? ((product.price - product.cost) / product.price * 100)
                      : 0;
                    return (
                      <tr key={product.id} className={`border-b border-fuchsia-500/10 hover:bg-black/50 transition-all ${idx % 2 === 0 ? 'bg-gray-900/50' : ''}`}>
                        <td className="px-6 py-4 text-white font-bold">{product.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            product.category === 'fit' ? 'bg-cyan-500/20 text-cyan-400' :
                            product.category === 'fat' ? 'bg-red-500/20 text-red-400' :
                            product.category === 'extra-papas' ? 'bg-amber-500/20 text-amber-400' :
                            product.category === 'extra-salsas' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {product.category === 'extra-papas' ? 'EXTRA PAPAS' :
                             product.category === 'extra-salsas' ? 'EXTRA SALSAS' :
                             product.category.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-green-400 font-black">S/ {(product.price || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-gray-400">S/ {(product.cost || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-black ${margin >= 50 ? 'text-green-400' : margin >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            product.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {product.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openEditProduct(product)}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Product Modal */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 p-6 max-w-md w-full">
                <h3 className="text-2xl font-black text-fuchsia-400 mb-4">
                  {editingProduct ? 'Editar Orden' : 'Nueva Orden'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-400 mb-1">Nombre de la Orden</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                      placeholder="Ej: PEQUEÑO DILEMA, DUO DILEMA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-fuchsia-400 mb-1">Categoría</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                    >
                      <option value="fit">FIT (Ensaladas)</option>
                      <option value="fat">FAT (Alitas)</option>
                      <option value="bebida">Bebidas</option>
                      <option value="extra-papas">EXTRA PAPAS</option>
                      <option value="extra-salsas">EXTRA SALSAS</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Precio Venta</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-fuchsia-400 mb-1">Costo</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.cost}
                        onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-black border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.active}
                      onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm text-white">Producto activo</label>
                  </div>

                  {/* Sección de Componentes/Receta */}
                  <div className="bg-black/50 rounded-lg p-3 border border-cyan-500/30">
                    <p className="text-sm font-bold text-cyan-400 mb-1">Materiales/Empaques</p>
                    <p className="text-xs text-gray-400 mb-3">Selecciona los materiales e insumos que se usan en esta orden</p>

                    {/* Lista de componentes */}
                    {productForm.components.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {productForm.components.map((comp, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-900 rounded px-2 py-1 text-xs">
                            <span className="text-white">
                              <span className="font-bold">{comp.quantity}</span> {comp.unit} de <span className="text-cyan-400">{comp.productName}</span>
                            </span>
                            <button
                              onClick={() => {
                                const newComponents = productForm.components.filter((_, i) => i !== idx);
                                setProductForm({ ...productForm, components: newComponents });
                              }}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agregar componente */}
                    <div className="grid grid-cols-12 gap-2">
                      <select
                        id="component-product-select"
                        className="col-span-8 px-2 py-1 text-xs rounded bg-gray-900 border border-gray-700 text-white focus:border-cyan-400 focus:outline-none"
                        defaultValue=""
                      >
                        <option value="">Seleccionar material del inventario...</option>
                        {(() => {
                          // Obtener productos únicos del inventario (compras registradas)
                          const stockMap = new Map<string, { productName: string; unit: string }>();
                          inventory.forEach((purchase: any) => {
                            purchase.items.forEach((item: any) => {
                              const key = `${item.productName}-${item.unit}`;
                              if (!stockMap.has(key)) {
                                stockMap.set(key, {
                                  productName: item.productName,
                                  unit: item.unit,
                                });
                              }
                            });
                          });

                          // También agregar materiales del catálogo con categoría de inventario
                          catalogProducts.forEach((product: any) => {
                            const materialCategories = ['EMPAQUE', 'INSUMO', 'SERVICIO', 'COSTO FIJO', 'UTENCILIO'];
                            if (materialCategories.includes(product.category)) {
                              const key = `${product.name}-${product.unit}`;
                              if (!stockMap.has(key)) {
                                stockMap.set(key, {
                                  productName: product.name,
                                  unit: product.unit,
                                });
                              }
                            }
                          });

                          return Array.from(stockMap.values())
                            .sort((a, b) => a.productName.localeCompare(b.productName))
                            .map((item, idx) => (
                              <option key={idx} value={JSON.stringify(item)}>
                                {item.productName} ({item.unit})
                              </option>
                            ));
                        })()}
                      </select>
                      <input
                        type="number"
                        id="component-quantity-input"
                        min="1"
                        step="1"
                        placeholder="Cantidad"
                        onKeyDown={(e) => {
                          // Prevenir decimales: solo permite números enteros
                          if (e.key === '.' || e.key === ',') {
                            e.preventDefault();
                          }
                        }}
                        className="col-span-3 px-2 py-1 text-xs rounded bg-gray-900 border border-gray-700 text-white focus:border-cyan-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => {
                          const select = document.getElementById('component-product-select') as HTMLSelectElement;
                          const quantityInput = document.getElementById('component-quantity-input') as HTMLInputElement;

                          if (select.value && quantityInput.value) {
                            const selectedProduct = JSON.parse(select.value);
                            const quantity = parseInt(quantityInput.value, 10);

                            if (quantity > 0 && Number.isInteger(quantity)) {
                              setProductForm({
                                ...productForm,
                                components: [
                                  ...productForm.components,
                                  {
                                    productName: selectedProduct.productName,
                                    unit: selectedProduct.unit,
                                    quantity: quantity,
                                  }
                                ]
                              });

                              // Reset inputs
                              select.value = "";
                              quantityInput.value = "";
                            }
                          }
                        }}
                        className="col-span-1 px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {productForm.price > 0 && productForm.cost > 0 && (
                    <div className="bg-black/50 rounded-lg p-3 border border-fuchsia-500/30">
                      <p className="text-xs text-gray-400 mb-1">Margen de ganancia:</p>
                      <p className="text-2xl font-black text-fuchsia-400">
                        {((productForm.price - productForm.cost) / productForm.price * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Ganancia: S/ {(productForm.price - productForm.cost).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                      setProductForm({ name: "", category: "fit", price: 0, cost: 0, active: true, stock: 0, minStock: 10, maxStock: 100, components: [] });
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg font-bold transition-all neon-border-purple"
                  >
                    {editingProduct ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : activeTab === "inventory" ? (
        /* Inventory Tab */
        <>
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-black text-fuchsia-400 neon-glow-purple mb-6">Control de Inventario</h2>

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
                                          setSelectedPurchaseDetail(purchase);
                                          setShowInventoryDetailModal(true);
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                                        title="Ver detalles"
                                      >
                                        🔍
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

          {/* Inventory Modal */}
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
      ) : null}
    </div>
  );
}
