"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "fit" | "fat" | "bebida";
}

interface Salsa {
  id: string;
  name: string;
  description: string;
}

interface CompletedOrder {
  productId: string;
  quantity: number;
  salsas: string[];
  complementIds: string[];
}

const products: Product[] = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    description: "6 alitas crujientes con papas francesas y tu salsa elegida. El primer bocado es una trampa — no vas a querer quedarte en solo 6.",
    price: 18.50,
    image: "/pequeno-dilema.png?v=3",
    category: "fat",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    description: "12 alitas con papas francesas y 2 salsas para hacer lo que se te antoje. Spoiler: el arrepentimiento llega después, no durante.",
    price: 33.50,
    image: "/duo-dilema.png?v=3",
    category: "fat",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    description: "18 alitas, papas francesas y 3 salsas para combinar sin culpa. Para los que no entienden el concepto de 'suficiente'.",
    price: 45.00,
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
    price: 18.90,
    image: "/clasica-fresh-bowl.png",
    category: "fit",
  },
  {
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    description: "Lechuga romana, pollo grillado, tomate cherry, crutones y parmesano. Con salsa César cremosa de la casa.",
    price: 24.90,
    image: "/cesar-power-bowl.png",
    category: "fit",
  },
  {
    id: "ensalada-caesar",
    name: "PROTEIN FIT BOWL",
    description: "Mix de hojas verdes, quinua, palta, tomate cherry, semillas y pollo grillado. Con aderezo de yogurt griego.",
    price: 22.90,
    image: "/protein-fit-bowl.png",
    category: "fit",
  },
  {
    id: "ensalada-mediterranea",
    name: "TUNA FRESH BOWL",
    description: "Lechuga romana, atún en trozos, tomate cherry, pepino, choclo, palta y huevo. Aderezo a elección.",
    price: 21.90,
    image: "/tuna-fresh-bowl.png",
    category: "fit",
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
    name: "Teriyaki",
    description: "Salsa asiática, dulce y salado en equilibrio. Con notas ahumadas que evocan los sabores orientales"
  },
  {
    id: "macerichada",
    name: "Sweet & Sour",
    description: "Contraste vibrante entre lo dulce y ácido. Fresca, intensa y memorable en cada mordida"
  },
];

// 🎁 PROMOCIÓN: Salsas que califican para 40% de descuento
const PROMO_SAUCE_IDS = [
  "anticuchos",      // Parrillera
  "honey-mustard",   // Honey Mustard
  "teriyaki",        // Teriyaki
  "macerichada"      // Sweet & Sour
];

// Función para validar si una orden califica para el descuento del 30%
const hasPromoDiscount = (order: CompletedOrder, productId: string, promoActive: boolean = true): boolean => {
  // Si la promo ya no está activa, no aplica descuento
  if (!promoActive) return false;

  // Solo aplica a los 3 menús principales
  if (!["pequeno-dilema", "duo-dilema", "santo-pecado"].includes(productId)) {
    return false;
  }

  // Verificar que todas las salsas sean promocionales
  // Si no tiene salsas seleccionadas, no aplica
  if (!order.salsas || order.salsas.length === 0) {
    return false;
  }

  // TODAS las salsas deben ser promocionales
  return order.salsas.every(salsaId => PROMO_SAUCE_IDS.includes(salsaId));
};

