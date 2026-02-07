"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

interface CompletedOrder {
  productId: string;
  quantity: number;
  salsas?: string[]; // Opcional, solo para fat
  complementIds: string[];
}

const salsas: { id: string; name: string }[] = [
  { id: "barbecue", name: "Barbecue" },
  { id: "anticuchos", name: "Anticuchos" },
  { id: "ahumada", name: "Ahumada" },
  { id: "buffalo-picante", name: "Buffalo picante" },
  { id: "honey-mustard", name: "Honey mustard" },
  { id: "acevichada", name: "Acevichada" },
  { id: "rocoto", name: "Rocoto" },
  { id: "aji-amarillo", name: "Ají amarillo" },
];

const availableComplements: Record<string, { name: string; price: number }> = {
  "agua-mineral": { name: "Agua mineral", price: 4.00 },
  "coca-cola": { name: "Coca Cola 500ml", price: 4.00 },
  "inka-cola": { name: "Inka Cola 500ml", price: 4.00 },
  "sprite": { name: "Sprite 500ml", price: 4.00 },
  "fanta": { name: "Fanta 500ml", price: 4.00 },
  "extra-papas": { name: "Extra papas", price: 4.00 },
  "extra-salsa": { name: "Extra salsa", price: 3.00 },
  "extra-aderezo": { name: "Extra aderezo", price: 3.00 }
};

// Productos fat para referencia
const fatProducts = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    price: 28.90,
    image: "/pequeno-dilema.png?v=3",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    price: 45.90,
    image: "/duo-dilema.png?v=3",
  },
  {
    id: "gran-dilema",
    name: "Gran Dilema",
    price: 55.90,
    image: "/gran-dilema.png?v=3",
  },
];

