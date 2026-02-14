"use client";
// VERSION: 2.5.4 - Simplificación de método de pago: contraentrega solo efectivo

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";

// Función para reproducir sonido de éxito similar a Apple Pay/VISA
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Primera nota (más alta)
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();

    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);

    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator1.type = 'sine';

    gainNode1.gain.setValueAtTime(0.6, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.8);

    // Segunda nota (ligeramente más baja, después de un pequeño delay)
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    oscillator2.frequency.setValueAtTime(650, audioContext.currentTime + 0.3);
    oscillator2.type = 'sine';

    gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
    gainNode2.gain.setValueAtTime(0.6, audioContext.currentTime + 0.3);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

    oscillator2.start(audioContext.currentTime + 0.3);
    oscillator2.stop(audioContext.currentTime + 1.5);

    // Tercera nota (aún más baja para completar el acorde)
    const oscillator3 = audioContext.createOscillator();
    const gainNode3 = audioContext.createGain();

    oscillator3.connect(gainNode3);
    gainNode3.connect(audioContext.destination);

    oscillator3.frequency.setValueAtTime(520, audioContext.currentTime + 0.5);
    oscillator3.type = 'sine';

    gainNode3.gain.setValueAtTime(0, audioContext.currentTime + 0.5);
    gainNode3.gain.setValueAtTime(0.6, audioContext.currentTime + 0.5);
    gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);

    oscillator3.start(audioContext.currentTime + 0.5);
    oscillator3.stop(audioContext.currentTime + 2.0);
  } catch (error) {
    console.log('No se pudo reproducir el sonido:', error);
  }
};

interface CompletedOrder {
  productId: string;
  quantity: number;
  salsas?: string[]; // Opcional, solo para fat
  complementIds: string[];
  discountApplied?: boolean;
  originalPrice?: number;
  finalPrice?: number;
}

const salsas: { id: string; name: string }[] = [
  { id: "barbecue", name: "BBQ ahumada" },
  { id: "buffalo-picante", name: "Santo Picante" },
  { id: "ahumada", name: "Acevichada Imperial" },
  { id: "parmesano-ajo", name: "Crispy Celestial" },
  { id: "anticuchos", name: "Parrillera" },
  { id: "honey-mustard", name: "Honey mustard" },
  { id: "teriyaki", name: "Teriyaki" },
  { id: "macerichada", name: "Sweet & Sour" },
];

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

// Productos fat para referencia
const fatProducts = [
  {
    id: "pequeno-dilema",
    name: "Pequeño Dilema",
    price: 18.50,
    image: "/pequeno-dilema.png?v=3",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    price: 32.50,
    image: "/duo-dilema.png?v=3",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    price: 45.00,
    image: "/todos-pecan.png?v=3",
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
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    price: 24.90,
    image: "/cesar-power-bowl.png",
  },
  {
    id: "ensalada-caesar",
    name: "PROTEIN FIT BOWL",
    price: 22.90,
    image: "/protein-fit-bowl.png",
  },
  {
    id: "ensalada-mediterranea",
    name: "TUNA FRESH BOWL",
    price: 21.90,
    image: "/tuna-fresh-bowl.png",
  },
];


