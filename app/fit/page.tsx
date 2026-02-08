"use client";

import Link from "next/link";
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

interface CompletedOrder {
  productId: string;
  quantity: number;
  salsas?: string[];
  complementIds: string[];
}

const products: Product[] = [
  {
    id: "ensalada-clasica",
    name: "CLÁSICA FRESH BOWL",
    description: "Lechuga americana, tomate, pepino, zanahoria, choclo y huevo. Con vinagreta clásica de la casa.",
    price: 18.90,
    image: "/clasica-fresh-bowl.png",
    category: "fit",
  },
  {
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    description: "Lechuga romana, pollo grillado, crutones y parmesano. Con salsa César cremosa de la casa.",
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

// Productos de FAT para visualización de órdenes cruzadas
const fatProducts: Product[] = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    description: "6 alitas acompañadas de papas y 01 salsa favorita.",
    price: 28.90,
    image: "/pequeno-dilema.png?v=3",
    category: "fat",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    description: "12 alitas acompañadas de papas francesas y 02 de tus salsas favoritas.",
    price: 39.90,
    image: "/duo-dilema.png?v=3",
    category: "fat",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    description: "18 alitas acompañadas de papas francesas y 03 de tus salsas favoritas.",
    price: 49.90,
    image: "/todos-pecan.png?v=3",
    category: "fat",
  },
];

const salsas: { id: string; name: string }[] = [
  { id: "barbecue", name: "Barbecue" },
  { id: "anticuchos", name: "Anticuchos" },
  { id: "ahumada", name: "Ahumada" },
  { id: "buffalo-picante", name: "Buffalo picante" },
  { id: "honey-mustard", name: "Honey mustard" },
  { id: "macerichada", name: "Macerichada" },
  { id: "teriyaki", name: "Teriyaki" },
  { id: "parmesano-ajo", name: "Parmesano & Ajo" },
];

