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

const products: Product[] = [
  {
    id: "ensalada-clasica",
    name: "CLÁSICA FRESH BOWL",
    description: "Lechuga, tomate, pepino, zanahoria y aderezo light",
    price: 18.90,
    image: "🥗",
    category: "fit",
  },
  {
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    description: "Pollo grillado, quinoa, espinaca, palta y vinagreta",
    price: 24.90,
    image: "🥙",
    category: "fit",
  },
  {
    id: "ensalada-caesar",
    name: "PROTEIN FIT BOWL",
    description: "Lechuga romana, parmesano, crutones integrales y pollo",
    price: 22.90,
    image: "🥗",
    category: "fit",
  },
  {
    id: "ensalada-mediterranea",
    name: "TUNA FRESH BOWL",
    description: "Mix de verdes, queso feta, aceitunas, tomate cherry",
    price: 21.90,
    image: "🥙",
    category: "fit",
  },
];

export default function FitPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showBebidas, setShowBebidas] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    // Reset quantity after adding
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
    }
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
    setHoveredCard(productId);
    const cardElement = cardRefs.current[productId];
    const container = scrollContainerRef.current;

    if (cardElement && container) {
      const cardRect = cardElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if card is partially visible on the right
      if (cardRect.right > containerRect.right) {
        const scrollAmount = cardRect.right - containerRect.right + 20;
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
      // Check if card is partially visible on the left
      else if (cardRect.left < containerRect.left) {
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
    const walk = (x - startX) * 2; // Multiplicador para velocidad de scroll
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b-2 border-cyan-500 neon-border-fit sticky top-0 z-10">
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

      {/* Hero Section - Banner */}
      <section className="relative w-full overflow-hidden bg-black pt-6 md:pt-0">
        <div className="relative w-full bg-black">
          {/* Banner para móvil */}
          <img
            src="/bannermovilfi.png?v=1"
            alt="Banner promocional FIT"
            className="block md:hidden w-full h-auto object-cover"
          />
          {/* Banner para PC/Tablet */}
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

      {/* Products Carousel */}
      <section className={`container mx-auto px-3 md:px-4 py-4 md:py-6 transition-all duration-300 ${totalItems > 0 ? 'pb-20 md:pb-16' : 'pb-4 md:pb-6'}`}>

        {/* Carousel Container */}
        <div className="relative flex items-center justify-center">
          {/* Scrollable Products */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex gap-3 md:gap-4 overflow-x-auto overflow-y-visible scrollbar-hide px-2 md:px-4 py-4 md:py-6 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} snap-x snap-mandatory md:snap-none`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none' }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                ref={(el) => (cardRefs.current[product.id] = el)}
                onMouseEnter={() => handleCardHover(product.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-gray-900 rounded-xl border-2 overflow-visible flex-shrink-0 w-[280px] md:w-[260px] snap-center transition-all duration-300 ease-out
                  border-cyan-400 neon-border-fit shadow-xl shadow-cyan-500/30
                  ${hoveredCard === product.id
                    ? 'md:scale-105 md:-translate-y-2 md:shadow-2xl md:shadow-cyan-500/50 z-10'
                    : 'md:border-cyan-500/30 md:shadow-none scale-100 translate-y-0'
                }`}
                style={{
                  transformOrigin: 'center center',
                }}
              >
                <div className="bg-gradient-to-br from-cyan-900/40 to-teal-900/40 h-24 md:h-28 flex items-center justify-center border-b-2 border-cyan-500/30 rounded-t-xl overflow-hidden">
                  <span className="text-4xl md:text-5xl filter drop-shadow-lg">{product.image}</span>
                </div>
                <div className="p-3 md:p-4">
                  <h4 className="text-sm md:text-base font-bold text-white mb-1 md:mb-1.5 truncate">
                    {product.name}
                  </h4>
                  <p className="text-cyan-200/70 text-[11px] md:text-xs mb-2 md:mb-3 line-clamp-2 h-7 md:h-8">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <span className="text-base md:text-lg font-black text-amber-400 gold-glow">
                      S/ {product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-black/40 rounded border border-cyan-500/30">
                      <button
                        onClick={() => updateProductQuantity(product.id, getQuantity(product.id) - 1)}
                        className="px-2 md:px-2 py-1.5 md:py-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors text-sm active:scale-95"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={getQuantity(product.id)}
                        onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 1)}
                        className="w-9 md:w-10 text-center bg-transparent text-white font-bold text-xs outline-none"
                      />
                      <button
                        onClick={() => updateProductQuantity(product.id, getQuantity(product.id) + 1)}
                        className="px-2 md:px-2 py-1.5 md:py-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors text-sm active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product, getQuantity(product.id))}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black px-3 py-2 md:py-1.5 rounded font-bold text-xs transition-all neon-border-fit"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Summary Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-2 border-cyan-500/50 shadow-lg z-50">
          <div className="container mx-auto px-3 md:px-4 py-2 md:py-2">
            <div className="flex justify-between items-center gap-2">
              <button
                onClick={() => setShowCartModal(true)}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 border border-cyan-500/50 text-cyan-400 px-2 md:px-3 py-1.5 md:py-1.5 rounded-lg font-bold text-xs md:text-sm transition-all"
              >
                Ver Pedido
              </button>
              <div className="flex items-center gap-2 md:gap-4">
                <p className="text-amber-400 font-bold text-sm md:text-lg gold-glow">
                  <span className="hidden sm:inline">Total: </span>S/ {totalPrice.toFixed(2)}
                </p>
                <Link
                  href="/checkout"
                  className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black px-3 md:px-4 py-1.5 md:py-1.5 rounded-lg font-bold text-xs md:text-sm transition-all neon-border-fit"
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
          <div className="bg-gray-900 rounded-xl border-2 border-cyan-500 neon-border-fit max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-3 border-b-2 border-cyan-500/30 flex justify-between items-center">
              <h3 className="text-lg font-black text-cyan-400 neon-glow-fit">
                Tu Pedido
              </h3>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-cyan-400 hover:text-cyan-300 text-2xl font-bold transition-all"
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
                    className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2 border border-cyan-500/20"
                  >
                    <div className="text-2xl">{item.product.image}</div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-xs">
                        {item.product.name}
                      </h4>
                      <p className="text-cyan-400 text-xs">
                        S/ {item.product.price.toFixed(2)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-white font-bold w-7 text-center text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
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

              {/* Complementos */}
              <div className="mt-3 pt-2 border-t border-cyan-500/30">
                <h4 className="text-xs font-bold text-white mb-2">Complementos</h4>

                {/* Bebidas - Acordeón */}
                <div className="mb-2">
                  <button
                    onClick={() => setShowBebidas(!showBebidas)}
                    className="w-full flex items-center justify-between bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg p-2 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🥤</span>
                      <span className="text-white text-xs font-bold">Bebidas</span>
                    </div>
                    <span className="text-cyan-400 text-sm">{showBebidas ? '▼' : '▶'}</span>
                  </button>

                  {showBebidas && (
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
                              <button
                                onClick={() => addToCart(bebidaProduct, 1)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Extras - Acordeón */}
                <div className="mb-2">
                  <button
                    onClick={() => setShowExtras(!showExtras)}
                    className="w-full flex items-center justify-between bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg p-2 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🍟</span>
                      <span className="text-white text-xs font-bold">Extras</span>
                    </div>
                    <span className="text-cyan-400 text-sm">{showExtras ? '▼' : '▶'}</span>
                  </button>

                  {showExtras && (
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
                        return (
                          <div
                            key={extra.id}
                            className="flex items-center justify-between bg-gray-800/30 rounded p-1.5 border border-cyan-500/10"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{extra.emoji}</span>
                              <span className="text-white text-[10px]">{extra.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-400 text-[10px] font-bold">S/ {extra.price.toFixed(2)}</span>
                              <button
                                onClick={() => addToCart(extraProduct, 1)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t-2 border-cyan-500/30 bg-gray-800/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold text-sm">Total:</span>
                <span className="text-amber-400 font-black text-xl gold-glow">
                  S/ {totalPrice.toFixed(2)}
                </span>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-black text-sm transition-all neon-border-fit block text-center"
              >
                Continuar Pedido →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
