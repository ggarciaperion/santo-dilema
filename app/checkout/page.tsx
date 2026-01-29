"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, totalItems, totalPrice } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    phone: "",
    address: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [showDniSearch, setShowDniSearch] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Validar si el formulario está completo
  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.dni.length === 8 &&
      formData.phone.length === 9 &&
      formData.address.trim() !== ""
    );
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (totalItems === 0 && !orderPlaced) {
      router.push("/");
    }
  }, [totalItems, orderPlaced, router]);

  const handleNumberInput = (field: 'dni' | 'phone', value: string) => {
    // Solo permite números, sin espacios
    const numbersOnly = value.replace(/\D/g, '');
    setFormData({ ...formData, [field]: numbersOnly });
  };

  const handleNameInput = (value: string) => {
    // Solo permite letras y espacios, convierte a mayúsculas
    const lettersOnly = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase();
    setFormData({ ...formData, name: lettersOnly });
  };

  const searchCustomerByDni = async (dni: string) => {
    if (dni.length !== 8) return;

    setIsSearchingCustomer(true);
    try {
      const response = await fetch(`/api/customers?dni=${dni}`);
      const data = await response.json();

      if (data.found) {
        setFormData(data.customer);
        setCustomerFound(true);
        setShowDniSearch(false);
      } else {
        setCustomerFound(false);
        setShowDniSearch(false);
      }
    } catch (error) {
      console.error("Error al buscar cliente:", error);
      setShowDniSearch(false);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleDniSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchCustomerByDni(formData.dni);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      dni: "",
      phone: "",
      address: "",
      email: "",
    });
    setCustomerFound(false);
    setShowDniSearch(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mostrar modal de confirmación de pago
    setShowPaymentModal(true);
  };

  const confirmOrder = async () => {
    setShowPaymentModal(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cart: cart,
          totalItems: totalItems,
          totalPrice: totalPrice,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        clearCart();
        setOrderPlaced(true);
        setTimeout(() => {
          router.push("/");
        }, 4000);
      } else {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        alert("Hubo un error al procesar tu pedido. Intenta nuevamente.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error al enviar pedido:", error);
      alert("Hubo un error de conexión. Por favor verifica tu internet e intenta nuevamente.");
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl border-2 border-fuchsia-500 neon-border-purple p-8 md:p-12 text-center max-w-md w-full">
          <div className="text-7xl md:text-8xl mb-6 animate-bounce">✅</div>
          <h2 className="text-3xl md:text-4xl font-black text-fuchsia-400 mb-4 neon-glow-purple">
            ¡Pedido Enviado!
          </h2>
          <p className="text-lg md:text-xl text-white mb-6">
            Te contactaremos pronto para coordinar la entrega de tu pedido
          </p>
          <p className="text-sm text-gray-400">
            Redirigiendo a inicio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-black flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b-2 border-fuchsia-500 neon-border-purple">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-2 flex items-center justify-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="flex items-center gap-2 md:gap-3 text-base md:text-xl font-black tracking-tight">
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
              <div className="w-0.5 h-5 md:h-7 bg-gradient-to-b from-transparent via-fuchsia-500 to-transparent shadow-lg shadow-fuchsia-500/50"></div>
              <span className="text-fuchsia-500 neon-glow-purple">DILEMA</span>
            </h1>
          </Link>
        </div>
      </header>

      {/* Checkout Layout - Full Screen */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side - Form */}
        <div className="flex-1 bg-black p-3 md:p-4 flex items-start md:items-center justify-center overflow-y-auto">
          <div className="max-w-xl w-full">
            <h1 className="text-lg md:text-xl font-black text-fuchsia-400 mb-2 md:mb-3 neon-glow-purple">
              Finalizar Pedido
            </h1>

            {showDniSearch ? (
              /* DNI Search Form */
              <form onSubmit={handleDniSearchSubmit} className="space-y-2 md:space-y-2">
                <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-2.5 md:p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg md:text-xl">🚀</span>
                    <h3 className="text-xs md:text-sm font-bold text-fuchsia-400">Compra más rápido</h3>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-300 mb-2">
                    Si ya compraste antes, ingresa tu DNI para autocompletar tus datos
                  </p>

                  <div>
                    <label className="block text-[11px] md:text-[11px] font-bold text-fuchsia-400 mb-0.5">
                      Ingresa tu DNI
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.dni}
                        onChange={(e) => handleNumberInput('dni', e.target.value)}
                        maxLength={8}
                        className="flex-1 px-3 py-2.5 md:py-2 text-base rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                        placeholder="12345678"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingCustomer || formData.dni.length !== 8}
                        className="px-3 md:px-4 py-2.5 md:py-2 bg-fuchsia-600 hover:bg-fuchsia-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSearchingCustomer ? "..." : "Buscar"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowDniSearch(false)}
                    className="text-[11px] md:text-xs text-fuchsia-400 hover:text-fuchsia-300 underline transition-colors active:scale-95"
                  >
                    ¿Primera compra? Ingresa tus datos aquí
                  </button>
                </div>
              </form>
            ) : (
              /* Full Form */
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-2">
                {customerFound && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✓</span>
                        <p className="text-[11px] text-green-400 font-bold">¡Te encontramos! Verifica tus datos</p>
                      </div>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300 underline"
                      >
                        Cambiar DNI
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-fuchsia-400 mb-0.5">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-base rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                    placeholder="JUAN PÉREZ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-fuchsia-400 mb-0.5">
                      DNI *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dni}
                      onChange={(e) => handleNumberInput('dni', e.target.value)}
                      maxLength={8}
                      disabled={customerFound}
                      className="w-full px-3 py-1.5 text-base rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-fuchsia-400 mb-0.5">
                      Teléfono *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => handleNumberInput('phone', e.target.value)}
                      maxLength={9}
                      className="w-full px-3 py-1.5 text-base rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                      placeholder="999888777"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-fuchsia-400 mb-0.5">
                    Dirección de entrega *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-base rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                    rows={2}
                    placeholder="Av. Ejemplo 123, Dpto 456"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-fuchsia-400 mb-0.5">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-base rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                    placeholder="tucorreo@ejemplo.com"
                  />
                  <p className="text-[10px] text-fuchsia-300/60 mt-1">
                    Recibe ofertas y promociones limitadas
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div className="w-full md:w-[400px] bg-gray-900 border-t-2 md:border-t-0 md:border-l-2 border-fuchsia-500/30 p-3 md:p-4 flex flex-col max-h-[50vh] md:max-h-none">
          <h3 className="text-base md:text-lg font-black text-fuchsia-400 mb-2 md:mb-2 neon-glow-purple">
            Resumen del Pedido
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1.5 mb-2 md:mb-3">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-black/50 rounded-lg p-2 border border-fuchsia-500/20"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl md:text-2xl">{item.product.image}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[11px] md:text-xs truncate">
                      {item.product.name}
                    </p>
                    <p className="text-fuchsia-300 text-[9px] md:text-[10px] mt-0.5">
                      S/ {item.product.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-amber-400 font-black text-xs md:text-sm gold-glow">
                    S/ {(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-fuchsia-500/50 pt-2 md:pt-2">
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <span className="text-white font-bold text-sm md:text-base">Total:</span>
              <span className="text-amber-400 font-black text-lg md:text-xl gold-glow">
                S/ {totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Botón Confirmar Pedido */}
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting || !isFormValid() || showDniSearch}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 active:scale-95 text-white font-black py-2.5 md:py-3 rounded-lg text-sm md:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed neon-border-purple md:transform md:hover:scale-105 mb-2"
            >
              {isSubmitting ? "Procesando..." : "Confirmar Pedido"}
            </button>

            {!isFormValid() && !showDniSearch && (
              <p className="text-red-400 text-[9px] md:text-[10px] text-center mb-2">
                ⚠️ Completa todos los campos obligatorios
              </p>
            )}

            <p className="text-gray-400 text-[9px] md:text-[10px] text-center">
              Al confirmar tu pedido, nos pondremos en contacto contigo para coordinar la entrega
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-xl border-2 border-fuchsia-500 neon-border-purple max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">💰</div>
              <h3 className="text-xl md:text-2xl font-black text-fuchsia-400 neon-glow-purple mb-2">
                Método de Pago
              </h3>
              <p className="text-white text-sm md:text-base mb-4">
                Tu pedido será pagado <span className="text-amber-400 font-bold gold-glow">contra entrega</span>
              </p>
            </div>

            <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-4 mb-4">
              <p className="text-fuchsia-300 text-sm md:text-base mb-3 font-bold">
                Podrás pagar cuando recibas tu pedido con:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💵</span>
                  <span className="text-white text-sm">Efectivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  <span className="text-white text-sm">Yape</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  <span className="text-white text-sm">Plin</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmOrder}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-3 rounded-lg text-sm transition-all disabled:opacity-50 neon-border-purple"
              >
                {isSubmitting ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