const availableComplements: Record<string, { name: string; price: number }> = {
  "agua-mineral": { name: "Agua mineral", price: 4.00 },
  "coca-cola": { name: "Coca Cola 500ml", price: 4.00 },
  "inka-cola": { name: "Inka Cola 500ml", price: 4.00 },
  "sprite": { name: "Sprite 500ml", price: 4.00 },
  "fanta": { name: "Fanta 500ml", price: 4.00 },
  "extra-aderezo": { name: "Extra aderezo", price: 3.00 },
  "extra-papas": { name: "Extra papas", price: 4.00 },
  "extra-salsa": { name: "Extra salsa", price: 3.00 }
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
  const router = useRouter();

  const completedTotal = completedOrders.reduce((total, order) => {
    // Buscar en productos fit primero, luego en productos fat
    let product = products.find(p => p.id === order.productId);
    if (!product) {
      product = fatProducts.find(p => p.id === order.productId);
    }
    if (!product) return total;
    let orderTotal = product.price * order.quantity;
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
        addToCart(product, order.quantity);
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
    const savedOrders = localStorage.getItem("santo-dilema-orders");
    if (savedOrders) {
      try {
        const allOrders = JSON.parse(savedOrders);
        // Mantener solo las órdenes que NO son "fit"
        const otherOrders = allOrders.filter((order: CompletedOrder) => order.category !== "fit");
        setCompletedOrders(otherOrders);

        // Si había órdenes fit, las limpiamos del localStorage
        if (otherOrders.length !== allOrders.length) {
          localStorage.setItem("santo-dilema-orders", JSON.stringify(otherOrders));
        }
      } catch (error) {
        console.error("Error loading orders:", error);
      }
    }
    // Limpiar el carrito siempre
    localStorage.removeItem("santo-dilema-cart");
    clearCart();
  }, []);

  useEffect(() => {
    if (completedOrders.length > 0) {
      localStorage.setItem("santo-dilema-orders", JSON.stringify(completedOrders));
    } else {
      localStorage.removeItem("santo-dilema-orders");
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
    const handleClickOutside = (event: MouseEvent) => {
      if (!expandedCard) return;

      const target = event.target as HTMLElement;
      const expandedCardElement = cardRefs.current[expandedCard];

      if (expandedCardElement && !expandedCardElement.contains(target)) {
        handleCloseCard();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedCard]);

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

  const handleIncreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 0;
    setOrderQuantity((prev) => ({
      ...prev,
      [productId]: currentQty + 1
    }));
    if (currentQty === 0) {
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
    const completedOrder: CompletedOrder = {
      productId: product.id,
      quantity: orderQuantity[product.id] || 1,
      complementIds: complementsInCart[product.id] || []
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

    // Verificar si la orden pertenece al menú fat
    const isFatOrder = fatProducts.some(p => p.id === order.productId);

    // Si es una orden fat, redirigir a la página fat con el índice de orden
    if (isFatOrder) {
      router.push(`/fat?editOrder=${orderIndex}`);
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
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 border-b-2 border-cyan-500 neon-border-fit sticky top-0 z-30">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
            <h1 className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-black tracking-tight">
              <span className="text-amber-400 gold-glow inline-flex items-center">
                S
                <span className="relative inline-block">A</span>
                <span className="relative inline-block">N</span>
                <span className="relative inline-block">T</span>
                <span className="relative inline-block">
                  O
                  <svg
                    className="absolute -top-1.5 md:-top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 md:w-4 md:h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12l3-3 3 3 4-8 4 8 3-3 3 3v7H2z"/>
                    <line x1="2" y1="19" x2="22" y2="19"/>
                  </svg>
                </span>
              </span>
              <div className="w-0.5 h-6 md:h-8 bg-gradient-to-b from-transparent via-fuchsia-500 to-transparent shadow-lg shadow-fuchsia-500/50"></div>
              <span className="text-fuchsia-500 neon-glow-purple">DILEMA</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/fat"
              className="text-xs md:text-sm font-bold text-red-400 hover:text-red-300 transition-colors neon-glow-fat px-2 md:px-3 py-1 md:py-1.5 rounded border border-red-500/30 hover:border-red-400 hidden sm:block"
            >
              Ver menú Placer →
            </Link>
            <Link
              href="/fat"
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors neon-glow-fat px-2 py-1 rounded border border-red-500/30 hover:border-red-400 sm:hidden"
            >
              Ver menú Placer
            </Link>
          </div>
        </div>
      </header>

      <section className="relative w-full overflow-hidden bg-black pt-6 md:pt-0">
        <div className="relative w-full bg-black">
          <img
            src="/bannermovilfi.png?v=1"
            alt="Banner promocional FIT"
            className="block md:hidden w-full h-auto object-cover"
          />
          <img
            src="/bannerpcfit.png?v=1"
            alt="Banner promocional FIT"
            className="hidden md:block w-full h-auto object-cover"
            style={{
              maxHeight: '250px',
              objectPosition: 'center',
            }}
          />
        </div>
      </section>

      <section className={`container mx-auto px-2 md:px-4 py-3 md:py-4 lg:py-6 transition-all duration-300 overflow-visible ${completedOrders.length > 0 ? 'pb-20 md:pb-16' : 'pb-3 md:pb-6'}`}>
        <div className="relative flex items-center justify-center overflow-visible">
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex md:flex-wrap md:justify-center items-center gap-2 md:gap-6 lg:gap-8 scrollbar-hide px-1 md:px-4 py-12 md:py-8 lg:py-10 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} md:cursor-default snap-x snap-mandatory md:snap-none overflow-x-auto md:overflow-x-visible`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none', overflowY: 'visible' }}
          >
            {products.map((product) => {
              const isExpanded = expandedCard === product.id;

              return (
                <div
                  key={product.id}
                  ref={(el) => { cardRefs.current[product.id] = el; }}
                  onMouseEnter={() => handleCardHover(product.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`bg-gray-900 flex-shrink-0 md:flex-shrink neon-border-fit shadow-xl shadow-cyan-500/30 snap-center md:snap-none border-2 md:border-0 border-cyan-400
                    ${isExpanded
                      ? 'w-[260px] md:w-[400px] lg:w-[420px] z-20'
                      : 'w-[240px] md:w-[280px] lg:w-[300px]'
                    }
                    ${!isExpanded && hoveredCard === product.id && !expandedCard
                      ? 'md:scale-105 md:-translate-y-2 md:shadow-2xl md:shadow-cyan-500/50 z-10'
                      : !isExpanded && !expandedCard ? 'md:shadow-none scale-100 translate-y-0' : ''
                    }
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
                      ? 'bg-black h-40 md:h-56 border-0'
                      : 'bg-gradient-to-br from-cyan-900/40 to-teal-900/40 h-20 md:h-28 overflow-hidden rounded-t-lg md:rounded-t-xl border-b-2 border-cyan-500/30'
                  }`}>
                    {product.image.startsWith('/') ? (
                      <img
                        src={product.image}
                        alt={product.name}
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
                  </div>
                  <div className="p-3 md:p-4">
                    <h4 className="text-xs md:text-base font-bold text-white mb-1.5 md:mb-1.5 truncate">
                      {product.name}
                    </h4>
                    <p className="text-cyan-200/70 text-[10px] md:text-xs mb-1.5 md:mb-3 line-clamp-3 h-10 md:h-12">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-1.5 md:mb-3">
                      <span className="text-sm md:text-lg font-black text-amber-400 gold-glow">
                        S/ {product.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecreaseQuantity(product.id);
                          }}
                          className="w-5 h-5 md:w-6 md:h-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-6 md:w-8 text-center text-xs md:text-sm">
                          {orderQuantity[product.id] || 0}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncreaseQuantity(product.id);
                          }}
                          className="w-5 h-5 md:w-6 md:h-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
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
                          handleCompleteOrder(product);
                          setIsEditingOrder(false);
                        }}
                        disabled={false}
                        className="w-full py-2.5 rounded font-bold text-sm transition-all bg-cyan-500 hover:bg-cyan-400 text-black neon-border-fit cursor-pointer active:scale-95"
                      >
                        {isEditingOrder ? 'Confirmar orden' : 'Agregar orden'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {expandedCard === null && completedOrders.length === 0 && (
          <div className="relative w-full flex justify-center items-center py-4 md:py-6 lg:py-8 px-4">
            <div className="text-center animated-text-reveal">
              <h2
                className="text-base md:text-2xl lg:text-3xl font-black tracking-widest uppercase"
                style={{
                  fontFamily: "'Impact', 'Arial Black', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontStretch: 'expanded',
                  color: '#06b6d4',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  textShadow: '0 0 10px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.6), 0 0 30px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2)'
                }}
              >
                ¡Promo del día 30% descuento en órdenes César Power Bowl!
              </h2>
            </div>
          </div>
        )}

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

                // Si no se encuentra, buscar en fat products
                if (!product) {
                  product = fatProducts.find((p) => p.id === order.productId);
                  isFatOrder = true;
                }

                if (!product) return null;

                return (
                  <div
                    key={`${order.productId}-${index}`}
                    className={`bg-gray-900 rounded-lg border-2 ${isFatOrder ? 'border-red-400/30' : 'border-cyan-400/30'} p-2 md:p-3 relative`}
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
                            <div className={`${isFatOrder ? 'text-red-300/80' : 'text-cyan-300/80'} flex justify-between`}>
                              <span>• {product.name} x{order.quantity}</span>
                              <span className="text-amber-400/80">S/ {(product.price * order.quantity).toFixed(2)}</span>
                            </div>

                            {/* Salsas (solo para órdenes de fat) */}
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
                                    <div key={`${compId}-${idx}`} className={`${isFatOrder ? 'text-red-300/80' : 'text-cyan-300/80'} flex justify-between`}>
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
                <span className="text-amber-400 font-black text-xl md:text-3xl gold-glow">
                  S/ {completedTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={navigateToCheckout}
                className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black px-5 md:px-7 py-2.5 md:py-3 rounded-lg font-black text-sm md:text-lg transition-all neon-border-fit"
              >
                Continuar<span className="hidden sm:inline"> Pedido</span> →
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteOrderIndex !== null && (() => {
        const order = completedOrders[deleteOrderIndex];
        // Buscar producto para determinar el tipo de orden
        let product = products.find((p) => p.id === order.productId);
        let isFatOrder = false;
        if (!product) {
          product = fatProducts.find((p) => p.id === order.productId);
          isFatOrder = true;
        }

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className={`bg-gray-900 border-2 ${isFatOrder ? 'border-red-500 neon-border-fat' : 'border-cyan-500 neon-border-fit'} rounded-lg p-6 max-w-md w-full`}>
              <h3 className={`text-xl font-black ${isFatOrder ? 'text-red-400 gold-glow' : 'text-cyan-400 neon-glow-fit'} mb-4 text-center`}>
                ¡Qué dilema!
              </h3>
              {(() => {
                if (!product) return null;

              const productTotal = product.price * order.quantity;
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
                          <img
                            src={product.image}
                            alt={product.name}
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
                        <span className="text-amber-400/80">S/ {(product.price * order.quantity).toFixed(2)}</span>
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
    </div>
  );
}
