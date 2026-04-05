"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import WhatsAppButton from "../components/WhatsAppButton";
import BannerCarousel from "../components/BannerCarousel";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "fit" | "fat" | "bebida" | "taco";
}

interface Salsa {
  id: string;
  name: string;
  description: string;
  soldOut?: boolean;
}

interface CompletedOrder {
  productId: string;
  quantity: number;
  salsas: string[];
  complementIds: string[];
  discountApplied?: boolean;
  originalPrice?: number;
  finalPrice?: number;
}

const products: Product[] = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    description: "8 alitas crujientes con papas francesas y tu salsa elegida. El primer bocado es una trampa, no vas a querer quedarte en solo 8.",
    price: 20.00,
    image: "/pequeno-dilema.png?v=3",
    category: "fat",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    description: "14 alitas con papas francesas y 2 salsas para hacer lo que se te antoje. Spoiler: el arrepentimiento llega después, no durante.",
    price: 34.00,
    image: "/duo-dilema.png?v=3",
    category: "fat",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    description: "20 alitas, papas francesas y 3 salsas para combinar sin culpa. Para los que no entienden el concepto de 'suficiente'.",
    price: 47.00,
    image: "/todos-pecan.png?v=3",
    category: "fat",
  },
];

// Productos de FIT para visualización de órdenes cruzadas
const fitProducts: Product[] = [
  {
    id: "ensalada-clasica",
    name: "CLÁSICA FRESH BOWL",
    description: "Lechuga bogi, tomate cherry, pepino, zanahoria, maiz americano, palta y huevo. Con vinagreta clasica de la casa.",
    price: 18.50,
    image: "/clasica-fresh-bowl.png",
    category: "fit",
  },
  {
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    description: "Lechuga romana, pollo grillado, tomate cherry, crutones y parmesano. Con salsa César cremosa de la casa.",
    price: 18.00,
    image: "/cesar-power-bowl.png",
    category: "fit",
  },
  {
    id: "ensalada-caesar",
    name: "PROTEIN FIT BOWL",
    description: "Mix de hojas verdes, quinua, palta, tomate cherry, semillas y pollo grillado. Con aderezo de yogurt griego.",
    price: 20.00,
    image: "/protein-fit-bowl.png",
    category: "fit",
  },
  {
    id: "ensalada-mediterranea",
    name: "TUNA FRESH BOWL",
    description: "Lechuga romana, atún en trozos, tomate cherry, pepino, choclo, palta y huevo. Aderezo a elección.",
    price: 18.50,
    image: "/4.png",
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

const salsas: Salsa[] = [
  {
    id: "barbecue",
    name: "BBQ ahumada",
    description: "Dulce y ahumada, perfecta para quien busca un sabor clásico y reconfortante"
  },
  {
    id: "buffalo-picante",
    name: "Santo Picante",
    description: "Buffalo clásico con picante equilibrado. Intensidad justa y carácter gourmet"
  },
  {
    id: "ahumada",
    name: "Acevichada Imperial",
    description: "Inspirado en el ceviche peruano: fresco, cítrico y con un suave picor, dándole un carácter auténtico"
  },
  {
    id: "parmesano-ajo",
    name: "Crispy Celestial",
    description: "Doradas y ultra crujientes por fuera y jugosas por dentro. Textura perfecta en cada bocado"
  },
  {
    id: "anticuchos",
    name: "Parrillera",
    description: "Inspirada en el clásico peruano, con especias que dan un toque aromático y anticuchero"
  },
  {
    id: "honey-mustard",
    name: "Honey mustard",
    description: "Equilibrio perfecto entre dulce miel y mostaza suave, sabor agridulce irresistible"
  },
  {
    id: "teriyaki",
    name: "Oriental Teriyaki",
    description: "Salsa asiática, dulce y salado en equilibrio. Con notas ahumadas que evocan los sabores orientales"
  },
  {
    id: "macerichada",
    name: "Sweet & Sour",
    description: "Contraste vibrante entre lo dulce y ácido. Fresca, intensa y memorable en cada mordida"
  },
];

// Ofertas hardcodeadas por combinación de salsas
const SALSA_OFFERS: Record<string, { salsas: string[]; price: number }> = {
  'pequeno-dilema': { salsas: ['teriyaki'], price: 18 },
  'duo-dilema': { salsas: ['barbecue', 'ahumada'], price: 32 },
  'santo-pecado': { salsas: ['barbecue', 'buffalo-picante', 'parmesano-ajo'], price: 44 },
};

// Generar dinámicamente el diccionario de complementos disponibles
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

  // Agregar todas las extra salsas dinámicas
  salsas.forEach(salsa => {
    complements[`extra-salsa-${salsa.id}`] = {
      name: `Extra salsa - ${salsa.name}`,
      price: 3.00
    };
  });

  return complements;
};

const availableComplements = generateAvailableComplements();

export default function FatPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedSalsas, setSelectedSalsas] = useState<Record<string, string[]>>({});
  const [selectedComplements, setSelectedComplements] = useState<Record<string, any[]>>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
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
  const [showSalsas, setShowSalsas] = useState<Record<string, boolean>>({});
  const [showBebidas, setShowBebidas] = useState<Record<string, boolean>>({});
  const [showExtras, setShowExtras] = useState<Record<string, boolean>>({});
  const [showCartModal, setShowCartModal] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const [mainProductsInCart, setMainProductsInCart] = useState<Record<string, string>>({});
  const [recentlyAddedSalsas, setRecentlyAddedSalsas] = useState<Set<string>>(new Set());
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
  const [salsaPromos, setSalsaPromos] = useState<any[]>([]);
  const router = useRouter();

  // Salsas con estado agotado derivado del menuStock en tiempo real
  const effectiveSalsas = useMemo(
    () => salsas.map(s => ({ ...s, soldOut: s.soldOut || !!menuStock[`salsa-${s.id}`] })),
    [menuStock]
  );

  const findMatchingPromo = (productId: string, selectedSalsaIds: string[]): any | null => {
    if (selectedSalsaIds.length === 0) return null;
    return salsaPromos.find(
      (p: any) => p.active && p.productId === productId &&
      selectedSalsaIds.every((sId: string) => p.salsas.includes(sId))
    ) || null;
  };

  // Detectar combo FAT + FIT antes de calcular totales (las promos no son acumulables)
  // PROMOCIÓN DESACTIVADA
  const FAT_IDS = ["pequeno-dilema", "duo-dilema", "santo-pecado"];
  const FIT_IDS = ["ensalada-clasica", "ensalada-proteica", "ensalada-caesar", "ensalada-mediterranea", "cobb-supreme-bowl", "crispy-chicken-bowl", "pasta-power-bowl"];
  const hasComboDiscount = false; // Promoción combo desactivada

  const completedTotal = completedOrders.reduce((total, order) => {
    const basePrice = order.finalPrice ?? order.originalPrice ?? (() => {
      let product = products.find(p => p.id === order.productId);
      if (!product) product = fitProducts.find(p => p.id === order.productId);
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
      if (!product) product = fitProducts.find(p => p.id === order.productId);
      if (!product) product = tacoProducts.find(p => p.id === order.productId);
      if (product) {
        const basePrice = menuDiscounts[product.id] || menuPrices[product.id] || product.price;
        const finalPrice = order.finalPrice ?? basePrice;

        addToCart({
          ...product,
          price: finalPrice
        }, order.quantity);

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
  // Actualizar estado de apertura cada minuto
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
    fetch("/api/salsa-promos")
      .then((r) => r.json())
      .then((data) => setSalsaPromos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);


  useEffect(() => {
    const savedOrders = sessionStorage.getItem("santo-dilema-orders");
    if (savedOrders) {
      try {
        const allOrders = JSON.parse(savedOrders);
        // Mantener solo las órdenes que NO son "fat"
        const otherOrders = allOrders.filter((order: CompletedOrder) => order.category !== "fat");
        setCompletedOrders(otherOrders);

        // Si había órdenes fat, las limpiamos del sessionStorage
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

  // Guardar órdenes completadas en sessionStorage cuando cambien
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
        window.history.replaceState({}, '', '/fat');

        // Ejecutar la edición después de un pequeño delay para asegurar que todo esté cargado
        setTimeout(() => {
          handleEditOrder(orderIndex);
        }, 300);
      }
    }
  }, [completedOrders]);

  // Centrar el carrusel en el cartel del medio al cargar la página
  useEffect(() => {
    const centerCarousel = () => {
      if (scrollContainerRef.current && cardRefs.current["duo-dilema"]) {
        const container = scrollContainerRef.current;
        const middleCard = cardRefs.current["duo-dilema"];

        if (middleCard) {
          const cardLeft = middleCard.offsetLeft;
          const cardWidth = middleCard.offsetWidth;
          const containerWidth = container.offsetWidth;

          const scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);
          container.scrollLeft = scrollPosition;
        }
      }
    };

    // Esperar un momento para que el DOM esté completamente renderizado
    const timer = setTimeout(centerCarousel, 100);
    return () => clearTimeout(timer);
  }, []);

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

  const getRequiredSalsasCount = (productId: string): number => {
    const quantity = orderQuantity[productId] || 0;
    if (quantity === 0) return 0;
    let baseSalsas = 1;
    if (productId === "pequeno-dilema") baseSalsas = 1;
    if (productId === "duo-dilema") baseSalsas = 2;
    if (productId === "santo-pecado") baseSalsas = 3;
    return baseSalsas * quantity;
  };

  const handleExpandCard = (productId: string) => {
    if (isDragging) return;
    setExpandedCard(productId);
    setShowSalsas((prev) => ({ ...prev, [productId]: true }));
    setIsEditingOrder(false); // Es una nueva orden, no edición
    if (!selectedSalsas[productId]) {
      setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
    }
    if (!selectedComplements[productId]) {
      setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
    }

    // Scroll hacia la sección de salsas después de expandir
    setTimeout(() => {
      const card = cardRefs.current[productId];
      if (card) {
        const salsasButton = card.querySelector('[data-salsas-button]');
        if (salsasButton) {
          // Obtener posición actual del scroll
          const currentScroll = window.scrollY || document.documentElement.scrollTop;

          // Obtener posición del botón de salsas
          const rect = salsasButton.getBoundingClientRect();

          // Calcular la posición absoluta del botón (scroll actual + posición relativa)
          const elementTop = currentScroll + rect.top;

          // Calcular cuánto scroll necesitamos para centrar el elemento
          // Centramos restando la mitad de la altura de la ventana
          const offset = window.innerHeight / 2 - rect.height / 2;
          const scrollTarget = elementTop - offset + 100; // +100px para ajuste adicional hacia arriba

          // Hacer scroll suave
          window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          });

          console.log('Scroll triggered:', {
            currentScroll,
            elementTop,
            scrollTarget,
            windowHeight: window.innerHeight
          });
        }
      }
    }, 500);
  };

  const handleCloseCard = () => {
    setExpandedCard(null);
    setIsEditingOrder(false);
    setEditingOrderIndex(null);
    // Limpiar estados
    if (expandedCard) {
      setShowSalsas((prev) => ({ ...prev, [expandedCard]: false }));
      setShowBebidas((prev) => ({ ...prev, [expandedCard]: false }));
      setShowExtras((prev) => ({ ...prev, [expandedCard]: false }));
    }
  };

  const handleCardClick = (productId: string) => {
    const currentQty = orderQuantity[productId] || 0;

    // Helper: reset previous card qty to 0 if it has no completed order
    const resetPreviousCard = (prevId: string) => {
      const hasOrder = completedOrders.some(o => o.productId === prevId);
      if (!hasOrder) {
        setOrderQuantity((prev) => ({ ...prev, [prevId]: 0 }));
      }
      setShowSalsas((prev) => ({ ...prev, [prevId]: false }));
      setShowBebidas((prev) => ({ ...prev, [prevId]: false }));
      setShowExtras((prev) => ({ ...prev, [prevId]: false }));
    };

    // Si qty = 0, permitir expandir/colapsar con clic
    if (currentQty === 0) {
      if (expandedCard === productId) {
        // Colapsar: volver a 0
        setExpandedCard(null);
        setOrderQuantity((prev) => ({ ...prev, [productId]: 0 }));
        setShowSalsas((prev) => ({ ...prev, [productId]: false }));
        setShowBebidas((prev) => ({ ...prev, [productId]: false }));
        setShowExtras((prev) => ({ ...prev, [productId]: false }));
      } else {
        // Si había otro cartel expandido, resetear su contador
        if (expandedCard) resetPreviousCard(expandedCard);

        // Expandir y poner qty = 1 automáticamente
        setExpandedCard(productId);
        setOrderQuantity((prev) => ({ ...prev, [productId]: 1 }));
        setShowSalsas((prev) => ({ ...prev, [productId]: true }));
        if (!selectedSalsas[productId]) {
          setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
        }
        if (!selectedComplements[productId]) {
          setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
        }

        // Scroll hacia la sección de salsas después de que se expanda el cartel
        setTimeout(() => {
          const card = cardRefs.current[productId];
          if (card) {
            const salsasButton = card.querySelector('[data-salsas-button]');
            if (salsasButton) {
              salsasButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 600);
      }
    } else if (currentQty > 0 && expandedCard !== productId) {
      // Si qty > 0, solo expandir si no está expandido
      if (expandedCard) resetPreviousCard(expandedCard);
      setExpandedCard(productId);
      setShowSalsas((prev) => ({ ...prev, [productId]: true }));

      // Scroll hacia la sección de salsas después de que se expanda el cartel
      setTimeout(() => {
        const card = cardRefs.current[productId];
        if (card) {
          const salsasButton = card.querySelector('[data-salsas-button]');
          if (salsasButton) {
            salsasButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
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

    // Expandir automáticamente cuando se agrega unidad (de 0 a 1, de 1 a 2, etc.)
    if (expandedCard !== productId && currentQty >= 0) {
      setExpandedCard(productId);
      setShowSalsas((prev) => ({ ...prev, [productId]: true }));
      if (!selectedSalsas[productId]) {
        setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
      }
      if (!selectedComplements[productId]) {
        setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
      }

      // Scroll hacia la sección de salsas después de que se expanda el cartel
      setTimeout(() => {
        const card = cardRefs.current[productId];
        if (card) {
          const salsasButton = card.querySelector('[data-salsas-button]');
          if (salsasButton) {
            salsasButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 600);
    } else if (expandedCard === productId) {
      // Si el cartel ya está expandido, expandir la sección de salsas
      // porque ahora se necesitan más salsas (1/2, 2/4, 3/6, etc.)
      setShowSalsas((prev) => ({ ...prev, [productId]: true }));
    }
  };

  const handleDecreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 0;
    if (currentQty > 0) {
      setOrderQuantity((prev) => ({
        ...prev,
        [productId]: currentQty - 1
      }));
      // Si llega a 0, colapsar el card y limpiar carrito
      if (currentQty === 1) {
        setExpandedCard(null);
        setIsEditingOrder(false);
        setEditingOrderIndex(null);
        setShowSalsas((prev) => ({ ...prev, [productId]: false }));
        setShowBebidas((prev) => ({ ...prev, [productId]: false }));
        setShowExtras((prev) => ({ ...prev, [productId]: false }));
        // Limpiar salsas y complementos solo cuando llega a 0
        setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
        setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
        // Eliminar del carrito si existe
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

  const handleSalsaToggle = (productId: string, salsaId: string, action: 'add' | 'remove' = 'add') => {
    const requiredCount = getRequiredSalsasCount(productId);
    const currentSalsas = selectedSalsas[productId] || [];

    if (action === 'remove') {
      // Remover una instancia de esta salsa
      const index = currentSalsas.indexOf(salsaId);
      if (index !== -1) {
        const newSalsas = [...currentSalsas];
        newSalsas.splice(index, 1);
        setSelectedSalsas((prev) => ({ ...prev, [productId]: newSalsas }));

        // Si ya no está completo, remover del carrito
        if (newSalsas.length < requiredCount && mainProductsInCart[productId]) {
          removeFromCart(mainProductsInCart[productId]);
          setMainProductsInCart((prev) => {
            const newState = { ...prev };
            delete newState[productId];
            return newState;
          });
        } else if (newSalsas.length === requiredCount) {
          // Si sigue completo pero cambió la selección, actualizar el carrito
          const product = products.find((p) => p.id === productId);
          if (product) {
            const salsasText = newSalsas
              .map((sId) => salsas.find((s) => s.id === sId)?.name)
              .filter((name) => name)
              .join(", ");

            const cartItemId = `${productId}-main`;

            // Precio de oferta por combinación (dinámica) o precio oferta/real del admin
            const matchingPromoR = findMatchingPromo(productId, newSalsas);
            const effectivePriceR = menuDiscounts[productId] || menuPrices[productId] || product.price;
            const finalPrice = matchingPromoR ? matchingPromoR.promoPrice : effectivePriceR;

            const productWithSalsas: Product = {
              ...product,
              id: cartItemId,
              description: `${product.description} - Salsas: ${salsasText}`,
              price: finalPrice,
            };

            // Remover el anterior y agregar el actualizado
            if (mainProductsInCart[productId]) {
              removeFromCart(mainProductsInCart[productId]);
            }
            addToCart(productWithSalsas, 1);
            setMainProductsInCart((prev) => ({ ...prev, [productId]: cartItemId }));
          }
        }
      }
    } else {
      // Agregar esta salsa si no hemos llegado al límite
      if (currentSalsas.length < requiredCount) {
        const newSalsas = [...currentSalsas, salsaId];
        setSelectedSalsas((prev) => ({ ...prev, [productId]: newSalsas }));

        // Mostrar feedback visual
        const key = `${productId}-${salsaId}`;
        setRecentlyAddedSalsas((prev) => new Set(prev).add(key));

        // Remover feedback después de 800ms
        setTimeout(() => {
          setRecentlyAddedSalsas((prev) => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }, 800);

        // Auto-agregar al carrito cuando se complete la selección
        if (newSalsas.length === requiredCount) {
          const product = products.find((p) => p.id === productId);
          if (product) {
            const salsasText = newSalsas
              .map((sId) => salsas.find((s) => s.id === sId)?.name)
              .filter((name) => name)
              .join(", ");

            const cartItemId = `${productId}-main`;

            // Precio de oferta por combinación (dinámica) o precio oferta/real del admin
            const matchingPromoA = findMatchingPromo(productId, newSalsas);
            const effectivePriceA = menuDiscounts[productId] || menuPrices[productId] || product.price;
            const finalPrice = matchingPromoA ? matchingPromoA.promoPrice : effectivePriceA;

            const productWithSalsas: Product = {
              ...product,
              id: cartItemId,
              description: `${product.description} - Salsas: ${salsasText}`,
              price: finalPrice,
            };

            // Si ya existe en el carrito, removerlo primero (por si cambió las salsas)
            if (mainProductsInCart[productId]) {
              removeFromCart(mainProductsInCart[productId]);
            }

            addToCart(productWithSalsas, 1);
            setMainProductsInCart((prev) => ({ ...prev, [productId]: cartItemId }));
          }

          // Auto-colapsar cuando se complete la selección
          setTimeout(() => {
            setShowSalsas((prev) => ({ ...prev, [productId]: false }));
          }, 1200);
        }
      }
    }
  };

  const getSalsaCount = (productId: string, salsaId: string): number => {
    const currentSalsas = selectedSalsas[productId] || [];
    return currentSalsas.filter((s) => s === salsaId).length;
  };

  const canAddProduct = (productId: string): boolean => {
    const requiredCount = getRequiredSalsasCount(productId);
    const currentSalsas = selectedSalsas[productId] || [];
    return currentSalsas.length === requiredCount;
  };

  const handleCompleteOrder = (product: Product) => {
    // Guardar la orden completada
    const orderSalsas = selectedSalsas[product.id] || [];
    const qty = orderQuantity[product.id] || 1;

    // Precio oferta del admin o precio real, luego promo por salsas encima
    const regularPrice      = menuPrices[product.id] || product.price;
    const effectiveBasePrice = menuDiscounts[product.id] || regularPrice;
    const matchingPromoC = findMatchingPromo(product.id, orderSalsas);
    const finalPrice = matchingPromoC ? matchingPromoC.promoPrice : effectiveBasePrice;
    const discountApplied = finalPrice < effectiveBasePrice;

    const completedOrder: CompletedOrder = {
      productId: product.id,
      quantity: qty,
      salsas: orderSalsas,
      complementIds: complementsInCart[product.id] || [],
      originalPrice: effectiveBasePrice,
      finalPrice: finalPrice,
      discountApplied: discountApplied
    };
    if (isEditingOrder && editingOrderIndex !== null) {
      setCompletedOrders((prev) => prev.map((order, idx) => idx === editingOrderIndex ? completedOrder : order));
      setEditingOrderIndex(null);
    } else {
      setCompletedOrders((prev) => [...prev, completedOrder]);
    }

    // Limpiar selecciones y cerrar el card
    setSelectedSalsas((prev) => ({ ...prev, [product.id]: [] }));
    setSelectedComplements((prev) => ({ ...prev, [product.id]: [] }));
    setShowSalsas((prev) => ({ ...prev, [product.id]: false }));
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

    // Verificar si la orden pertenece al menú fit o tacos
    const isFitOrder = fitProducts.some(p => p.id === order.productId);
    const isTacoOrderEdit = tacoProducts.some(p => p.id === order.productId);

    if (isFitOrder) {
      router.push(`/fit?editOrder=${orderIndex}`);
      return;
    }
    if (isTacoOrderEdit) {
      router.push(`/tacos?editOrder=${orderIndex}`);
      return;
    }

    // Guardar el índice para reemplazar en completedOrders al confirmar
    setEditingOrderIndex(orderIndex);

    // Restaurar los estados para editar
    setOrderQuantity((prev) => ({ ...prev, [order.productId]: order.quantity }));
    setSelectedSalsas((prev) => ({ ...prev, [order.productId]: order.salsas }));
    setComplementsInCart((prev) => ({ ...prev, [order.productId]: order.complementIds }));

    // Marcar que estamos editando
    setIsEditingOrder(true);

    // Abrir el card expandido
    setExpandedCard(order.productId);
    setShowSalsas((prev) => ({ ...prev, [order.productId]: true }));

    // Desplazar y centrar el cartel correspondiente
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

    // Eliminar esta orden de completedOrders
    setCompletedOrders((prev) => prev.filter((_, idx) => idx !== deleteOrderIndex));

    // Eliminar el plato principal del carrito
    const cartItemId = `${order.productId}-main`;
    removeFromCart(cartItemId);

    // Eliminar los complementos del carrito
    order.complementIds.forEach((complementId) => {
      removeFromCart(complementId);
    });

    // Cerrar modal
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  };

  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  };

  const handleAddComplement = (productId: string, complement: Product) => {
    // Agregar directamente al carrito para que el total se actualice
    addToCart(complement, 1);

    // Trackear el complemento agregado para poder eliminarlo después
    setComplementsInCart((prev) => ({
      ...prev,
      [productId]: [...(prev[productId] || []), complement.id]
    }));

    // Mostrar feedback visual
    const key = `${productId}-${complement.id}`;
    setRecentlyAdded((prev) => new Set(prev).add(key));

    // Remover después de 800ms
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 800);
  };

  const handleRemoveComplement = (productId: string, complementId: string) => {
    // Encontrar la instancia del complemento en el carrito
    const complementsForProduct = complementsInCart[productId] || [];
    const indexToRemove = complementsForProduct.lastIndexOf(complementId);

    if (indexToRemove !== -1) {
      // Remover del carrito
      removeFromCart(complementId);

      // Actualizar el tracking de complementos
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
    if (expandedCard) return; // No hacer hover si hay un cartel expandido
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

  const collapseExpandedCard = () => {
    if (!expandedCard) return;
    resetExpandedCard(expandedCard);
    setExpandedCard(null);
  };

  const resetExpandedCard = (productId: string) => {
    const hasOrder = completedOrders.some(o => o.productId === productId);
    if (!hasOrder) {
      setOrderQuantity((prev) => ({ ...prev, [productId]: 0 }));
    }
    setShowSalsas((prev) => ({ ...prev, [productId]: false }));
    setShowBebidas((prev) => ({ ...prev, [productId]: false }));
    setShowExtras((prev) => ({ ...prev, [productId]: false }));
  };

  return (
    <div className="min-h-screen bg-black md:bg-transparent relative overflow-visible" onClick={collapseExpandedCard}>
      {/* Decoración carnavalesca sutil */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Cadeneta de carnaval */}
        <svg className="absolute top-4 left-0 w-full h-16 opacity-35" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <line x1="0" y1="8" x2="1200" y2="8" stroke="#666" strokeWidth="1.5" opacity="0.4"/>
          {/* Banderines triangulares */}
          <polygon points="40,8 20,40 60,40" fill="#ec4899" opacity="0.8"/>
          <polygon points="140,8 120,40 160,40" fill="#fbbf24" opacity="0.8"/>
          <polygon points="240,8 220,40 260,40" fill="#f97316" opacity="0.8"/>
          <polygon points="340,8 320,40 360,40" fill="#a855f7" opacity="0.8"/>
          <polygon points="440,8 420,40 460,40" fill="#ef4444" opacity="0.8"/>
          <polygon points="540,8 520,40 560,40" fill="#f59e0b" opacity="0.8"/>
          <polygon points="640,8 620,40 660,40" fill="#ec4899" opacity="0.8"/>
          <polygon points="740,8 720,40 760,40" fill="#f97316" opacity="0.8"/>
          <polygon points="840,8 820,40 860,40" fill="#a855f7" opacity="0.8"/>
          <polygon points="940,8 920,40 960,40" fill="#fbbf24" opacity="0.8"/>
          <polygon points="1040,8 1020,40 1060,40" fill="#ef4444" opacity="0.8"/>
          <polygon points="1140,8 1120,40 1160,40" fill="#f97316" opacity="0.8"/>
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
            <ellipse cx="29" cy="34" rx="24" ry="29" fill="#f97316" opacity="0.8"/>
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
            <rect x="4" y="8" width="27" height="22" rx="2" fill="#f97316" opacity="0.8"/>
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
        <div className="absolute top-0 right-[50%] w-2 h-52 bg-gradient-to-b from-orange-400/30 to-transparent -rotate-8"></div>

        {/* Confetti */}
        <div className="absolute top-10 left-[30%] w-3 h-3 bg-pink-500/40 rounded-full"></div>
        <div className="absolute top-16 right-[35%] w-2 h-2 bg-yellow-400/40 rounded-full"></div>
        <div className="absolute top-12 left-[60%] w-2 h-2 bg-purple-500/40 rounded-full"></div>
        <div className="absolute top-20 right-[15%] w-3 h-3 bg-orange-400/40 rounded-full"></div>
        <div className="absolute top-24 left-[70%] w-2 h-2 bg-pink-400/40 rounded-full"></div>
      </div>

      {/* Iconos decorativos de fondo */}
      <div className="fixed inset-0 overflow-hidden opacity-10 pointer-events-none z-0">
        {/* Alitas */}
        <svg className="absolute top-20 right-16 w-24 h-24 md:w-28 md:h-28 text-red-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M25 50 Q30 40, 40 38 L50 37 Q60 38, 65 42 L75 45 Q82 48, 82 55 Q82 62, 75 65 L65 68 Q60 70, 50 70 L40 69 Q30 67, 25 60 Q20 55, 25 50Z"/>
          <circle cx="35" cy="55" r="2.5" fill="currentColor" opacity="0.4"/>
          <circle cx="55" cy="57" r="2.5" fill="currentColor" opacity="0.4"/>
        </svg>

        <svg className="absolute bottom-28 left-20 w-20 h-20 md:w-24 md:h-24 text-orange-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M28 50 Q32 42, 42 40 L52 39 Q62 40, 67 45 L72 48 Q77 52, 77 57 Q77 63, 72 66 L67 69 Q62 72, 52 72 L42 71 Q32 69, 28 62 Q24 57, 28 50Z"/>
          <circle cx="38" cy="56" r="2" fill="currentColor" opacity="0.4"/>
        </svg>

        {/* Fuegos */}
        <svg className="absolute top-1/3 left-12 w-20 h-20 md:w-26 md:h-26 text-orange-500 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 20 Q45 30, 42 40 Q40 50, 42 60 Q45 68, 50 70 Q55 68, 58 60 Q60 50, 58 40 Q55 30, 50 20Z"/>
          <path d="M50 35 Q48 42, 47 48 Q46 54, 48 58 Q50 60, 52 58 Q54 54, 53 48 Q52 42, 50 35Z"/>
        </svg>

        <svg className="absolute bottom-1/3 right-24 w-18 h-18 md:w-22 md:h-22 text-red-500 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 25 Q47 32, 45 40 Q44 48, 46 55 Q49 62, 50 65 Q51 62, 54 55 Q56 48, 55 40 Q53 32, 50 25Z"/>
        </svg>

        {/* Hamburguesas */}
        <svg className="absolute top-1/2 right-32 w-24 h-24 md:w-28 md:h-28 text-orange-400 float-slower" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M25 35 Q25 30, 30 28 L70 28 Q75 30, 75 35" strokeWidth="2.5"/>
          <rect x="22" y="35" width="56" height="8" rx="2"/>
          <rect x="22" y="43" width="56" height="6" rx="1" fill="currentColor" opacity="0.3"/>
          <path d="M25 65 Q25 70, 30 72 L70 72 Q75 70, 75 65" strokeWidth="2.5"/>
        </svg>

        {/* Pizzas */}
        <svg className="absolute top-40 left-16 w-20 h-20 md:w-24 md:h-24 text-orange-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 15 L25 80 L75 80 Z"/>
          <circle cx="42" cy="50" r="4" fill="currentColor" opacity="0.4"/>
          <circle cx="58" cy="55" r="4" fill="currentColor" opacity="0.4"/>
        </svg>

        {/* Chiles */}
        <svg className="absolute bottom-20 right-20 w-16 h-16 md:w-20 md:h-20 text-red-500 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M50 25 Q48 32, 46 42 Q44 52, 44 62 Q44 72, 48 78 Q52 78, 56 72 Q56 62, 56 52 Q54 42, 52 32 Q50 25, 50 25Z"/>
        </svg>

        {/* Papas fritas */}
        <svg className="absolute bottom-24 left-32 w-22 h-22 md:w-26 md:h-26 text-amber-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M30 30 L28 75 L35 78 L37 33 Z"/>
          <path d="M40 25 L38 75 L45 78 L47 28 Z"/>
          <path d="M50 28 L48 75 L55 78 L57 31 Z"/>
        </svg>
      </div>

      {/* Header */}
      <header className="bg-gray-900 md:bg-transparent border-b-2 md:border-b-0 border-red-500 neon-border-fat fixed top-0 left-0 right-0 md:sticky md:left-auto md:right-auto z-30 overflow-visible">
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
              href="/fit"
              className="text-xs md:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors neon-glow-fit px-2 md:px-3 py-1 md:py-1.5 rounded border border-cyan-500/30 hover:border-cyan-400 hidden sm:block"
            >
              Ver menú Ensaladas →
            </Link>
            <Link
              href="/fit"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors neon-glow-fit px-2 py-1 rounded border border-cyan-500/30 hover:border-cyan-400 sm:hidden"
            >
              Ver menú Ensaladas
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

      {/* Banner Carrusel */}
      <BannerCarousel
        slides={[
          { movil: "/1920x300/1.png", web: "/1920x500/1.png" },
          { movil: "/1920x300/2.png", web: "/1920x500/2.png" },
          { movil: "/1920x300/3.png", web: "/1920x500/3.png" },
          { movil: "/1920x300/4.png", web: "/1920x500/4.png" },
        ]}
      />

      {/* Products Carousel */}
      <section className={`container mx-auto px-2 md:px-4 py-3 md:py-8 transition-all duration-300 overflow-visible ${completedOrders.length > 0 ? 'pb-20 md:pb-16' : 'pb-3 md:pb-3'}`}>

        {/* Page title */}
        <div className="px-3 pt-4 pb-2 text-center">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-red-400" style={{ textShadow: "0 0 12px rgba(239,68,68,0.6)" }}>
            ALITAS PREMIUM PARA EL PLACER
          </h1>
        </div>

        {/* Carousel Container */}
        <div className="relative flex items-center justify-center overflow-visible" style={{ overflow: 'visible' }}>
          {/* Scrollable Products - Carrusel en móvil, grilla en desktop */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`grid grid-cols-2 md:flex md:flex-wrap md:justify-center items-center gap-x-3 gap-y-12 md:gap-6 lg:gap-8 scrollbar-hide px-3 md:px-4 pt-10 pb-8 md:py-8 lg:py-10 select-none md:cursor-default md:overflow-visible`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none', overflow: 'visible' }}
          >
            {products.map((product, index) => {
              const isExpanded = expandedCard === product.id;
              const requiredSalsas = getRequiredSalsasCount(product.id);
              const currentSalsas = selectedSalsas[product.id] || [];
              const canAdd = canAddProduct(product.id);
              const isSoldOut = !!menuStock[product.id];
              const discountPrice = menuDiscounts[product.id];
              const effectivePrice = menuPrices[product.id] || product.price;
              const activePromo = findMatchingPromo(product.id, currentSalsas);
              const dynamicPromosForProduct = salsaPromos.filter((p: any) => p.active && p.productId === product.id);
              const allPromosForProduct = dynamicPromosForProduct;
              const isLastOdd = index === products.length - 1 && products.length % 2 !== 0;

              return (
                <div
                  key={product.id}
                  className={isLastOdd ? 'col-span-2 md:contents flex justify-center overflow-visible' : 'contents'}
                  style={isLastOdd ? { overflow: 'visible' } : undefined}
                >
                <div
                  ref={(el) => { cardRefs.current[product.id] = el; }}
                  onClick={(e) => { e.stopPropagation(); if (!isSoldOut && !isExpanded) handleCardClick(product.id); }}
                  onMouseEnter={() => { if (!isSoldOut) handleCardHover(product.id); }}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`bg-gray-900 flex-shrink-0 md:flex-shrink ${discountPrice ? 'border-4 border-amber-400 super-promo-glow shadow-xl shadow-amber-500/40' : 'neon-border-fat shadow-xl shadow-red-500/30 border-2 md:border-0 border-red-400'} ${isSoldOut ? 'opacity-70 cursor-not-allowed' : ''}
                    ${isExpanded
                      ? `${isLastOdd ? 'w-[calc(50%-0.375rem)]' : 'w-full'} md:w-[400px] lg:w-[420px] z-20`
                      : isLastOdd ? 'w-[calc(50%-0.375rem)] md:w-[280px] lg:w-[300px]' : 'w-full md:w-[280px] lg:w-[300px]'
                    }
                    ${!isExpanded && hoveredCard === product.id && !expandedCard
                      ? 'md:scale-105 md:-translate-y-2 md:shadow-2xl md:shadow-red-500/50 z-10'
                      : !isExpanded && !expandedCard ? 'md:shadow-none scale-100 translate-y-0' : ''
                    }
                    ${(orderQuantity[product.id] || 0) > 0 && !isExpanded ? 'cursor-pointer' : ''}
                  `}
                  style={{
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease, box-shadow 0.3s ease',
                    transformOrigin: 'center center',
                    borderRadius: 0,
                    overflow: 'visible',
                    position: 'relative',
                    zIndex: isExpanded ? 50 : isMobile ? index + 1 : undefined,
                  }}
                >
                  {/* Card Header */}
                  <div
                    className={`relative flex items-center justify-center overflow-visible ${
                      product.image.startsWith('/')
                        ? 'bg-black h-40 md:h-48 border-0'
                        : 'bg-gradient-to-br from-red-900/40 to-orange-900/40 h-20 md:h-28 overflow-hidden rounded-t-lg md:rounded-t-xl border-b-2 border-red-500/30'
                    } ${isExpanded ? 'cursor-pointer' : ''}`}
                    style={product.image.startsWith('/') ? { overflow: 'visible' } : undefined}
                    onClick={(e) => {
                      if (isExpanded && !isSoldOut) {
                        e.stopPropagation();
                        resetExpandedCard(product.id);
                        setExpandedCard(null);
                      }
                    }}
                  >
                    {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <div className="border-4 border-red-500 rounded-sm px-3 py-1 select-none" style={{ transform: 'rotate(-20deg)', boxShadow: '0 0 12px rgba(239,68,68,0.7)' }}>
                          <span className="text-red-500 font-black text-xl md:text-2xl tracking-widest uppercase" style={{ textShadow: '0 0 8px rgba(239,68,68,0.8)' }}>AGOTADO</span>
                        </div>
                      </div>
                    )}

                    {product.image.startsWith('/') ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="absolute object-cover drop-shadow-2xl md:w-[140%] md:h-[150%]"
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
                  </div>
                  <div className="p-3 md:p-3.5">
                    <h4 className="text-xs md:text-base font-bold text-white mb-1.5 md:mb-1.5 truncate">
                      {product.name}
                    </h4>
                    <p
                      className="text-orange-200/70 text-[10px] md:text-xs mb-1.5 md:mb-2 md:line-clamp-3 md:h-12"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                    <div className="flex items-center justify-between mb-1.5 md:mb-2.5">
                      {activePromo ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                          <span className="text-sm md:text-lg font-black text-green-400 promo-price-pulse">S/ {activePromo.promoPrice.toFixed(2)}</span>
                        </div>
                      ) : discountPrice ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                          <span className="text-sm md:text-lg font-black text-amber-400 promo-price-pulse">S/ {discountPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm md:text-lg font-black text-amber-400 gold-glow">S/ {effectivePrice.toFixed(2)}</span>
                      )}
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSoldOut) handleDecreaseQuantity(product.id);
                          }}
                          disabled={isSoldOut}
                          className={`w-5 h-5 md:w-7 md:h-7 text-white rounded text-xs md:text-sm font-bold transition-all flex items-center justify-center ${isSoldOut ? 'bg-gray-700 cursor-not-allowed opacity-40' : 'bg-red-600 hover:bg-red-500'}`}
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-6 md:w-9 text-center text-xs md:text-base">
                          {orderQuantity[product.id] || 0}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSoldOut) handleIncreaseQuantity(product.id);
                          }}
                          disabled={isSoldOut}
                          className={`w-5 h-5 md:w-7 md:h-7 text-white rounded text-xs md:text-sm font-bold transition-all flex items-center justify-center ${isSoldOut ? 'bg-gray-700 cursor-not-allowed opacity-40' : 'bg-red-600 hover:bg-red-500'}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
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
                    <div className="px-2.5 md:px-5 pb-2.5 md:pb-5 border-t-2 border-red-500/30 pt-2.5 md:pt-4">
                      {/* Selector de Salsas - Acordeón */}
                      <div className="mb-2 md:mb-4">
                        <button
                          data-salsas-button
                          onClick={() => setShowSalsas((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                          className={`w-full flex items-center justify-between rounded-md md:rounded-lg p-1.5 md:p-3 transition-all shadow-sm border
                            ${canAdd
                              ? 'bg-green-600/20 hover:bg-green-600/30 border-green-500/40 shadow-green-500/20'
                              : 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/40 shadow-amber-500/20'
                            }
                          `}
                          style={{
                            boxShadow: showSalsas[product.id]
                              ? canAdd
                                ? '0 0 10px rgba(34, 197, 94, 0.3), 0 0 20px rgba(34, 197, 94, 0.15)'
                                : '0 0 10px rgba(251, 191, 36, 0.3), 0 0 20px rgba(251, 191, 36, 0.15)'
                              : undefined
                          }}
                        >
                          <div className="flex items-center gap-1.5 md:gap-2.5">
                            <span className="text-xs md:text-base">{canAdd ? '✓' : '🌶️'}</span>
                            <span className={`text-[10px] md:text-sm font-bold ${canAdd ? 'text-green-400' : 'text-white'}`}>
                              {canAdd
                                ? `Salsas seleccionadas (${requiredSalsas})`
                                : requiredSalsas === 1 ? 'Elige una salsa' : requiredSalsas === 2 ? 'Elige dos salsas' : 'Elige tres salsas'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3">
                            <span className={`text-[10px] md:text-xs font-bold ${canAdd ? 'text-green-400' : 'text-amber-400'}`}>
                              {currentSalsas.length}/{requiredSalsas}
                            </span>
                            <span className={`text-xs md:text-sm ${canAdd ? 'text-green-400' : 'text-amber-400'}`}>
                              {showSalsas[product.id] ? '▼' : '▶'}
                            </span>
                          </div>
                        </button>

                        <div
                          data-salsas-section
                          className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            showSalsas[product.id]
                              ? 'max-h-[800px] opacity-100 mt-2 md:mt-3'
                              : 'max-h-0 opacity-0 mt-0'
                          }`}
                        >
                          <div className="space-y-1 md:space-y-2">
                            {effectiveSalsas.map((salsa) => {
                              const count = getSalsaCount(product.id, salsa.id);
                              const isSelected = count > 0;
                              const canSelect = currentSalsas.length < requiredSalsas || isSelected;
                              const wasRecentlyAdded = recentlyAddedSalsas.has(`${product.id}-${salsa.id}`);
                              // Ocultar botón + cuando el count de esta salsa alcanza el máximo permitido
                              const maxSalsaCount = requiredSalsas; // Máximo que se puede agregar de una misma salsa
                              const canAddMore = count < maxSalsaCount && canSelect && !salsa.soldOut;
                              const showAddButton = canAddMore;
                              // Promo dinámica o hardcodeada para esta salsa
                              const salsaPromoConfig = allPromosForProduct.find((p: any) => p.salsas.includes(salsa.id));
                              const isSalsaInPromo = !!salsaPromoConfig;
                              const isSalsaPromoActive = isSalsaInPromo
                                ? currentSalsas.length > 0 && currentSalsas.every((sId: string) => salsaPromoConfig!.salsas.includes(sId))
                                : false;

                              return (
                                <div
                                  key={salsa.id}
                                  className={`rounded p-1.5 md:p-2 border transition-all ${
                                    salsa.soldOut
                                      ? 'bg-gray-800/50 border-gray-600/30 opacity-60'
                                      : isSalsaPromoActive
                                        ? 'bg-green-900/20 border-green-400 promo-salsa-active'
                                        : isSalsaInPromo
                                          ? 'bg-gray-800/30 border-green-500/30 promo-salsa-hint'
                                          : 'bg-gray-800/30 border-amber-500/10'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex-1">
                                      <div className={`text-[10px] md:text-xs ${count > 0 ? 'text-amber-400 font-bold' : salsa.soldOut ? 'text-gray-500' : 'text-white'}`}>
                                        {salsa.name}
                                        {salsa.soldOut && <span className="ml-1.5 text-[8px] bg-gray-600 text-gray-300 px-1 py-0.5 rounded font-bold align-middle">AGOTADO</span>}
                                      </div>
                                      <p className={`text-[9px] md:text-[10px] italic mt-0.5 ${salsa.soldOut ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {salsa.description}
                                      </p>
                                      {!salsa.soldOut && isSalsaInPromo && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                          {isSalsaPromoActive ? (
                                            <span className="text-[9px] text-green-400 font-bold">✓ PROMO ACTIVA — S/ {Number(salsaPromoConfig!.promoPrice).toFixed(2)}</span>
                                          ) : (
                                            <>
                                              <span className="text-[9px] text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                                              <span className="text-[9px] text-amber-400 font-bold">
                                                → S/ {Number(salsaPromoConfig!.promoPrice).toFixed(2)} eligiendo salsas del set promo
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 md:gap-1.5 ml-2">
                                      {count > 0 && (
                                        <span className="text-[10px] md:text-xs bg-amber-600 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold">
                                          x{count}
                                        </span>
                                      )}
                                      {count > 0 && (
                                        <button
                                          onClick={() => handleSalsaToggle(product.id, salsa.id, 'remove')}
                                          className="px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all bg-red-600 hover:bg-red-500 text-white"
                                        >
                                          −
                                        </button>
                                      )}
                                      {showAddButton && (
                                        <button
                                          onClick={() => handleSalsaToggle(product.id, salsa.id, 'add')}
                                          className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all ${
                                            wasRecentlyAdded
                                              ? 'bg-green-600 hover:bg-green-500 scale-110'
                                              : 'bg-amber-600 hover:bg-amber-500'
                                          } text-white`}
                                        >
                                          {wasRecentlyAdded ? '✓' : '+'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Complementos */}
                      <div className="mb-3 md:mb-4">
                        <h5 className="text-xs md:text-sm font-bold text-white mb-2 md:mb-3">Complementos</h5>

                        {/* Bebidas */}
                        <div className="mb-2 md:mb-3">
                          <button
                            onClick={() => setShowBebidas((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                            className="w-full flex items-center justify-between bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg p-2 md:p-3 transition-all"
                          >
                            <div className="flex items-center gap-2 md:gap-2.5">
                              <span className="text-sm md:text-base">🥤</span>
                              <span className="text-white text-xs md:text-sm font-bold">Bebidas</span>
                            </div>
                            <span className="text-red-400 text-xs md:text-sm">{showBebidas[product.id] ? '▼' : '▶'}</span>
                          </button>

                          {showBebidas[product.id] && (
                            <div className="mt-2 md:mt-3 space-y-1 md:space-y-2">
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
                                    className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 md:p-2 border border-red-500/10"
                                  >
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                      <span className="text-sm md:text-base">{bebida.emoji}</span>
                                      <span className="text-white text-[10px] md:text-xs">{bebida.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 md:gap-1.5">
                                      <span className="text-amber-400 text-[10px] md:text-xs font-bold">S/ {bebida.price.toFixed(2)}</span>
                                      {count > 0 && (
                                        <>
                                          <button
                                            onClick={() => handleRemoveComplement(product.id, bebida.id)}
                                            className="px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all bg-red-600 hover:bg-red-500 text-white"
                                          >
                                            −
                                          </button>
                                          <span className="text-[10px] md:text-xs bg-amber-600 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold">
                                            {count}
                                          </span>
                                        </>
                                      )}
                                      <button
                                        onClick={() => handleAddComplement(product.id, bebidaProduct)}
                                        className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all ${
                                          wasRecentlyAdded
                                            ? 'bg-green-600 hover:bg-green-500 scale-110'
                                            : 'bg-red-600 hover:bg-red-500'
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

                        {/* Extras */}
                        <div>
                          <button
                            onClick={() => setShowExtras((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                            className="w-full flex items-center justify-between bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg p-2 md:p-3 transition-all"
                          >
                            <div className="flex items-center gap-2 md:gap-2.5">
                              <span className="text-sm md:text-base">🍟</span>
                              <span className="text-white text-xs md:text-sm font-bold">Extras</span>
                            </div>
                            <span className="text-red-400 text-xs md:text-sm">{showExtras[product.id] ? '▼' : '▶'}</span>
                          </button>

                          {showExtras[product.id] && (
                            <div className="mt-2 md:mt-3 space-y-1 md:space-y-2">
                              {/* Extra papas */}
                              {(() => {
                                const extra = { id: "extra-papas", name: "Extra papas", emoji: "🍟", price: 5.00 };
                                const extraProduct: Product = {
                                  id: extra.id,
                                  name: extra.name,
                                  description: extra.name,
                                  price: extra.price,
                                  image: extra.emoji,
                                  category: "bebida"
                                };
                                const wasRecentlyAdded = recentlyAdded.has(`${product.id}-${extra.id}`);
                                const count = getComplementCount(product.id, extra.id);
                                return (
                                  <div
                                    key={extra.id}
                                    className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 md:p-2 border border-red-500/10"
                                  >
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                      <span className="text-sm md:text-base">{extra.emoji}</span>
                                      <span className="text-white text-[10px] md:text-xs">{extra.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 md:gap-1.5">
                                      <span className="text-amber-400 text-[10px] md:text-xs font-bold">S/ {extra.price.toFixed(2)}</span>
                                      {count > 0 && (
                                        <>
                                          <button
                                            onClick={() => handleRemoveComplement(product.id, extra.id)}
                                            className="px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all bg-red-600 hover:bg-red-500 text-white"
                                          >
                                            −
                                          </button>
                                          <span className="text-[10px] md:text-xs bg-amber-600 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold">
                                            {count}
                                          </span>
                                        </>
                                      )}
                                      <button
                                        onClick={() => handleAddComplement(product.id, extraProduct)}
                                        className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all ${
                                          wasRecentlyAdded
                                            ? 'bg-green-600 hover:bg-green-500 scale-110'
                                            : 'bg-red-600 hover:bg-red-500'
                                        } text-white`}
                                      >
                                        {wasRecentlyAdded ? '✓' : '+'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Extra salsas - mostrar solo las salsas que el cliente ya seleccionó */}
                              {(() => {
                                // Obtener las salsas seleccionadas para este producto
                                const currentSelectedSalsas = selectedSalsas[product.id] || [];
                                // Obtener IDs únicos de salsas
                                const uniqueSalsaIds = Array.from(new Set(currentSelectedSalsas));

                                // Mapear cada salsa única a un item de extra salsa
                                return uniqueSalsaIds.map((salsaId) => {
                                  // Buscar el nombre de la salsa
                                  const salsaData = salsas.find(s => s.id === salsaId);
                                  if (!salsaData) return null;

                                  const extraSalsa = {
                                    id: `extra-salsa-${salsaId}`,
                                    name: `Extra salsa - ${salsaData.name}`,
                                    emoji: "🥫",
                                    price: 3.00
                                  };
                                  const extraProduct: Product = {
                                    id: extraSalsa.id,
                                    name: extraSalsa.name,
                                    description: extraSalsa.name,
                                    price: extraSalsa.price,
                                    image: extraSalsa.emoji,
                                    category: "bebida"
                                  };
                                  const wasRecentlyAdded = recentlyAdded.has(`${product.id}-${extraSalsa.id}`);
                                  const count = getComplementCount(product.id, extraSalsa.id);

                                  return (
                                    <div
                                      key={extraSalsa.id}
                                      className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 md:p-2 border border-red-500/10"
                                    >
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="text-sm md:text-base">{extraSalsa.emoji}</span>
                                        <span className="text-white text-[10px] md:text-xs">{extraSalsa.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1 md:gap-1.5">
                                        <span className="text-amber-400 text-[10px] md:text-xs font-bold">S/ {extraSalsa.price.toFixed(2)}</span>
                                        {count > 0 && (
                                          <>
                                            <button
                                              onClick={() => handleRemoveComplement(product.id, extraSalsa.id)}
                                              className="px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all bg-red-600 hover:bg-red-500 text-white"
                                            >
                                              −
                                            </button>
                                            <span className="text-[10px] md:text-xs bg-amber-600 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold">
                                              {count}
                                            </span>
                                          </>
                                        )}
                                        <button
                                          onClick={() => handleAddComplement(product.id, extraProduct)}
                                          className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold transition-all ${
                                            wasRecentlyAdded
                                              ? 'bg-green-600 hover:bg-green-500 scale-110'
                                              : 'bg-red-600 hover:bg-red-500'
                                          } text-white`}
                                        >
                                          {wasRecentlyAdded ? '✓' : '+'}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón Listo */}
                      <button
                        onClick={() => {
                          handleCompleteOrder(product);
                          setIsEditingOrder(false);
                        }}
                        disabled={!canAdd || isSoldOut || (orderQuantity[product.id] || 0) === 0}
                        className={`w-full py-2.5 md:py-3.5 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-all
                          ${isSoldOut
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'
                            : (orderQuantity[product.id] || 0) === 0
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'
                              : canAdd
                                ? 'bg-red-500 hover:bg-red-400 text-white neon-border-fat cursor-pointer active:scale-95'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'
                          }
                        `}
                      >
                        {isSoldOut ? 'No disponible' : (orderQuantity[product.id] || 0) === 0 ? 'Agrega al menos 1 unidad' : canAdd ? (isEditingOrder ? 'Confirmar orden' : 'Agregar orden') : `Selecciona ${requiredSalsas} salsa${requiredSalsas > 1 ? 's' : ''}`}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* Sección de órdenes agregadas */}
        {completedOrders.length > 0 && (
          <div id="tu-orden-section" className="container mx-auto px-3 md:px-5 -mt-2 md:mt-0 lg:mt-2">
            <h3 className="text-base md:text-xl lg:text-2xl font-black text-amber-400 mb-2 md:mb-4 gold-glow">
              Tu orden
            </h3>
            <div className="space-y-2 md:space-y-4">
              {completedOrders.map((order, index) => {
                // Buscar producto en fat products
                let product = products.find((p) => p.id === order.productId);
                let isFitOrder = false;
                let isTacoOrder = false;

                // Si no se encuentra, buscar en fit products
                if (!product) {
                  product = fitProducts.find((p) => p.id === order.productId);
                  isFitOrder = true;
                }
                // Si no se encuentra, buscar en taco products
                if (!product) {
                  product = tacoProducts.find((p) => p.id === order.productId);
                  isFitOrder = false;
                  isTacoOrder = true;
                }

                if (!product) return null;

                return (
                  <div
                    key={`${order.productId}-${index}`}
                    className={`bg-gray-900 rounded-lg border-2 ${isTacoOrder ? 'border-emerald-400/30' : isFitOrder ? 'border-cyan-400/30' : 'border-red-400/30'} p-2 md:p-4 relative`}
                  >
                    <div className="flex items-start justify-between mb-1 md:mb-2">
                      <div className="flex items-start gap-2 md:gap-3 flex-1">
                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-red-400/30 flex items-center justify-center">
                          {product.image.startsWith('/') ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl md:text-3xl">🍗</span>';
                              }}
                            />
                          ) : (
                            <span className="text-2xl md:text-3xl">{product.image}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm md:text-base font-bold text-white mb-1 md:mb-1.5">
                            {order.quantity > 1 ? `${order.quantity}x ` : ''}{product.name}
                          </h4>

                          <div className="text-[11px] md:text-xs space-y-0.5 md:space-y-1">
                            {/* Precio del menú */}
                            <div className={`${isTacoOrder ? 'text-emerald-300/80' : isFitOrder ? 'text-cyan-300/80' : 'text-red-300/80'} flex justify-between items-center`}>
                              <span>• {product.name} x{order.quantity}</span>
                              {order.discountApplied && !hasComboDiscount ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="text-gray-500 line-through text-[10px]">S/ {((order.originalPrice ?? (menuPrices[product.id] || product.price)) * order.quantity).toFixed(2)}</span>
                                  <span className="text-amber-400 font-bold">S/ {((order.finalPrice ?? (menuPrices[product.id] || product.price)) * order.quantity).toFixed(2)}</span>
                                </span>
                              ) : (
                                <span className="text-amber-400/80">S/ {(((hasComboDiscount && order.discountApplied) ? (order.originalPrice ?? (menuPrices[product.id] || product.price)) : (order.finalPrice ?? (menuPrices[product.id] || product.price))) * order.quantity).toFixed(2)}</span>
                              )}
                            </div>

                            {/* Sabores tacos */}
                            {isTacoOrder && order.productId === 'taco-duo' && order.salsas && order.salsas.length > 0 && (
                              <div className="text-emerald-300/80">
                                🌮 Sabores: {order.salsas.map((id) => tacoFlavorNames[id] ?? id).join(" + ")}
                              </div>
                            )}
                            {/* Salsas seleccionadas - para ordenes de fat */}
                            {!isFitOrder && !isTacoOrder && order.salsas && order.salsas.length > 0 && (
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
                                    <div key={`${compId}-${idx}`} className={`${isTacoOrder ? 'text-emerald-300/80' : isFitOrder ? 'text-cyan-300/80' : 'text-red-300/80'} flex justify-between`}>
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
                      <div className="flex flex-col items-center gap-2 md:gap-2.5 ml-2">
                        <button
                          onClick={() => handleEditOrder(index)}
                          className="text-[10px] md:text-xs text-red-400 hover:text-red-300 font-bold px-2 md:px-3 py-1 md:py-1.5 border border-red-400/30 rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(index)}
                          className="text-red-500 hover:text-red-400 text-xl md:text-2xl font-bold transition-all opacity-70 hover:opacity-100"
                          title="Eliminar orden"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="text-amber-400 font-bold text-sm md:text-base gold-glow">
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

        {/* Texto motivacional */}
        {completedOrders.length > 0 && (
          <div className="container mx-auto px-3 md:px-5 mt-4 md:mt-5 mb-2">
            <p className="text-center text-xs md:text-sm text-orange-200/70 italic">
              💡 Puedes agregar más órdenes a tu pedido antes de continuar
            </p>
          </div>
        )}

        {/* Espaciador para que la barra fija no tape el contenido */}
        {completedOrders.length > 0 && (
          <div className="h-24 md:h-32"></div>
        )}
      </section>

      {/* Cart Summary Bar */}
      {completedOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-red-500/50 shadow-2xl shadow-red-500/30 z-50">
          <div className="container mx-auto px-4 md:px-8 py-3 md:py-5 lg:py-6">
            <div className="flex justify-between items-center gap-3 md:gap-5">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-white font-bold text-sm md:text-xl">Total</span>
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
                    <span className="text-amber-400 font-black text-xl md:text-4xl gold-glow">
                      S/ {comboTotal.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-amber-400 font-black text-xl md:text-4xl gold-glow">
                    S/ {completedTotal.toFixed(2)}
                  </span>
                )}
              </div>
              {isOpen ? (
                <button
                  onClick={navigateToCheckout}
                  className="bg-red-500 hover:bg-red-400 active:scale-95 text-white px-5 md:px-9 py-2.5 md:py-4 rounded-lg md:rounded-xl font-black text-sm md:text-xl transition-all neon-border-fat"
                >
                  Continuar<span className="hidden sm:inline"> Pedido</span> →
                </button>
              ) : (
                <div className="flex flex-col items-end gap-0.5">
                  <div className="bg-gray-700 text-gray-400 px-4 md:px-7 py-2 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-base cursor-not-allowed border-2 border-gray-600 text-center">
                    🔒 Cerrado
                  </div>
                  <span className="text-gray-500 text-[10px] md:text-xs text-right">{getNextOpenMessage()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-xl border-2 border-red-500 neon-border-fat max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-3 border-b-2 border-red-500/30 flex justify-between items-center">
              <h3 className="text-lg font-black text-red-400 neon-glow-fat">
                Tu Pedido
              </h3>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-red-400 hover:text-red-300 text-2xl font-bold transition-all"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2 border border-red-500/20"
                  >
                    <div className="text-2xl">{item.product.image}</div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-xs">
                        {item.product.name}
                      </h4>
                      <p className="text-red-400 text-xs">
                        S/ {item.product.price.toFixed(2)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-white font-bold w-7 text-center text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-amber-400 font-bold text-sm gold-glow min-w-[60px] text-right">
                      S/ {(item.product.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-2xl hover:scale-110 transition-all flex items-center justify-center flex-shrink-0"
                      title="Eliminar"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t-2 border-red-500/30 bg-gray-800/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold text-sm">Total:</span>
                <span className="text-amber-400 font-black text-xl gold-glow">
                  S/ {totalPrice.toFixed(2)}
                </span>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-lg font-black text-base transition-all neon-border-fat block text-center"
              >
                Continuar Pedido →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deleteOrderIndex !== null && (() => {
        const order = completedOrders[deleteOrderIndex];
        // Buscar producto para determinar el tipo de orden
        let product = products.find((p) => p.id === order.productId);
        let isFitOrder = false;
        let isTacoOrder = false;
        if (!product) {
          product = fitProducts.find((p) => p.id === order.productId);
          isFitOrder = true;
        }
        if (!product) {
          product = tacoProducts.find((p) => p.id === order.productId);
          isFitOrder = false;
          isTacoOrder = true;
        }

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className={`bg-gray-900 border-2 ${isTacoOrder ? 'border-emerald-500 neon-border-taco' : isFitOrder ? 'border-cyan-500 neon-border-fit' : 'border-red-500 neon-border-fat'} rounded-lg p-6 max-w-md w-full`}>
              <h3 className={`text-xl font-black ${isTacoOrder ? 'text-emerald-400 neon-glow-taco' : isFitOrder ? 'text-cyan-400 neon-glow-fit' : 'text-red-400 gold-glow'} mb-4 text-center`}>
                ¡Qué dilema!
              </h3>
              {(() => {
                if (!product) return null;

              const productPrice = order.finalPrice ?? (menuPrices[product.id] || product.price);
              const productTotal = productPrice * order.quantity;
              const complementsTotal = order.complementIds.reduce((sum, compId) => {
                return sum + (availableComplements[compId]?.price || 0);
              }, 0);
              const orderTotal = (productTotal + complementsTotal).toFixed(2);

              return (
                <div className="mb-6 text-sm">
                  <p className="text-white mb-3 text-center">
                    ¿Está seguro que desea quitar su orden de su pedido?
                  </p>
                  <div className={`bg-gray-800/50 border ${isFitOrder ? 'border-cyan-400/30' : 'border-red-400/30'} rounded-lg p-4`}>
                    {/* Header con imagen y título */}
                    <div className={`flex items-start gap-3 mb-3 pb-3 border-b ${isFitOrder ? 'border-cyan-400/20' : 'border-red-400/20'}`}>
                      {/* Imagen del producto */}
                      <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black border ${isFitOrder ? 'border-cyan-400/30' : 'border-red-400/30'} flex items-center justify-center`}>
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
                        <p className={`${isFitOrder ? 'text-cyan-400' : 'text-amber-400'} font-bold text-base mb-1`}>
                          {order.quantity > 1 ? `${order.quantity}x ` : ''}{product.name}
                        </p>
                        <p className="text-amber-400 font-bold gold-glow text-lg">
                          S/ {orderTotal}
                        </p>
                      </div>
                    </div>

                    {/* Desglose de precios */}
                    <div className="space-y-1">
                      <div className={`flex justify-between items-center ${isFitOrder ? 'text-cyan-300/80' : 'text-red-300/80'} text-xs`}>
                        <span>• {product.name} x{order.quantity}</span>
                        <span className="text-amber-400/80">S/ {((order.finalPrice ?? (menuPrices[product.id] || product.price)) * order.quantity).toFixed(2)}</span>
                      </div>

                      {/* Salsas (solo para órdenes fat) */}
                      {!isFitOrder && order.salsas && order.salsas.length > 0 && (
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
                              <div key={`${compId}-${idx}`} className={`flex justify-between ${isFitOrder ? 'text-cyan-300/80' : 'text-red-300/80'} text-xs`}>
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
                  className={`flex-1 ${isFitOrder ? 'bg-cyan-500 hover:bg-cyan-400 neon-border-fit' : 'bg-red-500 hover:bg-red-400 neon-border-fat'} text-white px-4 py-3 rounded-lg font-bold transition-all`}
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
