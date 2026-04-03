"use client";
// VERSION: 3.0.0 - Complete UI/UX redesign for better visual hierarchy and responsiveness

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { isBusinessOpen, getNextOpenMessage } from "../utils/businessHours";
import MpCardModal from "../components/MpCardModal";

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
  { id: "teriyaki", name: "Oriental Teriyaki" },
  { id: "macerichada", name: "Sweet & Sour" },
];

// Sabores de tacos para mostrar en el resumen del pedido
const tacoFlavors: Record<string, string> = {
  "santo-crujiente": "Crunch Supreme Taco",
  "tex-dilema": "Tex Supreme Taco",
  "santo-bacon": "Bacon Deluxe Taco",
};

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
    price: 20.00,
    image: "/pequeno-dilema.png?v=3",
  },
  {
    id: "duo-dilema",
    name: "Dúo Dilema",
    price: 34.00,
    image: "/duo-dilema.png?v=3",
  },
  {
    id: "santo-pecado",
    name: "Santo Pecado",
    price: 47.00,
    image: "/todos-pecan.png?v=3",
  },
];

// Productos fit para referencia
const fitProducts = [
  {
    id: "ensalada-clasica",
    name: "CLÁSICA FRESH BOWL",
    price: 18.50,
    image: "/clasica-fresh-bowl.png",
  },
  {
    id: "ensalada-proteica",
    name: "CÉSAR POWER BOWL",
    price: 20.00,
    image: "/cesar-power-bowl.png",
  },
  {
    id: "ensalada-caesar",
    name: "PROTEIN FIT BOWL",
    price: 20.00,
    image: "/protein-fit-bowl.png",
  },
  {
    id: "ensalada-mediterranea",
    name: "TUNA FRESH BOWL",
    price: 23.50,
    image: "/4.png",
  },
  {
    id: "cobb-supreme-bowl",
    name: "COBB SUPREME BOWL",
    price: 23.50,
    image: "/cobb.png",
  },
  {
    id: "crispy-chicken-bowl",
    name: "CRISPY CHICKEN BOWL",
    price: 22.50,
    image: "/crispy.png",
  },
  {
    id: "pasta-power-bowl",
    name: "PASTA POWER BOWL",
    price: 22.50,
    image: "/pasta.png",
  },
];

// Productos tacos para referencia
const tacoProducts = [
  {
    id: "taco-duo",
    name: "Dúo de Tacos",
    price: 24.90,
    image: "/tacoinicio.png",
  },
  // legacy — por si hay órdenes antiguas en sessionStorage
  { id: "trio-taco-classico", name: "Trío Taco Clásico", price: 22.90, image: "/tacoinicio.png" },
  { id: "taco-fiesta-mix", name: "Taco Fiesta Mix", price: 32.90, image: "/tacoinicio.png" },
  { id: "mega-taco-combo", name: "Mega Taco Combo", price: 42.90, image: "/tacoinicio.png" },
];


