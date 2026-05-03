"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import WhatsAppButton from "../components/WhatsAppButton";
import CombosButton from "../components/CombosButton";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import { detectCombos } from "../../lib/combos";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "fit" | "fat" | "bebida" | "taco";
  soldOut?: boolean;
  oldPrice?: number;
}

interface CompletedOrder {
  productId: string;
  quantity: number;
  salsas?: string[];
  complementIds: string[];
  discountApplied?: boolean;
  originalPrice?: number;
  finalPrice?: number;
  category?: string;
  comboGroupId?: string;
  comboName?: string;
  comboPrice?: number;
  comboOriginalTotal?: number;
}

const products: Product[] = [
  {
    id: "ensalada-clasica",
    name: "CLÁSICA FRESH BOWL",
    description: "Todo en un bowl sin excusas. Lechuga bogi, palta, huevo, tomate cherry, zanahoria, pepino y maíz americano. Vinagreta de la casa que lo amarra todo.",
    price: 18.50,
    image: "/1.png",
    category: "fit",
  },
  {
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    description: "El clásico que no falla — acá lo hacemos mejor. Lechuga romana, pollo grillado, tomate cherry, crutones y parmesano. César cremosa de la casa incluida.",
    price: 22.50,
    image: "/2.png",
    category: "fit",
  },
  {
    id: "ensalada-caesar",
    name: "PROTEIN FIT BOWL",
    description: "Para los que se cuidan sin aburrirse. Mix de hojas verdes, quinua, palta, tomate cherry, semillas y pollo grillado. Aderezo de yogurt griego que no te esperas.",
    price: 23.50,
    image: "/3.png",
    category: "fit",
  },
  {
    id: "cobb-supreme-bowl",
    name: "COBB SUPREME BOWL",
    description: "Lechuga fresca con pollo grillado, tocino ahumado crocante, queso fresco, tomate en dados, huevo cocido y palta en cubos, acompañado de vinagreta de la casa.",
    price: 23.50,
    image: "/cobb.png",
    category: "fit",
  },
  {
    id: "ensalada-mediterranea",
    name: "TUNA FRESH BOWL",
    description: "El mar en un bowl. Atún en trozos, lechuga romana, tomate cherry, pepino, maíz americano, palta y huevo. Con aderezo cremoso especial de la casa.",
    price: 23.50,
    image: "/4.png",
    category: "fit",
  },
  {
    id: "crispy-chicken-bowl",
    name: "CRISPY CHICKEN BOWL",
    description: "Mix de hojas verdes con pollo crispy dorado, maíz americano, queso mozzarella, tomate cherry y slices de palta, acompañado de aderezo honey mustard.",
    price: 22.50,
    image: "/crispy.png",
    category: "fit",
  },
  {
    id: "pasta-power-bowl",
    name: "PASTA POWER BOWL",
    description: "Fideos tipo tornillo combinados con zanahoria en cubos, maíz americano, arvejitas, jamón y brócoli, acompañados de jugosos dados de pollo grillado y bañados con nuestro aderezo especial de la casa.",
    price: 22.50,
    image: "/pasta.png",
    category: "fit",
  },
];

// Productos de FAT para visualización de órdenes cruzadas
const fatProducts: Product[] = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    description: "8 alitas acompañadas de papas y 01 salsa favorita.",
    price: 22.00,
    image: "/pequeno-dilema.png?v=3",
    category: "fat",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    description: "14 alitas acompañadas de papas francesas y 02 de tus salsas favoritas.",
    price: 34.00,
    image: "/duo-dilema.png?v=3",
    category: "fat",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    description: "20 alitas acompañadas de papas francesas y 03 de tus salsas favoritas.",
    price: 47.00,
    image: "/todos-pecan.png?v=3",
    category: "fat",
  },
];

const tacoFlavorNames: Record<string, string> = {
  "santo-crujiente": "Crunch Supreme Taco",
  "tex-dilema": "Tex Supreme Taco",
  "santo-bacon": "Bacon Deluxe Taco",
};

// Productos de TACOS para visualización de órdenes cruzadas
const tacoProducts: Product[] = [
  {
    id: "taco-duo",
    name: "Dúo de Tacos",
    description: "Elige 2 sabores de taco.",
    price: 24.90,
    image: "/tacoinicio.png",
    category: "taco",
  },
  {
    id: "trio-taco-classico",
    name: "Trío Taco Clásico",
    description: "3 tacos auténticos con tortilla recién hecha, carne marinada al estilo tradicional.",
    price: 22.90,
    image: "/tacoinicio.png",
    category: "taco",
  },
  {
    id: "taco-fiesta-mix",
    name: "Taco Fiesta Mix",
    description: "5 tacos variados con diferentes proteínas.",
    price: 32.90,
    image: "/tacoinicio.png",
    category: "taco",
  },
  {
    id: "mega-taco-combo",
    name: "Mega Taco Combo",
    description: "7 tacos épicos con mix de proteínas premium.",
    price: 42.90,
    image: "/tacoinicio.png",
    category: "taco",
  },
];

const salsas: { id: string; name: string }[] = [
  { id: "barbecue", name: "Barbecue" },
  { id: "anticuchos", name: "Anticuchos" },
  { id: "ahumada", name: "Ahumada" },
  { id: "buffalo-picante", name: "Buffalo picante" },
  { id: "honey-mustard", name: "Honey mustard" },
  { id: "macerichada", name: "Macerichada" },
  { id: "teriyaki", name: "Oriental Teriyaki" },
  { id: "parmesano-ajo", name: "Parmesano & Ajo" },
];

const availableComplements: Record<string, { name: string; price: number }> = {
  "agua-mineral": { name: "Agua mineral", price: 4.00 },
  "coca-cola": { name: "Coca Cola 500ml", price: 4.00 },
  "inka-cola": { name: "Inka Cola 500ml", price: 4.00 },
  "sprite": { name: "Sprite 500ml", price: 4.00 },
  "fanta": { name: "Fanta 500ml", price: 4.00 },
  "extra-aderezo": { name: "Extra aderezo", price: 3.00 },
  "extra-papas": { name: "Extra papas", price: 5.00 },
  "extra-salsa": { name: "Extra salsa", price: 3.00 },
  "pollo-grillado": { name: "Pollo grillado", price: 5.00 },
  "nachos": { name: "Nachos", price: 0 },
  "chifles": { name: "Chifles", price: 0 },
  "papas-fritas": { name: "Papas fritas", price: 0 },
};

