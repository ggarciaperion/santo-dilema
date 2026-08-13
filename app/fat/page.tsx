"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import WhatsAppButton from "../components/WhatsAppButton";
import BannerCarousel from "../components/BannerCarousel";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import PageMotionWrapper from "../components/PageMotionWrapper";

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
  category?: string;
}

const products: Product[] = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    description: "8 alitas crujientes con papas francesas y tu salsa elegida. El primer bocado es una trampa, no vas a querer quedarte en solo 8.",
    price: 22.00,
    image: "/cv.jpeg",
    category: "fat",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    description: "14 alitas con papas francesas y 2 salsas para hacer lo que se te antoje. Spoiler: el arrepentimiento llega después, no durante.",
    price: 34.00,
    image: "/vv.jpeg",
    category: "fat",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    description: "20 alitas, papas francesas y 3 salsas para combinar sin culpa. Para los que no entienden el concepto de 'suficiente'.",
    price: 47.00,
    image: "/ss.jpeg",
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
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successProductName, setSuccessProductName] = useState('');
  const [isClosingModal, setIsClosingModal] = useState(false);
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

  const completedTotal = completedOrders.reduce((total, order) => {
    const basePrice = order.finalPrice ?? order.originalPrice ?? (() => {
      let product = products.find(p => p.id === order.productId);
      if (!product) product = fitProducts.find(p => p.id === order.productId);
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
    fetch("/api/menu-discounts", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setMenuDiscounts(data))
      .catch(() => {});
    fetch("/api/menu-prices", { cache: "no-store" })
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


  const getRequiredSalsasCount = (productId: string): number => {
    const quantity = orderQuantity[productId] || 0;
    if (quantity === 0) return 0;
    let baseSalsas = 1;
    if (productId === "pequeno-dilema") baseSalsas = 1;
    if (productId === "duo-dilema") baseSalsas = 2;
    if (productId === "santo-pecado") baseSalsas = 3;
    return baseSalsas * quantity;
  };


  const handleCardClick = (productId: string) => {
    if (isDragging) return;
    setExpandedCard(productId);
    setIsEditingOrder(false);
    if (!orderQuantity[productId]) {
      setOrderQuantity(prev => ({ ...prev, [productId]: 1 }));
    }
    if (!selectedSalsas[productId]) {
      setSelectedSalsas(prev => ({ ...prev, [productId]: [] }));
    }
    setShowSalsas(prev => ({ ...prev, [productId]: true }));
  };

  const handleIncreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 1;
    setOrderQuantity(prev => ({ ...prev, [productId]: currentQty + 1 }));
    setShowSalsas(prev => ({ ...prev, [productId]: true }));
  };

  const handleDecreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 1;
    if (currentQty > 1) {
      setOrderQuantity(prev => ({ ...prev, [productId]: currentQty - 1 }));
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
    const _name = product.name;
    setIsClosingModal(true);
    setTimeout(() => {
      setExpandedCard(null);
      setIsClosingModal(false);
      setSuccessProductName(_name);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3200);
    }, 380);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 700);
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

    // Abrir el modal
    setExpandedCard(order.productId);
    setShowSalsas((prev) => ({ ...prev, [order.productId]: true }));
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
    <PageMotionWrapper color="red" className="min-h-screen bg-black md:bg-transparent relative overflow-visible">

      {/* ── KEYFRAMES ── */}
      <style>{`@keyframes fatGridPulse { 0%, 100% { opacity: 0.04; } 50% { opacity: 0.10; } }`}</style>

      {/* ── FONDO base ── */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 120% 55% at 50% 0%, rgba(180,20,20,0.50) 0%, rgba(0,0,0,0) 60%), radial-gradient(ellipse 70% 50% at 15% 60%, rgba(220,60,0,0.16) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 85% 80%, rgba(239,68,68,0.12) 0%, transparent 50%)" }}
      />
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(239,68,68,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.10) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          animation: "fatGridPulse 4s ease-in-out infinite",
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-[12%] w-1 h-80 rotate-12 origin-top" style={{ background: "linear-gradient(to bottom, rgba(239,68,68,0.65), transparent)" }} />
        <div className="absolute top-0 left-[28%] w-0.5 h-64 -rotate-6 origin-top" style={{ background: "linear-gradient(to bottom, rgba(251,146,60,0.50), transparent)" }} />
        <div className="absolute top-0 left-[52%] w-1 h-72 rotate-8 origin-top" style={{ background: "linear-gradient(to bottom, rgba(239,68,68,0.45), transparent)" }} />
        <div className="absolute top-0 right-[18%] w-1 h-96 -rotate-12 origin-top" style={{ background: "linear-gradient(to bottom, rgba(251,113,133,0.55), transparent)" }} />
        <div className="absolute top-0 right-[36%] w-0.5 h-56 rotate-4 origin-top" style={{ background: "linear-gradient(to bottom, rgba(220,38,38,0.40), transparent)" }} />
        <div className="absolute top-16 left-[22%] w-2 h-2 rounded-full" style={{ background: "rgba(239,68,68,0.8)", boxShadow: "0 0 8px rgba(239,68,68,0.6)" }} />
        <div className="absolute top-28 right-[30%] w-1.5 h-1.5 rounded-full" style={{ background: "rgba(251,146,60,0.9)", boxShadow: "0 0 6px rgba(251,146,60,0.7)" }} />
        <div className="absolute top-10 left-[60%] w-2 h-2 rounded-full" style={{ background: "rgba(251,113,133,0.75)", boxShadow: "0 0 8px rgba(251,113,133,0.5)" }} />
        <div className="absolute top-36 right-[18%] w-1.5 h-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.65)" }} />
        <div className="absolute top-20 left-[78%] w-2.5 h-2.5 rounded-full" style={{ background: "rgba(220,38,38,0.60)", boxShadow: "0 0 10px rgba(220,38,38,0.5)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-64" style={{ background: "linear-gradient(to top, rgba(100,10,10,0.28), transparent)" }} />
      </div>

      {/* Toast de orden agregada */}
      {showSuccessToast && (
        <div className="fixed bottom-24 left-1/2 z-[400] pointer-events-none" style={{ animation: 'toastLifecycle 3.2s cubic-bezier(0.22,1,0.36,1) forwards' }}>
          <div className="bg-gray-900 border-2 border-red-400/80 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl shadow-red-500/40">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="text-white font-black text-sm whitespace-nowrap">¡Orden agregada!</p>
              <p className="text-red-300 text-xs whitespace-nowrap font-medium">{successProductName}</p>
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
              className="h-8 md:h-9 w-auto"
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
              Ensaladas
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
              Tacos
            </Link>
            <Link
              href="/combos"
              className="text-xs md:text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors gold-glow px-2 md:px-3 py-1 md:py-1.5 rounded border border-amber-500/30 hover:border-amber-400 hidden sm:block"
            >
              Ver Combos →
            </Link>
            <Link
              href="/combos"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors gold-glow px-2 py-1 rounded border border-amber-500/30 hover:border-amber-400 sm:hidden"
            >
              Combos
            </Link>
          </div>
        </div>
      </header>
      {/* Spacer for fixed header on mobile */}
      <div className="h-14 md:hidden" />

      {/* ── Business closed banner ── */}
      {!isOpen && (
        <div className="bg-gray-900 border-b-2 border-red-500/30 px-4 py-3 text-center">
          <p className="text-red-400 text-sm font-bold">⏰ Estamos cerrados por ahora</p>
          <p className="text-gray-400 text-xs mt-0.5">{getNextOpenMessage()}</p>
        </div>
      )}


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
            className={`cards-stagger flex flex-col md:flex-row md:flex-wrap md:justify-center items-center gap-5 md:gap-6 lg:gap-8 scrollbar-hide px-3 md:px-4 pt-6 pb-8 md:py-8 lg:py-10 select-none md:cursor-default md:overflow-visible`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none', overflow: 'visible' }}
          >
            {products.map((product, index) => {
              const isSoldOut = !!menuStock[product.id];
              const discountPrice = menuDiscounts[product.id];
              const effectivePrice = menuPrices[product.id] || product.price;
              const activePromo = findMatchingPromo(product.id, selectedSalsas[product.id] || []);

              return (
                <div
                  key={product.id}
                  ref={(el) => { cardRefs.current[product.id] = el; }}
                  onClick={() => { if (!isSoldOut && !isDragging) handleCardClick(product.id); }}
                  onMouseEnter={() => { if (!isSoldOut) setHoveredCard(product.id); }}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`bg-gray-900 flex-shrink-0 md:flex-shrink w-full md:w-[280px] lg:w-[300px] relative
                    ${discountPrice ? 'border-4 border-amber-400 super-promo-glow shadow-xl shadow-amber-500/40' : 'neon-border-fat shadow-xl shadow-red-500/30 border-2 border-red-400/40'}
                    ${isSoldOut ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                    ${hoveredCard === product.id ? 'md:scale-105 md:-translate-y-2 md:shadow-2xl md:shadow-red-500/50' : ''}
                  `}
                  style={{
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    borderRadius: isMobile ? 16 : 8,
                    overflow: 'hidden',
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-video md:aspect-auto md:h-52 bg-black overflow-hidden">
                    {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                        <div className="border-4 border-red-500 rounded px-3 py-1 select-none" style={{ transform: 'rotate(-15deg)' }}>
                          <span className="text-red-500 font-black text-xl tracking-widest uppercase">AGOTADO</span>
                        </div>
                      </div>
                    )}
                    {product.image.startsWith('/') ? (
                      <>
                        {/* Fondo difuminado para rellenar espacios laterales */}
                        {product.id === "pequeno-dilema" && (
                          <Image
                            src={product.image}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover object-center"
                            style={{ filter: "blur(30px)", transform: "scale(1.3)" }}
                            aria-hidden
                          />
                        )}
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className={`${product.id === "pequeno-dilema" ? "object-contain object-center" : `object-cover ${product.id === "santo-pecado" ? "object-top" : "object-center"}`}`}
                          style={product.id === "pequeno-dilema" ? { transform: "scale(1.3)" } : product.id === "duo-dilema" ? { transform: "scale(1.18) translateX(-8%)" } : undefined}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-orange-900/40">
                        <span className="text-5xl">{product.image}</span>
                      </div>
                    )}
                    {/* Papas fritas decorativas */}
                    {!["pequeno-dilema", "santo-pecado", "duo-dilema"].includes(product.id) && (
                      <Image
                        src="/papas-fritas.png"
                        alt="Papas fritas"
                        width={145}
                        height={105}
                        className="absolute bottom-0 left-0 object-contain pointer-events-none z-10"
                      />
                    )}
                    {discountPrice && (
                      <div className="absolute top-2 left-2 bg-amber-400 text-black text-xs font-black px-2 py-0.5 rounded-full">OFERTA</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3 md:p-3.5">
                    <h4 className="text-sm md:text-base font-bold text-white mb-1 truncate">{product.name}</h4>
                    <p className="text-orange-200/60 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: product.description }} />
                    <div className="flex items-center justify-between">
                      {activePromo ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                          <span className="text-lg font-black text-green-400">S/ {activePromo.promoPrice.toFixed(2)}</span>
                        </div>
                      ) : discountPrice ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 line-through">S/ {effectivePrice.toFixed(2)}</span>
                          <span className="text-lg font-black text-amber-400">S/ {discountPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-black text-amber-400 gold-glow">S/ {effectivePrice.toFixed(2)}</span>
                      )}
                      {!isSoldOut && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCardClick(product.id); }}
                          className="w-10 h-10 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-red-500/40"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Order badge */}
                  {completedOrders.some(o => o.productId === product.id) && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20 shadow">
                      ✓ En orden
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* ═══ MODAL DE DETALLE DE PRODUCTO ═══ */}
        {expandedCard && (() => {
          const mp = products.find(p => p.id === expandedCard);
          if (!mp) return null;
          const mQty       = orderQuantity[mp.id] || 1;
          const mSalsas    = selectedSalsas[mp.id] || [];
          const mRequired  = getRequiredSalsasCount(mp.id);
          const mCanAdd    = canAddProduct(mp.id);
          const mSoldOut   = !!menuStock[mp.id];
          const mDiscount  = menuDiscounts[mp.id];
          const mEffPrice  = menuPrices[mp.id] || mp.price;
          const mPromo     = findMatchingPromo(mp.id, mSalsas);
          const mDynPromos = salsaPromos.filter((p: any) => p.active && p.productId === mp.id);

          return (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end md:items-center md:justify-center" style={{ animation: isClosingModal ? 'fadeOutOverlay 0.38s ease-in forwards' : 'fadeInOverlay 0.25s ease-out' }}>
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setExpandedCard(null)} />

              {/* Panel */}
              <div
                className="relative bg-gray-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl flex flex-col shadow-2xl"
                style={{ maxHeight: '92vh', animation: isClosingModal ? 'slideDownPanel 0.38s cubic-bezier(0.4,0,1,1) forwards' : 'slideUp 0.42s cubic-bezier(0.22,1,0.36,1)' }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
                  <div className="w-10 h-1 bg-gray-600 rounded-full" />
                </div>
                {/* Close button */}
                <button onClick={() => setExpandedCard(null)} className="absolute top-4 right-4 z-20 w-8 h-8 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold transition-all">✕</button>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                  {/* Product image */}
                  <div className="relative h-64 bg-black overflow-hidden">
                    {mSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                        <div className="border-4 border-red-500 rounded px-4 py-1" style={{ transform: 'rotate(-15deg)' }}>
                          <span className="text-red-500 font-black text-2xl tracking-widest uppercase">AGOTADO</span>
                        </div>
                      </div>
                    )}
                    {mp.image.startsWith('/') ? (
                      <Image src={mp.image} alt={mp.name} fill sizes="100vw" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-orange-900/40">
                        <span className="text-7xl">{mp.image}</span>
                      </div>
                    )}
                    {/* Papas fritas decorativas */}
                    <Image
                      src="/papas-fritas.png"
                      alt="Papas fritas"
                      width={190}
                      height={140}
                      className="absolute bottom-0 left-0 object-contain pointer-events-none z-10"
                    />
                    {mDiscount && <div className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-black px-2.5 py-1 rounded-full">OFERTA</div>}
                  </div>

                  <div className="px-4 pt-4 pb-2">
                    {/* Name + description */}
                    <h3 className="text-xl font-black text-white mb-1">{mp.name}</h3>
                    <p className="text-orange-200/60 text-sm mb-4" dangerouslySetInnerHTML={{ __html: mp.description }} />

                    {/* Price + quantity */}
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
                      <div>
                        {mPromo ? (
                          <div className="flex flex-col"><span className="text-sm text-gray-500 line-through">S/ {mEffPrice.toFixed(2)}</span><span className="text-2xl font-black text-green-400">S/ {mPromo.promoPrice.toFixed(2)}</span></div>
                        ) : mDiscount ? (
                          <div className="flex flex-col"><span className="text-sm text-gray-500 line-through">S/ {mEffPrice.toFixed(2)}</span><span className="text-2xl font-black text-amber-400">S/ {mDiscount.toFixed(2)}</span></div>
                        ) : (
                          <span className="text-2xl font-black text-amber-400 gold-glow">S/ {mEffPrice.toFixed(2)}</span>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">precio unitario</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleDecreaseQuantity(mp.id)} disabled={mSoldOut || mQty <= 1} className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold text-xl transition-all">−</button>
                        <span className="text-white font-black text-xl w-8 text-center">{mQty}</span>
                        <button onClick={() => handleIncreaseQuantity(mp.id)} disabled={mSoldOut} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xl transition-all">+</button>
                      </div>
                    </div>

                    {/* Salsa selector */}
                    <div className="mb-4">
                      <button data-salsas-button onClick={() => setShowSalsas(prev => ({ ...prev, [mp.id]: !prev[mp.id] }))} className={`w-full flex items-center justify-between rounded-xl p-3 transition-all border mb-1 ${mCanAdd ? 'bg-green-600/20 border-green-500/40' : 'bg-amber-600/20 border-amber-500/40'}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{mCanAdd ? '✅' : '🌶️'}</span>
                          <div className="text-left">
                            <p className={`text-sm font-bold ${mCanAdd ? 'text-green-400' : 'text-white'}`}>{mCanAdd ? 'Salsas seleccionadas' : mRequired === 1 ? 'Elige tu salsa' : mRequired === 2 ? 'Elige 2 salsas' : 'Elige 3 salsas'}</p>
                            <p className="text-xs text-gray-400">{mSalsas.length} / {mRequired} elegidas</p>
                          </div>
                        </div>
                        <span className={`text-sm ${mCanAdd ? 'text-green-400' : 'text-amber-400'}`}>{showSalsas[mp.id] ? '▼' : '▶'}</span>
                      </button>
                      {showSalsas[mp.id] && (
                        <div className="space-y-1.5 mt-2">
                          {effectiveSalsas.map((salsa) => {
                            const count = getSalsaCount(mp.id, salsa.id);
                            const canSelect = mSalsas.length < mRequired || count > 0;
                            const wasRecentlyAdded = recentlyAddedSalsas.has(`${mp.id}-${salsa.id}`);
                            const canAddMore = count < mRequired && canSelect && !salsa.soldOut;
                            const salsaPromoConfig = mDynPromos.find((p: any) => p.salsas.includes(salsa.id));
                            const isSalsaPromoActive = salsaPromoConfig ? mSalsas.length > 0 && mSalsas.every((sId: string) => salsaPromoConfig.salsas.includes(sId)) : false;
                            return (
                              <div key={salsa.id} className={`rounded-xl p-3 border transition-all ${salsa.soldOut ? 'bg-gray-800/50 border-gray-700/30 opacity-60' : isSalsaPromoActive ? 'bg-green-900/20 border-green-400' : count > 0 ? 'bg-amber-900/20 border-amber-500/50' : 'bg-gray-800/40 border-gray-700/30'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 mr-3">
                                    <p className={`text-sm font-bold ${count > 0 ? 'text-amber-400' : salsa.soldOut ? 'text-gray-500' : 'text-white'}`}>{salsa.name}{salsa.soldOut && <span className="ml-2 text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">AGOTADO</span>}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{salsa.description}</p>
                                    {!salsa.soldOut && salsaPromoConfig && <p className={`text-xs mt-1 font-bold ${isSalsaPromoActive ? 'text-green-400' : 'text-amber-400'}`}>{isSalsaPromoActive ? `✓ PROMO — S/ ${Number(salsaPromoConfig.promoPrice).toFixed(2)}` : `Promo: S/ ${Number(salsaPromoConfig.promoPrice).toFixed(2)}`}</p>}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {count > 0 && (<><span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">×{count}</span><button onClick={() => handleSalsaToggle(mp.id, salsa.id, 'remove')} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button></>)}
                                    {canAddMore && <button onClick={() => handleSalsaToggle(mp.id, salsa.id, 'add')} className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${wasRecentlyAdded ? 'bg-green-500 scale-110' : 'bg-amber-600 hover:bg-amber-500'}`}>{wasRecentlyAdded ? '✓' : '+'}</button>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Complementos */}
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-white mb-2">Complementos</h5>
                      {/* Bebidas */}
                      <div className="mb-2">
                        <button onClick={() => setShowBebidas(prev => ({ ...prev, [mp.id]: !prev[mp.id] }))} className="w-full flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl p-3 transition-all mb-1">
                          <div className="flex items-center gap-2"><span>🥤</span><span className="text-white text-sm font-bold">Bebidas</span></div>
                          <span className="text-gray-400 text-sm">{showBebidas[mp.id] ? '▼' : '▶'}</span>
                        </button>
                        {showBebidas[mp.id] && (
                          <div className="space-y-1.5 mt-1">
                            {[{ id:"agua-mineral",name:"Agua mineral",emoji:"💧",price:4},{id:"coca-cola",name:"Coca Cola 500ml",emoji:"🥤",price:4},{id:"inka-cola",name:"Inka Cola 500ml",emoji:"🥤",price:4},{id:"sprite",name:"Sprite 500ml",emoji:"🥤",price:4},{id:"fanta",name:"Fanta 500ml",emoji:"🥤",price:4}].map((bebida) => {
                              const bebidaProduct: Product = { id:bebida.id, name:bebida.name, description:bebida.name, price:bebida.price, image:bebida.emoji, category:"bebida" };
                              const wasRecentlyAdded = recentlyAdded.has(`${mp.id}-${bebida.id}`);
                              const count = getComplementCount(mp.id, bebida.id);
                              return (
                                <div key={bebida.id} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                                  <div className="flex items-center gap-2"><span>{bebida.emoji}</span><span className="text-white text-sm">{bebida.name}</span></div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-400 text-sm font-bold">S/ {bebida.price.toFixed(2)}</span>
                                    {count > 0 && (<><button onClick={() => handleRemoveComplement(mp.id,bebida.id)} className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button><span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{count}</span></>)}
                                    <button onClick={() => handleAddComplement(mp.id,bebidaProduct)} className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${wasRecentlyAdded?'bg-green-500':'bg-red-600 hover:bg-red-500'}`}>{wasRecentlyAdded?'✓':'+'}</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {/* Extras */}
                      <div>
                        <button onClick={() => setShowExtras(prev => ({ ...prev, [mp.id]: !prev[mp.id] }))} className="w-full flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl p-3 transition-all mb-1">
                          <div className="flex items-center gap-2"><span>🍟</span><span className="text-white text-sm font-bold">Extras</span></div>
                          <span className="text-gray-400 text-sm">{showExtras[mp.id] ? '▼' : '▶'}</span>
                        </button>
                        {showExtras[mp.id] && (
                          <div className="space-y-1.5 mt-1">
                            {[{ id:"extra-papas", name:"Extra papas", emoji:"🍟", price:5 }].map((extra) => {
                              const extraProduct: Product = { id:extra.id, name:extra.name, description:extra.name, price:extra.price, image:extra.emoji, category:"bebida" };
                              const wasRecentlyAdded = recentlyAdded.has(`${mp.id}-${extra.id}`);
                              const count = getComplementCount(mp.id, extra.id);
                              return (
                                <div key={extra.id} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                                  <div className="flex items-center gap-2"><span>{extra.emoji}</span><span className="text-white text-sm">{extra.name}</span></div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-400 text-sm font-bold">S/ {extra.price.toFixed(2)}</span>
                                    {count > 0 && (<><button onClick={() => handleRemoveComplement(mp.id,extra.id)} className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button><span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{count}</span></>)}
                                    <button onClick={() => handleAddComplement(mp.id,extraProduct)} className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${wasRecentlyAdded?'bg-green-500':'bg-red-600 hover:bg-red-500'}`}>{wasRecentlyAdded?'✓':'+'}</button>
                                  </div>
                                </div>
                              );
                            })}
                            {Array.from(new Set(selectedSalsas[mp.id] || [])).map((salsaId) => {
                              const salsaData = salsas.find(s => s.id === salsaId);
                              if (!salsaData) return null;
                              const extraSalsa = { id:`extra-salsa-${salsaId}`, name:`Extra salsa - ${salsaData.name}`, emoji:"🥫", price:3 };
                              const extraProduct: Product = { id:extraSalsa.id, name:extraSalsa.name, description:extraSalsa.name, price:extraSalsa.price, image:extraSalsa.emoji, category:"bebida" };
                              const wasRecentlyAdded = recentlyAdded.has(`${mp.id}-${extraSalsa.id}`);
                              const count = getComplementCount(mp.id, extraSalsa.id);
                              return (
                                <div key={extraSalsa.id} className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                                  <div className="flex items-center gap-2"><span>{extraSalsa.emoji}</span><span className="text-white text-sm">{extraSalsa.name}</span></div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-400 text-sm font-bold">S/ {extraSalsa.price.toFixed(2)}</span>
                                    {count > 0 && (<><button onClick={() => handleRemoveComplement(mp.id,extraSalsa.id)} className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-500 text-white font-bold">−</button><span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">{count}</span></>)}
                                    <button onClick={() => handleAddComplement(mp.id,extraProduct)} className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-white ${wasRecentlyAdded?'bg-green-500':'bg-red-600 hover:bg-red-500'}`}>{wasRecentlyAdded?'✓':'+'}</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky confirm button */}
                <div className="flex-shrink-0 px-4 pt-3 pb-6 bg-gray-900 border-t border-gray-800">
                  <button
                    onClick={() => { handleCompleteOrder(mp); setIsEditingOrder(false); }}
                    disabled={!mCanAdd || mSoldOut}
                    className={`w-full py-4 rounded-xl font-black text-base transition-all ${mCanAdd && !mSoldOut ? 'bg-red-500 hover:bg-red-400 text-white cursor-pointer active:scale-[0.98]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    {mSoldOut ? 'No disponible'
                      : !mCanAdd ? `Selecciona ${mRequired} salsa${mRequired > 1 ? 's' : ''}`
                      : isEditingOrder ? `Confirmar cambios — S/ ${((mPromo?.promoPrice ?? mDiscount ?? mEffPrice) * mQty).toFixed(2)}`
                      : `Agregar orden — S/ ${((mPromo?.promoPrice ?? mDiscount ?? mEffPrice) * mQty).toFixed(2)}`
                    }
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Sección de órdenes agregadas */}
        {completedOrders.length > 0 && (
          <div id="tu-orden-section" className="container mx-auto px-3 md:px-5 -mt-2 md:mt-0 lg:mt-2">
            <h3 className="text-base md:text-xl lg:text-2xl font-black text-amber-400 mb-2 md:mb-4 gold-glow">
              Tu orden
            </h3>
            <div className="space-y-2 md:space-y-4">
              {completedOrders.map((order, index) => {
                // ── Individual item ───────────────────────────────────────
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
                              {order.discountApplied ? (
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
                <span className="text-amber-400 font-black text-xl md:text-4xl gold-glow">
                  S/ {completedTotal.toFixed(2)}
                </span>
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

      <WhatsAppButton lifted={completedOrders.length > 0} />
    </PageMotionWrapper>
  );
}
