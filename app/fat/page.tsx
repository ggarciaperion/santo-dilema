"use client";

import Link from "next/link";
import { useState, useRef } from "react";
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
    description: "12 alitas con tu salsa favorita",
    price: 28.90,
    image: "🍗",
    category: "fat",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    description: "18 alitas con dos salsas a elección",
    price: 39.90,
    image: "🔥",
    category: "fat",
  },
  {
    id: "todos-pecan",
    name: "Todos Pecan",
    description: "24 alitas + papas fritas + bebida grande",
    price: 49.90,
    image: "🍔",
    category: "fat",
  },
];

const salsas: Salsa[] = [
  { id: "barbecue", name: "Barbecue" },
  { id: "anticuchos", name: "Anticuchos" },
  { id: "ahumada", name: "Ahumada" },
  { id: "buffalo-picante", name: "Buffalo picante" },
  { id: "honey-mustard", name: "Honey mustard" },
  { id: "macerichada", name: "Macerichada" },
  { id: "teriyaki", name: "Teriyaki" },
  { id: "parmesano-ajo", name: "Parmesano & Ajo" },
];

const availableComplements: Record<string, string> = {
  "agua-mineral": "Agua mineral",
  "coca-cola": "Coca Cola 500ml",
  "inka-cola": "Inka Cola 500ml",
  "sprite": "Sprite 500ml",
  "fanta": "Fanta 500ml",
  "extra-papas": "Extra papas",
  "extra-salsa": "Extra salsa"
};