// Productos fit para referencia
const fitProducts = [
  {
    id: "ensalada-clasica",
    name: "CLÁSICA FRESH BOWL",
    price: 18.90,
    image: "/clasica-fresh-bowl.png",
  },
  {
    id: "ensalada-cesar",
    name: "CÉSAR POWER BOWL",
    price: 22.90,
    image: "/cesar-power-bowl.png",
  },
  {
    id: "ensalada-protein",
    name: "PROTEIN FIT BOWL",
    price: 24.90,
    image: "/protein-fit-bowl.png",
  },
  {
    id: "ensalada-tuna",
    name: "TUNA FRESH BOWL",
    price: 26.90,
    image: "/tuna-fresh-bowl.png",
  },
];

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
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showQrPayment, setShowQrPayment] = useState(false);
  const [showContraEntregaModal, setShowContraEntregaModal] = useState(false);
  const [showEfectivoOptions, setShowEfectivoOptions] = useState(false);
  const [selectedEfectivo, setSelectedEfectivo] = useState<'exacto' | 'cambio' | null>(null);
  const [cantoCancelo, setCantoCancelo] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar órdenes completadas desde localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem("santo-dilema-orders");
    if (savedOrders) {
      try {
        setCompletedOrders(JSON.parse(savedOrders));
      } catch (error) {
        console.error("Error loading orders:", error);
      }
    }
  }, []);

  // Calcular el total real basado en completedOrders
  const calculateRealTotal = () => {
    return completedOrders.reduce((total, order) => {
      // Buscar el producto en los arrays
      const fatProduct = fatProducts.find((p) => p.id === order.productId);
      const fitProduct = fitProducts.find((p) => p.id === order.productId);
      const product = fatProduct || fitProduct;

      if (!product) return total;

      // Calcular total del producto
      const productTotal = product.price * order.quantity;

      // Calcular total de complementos
      const complementsTotal = order.complementIds.reduce((sum, compId) => {
        return sum + (availableComplements[compId]?.price || 0);
      }, 0);

      return total + productTotal + complementsTotal;
    }, 0);
  };

  const realTotal = calculateRealTotal();

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

  const confirmOrder = async (overridePaymentMethod?: string) => {
    setShowPaymentModal(false);
    setShowQrPayment(false);
    setShowContraEntregaModal(false);
    setShowEfectivoOptions(false);
    setSelectedEfectivo(null);
    setCantoCancelo('');
    setIsSubmitting(true);

    try {
      console.log("Enviando pedido...", {
        formData,
        cart,
        totalItems,
        totalPrice,
        paymentMethod
      });

      // Crear FormData para enviar archivo si existe
      const formDataToSend = new FormData();

      // Agregar datos del formulario
      formDataToSend.append('name', formData.name);
      formDataToSend.append('dni', formData.dni);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('cart', JSON.stringify(cart));
      formDataToSend.append('completedOrders', JSON.stringify(completedOrders));
      formDataToSend.append('totalItems', totalItems.toString());
      formDataToSend.append('totalPrice', totalPrice.toString());
      formDataToSend.append('paymentMethod', overridePaymentMethod || paymentMethod || 'contraentrega');
      if (cantoCancelo) {
        formDataToSend.append('cantoCancelo', cantoCancelo);
      }
      formDataToSend.append('timestamp', new Date().toISOString());

      // Agregar comprobante de pago si existe
      if (paymentProof) {
        formDataToSend.append('paymentProof', paymentProof);
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        body: formDataToSend,
      });

      console.log("Respuesta del servidor:", response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Pedido creado exitosamente:", data);

        // Limpiar estados
        clearCart();
        localStorage.removeItem("santo-dilema-orders");
        setOrderPlaced(true);

        setTimeout(() => {
          router.push("/");
        }, 10000);
      } else {
        const errorData = await response.json();
        console.error("Error del servidor:", response.status, errorData);
        alert(`Hubo un error al procesar tu pedido (${response.status}). Intenta nuevamente.\n${JSON.stringify(errorData)}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error al enviar pedido:", error);
      alert(`Hubo un error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}\nPor favor verifica tu internet e intenta nuevamente.`);
      setIsSubmitting(false);
    }
  };

  if (isSubmitting && !orderPlaced) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin opacity-60"></div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        {/* Círculo animado + check */}
        <div className="relative mb-10">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="56" fill="none" stroke="#1f2937" strokeWidth="6" />
            <circle
              cx="70" cy="70" r="56"
              fill="none"
              stroke="#a855f7"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="351.86"
              strokeDashoffset="351.86"
              className="success-circle-fill"
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <path
                d="M12 28 L24 40 L44 16"
                fill="none"
                stroke="#a855f7"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="60"
                strokeDashoffset="60"
                className="success-check-path"
              />
            </svg>
          </div>
        </div>

        {/* Texto principal: slide-in derecha a izquierda + parpadeo */}
        <h2
          className="text-xl md:text-2xl text-center success-main-text"
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
            fontWeight: 600,
            fontStyle: 'italic',
            color: 'transparent',
            WebkitTextStroke: '1px #a855f7',
            letterSpacing: '0.05em',
            filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5)) drop-shadow(0 0 8px rgba(168, 85, 247, 0.3)) drop-shadow(0 0 12px rgba(168, 85, 247, 0.2))'
          }}
        >
          Pedido enviado con éxito
        </h2>

        {/* Texto secundario */}
        <p className="text-gray-400 text-xs md:text-sm mt-3 max-w-xs mx-auto text-center success-sub-text">
          En breve te contactaremos para coordinar la entrega, gracias
        </p>

        {/* Logo Santo Dilema */}
        <div className="mt-10 success-logo">
          <h1 className="flex items-center gap-2 text-sm font-black tracking-tight">
            <span className="text-amber-400 gold-glow inline-flex items-center">
              S
              <span className="relative inline-block">A</span>
              <span className="relative inline-block">N</span>
              <span className="relative inline-block">T</span>
              <span className="relative inline-block">
                O
                <svg
                  className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3"
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
            <div className="w-0.5 h-4 bg-gradient-to-b from-transparent via-fuchsia-500 to-transparent shadow-lg shadow-fuchsia-500/50"></div>
            <span className="text-fuchsia-500 neon-glow-purple">DILEMA</span>
          </h1>
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
        <div className="flex-1 bg-black p-2 md:p-4 flex items-start md:items-center justify-center overflow-y-auto">
          <div className="max-w-xl w-full">
            <h1 className="text-base md:text-xl font-black text-fuchsia-400 mb-1.5 md:mb-3 neon-glow-purple">
              Finalizar Pedido
            </h1>

            {showDniSearch ? (
              /* DNI Search Form */
              <form onSubmit={handleDniSearchSubmit} className="space-y-1.5 md:space-y-2">
                <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-2 md:p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm md:text-xl">🚀</span>
                    <h3 className="text-xs md:text-sm font-bold text-fuchsia-400">Compra más rápido</h3>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-300 mb-1.5">
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
                        className="flex-1 px-3 py-1.5 md:py-2 rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                        style={{ fontSize: '16px' }}
                        placeholder="12345678"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingCustomer || formData.dni.length !== 8}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-fuchsia-600 hover:bg-fuchsia-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-1.5 md:space-y-2">
                {customerFound && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">✓</span>
                        <p className="text-[10px] text-green-400 font-bold">¡Te encontramos! Verifica tus datos</p>
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
                  <label className="block text-[10px] font-bold text-fuchsia-400 mb-0.5">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameInput(e.target.value)}
                    className="w-full px-2.5 py-1 text-sm rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                    placeholder="JUAN PÉREZ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-bold text-fuchsia-400 mb-0.5">
                      DNI *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.dni}
                        onChange={(e) => handleNumberInput('dni', e.target.value)}
                        maxLength={8}
                        disabled={customerFound}
                        className="w-full px-2.5 py-1 text-sm rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple disabled:opacity-50 disabled:cursor-not-allowed pr-8"
                        placeholder="12345678"
                      />
                      {!customerFound && (
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.dni.length === 8) {
                              searchCustomerByDni(formData.dni);
                            }
                          }}
                          disabled={formData.dni.length !== 8}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                          title="Buscar DNI"
                        >
                          🔍
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-fuchsia-400 mb-0.5">
                      Teléfono *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => handleNumberInput('phone', e.target.value)}
                      maxLength={9}
                      className="w-full px-2.5 py-1 text-sm rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                      placeholder="999888777"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-fuchsia-400 mb-0.5">
                    Dirección de entrega *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-2.5 py-1 text-sm rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                    rows={1}
                    placeholder="Av. Ejemplo 123, Dpto 456"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-fuchsia-400 mb-0.5">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-2.5 py-1 text-sm rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
                    placeholder="tucorreo@ejemplo.com"
                  />
                  <p className="text-[9px] text-fuchsia-300/60 mt-0.5">
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
            {completedOrders.map((order, index) => {
              // Buscar primero en el cart
              let product = cart.find((item) => item.product.id.includes(order.productId))?.product;

              // Si no está en el cart, buscar en los arrays estáticos
              if (!product) {
                const fatProduct = fatProducts.find((p) => p.id === order.productId);
                const fitProduct = fitProducts.find((p) => p.id === order.productId);
                product = fatProduct || fitProduct;
              }

              if (!product) return null;

              // Calcular el total de esta orden
              const productTotal = product.price * order.quantity;
              const complementsTotal = order.complementIds.reduce((sum, compId) => {
                return sum + (availableComplements[compId]?.price || 0);
              }, 0);
              const orderTotal = productTotal + complementsTotal;

              return (
                <div
                  key={`${order.productId}-${index}`}
                  className="bg-black/50 rounded-lg p-2 border border-fuchsia-500/20"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-fuchsia-400/30 flex items-center justify-center">
                      {product.image.startsWith('/') ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl md:text-2xl">{product.image}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-[11px] md:text-xs">
                        {order.quantity > 1 ? `${order.quantity}x ` : ''}{product.name}
                      </p>
                      <div className="text-[9px] md:text-[10px] space-y-0.5 mt-1">
                        {order.salsas && order.salsas.length > 0 && (
                          <div className="text-amber-300">
                            🌶️ {order.salsas
                              .map((sId) => salsas.find((s) => s.id === sId)?.name)
                              .filter((name) => name)
                              .join(", ")}
                          </div>
                        )}
                        {order.complementIds.length > 0 && (
                          <div className="text-fuchsia-300 space-y-0.5">
                            {order.complementIds.map((compId, i) => {
                              const comp = availableComplements[compId];
                              if (!comp) return null;
                              return (
                                <div key={`${compId}-${i}`} className="flex justify-between">
                                  <span>🍟 {comp.name}</span>
                                  <span className="text-fuchsia-300/60">+S/ {comp.price.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-amber-400 font-bold text-xs md:text-sm gold-glow flex-shrink-0">
                      S/ {productTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t-2 border-fuchsia-500/50 pt-2 md:pt-2">
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <span className="text-white font-bold text-sm md:text-base">Total:</span>
              <span className="text-amber-400 font-black text-lg md:text-xl gold-glow">
                S/ {realTotal.toFixed(2)}
              </span>
            </div>

            {/* Botones */}
            <div className="flex gap-2 mb-2">
              <Link
                href={completedOrders.some(o => o.salsas && o.salsas.length > 0) ? "/fat?from=checkout" : "/fit?from=checkout"}
                className="flex-1 bg-gray-700 hover:bg-gray-600 active:scale-95 text-white font-black py-2.5 md:py-3 rounded-lg text-sm md:text-base transition-all flex items-center justify-center gap-1 border-2 border-gray-600"
              >
                <span>←</span>
                <span>Volver</span>
              </Link>
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || !isFormValid() || showDniSearch}
                className="flex-1 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 active:scale-95 text-white font-black py-2.5 md:py-3 rounded-lg text-sm md:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed neon-border-purple md:transform md:hover:scale-105"
              >
                {isSubmitting ? "Procesando..." : "Confirmar Pedido"}
              </button>
            </div>

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

      {/* Modal de Selección de Método de Pago */}
      {showPaymentModal && !showQrPayment && !showContraEntregaModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false);
              setPaymentMethod(null);
            }
          }}
        >
          <div
            className="bg-gray-900 rounded-2xl border border-fuchsia-500/30 max-w-xs w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <h1 className="flex items-center gap-1.5 text-xs font-black tracking-tight">
                <span className="text-amber-400 gold-glow inline-flex items-center">
                  S<span className="relative inline-block">A</span><span className="relative inline-block">N</span><span className="relative inline-block">T</span><span className="relative inline-block">O<svg className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l3-3 3 3 4-8 4 8 3-3 3 3v7H2z"/><line x1="2" y1="19" x2="22" y2="19"/></svg></span>
                </span>
                <div className="w-0.5 h-3 bg-gradient-to-b from-transparent via-fuchsia-500 to-transparent shadow-lg shadow-fuchsia-500/50"></div>
                <span className="text-fuchsia-500 neon-glow-purple">DILEMA</span>
              </h1>
            </div>

            <h3 className="text-base font-bold text-white text-center mb-0.5">Método de pago</h3>
            <p className="text-gray-500 text-xs text-center mb-5">
              Total: <span className="text-amber-400 font-bold">S/ {totalPrice.toFixed(2)}</span>
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setPaymentMethod('anticipado');
                  setShowQrPayment(true);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-700 bg-gray-800/40 active:bg-gray-800/70 transition-all active:scale-95"
              >
                <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500 opacity-0"></div>
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold text-sm">Paga con Yape o Plin</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">Escanea QR y confirma</p>
                </div>
                <span className="text-gray-600 text-sm">📱</span>
              </button>

              <button
                onClick={() => {
                  setShowContraEntregaModal(true);
                  setShowEfectivoOptions(false);
                  setSelectedEfectivo(null);
                  setCantoCancelo('');
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-700 bg-gray-800/40 active:bg-gray-800/70 transition-all active:scale-95"
              >
                <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500 opacity-0"></div>
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold text-sm">Pago contra entrega</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">Efectivo o Yape al recibir</p>
                </div>
                <span className="text-gray-600 text-sm">🏍️</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentMethod(null);
              }}
              className="w-full mt-4 text-gray-500 hover:text-gray-300 text-[11px] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Contra Entrega */}
      {showContraEntregaModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowContraEntregaModal(false);
              setShowEfectivoOptions(false);
              setSelectedEfectivo(null);
              setCantoCancelo('');
            }
          }}
        >
          <div
            className="bg-gray-900 rounded-2xl border border-fuchsia-500/30 max-w-xs w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <h1 className="flex items-center gap-1.5 text-xs font-black tracking-tight">
                <span className="text-amber-400 gold-glow inline-flex items-center">
                  S<span className="relative inline-block">A</span><span className="relative inline-block">N</span><span className="relative inline-block">T</span><span className="relative inline-block">O<svg className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l3-3 3 3 4-8 4 8 3-3 3 3v7H2z"/><line x1="2" y1="19" x2="22" y2="19"/></svg></span>
                </span>
                <div className="w-0.5 h-3 bg-gradient-to-b from-transparent via-fuchsia-500 to-transparent shadow-lg shadow-fuchsia-500/50"></div>
                <span className="text-fuchsia-500 neon-glow-purple">DILEMA</span>
              </h1>
            </div>

            {!showEfectivoOptions ? (
              <>
                <h3 className="text-base font-bold text-white text-center mb-0.5">Contra entrega</h3>
                <p className="text-gray-500 text-xs text-center mb-5">
                  Total: <span className="text-amber-400 font-bold">S/ {totalPrice.toFixed(2)}</span>
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => confirmOrder('contraentrega-yape')}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-700 bg-gray-800/40 active:bg-gray-800/70 transition-all active:scale-95"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-fuchsia-500 opacity-0"></div>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-semibold text-sm">Yape o Plin</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">Al momento de la entrega</p>
                    </div>
                    <span className="text-gray-600 text-sm">📱</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowEfectivoOptions(true);
                      setSelectedEfectivo(null);
                      setCantoCancelo('');
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-700 bg-gray-800/40 active:bg-gray-800/70 transition-all active:scale-95"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-fuchsia-500 opacity-0"></div>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-semibold text-sm">Efectivo</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">En billetes o monedas</p>
                    </div>
                    <span className="text-gray-600 text-sm">💵</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowContraEntregaModal(false)}
                  className="w-full mt-4 text-gray-500 hover:text-gray-300 text-[11px] transition-colors"
                >
                  ← Volver
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowEfectivoOptions(false);
                    setSelectedEfectivo(null);
                    setCantoCancelo('');
                  }}
                  className="text-gray-500 hover:text-gray-300 text-[11px] transition-colors mb-3"
                >
                  ← Atrás
                </button>

                <h3 className="text-base font-bold text-white text-center mb-0.5">Efectivo</h3>
                <p className="text-gray-500 text-xs text-center mb-5">
                  Total: <span className="text-amber-400 font-bold">S/ {totalPrice.toFixed(2)}</span>
                </p>

                <div className="space-y-2 mb-4">
                  <button
                    onClick={() => {
                      setSelectedEfectivo('exacto');
                      setCantoCancelo('');
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all active:scale-95 ${
                      selectedEfectivo === 'exacto'
                        ? 'border-fuchsia-500/50 bg-gray-800/70'
                        : 'border-gray-700 hover:border-fuchsia-500/50 bg-gray-800/40 hover:bg-gray-800/70'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      selectedEfectivo === 'exacto' ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-gray-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full bg-fuchsia-500 transition-opacity ${
                        selectedEfectivo === 'exacto' ? 'opacity-100' : 'opacity-0'
                      }`}></div>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-semibold text-sm">Monto exacto</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">Tengo S/ {totalPrice.toFixed(2)} exacto</p>
                    </div>
                    <span className="text-gray-600 text-sm">✓</span>
                  </button>

                  <button
                    onClick={() => setSelectedEfectivo('cambio')}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all active:scale-95 ${
                      selectedEfectivo === 'cambio'
                        ? 'border-fuchsia-500/50 bg-gray-800/70'
                        : 'border-gray-700 hover:border-fuchsia-500/50 bg-gray-800/40 hover:bg-gray-800/70'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      selectedEfectivo === 'cambio' ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-gray-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full bg-fuchsia-500 transition-opacity ${
                        selectedEfectivo === 'cambio' ? 'opacity-100' : 'opacity-0'
                      }`}></div>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-semibold text-sm">Necesito cambio</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">Pagaré con billetes</p>
                    </div>
                    <span className="text-gray-600 text-sm">💵</span>
                  </button>

                  {selectedEfectivo === 'cambio' && (
                    <div className="mt-1">
                      <label className="block text-[11px] text-gray-400 mb-1">¿Con cuánto cancelas?</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={cantoCancelo}
                          onChange={(e) => {
                            const solo = e.target.value.replace(/\D/g, '');
                            setCantoCancelo(solo);
                          }}
                          placeholder={Math.ceil(totalPrice).toString()}
                          className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-800 border border-fuchsia-500/30 text-white text-sm focus:border-fuchsia-500 focus:outline-none transition-colors"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      {cantoCancelo && parseFloat(cantoCancelo) < totalPrice && (
                        <p className="text-red-400 text-[10px] mt-1">El monto debe ser mayor o igual a S/ {totalPrice.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (selectedEfectivo === 'exacto') {
                      confirmOrder('contraentrega-efectivo-exacto');
                    } else if (selectedEfectivo === 'cambio' && cantoCancelo && parseFloat(cantoCancelo) >= totalPrice) {
                      confirmOrder('contraentrega-efectivo-cambio');
                    }
                  }}
                  disabled={
                    !selectedEfectivo ||
                    (selectedEfectivo === 'cambio' && (!cantoCancelo || parseFloat(cantoCancelo) < totalPrice))
                  }
                  className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>

                <button
                  onClick={() => {
                    setShowContraEntregaModal(false);
                    setShowEfectivoOptions(false);
                    setSelectedEfectivo(null);
                    setCantoCancelo('');
                  }}
                  className="w-full mt-2 text-gray-500 hover:text-gray-300 text-[11px] transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pago con QR */}
      {showQrPayment && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-2xl border border-green-500/40 max-w-xs w-full p-4">
            <div className="flex justify-center mb-3">
              <h1 className="flex items-center gap-1.5 text-xs font-black tracking-tight">
                <span className="text-amber-400 gold-glow inline-flex items-center">
                  S<span className="relative inline-block">A</span><span className="relative inline-block">N</span><span className="relative inline-block">T</span><span className="relative inline-block">O<svg className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l3-3 3 3 4-8 4 8 3-3 3 3v7H2z"/><line x1="2" y1="19" x2="22" y2="19"/></svg></span>
                </span>
                <div className="w-0.5 h-3 bg-gradient-to-b from-transparent via-fuchsia-500 to-transparent shadow-lg shadow-fuchsia-500/50"></div>
                <span className="text-fuchsia-500 neon-glow-purple">DILEMA</span>
              </h1>
            </div>

            {/* Header */}
            <div className="text-center mb-3">
              <h3 className="text-base font-bold text-green-400">Escanea y Paga</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                S/ <span className="text-amber-400 font-bold">{totalPrice.toFixed(2)}</span>
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-3">
              <div className="bg-white rounded-lg p-2" style={{ width: '140px', height: '140px' }}>
                <img
                  src="/qr-yape-plin.png"
                  alt="QR Pago"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* 3 pasos */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 mb-3">
              <ol className="text-white text-xs space-y-1.5">
                <li className="flex gap-2">
                  <span className="text-green-400 font-bold flex-shrink-0">1.</span>
                  <span>Escanea el QR con Yape o Plin</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400 font-bold flex-shrink-0">2.</span>
                  <span>Realiza el pago de S/ {totalPrice.toFixed(2)}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400 font-bold flex-shrink-0">3.</span>
                  <span>Sube tu comprobante abajo</span>
                </li>
              </ol>
            </div>

            {/* Upload comprobante */}
            <div className="mb-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                className="hidden"
              />
              {!paymentProof ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition-all active:scale-95"
                >
                  <span className="text-green-400 text-xs">📎</span>
                  <span className="text-green-400 text-xs font-bold tracking-wide">SUBIR CAPTURA DE PAGO</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 py-2 px-3 rounded-lg border border-green-500/30 bg-green-500/10">
                  <div className="w-7 h-7 rounded-full border-2 border-green-500 bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-green-400 text-xs font-bold">Pago subido con éxito</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-500 hover:text-gray-300 text-[10px] transition-colors mt-0.5"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowQrPayment(false);
                  setPaymentProof(null);
                  setPaymentMethod(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  if (paymentProof) {
                    confirmOrder();
                  } else {
                    alert('Por favor sube tu comprobante de pago');
                  }
                }}
                disabled={!paymentProof || isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
