"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import WhatsAppButton from "../components/WhatsAppButton";

// ─── Types ───────────────────────────────────────────────────────────────────

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

  const [businessOpen, setBusinessOpen] = useState(false);
  const [nextOpenMsg, setNextOpenMsg] = useState("");

  // Orders that belong to other categories (fit/fat from other pages)
  const [crossCategoryOrders, setCrossCategoryOrders] = useState<
    CompletedOrder[]
  >([]);
  // Taco orders managed on this page
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [taco1, setTaco1] = useState<string | null>(null);
  const [taco2, setTaco2] = useState<string | null>(null);

  // ── On mount: check hours + load sessionStorage ──────────────────────────
  useEffect(() => {
    setBusinessOpen(isBusinessOpen());
    setNextOpenMsg(getNextOpenMessage());

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
        // Deselect taco1
        setTaco1(null);
        return;
      }
      if (taco2 === null) {
        setTaco2(id);
        return;
      }
      if (taco2 === id) {
        // Deselect taco2
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
    setCompletedOrders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCheckout = useCallback(() => {
    // Save to sessionStorage first (checkout reads it)
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
    <div className="min-h-screen bg-black text-white pb-32">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {/* Back */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-400 hover:text-amber-400 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">Volver</span>
          </Link>

          {/* Logo */}
          <Image
            src="/logoprincipal.png"
            alt="Santo Dilema"
            width={150}
            height={45}
            className="object-contain"
            priority
          />

          {/* Cart badge */}
          <div className="w-16 flex justify-end">
            {duoCount > 0 && (
              <div className="flex items-center gap-1 bg-amber-500 text-black rounded-full px-2.5 py-1">
                <span className="text-xs font-bold">🌮 {duoCount}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Closed banner ──────────────────────────────────────────────────── */}
      {!businessOpen && (
        <div className="bg-gray-900 border-b border-amber-500/30 px-4 py-3 text-center">
          <p className="text-amber-400 text-sm font-semibold">
            ⏰ Estamos cerrados por ahora
          </p>
          <p className="text-gray-400 text-xs mt-0.5">{nextOpenMsg}</p>
        </div>
      )}

      {/* ── Hero / title ───────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
        <div className="text-center mb-8">
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">
            Dark Kitchen · Lima
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">
            Tacos
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Elige tus 2 sabores y arma tu dúo por{" "}
            <span className="text-amber-400 font-bold">S/ 24.90</span>
          </p>
        </div>

        {/* ── Flavor cards ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {flavors.map((flavor) => (
            <div
              key={flavor.id}
              className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-amber-500/50 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 p-4">
                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                  <Image
                    src={flavor.image}
                    alt={flavor.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-amber-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">
                    {flavor.tagline}
                  </p>
                  <h2 className="text-white font-black text-lg uppercase leading-tight">
                    {flavor.name}
                  </h2>
                  <p className="text-gray-400 text-xs mt-1.5 leading-relaxed line-clamp-3">
                    {flavor.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Orders list ──────────────────────────────────────────────────── */}
        {completedOrders.length > 0 && (
          <div className="mt-8">
            <h3 className="text-white font-bold uppercase tracking-wide text-sm mb-3">
              Tu pedido
            </h3>
            <div className="space-y-2">
              {completedOrders.map((order, index) => (
                <div
                  key={index}
                  className="bg-gray-900 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">
                      Dúo #{index + 1}
                    </p>
                    <p className="text-white text-sm font-medium mt-0.5">
                      {getFlavorName(order.salsas[0])} +{" "}
                      {getFlavorName(order.salsas[1])}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">S/ 24.90</p>
                  </div>
                  <button
                    onClick={() => handleDeleteOrder(index)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                    aria-label="Eliminar dúo"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Running total */}
            <div className="mt-3 flex justify-between items-center px-1">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="text-amber-400 font-black text-xl">
                S/ {total.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom bar ──────────────────────────────────────────────── */}
      {businessOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3">
          <div className="max-w-lg mx-auto">
            {duoCount === 0 ? (
              <button
                onClick={openModal}
                className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-base uppercase tracking-widest rounded-2xl py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ boxShadow: "0 0 20px rgba(245,158,11,0.4)" }}
              >
                🌮 Armar mi dúo →
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={openModal}
                  className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-sm rounded-2xl px-4 py-4 transition-all duration-200 border border-amber-500/30"
                >
                  + Otro
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-sm uppercase tracking-wide rounded-2xl py-4 transition-all duration-200 flex items-center justify-between px-5 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ boxShadow: "0 0 20px rgba(245,158,11,0.4)" }}
                >
                  <span>
                    {duoCount} dúo{duoCount > 1 ? "s" : ""}
                  </span>
                  <span>Pedir →</span>
                  <span>S/ {total.toFixed(2)}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom-sheet modal ─────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          modalOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeModal}
      />

      {/* Sheet */}
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex gap-3 mb-5">
            {/* Step 1 */}
            <div
              className={`flex-1 rounded-xl px-3 py-2 border transition-all duration-200 ${
                step1Done
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {/* Step 2 */}
            <div
              className={`flex-1 rounded-xl px-3 py-2 border transition-all duration-200 ${
                step2Done
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : step2Active
                  ? "bg-gray-800 border-amber-500/50 text-gray-300"
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
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
                  style={
                    isSelected
                      ? { boxShadow: "0 0 16px rgba(245,158,11,0.2)" }
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
                        <div className="bg-amber-500 text-black text-[10px] font-black rounded-full w-7 h-7 flex items-center justify-center">
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
            <div className="mt-5 bg-gray-900 border border-amber-500/30 rounded-2xl p-4">
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
                ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
            style={
              bothSelected
                ? { boxShadow: "0 0 20px rgba(245,158,11,0.4)" }
                : {}
            }
          >
            {bothSelected ? "Agregar al pedido ✓" : "Elige 2 sabores"}
          </button>
        </div>
      </div>

      {/* ── WhatsApp button ────────────────────────────────────────────────── */}
      <WhatsAppButton />
    </div>
  );
}
