"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import WhatsAppButton from "../components/WhatsAppButton";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";

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
    price: 20.00,
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

// Productos de TACOS para visualización de órdenes cruzadas
const tacoProducts: Product[] = [
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
  "pollo-grillado": { name: "Pollo grillado", price: 5.00 }
};

export default function FitPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedComplements, setSelectedComplements] = useState<Record<string, any[]>>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showBebidas, setShowBebidas] = useState<Record<string, boolean>>({});
  const [showExtras, setShowExtras] = useState<Record<string, boolean>>({});
  const [showCartModal, setShowCartModal] = useState(false);
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
  const [bannerWidth, setBannerWidth] = useState<number | null>(null);
  const [bannerSlide, setBannerSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(isBusinessOpen);
  const [menuStock, setMenuStock] = useState<Record<string, boolean>>({});
  const [menuDiscounts, setMenuDiscounts] = useState<Record<string, number>>({});
  const [menuPrices, setMenuPrices] = useState<Record<string, number>>({});
  const horaLocaActive = false;
  const router = useRouter();

  // Detectar combo FAT + FIT antes de calcular totales (las promos no son acumulables)
  // PROMOCIÓN DESACTIVADA
  const FAT_IDS = ["pequeno-dilema", "duo-dilema", "santo-pecado"];
  const FIT_IDS = ["ensalada-clasica", "ensalada-proteica", "ensalada-caesar", "ensalada-mediterranea"];
  const hasComboDiscount = false; // Promoción combo desactivada

  const completedTotal = completedOrders.reduce((total, order) => {
    const basePrice = order.finalPrice ?? order.originalPrice ?? (() => {
      let product = products.find(p => p.id === order.productId);
      if (!product) product = fatProducts.find(p => p.id === order.productId);
      if (!product) product = tacoProducts.find(p => p.id === order.productId);
      return product ? (menuPrices[product.id] || product.price) : 0;
    })();
    // Promos no acumulables: si combo activo, ignorar descuento individual Santo Picante
    const unitPrice = (hasComboDiscount && order.discountApplied)
      ? (order.originalPrice ?? basePrice)
      : basePrice;
    let orderTotal = unitPrice * order.quantity;
    order.complementIds.forEach(compId => {
      const complement = availableComplements[compId];
      if (complement) orderTotal += complement.price;
    });
    return total + orderTotal;
  }, 0);

  const comboDiscountAmount = hasComboDiscount ? 5 : 0;
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

  // Auto-avanzar carrusel de banner cada 5 segundos
  useEffect(() => {
    const t = setInterval(() => setBannerSlide(s => (s + 1) % 2), 5000);
    return () => clearInterval(t);
  }, []);

  // Medir ancho real de la fila de carteles para alinear el banner (solo desktop)
  useEffect(() => {
    const measure = () => {
      if (window.innerWidth < 768) {
        setBannerWidth(null);
        return;
      }
      const ids = products.map(p => p.id);
      const first = cardRefs.current[ids[0]];
      const last = cardRefs.current[ids[ids.length - 1]];
      if (first && last) {
        const w = last.getBoundingClientRect().right - first.getBoundingClientRect().left;
        if (w > 0) setBannerWidth(Math.round(w));
      }
    };
    const t = setTimeout(measure, 200);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, []);

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

  useEffect(() => {
    if (expandedCard && window.innerWidth < 768) {
      const el = cardRefs.current[expandedCard];
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
      }
    }
  }, [expandedCard]);

  // Nota: El cartel solo se cierra cuando la cantidad llega a 0, no al hacer clic fuera

  const handleExpandCard = (productId: string) => {
    if (isDragging) return;
    setExpandedCard(productId);
    setIsEditingOrder(false);
    if (!selectedComplements[productId]) {
      setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
    }
  };

  const handleCloseCard = () => {
    setExpandedCard(null);
    setIsEditingOrder(false);
    setEditingOrderIndex(null);
    if (expandedCard) {
      setShowBebidas((prev) => ({ ...prev, [expandedCard]: false }));
      setShowExtras((prev) => ({ ...prev, [expandedCard]: false }));
    }
  };

  const handleCardClick = (productId: string) => {
    const currentQty = orderQuantity[productId] || 0;

    // Si qty = 0, permitir expandir/colapsar con clic
    if (currentQty === 0) {
      if (expandedCard === productId) {
        // Colapsar
        setExpandedCard(null);
        setShowBebidas((prev) => ({ ...prev, [productId]: false }));
        setShowExtras((prev) => ({ ...prev, [productId]: false }));
      } else {
        // Expandir
        setExpandedCard(productId);
        if (!selectedComplements[productId]) {
          setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
        }

        // Scroll hacia el contenido expandido después de que se expanda el cartel
        setTimeout(() => {
          const card = cardRefs.current[productId];
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 600);
      }
    } else if (currentQty > 0 && expandedCard !== productId) {
      // Si qty > 0, solo expandir si no está expandido
      setExpandedCard(productId);

      // Scroll hacia el contenido expandido después de que se expanda el cartel
      setTimeout(() => {
        const card = cardRefs.current[productId];
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
    }
  };

  const handleIncreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 0;
    setOrderQuantity((prev) => ({
      ...prev,
      [productId]: currentQty + 1
    }));
    // Expandir automáticamente cuando se agrega unidad (de 0 a 1 o de 1 a 2, etc)
    if (expandedCard !== productId && currentQty >= 0) {
      setExpandedCard(productId);
      if (!selectedComplements[productId]) {
        setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
      }
    }
  };

  const handleDecreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 0;
    if (currentQty > 0) {
      setOrderQuantity((prev) => ({
        ...prev,
        [productId]: currentQty - 1
      }));
      if (currentQty === 1) {
        setExpandedCard(null);
        setIsEditingOrder(false);
        setEditingOrderIndex(null);
        setShowBebidas((prev) => ({ ...prev, [productId]: false }));
        setShowExtras((prev) => ({ ...prev, [productId]: false }));
        if (mainProductsInCart[productId]) {
          removeFromCart(mainProductsInCart[productId]);
          setMainProductsInCart((prev) => {
            const newState = { ...prev };
            delete newState[productId];
            return newState;
          });
        }
      }
    }
  };

  const canAddProduct = (productId: string): boolean => {
    return true; // Ya no necesita validar aderezos
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
    setShowExtras((prev) => ({ ...prev, [product.id]: false }));
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

    setTimeout(() => {
      const card = cardRefs.current[order.productId];
      if (card && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const cardLeft = card.offsetLeft;
        const cardWidth = card.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);

        container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }, 100);
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleCardHover = (productId: string) => {
    if (expandedCard) return;
    setHoveredCard(productId);
    const cardElement = cardRefs.current[productId];
    const container = scrollContainerRef.current;

    if (cardElement && container) {
      const cardRect = cardElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (cardRect.right > containerRect.right) {
        const scrollAmount = cardRect.right - containerRect.right + 20;
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      } else if (cardRect.left < containerRect.left) {
        const scrollAmount = cardRect.left - containerRect.left - 20;
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    }
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

      <header className="bg-gray-900 border-b-2 border-cyan-500 neon-border-fit sticky top-0 z-30 overflow-visible">
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

      <section className={`container mx-auto px-2 md:px-4 py-3 md:py-5 transition-all duration-300 overflow-visible ${completedOrders.length > 0 ? 'pb-20 md:pb-16' : 'pb-3 md:pb-3'}`}>

        <div className="relative flex items-center justify-center overflow-visible" style={{ overflow: 'visible' }}>
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`grid grid-cols-2 md:flex md:flex-wrap md:justify-center items-center gap-3 md:gap-6 lg:gap-8 scrollbar-hide px-3 md:px-4 pt-10 pb-8 md:py-8 lg:py-10 select-none md:cursor-default md:overflow-x-visible`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none', overflow: 'visible' }}
          >
            {products.map((product, productIndex) => {
              const isExpanded = expandedCard === product.id;
              const isSoldOut = !!menuStock[product.id];
              const isHoraLoca    = horaLocaActive && product.id !== 'ensalada-clasica';
              const discountPrice = isHoraLoca ? 20 : menuDiscounts[product.id];
              const isLastOdd = productIndex === products.length - 1 && products.length % 2 !== 0;
              const effectivePrice = menuPrices[product.id] || product.price;

              return (
                <React.Fragment key={product.id}>
                  {productIndex === 4 && (
                    <div className="basis-full hidden md:block" />
                  )}
                  <div
                  ref={(el) => { cardRefs.current[product.id] = el; }}
                  onClick={() => { if (!isSoldOut) handleCardClick(product.id); }}
                  onMouseEnter={() => { if (!isSoldOut) handleCardHover(product.id); }}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`${productIndex === products.length - 1 && products.length % 2 !== 0 ? 'col-span-2 md:col-auto justify-self-center' : ''} bg-gray-900 flex-shrink-0 md:flex-shrink shadow-xl ${isHoraLoca ? 'border-4 border-purple-400 hora-loca-glow shadow-xl shadow-purple-500/40' : discountPrice ? 'border-4 border-amber-400 super-promo-glow shadow-amber-500/40' : product.id === 'pasta-power-bowl' ? 'border-4 border-red-500 neon-red-border shadow-red-500/40' : 'border-2 md:border-2 border-cyan-400 shadow-cyan-500/30 neon-border-fit'}
                    ${isSoldOut ? 'opacity-70 cursor-not-allowed' : ''}
                    ${isExpanded
                      ? 'w-full md:w-[340px] lg:w-[360px] z-20'
                      : isLastOdd ? 'w-[65%] md:w-[240px] lg:w-[260px]' : 'w-full md:w-[240px] lg:w-[260px]'
                    }
                    ${!isSoldOut && !isExpanded && hoveredCard === product.id && !expandedCard
                      ? 'md:scale-105 md:-translate-y-2 z-10'
                      : !isExpanded && !expandedCard ? 'scale-100 translate-y-0' : ''
                    }
                    ${(orderQuantity[product.id] || 0) > 0 && !isExpanded && !isSoldOut ? 'cursor-pointer' : ''}
                  `}
                  style={{
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease, box-shadow 0.3s ease',
                    transformOrigin: 'center center',
                    borderRadius: 0,
                    overflow: 'visible',
                  }}
                >
                  <div className={`relative flex items-center justify-center overflow-visible ${
                    product.image.startsWith('/')
                      ? 'bg-black h-40 md:h-40 border-0'
                      : 'bg-gradient-to-br from-cyan-900/40 to-teal-900/40 h-20 md:h-24 overflow-hidden rounded-t-lg md:rounded-t-xl border-b-2 border-cyan-500/30'
                  }`} style={product.image.startsWith('/') ? { overflow: 'visible' } : undefined}>
                    {product.image.startsWith('/') ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="absolute object-cover drop-shadow-2xl"
                        style={{
                          width: '150%',
                          height: '160%',
                          top: '-30%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          objectPosition: 'center 55%',
                          zIndex: 10
                        }}
                      />
                    ) : (
                      <span className="text-4xl md:text-5xl filter drop-shadow-lg">{product.image}</span>
                    )}
                    {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <div
                          className="border-4 border-red-500 rounded-sm px-3 py-1 select-none"
                          style={{
                            transform: 'rotate(-20deg)',
                            boxShadow: '0 0 12px rgba(239,68,68,0.7)',
                          }}
                        >
                          <span className="text-red-500 font-black text-xl md:text-2xl tracking-widest uppercase" style={{ textShadow: '0 0 8px rgba(239,68,68,0.8)' }}>
                            AGOTADO
                          </span>
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
                    {product.id === 'pasta-power-bowl' && !isSoldOut && (
                      <div className="absolute top-2 left-0 right-0 z-20 flex justify-center pointer-events-none">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wider shadow-lg shadow-red-900/60" style={{ animation: 'promoBorderPulse 1.6s ease-in-out infinite' }}>
                          🔥 NUEVO INGRESO
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-2.5">
                    <h4 className="text-xs md:text-sm font-bold text-white mb-1.5 md:mb-1 truncate">
                      {product.name}
                    </h4>
                    <p
                      className="text-cyan-200/70 text-[10px] md:text-[11px] mb-1.5 md:mb-2"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                    <div className="flex items-center justify-between mb-1.5 md:mb-2">
                      <div className="flex flex-col gap-0.5">
                        {discountPrice ? (
                          <>
                            <span className="text-xs md:text-sm font-bold text-gray-500 line-through opacity-70">S/ {effectivePrice.toFixed(2)}</span>
                            <span className="text-lg md:text-2xl font-black text-amber-400 promo-price-pulse">S/ {discountPrice.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-sm md:text-base font-black text-amber-400 gold-glow">S/ {effectivePrice.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSoldOut) handleDecreaseQuantity(product.id);
                          }}
                          disabled={isSoldOut}
                          className={`w-5 h-5 md:w-6 md:h-6 text-white rounded text-xs font-bold transition-all flex items-center justify-center ${isSoldOut ? 'bg-gray-700 cursor-not-allowed opacity-40' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-6 md:w-8 text-center text-xs md:text-sm">
                          {orderQuantity[product.id] || 0}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSoldOut) handleIncreaseQuantity(product.id);
                          }}
                          disabled={isSoldOut}
                          className={`w-5 h-5 md:w-6 md:h-6 text-white rounded text-xs font-bold transition-all flex items-center justify-center ${isSoldOut ? 'bg-gray-700 cursor-not-allowed opacity-40' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all origin-top ${
                      isExpanded
                        ? 'max-h-[2500px] scale-y-100 opacity-100 duration-600 ease-out'
                        : 'max-h-0 scale-y-95 opacity-0 duration-400 ease-in-out'
                    }`}
                    style={{
                      transition: isExpanded
                        ? 'max-height 0.6s ease-out, opacity 0.6s ease-out, transform 0.6s ease-out'
                        : 'max-height 0.4s ease-in-out, opacity 0.4s ease-in-out, transform 0.4s ease-in-out'
                    }}
                  >
                    <div className="px-2.5 md:px-4 pb-2.5 md:pb-4 border-t-2 border-cyan-500/30 pt-2.5 md:pt-3">
                      <div className="flex justify-end mb-1.5 md:mb-2">
                        <button
                          onClick={handleCloseCard}
                          className="text-cyan-400 hover:text-cyan-300 text-[10px] md:text-xs font-bold flex items-center gap-0.5 md:gap-1 transition-colors"
                        >
                          <span>Mostrar menos</span>
                          <span className="text-sm md:text-lg">×</span>
                        </button>
                      </div>

                      <div className="mb-3">
                        <h5 className="text-xs font-bold text-white mb-2">Extras</h5>
                        <div className="mb-2">
                          <div className="space-y-1">
                            {(() => {
                              const extraAderezo = {
                                id: "extra-aderezo",
                                name: "Extra aderezo",
                                emoji: "🥗",
                                price: 3.00
                              };
                              const extraProduct: Product = {
                                id: extraAderezo.id,
                                name: extraAderezo.name,
                                description: extraAderezo.name,
                                price: extraAderezo.price,
                                image: extraAderezo.emoji,
                                category: "bebida"
                              };
                              const wasRecentlyAdded = recentlyAdded.has(`${product.id}-${extraAderezo.id}`);
                              const count = getComplementCount(product.id, extraAderezo.id);
                              return (
                                <div className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 border border-cyan-500/10">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm">{extraAderezo.emoji}</span>
                                    <span className="text-white text-[10px]">{extraAderezo.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-amber-400 text-[10px] font-bold">S/ {extraAderezo.price.toFixed(2)}</span>
                                    {count > 0 && (
                                      <>
                                        <button
                                          onClick={() => handleRemoveComplement(product.id, extraAderezo.id)}
                                          className="px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-cyan-600 hover:bg-cyan-500 text-white"
                                        >
                                          −
                                        </button>
                                        <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.5 rounded font-bold">
                                          {count}
                                        </span>
                                      </>
                                    )}
                                    <button
                                      onClick={() => handleAddComplement(product.id, extraProduct)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                        wasRecentlyAdded
                                          ? 'bg-green-600 hover:bg-green-500 scale-110'
                                          : 'bg-cyan-600 hover:bg-cyan-500'
                                      } text-white`}
                                    >
                                      {wasRecentlyAdded ? '✓' : '+'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Pollo grillado - solo para Clásica Fresh Bowl */}
                            {product.id === "ensalada-clasica" && (() => {
                              const polloGrillado = {
                                id: "pollo-grillado",
                                name: "Pollo grillado",
                                emoji: "🍗",
                                price: 5.00
                              };
                              const polloProduct: Product = {
                                id: polloGrillado.id,
                                name: polloGrillado.name,
                                description: polloGrillado.name,
                                price: polloGrillado.price,
                                image: polloGrillado.emoji,
                                category: "bebida"
                              };
                              const wasRecentlyAdded = recentlyAdded.has(`${product.id}-${polloGrillado.id}`);
                              const count = getComplementCount(product.id, polloGrillado.id);
                              return (
                                <div className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 border border-cyan-500/10">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm">{polloGrillado.emoji}</span>
                                    <span className="text-white text-[10px]">{polloGrillado.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-amber-400 text-[10px] font-bold">S/ {polloGrillado.price.toFixed(2)}</span>
                                    {count > 0 && (
                                      <>
                                        <button
                                          onClick={() => handleRemoveComplement(product.id, polloGrillado.id)}
                                          className="px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-cyan-600 hover:bg-cyan-500 text-white"
                                        >
                                          −
                                        </button>
                                        <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.5 rounded font-bold">
                                          {count}
                                        </span>
                                      </>
                                    )}
                                    <button
                                      onClick={() => handleAddComplement(product.id, polloProduct)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                        wasRecentlyAdded
                                          ? 'bg-green-600 hover:bg-green-500 scale-110'
                                          : 'bg-cyan-600 hover:bg-cyan-500'
                                      } text-white`}
                                    >
                                      {wasRecentlyAdded ? '✓' : '+'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="mb-2">
                          <h5 className="text-xs font-bold text-white mb-2">Complementos</h5>
                          <button
                            onClick={() => setShowBebidas((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                            className="w-full flex items-center justify-between bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg p-2 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🥤</span>
                              <span className="text-white text-xs font-bold">Bebidas</span>
                            </div>
                            <span className="text-cyan-400 text-xs">{showBebidas[product.id] ? '▼' : '▶'}</span>
                          </button>

                          {showBebidas[product.id] && (
                            <div className="mt-2 space-y-1">
                              {[
                                { id: "agua-mineral", name: "Agua mineral", emoji: "💧", price: 4.00 },
                                { id: "coca-cola", name: "Coca Cola 500ml", emoji: "🥤", price: 4.00 },
                                { id: "inka-cola", name: "Inka Cola 500ml", emoji: "🥤", price: 4.00 },
                                { id: "sprite", name: "Sprite 500ml", emoji: "🥤", price: 4.00 },
                                { id: "fanta", name: "Fanta 500ml", emoji: "🥤", price: 4.00 },
                              ].map((bebida) => {
                                const bebidaProduct: Product = {
                                  id: bebida.id,
                                  name: bebida.name,
                                  description: bebida.name,
                                  price: bebida.price,
                                  image: bebida.emoji,
                                  category: "bebida"
                                };
                                const wasRecentlyAdded = recentlyAdded.has(`${product.id}-${bebida.id}`);
                                const count = getComplementCount(product.id, bebida.id);
                                return (
                                  <div
                                    key={bebida.id}
                                    className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 border border-cyan-500/10"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm">{bebida.emoji}</span>
                                      <span className="text-white text-[10px]">{bebida.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-amber-400 text-[10px] font-bold">S/ {bebida.price.toFixed(2)}</span>
                                      {count > 0 && (
                                        <>
                                          <button
                                            onClick={() => handleRemoveComplement(product.id, bebida.id)}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-cyan-600 hover:bg-cyan-500 text-white"
                                          >
                                            −
                                          </button>
                                          <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.5 rounded font-bold">
                                            {count}
                                          </span>
                                        </>
                                      )}
                                      <button
                                        onClick={() => handleAddComplement(product.id, bebidaProduct)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                          wasRecentlyAdded
                                            ? 'bg-green-600 hover:bg-green-500 scale-110'
                                            : 'bg-cyan-600 hover:bg-cyan-500'
                                        } text-white`}
                                      >
                                        {wasRecentlyAdded ? '✓' : '+'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!isSoldOut && (orderQuantity[product.id] || 0) > 0) {
                            handleCompleteOrder(product);
                            setIsEditingOrder(false);
                          }
                        }}
                        disabled={isSoldOut || (orderQuantity[product.id] || 0) === 0}
                        className={`w-full py-2.5 rounded font-bold text-sm transition-all ${isSoldOut || (orderQuantity[product.id] || 0) === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-black neon-border-fit cursor-pointer active:scale-95'}`}
                      >
                        {isSoldOut ? 'No disponible' : (orderQuantity[product.id] || 0) === 0 ? 'Agrega al menos 1 unidad' : isEditingOrder ? 'Confirmar orden' : 'Agregar orden'}
                      </button>
                    </div>
                  </div>
                </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>


        {completedOrders.length > 0 && (
          <div id="tu-orden-section" className="container mx-auto px-3 md:px-4 -mt-2 md:mt-0 lg:mt-2">
            <h3 className="text-base md:text-lg lg:text-xl font-black text-cyan-400 mb-2 md:mb-3 neon-glow-fit">
              Tu orden
            </h3>
            <div className="space-y-2 md:space-y-3">
              {completedOrders.map((order, index) => {
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
                              <span className="text-amber-400/80">S/ {(product.price * order.quantity).toFixed(2)}</span>
                            </div>

                            {/* Salsas (para órdenes de fat y tacos) */}
                            {(isFatOrder || isTacoOrder) && order.salsas && order.salsas.length > 0 && (
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
                                      <span className="text-amber-400/80">S/ {complement.price.toFixed(2)}</span>
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
                    <div className="text-amber-400 font-bold text-sm gold-glow">
                      S/ {(() => {
                        const effectivePrice = menuPrices[product.id] || product.price;
                        const basePrice = order.finalPrice ?? effectivePrice;
                        const unitPrice = (hasComboDiscount && order.discountApplied)
                          ? (order.originalPrice ?? effectivePrice)
                          : basePrice;
                        const productTotal = unitPrice * order.quantity;
                        const complementsTotal = order.complementIds.reduce((sum, compId) => {
                          return sum + (availableComplements[compId]?.price || 0);
                        }, 0);
                        return (productTotal + complementsTotal).toFixed(2);
                      })()}
                    </div>
                  </div>
                );
              })}
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
                      <span className="bg-fuchsia-500 text-white text-[10px] md:text-xs font-black px-1.5 py-0.5 rounded">
                        COMBO -S/ 5
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

      <WhatsAppButton />
    </div>
  );
}