// Generar dinámicamente el diccionario de complementos disponibles
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
  const [promo30Active, setPromo30Active] = useState(true);
  const [promo30Count, setPromo30Count] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrderIndex, setDeleteOrderIndex] = useState<number | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState<boolean>(false);
  const [editingOrderIndex, setEditingOrderIndex] = useState<number | null>(null);
  const router = useRouter();

  const completedTotal = completedOrders.reduce((total, order) => {
    // Buscar en productos fat primero, luego en productos fit
    let product = products.find(p => p.id === order.productId);
    if (!product) {
      product = fitProducts.find(p => p.id === order.productId);
    }
    if (!product) return total;

    // Calcular precio del producto (con descuento si aplica)
    let productPrice = product.price;
    if (hasPromoDiscount(order, order.productId, promo30Active)) {
      productPrice = product.price * 0.7; // 30% descuento = pagar 70%
    }

    let orderTotal = productPrice * order.quantity;
    order.complementIds.forEach(compId => {
      const complement = availableComplements[compId];
      if (complement) orderTotal += complement.price;
    });
    return total + orderTotal;
  }, 0);

  const navigateToCheckout = () => {
    clearCart();
    completedOrders.forEach(order => {
      const product = products.find(p => p.id === order.productId);
      if (product) {
        // Aplicar descuento si califica
        const hasDiscount = hasPromoDiscount(order, order.productId, promo30Active);
        const finalPrice = hasDiscount ? product.price * 0.7 : product.price;

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

    // Cargar estado de promo 30%
    fetch("/api/promo30")
      .then(res => res.json())
      .then(data => {
        setPromo30Active(data.active);
        setPromo30Count(data.count);
      })
      .catch(() => {
        // En caso de error, mantener activa para no bloquear ventas
        setPromo30Active(true);
      });
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

    // Solo expandir si tiene cantidad > 0 y no está expandido
    if (currentQty > 0 && expandedCard !== productId) {
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

    // Si el cartel no está expandido y hay cantidad, expandirlo
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
            const productWithSalsas: Product = {
              ...product,
              id: cartItemId,
              description: `${product.description} - Salsas: ${salsasText}`,
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
            const productWithSalsas: Product = {
              ...product,
              id: cartItemId,
              description: `${product.description} - Salsas: ${salsasText}`,
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
    const completedOrder: CompletedOrder = {
      productId: product.id,
      quantity: orderQuantity[product.id] || 1,
      salsas: selectedSalsas[product.id] || [],
      complementIds: complementsInCart[product.id] || []
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

    // Verificar si la orden pertenece al menú fit
    const isFitOrder = fitProducts.some(p => p.id === order.productId);

    // Si es una orden fit, redirigir a la página fit con el índice de orden
    if (isFitOrder) {
      router.push(`/fit?editOrder=${orderIndex}`);
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

  return (
    <div className="min-h-screen bg-black md:bg-transparent relative overflow-visible">
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
      <header className="bg-gray-900 md:bg-transparent border-b-2 md:border-b-0 border-red-500 neon-border-fat sticky top-0 z-30 overflow-visible">
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
              Ver menú Balance →
            </Link>
            <Link
              href="/fit"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors neon-glow-fit px-2 py-1 rounded border border-cyan-500/30 hover:border-cyan-400 sm:hidden"
            >
              Ver menú Balance
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Banner */}
      <section className="relative w-full overflow-visible bg-black md:bg-transparent pt-6 md:mt-8">
        <div className="relative w-full bg-black md:bg-transparent overflow-visible">
          {/* Banner para móvil */}
          <video
            src="/bannermovilfat.mp4"
            poster="/bannermovil.png"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="block md:hidden w-full h-auto object-cover"
          />
          {/* Banner para PC/Tablet */}
          <video
            src="/bannerwebfat.mp4?v=2"
            poster="/bannerpc.png"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="hidden md:block w-full h-auto object-contain"
            style={{
              maxHeight: '140px',
              objectPosition: 'center',
            }}
          />
        </div>
      </section>

      {/* Products Carousel */}
      <section className={`container mx-auto px-2 md:px-4 py-3 md:py-8 transition-all duration-300 overflow-visible ${completedOrders.length > 0 ? 'pb-20 md:pb-16' : 'pb-3 md:pb-3'}`}>
        {/* Carousel Container */}
        <div className="relative flex items-center justify-center overflow-visible">
          {/* Scrollable Products - Carrusel en móvil, grilla en desktop */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex md:flex-wrap md:justify-center items-center gap-2 md:gap-6 lg:gap-8 scrollbar-hide px-1 md:px-4 py-12 md:py-8 lg:py-10 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} md:cursor-default snap-x snap-mandatory md:snap-none overflow-x-auto md:overflow-visible`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none' }}
          >
            {products.map((product) => {
              const isExpanded = expandedCard === product.id;
              const requiredSalsas = getRequiredSalsasCount(product.id);
              const currentSalsas = selectedSalsas[product.id] || [];
              const canAdd = canAddProduct(product.id);

              return (
                <div
                  key={product.id}
                  ref={(el) => { cardRefs.current[product.id] = el; }}
                  onClick={() => handleCardClick(product.id)}
                  onMouseEnter={() => handleCardHover(product.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`bg-gray-900 flex-shrink-0 md:flex-shrink neon-border-fat shadow-xl shadow-red-500/30 snap-center md:snap-none border-2 md:border-0 border-red-400
                    ${isExpanded
                      ? 'w-[260px] md:w-[400px] lg:w-[420px] z-20'
                      : 'w-[240px] md:w-[280px] lg:w-[300px]'
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
                  }}
                >
                  {/* Card Header */}
                  <div className={`relative flex items-center justify-center overflow-visible ${
                    product.image.startsWith('/')
                      ? 'bg-black h-40 md:h-48 border-0'
                      : 'bg-gradient-to-br from-red-900/40 to-orange-900/40 h-20 md:h-28 overflow-hidden rounded-t-lg md:rounded-t-xl border-b-2 border-red-500/30'
                  }`}>
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
                    <p className="text-orange-200/70 text-[10px] md:text-xs mb-1.5 md:mb-2 line-clamp-3 h-10 md:h-12">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-1.5 md:mb-2.5">
                      {(() => {
                        // Verificar si las salsas seleccionadas califican para descuento
                        const currentSalsas = selectedSalsas[product.id] || [];
                        const hasDiscount = promo30Active && currentSalsas.length > 0 &&
                          currentSalsas.every(salsaId => PROMO_SAUCE_IDS.includes(salsaId));
                        const discountedPrice = product.price * 0.7;

                        if (hasDiscount) {
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-gray-500 line-through text-[10px] md:text-xs">
                                S/ {product.price.toFixed(2)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm md:text-lg font-black text-green-400 gold-glow">
                                  S/ {discountedPrice.toFixed(2)}
                                </span>
                                <span className="bg-green-500/20 text-green-400 text-[8px] md:text-[10px] px-1 py-0.5 rounded font-bold">
                                  -30%
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <span className="text-sm md:text-lg font-black text-amber-400 gold-glow">
                            S/ {product.price.toFixed(2)}
                          </span>
                        );
                      })()}
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecreaseQuantity(product.id);
                          }}
                          className="w-5 h-5 md:w-7 md:h-7 bg-red-600 hover:bg-red-500 text-white rounded text-xs md:text-sm font-bold transition-all flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-6 md:w-9 text-center text-xs md:text-base">
                          {orderQuantity[product.id] || 0}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncreaseQuantity(product.id);
                          }}
                          className="w-5 h-5 md:w-7 md:h-7 bg-red-600 hover:bg-red-500 text-white rounded text-xs md:text-sm font-bold transition-all flex items-center justify-center"
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
                                : `Elige tu${requiredSalsas > 1 ? 's' : ''} salsa${requiredSalsas > 1 ? 's' : ''}`
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
                              ? 'max-h-[600px] opacity-100 mt-2 md:mt-3'
                              : 'max-h-0 opacity-0 mt-0'
                          }`}
                        >
                          <div className="space-y-1 md:space-y-2">
                            {salsas.map((salsa) => {
                              const count = getSalsaCount(product.id, salsa.id);
                              const isSelected = count > 0;
                              const canSelect = currentSalsas.length < requiredSalsas || isSelected;
                              const wasRecentlyAdded = recentlyAddedSalsas.has(`${product.id}-${salsa.id}`);
                              // Ocultar botón + cuando el count de esta salsa alcanza el máximo permitido
                              const maxSalsaCount = requiredSalsas; // Máximo que se puede agregar de una misma salsa
                              const canAddMore = count < maxSalsaCount && canSelect;
                              const showAddButton = canAddMore;

                              return (
                                <div
                                  key={salsa.id}
                                  className="bg-gray-800/30 rounded p-1.5 md:p-2 border border-amber-500/10"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex-1">
                                      <div className={`text-[10px] md:text-xs ${count > 0 ? 'text-amber-400 font-bold' : 'text-white'}`}>
                                        {salsa.name}
                                      </div>
                                      <p className="text-[9px] md:text-[10px] text-gray-400 italic mt-0.5">
                                        {salsa.description}
                                      </p>
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
                                const extra = { id: "extra-papas", name: "Extra papas", emoji: "🍟", price: 4.00 };
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
                        disabled={!canAdd}
                        className={`w-full py-2.5 md:py-3.5 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-all
                          ${canAdd
                            ? 'bg-red-500 hover:bg-red-400 text-white neon-border-fat cursor-pointer active:scale-95'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'
                          }
                        `}
                      >
                        {canAdd ? (isEditingOrder ? 'Confirmar orden' : 'Agregar orden') : `Selecciona ${requiredSalsas} salsa${requiredSalsas > 1 ? 's' : ''}`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner de promo 30% */}
        {expandedCard === null && completedOrders.length === 0 && (
          <div className="relative w-full flex justify-center items-center py-4 md:py-4 px-4">
            <div className="text-center animated-text-reveal">
              {promo30Active ? (
                <>
                  <h2
                    className="text-base md:text-xl lg:text-2xl font-black tracking-widest uppercase"
                    style={{
                      fontFamily: "'Impact', 'Arial Black', 'Bebas Neue', 'Oswald', sans-serif",
                      fontWeight: 900,
                      fontStretch: 'expanded',
                      color: '#ef4444',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      textShadow: '0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    ¡Promo del día 30% de descuento en salsas exclusivas!
                  </h2>
                  <p className="text-red-400/70 text-xs md:text-sm mt-1">
                    Solo quedan <span className="font-black text-red-400">{30 - promo30Count}</span> de 30 lugares disponibles
                  </p>
                </>
              ) : (
                <h2
                  className="text-base md:text-xl lg:text-2xl font-black tracking-widest uppercase"
                  style={{
                    fontFamily: "'Impact', 'Arial Black', 'Bebas Neue', 'Oswald', sans-serif",
                    fontWeight: 900,
                    fontStretch: 'expanded',
                    color: '#6b7280',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}
                >
                  Promo 30% agotada — ¡Atento a nuevas promociones!
                </h2>
              )}
            </div>
          </div>
        )}

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

                // Si no se encuentra, buscar en fit products
                if (!product) {
                  product = fitProducts.find((p) => p.id === order.productId);
                  isFitOrder = true;
                }

                if (!product) return null;

                return (
                  <div
                    key={`${order.productId}-${index}`}
                    className={`bg-gray-900 rounded-lg border-2 ${isFitOrder ? 'border-cyan-400/30' : 'border-red-400/30'} p-2 md:p-4 relative`}
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
                            <div className={`${isFitOrder ? 'text-cyan-300/80' : 'text-red-300/80'} flex justify-between items-center`}>
                              <span>• {product.name} x{order.quantity}</span>
                              {(() => {
                                const hasDiscount = hasPromoDiscount(order, order.productId, promo30Active);
                                const originalTotal = product.price * order.quantity;
                                const discountedTotal = originalTotal * 0.7;

                                if (hasDiscount) {
                                  return (
                                    <span className="flex items-center gap-2">
                                      <span className="text-gray-500 line-through text-[10px] md:text-xs">S/ {originalTotal.toFixed(2)}</span>
                                      <span className="text-green-400 font-bold">S/ {discountedTotal.toFixed(2)}</span>
                                      <span className="bg-green-500/20 text-green-400 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold">-30%</span>
                                    </span>
                                  );
                                }
                                return <span className="text-amber-400/80">S/ {originalTotal.toFixed(2)}</span>;
                              })()}
                            </div>

                            {/* Salsas seleccionadas - solo para ordenes de fat */}
                            {!isFitOrder && order.salsas && order.salsas.length > 0 && (
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
                                    <div key={`${compId}-${idx}`} className={`${isFitOrder ? 'text-cyan-300/80' : 'text-red-300/80'} flex justify-between`}>
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
                        const productTotal = product.price * order.quantity;
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

            {/* Mensaje de calificación para cupón 13% */}
            {(() => {
              const PROMO_SAUCE_IDS = ["barbecue", "buffalo-picante", "ahumada", "parmesano-ajo"];
              const qualifiesForCoupon = completedOrders.some(order => {
                if (!order.salsas || order.salsas.length === 0) return false;
                return order.salsas.every((salsaId: string) => PROMO_SAUCE_IDS.includes(salsaId));
              });

              if (qualifiesForCoupon) {
                return (
                  <div className="mt-4 bg-green-500/10 border-2 border-green-500/40 rounded-lg p-3 md:p-4">
                    <p className="text-green-400 text-xs md:text-sm text-center font-semibold flex items-center justify-center gap-2">
                      <span className="text-base md:text-lg">🎁</span>
                      ¡Tu orden califica para la promoción de <span className="font-black">cupón 13%!</span>
                    </p>
                    <p className="text-green-400/70 text-[10px] md:text-xs text-center mt-1">
                      En el siguiente paso verificaremos tu elegibilidad con tu DNI
                    </p>
                  </div>
                );
              }
              return null;
            })()}
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
              <button
                onClick={navigateToCheckout}
                className="bg-red-500 hover:bg-red-400 active:scale-95 text-white px-5 md:px-9 py-2.5 md:py-4 rounded-lg md:rounded-xl font-black text-sm md:text-xl transition-all neon-border-fat"
              >
                Continuar<span className="hidden sm:inline"> Pedido</span> →
              </button>
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
        if (!product) {
          product = fitProducts.find((p) => p.id === order.productId);
          isFitOrder = true;
        }

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className={`bg-gray-900 border-2 ${isFitOrder ? 'border-cyan-500 neon-border-fit' : 'border-red-500 neon-border-fat'} rounded-lg p-6 max-w-md w-full`}>
              <h3 className={`text-xl font-black ${isFitOrder ? 'text-cyan-400 neon-glow-fit' : 'text-red-400 gold-glow'} mb-4 text-center`}>
                ¡Qué dilema!
              </h3>
              {(() => {
                if (!product) return null;

              // Aplicar descuento si califica
              const hasDiscount = hasPromoDiscount(order, order.productId, promo30Active);
              const productPrice = hasDiscount ? product.price * 0.7 : product.price;
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
                        {(() => {
                          const originalTotal = product.price * order.quantity;
                          const discountedTotal = originalTotal * 0.7;

                          if (hasDiscount) {
                            return (
                              <span className="flex items-center gap-2">
                                <span className="text-gray-500 line-through text-[10px]">S/ {originalTotal.toFixed(2)}</span>
                                <span className="text-green-400 font-bold">S/ {discountedTotal.toFixed(2)}</span>
                                <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded font-bold">-30%</span>
                              </span>
                            );
                          }
                          return <span className="text-amber-400/80">S/ {originalTotal.toFixed(2)}</span>;
                        })()}
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
    </div>
  );
}