export default function CheckoutPage() {
  const router = useRouter();
  const { clearCart } = useCart();
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
  const [showPreLaunchModal, setShowPreLaunchModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showQrPayment, setShowQrPayment] = useState(false);
  const [showContraEntregaModal, setShowContraEntregaModal] = useState(false);
  const [showEfectivoOptions, setShowEfectivoOptions] = useState(false);
  const [selectedEfectivo, setSelectedEfectivo] = useState<'exacto' | 'cambio' | null>(null);
  const [cantoCancelo, setCantoCancelo] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para cupón
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponValid, setCouponValid] = useState(false);
  const [isOpen, setIsOpen] = useState(isBusinessOpen);
  const [deliveryOption, setDeliveryOption] = useState<'centro' | 'alrededores' | null>(null);

  // Reproducir sonido cuando el pedido se confirma
  useEffect(() => {
    if (orderPlaced) {
      playSuccessSound();
    }
  }, [orderPlaced]);

  useEffect(() => {
    const interval = setInterval(() => setIsOpen(isBusinessOpen()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar órdenes desde sessionStorage (vienen de /fat o /fit)
  useEffect(() => {
    const savedOrders = sessionStorage.getItem("santo-dilema-orders");
    if (savedOrders) {
      try {
        setCompletedOrders(JSON.parse(savedOrders));
      } catch (error) {
        console.error("Error loading orders:", error);
      }
    }
    setIsLoadingOrders(false);
  }, []);

  // Calcular el total real basado en completedOrders
  const subtotal = completedOrders.reduce((total, order) => {
    // Buscar el producto en los arrays
    const fatProduct = fatProducts.find((p) => p.id === order.productId);
    const fitProduct = fitProducts.find((p) => p.id === order.productId);
    const product = fatProduct || fitProduct;

    if (!product) return total;

    const productPrice = order.finalPrice ?? product.price;
    const productTotal = productPrice * order.quantity;

    // Calcular total de complementos
    const complementsTotal = order.complementIds.reduce((sum, compId) => {
      return sum + (availableComplements[compId]?.price || 0);
    }, 0);

    return total + productTotal + complementsTotal;
  }, 0);

  // Detectar combo FAT + FIT para descuento 14%
  const COMBO_FAT_IDS = ["pequeno-dilema", "duo-dilema", "santo-pecado"];
  const COMBO_FIT_IDS = ["ensalada-clasica", "ensalada-proteica", "ensalada-caesar", "ensalada-mediterranea"];
  const hasComboDiscount =
    completedOrders.some(o => COMBO_FAT_IDS.includes(o.productId)) &&
    completedOrders.some(o => COMBO_FIT_IDS.includes(o.productId));
  const comboDiscountAmount = hasComboDiscount ? subtotal * 0.14 : 0;

  // Aplicar descuento de cupón si es válido
  const couponDiscountAmount = couponValid ? ((subtotal - comboDiscountAmount) * couponDiscount) / 100 : 0;
  const deliveryCost = deliveryOption === 'centro' ? 4.00 : 0;
  const realTotal = subtotal - comboDiscountAmount - couponDiscountAmount + deliveryCost;

  // Validar si el formulario está completo
  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.dni.length === 8 &&
      formData.phone.length === 9 &&
      formData.address.trim() !== "" &&
      deliveryOption !== null
    );
  };

  // Validar cupón
  const validateCoupon = async () => {
    if (hasComboDiscount) {
      setCouponMessage("Los descuentos no son acumulables");
      return;
    }

    if (!couponCode.trim()) {
      setCouponMessage("Ingresa un código de cupón");
      return;
    }

    if (!formData.dni || formData.dni.length !== 8) {
      setCouponMessage("Completa tu DNI primero");
      return;
    }

    setCouponValidating(true);
    setCouponMessage("");

    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate",
          code: couponCode.trim().toUpperCase(),
          dni: formData.dni,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponValid(true);
        setCouponDiscount(data.discount);
        setCouponMessage(`✓ Cupón aplicado: ${data.discount}% de descuento`);
      } else {
        setCouponValid(false);
        setCouponDiscount(0);
        setCouponMessage(data.error || "Cupón no válido");
      }
    } catch (error) {
      setCouponValid(false);
      setCouponDiscount(0);
      setCouponMessage("Error al validar cupón");
    } finally {
      setCouponValidating(false);
    }
  };

  // Redirect if no completed orders (solo después de cargar)
  useEffect(() => {
    if (!isLoadingOrders && completedOrders.length === 0 && !orderPlaced) {
      router.push("/");
    }
  }, [isLoadingOrders, completedOrders.length, orderPlaced, router]);

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

  const LAUNCH_DATE = new Date('2026-02-13T23:30:00Z');
  const isPreLaunch = () => Date.now() < LAUNCH_DATE.getTime();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreLaunch()) {
      setShowPreLaunchModal(true);
      return;
    }
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

      // Crear FormData para enviar archivo si existe
      const formDataToSend = new FormData();

      // Agregar datos del formulario
      formDataToSend.append('name', formData.name);
      formDataToSend.append('dni', formData.dni);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('completedOrders', JSON.stringify(completedOrders));
      formDataToSend.append('totalItems', completedOrders.length.toString());
      formDataToSend.append('totalPrice', realTotal.toString());
      formDataToSend.append('comboDiscount', hasComboDiscount ? '14' : '0');
      formDataToSend.append('couponDiscount', couponValid ? couponDiscount.toString() : '0');
      formDataToSend.append('deliveryOption', deliveryOption || '');
      formDataToSend.append('deliveryCost', deliveryCost.toString());
      formDataToSend.append('couponCode', couponValid ? couponCode.trim().toUpperCase() : '');
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

        // Si se usó un cupón válido, marcarlo como usado
        if (couponValid && couponCode) {
          try {
            await fetch("/api/coupons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "mark-used",
                code: couponCode,
                dni: formData.dni,
              }),
            });
            console.log("✓ Cupón marcado como usado");
          } catch (error) {
            console.error("Error al marcar cupón como usado:", error);
          }
        }

        // Guardar cupón generado si viene en la respuesta
        if (data.coupon) {
          setGeneratedCoupon(data.coupon);
          console.log("🎁 Cupón generado y guardado:", data.coupon.code);
        }

        // Limpiar estados y almacenamiento
        clearCart();
        sessionStorage.removeItem("santo-dilema-orders");
        sessionStorage.removeItem("santo-dilema-cart");
        setCompletedOrders([]);
        setOrderPlaced(true);

        setTimeout(() => {
          router.push("/");
        }, 15000);
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
        <div className="mt-10 success-logo flex justify-center">
          <Image
            src="/logoprincipal.png"
            alt="Santo Dilema"
            width={200}
            height={50}
            className="h-8 md:h-10 w-auto"
          />
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Santo Dilema"
            width={120}
            height={120}
            className="w-24 h-24 md:w-32 md:h-32 object-contain opacity-80"
          />

          {/* Candado */}
          <div className="text-6xl md:text-8xl">🔒</div>

          {/* Mensaje cerrado */}
          <div className="flex flex-col gap-2">
            <h1 className="text-white font-black text-2xl md:text-4xl tracking-wide">
              Estamos Cerrados
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-xs">
              El horario de atención es de <span className="text-white font-bold">6:00 PM – 11:00 PM</span>,{" "}
              <span className="text-white font-bold">Jueves a Domingo</span>.
            </p>
            <p className="text-amber-400 font-bold text-sm md:text-base mt-1">
              {getNextOpenMessage()}
            </p>
          </div>

          {/* Botones de navegación */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/fat"
              className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-xl text-sm md:text-base transition-all active:scale-95"
            >
              Ver carta FAT
            </Link>
            <Link
              href="/fit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-6 py-3 rounded-xl text-sm md:text-base transition-all active:scale-95"
            >
              Ver carta FIT
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-black flex flex-col relative">
      {/* Iconos decorativos de fondo - Mix de FIT y FAT */}
      <div className="fixed inset-0 overflow-hidden opacity-10 pointer-events-none z-0">
        {/* Del lado FIT */}
        <svg className="absolute top-20 left-12 w-20 h-20 md:w-24 md:h-24 text-cyan-400 float-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="50" cy="55" rx="28" ry="35" />
          <ellipse cx="50" cy="55" rx="15" ry="18" />
        </svg>

        <svg className="absolute top-1/3 left-20 w-22 h-22 md:w-26 md:h-26 text-emerald-400 sway-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M50 20 Q35 25, 30 40 Q28 55, 35 65 Q45 75, 50 80"/>
          <path d="M50 20 Q65 25, 70 40 Q72 55, 65 65 Q55 75, 50 80"/>
        </svg>

        <svg className="absolute bottom-1/3 left-16 w-18 h-18 md:w-20 md:h-20 text-green-400 pulse-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 80 Q30 40, 50 20 Q70 40, 80 80" />
          <path d="M50 20 L50 80"/>
        </svg>

        {/* Del lado FAT */}
        <svg className="absolute top-24 right-16 w-22 h-22 md:w-26 md:h-26 text-red-400 bounce-subtle" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M25 50 Q30 40, 40 38 L50 37 Q60 38, 65 42 L75 45 Q82 48, 82 55 Q82 62, 75 65 L65 68 Q60 70, 50 70 L40 69 Q30 67, 25 60 Q20 55, 25 50Z"/>
          <circle cx="35" cy="55" r="2.5" fill="currentColor" opacity="0.4"/>
        </svg>

        <svg className="absolute top-1/2 right-24 w-20 h-20 md:w-24 md:h-24 text-orange-500 sway-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 20 Q45 30, 42 40 Q40 50, 42 60 Q45 68, 50 70 Q55 68, 58 60 Q60 50, 58 40 Q55 30, 50 20Z"/>
        </svg>

        <svg className="absolute bottom-24 right-20 w-18 h-18 md:w-22 md:h-22 text-orange-400 float-medium" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 15 L25 80 L75 80 Z"/>
          <circle cx="42" cy="50" r="4" fill="currentColor" opacity="0.4"/>
        </svg>

        {/* Iconos centrales púrpura */}
        <svg className="absolute bottom-1/2 left-1/2 w-16 h-16 md:w-20 md:h-20 text-fuchsia-400 rotate-slow opacity-70" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="50" cy="50" r="30"/>
          <circle cx="50" cy="50" r="20"/>
          <circle cx="50" cy="50" r="10"/>
        </svg>
      </div>

      {/* Header */}
      <header className="bg-gray-900 border-b-2 border-fuchsia-500 neon-border-purple overflow-visible relative z-10">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center justify-center overflow-visible">
          <Link href="/" className="hover:opacity-80 transition-opacity relative z-10">
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={280}
              height={70}
              className="h-10 md:h-12 w-auto"
              priority
            />
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
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-fuchsia-400 mb-0.5">
                    Correo (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-2.5 py-1 text-sm rounded-lg bg-gray-900 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none transition-colors focus:neon-border-purple"
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
              // Buscar el producto en los arrays estáticos
              const fatProduct = fatProducts.find((p) => p.id === order.productId);
              const fitProduct = fitProducts.find((p) => p.id === order.productId);
              const product = fatProduct || fitProduct;

              if (!product) return null;

              const productPrice = order.finalPrice ?? product.price;
              const productTotal = productPrice * order.quantity;
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
                              const emoji = compId === "pollo-grillado" ? "🍗" : "🍟";
                              return (
                                <div key={`${compId}-${i}`} className="flex justify-between">
                                  <span>{emoji} {comp.name}</span>
                                  <span className="text-fuchsia-300/60">+S/ {comp.price.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-amber-400 font-bold text-xs md:text-sm gold-glow flex-shrink-0">
                      <span>S/ {productTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>


          {/* Campo de cupón */}
          <div className="border-t border-fuchsia-500/30 pt-2 mb-2">
            <p className="text-white font-bold text-[10px] md:text-xs mb-1.5">¿Tienes un cupón?</p>
            {hasComboDiscount ? (
              <p className="text-amber-400/80 text-[9px] md:text-[10px] italic">
                ⚠️ El descuento combo 14% no es acumulable con cupones
              </p>
            ) : (
              <>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="SANTO13-XXXXXX"
                    disabled={couponValid}
                    className="flex-1 bg-black/50 border border-fuchsia-500/30 rounded-lg px-2 py-1.5 text-white text-xs md:text-sm placeholder-gray-500 focus:outline-none focus:border-fuchsia-400 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={validateCoupon}
                    disabled={couponValidating || couponValid}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {couponValidating ? "..." : couponValid ? "✓" : "Aplicar"}
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-[9px] md:text-[10px] mt-1 ${couponValid ? 'text-green-400' : 'text-red-400'}`}>
                    {couponMessage}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Opción de Delivery */}
          <div className="border-t-2 border-fuchsia-500/50 pt-2 md:pt-3 mb-2 md:mb-3">
            <p className="text-white font-bold text-xs md:text-sm mb-2">🛵 Tipo de delivery <span className="text-red-400">*</span></p>
            <div className="space-y-2">
              <label className={`flex items-start gap-2 cursor-pointer rounded-lg px-3 py-2 border transition-all ${deliveryOption === 'centro' ? 'border-fuchsia-500 bg-fuchsia-900/30' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                <input
                  type="radio"
                  name="deliveryOption"
                  value="centro"
                  checked={deliveryOption === 'centro'}
                  onChange={() => setDeliveryOption('centro')}
                  className="mt-0.5 accent-fuchsia-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[11px] md:text-xs font-semibold leading-tight">Delivery Chancay centro</p>
                  <p className="text-gray-400 text-[10px] md:text-[11px] leading-tight">(Colegio Salazar Bondy hasta Castillo de Chancay)</p>
                </div>
                <span className="text-amber-400 font-black text-xs md:text-sm flex-shrink-0">S/ 4.00</span>
              </label>

              <label className={`flex items-start gap-2 cursor-pointer rounded-lg px-3 py-2 border transition-all ${deliveryOption === 'alrededores' ? 'border-fuchsia-500 bg-fuchsia-900/30' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                <input
                  type="radio"
                  name="deliveryOption"
                  value="alrededores"
                  checked={deliveryOption === 'alrededores'}
                  onChange={() => setDeliveryOption('alrededores')}
                  className="mt-0.5 accent-fuchsia-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[11px] md:text-xs font-semibold leading-tight">Delivery Chancay alrededores</p>
                  <p className="text-gray-400 text-[10px] md:text-[11px] leading-tight">(Se coordina con el motorizado contraentrega)</p>
                </div>
                <span className="text-gray-400 font-bold text-xs md:text-sm flex-shrink-0">S/ 0.00</span>
              </label>
            </div>
            {deliveryOption === null && (
              <p className="text-red-400 text-[9px] md:text-[10px] mt-1.5">⚠️ Debes seleccionar una opción de delivery</p>
            )}
          </div>

          <div className="border-t-2 border-fuchsia-500/50 pt-2 md:pt-2">
            {/* Subtotal y descuentos */}
            {(hasComboDiscount || (couponValid && couponDiscount > 0)) && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400 text-xs md:text-sm">Subtotal:</span>
                  <span className="text-gray-400 text-xs md:text-sm">S/ {subtotal.toFixed(2)}</span>
                </div>
                {hasComboDiscount && (
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-fuchsia-400 text-xs md:text-sm font-bold">🔥 Combo FAT+FIT -14%:</span>
                    <span className="text-fuchsia-400 text-xs md:text-sm font-bold">-S/ {comboDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                {couponValid && couponDiscount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-400 text-xs md:text-sm font-bold">Cupón -{couponDiscount}%:</span>
                    <span className="text-green-400 text-xs md:text-sm font-bold">-S/ {couponDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            {deliveryCost > 0 && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-sky-400 text-xs md:text-sm font-bold">🛵 Delivery Chancay centro:</span>
                <span className="text-sky-400 text-xs md:text-sm font-bold">+S/ {deliveryCost.toFixed(2)}</span>
              </div>
            )}

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
              <Image
                src="/logoprincipal.png"
                alt="Santo Dilema"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </div>

            <h3 className="text-base font-bold text-white text-center mb-0.5">Método de pago</h3>
            <p className="text-gray-500 text-xs text-center mb-5">
              Total: <span className="text-amber-400 font-bold">S/ {realTotal.toFixed(2)}</span>
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
              <Image
                src="/logoprincipal.png"
                alt="Santo Dilema"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </div>

            {/* Modal de efectivo directo - sin paso previo */}
            <>
              <button
                onClick={() => {
                  setShowContraEntregaModal(false);
                  setSelectedEfectivo(null);
                  setCantoCancelo('');
                }}
                className="text-gray-500 hover:text-gray-300 text-[11px] transition-colors mb-3"
              >
                ← Volver
              </button>

              <h3 className="text-base font-bold text-white text-center mb-0.5">Pago contra entrega</h3>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 mb-3">
                <p className="text-blue-400 text-xs text-center font-semibold">
                  💵 Solo pago en efectivo
                </p>
              </div>
              <p className="text-gray-500 text-xs text-center mb-5">
                Total: <span className="text-amber-400 font-bold">S/ {realTotal.toFixed(2)}</span>
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
                      <p className="text-gray-500 text-[11px] mt-0.5">Tengo S/ {realTotal.toFixed(2)} exacto</p>
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
                          placeholder={Math.ceil(realTotal).toString()}
                          className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-800 border border-fuchsia-500/30 text-white text-sm focus:border-fuchsia-500 focus:outline-none transition-colors"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      {cantoCancelo && parseFloat(cantoCancelo) < realTotal && (
                        <p className="text-red-400 text-[10px] mt-1">El monto debe ser mayor o igual a S/ {realTotal.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (selectedEfectivo === 'exacto') {
                      confirmOrder('contraentrega-efectivo-exacto');
                    } else if (selectedEfectivo === 'cambio' && cantoCancelo && parseFloat(cantoCancelo) >= realTotal) {
                      confirmOrder('contraentrega-efectivo-cambio');
                    }
                  }}
                  disabled={
                    !selectedEfectivo ||
                    (selectedEfectivo === 'cambio' && (!cantoCancelo || parseFloat(cantoCancelo) < realTotal))
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
          </div>
        </div>
      )}

      {/* Modal Pre-lanzamiento */}
      {showPreLaunchModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border-2 border-fuchsia-500 neon-border-purple rounded-lg p-6 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-black text-fuchsia-400 neon-glow-purple mb-2">
              ¡Casi es la hora!
            </h3>
            <p className="text-white text-sm mb-1">
              Abrimos hoy a las
            </p>
            <p className="text-fuchsia-300 font-black text-2xl mb-1">
              6:30 PM
            </p>
            <p className="text-fuchsia-400/70 text-xs mb-5">
              Viernes 13 de Febrero · Hora Perú
            </p>
            <p className="text-gray-300 text-xs mb-6">
              Puedes seguir explorando el menú y armar tu pedido. ¡Te esperamos en unos minutos!
            </p>
            <button
              onClick={() => setShowPreLaunchModal(false)}
              className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold py-3 rounded-lg transition-all neon-border-purple"
            >
              Entendido →
            </button>
          </div>
        </div>
      )}

      {/* Modal de Pago con QR */}
      {showQrPayment && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-2xl border border-green-500/40 max-w-xs w-full p-4">
            <div className="flex justify-center mb-3">
              <Image
                src="/logoprincipal.png"
                alt="Santo Dilema"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-3">
              <h3 className="text-base font-bold text-green-400">Escanea y Paga</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                S/ <span className="text-amber-400 font-bold">{realTotal.toFixed(2)}</span>
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-3">
              <div className="bg-white rounded-lg p-2" style={{ width: '140px', height: '140px' }}>
                <img
                  src="/qrfinal.jpeg"
                  alt="QR Pago"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Número para copiar */}
            <div className="text-center mb-3">
              <p className="text-gray-400 text-[10px] mb-1.5">También puedes pagar al siguiente número</p>
              <div className="relative">
                <div className="flex items-center justify-center gap-2 bg-gray-800/50 border border-green-500/20 rounded-lg py-2 px-3">
                  <span className="text-green-400 font-bold text-sm tracking-wider">906237356</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('906237356');
                      setShowCopiedMessage(true);
                      setTimeout(() => setShowCopiedMessage(false), 1500);
                    }}
                    className="text-green-400 hover:text-green-300 transition-colors active:scale-95"
                    title="Copiar número"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                {showCopiedMessage && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-lg shadow-lg animate-fade-in">
                    Numero copiado
                  </div>
                )}
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
                  <span>Realiza el pago de S/ {realTotal.toFixed(2)}</span>
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
