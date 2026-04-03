"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import WhatsAppButton from "../components/WhatsAppButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompletedOrder {
  productId: string;
  quantity: number;
  salsas: string[];
  complementIds: string[];
  finalPrice?: number;
  originalPrice?: number;
  discountApplied?: boolean;
  category?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const flavors = [
  {
    id: "santo-crujiente",
    name: "Santo Crujiente",
    tagline: "Crujiente y tentador",
    description:
      "Pollo dorado, lechuga fresca, pico de gallo, cebolla frita, aioli y mayonesa BBQ.",
    image: "/tacoinicio.png",
  },
  {
    id: "tex-dilema",
    name: "Tex Dilema",
    tagline: "Con ese toque tex-mex",
    description:
      "Pollo crispy, lechuga fresca, cebolla frita, guacamole, pico de gallo y cilantro dressing.",
    image: "/tacoinicio.png",
  },
  {
    id: "santo-bacon",
    name: "Santo Bacon",
    tagline: "El que lo prueba, repite",
    description:
      "Pollo crispy, bacon, queso cheddar, pimiento y cebolla salteados, lechuga fresca, pico de gallo y salsa cremosa.",
    image: "/tacoinicio.png",
  },
];

const TACO_DUO_PRODUCT = {
  id: "taco-duo",
  name: "Dúo de Tacos",
  price: 24.9,
  image: "/tacoinicio.png",
  category: "fat" as const,
};

const SESSION_KEY = "santo-dilema-orders";

function getFlavorName(id: string): string {
  return flavors.find((f) => f.id === id)?.name ?? id;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TacosPage() {
  const router = useRouter();
  const { addToCart, clearCart } = useCart();

  const [isOpen, setIsOpen] = useState(isBusinessOpen());
  const [menuStock, setMenuStock] = useState<Record<string, boolean>>({});

  // Orders that belong to other categories (fit/fat from other pages)
  const [crossCategoryOrders, setCrossCategoryOrders] = useState<CompletedOrder[]>([]);
  // Taco orders managed on this page
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [taco1, setTaco1] = useState<string | null>(null);
  const [taco2, setTaco2] = useState<string | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrderIndex, setDeleteOrderIndex] = useState<number | null>(null);

  // ── On mount: check hours + load sessionStorage ──────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setIsOpen(isBusinessOpen()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/menu-stock")
      .then((r) => r.json())
      .then((data) => setMenuStock(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const all: CompletedOrder[] = JSON.parse(raw);
        const cross = all.filter((o) => o.category !== "taco");
        const tacos = all.filter((o) => o.category === "taco");
        setCrossCategoryOrders(cross);
        setCompletedOrders(tacos);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // ── Persist orders to sessionStorage when they change ────────────────────
  useEffect(() => {
    try {
      const all = [...crossCategoryOrders, ...completedOrders];
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }, [crossCategoryOrders, completedOrders]);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openModal = useCallback(() => {
    setTaco1(null);
    setTaco2(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTaco1(null);
    setTaco2(null);
  }, []);

  const handleFlavorClick = useCallback(
    (id: string) => {
      if (taco1 === null) {
        setTaco1(id);
        return;
      }
      if (taco1 === id) {
        setTaco1(null);
        return;
      }
      if (taco2 === null) {
        setTaco2(id);
        return;
      }
      if (taco2 === id) {
        setTaco2(null);
        return;
      }
      // Both slots filled and a different card tapped — replace taco2
      setTaco2(id);
    },
    [taco1, taco2]
  );

  const handleAddOrder = useCallback(() => {
    if (!taco1 || !taco2) return;
    const newOrder: CompletedOrder = {
      productId: "taco-duo",
      quantity: 1,
      salsas: [taco1, taco2],
      complementIds: [],
      finalPrice: 24.9,
      originalPrice: 24.9,
      category: "taco",
    };
    setCompletedOrders((prev) => [...prev, newOrder]);
    closeModal();
  }, [taco1, taco2, closeModal]);

  const handleDeleteOrder = useCallback((index: number) => {
    setDeleteOrderIndex(index);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteOrder = useCallback(() => {
    if (deleteOrderIndex === null) return;
    setCompletedOrders((prev) => prev.filter((_, i) => i !== deleteOrderIndex));
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  }, [deleteOrderIndex]);

  const cancelDeleteOrder = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  }, []);

  const handleCheckout = useCallback(() => {
    const all = [...crossCategoryOrders, ...completedOrders];
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(all));
    clearCart();
    completedOrders.forEach((order) => {
      addToCart(TACO_DUO_PRODUCT, order.quantity);
    });
    router.push("/checkout");
  }, [crossCategoryOrders, completedOrders, clearCart, addToCart, router]);

  // ── Derived values ────────────────────────────────────────────────────────
  const total = completedOrders.length * 24.9;
  const duoCount = completedOrders.length;

  // ── Step indicator for modal ──────────────────────────────────────────────
  const step1Done = taco1 !== null;
  const step2Active = step1Done && taco2 === null;
  const step2Done = taco2 !== null;
  const bothSelected = step1Done && step2Done;

  return (
    <div className="min-h-screen bg-black md:bg-transparent relative overflow-visible">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-gray-900 border-b-2 border-emerald-500 sticky top-0 z-30 overflow-visible neon-border-taco">
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
              className="text-xs md:text-sm font-bold text-red-400 hover:text-red-300 transition-colors px-2 md:px-3 py-1 md:py-1.5 rounded border border-red-500/30 hover:border-red-400 hidden sm:block"
              style={{ textShadow: "0 0 8px rgba(239,68,68,0.5)" }}
            >
              Ver menú Alitas →
            </Link>
            <Link
              href="/fat"
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-500/30 hover:border-red-400 sm:hidden"
            >
              Ver menú Alitas
            </Link>
            <Link
              href="/fit"
              className="text-xs md:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors px-2 md:px-3 py-1 md:py-1.5 rounded border border-cyan-500/30 hover:border-cyan-400 hidden sm:block"
              style={{ textShadow: "0 0 8px rgba(34,211,238,0.5)" }}
            >
              Ver menú Ensaladas →
            </Link>
            <Link
              href="/fit"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded border border-cyan-500/30 hover:border-cyan-400 sm:hidden"
            >
              Ver menú Ensaladas
            </Link>
          </div>
        </div>
      </header>

      {/* ── Business closed banner ─────────────────────────────────────────── */}
      {!isOpen && (
        <div className="bg-gray-900 border-b-2 border-emerald-500/30 px-4 py-3 text-center">
          <p className="text-emerald-400 text-sm font-bold">
            ⏰ Estamos cerrados por ahora
          </p>
          <p className="text-gray-400 text-xs mt-0.5">{getNextOpenMessage()}</p>
        </div>
      )}

      {/* ── Products grid section ─────────────────────────────────────────── */}
      <section className={`container mx-auto px-2 md:px-4 py-3 md:py-5 transition-all duration-300 overflow-visible ${completedOrders.length > 0 ? "pb-20 md:pb-16" : "pb-3 md:pb-3"}`}>

        {/* Page title */}
        <div className="px-3 pt-4 pb-2 text-center">
          <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-2">
            Dark Kitchen · Lima
          </p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
            Tacos
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Elige tus 2 sabores y arma tu dúo por{" "}
            <span className="text-emerald-400 font-bold">S/ 24.90</span>
          </p>
        </div>

        {/* ── Flavor cards grid ─────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center items-center gap-x-3 gap-y-12 md:gap-6 lg:gap-8 px-3 md:px-4 pt-10 pb-8 md:py-8 lg:py-10"
          style={{ overflow: "visible" }}
        >
          {flavors.map((flavor, index) => {
            const isSoldOut = !!menuStock[flavor.id];
            const isLastOdd = index === flavors.length - 1 && flavors.length % 2 !== 0;

            return (
              <div
                key={flavor.id}
                className={isLastOdd ? "col-span-2 md:contents flex justify-center overflow-visible" : "contents"}
                style={isLastOdd ? { overflow: "visible" } : undefined}
              >
                <div
                  className={`bg-gray-900 flex-shrink-0 md:flex-shrink shadow-xl border-2 md:border-2 border-emerald-400 ${isSoldOut ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                    ${isLastOdd ? "w-[calc(50%-0.375rem)] md:w-[240px] lg:w-[260px]" : "w-full md:w-[240px] lg:w-[260px]"}
                  `}
                  style={{
                    boxShadow: "0 0 10px rgba(52,211,153,0.4), 0 0 20px rgba(52,211,153,0.2)",
                    borderRadius: 0,
                    overflow: "visible",
                    position: "relative",
                    zIndex: index + 1,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onClick={() => {
                    if (!isSoldOut) openModal();
                  }}
                >
                  {/* Image area */}
                  <div
                    className="relative flex items-center justify-center bg-black h-40 md:h-40 border-0"
                    style={{ overflow: "visible" }}
                  >
                    <Image
                      src={flavor.image}
                      alt={flavor.name}
                      width={300}
                      height={300}
                      className="absolute object-cover drop-shadow-2xl"
                      style={{
                        width: "150%",
                        height: "160%",
                        top: "-30%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        objectPosition: "center 55%",
                        zIndex: 10,
                      }}
                    />
                    {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: "rgba(0,0,0,0.45)" }}>
                        <div
                          className="border-4 border-red-500 rounded-sm px-3 py-1 select-none"
                          style={{ transform: "rotate(-20deg)", boxShadow: "0 0 12px rgba(239,68,68,0.7)" }}
                        >
                          <span className="text-red-500 font-black text-xl md:text-2xl tracking-widest uppercase" style={{ textShadow: "0 0 8px rgba(239,68,68,0.8)" }}>
                            AGOTADO
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info area */}
                  <div className="p-3 md:p-2.5">
                    <h4 className="text-xs md:text-sm font-bold text-white mb-1.5 md:mb-1 truncate">
                      {flavor.name}
                    </h4>
                    <p className="text-emerald-200/70 text-[10px] md:text-[11px] mb-1.5 md:mb-2">
                      {flavor.description}
                    </p>
                    <div className="flex items-center justify-between mb-1.5 md:mb-2">
                      <span className="text-sm md:text-base font-black text-emerald-400 neon-glow-taco">
                        S/ 24.90
                      </span>
                      {!isSoldOut && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal();
                          }}
                          className="w-5 h-5 md:w-6 md:h-6 text-white rounded text-xs font-bold transition-all flex items-center justify-center bg-emerald-500 hover:bg-emerald-400"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Duo count hint ─────────────────────────────────────────────────── */}
        {completedOrders.length > 0 && (
          <div className="container mx-auto px-3 md:px-4 mt-4 mb-2">
            <p className="text-center text-xs text-emerald-200/70 italic">
              Puedes agregar más dúos a tu pedido antes de continuar
            </p>
          </div>
        )}

        {/* ── Spacer for fixed bottom bar ─────────────────────────────────── */}
        {completedOrders.length > 0 && (
          <div className="h-24 md:h-28" />
        )}
      </section>

      {/* ── Orders list (injected above the bottom bar) ────────────────────── */}
      {completedOrders.length > 0 && (
        <div className="container mx-auto px-3 md:px-4 pb-4">
          <div
            className="bg-gray-900 border-2 border-emerald-500/40 rounded-lg p-4 md:p-5"
            style={{ boxShadow: "0 0 10px rgba(52,211,153,0.2)" }}
          >
            <h3 className="text-white font-bold uppercase tracking-wide text-sm mb-3 border-b border-emerald-500/20 pb-2">
              Tu pedido
            </h3>
            <div className="space-y-2">
              {completedOrders.map((order, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">
                      Dúo #{index + 1}
                    </p>
                    <p className="text-white text-sm font-medium mt-0.5">
                      {getFlavorName(order.salsas[0])} + {getFlavorName(order.salsas[1])}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">S/ 24.90</p>
                  </div>
                  <button
                    onClick={() => handleDeleteOrder(index)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                    aria-label="Eliminar dúo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Running total */}
            <div className="mt-3 flex justify-between items-center px-1 border-t border-emerald-500/20 pt-3">
              <span className="text-gray-400 text-sm font-bold">Total</span>
              <span className="text-emerald-400 font-black text-xl" style={{ textShadow: "0 0 8px rgba(52,211,153,0.5)" }}>
                S/ {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky bottom bar ──────────────────────────────────────────────── */}
      {completedOrders.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-emerald-500/50 shadow-2xl z-50"
          style={{ boxShadow: "0 0 20px rgba(52,211,153,0.3)" }}
        >
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 lg:py-5">
            <div className="flex justify-between items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm md:text-lg">Total</span>
                <span className="text-emerald-400 font-black text-xl md:text-3xl" style={{ textShadow: "0 0 8px rgba(52,211,153,0.5)" }}>
                  S/ {total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openModal}
                  className="bg-gray-800 hover:bg-gray-700 text-emerald-400 font-bold text-sm rounded-lg px-4 py-2.5 md:py-3 transition-all border border-emerald-500/30"
                >
                  + Otro
                </button>
                {isOpen ? (
                  <button
                    onClick={handleCheckout}
                    className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black px-5 md:px-7 py-2.5 md:py-3 rounded-lg font-black text-sm md:text-lg transition-all neon-border-taco"
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
        </div>
      )}

      {/* ── Add first duo bottom bar (when no orders yet) ──────────────────── */}
      {completedOrders.length === 0 && isOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-emerald-500/50 shadow-2xl z-50"
          style={{ boxShadow: "0 0 20px rgba(52,211,153,0.3)" }}
        >
          <div className="container mx-auto px-4 py-3">
            <button
              onClick={openModal}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-black text-base uppercase tracking-widest rounded-lg py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] neon-border-taco"
            >
              Armar mi dúo →
            </button>
          </div>
        </div>
      )}

      {/* ── Duo selector modal ─────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeModal}
      />

      {/* Modal container */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-950 rounded-t-3xl border-t border-gray-800 transition-transform duration-[400ms] ease-out ${
          modalOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Modal header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-black text-xl uppercase tracking-tight">
                Arma tu dúo
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Elige 2 sabores · S/ 24.90
              </p>
            </div>
            <button
              onClick={closeModal}
              className="text-gray-600 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex gap-3 mb-5">
            {/* Step 1 */}
            <div
              className={`flex-1 rounded-xl px-3 py-2 border transition-all duration-200 ${
                step1Done
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-gray-900 border-gray-700 text-gray-500"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Taco 1
              </p>
              <p className="text-xs font-semibold mt-0.5 truncate">
                {taco1 ? getFlavorName(taco1) : "Elige un sabor"}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Step 2 */}
            <div
              className={`flex-1 rounded-xl px-3 py-2 border transition-all duration-200 ${
                step2Done
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : step2Active
                  ? "bg-gray-800 border-emerald-500/50 text-gray-300"
                  : "bg-gray-900 border-gray-700 text-gray-600"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Taco 2
              </p>
              <p className="text-xs font-semibold mt-0.5 truncate">
                {taco2
                  ? getFlavorName(taco2)
                  : step2Active
                  ? "¿Y el segundo?"
                  : "Elige un sabor"}
              </p>
            </div>
          </div>

          {/* Flavor selector cards */}
          <div className="space-y-3">
            {flavors.map((flavor) => {
              const isSelectedAsTaco1 = taco1 === flavor.id;
              const isSelectedAsTaco2 = taco2 === flavor.id;
              const isSelected = isSelectedAsTaco1 || isSelectedAsTaco2;

              return (
                <button
                  key={flavor.id}
                  onClick={() => handleFlavorClick(flavor.id)}
                  className={`w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
                  style={
                    isSelected
                      ? { boxShadow: "0 0 16px rgba(52,211,153,0.2)" }
                      : {}
                  }
                >
                  <div className="flex items-center gap-4 p-3">
                    {/* Image */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
                      <Image
                        src={flavor.image}
                        alt={flavor.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black uppercase text-sm leading-tight">
                        {flavor.name}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 truncate">
                        {flavor.tagline}
                      </p>
                    </div>

                    {/* Selection badge */}
                    <div className="flex-shrink-0">
                      {isSelectedAsTaco1 && (
                        <div className="bg-emerald-500 text-black text-[10px] font-black rounded-full w-7 h-7 flex items-center justify-center">
                          T1
                        </div>
                      )}
                      {isSelectedAsTaco2 && (
                        <div className="bg-orange-500 text-black text-[10px] font-black rounded-full w-7 h-7 flex items-center justify-center">
                          T2
                        </div>
                      )}
                      {!isSelected && (
                        <div className="border-2 border-gray-700 rounded-full w-7 h-7 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-gray-700" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Duo preview */}
          {bothSelected && (
            <div className="mt-5 bg-gray-900 border border-emerald-500/30 rounded-2xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
                Tu dúo
              </p>
              <p className="text-white font-bold text-sm">
                {getFlavorName(taco1!)} + {getFlavorName(taco2!)}
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAddOrder}
            disabled={!bothSelected}
            className={`mt-4 w-full font-black text-base uppercase tracking-widest rounded-2xl py-4 transition-all duration-200 ${
              bothSelected
                ? "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
            style={
              bothSelected
                ? { boxShadow: "0 0 20px rgba(52,211,153,0.4)" }
                : {}
            }
          >
            {bothSelected ? "Agregar al pedido ✓" : "Elige 2 sabores"}
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal && deleteOrderIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            className="bg-gray-900 border-2 border-emerald-500 rounded-lg p-6 max-w-md w-full"
            style={{ boxShadow: "0 0 10px rgba(52,211,153,0.4), 0 0 20px rgba(52,211,153,0.2)" }}
          >
            <h3 className="text-xl font-black text-emerald-400 mb-4 text-center"
              style={{ textShadow: "0 0 8px rgba(52,211,153,0.5)" }}
            >
              ¡Qué dilema!
            </h3>
            <div className="mb-6 text-sm">
              <p className="text-white mb-3 text-center">
                ¿Estás seguro que deseas quitar este dúo de tu pedido?
              </p>
              <div className="bg-gray-800/50 border border-emerald-400/30 rounded-lg p-4">
                <p className="text-emerald-400 font-bold text-base mb-1">
                  Dúo #{deleteOrderIndex + 1}
                </p>
                <p className="text-white text-sm">
                  {getFlavorName(completedOrders[deleteOrderIndex]?.salsas[0])} +{" "}
                  {getFlavorName(completedOrders[deleteOrderIndex]?.salsas[1])}
                </p>
                <p className="text-emerald-400 font-bold mt-1">S/ 24.90</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteOrder}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all border border-gray-500"
              >
                Volver
              </button>
              <button
                onClick={confirmDeleteOrder}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-3 rounded-lg font-bold transition-all"
                style={{ boxShadow: "0 0 8px rgba(52,211,153,0.4)" }}
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp button ────────────────────────────────────────────────── */}
      <WhatsAppButton />
    </div>
  );
}
