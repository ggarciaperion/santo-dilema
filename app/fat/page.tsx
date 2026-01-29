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
    id: "alitas-bbq",
    name: "BBQ Clásicas",
    description: "12 alitas bañadas en salsa BBQ ahumada",
    price: 28.90,
    image: "🍗",
    category: "fat",
  },
  {
    id: "alitas-buffalo",
    name: "Buffalo Picantes",
    description: "12 alitas con salsa buffalo y aderezo ranch",
    price: 29.90,
    image: "🔥",
    category: "fat",
  },
  {
    id: "alitas-miel-mostaza",
    name: "Miel Mostaza",
    description: "12 alitas glaseadas con miel y mostaza Dijon",
    price: 28.90,
    image: "🍗",
    category: "fat",
  },
  {
    id: "alitas-teriyaki",
    name: "Teriyaki Supreme",
    description: "12 alitas con glaseado teriyaki y ajonjolí",
    price: 31.90,
    image: "🍗",
    category: "fat",
  },
  {
    id: "combo-extremo",
    name: "Combo Extremo",
    description: "24 alitas + papas fritas + bebida grande",
    price: 49.90,
    image: "🍔",
    category: "fat",
  },
  {
    id: "alitas-parmesano",
    name: "Parmesano & Ajo",
    description: "12 alitas con parmesano, ajo y hierbas",
    price: 32.90,
    image: "🧀",
    category: "fat",
  },
];

export default function FatPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isDragging, setIsDragging] = useState(false);
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
            className={`flex gap-3 md:gap-4 overflow-x-auto overflow-y-visible scrollbar-hide px-2 md:px-4 py-4 md:py-6 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} snap-x snap-mandatory md:snap-none`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none' }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                ref={(el) => { cardRefs.current[product.id] = el; }}
                onMouseEnter={() => handleCardHover(product.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-gray-900 rounded-xl border-2 overflow-visible flex-shrink-0 w-[280px] md:w-[260px] snap-center transition-all duration-300 ease-out
                  border-red-400 neon-border-fat shadow-xl shadow-red-500/30
                  ${hoveredCard === product.id
                    ? 'md:scale-105 md:-translate-y-2 md:shadow-2xl md:shadow-red-500/50 z-10'
                    : 'md:border-red-500/30 md:shadow-none scale-100 translate-y-0'
                }`}
                style={{
                  transformOrigin: 'center center',
                }}
              >
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
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-black/40 rounded border border-red-500/30">
                      <button
                        onClick={() => updateProductQuantity(product.id, getQuantity(product.id) - 1)}
                        className="px-2 md:px-2 py-1.5 md:py-1.5 text-red-400 hover:text-red-300 font-bold transition-colors text-sm active:scale-95"
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
                        className="px-2 md:px-2 py-1.5 md:py-1.5 text-red-400 hover:text-red-300 font-bold transition-colors text-sm active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product, getQuantity(product.id))}
                      className="flex-1 bg-red-500 hover:bg-red-400 active:scale-95 text-white px-3 py-2 md:py-1.5 rounded font-bold text-xs transition-all neon-border-fat"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

              {/* Complementos */}
              <div className="mt-3 pt-2 border-t border-red-500/30">
                <h4 className="text-xs font-bold text-white mb-2">Complementos</h4>

                <div className="grid grid-cols-2 gap-2">
                  {/* Bebidas */}
                  <div>
                    <h5 className="text-[10px] font-semibold text-red-400 mb-1">Bebidas</h5>
                    <div className="space-y-1">
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
                            className="flex items-center justify-between bg-gray-800/30 rounded p-1 border border-red-500/10"
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{bebida.emoji}</span>
                              <span className="text-white text-[9px]">{bebida.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-400 text-[9px] font-bold">S/ {bebida.price.toFixed(2)}</span>
                              <button
                                onClick={() => addToCart(bebidaProduct, 1)}
                                className="bg-red-600 hover:bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extras */}
                  <div>
                    <h5 className="text-[10px] font-semibold text-red-400 mb-1">Extras</h5>
                    <div className="space-y-1">
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
                            className="flex items-center justify-between bg-gray-800/30 rounded p-1 border border-red-500/10"
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{extra.emoji}</span>
                              <span className="text-white text-[9px]">{extra.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-400 text-[9px] font-bold">S/ {extra.price.toFixed(2)}</span>
                              <button
                                onClick={() => addToCart(extraProduct, 1)}
                                className="bg-red-600 hover:bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