export default function FitPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<Record<string, any[]>>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successProductName, setSuccessProductName] = useState('');
  const [isSafari, setIsSafari] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showBebidas, setShowBebidas] = useState<Record<string, boolean>>({});
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const [mainProductsInCart, setMainProductsInCart] = useState<Record<string, string>>({});
  const [complementsInCart, setComplementsInCart] = useState<Record<string, string[]>>({});
  const [orderQuantity, setOrderQuantity] = useState<Record<string, number>>({});
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrderIndex, setDeleteOrderIndex] = useState<number | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState<boolean>(false);
  const [editingOrderIndex, setEditingOrderIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(isBusinessOpen);
  const [menuStock, setMenuStock] = useState<Record<string, boolean>>({});
  const [menuDiscounts, setMenuDiscounts] = useState<Record<string, number>>({});
  const [menuPrices, setMenuPrices] = useState<Record<string, number>>({});
  const horaLocaActive = false;
  const router = useRouter();

  // Detección de combos promocionales
  const comboResult = useMemo(() => detectCombos(completedOrders), [completedOrders]);
  const hasComboDiscount = comboResult.appliedCombos.length > 0;
  const comboDiscountAmount = comboResult.totalSavings;

  const completedTotal = completedOrders.reduce((total, order) => {
    const basePrice = order.finalPrice ?? order.originalPrice ?? (() => {
      let product = products.find(p => p.id === order.productId);
      if (!product) product = fatProducts.find(p => p.id === order.productId);
      if (!product) product = tacoProducts.find(p => p.id === order.productId);
      return product ? (menuPrices[product.id] || product.price) : 0;
    })();
    let orderTotal = basePrice * order.quantity;
    order.complementIds.forEach(compId => {
      const complement = availableComplements[compId];
      if (complement) orderTotal += complement.price;
    });
    return total + orderTotal;
  }, 0);

  const comboTotal = completedTotal - comboDiscountAmount;

  const navigateToCheckout = () => {
    clearCart();
    completedOrders.forEach(order => {
      let product = products.find(p => p.id === order.productId);
      if (!product) product = fatProducts.find(p => p.id === order.productId);
      if (!product) product = tacoProducts.find(p => p.id === order.productId);
      if (product) {
        const basePrice = menuPrices[product.id] || product.price;
        const finalUnitPrice = order.finalPrice ?? basePrice;
        const discountedProduct = { ...product, price: finalUnitPrice };
        addToCart(discountedProduct, order.quantity);
        order.complementIds.forEach(compId => {
          const complement = availableComplements[compId];
          if (complement) {
            addToCart({
              id: compId,
              name: complement.name,
              description: "",
              price: complement.price,
              image: "🥤",
              category: "bebida"
            }, 1);
          }
        });
      }
    });
    router.push('/checkout');
  };


  // Cargar órdenes al inicio, filtrando solo las de otras categorías
  useEffect(() => {
    const savedOrders = sessionStorage.getItem("santo-dilema-orders");
    if (savedOrders) {
      try {
        const allOrders = JSON.parse(savedOrders);
        // Mantener solo las órdenes que NO son "fit"
        const otherOrders = allOrders.filter((order: CompletedOrder) => order.category !== "fit");
        setCompletedOrders(otherOrders);

        // Si había órdenes fit, las limpiamos del sessionStorage
        if (otherOrders.length !== allOrders.length) {
          sessionStorage.setItem("santo-dilema-orders", JSON.stringify(otherOrders));
        }
      } catch (error) {
        console.error("Error loading orders:", error);
      }
    }
    // Limpiar el carrito siempre
    sessionStorage.removeItem("santo-dilema-cart");
    clearCart();
  }, []);

  useEffect(() => {
    if (completedOrders.length > 0) {
      sessionStorage.setItem("santo-dilema-orders", JSON.stringify(completedOrders));
    } else {
      sessionStorage.removeItem("santo-dilema-orders");
    }
  }, [completedOrders]);

  // Detectar si se debe auto-editar una orden al cargar la página
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editOrderParam = urlParams.get('editOrder');

    if (editOrderParam !== null && completedOrders.length > 0) {
      const orderIndex = parseInt(editOrderParam, 10);

      if (!isNaN(orderIndex) && orderIndex >= 0 && orderIndex < completedOrders.length) {
        // Limpiar el parámetro de la URL
        window.history.replaceState({}, '', '/fit');

        // Ejecutar la edición después de un pequeño delay para asegurar que todo esté cargado
        setTimeout(() => {
          handleEditOrder(orderIndex);
        }, 300);
      }
    }
  }, [completedOrders]);

  useEffect(() => {
    const interval = setInterval(() => setIsOpen(isBusinessOpen()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar estado de stock y descuentos desde el servidor
  useEffect(() => {
    fetch("/api/menu-stock")
      .then((r) => r.json())
      .then((data) => setMenuStock(data))
      .catch(() => {});
    fetch("/api/menu-discounts")
      .then((r) => r.json())
      .then((data) => setMenuDiscounts(data))
      .catch(() => {});
    fetch("/api/menu-prices")
      .then((r) => r.json())
      .then((data) => setMenuPrices(data))
      .catch(() => {});
  }, []);

  const handleCardClick = (productId: string) => {
    if (isDragging) return;
    setExpandedCard(productId);
    setIsEditingOrder(false);
    if (!orderQuantity[productId]) {
      setOrderQuantity(prev => ({ ...prev, [productId]: 1 }));
    }
    if (!selectedComplements[productId]) {
      setSelectedComplements(prev => ({ ...prev, [productId]: [] }));
    }
  };

  const handleIncreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 1;
    setOrderQuantity(prev => ({ ...prev, [productId]: currentQty + 1 }));
  };

  const handleDecreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 1;
    if (currentQty > 1) {
      setOrderQuantity(prev => ({ ...prev, [productId]: currentQty - 1 }));
    }
  };

  const handleCompleteOrder = (product: Product) => {
    const qty = orderQuantity[product.id] || 1;
    const effectiveBasePrice = menuPrices[product.id] || product.price;
    // Hora Loca: S/20 para todas las ensaladas excepto CLÁSICA FRESH BOWL
    const isHoraLocaProduct = horaLocaActive && product.id !== 'ensalada-clasica';
    // Si hay descuento en menuDiscounts, ese es el precio final promocional
    const discountPrice = menuDiscounts[product.id];
    const final = isHoraLocaProduct ? 20 : (discountPrice || effectiveBasePrice);
    const orig = (isHoraLocaProduct || discountPrice) ? effectiveBasePrice : (product.oldPrice || effectiveBasePrice);
    const hasPromo = isHoraLocaProduct || !!discountPrice || !!product.oldPrice;

    const completedOrder: CompletedOrder = {
      productId: product.id,
      quantity: qty,
      complementIds: complementsInCart[product.id] || [],
      discountApplied: hasPromo,
      originalPrice: orig,
      finalPrice: final
    };
    if (isEditingOrder && editingOrderIndex !== null) {
      setCompletedOrders((prev) => prev.map((order, idx) => idx === editingOrderIndex ? completedOrder : order));
      setEditingOrderIndex(null);
    } else {
      setCompletedOrders((prev) => [...prev, completedOrder]);
    }

    setSelectedComplements((prev) => ({ ...prev, [product.id]: [] }));
    setShowBebidas((prev) => ({ ...prev, [product.id]: false }));
    setMainProductsInCart((prev) => {
      const newState = { ...prev };
      delete newState[product.id];
      return newState;
    });
    setComplementsInCart((prev) => {
      const newState = { ...prev };
      delete newState[product.id];
      return newState;
    });
    setOrderQuantity((prev) => {
      const newState = { ...prev };
      delete newState[product.id];
      return newState;
    });
    setExpandedCard(null);
    setSuccessProductName(product.name);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2800);
    setTimeout(() => {
      document.getElementById('tu-orden-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleEditOrder = (orderIndex: number) => {
    const order = completedOrders[orderIndex];
    if (!order) return;

    // Verificar si la orden pertenece al menú fat o tacos
    const isFatOrder = fatProducts.some(p => p.id === order.productId);
    const isTacoOrderEdit = tacoProducts.some(p => p.id === order.productId);

    if (isFatOrder) {
      router.push(`/fat?editOrder=${orderIndex}`);
      return;
    }
    if (isTacoOrderEdit) {
      router.push(`/tacos?editOrder=${orderIndex}`);
      return;
    }

    setEditingOrderIndex(orderIndex);
    setOrderQuantity((prev) => ({ ...prev, [order.productId]: order.quantity }));
    setComplementsInCart((prev) => ({ ...prev, [order.productId]: order.complementIds }));
    setIsEditingOrder(true);
    setExpandedCard(order.productId);
  };

  const handleDeleteOrder = (orderIndex: number) => {
    setDeleteOrderIndex(orderIndex);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = () => {
    if (deleteOrderIndex === null) return;

    const order = completedOrders[deleteOrderIndex];
    if (!order) return;

    setCompletedOrders((prev) => prev.filter((_, idx) => idx !== deleteOrderIndex));

    const cartItemId = `${order.productId}-main`;
    removeFromCart(cartItemId);

    order.complementIds.forEach((complementId) => {
      removeFromCart(complementId);
    });

    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  };

  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  };

  const handleDeleteComboGroup = (groupId: string) => {
    setCompletedOrders(prev => prev.filter(o => o.comboGroupId !== groupId));
  };

  const handleAddComplement = (productId: string, complement: Product) => {
    addToCart(complement, 1);

    setComplementsInCart((prev) => ({
      ...prev,
      [productId]: [...(prev[productId] || []), complement.id]
    }));

    const key = `${productId}-${complement.id}`;
    setRecentlyAdded((prev) => new Set(prev).add(key));

    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 800);
  };

  const handleRemoveComplement = (productId: string, complementId: string) => {
    const complementsForProduct = complementsInCart[productId] || [];
    const indexToRemove = complementsForProduct.lastIndexOf(complementId);

    if (indexToRemove !== -1) {
      removeFromCart(complementId);

      const newComplements = [...complementsForProduct];
      newComplements.splice(indexToRemove, 1);

      setComplementsInCart((prev) => ({
        ...prev,
        [productId]: newComplements
      }));
    }
  };

  const getComplementCount = (productId: string, complementId: string): number => {
    const complementsForProduct = complementsInCart[productId] || [];
    return complementsForProduct.filter(id => id === complementId).length;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="min-h-screen bg-black relative">

      {/* Toast de orden agregada */}
      {showSuccessToast && (
        <div className="fixed bottom-24 left-1/2 z-[400] pointer-events-none" style={{ transform: 'translateX(-50%)', animation: 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}>
          <div className="bg-gray-900 border-2 border-cyan-400/80 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl shadow-cyan-500/40">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="text-white font-black text-sm whitespace-nowrap">¡Orden agregada!</p>
              <p className="text-cyan-300 text-xs whitespace-nowrap font-medium">{successProductName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Decoración carnavalesca sutil */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Cadeneta de carnaval */}
        <svg className="absolute top-4 left-0 w-full h-16 opacity-35" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <line x1="0" y1="8" x2="1200" y2="8" stroke="#666" strokeWidth="1.5" opacity="0.4"/>
          {/* Banderines triangulares */}
          <polygon points="40,8 20,40 60,40" fill="#ec4899" opacity="0.8"/>
          <polygon points="140,8 120,40 160,40" fill="#fbbf24" opacity="0.8"/>
          <polygon points="240,8 220,40 260,40" fill="#a855f7" opacity="0.8"/>
          <polygon points="340,8 320,40 360,40" fill="#22d3ee" opacity="0.8"/>
          <polygon points="440,8 420,40 460,40" fill="#ef4444" opacity="0.8"/>
          <polygon points="540,8 520,40 560,40" fill="#f59e0b" opacity="0.8"/>
          <polygon points="640,8 620,40 660,40" fill="#ec4899" opacity="0.8"/>
          <polygon points="740,8 720,40 760,40" fill="#22d3ee" opacity="0.8"/>
          <polygon points="840,8 820,40 860,40" fill="#a855f7" opacity="0.8"/>
          <polygon points="940,8 920,40 960,40" fill="#fbbf24" opacity="0.8"/>
          <polygon points="1040,8 1020,40 1060,40" fill="#ef4444" opacity="0.8"/>
          <polygon points="1140,8 1120,40 1160,40" fill="#22d3ee" opacity="0.8"/>
        </svg>

        {/* Globos de carnaval - Izquierda */}
        <div className="absolute top-20 left-8 opacity-40">
          <svg width="60" height="80" viewBox="0 0 60 80" className="animate-float">
            <ellipse cx="30" cy="35" rx="25" ry="30" fill="#ef4444" opacity="0.8"/>
            <path d="M30 65 Q32 75, 35 80" stroke="#999" strokeWidth="1" fill="none"/>
            <ellipse cx="30" cy="30" rx="8" ry="10" fill="white" opacity="0.4"/>
          </svg>
        </div>
        <div className="absolute top-32 left-16 opacity-40" style={{ animationDelay: '0.5s' }}>
          <svg width="50" height="70" viewBox="0 0 50 70" className="animate-float">
            <ellipse cx="25" cy="30" rx="20" ry="25" fill="#fbbf24" opacity="0.8"/>
            <path d="M25 55 Q27 65, 30 70" stroke="#999" strokeWidth="1" fill="none"/>
            <ellipse cx="25" cy="25" rx="7" ry="8" fill="white" opacity="0.4"/>
          </svg>
        </div>
        <div className="absolute top-48 left-12 opacity-40" style={{ animationDelay: '1s' }}>
          <svg width="55" height="75" viewBox="0 0 55 75" className="animate-float">
            <ellipse cx="27" cy="32" rx="22" ry="27" fill="#a855f7" opacity="0.8"/>
            <path d="M27 59 Q29 69, 32 75" stroke="#999" strokeWidth="1" fill="none"/>
            <ellipse cx="27" cy="27" rx="7" ry="9" fill="white" opacity="0.4"/>
          </svg>
        </div>

        {/* Globos de carnaval - Derecha */}
        <div className="absolute top-24 right-10 opacity-40" style={{ animationDelay: '0.3s' }}>
          <svg width="58" height="78" viewBox="0 0 58 78" className="animate-float">
            <ellipse cx="29" cy="34" rx="24" ry="29" fill="#22d3ee" opacity="0.8"/>
            <path d="M29 63 Q31 73, 34 78" stroke="#999" strokeWidth="1" fill="none"/>
            <ellipse cx="29" cy="29" rx="8" ry="10" fill="white" opacity="0.4"/>
          </svg>
        </div>
        <div className="absolute top-40 right-20 opacity-40" style={{ animationDelay: '0.8s' }}>
          <svg width="52" height="72" viewBox="0 0 52 72" className="animate-float">
            <ellipse cx="26" cy="31" rx="21" ry="26" fill="#ec4899" opacity="0.8"/>
            <path d="M26 57 Q28 67, 31 72" stroke="#999" strokeWidth="1" fill="none"/>
            <ellipse cx="26" cy="26" rx="7" ry="9" fill="white" opacity="0.4"/>
          </svg>
        </div>

        {/* Regalos de carnaval */}
        <div className="absolute top-[60%] left-[5%] opacity-30 animate-float" style={{ animationDelay: '0.2s' }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <rect x="5" y="10" width="30" height="25" rx="2" fill="#ef4444" opacity="0.8"/>
            <rect x="18" y="10" width="4" height="25" fill="#fbbf24" opacity="0.9"/>
            <rect x="5" y="20" width="30" height="4" fill="#fbbf24" opacity="0.9"/>
            <path d="M15 10 Q20 5, 25 10" stroke="#fbbf24" strokeWidth="2" fill="none"/>
            <circle cx="20" cy="7" r="3" fill="#fbbf24" opacity="0.8"/>
          </svg>
        </div>
        <div className="absolute top-[65%] right-[8%] opacity-30 animate-float" style={{ animationDelay: '0.7s' }}>
          <svg width="35" height="35" viewBox="0 0 35 35">
            <rect x="4" y="8" width="27" height="22" rx="2" fill="#22d3ee" opacity="0.8"/>
            <rect x="16" y="8" width="3" height="22" fill="#a855f7" opacity="0.9"/>
            <rect x="4" y="17" width="27" height="3" fill="#a855f7" opacity="0.9"/>
            <path d="M13 8 Q17.5 4, 22 8" stroke="#a855f7" strokeWidth="2" fill="none"/>
            <circle cx="17.5" cy="6" r="2.5" fill="#a855f7" opacity="0.8"/>
          </svg>
        </div>
        <div className="absolute top-[70%] left-[15%] opacity-30 animate-float" style={{ animationDelay: '1.2s' }}>
          <svg width="38" height="38" viewBox="0 0 38 38">
            <rect x="4" y="9" width="30" height="24" rx="2" fill="#fbbf24" opacity="0.8"/>
            <rect x="17" y="9" width="4" height="24" fill="#ec4899" opacity="0.9"/>
            <rect x="4" y="19" width="30" height="4" fill="#ec4899" opacity="0.9"/>
            <path d="M14 9 Q19 4, 24 9" stroke="#ec4899" strokeWidth="2" fill="none"/>
            <circle cx="19" cy="6" r="3" fill="#ec4899" opacity="0.8"/>
          </svg>
        </div>

        {/* Serpentinas */}
        <div className="absolute top-0 left-[20%] w-2 h-40 bg-gradient-to-b from-pink-500/30 to-transparent rotate-12"></div>
        <div className="absolute top-0 right-[25%] w-2 h-48 bg-gradient-to-b from-yellow-400/30 to-transparent -rotate-12"></div>
        <div className="absolute top-0 left-[45%] w-2 h-44 bg-gradient-to-b from-purple-500/30 to-transparent rotate-8"></div>
        <div className="absolute top-0 right-[50%] w-2 h-52 bg-gradient-to-b from-cyan-400/30 to-transparent -rotate-8"></div>

        {/* Confetti */}
        <div className="absolute top-10 left-[30%] w-3 h-3 bg-pink-500/40 rounded-full"></div>
        <div className="absolute top-16 right-[35%] w-2 h-2 bg-yellow-400/40 rounded-full"></div>
        <div className="absolute top-12 left-[60%] w-2 h-2 bg-purple-500/40 rounded-full"></div>
        <div className="absolute top-20 right-[15%] w-3 h-3 bg-cyan-400/40 rounded-full"></div>
        <div className="absolute top-24 left-[70%] w-2 h-2 bg-pink-400/40 rounded-full"></div>
      </div>

      {/* Iconos decorativos de fondo */}
      <div className="fixed inset-0 overflow-hidden opacity-10 pointer-events-none z-0">
        {/* Aguacates */}
        <svg className="absolute top-16 left-8 w-20 h-20 md:w-24 md:h-24 text-cyan-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="55" rx="28" ry="35" />
          <ellipse cx="50" cy="55" rx="15" ry="18" />
          <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.3"/>
        </svg>

        <svg className="absolute bottom-32 right-12 w-18 h-18 md:w-20 md:h-20 text-teal-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="55" rx="25" ry="32" />
          <ellipse cx="50" cy="55" rx="13" ry="16" />
        </svg>

        {/* Lechugas */}
        <svg className="absolute top-1/3 right-20 w-24 h-24 md:w-28 md:h-28 text-emerald-400 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M50 20 Q35 25, 30 40 Q28 55, 35 65 Q45 75, 50 80"/>
          <path d="M50 20 Q65 25, 70 40 Q72 55, 65 65 Q55 75, 50 80"/>
          <path d="M45 35 Q42 45, 43 55 Q44 65, 48 72"/>
        </svg>

        <svg className="absolute top-1/2 left-16 w-22 h-22 md:w-26 md:h-26 text-teal-300 opacity-60 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M50 25 Q38 28, 35 42 Q34 56, 40 68"/>
          <path d="M50 25 Q62 28, 65 42 Q66 56, 60 68"/>
        </svg>

        {/* Tomates */}
        <svg className="absolute bottom-24 left-24 w-18 h-18 md:w-22 md:h-22 text-red-300 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="50" cy="55" r="22"/>
          <path d="M40 33 Q45 28, 50 28 Q55 28, 60 33" strokeWidth="2.5"/>
        </svg>

        {/* Hojas */}
        <svg className="absolute top-40 left-28 w-18 h-18 md:w-20 md:h-20 text-green-400 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 80 Q30 40, 50 20 Q70 40, 80 80" />
          <path d="M50 20 L50 80 M50 35 Q35 45, 30 60"/>
        </svg>

        <svg className="absolute bottom-40 right-40 w-14 h-14 md:w-16 md:h-16 text-emerald-300 opacity-70 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M25 75 Q35 45, 50 25 Q65 45, 75 75" />
          <path d="M50 25 L50 75"/>
        </svg>

        {/* Pepinos */}
        <svg className="absolute top-2/3 right-16 w-20 h-20 md:w-24 md:h-24 text-cyan-500 float-slower" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="50" rx="12" ry="30" />
          <line x1="45" y1="30" x2="45" y2="35"/>
          <line x1="55" y1="33" x2="55" y2="38"/>
        </svg>

        {/* Zanahorias */}
        <svg className="absolute bottom-1/3 left-40 w-18 h-18 md:w-20 md:h-20 text-orange-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 25 L45 80 L55 80 Z"/>
          <path d="M45 23 L40 18 M50 20 L50 14 M55 23 L60 18"/>
        </svg>

        {/* Brócoli */}
        <svg className="absolute bottom-1/4 right-1/3 w-22 h-22 md:w-26 md:h-26 text-green-500 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="45" cy="40" r="12"/>
          <circle cx="55" cy="40" r="12"/>
          <circle cx="50" cy="50" r="13"/>
        </svg>
      </div>

      <header className="bg-gray-900 border-b-2 border-cyan-500 neon-border-fit fixed top-0 left-0 right-0 md:sticky md:left-auto md:right-auto z-30 overflow-visible">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-1.5 flex justify-between items-center overflow-visible">
          <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity relative z-10">
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={300}
              height={75}
              className="h-10 md:h-9 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/fat"
              className="text-xs md:text-sm font-bold text-red-400 hover:text-red-300 transition-colors neon-glow-fat px-2 md:px-3 py-1 md:py-1.5 rounded border border-red-500/30 hover:border-red-400 hidden sm:block"
            >
              Ver menú Alitas →
            </Link>
            <Link
              href="/fat"
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors neon-glow-fat px-2 py-1 rounded border border-red-500/30 hover:border-red-400 sm:hidden"
            >
              Ver menú Alitas
            </Link>
            <Link
              href="/tacos"
              className="text-xs md:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors neon-glow-taco px-2 md:px-3 py-1 md:py-1.5 rounded border border-emerald-500/30 hover:border-emerald-400 hidden sm:block"
            >
              Ver menú Tacos →
            </Link>
            <Link
              href="/tacos"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors neon-glow-taco px-2 py-1 rounded border border-emerald-500/30 hover:border-emerald-400 sm:hidden"
            >
              Ver menú Tacos
            </Link>
          </div>
        </div>
      </header>
      {/* Spacer for fixed header on mobile */}
      <div className="h-14 md:hidden" />


      <section className={`container mx-auto px-2 md:px-4 py-3 md:py-5 transition-all duration-300 overflow-visible ${completedOrders.length > 0 ? 'pb-20 md:pb-16' : 'pb-3 md:pb-3'}`}>

        {/* Page title */}
        <div className="px-3 pt-4 pb-2 text-center">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-cyan-400" style={{ textShadow: "0 0 12px rgba(34,211,238,0.6)" }}>
            ENSALADAS PARA EL BALANCE
          </h1>
        </div>

        <div className="relative flex items-center justify-center overflow-visible" style={{ overflow: 'visible' }}>
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex flex-col md:flex-row md:flex-wrap md:justify-center items-center gap-5 md:gap-6 lg:gap-8 scrollbar-hide px-3 md:px-4 pt-6 pb-8 md:py-8 lg:py-10 select-none md:cursor-default md:overflow-visible`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none', overflow: 'visible' }}
          >
            {products.map((product) => {
              const isSoldOut = !!menuStock[product.id];
              const isHoraLoca = horaLocaActive && product.id !== 'ensalada-clasica';
              const discountPrice = isHoraLoca ? 20 : menuDiscounts[product.id];
              const effectivePrice = menuPrices[product.id] || product.price;

              return (
                <div
                  key={product.id}
                  ref={(el) => { cardRefs.current[product.id] = el; }}
                  onClick={() => { if (!isSoldOut && !isDragging) handleCardClick(product.id); }}
                  onMouseEnter={() => { if (!isSoldOut) setHoveredCard(product.id); }}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`bg-gray-900 flex-shrink-0 md:flex-shrink w-full md:w-[240px] lg:w-[260px] shadow-xl relative
                    ${isHoraLoca ? 'border-4 border-purple-400 hora-loca-glow shadow-purple-500/40' :
                      discountPrice ? 'border-4 border-amber-400 super-promo-glow shadow-amber-500/40' :
                      'border-2 border-cyan-400 shadow-cyan-500/30 neon-border-fit'}
                    ${isSoldOut ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                    ${hoveredCard === product.id ? 'md:scale-105 md:-translate-y-2 z-10' : ''}
                  `}
                  style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease', borderRadius: isMobile ? 16 : 0, overflow: 'hidden' }}
                >
                  <div className="relative h-52 bg-black overflow-hidden">
                    {product.image.startsWith('/') ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 280px"
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-4xl flex items-center justify-center h-full">{product.image}</span>
                    )}
                    {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/45">
                        <div className="border-4 border-red-500 rounded-sm px-3 py-1 select-none" style={{ transform: 'rotate(-20deg)', boxShadow: '0 0 12px rgba(239,68,68,0.7)' }}>
                          <span className="text-red-500 font-black text-xl tracking-widest uppercase" style={{ textShadow: '0 0 8px rgba(239,68,68,0.8)' }}>AGOTADO</span>
                        </div>
                      </div>
                    )}
                    {isHoraLoca && !isSoldOut && (
                      <div className="absolute top-2 left-0 right-0 z-20 flex justify-center pointer-events-none">
                        <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wider hora-loca-badge shadow-lg shadow-purple-900/60">
                          🎉 HORA LOCA
                        </span>
                      </div>
                    )}
                    {discountPrice && !isHoraLoca && (
                      <div className="absolute top-2 left-2 bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded z-20">OFERTA</div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <h4 className="text-base font-bold text-white mb-1 truncate">{product.name}</h4>
                    <p className="text-cyan-200/60 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {discountPrice ? (
                          <>
                            <span className="text-xs text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                            <span className="text-lg font-black text-amber-400">S/ {discountPrice.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-base font-black text-amber-400 gold-glow">S/ {effectivePrice.toFixed(2)}</span>
                        )}
                      </div>
                      {!isSoldOut && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCardClick(product.id); }}
                          className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-2xl flex items-center justify-center transition-all active:scale-90"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                  {completedOrders.some(o => o.productId === product.id) && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
                      ✓ En orden
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {expandedCard && (() => {
          const mp = products.find(p => p.id === expandedCard);
          if (!mp) return null;
          const mQty = orderQuantity[expandedCard] || 1;
          const mDiscount = menuDiscounts[expandedCard];
          const mHoraLoca = horaLocaActive && expandedCard !== 'ensalada-clasica';
          const mEffPrice = menuPrices[expandedCard] || mp.price;
          const mFinalPrice = mHoraLoca ? 20 : (mDiscount || mEffPrice);
          const mSoldOut = !!menuStock[expandedCard];
          return (
            <div
              className="fixed inset-0 z-[100] flex flex-col justify-end md:items-center md:justify-center"
              style={{ animation: 'fadeInOverlay 0.2s ease-out' }}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setExpandedCard(null)} />
              <div
                className="relative bg-gray-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl flex flex-col shadow-2xl border-t-2 border-cyan-500/40"
                style={{ maxHeight: '92vh', animation: 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                  <div className="w-10 h-1 bg-gray-600 rounded-full" />
                </div>
                {/* Close button */}
                <button
                  onClick={() => setExpandedCard(null)}
                  className="absolute top-3 right-4 z-10 w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-lg font-bold transition-all"
                >
                  ×
                </button>
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Image */}
                  <div className="relative h-64 bg-black overflow-hidden rounded-t-3xl md:rounded-t-2xl">
                    {mp.image.startsWith('/') ? (
                      <Image
                        src={mp.image}
                        alt={mp.name}
                        fill
                        sizes="100vw"
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-6xl flex items-center justify-center h-full">{mp.image}</span>
                    )}
                    {(mDiscount || mHoraLoca) && (
                      <div className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-black px-2 py-1 rounded z-10">
                        {mHoraLoca ? '🎉 HORA LOCA' : 'OFERTA'}
                      </div>
                    )}
                  </div>
                  {/* Name & description */}
                  <div className="px-4 pt-4 pb-2">
                    <h3 className="text-xl font-black text-white mb-1">{mp.name}</h3>
                    <p className="text-cyan-200/70 text-sm">{mp.description}</p>
                  </div>
                  {/* Price + Qty */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
                    <div className="flex flex-col">
                      {(mDiscount || mHoraLoca) ? (
                        <>
                          <span className="text-xs text-gray-500 line-through">S/ {mEffPrice.toFixed(2)}</span>
                          <span className="text-2xl font-black text-amber-400 gold-glow">S/ {mFinalPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-amber-400 gold-glow">S/ {mEffPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDecreaseQuantity(expandedCard)}
                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold text-xl flex items-center justify-center transition-all"
                      >
                        −
                      </button>
                      <span className="text-white font-black text-xl w-6 text-center">{mQty}</span>
                      <button
                        onClick={() => handleIncreaseQuantity(expandedCard)}
                        className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-xl flex items-center justify-center transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/* Extras */}
                  <div className="px-4 py-3 border-b border-gray-800">
                    <h5 className="text-sm font-bold text-white mb-2">Extras</h5>
                    {[
                      { id: 'extra-aderezo', name: 'Extra aderezo', emoji: '🥗', price: 3.00 },
                      ...(expandedCard === 'ensalada-clasica' ? [{ id: 'pollo-grillado', name: 'Pollo grillado', emoji: '🍗', price: 5.00 }] : []),
                    ].map((extra) => {
                      const count = getComplementCount(expandedCard, extra.id);
                      const wasRecent = recentlyAdded.has(`${expandedCard}-${extra.id}`);
                      const extraProduct: Product = { id: extra.id, name: extra.name, description: extra.name, price: extra.price, image: extra.emoji, category: 'bebida' };
                      return (
                        <div key={extra.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg p-2.5 mb-2 border border-cyan-500/10">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{extra.emoji}</span>
                            <span className="text-white text-sm">{extra.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-sm font-bold">+S/ {extra.price.toFixed(2)}</span>
                            {count > 0 && (
                              <>
                                <button onClick={() => handleRemoveComplement(expandedCard, extra.id)} className="w-7 h-7 bg-cyan-700 hover:bg-cyan-600 text-white rounded-full text-sm font-bold flex items-center justify-center">−</button>
                                <span className="text-white text-sm font-bold w-4 text-center">{count}</span>
                              </>
                            )}
                            <button onClick={() => handleAddComplement(expandedCard, extraProduct)} className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center transition-all ${wasRecent ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
                              {wasRecent ? '✓' : '+'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Bebidas */}
                  <div className="px-4 py-3">
                    <button
                      onClick={() => setShowBebidas(prev => ({ ...prev, [expandedCard]: !prev[expandedCard] }))}
                      className="w-full flex items-center justify-between bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-xl p-3 transition-all mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <span>🥤</span>
                        <span className="text-white font-bold text-sm">Bebidas</span>
                      </div>
                      <span className="text-cyan-400">{showBebidas[expandedCard] ? '▼' : '▶'}</span>
                    </button>
                    {showBebidas[expandedCard] && (
                      <div className="space-y-2">
                        {[
                          { id: 'agua-mineral', name: 'Agua mineral', emoji: '💧', price: 4.00 },
                          { id: 'coca-cola', name: 'Coca Cola 500ml', emoji: '🥤', price: 4.00 },
                          { id: 'inka-cola', name: 'Inka Cola 500ml', emoji: '🥤', price: 4.00 },
                          { id: 'sprite', name: 'Sprite 500ml', emoji: '🥤', price: 4.00 },
                          { id: 'fanta', name: 'Fanta 500ml', emoji: '🥤', price: 4.00 },
                        ].map((beb) => {
                          const count = getComplementCount(expandedCard, beb.id);
                          const wasRecent = recentlyAdded.has(`${expandedCard}-${beb.id}`);
                          const bebProduct: Product = { id: beb.id, name: beb.name, description: beb.name, price: beb.price, image: beb.emoji, category: 'bebida' };
                          return (
                            <div key={beb.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg p-2.5 border border-cyan-500/10">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{beb.emoji}</span>
                                <span className="text-white text-sm">{beb.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 text-sm font-bold">+S/ {beb.price.toFixed(2)}</span>
                                {count > 0 && (
                                  <>
                                    <button onClick={() => handleRemoveComplement(expandedCard, beb.id)} className="w-7 h-7 bg-cyan-700 hover:bg-cyan-600 text-white rounded-full text-sm font-bold flex items-center justify-center">−</button>
                                    <span className="text-white text-sm font-bold w-4 text-center">{count}</span>
                                  </>
                                )}
                                <button onClick={() => handleAddComplement(expandedCard, bebProduct)} className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center transition-all ${wasRecent ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
                                  {wasRecent ? '✓' : '+'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {/* CTA button */}
                <div className="flex-shrink-0 px-4 pt-3 pb-6 bg-gray-900 border-t border-gray-800">
                  <button
                    onClick={() => {
                      if (!mSoldOut) {
                        handleCompleteOrder(mp);
                        setIsEditingOrder(false);
                      }
                    }}
                    disabled={mSoldOut}
                    className={`w-full py-4 rounded-xl font-black text-base transition-all active:scale-95 ${mSoldOut ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-black neon-border-fit'}`}
                  >
                    {mSoldOut ? 'No disponible' : isEditingOrder ? `Confirmar cambios — S/ ${(mFinalPrice * mQty).toFixed(2)}` : `Agregar orden — S/ ${(mFinalPrice * mQty).toFixed(2)}`}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}


        {completedOrders.length > 0 && (
          <div id="tu-orden-section" className="container mx-auto px-3 md:px-4 -mt-2 md:mt-0 lg:mt-2">
            <h3 className="text-base md:text-lg lg:text-xl font-black text-cyan-400 mb-2 md:mb-3 neon-glow-fit">
              Tu orden
            </h3>
            <div className="space-y-2 md:space-y-3">
              {(() => {
                const _seenCombos = new Set<string>();
                return completedOrders.map((order, index) => {
                // ── Combo group card ──────────────────────────────────────
                if (order.comboGroupId) {
                  if (_seenCombos.has(order.comboGroupId)) return null;
                  _seenCombos.add(order.comboGroupId);
                  const _gi = completedOrders.filter(o => o.comboGroupId === order.comboGroupId);
                  return (
                    <div key={`cg-${order.comboGroupId}`} className="bg-gray-900/80 rounded-xl border-2 border-amber-400/40 p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                      <div className="flex items-start justify-between mb-2.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">🔥 Combo especial</span>
                          <h4 className="text-sm font-black text-white mt-0.5">{order.comboName}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            {order.comboOriginalTotal && (
                              <div className="text-[11px] text-gray-500 line-through">S/ {order.comboOriginalTotal.toFixed(2)}</div>
                            )}
                            <div className="text-amber-400 font-black text-lg gold-glow">S/ {order.comboPrice?.toFixed(2)}</div>
                          </div>
                          <button onClick={() => handleDeleteComboGroup(order.comboGroupId!)} className="text-cyan-500 hover:text-red-400 text-xl font-bold transition-all opacity-70 hover:opacity-100 leading-none ml-1">✕</button>
                        </div>
                      </div>
                      <div className="space-y-1.5 border-t border-white/5 pt-2">
                        {_gi.map((item, i) => {
                          let prod = products.find(p => p.id === item.productId);
                          let iFat = false, iTaco = false;
                          if (!prod) { prod = fatProducts.find(p => p.id === item.productId); iFat = true; }
                          if (!prod) { prod = tacoProducts.find(p => p.id === item.productId); iFat = false; iTaco = true; }
                          if (!prod) return null;
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-black/40">
                                {prod.image.startsWith('/') ? (
                                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg flex items-center justify-center h-full">{prod.image}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-semibold truncate">{prod.name}</p>
                                {iFat && item.salsas && item.salsas.length > 0 && (
                                  <p className="text-[10px] text-amber-300/70 truncate">🌶️ {item.salsas.map(s => salsas.find(sa => sa.id === s)?.name ?? s).join(", ")}</p>
                                )}
                                {iTaco && item.salsas && item.salsas.length > 0 && (
                                  <p className="text-[10px] text-emerald-300/70 truncate">🌮 {item.salsas.map(id => tacoFlavorNames[id] ?? id).join(" + ")}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                // ── Individual item ───────────────────────────────────────
                // Buscar producto en fit products
                let product = products.find((p) => p.id === order.productId);
                let isFatOrder = false;
                let isTacoOrder = false;

                // Si no se encuentra, buscar en fat products
                if (!product) {
                  product = fatProducts.find((p) => p.id === order.productId);
                  isFatOrder = true;
                }
                // Si no se encuentra, buscar en taco products
                if (!product) {
                  product = tacoProducts.find((p) => p.id === order.productId);
                  isFatOrder = false;
                  isTacoOrder = true;
                }

                if (!product) return null;

                return (
                  <div
                    key={`${order.productId}-${index}`}
                    className={`bg-gray-900 rounded-lg border-2 ${isTacoOrder ? 'border-emerald-400/30' : isFatOrder ? 'border-red-400/30' : 'border-cyan-400/30'} p-2 md:p-3 relative`}
                  >
                    <div className="flex items-start justify-between mb-1 md:mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-cyan-400/30 flex items-center justify-center">
                          {product.image.startsWith('/') ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">🥗</span>';
                              }}
                            />
                          ) : (
                            <span className="text-2xl">{product.image}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white mb-1">
                            {order.quantity > 1 ? `${order.quantity}x ` : ''}{product.name}
                          </h4>

                          <div className="text-[11px] space-y-0.5">
                            {/* Precio del menú */}
                            <div className={`${isTacoOrder ? 'text-emerald-300/80' : isFatOrder ? 'text-red-300/80' : 'text-cyan-300/80'} flex justify-between items-center`}>
                              <span>• {product.name} x{order.quantity}</span>
                              {order.discountApplied && !hasComboDiscount ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="text-gray-500 line-through text-[10px]">S/ {((order.originalPrice ?? (menuPrices[product.id] || product.price)) * order.quantity).toFixed(2)}</span>
                                  <span className="text-amber-400 font-bold text-sm gold-glow">S/ {((order.finalPrice ?? (menuPrices[product.id] || product.price)) * order.quantity).toFixed(2)}</span>
                                </span>
                              ) : (
                                <span className="text-amber-400 font-bold text-sm gold-glow">S/ {((order.finalPrice ?? (menuPrices[product.id] || product.price)) * order.quantity).toFixed(2)}</span>
                              )}
                            </div>

                            {/* Sabores tacos */}
                            {isTacoOrder && order.productId === 'taco-duo' && order.salsas && order.salsas.length > 0 && (
                              <div className="text-emerald-300/80">
                                🌮 Sabores: {order.salsas.map((id) => tacoFlavorNames[id] ?? id).join(" + ")}
                              </div>
                            )}
                            {/* Salsas (para órdenes de fat) */}
                            {isFatOrder && order.salsas && order.salsas.length > 0 && (
                              <div className="text-amber-300/80">
                                🌶️ Salsas: {order.salsas
                                  .map((sId) => salsas.find((s) => s.id === sId)?.name)
                                  .filter((name) => name)
                                  .join(", ")}
                              </div>
                            )}

                            {/* Desglose de complementos */}
                            {order.complementIds.length > 0 && (
                              <>
                                {order.complementIds.map((compId, idx) => {
                                  const complement = availableComplements[compId];
                                  if (!complement) return null;
                                  return (
                                    <div key={`${compId}-${idx}`} className={`${isTacoOrder ? 'text-emerald-300/80' : isFatOrder ? 'text-red-300/80' : 'text-cyan-300/80'} flex justify-between`}>
                                      <span>• {complement.name}</span>
                                      {complement.price > 0
                                        ? <span className="text-amber-400/80">S/ {complement.price.toFixed(2)}</span>
                                        : <span className="text-emerald-400/80 text-[10px]">Incluido</span>
                                      }
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 ml-2">
                        <button
                          onClick={() => handleEditOrder(index)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold px-2 py-1 border border-cyan-400/30 rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(index)}
                          className="text-cyan-500 hover:text-cyan-400 text-xl font-bold transition-all opacity-70 hover:opacity-100"
                          title="Eliminar orden"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
                });
              })()}
            </div>


          </div>
        )}

        {completedOrders.length > 0 && (
          <div className="container mx-auto px-3 md:px-4 mt-4 mb-2">
            <p className="text-center text-xs text-cyan-200/70 italic">
              💡 Puedes agregar más órdenes a tu pedido antes de continuar
            </p>
          </div>
        )}

        {/* Espaciador para que la barra fija no tape el contenido */}
        {completedOrders.length > 0 && (
          <div className="h-24 md:h-28"></div>
        )}
      </section>

      {completedOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-cyan-500/50 shadow-2xl shadow-cyan-500/30 z-50">
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 lg:py-5">
            <div className="flex justify-between items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm md:text-lg">Total</span>
                {hasComboDiscount ? (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 line-through text-sm md:text-xl">
                        S/ {completedTotal.toFixed(2)}
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] md:text-xs font-black px-1.5 py-0.5 rounded">
                        🎉 {comboResult.appliedCombos.length === 1 ? comboResult.appliedCombos[0].rule.name : `${comboResult.appliedCombos.length} Combos`}
                      </span>
                    </div>
                    <span className="text-amber-400 font-black text-xl md:text-3xl gold-glow">
                      S/ {comboTotal.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-amber-400 font-black text-xl md:text-3xl gold-glow">
                    S/ {completedTotal.toFixed(2)}
                  </span>
                )}
              </div>
              {isOpen ? (
                <button
                  onClick={navigateToCheckout}
                  className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black px-5 md:px-7 py-2.5 md:py-3 rounded-lg font-black text-sm md:text-lg transition-all neon-border-fit"
                >
                  Continuar<span className="hidden sm:inline"> Pedido</span> →
                </button>
              ) : (
                <div className="flex flex-col items-end gap-0.5">
                  <div className="bg-gray-700 text-gray-400 px-4 md:px-7 py-2 md:py-3 rounded-lg font-black text-xs md:text-base cursor-not-allowed border-2 border-gray-600 text-center">
                    🔒 Cerrado
                  </div>
                  <span className="text-gray-500 text-[10px] md:text-xs text-right">{getNextOpenMessage()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteOrderIndex !== null && (() => {
        const order = completedOrders[deleteOrderIndex];
        // Buscar producto para determinar el tipo de orden
        let product = products.find((p) => p.id === order.productId);
        let isFatOrder = false;
        let isTacoOrder = false;
        if (!product) {
          product = fatProducts.find((p) => p.id === order.productId);
          isFatOrder = true;
        }
        if (!product) {
          product = tacoProducts.find((p) => p.id === order.productId);
          isFatOrder = false;
          isTacoOrder = true;
        }

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className={`bg-gray-900 border-2 ${isTacoOrder ? 'border-emerald-500 neon-border-taco' : isFatOrder ? 'border-red-500 neon-border-fat' : 'border-cyan-500 neon-border-fit'} rounded-lg p-6 max-w-md w-full`}>
              <h3 className={`text-xl font-black ${isTacoOrder ? 'text-emerald-400 neon-glow-taco' : isFatOrder ? 'text-red-400 gold-glow' : 'text-cyan-400 neon-glow-fit'} mb-4 text-center`}>
                ¡Qué dilema!
              </h3>
              {(() => {
                if (!product) return null;

              const effectivePrice = menuPrices[product.id] || product.price;
              const basePrice = order.finalPrice ?? effectivePrice;
              const unitPrice = (hasComboDiscount && order.discountApplied)
                ? (order.originalPrice ?? effectivePrice)
                : basePrice;
              const productTotal = unitPrice * order.quantity;
              const complementsTotal = order.complementIds.reduce((sum, compId) => {
                return sum + (availableComplements[compId]?.price || 0);
              }, 0);
              const orderTotal = (productTotal + complementsTotal).toFixed(2);

              return (
                <div className="mb-6 text-sm">
                  <p className="text-white mb-3 text-center">
                    ¿Está seguro que desea quitar su orden de su pedido?
                  </p>
                  <div className={`bg-gray-800/50 border ${isFatOrder ? 'border-red-400/30' : 'border-cyan-400/30'} rounded-lg p-4`}>
                    {/* Header con imagen y título */}
                    <div className={`flex items-start gap-3 mb-3 pb-3 border-b ${isFatOrder ? 'border-red-400/20' : 'border-cyan-400/20'}`}>
                      {/* Imagen del producto */}
                      <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black border ${isFatOrder ? 'border-red-400/30' : 'border-cyan-400/30'} flex items-center justify-center`}>
                        {product.image.startsWith('/') ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{product.image}</span>
                        )}
                      </div>

                      {/* Nombre y precio total */}
                      <div className="flex-1">
                        <p className={`${isFatOrder ? 'text-amber-400' : 'text-cyan-400'} font-bold text-base mb-1`}>
                          {order.quantity > 1 ? `${order.quantity}x ` : ''}{product.name}
                        </p>
                        <p className="text-amber-400 font-bold gold-glow text-lg">
                          S/ {orderTotal}
                        </p>
                      </div>
                    </div>

                    {/* Desglose de precios */}
                    <div className="space-y-1">
                      <div className={`flex justify-between ${isFatOrder ? 'text-red-300/80' : 'text-cyan-300/80'} text-xs`}>
                        <span>• {product.name} x{order.quantity}</span>
                        <span className="text-amber-400/80">S/ {(unitPrice * order.quantity).toFixed(2)}</span>
                      </div>

                      {/* Salsas (solo para órdenes fat) */}
                      {isFatOrder && order.salsas && order.salsas.length > 0 && (
                        <div className="text-amber-300/80 text-xs mt-2">
                          🌶️ Salsas: {order.salsas
                            .map((sId) => salsas.find((s) => s.id === sId)?.name)
                            .filter((name) => name)
                            .join(", ")}
                        </div>
                      )}

                      {/* Desglose de complementos */}
                      {order.complementIds.length > 0 && (
                        <>
                          {order.complementIds.map((compId, idx) => {
                            const complement = availableComplements[compId];
                            if (!complement) return null;
                            return (
                              <div key={`${compId}-${idx}`} className={`flex justify-between ${isFatOrder ? 'text-red-300/80' : 'text-cyan-300/80'} text-xs`}>
                                <span>• {complement.name}</span>
                                <span className="text-amber-400/80">S/ {complement.price.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
              })()}
              <div className="flex gap-3">
                <button
                  onClick={cancelDeleteOrder}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all border border-gray-500"
                >
                  Volver
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  className={`flex-1 ${isFatOrder ? 'bg-red-500 hover:bg-red-400 text-white neon-border-fat' : 'bg-cyan-500 hover:bg-cyan-400 text-black neon-border-fit'} px-4 py-3 rounded-lg font-bold transition-all`}
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <WhatsAppButton lifted={completedOrders.length > 0} />
      <CombosButton lifted={completedOrders.length > 0} />
    </div>
  );
}