export default function CheckoutPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMobileFormModal, setShowMobileFormModal] = useState(false);
  const [mobileFormCompleted, setMobileFormCompleted] = useState(false);
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
  const [showMpCardModal, setShowMpCardModal] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para cupón
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponValid, setCouponValid] = useState(false);
  const [couponHasDeliveryFree, setCouponHasDeliveryFree] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState<'centro' | 'alrededores' | ''>('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  // Estados para delivery
  const [deliveryOption] = useState<string>("otros");

  // Reproducir sonido cuando el pedido se confirma
  useEffect(() => {
    if (orderPlaced) {
      playSuccessSound();
    }
  }, [orderPlaced]);


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
    // Abrir modal de datos de entrega automáticamente
    setShowMobileFormModal(true);
  }, []);

  // Detectar combo FAT + FIT para descuento S/ 5.00 (debe estar ANTES de subtotal)
  const COMBO_FAT_IDS = ["pequeno-dilema", "duo-dilema", "santo-pecado"];
  const COMBO_FIT_IDS = ["ensalada-clasica", "ensalada-proteica", "ensalada-caesar", "ensalada-mediterranea"];
  const hasComboDiscount = false; // Promoción desactivada
  const comboDiscountAmount = 0;

  // Detectar si hay productos con descuentos individuales (ej: promo S/ 16)
  const hasIndividualDiscount = completedOrders.some(o => o.discountApplied === true);

  // Verificar si hay alguna promoción activa (combo o individual)
  const hasAnyActivePromotion = hasComboDiscount || hasIndividualDiscount;

  // Calcular subtotal BASE (sin promociones) - para aplicar cupones
  const subtotalBase = completedOrders.reduce((total, order) => {
    const fatProduct = fatProducts.find((p) => p.id === order.productId);
    const fitProduct = fitProducts.find((p) => p.id === order.productId);
    const tacoProduct = tacoProducts.find((p) => p.id === order.productId);
    const product = fatProduct || fitProduct || tacoProduct;

    if (!product) return total;

    // Usar SIEMPRE el precio original del producto (sin descuentos)
    const originalPrice = order.originalPrice ?? product.price;
    const productTotal = originalPrice * order.quantity;

    // Calcular total de complementos
    const complementsTotal = order.complementIds.reduce((sum, compId) => {
      return sum + (availableComplements[compId]?.price || 0);
    }, 0);

    return total + productTotal + complementsTotal;
  }, 0);

  // Calcular subtotal REAL (con promociones aplicadas)
  const subtotal = completedOrders.reduce((total, order) => {
    // Buscar el producto en los arrays
    const fatProduct = fatProducts.find((p) => p.id === order.productId);
    const fitProduct = fitProducts.find((p) => p.id === order.productId);
    const tacoProduct = tacoProducts.find((p) => p.id === order.productId);
    const product = fatProduct || fitProduct || tacoProduct;

    if (!product) return total;

    // Promos no acumulables: si combo activo, ignorar descuento individual
    const basePrice = order.finalPrice ?? product.price;
    const productPrice = (hasComboDiscount && order.discountApplied)
      ? (order.originalPrice ?? product.price)
      : basePrice;
    const productTotal = productPrice * order.quantity;

    // Calcular total de complementos
    const complementsTotal = order.complementIds.reduce((sum, compId) => {
      return sum + (availableComplements[compId]?.price || 0);
    }, 0);

    return total + productTotal + complementsTotal;
  }, 0);

  // Delivery siempre incluido — sin cobro de zona
  const deliveryCost = 0;

  // Aplicar descuento de cupón si es válido (SIEMPRE sobre precio base, no promocional)
  const couponDiscountAmount = couponValid ? (subtotalBase * couponDiscount) / 100 : 0;

  // Si hay cupón válido, usar subtotalBase (elimina promociones)
  // Si NO hay cupón, usar subtotal (mantiene promociones)
  const baseForTotal = couponValid ? subtotalBase : subtotal;
  const deliveryZoneCost = deliveryZone === 'alrededores' ? 4.00 : 0;
  const realTotal = baseForTotal - comboDiscountAmount - couponDiscountAmount + deliveryZoneCost;

  // Validar si el formulario está completo
  // ── PROGRAMAR COMPRA ─────────────────────────────────────────────
  const OPEN_DAYS = [0, 4, 5, 6]; // Dom, Jue, Vie, Sáb
  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const getPeruNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));

  const dateToStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Retorna los días disponibles para programar (hoy si es día hábil, o los próximos 3 días hábiles)
  const getScheduleDays = (): { dateStr: string; label: string }[] => {
    const now = getPeruNow();
    const todayDay = now.getDay();
    const results: { dateStr: string; label: string }[] = [];

    if (OPEN_DAYS.includes(todayDay)) {
      // Es día hábil → solo hoy
      results.push({ dateStr: dateToStr(now), label: 'Hoy' });
    } else {
      // No es día hábil → próximos días hábiles (hasta 3)
      for (let i = 1; i <= 7 && results.length < 3; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        if (OPEN_DAYS.includes(d.getDay())) {
          const label = i === 1 ? 'Mañana' : DAY_NAMES[d.getDay()];
          results.push({ dateStr: dateToStr(d), label });
        }
      }
    }
    return results;
  };

  // Slots de 18:30–23:00. Si la fecha es hoy, filtra los que ya pasaron (+ 30 min)
  const getSlotsForDate = (dateStr: string): string[] => {
    const slots: string[] = [];
    const now = getPeruNow();
    const todayStr = dateToStr(now);
    const isToday = dateStr === todayStr;
    const minMs = now.getTime() + 30 * 60 * 1000;

    for (let h = 18; h <= 23; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 23 && m > 0) break;
        if (h === 18 && m === 0) continue; // sin opción 6:00 PM
        if (isToday) {
          const slot = new Date(now);
          slot.setHours(h, m, 0, 0);
          if (slot.getTime() < minMs) continue;
        }
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const formatScheduleDisplay = () => {
    if (!scheduledDate || !scheduledTime) return null;
    const [hh, mm] = scheduledTime.split(':');
    const h = parseInt(hh);
    const days = getScheduleDays();
    const dayInfo = days.find(d => d.dateStr === scheduledDate);
    const dayLabel = dayInfo?.label || scheduledDate;
    return `${dayLabel} – ${h > 12 ? h - 12 : h}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const handleConfirmSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      setScheduleError('Por favor selecciona fecha y hora.');
      return;
    }
    setScheduleError('');
    setShowScheduleModal(false);
  };
  // ─────────────────────────────────────────────────────────────────

  const isFormValid = () => {
    const scheduleRequired = !isBusinessOpen();
    const scheduleValid = !scheduleRequired || (!!scheduledDate && !!scheduledTime);
    return (
      formData.name.trim() !== "" &&
      formData.phone.length === 9 &&
      formData.address.trim() !== "" &&
      deliveryZone !== "" &&
      scheduleValid
    );
  };

  // Validar cupón
  const validateCoupon = async () => {
    if (hasAnyActivePromotion) {
      setCouponMessage("Los descuentos no son acumulables");
      return;
    }

    if (!couponCode.trim()) {
      setCouponMessage("Ingresa un código de cupón");
      return;
    }

    if (!formData.phone || formData.phone.length !== 9) {
      setCouponMessage("Completa tu teléfono primero");
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
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponValid(true);
        setCouponDiscount(data.discount);
        setCouponHasDeliveryFree(data.deliveryFree || false);

        if (data.deliveryFree) {
          setCouponMessage(`✓ Cupón aplicado: Delivery Gratis`);
        } else {
          setCouponMessage(`✓ Cupón aplicado: ${data.discount}% de descuento`);
        }
      } else {
        setCouponValid(false);
        setCouponDiscount(0);
        setCouponHasDeliveryFree(false);
        setCouponMessage(data.error || "Cupón no válido");
      }
    } catch (error) {
      setCouponValid(false);
      setCouponDiscount(0);
      setCouponHasDeliveryFree(false);
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

  const handlePhoneInput = (value: string) => {
    // Solo permite números, sin espacios
    const numbersOnly = value.replace(/\D/g, '');
    setFormData({ ...formData, phone: numbersOnly });
  };

  const handleNameInput = (value: string) => {
    // Solo permite letras y espacios, convierte a mayúsculas
    const lettersOnly = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase();
    setFormData({ ...formData, name: lettersOnly });
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
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('completedOrders', JSON.stringify(completedOrders));
      formDataToSend.append('totalItems', completedOrders.length.toString());
      formDataToSend.append('totalPrice', realTotal.toString());
      formDataToSend.append('comboDiscount', hasComboDiscount ? '5' : '0');
      formDataToSend.append('couponDiscount', couponValid ? couponDiscount.toString() : '0');
      formDataToSend.append('couponCode', couponValid ? couponCode.trim().toUpperCase() : '');
      formDataToSend.append('paymentMethod', overridePaymentMethod || paymentMethod || 'contraentrega');
      if (cantoCancelo) {
        formDataToSend.append('cantoCancelo', cantoCancelo);
      }
      // Agregar delivery
      formDataToSend.append('deliveryOption', deliveryZone || 'centro');
      formDataToSend.append('deliveryCost', deliveryZoneCost.toString());
      // Pedido programado
      if (scheduledDate && scheduledTime) {
        formDataToSend.append('scheduledDate', scheduledDate);
        formDataToSend.append('scheduledTime', scheduledTime);
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
                phone: formData.phone,
              }),
            });
            console.log("✓ Cupón marcado como usado");
          } catch (error) {
            console.error("Error al marcar cupón como usado:", error);
          }
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

  const handleMercadoPago = () => {
    setShowPaymentModal(false);
    setShowMpCardModal(true);
  };

  const handleMpSuccess = (paymentId: string | number) => {
    setShowMpCardModal(false);
    confirmOrder('tarjeta-mp');
  };

  const handleMpError = (detail: string) => {
    setShowMpCardModal(false);
    setShowPaymentModal(true);
    alert(`Pago rechazado: ${detail}`);
  };

  if (isSubmitting && !orderPlaced) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex flex-col">
      {/* Header mejorado */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/10">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity">
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={280}
              height={70}
              className="h-9 md:h-11 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Main Content - Desktop: dos columnas, Mobile: stack */}
      <main className="flex-1 container mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 max-w-7xl mx-auto">

          {/* Columna Izquierda - Datos de entrega */}
          <div className="lg:col-span-8">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-fuchsia-500/20 p-4 md:p-6 shadow-xl">
              {isFormValid() ? (
                /* Card resumen de datos completados */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-fuchsia-400">Datos de entrega</h2>
                    <button
                      type="button"
                      onClick={() => setShowMobileFormModal(true)}
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 underline transition-colors"
                    >Editar</button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300 flex items-center gap-2"><span className="text-fuchsia-400 w-4">👤</span><span className="font-bold text-white">{formData.name}</span></p>
                    <p className="text-gray-300 flex items-center gap-2"><span className="text-fuchsia-400 w-4">📱</span><span className="font-mono">{formData.phone}</span></p>
                    <p className="text-gray-300 flex items-start gap-2"><span className="text-fuchsia-400 w-4 mt-0.5">📍</span><span>{formData.address}</span></p>
                    <p className="text-gray-300 flex items-center gap-2">
                      <span className="text-fuchsia-400 w-4">🛵</span>
                      <span>{deliveryZone === 'centro' ? 'Chancay Centro — Gratis' : 'Chancay Alrededores — S/ 4.00'}</span>
                    </p>
                  </div>
                </div>
              ) : (
                /* Estado vacío - invitar a completar */
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm mb-3">Completa tus datos para continuar</p>
                  <button
                    type="button"
                    onClick={() => setShowMobileFormModal(true)}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all active:scale-95"
                  >
                    Ingresar datos de entrega
                  </button>
                  <p className="text-red-400 text-xs font-semibold mt-2">* Obligatorio</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha - Resumen del Pedido (4 cols en desktop) */}
          <div className="lg:col-span-4">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-fuchsia-500/20 p-4 md:p-5 shadow-xl sticky top-24">
              <h2 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400 mb-4">
                Resumen del Pedido
              </h2>

              {/* Lista de productos */}
              <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {completedOrders.map((order, index) => {
                  const fatProduct = fatProducts.find((p) => p.id === order.productId);
                  const fitProduct = fitProducts.find((p) => p.id === order.productId);
                  const product = fatProduct || fitProduct;

                  if (!product) return null;

                  const basePrice = order.finalPrice ?? product.price;
                  const productPrice = (hasComboDiscount && order.discountApplied)
                    ? (order.originalPrice ?? product.price)
                    : basePrice;
                  const productTotal = productPrice * order.quantity;
                  const complementsTotal = order.complementIds.reduce((sum, compId) => {
                    return sum + (availableComplements[compId]?.price || 0);
                  }, 0);

                  return (
                    <div
                      key={`${order.productId}-${index}`}
                      className="bg-black/30 rounded-xl p-3 border border-fuchsia-500/10 hover:border-fuchsia-500/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 border border-fuchsia-400/20">
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
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm leading-tight">
                            {order.quantity > 1 && <span className="text-fuchsia-400">{order.quantity}x </span>}
                            {product.name}
                          </p>

                          {order.salsas && order.salsas.length > 0 && (
                            <div className="text-xs text-amber-300 mt-1.5 flex items-start gap-1">
                              <span>{order.productId === "taco-duo" ? "🌮" : "🌶️"}</span>
                              <span className="flex-1">
                                {order.productId === "taco-duo"
                                  ? order.salsas.map((id) => tacoFlavors[id] || id).join(" + ")
                                  : order.salsas
                                      .map((sId) => salsas.find((s) => s.id === sId)?.name)
                                      .filter((name) => name)
                                      .join(", ")}
                              </span>
                            </div>
                          )}

                          {order.complementIds.length > 0 && (
                            <div className="text-xs text-fuchsia-300 space-y-1 mt-1.5">
                              {order.complementIds.map((compId, i) => {
                                const comp = availableComplements[compId];
                                if (!comp) return null;
                                return (
                                  <div key={`${compId}-${i}`} className="flex justify-between items-center">
                                    <span className="opacity-80">+ {comp.name}</span>
                                    <span className="font-mono text-xs">S/ {comp.price.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          {order.discountApplied && !hasComboDiscount && (
                            <div className="flex flex-col items-end gap-1 mb-1">
                              <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">🔥 PROMO</span>
                              <span className="text-gray-500 line-through text-[10px] font-mono">
                                S/ {((order.originalPrice ?? productPrice) * order.quantity).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <span className="text-amber-400 font-black text-sm font-mono">
                            S/ {productTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Aviso promos no acumulables */}
              {hasComboDiscount && completedOrders.some(o => o.discountApplied) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
                  <p className="text-center text-xs text-amber-300">
                    * Las promociones no son acumulables
                  </p>
                </div>
              )}

              {/* Sección de cupón */}
              <div className="border-t border-fuchsia-500/20 pt-4 mb-4">
                <p className="text-white font-bold text-sm mb-2">¿Tienes un cupón?</p>
                {hasAnyActivePromotion ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    <p className="text-amber-300 text-xs text-center">
                      ⚠️ No acumulable con otras promociones
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="SANTO13-XXXXXX"
                        disabled={couponValid}
                        className="flex-1 bg-gray-800/50 border border-fuchsia-500/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/20 transition-all disabled:opacity-50 font-mono"
                      />
                      <button
                        type="button"
                        onClick={validateCoupon}
                        disabled={couponValidating || couponValid}
                        className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 active:scale-95 min-w-[80px]"
                      >
                        {couponValidating ? "..." : couponValid ? "✓ OK" : "Aplicar"}
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-xs ${couponValid ? 'text-green-400' : 'text-red-400'}`}>
                        {couponMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>


              {/* Totales */}
              <div className="border-t-2 border-fuchsia-500/30 pt-4 space-y-2">
                {(hasComboDiscount || (couponValid && couponDiscount > 0)) && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="text-gray-300 font-mono">S/ {subtotal.toFixed(2)}</span>
                    </div>
                    {hasComboDiscount && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-fuchsia-400 font-bold">🔥 Combo FAT+FIT:</span>
                        <span className="text-fuchsia-400 font-bold font-mono">-S/ {comboDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {couponValid && couponDiscount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-400 font-bold">Cupón -{couponDiscount}%:</span>
                        <span className="text-green-400 font-bold font-mono">-S/ {couponDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}


                {deliveryZone === 'alrededores' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-sky-400 font-bold">🛵 Delivery alrededores:</span>
                    <span className="text-sky-400 font-bold font-mono">+S/ 4.00</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="text-white font-black text-lg">Total:</span>
                  <span className="text-amber-400 font-black text-2xl font-mono">
                    S/ {realTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Aviso restaurante cerrado */}
              {!isBusinessOpen() && !scheduledDate && (
                <div className="mt-4 bg-amber-900/20 border border-amber-500/50 rounded-xl px-4 py-3">
                  <p className="text-amber-400 font-bold text-sm">⏰ Estamos cerrados ahora</p>
                  <p className="text-amber-300/80 text-xs mt-0.5">{getNextOpenMessage()} — Debes programar tu entrega.</p>
                </div>
              )}

              {/* Programar compra */}
              <div className="mt-3">
                {scheduledDate && scheduledTime ? (
                  <div className="flex items-center justify-between bg-indigo-900/30 border border-indigo-500/50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-indigo-300 font-bold text-sm">🗓 Entrega programada</p>
                      <p className="text-white font-black text-base">{formatScheduleDisplay()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setScheduledDate(''); setScheduledTime(''); }}
                      className="text-gray-500 hover:text-red-400 text-lg transition-colors"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const days = getScheduleDays();
                      setScheduleError('');
                      setScheduledDate(days[0]?.dateStr || '');
                      setScheduledTime('');
                      setShowScheduleModal(true);
                    }}
                    className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all active:scale-95 text-sm ${
                      !isBusinessOpen()
                        ? 'bg-amber-900/30 border-2 border-amber-500/60 text-amber-300 hover:bg-amber-900/50'
                        : 'bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-indigo-200'
                    }`}
                  >
                    {!isBusinessOpen() ? '⚠️ Programar entrega (obligatorio)' : '🗓 Programar compra'}
                  </button>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 mt-6">
                <Link
                  href={completedOrders.some(o => o.salsas && o.salsas.length > 0) ? "/fat?from=checkout" : "/fit?from=checkout"}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-gray-600"
                >
                  <span>←</span>
                  <span>Volver</span>
                </Link>
                <button
                  type="button"
                  disabled={isSubmitting || !isFormValid()}
                  onClick={() => {
                    const baseValid = formData.name.trim() !== "" && formData.phone.length === 9 && formData.address.trim() !== "" && deliveryZone !== "";
                    if (!baseValid) {
                      setShowMobileFormModal(true);
                      return;
                    }
                    if (!isBusinessOpen() && (!scheduledDate || !scheduledTime)) {
                      const days = getScheduleDays();
                      setScheduleError('');
                      setScheduledDate(days[0]?.dateStr || '');
                      setScheduledTime('');
                      setShowScheduleModal(true);
                      return;
                    }
                    if (isPreLaunch()) {
                      setShowPreLaunchModal(true);
                      return;
                    }
                    setShowPaymentModal(true);
                  }}
                  className="flex-[2] bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/30"
                >
                  {isSubmitting ? "Procesando..." : "Confirmar Pedido"}
                </button>
              </div>

              {!isFormValid() && (
                <p className="text-red-400 text-xs text-center mt-3 flex items-center justify-center gap-1">
                  <span>⚠️</span>
                  <span>Completa todos los campos obligatorios</span>
                </p>
              )}

              <p className="text-gray-400 text-[10px] text-center mt-3 leading-relaxed">
                Al confirmar, nos pondremos en contacto para coordinar la entrega
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Formulario Móvil - MEJORADO */}
      {showMobileFormModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div
            className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border-2 border-fuchsia-500/40 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con logo */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-fuchsia-500/20">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">
                Datos de Entrega
              </h3>
              <div className="flex items-center gap-3">
                <Image
                  src="/logoprincipal.png"
                  alt="Santo Dilema"
                  width={100}
                  height={28}
                  className="h-7 w-auto"
                />
                {isFormValid() && (
                  <button
                    onClick={() => setShowMobileFormModal(false)}
                    className="w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all active:scale-95"
                  >
                    <span className="text-gray-300 text-xl leading-none">×</span>
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 pb-8 pt-5">

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isFormValid()) {
                  setMobileFormCompleted(true);
                  setShowMobileFormModal(false);
                }
              }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-bold text-fuchsia-400 mb-2">
                  Nombre completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameInput(e.target.value)}
                  placeholder="Ingresa tu nombre completo"
                  className="w-full px-4 py-4 text-base rounded-xl bg-gray-800/50 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-fuchsia-400 mb-2">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={formData.phone}
                  onChange={(e) => handlePhoneInput(e.target.value)}
                  maxLength={9}
                  placeholder="987654321"
                  className="w-full px-4 py-4 text-base rounded-xl bg-gray-800/50 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all placeholder:text-gray-500 font-mono"
                />
                {formData.phone.length > 0 && formData.phone.length < 9 && (
                  <p className="text-red-400 text-xs mt-1">El teléfono debe tener 9 dígitos</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-fuchsia-400 mb-2">
                  Dirección de entrega <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej: Av. Principal 123, Chancay"
                  className="w-full px-4 py-4 text-base rounded-xl bg-gray-800/50 border-2 border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all placeholder:text-gray-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Zona de delivery */}
              <div>
                <p className="text-sm font-bold text-fuchsia-400 mb-3">
                  Elige la zona de delivery <span className="text-red-400">*</span>
                </p>
                <div className="space-y-2">
                  {[
                    { value: 'centro', label: 'Chancay Centro', sub: '', price: 'Gratis', priceColor: 'text-green-400' },
                    { value: 'alrededores', label: 'Chancay Alrededores', sub: 'Puerto · Peralvillo · La Balanza', price: 'S/ 4.00', priceColor: 'text-sky-400' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      onClick={() => setDeliveryZone(opt.value as 'centro' | 'alrededores')}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryZone === opt.value
                          ? 'border-fuchsia-500 bg-fuchsia-900/30'
                          : 'border-gray-700 bg-gray-800/40 hover:border-fuchsia-500/50'
                      }`}
                    >
                      {/* Checkbox circular */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        deliveryZone === opt.value ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-gray-500'
                      }`}>
                        {deliveryZone === opt.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${deliveryZone === opt.value ? 'text-white' : 'text-gray-300'}`}>{opt.label}</p>
                        {opt.sub && <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>}
                      </div>
                      <span className={`font-black text-sm font-mono flex-shrink-0 ${opt.priceColor}`}>{opt.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid()}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar datos
              </button>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Programar Compra */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowScheduleModal(false); }}
        >
          <div className="bg-gray-900 border-2 border-indigo-500/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-indigo-300">🗓 Programar entrega</h3>
              <button onClick={() => setShowScheduleModal(false)} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 text-lg transition-all">×</button>
            </div>

            {/* Aviso */}
            {!isBusinessOpen() && (
              <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl px-4 py-2.5 mb-3 flex items-center gap-2">
                <span className="text-lg">⏰</span>
                <p className="text-amber-300 text-xs font-bold">Estamos cerrados — programa tu entrega para continuar</p>
              </div>
            )}
            <div className="bg-purple-900/30 border border-purple-500/40 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
              <span className="text-lg">📱</span>
              <p className="text-purple-300 text-xs font-bold">Los pedidos programados solo aceptan pago con Yape/Plin</p>
            </div>

            {/* Selector de día (si hay más de 1 opción) */}
            {(() => {
              const days = getScheduleDays();
              return days.length > 1 ? (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Elige el día</p>
                  <div className="flex gap-2 flex-wrap">
                    {days.map((d) => (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => { setScheduledDate(d.dateStr); setScheduledTime(''); }}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                          scheduledDate === d.dateStr
                            ? 'border-indigo-500 bg-indigo-900/40 text-indigo-200'
                            : 'border-gray-700 bg-gray-800/40 text-gray-300 hover:border-indigo-500/50'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Selector de hora */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Elige la hora</p>
            {scheduledDate && getSlotsForDate(scheduledDate).length === 0 ? (
              <div className="text-center py-6">
                <p className="text-red-400 text-sm font-bold">No hay horarios disponibles por ahora.</p>
                <p className="text-gray-500 text-xs mt-1">El horario de entrega es de 6:30 PM a 11:00 PM.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-5">
                {getSlotsForDate(scheduledDate).map((slot) => {
                  const [hh, mm] = slot.split(':');
                  const h = parseInt(hh);
                  const display = `${h > 12 ? h - 12 : h}:${mm} PM`;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => { setScheduledTime(slot); setScheduleError(''); }}
                      className={`px-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                        scheduledTime === slot
                          ? 'border-indigo-500 bg-indigo-900/40 text-indigo-200'
                          : 'border-gray-700 bg-gray-800/40 text-gray-300 hover:border-indigo-500/50'
                      }`}
                    >
                      {display}
                    </button>
                  );
                })}
              </div>
            )}

            {scheduleError && (
              <p className="text-red-400 text-xs mb-3 text-center">{scheduleError}</p>
            )}

            <button
              type="button"
              onClick={handleConfirmSchedule}
              disabled={!scheduledTime}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-all active:scale-95"
            >
              Confirmar hora
            </button>
          </div>
        </div>
      )}

      {/* Modal de Selección de Método de Pago - MEJORADO */}
      {showPaymentModal && !showQrPayment && !showContraEntregaModal && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false);
              setPaymentMethod(null);
            }
          }}
        >
          <div
            className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border-2 border-fuchsia-500/40 max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <Image
                src="/logoprincipal.png"
                alt="Santo Dilema"
                width={180}
                height={50}
                className="h-10 w-auto"
              />
            </div>

            <h3 className="text-lg font-black text-white text-center mb-1">Método de pago</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Total: <span className="text-amber-400 font-black font-mono text-lg">S/ {realTotal.toFixed(2)}</span>
            </p>

            <div className="space-y-3">
              {scheduledDate && scheduledTime && (
                <div className="bg-indigo-900/30 border border-indigo-500/40 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <span className="text-lg">🗓</span>
                  <p className="text-indigo-300 text-xs font-bold">Pedido programado — solo Yape/Plin</p>
                </div>
              )}

              <button
                onClick={() => {
                  setPaymentMethod('anticipado');
                  setShowQrPayment(true);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-700 bg-gray-800/40 hover:bg-gray-800/70 hover:border-fuchsia-500/50 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl flex-shrink-0">
                  📱
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-bold text-base">Paga con Yape o Plin</p>
                  <p className="text-gray-400 text-xs mt-0.5">Escanea QR y confirma</p>
                </div>
                <span className="text-gray-500">›</span>
              </button>

              {!(scheduledDate && scheduledTime) && (
                <button
                  onClick={() => {
                    setShowContraEntregaModal(true);
                    setShowEfectivoOptions(false);
                    setSelectedEfectivo(null);
                    setCantoCancelo('');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-700 bg-gray-800/40 hover:bg-gray-800/70 hover:border-fuchsia-500/50 transition-all active:scale-95"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl flex-shrink-0">
                    💵
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white font-bold text-base">Pago contra entrega</p>
                    <p className="text-gray-400 text-xs mt-0.5">Solo efectivo al recibir</p>
                  </div>
                  <span className="text-gray-500">›</span>
                </button>
              )}

              {!(scheduledDate && scheduledTime) && (
                <button
                  onClick={handleMercadoPago}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-700/60 bg-blue-900/20 hover:bg-blue-900/40 hover:border-blue-400/70 transition-all active:scale-95"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                      <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white font-bold text-base">Pagar con tarjeta</p>
                    <p className="text-gray-400 text-xs mt-0.5">Visa, Mastercard · Mercado Pago</p>
                  </div>
                  <span className="text-gray-500">›</span>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentMethod(null);
              }}
              className="w-full mt-5 text-gray-400 hover:text-gray-200 text-sm transition-colors py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Contra Entrega - MEJORADO */}
      {showContraEntregaModal && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4"
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
            className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border-2 border-green-500/40 max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <Image
                src="/logoprincipal.png"
                alt="Santo Dilema"
                width={180}
                height={50}
                className="h-10 w-auto"
              />
            </div>

            <button
              onClick={() => {
                setShowContraEntregaModal(false);
                setSelectedEfectivo(null);
                setCantoCancelo('');
              }}
              className="text-gray-400 hover:text-gray-200 text-sm transition-colors mb-4 flex items-center gap-1"
            >
              <span>←</span>
              <span>Volver</span>
            </button>

            <h3 className="text-lg font-black text-white text-center mb-2">Pago contra entrega</h3>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 mb-4">
              <p className="text-blue-300 text-sm text-center font-bold flex items-center justify-center gap-2">
                <span className="text-xl">💵</span>
                <span>Solo pago en efectivo</span>
              </p>
            </div>
            <p className="text-gray-400 text-sm text-center mb-6">
              Total: <span className="text-amber-400 font-black font-mono text-lg">S/ {realTotal.toFixed(2)}</span>
            </p>

            <div className="space-y-3 mb-5">
              <button
                onClick={() => {
                  setSelectedEfectivo('exacto');
                  setCantoCancelo('');
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all active:scale-95 ${
                  selectedEfectivo === 'exacto'
                    ? 'border-fuchsia-500 bg-fuchsia-900/30'
                    : 'border-gray-700 hover:border-fuchsia-500/50 bg-gray-800/40 hover:bg-gray-800/70'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedEfectivo === 'exacto' ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-gray-600'
                }`}>
                  <div className={`w-3 h-3 rounded-full bg-fuchsia-500 transition-opacity ${
                    selectedEfectivo === 'exacto' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-bold text-base">Monto exacto</p>
                  <p className="text-gray-400 text-xs mt-0.5">Tengo S/ {realTotal.toFixed(2)} exacto</p>
                </div>
                <span className="text-green-400 text-xl">✓</span>
              </button>

              <button
                onClick={() => setSelectedEfectivo('cambio')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all active:scale-95 ${
                  selectedEfectivo === 'cambio'
                    ? 'border-fuchsia-500 bg-fuchsia-900/30'
                    : 'border-gray-700 hover:border-fuchsia-500/50 bg-gray-800/40 hover:bg-gray-800/70'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedEfectivo === 'cambio' ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-gray-600'
                }`}>
                  <div className={`w-3 h-3 rounded-full bg-fuchsia-500 transition-opacity ${
                    selectedEfectivo === 'cambio' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-bold text-base">Necesito cambio</p>
                  <p className="text-gray-400 text-xs mt-0.5">Pagaré con billetes</p>
                </div>
                <span className="text-amber-400 text-xl">💵</span>
              </button>

              {selectedEfectivo === 'cambio' && (
                <div className="pt-2">
                  <label className="block text-sm font-bold text-fuchsia-400 mb-2">¿Con cuánto cancelas?</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base font-bold">S/</span>
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
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border-2 border-fuchsia-500/30 text-white text-base font-mono focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  {cantoCancelo && parseFloat(cantoCancelo) < realTotal && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>El monto debe ser mayor o igual a S/ {realTotal.toFixed(2)}</span>
                    </p>
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
              className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-fuchsia-500/30"
            >
              Confirmar pedido
            </button>

            <button
              onClick={() => {
                setShowContraEntregaModal(false);
                setShowEfectivoOptions(false);
                setSelectedEfectivo(null);
                setCantoCancelo('');
              }}
              className="w-full mt-3 text-gray-400 hover:text-gray-200 text-sm transition-colors py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Pre-lanzamiento */}
      {showPreLaunchModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-fuchsia-500/40 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-6xl mb-5">🚀</div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400 mb-3">
              ¡Casi es la hora!
            </h3>
            <p className="text-white text-base mb-2">
              Abrimos hoy a las
            </p>
            <p className="text-fuchsia-300 font-black text-3xl mb-2">
              6:30 PM
            </p>
            <p className="text-fuchsia-400/70 text-sm mb-6">
              Viernes 13 de Febrero · Hora Perú
            </p>
            <p className="text-gray-300 text-sm mb-8 leading-relaxed">
              Puedes seguir explorando el menú y armar tu pedido. ¡Te esperamos en unos minutos!
            </p>
            <button
              onClick={() => setShowPreLaunchModal(false)}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-fuchsia-500/30"
            >
              Entendido →
            </button>
          </div>
        </div>
      )}

      {/* Modal de Pago con QR - MEJORADO */}
      {showQrPayment && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border-2 border-green-500/40 max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-center mb-4">
              <Image
                src="/logoprincipal.png"
                alt="Santo Dilema"
                width={180}
                height={50}
                className="h-10 w-auto"
              />
            </div>

            <div className="text-center mb-4">
              <h3 className="text-lg font-black text-green-400">Escanea y Paga</h3>
              <p className="text-gray-400 text-sm mt-1">
                Total: <span className="text-amber-400 font-black font-mono text-lg">S/ {realTotal.toFixed(2)}</span>
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="bg-white rounded-2xl p-3 shadow-xl" style={{ width: '160px', height: '160px' }}>
                <img
                  src="/nuevoqrfinal.jpg"
                  alt="QR Pago"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Número para copiar */}
            <div className="text-center mb-5">
              <p className="text-gray-400 text-xs mb-2">También puedes pagar al número</p>
              <div className="relative">
                <div className="flex items-center justify-center gap-3 bg-gray-800/50 border-2 border-green-500/30 rounded-xl py-3 px-4">
                  <span className="text-green-400 font-black text-lg tracking-wider font-mono">906237356</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('906237356');
                      setShowCopiedMessage(true);
                      setTimeout(() => setShowCopiedMessage(false), 1500);
                    }}
                    className="text-green-400 hover:text-green-300 transition-colors active:scale-95 p-1"
                    title="Copiar número"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                {showCopiedMessage && (
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg">
                    ✓ Número copiado
                  </div>
                )}
              </div>
            </div>

            {/* Pasos */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-5">
              <ol className="text-white text-sm space-y-2">
                <li className="flex gap-3">
                  <span className="text-green-400 font-black">1.</span>
                  <span>Escanea el QR con Yape o Plin</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400 font-black">2.</span>
                  <span>Realiza el pago de S/ {realTotal.toFixed(2)}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400 font-black">3.</span>
                  <span>Sube tu comprobante abajo</span>
                </li>
              </ol>
            </div>

            {/* Upload comprobante */}
            <div className="mb-5">
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
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition-all active:scale-95"
                >
                  <span className="text-green-400 text-xl">📎</span>
                  <span className="text-green-400 text-sm font-black">SUBIR COMPROBANTE</span>
                </button>
              ) : (
                <div className="flex items-center gap-4 py-3 px-4 rounded-xl border-2 border-green-500/40 bg-green-500/10">
                  <div className="w-10 h-10 rounded-full border-2 border-green-500 bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-green-400 text-sm font-bold">Comprobante adjuntado</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-400 hover:text-gray-200 text-xs transition-colors mt-0.5"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQrPayment(false);
                  setPaymentProof(null);
                  setPaymentMethod(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
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
                className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-green-500/30"
              >
                {isSubmitting ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MpCardModal
        isOpen={showMpCardModal}
        amount={realTotal}
        payerPhone={formData.phone}
        onClose={() => { setShowMpCardModal(false); setShowPaymentModal(true); }}
        onSuccess={handleMpSuccess}
        onPaymentError={handleMpError}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  );
}