export default function FatPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
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

  const getRequiredSalsasCount = (productId: string): number => {
    const quantity = orderQuantity[productId] || 1;
    let baseSalsas = 1;
    if (productId === "pequeno-dilema") baseSalsas = 1;
    if (productId === "duo-dilema") baseSalsas = 2;
    if (productId === "todos-pecan") baseSalsas = 3;
    return baseSalsas * quantity;
  };

  const handleExpandCard = (productId: string) => {
    if (isDragging) return;
    setExpandedCard(productId);
    setShowSalsas((prev) => ({ ...prev, [productId]: true }));
    if (!selectedSalsas[productId]) {
      setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
    }
    if (!selectedComplements[productId]) {
      setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
    }
  };

  const handleCloseCard = () => {
    setExpandedCard(null);
    // Limpiar estados
    if (expandedCard) {
      setShowSalsas((prev) => ({ ...prev, [expandedCard]: false }));
      setShowBebidas((prev) => ({ ...prev, [expandedCard]: false }));
      setShowExtras((prev) => ({ ...prev, [expandedCard]: false }));
    }
  };

  const handleIncreaseQuantity = (productId: string) => {
    setOrderQuantity((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1
    }));
    // Limpiar salsas cuando cambia la cantidad
    setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
  };

  const handleDecreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 1;
    if (currentQty > 1) {
      setOrderQuantity((prev) => ({
        ...prev,
        [productId]: currentQty - 1
      }));
      // Limpiar salsas cuando cambia la cantidad
      setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
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
    setCompletedOrders((prev) => [...prev, completedOrder]);

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

    // Eliminar esta orden de completedOrders
    setCompletedOrders((prev) => prev.filter((_, idx) => idx !== orderIndex));

    // Eliminar el plato principal del carrito
    const cartItemId = `${order.productId}-main`;
    removeFromCart(cartItemId);

    // Eliminar los complementos del carrito
    order.complementIds.forEach((complementId) => {
      removeFromCart(complementId);
    });

    // Restaurar los estados para editar
    setOrderQuantity((prev) => ({ ...prev, [order.productId]: order.quantity }));
    setSelectedSalsas((prev) => ({ ...prev, [order.productId]: order.salsas }));
    setComplementsInCart((prev) => ({ ...prev, [order.productId]: order.complementIds }));

    // Abrir el card expandido
    setExpandedCard(order.productId);
    setShowSalsas((prev) => ({ ...prev, [order.productId]: true }));
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b-2 border-red-500 neon-border-fat sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
            <h1 className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-black tracking-tight">
              <span className="text-amber-400 gold-glow inline-flex items-center">
                S
                <span className="relative inline-block">
                  A
                </span>
                <span className="relative inline-block">
                  N
                </span>
                <span className="relative inline-block">
                  T
                </span>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-900/40 via-orange-900/40 to-red-900/40 border-b-2 border-red-500/30 py-5 md:py-8">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <div className="text-4xl md:text-6xl mb-1.5 md:mb-3 filter drop-shadow-lg">🍗</div>
          <h2 className="text-3xl md:text-5xl font-black mb-2.5 md:mb-3 text-red-400 neon-glow-fat">
            Alitas Irresistibles
          </h2>
          <p className="text-sm md:text-xl font-light text-orange-200">
            Rendirte al placer nunca fue tan bueno
          </p>
        </div>
      </section>

      {/* Products Carousel */}
      <section className={`container mx-auto px-3 md:px-4 py-4 md:py-6 transition-all duration-300 ${totalItems > 0 ? 'pb-20 md:pb-16' : 'pb-4 md:pb-6'}`}>
        <h3 className="text-xl md:text-2xl font-black text-white mb-3 md:mb-4 flex items-center gap-2">
          <span className="text-red-400 neon-glow-fat">Nuestras Alitas</span>
          <span className="text-amber-400 gold-glow text-base md:text-lg">★</span>
        </h3>

        {/* Carousel Container */}
        <div className="relative flex items-center justify-center">
          {/* Left Arrow - Hide on mobile */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-8 md:-left-12 top-1/2 -translate-y-1/2 z-10 text-red-400 hover:text-red-300 text-2xl md:text-4xl font-bold transition-all neon-glow-fat hidden sm:block"
            aria-label="Anterior"
          >
            &lt;
          </button>

          {/* Scrollable Products */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex items-start gap-3 md:gap-4 overflow-x-auto overflow-y-visible scrollbar-hide px-2 md:px-4 py-4 md:py-6 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} snap-x snap-mandatory md:snap-none`}
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
                  onMouseEnter={() => handleCardHover(product.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`bg-gray-900 rounded-xl border-2 overflow-visible flex-shrink-0 transition-all duration-300 ease-out
                    border-red-400 neon-border-fat shadow-xl shadow-red-500/30
                    ${isExpanded
                      ? 'w-[320px] md:w-[380px] z-20'
                      : 'w-[280px] md:w-[260px]'
                    }
                    ${!isExpanded && hoveredCard === product.id && !expandedCard
                      ? 'md:scale-105 md:-translate-y-2 md:shadow-2xl md:shadow-red-500/50 z-10'
                      : !isExpanded && !expandedCard ? 'md:border-red-500/30 md:shadow-none scale-100 translate-y-0' : ''
                    }
                    snap-center
                  `}
                  style={{
                    transformOrigin: 'center center',
                  }}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 h-24 md:h-28 flex items-center justify-center border-b-2 border-red-500/30 rounded-t-xl overflow-hidden">
                    <span className="text-4xl md:text-5xl filter drop-shadow-lg">{product.image}</span>
                  </div>
                  <div className="p-3 md:p-4">
                    <h4 className="text-sm md:text-base font-bold text-white mb-1 md:mb-1.5 truncate">
                      {product.name}
                    </h4>
                    <p className="text-orange-200/70 text-[11px] md:text-xs mb-2 md:mb-3 line-clamp-2 h-7 md:h-8">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <span className="text-base md:text-lg font-black text-amber-400 gold-glow">
                        S/ {product.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecreaseQuantity(product.id);
                          }}
                          className="w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-8 text-center text-sm">
                          {orderQuantity[product.id] || 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncreaseQuantity(product.id);
                          }}
                          className="w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Botón Elige tu salsa - Visible siempre */}
                    {!isExpanded && (
                      <button
                        onClick={() => handleExpandCard(product.id)}
                        className="w-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 rounded-lg p-2 transition-all shadow-sm shadow-amber-500/20 flex items-center justify-center gap-2"
                      >
                        <span className="text-sm">🌶️</span>
                        <span className="text-white text-xs font-bold">
                          Elige tu{requiredSalsas > 1 ? 's' : ''} salsa{requiredSalsas > 1 ? 's' : ''}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-3 md:px-4 pb-3 md:pb-4 border-t-2 border-red-500/30 pt-3">
                      {/* Botón de Cerrar */}
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={handleCloseCard}
                          className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>Mostrar menos</span>
                          <span className="text-lg">×</span>
                        </button>
                      </div>

                      {/* Selector de Salsas - Acordeón */}
                      <div className="mb-3">
                        <button
                          onClick={() => setShowSalsas((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                          className={`w-full flex items-center justify-between rounded-lg p-2 transition-all shadow-sm border
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{canAdd ? '✓' : '🌶️'}</span>
                            <span className={`text-xs font-bold ${canAdd ? 'text-green-400' : 'text-white'}`}>
                              {canAdd
                                ? `Salsas seleccionadas (${requiredSalsas})`
                                : `Elige tu${requiredSalsas > 1 ? 's' : ''} salsa${requiredSalsas > 1 ? 's' : ''}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold ${canAdd ? 'text-green-400' : 'text-amber-400'}`}>
                              {currentSalsas.length}/{requiredSalsas}
                            </span>
                            <span className={`text-xs ${canAdd ? 'text-green-400' : 'text-amber-400'}`}>
                              {showSalsas[product.id] ? '▼' : '▶'}
                            </span>
                          </div>
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            showSalsas[product.id]
                              ? 'max-h-[600px] opacity-100 mt-2'
                              : 'max-h-0 opacity-0 mt-0'
                          }`}
                        >
                          <div className="space-y-1">
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
                                  className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 border border-amber-500/10"
                                >
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <span className={`text-[10px] ${count > 0 ? 'text-amber-400 font-bold' : 'text-white'}`}>
                                      {salsa.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {count > 0 && (
                                      <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">
                                        x{count}
                                      </span>
                                    )}
                                    {count > 0 && (
                                      <button
                                        onClick={() => handleSalsaToggle(product.id, salsa.id, 'remove')}
                                        className="px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-red-600 hover:bg-red-500 text-white"
                                      >
                                        −
                                      </button>
                                    )}
                                    {showAddButton && (
                                      <button
                                        onClick={() => handleSalsaToggle(product.id, salsa.id, 'add')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
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
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Complementos */}
                      <div className="mb-3">
                        <h5 className="text-xs font-bold text-white mb-2">Complementos (Opcional)</h5>

                        {/* Bebidas */}
                        <div className="mb-2">
                          <button
                            onClick={() => setShowBebidas((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                            className="w-full flex items-center justify-between bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg p-2 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🥤</span>
                              <span className="text-white text-xs font-bold">Bebidas</span>
                            </div>
                            <span className="text-red-400 text-xs">{showBebidas[product.id] ? '▼' : '▶'}</span>
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
                                return (
                                  <div
                                    key={bebida.id}
                                    className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 border border-red-500/10"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm">{bebida.emoji}</span>
                                      <span className="text-white text-[10px]">{bebida.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-amber-400 text-[10px] font-bold">S/ {bebida.price.toFixed(2)}</span>
                                      <button
                                        onClick={() => handleAddComplement(product.id, bebidaProduct)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
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
                            className="w-full flex items-center justify-between bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg p-2 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🍟</span>
                              <span className="text-white text-xs font-bold">Extras</span>
                            </div>
                            <span className="text-red-400 text-xs">{showExtras[product.id] ? '▼' : '▶'}</span>
                          </button>

                          {showExtras[product.id] && (
                            <div className="mt-2 space-y-1">
                              {[
                                { id: "extra-papas", name: "Extra papas", emoji: "🍟", price: 4.00 },
                                { id: "extra-salsa", name: "Extra salsa", emoji: "🥫", price: 3.00 },
                              ].map((extra) => {
                                const extraProduct: Product = {
                                  id: extra.id,
                                  name: extra.name,
                                  description: extra.name,
                                  price: extra.price,
                                  image: extra.emoji,
                                  category: "bebida"
                                };
                                const wasRecentlyAdded = recentlyAdded.has(`${product.id}-${extra.id}`);
                                return (
                                  <div
                                    key={extra.id}
                                    className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 border border-red-500/10"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm">{extra.emoji}</span>
                                      <span className="text-white text-[10px]">{extra.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-amber-400 text-[10px] font-bold">S/ {extra.price.toFixed(2)}</span>
                                      <button
                                        onClick={() => handleAddComplement(product.id, extraProduct)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
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
                      </div>

                      {/* Botón Listo */}
                      <button
                        onClick={() => handleCompleteOrder(product)}
                        disabled={!canAdd}
                        className={`w-full py-2.5 rounded font-bold text-sm transition-all
                          ${canAdd
                            ? 'bg-red-500 hover:bg-red-400 text-white neon-border-fat cursor-pointer active:scale-95'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'
                          }
                        `}
                      >
                        {canAdd ? 'Agregar orden' : `Selecciona ${requiredSalsas} salsa${requiredSalsas > 1 ? 's' : ''}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Arrow - Hide on mobile */}
          <button
            onClick={() => scroll('right')}
            className="absolute -right-8 md:-right-12 top-1/2 -translate-y-1/2 z-10 text-red-400 hover:text-red-300 text-2xl md:text-4xl font-bold transition-all neon-glow-fat hidden sm:block"
            aria-label="Siguiente"
          >
            &gt;
          </button>
        </div>

        {/* Sección de órdenes agregadas */}
        {completedOrders.length > 0 && (
          <div className="container mx-auto px-3 md:px-4 mt-6">
            <h3 className="text-lg md:text-xl font-black text-amber-400 mb-3 gold-glow">
              Tu orden
            </h3>
            <div className="space-y-3">
              {completedOrders.map((order, index) => {
                const product = products.find((p) => p.id === order.productId);
                if (!product) return null;

                return (
                  <div
                    key={`${order.productId}-${index}`}
                    className="bg-gray-900 rounded-lg border-2 border-red-400/30 p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-1">
                          {order.quantity > 1 ? `${order.quantity}x ` : ''}{product.name}
                        </h4>
                        <div className="text-[11px] space-y-1">
                          <div className="text-amber-300">
                            🌶️ Salsas: {order.salsas
                              .map((sId) => salsas.find((s) => s.id === sId)?.name)
                              .filter((name) => name)
                              .join(", ")}
                          </div>
                          {order.complementIds.length > 0 && (
                            <div className="text-red-300">
                              🍟 Complementos: {order.complementIds
                                .map((compId) => availableComplements[compId])
                                .filter((name) => name)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditOrder(index)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold ml-2 px-2 py-1 border border-red-400/30 rounded"
                      >
                        Editar
                      </button>
                    </div>
                    <div className="text-amber-400 font-bold text-sm gold-glow">
                      S/ {(product.price * order.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Texto motivacional */}
        {completedOrders.length > 0 && (
          <div className="container mx-auto px-3 md:px-4 mt-4 mb-2">
            <p className="text-center text-xs text-orange-200/70 italic">
              💡 Puedes agregar más órdenes a tu pedido antes de continuar
            </p>
          </div>
        )}
      </section>

      {/* Cart Summary Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-2 border-red-500/50 shadow-lg z-50">
          <div className="container mx-auto px-3 md:px-4 py-2 md:py-2">
            <div className="flex justify-between items-center gap-2">
              <button
                onClick={() => setShowCartModal(true)}
                className="bg-red-500/20 hover:bg-red-500/30 active:scale-95 border border-red-500/50 text-red-400 px-2 md:px-3 py-1.5 md:py-1.5 rounded-lg font-bold text-xs md:text-sm transition-all"
              >
                Ver Pedido
              </button>
              <div className="flex items-center gap-2 md:gap-4">
                <p className="text-amber-400 font-bold text-sm md:text-lg gold-glow">
                  <span className="hidden sm:inline">Total: </span>S/ {totalPrice.toFixed(2)}
                </p>
                <Link
                  href="/checkout"
                  className="bg-red-500 hover:bg-red-400 active:scale-95 text-white px-3 md:px-4 py-1.5 md:py-1.5 rounded-lg font-bold text-xs md:text-sm transition-all neon-border-fat"
                >
                  Continuar<span className="hidden sm:inline"> Pedido</span> →
                </Link>
              </div>
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
                className="w-full bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg font-black text-sm transition-all neon-border-fat block text-center"
              >
                Continuar Pedido →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer decorativo con iconos animados - solo visible cuando no hay items en carrito */}
      {totalItems === 0 && (
        <footer className="fixed bottom-0 left-0 right-0 pointer-events-none z-0">
          <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-8 md:gap-12 opacity-20">
              <span className="text-2xl md:text-3xl text-red-400 neon-glow-fat float-slow">🔥</span>
              <span className="text-xl md:text-2xl text-orange-400 neon-glow-fat bounce-subtle">🍗</span>
              <span className="text-2xl md:text-3xl text-red-400 neon-glow-fat float-slower">🔥</span>
              <span className="text-xl md:text-2xl text-orange-400 neon-glow-fat float-medium">🌶️</span>
              <span className="text-2xl md:text-3xl text-red-400 neon-glow-fat float-slow" style={{animationDelay: '2s'}}>🔥</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <div className="w-3 md:w-6 h-px bg-gradient-to-r from-transparent to-red-400 opacity-30"></div>
              <p className="text-[8px] md:text-xs font-bold tracking-widest text-red-400 neon-glow-fat opacity-30 whitespace-nowrap">
                PREMIUM DARK KITCHEN · DELIVERY ONLY
              </p>
              <div className="w-3 md:w-6 h-px bg-gradient-to-l from-transparent to-red-400 opacity-30"></div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
