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

const availableComplements: Record<string, { name: string; price: number }> = {
  "agua-mineral": { name: "Agua mineral", price: 4.00 },
  "coca-cola": { name: "Coca Cola 500ml", price: 4.00 },
  "inka-cola": { name: "Inka Cola 500ml", price: 4.00 },
  "sprite": { name: "Sprite 500ml", price: 4.00 },
  "fanta": { name: "Fanta 500ml", price: 4.00 },
  "extra-papas": { name: "Extra papas", price: 4.00 },
  "extra-salsa": { name: "Extra salsa", price: 3.00 }
};

// Variable de módulo: persiste entre navegaciones client-side, se resetea en reload/refresh
let fatPageInitialized = false;

export default function FatPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrderIndex, setDeleteOrderIndex] = useState<number | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState<boolean>(false);
  const [editingOrderIndex, setEditingOrderIndex] = useState<number | null>(null);
  const router = useRouter();

  const completedTotal = completedOrders.reduce((total, order) => {
    const product = products.find(p => p.id === order.productId);
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

  // Cargar órdenes existentes o limpiar según el tipo de navegación
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromCheckout = urlParams.get('from') === 'checkout';

    // Botón "Volver" desde checkout: siempre restaurar
    if (fromCheckout) {
      fatPageInitialized = true;
      const savedOrders = localStorage.getItem("santo-dilema-fat-orders");
      if (savedOrders) {
        try {
          const orders = JSON.parse(savedOrders);
          setCompletedOrders(orders);

          clearCart();
          orders.forEach((order: CompletedOrder) => {
            const product = products.find(p => p.id === order.productId);
            if (product) {
              addToCart(product, order.quantity);
              order.complementIds.forEach((complementId) => {
                const complement = availableComplements[complementId];
                if (complement) {
                  addToCart({
                    id: complementId,
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

          window.history.replaceState({}, '', '/fat');
          setExpandedCard(null);

          setTimeout(() => {
            const orderSection = document.getElementById('tu-orden-section');
            if (orderSection) {
              orderSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        } catch (error) {
          console.error("Error loading orders:", error);
          localStorage.removeItem("santo-dilema-fat-orders");
          localStorage.removeItem("santo-dilema-cart");
          clearCart();
        }
      }
      return;
    }

    // Primera carga del módulo en esta sesión (reload/refresh resets fatPageInitialized)
    if (!fatPageInitialized) {
      fatPageInitialized = true;
      localStorage.removeItem("santo-dilema-fat-orders");
      localStorage.removeItem("santo-dilema-cart");
      clearCart();
      return;
    }

    // Remontaje por navegación client-side (botón atrás del navegador)
    const savedOrders = localStorage.getItem("santo-dilema-fat-orders");
    if (savedOrders) {
      try {
        const orders = JSON.parse(savedOrders);
        setCompletedOrders(orders);
      } catch (error) {
        console.error("Error loading orders:", error);
        localStorage.removeItem("santo-dilema-fat-orders");
        localStorage.removeItem("santo-dilema-cart");
        clearCart();
      }
    }
  }, []);

  // Guardar órdenes completadas en localStorage cuando cambien
  useEffect(() => {
    if (completedOrders.length > 0) {
      localStorage.setItem("santo-dilema-fat-orders", JSON.stringify(completedOrders));
    } else {
      localStorage.removeItem("santo-dilema-fat-orders");
    }
  }, [completedOrders]);

  // Centrar el carrusel en el cartel del medio al cargar la página
  useEffect(() => {
    const centerCarousel = () => {
      if (scrollContainerRef.current && cardRefs.current["duo-dilema"]) {
        const container = scrollContainerRef.current;
        const middleCard = cardRefs.current["duo-dilema"];

        if (middleCard) {
          const cardLeft = middleCard.offsetLeft;
          const cardWidth = middleCard.offsetWidth;
          const containerWidth = container.offsetWidth;

          const scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);
          container.scrollLeft = scrollPosition;
        }
      }
    };

    // Esperar un momento para que el DOM esté completamente renderizado
    const timer = setTimeout(centerCarousel, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cerrar cartel al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!expandedCard) return;

      const target = event.target as HTMLElement;
      const expandedCardElement = cardRefs.current[expandedCard];

      // Si el clic fue fuera del cartel expandido, cerrarlo
      if (expandedCardElement && !expandedCardElement.contains(target)) {
        handleCloseCard();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedCard]);

  const getRequiredSalsasCount = (productId: string): number => {
    const quantity = orderQuantity[productId] || 0;
    if (quantity === 0) return 0;
    let baseSalsas = 1;
    if (productId === "pequeno-dilema") baseSalsas = 1;
    if (productId === "duo-dilema") baseSalsas = 2;
    if (productId === "santo-pecado") baseSalsas = 3;
    return baseSalsas * quantity;
  };

  const handleExpandCard = (productId: string) => {
    if (isDragging) return;
    setExpandedCard(productId);
    setShowSalsas((prev) => ({ ...prev, [productId]: true }));
    setIsEditingOrder(false); // Es una nueva orden, no edición
    if (!selectedSalsas[productId]) {
      setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
    }
    if (!selectedComplements[productId]) {
      setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
    }

    // Scroll hacia la sección de salsas después de expandir
    setTimeout(() => {
      const card = cardRefs.current[productId];
      if (card) {
        const salsasButton = card.querySelector('[data-salsas-button]');
        if (salsasButton) {
          // Obtener posición actual del scroll
          const currentScroll = window.scrollY || document.documentElement.scrollTop;

          // Obtener posición del botón de salsas
          const rect = salsasButton.getBoundingClientRect();

          // Calcular la posición absoluta del botón (scroll actual + posición relativa)
          const elementTop = currentScroll + rect.top;

          // Calcular cuánto scroll necesitamos para centrar el elemento
          // Centramos restando la mitad de la altura de la ventana
          const offset = window.innerHeight / 2 - rect.height / 2;
          const scrollTarget = elementTop - offset + 100; // +100px para ajuste adicional hacia arriba

          // Hacer scroll suave
          window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          });

          console.log('Scroll triggered:', {
            currentScroll,
            elementTop,
            scrollTarget,
            windowHeight: window.innerHeight
          });
        }
      }
    }, 500);
  };

  const handleCloseCard = () => {
    setExpandedCard(null);
    setIsEditingOrder(false);
    setEditingOrderIndex(null);
    // Limpiar estados
    if (expandedCard) {
      setShowSalsas((prev) => ({ ...prev, [expandedCard]: false }));
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
    // Expandir el card automáticamente
    if (currentQty === 0) {
      setExpandedCard(productId);
      setShowSalsas((prev) => ({ ...prev, [productId]: true }));
      if (!selectedSalsas[productId]) {
        setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
      }
      if (!selectedComplements[productId]) {
        setSelectedComplements((prev) => ({ ...prev, [productId]: [] }));
      }

      // Scroll hacia la sección de salsas después de que se expanda el cartel
      setTimeout(() => {
        const card = cardRefs.current[productId];
        if (card) {
          const salsasButton = card.querySelector('[data-salsas-button]');
          if (salsasButton) {
            salsasButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 600);
    } else {
      // Limpiar salsas cuando cambia la cantidad
      setSelectedSalsas((prev) => ({ ...prev, [productId]: [] }));
    }
  };

  const handleDecreaseQuantity = (productId: string) => {
    const currentQty = orderQuantity[productId] || 0;
    if (currentQty > 0) {
      setOrderQuantity((prev) => ({
        ...prev,
        [productId]: currentQty - 1
      }));
      // Si llega a 0, colapsar el card y limpiar carrito
      if (currentQty === 1) {
        setExpandedCard(null);
        setIsEditingOrder(false);
        setEditingOrderIndex(null);
        setShowSalsas((prev) => ({ ...prev, [productId]: false }));
        setShowBebidas((prev) => ({ ...prev, [productId]: false }));
        setShowExtras((prev) => ({ ...prev, [productId]: false }));
        // Eliminar del carrito si existe
        if (mainProductsInCart[productId]) {
          removeFromCart(mainProductsInCart[productId]);
          setMainProductsInCart((prev) => {
            const newState = { ...prev };
            delete newState[productId];
            return newState;
          });
        }
      }
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
    if (isEditingOrder && editingOrderIndex !== null) {
      setCompletedOrders((prev) => prev.map((order, idx) => idx === editingOrderIndex ? completedOrder : order));
      setEditingOrderIndex(null);
    } else {
      setCompletedOrders((prev) => [...prev, completedOrder]);
    }

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

    // Guardar el índice para reemplazar en completedOrders al confirmar
    setEditingOrderIndex(orderIndex);

    // Restaurar los estados para editar
    setOrderQuantity((prev) => ({ ...prev, [order.productId]: order.quantity }));
    setSelectedSalsas((prev) => ({ ...prev, [order.productId]: order.salsas }));
    setComplementsInCart((prev) => ({ ...prev, [order.productId]: order.complementIds }));

    // Marcar que estamos editando
    setIsEditingOrder(true);

    // Abrir el card expandido
    setExpandedCard(order.productId);
    setShowSalsas((prev) => ({ ...prev, [order.productId]: true }));

    // Desplazar y centrar el cartel correspondiente
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

    // Eliminar esta orden de completedOrders
    setCompletedOrders((prev) => prev.filter((_, idx) => idx !== deleteOrderIndex));

    // Eliminar el plato principal del carrito
    const cartItemId = `${order.productId}-main`;
    removeFromCart(cartItemId);

    // Eliminar los complementos del carrito
    order.complementIds.forEach((complementId) => {
      removeFromCart(complementId);
    });

    // Cerrar modal
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
  };

  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setDeleteOrderIndex(null);
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

  const handleRemoveComplement = (productId: string, complementId: string) => {
    // Encontrar la instancia del complemento en el carrito
    const complementsForProduct = complementsInCart[productId] || [];
    const indexToRemove = complementsForProduct.lastIndexOf(complementId);

    if (indexToRemove !== -1) {
      // Remover del carrito
      removeFromCart(complementId);

      // Actualizar el tracking de complementos
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
      <header className="bg-gray-900 border-b-2 border-red-500 neon-border-fat sticky top-0 z-30">
        <div className="container mx-auto px-2 md:px-4 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
            <h1 className="flex items-center gap-1.5 md:gap-3 text-base md:text-2xl font-black tracking-tight">
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

      {/* Hero Section - Banner */}
      <section className="relative w-full overflow-hidden bg-black pt-4 md:pt-0">
        <div className="relative w-full bg-black">
          {/* Banner para móvil */}
          <img
            src="/bannermovil.png?v=2"
            alt="Banner promocional"
            className="block md:hidden w-full h-auto object-cover"
          />
          {/* Banner para PC/Tablet */}
          <img
            src="/bannerpc.png?v=2"
            alt="Banner promocional"
            className="hidden md:block w-full h-auto object-cover"
            style={{
              maxHeight: '250px',
              objectPosition: 'center',
            }}
          />
        </div>
      </section>

      {/* Products Carousel */}
      <section className={`container mx-auto px-2 md:px-4 py-3 md:py-4 lg:py-6 transition-all duration-300 overflow-visible ${completedOrders.length > 0 ? 'pb-20 md:pb-16' : 'pb-3 md:pb-6'}`}>
        {/* Carousel Container */}
        <div className="relative flex items-center justify-center overflow-visible">
          {/* Scrollable Products */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex items-center gap-2 md:gap-3 lg:gap-4 scrollbar-hide px-1 md:px-4 py-12 md:py-3 lg:py-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} snap-x snap-mandatory md:snap-none`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: isDragging ? 'auto' : 'smooth', userSelect: 'none', overflowX: 'auto', overflowY: 'visible' }}
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
                  className={`bg-gray-900 border-2 flex-shrink-0 border-red-400 neon-border-fat shadow-xl shadow-red-500/30 snap-center overflow-visible
                    ${isExpanded
                      ? 'w-[260px] md:w-[340px] lg:w-[360px] z-20'
                      : 'w-[240px] md:w-[220px] lg:w-[240px]'
                    }
                    ${!isExpanded && hoveredCard === product.id && !expandedCard
                      ? 'md:scale-105 md:-translate-y-2 md:shadow-2xl md:shadow-red-500/50 z-10'
                      : !isExpanded && !expandedCard ? 'md:border-red-500/30 md:shadow-none scale-100 translate-y-0' : ''
                    }
                  `}
                  style={{
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease, box-shadow 0.3s ease',
                    transformOrigin: 'center center',
                    borderRadius: 0,
                  }}
                >
                  {/* Card Header */}
                  <div className={`relative flex items-center justify-center border-b-2 border-red-500/30 overflow-visible ${
                    product.image.startsWith('/')
                      ? 'bg-black h-40 md:h-56'
                      : 'bg-gradient-to-br from-red-900/40 to-orange-900/40 h-20 md:h-28 overflow-hidden rounded-t-lg md:rounded-t-xl'
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
                          zIndex: 100
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
                    <p className="text-orange-200/70 text-[10px] md:text-xs mb-1.5 md:mb-3 line-clamp-3 h-10 md:h-12">
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
                          className="w-5 h-5 md:w-6 md:h-6 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
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
                          className="w-5 h-5 md:w-6 md:h-6 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
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
                    <div className="px-2.5 md:px-4 pb-2.5 md:pb-4 border-t-2 border-red-500/30 pt-2.5 md:pt-3">
                      {/* Botón de Cerrar */}
                      <div className="flex justify-end mb-1.5 md:mb-2">
                        <button
                          onClick={handleCloseCard}
                          className="text-red-400 hover:text-red-300 text-[10px] md:text-xs font-bold flex items-center gap-0.5 md:gap-1 transition-colors"
                        >
                          <span>Mostrar menos</span>
                          <span className="text-sm md:text-lg">×</span>
                        </button>
                      </div>

                      {/* Selector de Salsas - Acordeón */}
                      <div className="mb-2 md:mb-3">
                        <button
                          data-salsas-button
                          onClick={() => setShowSalsas((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                          className={`w-full flex items-center justify-between rounded-md md:rounded-lg p-1.5 md:p-2 transition-all shadow-sm border
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
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-xs md:text-sm">{canAdd ? '✓' : '🌶️'}</span>
                            <span className={`text-[10px] md:text-xs font-bold ${canAdd ? 'text-green-400' : 'text-white'}`}>
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
                          data-salsas-section
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
                        <h5 className="text-xs font-bold text-white mb-2">Complementos</h5>

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
                                const count = getComplementCount(product.id, bebida.id);
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
                                      {count > 0 && (
                                        <>
                                          <button
                                            onClick={() => handleRemoveComplement(product.id, bebida.id)}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-red-600 hover:bg-red-500 text-white"
                                          >
                                            −
                                          </button>
                                          <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">
                                            {count}
                                          </span>
                                        </>
                                      )}
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
                                const count = getComplementCount(product.id, extra.id);
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
                                      {count > 0 && (
                                        <>
                                          <button
                                            onClick={() => handleRemoveComplement(product.id, extra.id)}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-red-600 hover:bg-red-500 text-white"
                                          >
                                            −
                                          </button>
                                          <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">
                                            {count}
                                          </span>
                                        </>
                                      )}
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
                        onClick={() => {
                          handleCompleteOrder(product);
                          setIsEditingOrder(false);
                        }}
                        disabled={!canAdd}
                        className={`w-full py-2.5 rounded font-bold text-sm transition-all
                          ${canAdd
                            ? 'bg-red-500 hover:bg-red-400 text-white neon-border-fat cursor-pointer active:scale-95'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'
                          }
                        `}
                      >
                        {canAdd ? (isEditingOrder ? 'Confirmar orden' : 'Agregar orden') : `Selecciona ${requiredSalsas} salsa${requiredSalsas > 1 ? 's' : ''}`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Texto animado de indulgencia - solo visible cuando no hay órdenes ni cartel expandido */}
        {expandedCard === null && completedOrders.length === 0 && (
          <div className="relative w-full flex justify-center items-center py-4 md:py-6 lg:py-8">
            <div className="text-center animated-text-reveal">
              <h2
                className="text-sm md:text-lg lg:text-xl font-light tracking-wide"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'transparent',
                  WebkitTextStroke: '0.6px #ef4444',
                  letterSpacing: '0.05em',
                  filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.5)) drop-shadow(0 0 6px rgba(239, 68, 68, 0.3))'
                }}
              >
                ¡Promo del día 30% dscto órdenes
              </h2>
              <h3
                className="text-base md:text-xl lg:text-2xl font-bold tracking-wider mt-0.5"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
                  fontWeight: 600,
                  fontStyle: 'italic',
                  color: 'transparent',
                  WebkitTextStroke: '0.8px #ef4444',
                  letterSpacing: '0.1em',
                  filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.5)) drop-shadow(0 0 6px rgba(239, 68, 68, 0.3))'
                }}
              >
                HONEY MUSTANG!
              </h3>
            </div>
          </div>
        )}

        {/* Sección de órdenes agregadas */}
        {completedOrders.length > 0 && (
          <div id="tu-orden-section" className="container mx-auto px-3 md:px-4 -mt-2 md:mt-0 lg:mt-2">
            <h3 className="text-base md:text-lg lg:text-xl font-black text-amber-400 mb-2 md:mb-3 gold-glow">
              Tu orden
            </h3>
            <div className="space-y-2 md:space-y-3">
              {completedOrders.map((order, index) => {
                const product = products.find((p) => p.id === order.productId);
                if (!product) return null;

                return (
                  <div
                    key={`${order.productId}-${index}`}
                    className="bg-gray-900 rounded-lg border-2 border-red-400/30 p-2 md:p-3 relative"
                  >
                    <div className="flex items-start justify-between mb-1 md:mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-red-400/30 flex items-center justify-center">
                          {product.image.startsWith('/') ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">🍗</span>';
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
                                  .map((compId) => availableComplements[compId]?.name)
                                  .filter((name) => name)
                                  .join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 ml-2">
                        <button
                          onClick={() => handleEditOrder(index)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 border border-red-400/30 rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(index)}
                          className="text-red-500 hover:text-red-400 text-xl font-bold transition-all opacity-70 hover:opacity-100"
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
      {completedOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-red-500/50 shadow-2xl shadow-red-500/30 z-50">
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
                className="bg-red-500 hover:bg-red-400 active:scale-95 text-white px-5 md:px-7 py-2.5 md:py-3 rounded-lg font-black text-sm md:text-lg transition-all neon-border-fat"
              >
                Continuar<span className="hidden sm:inline"> Pedido</span> →
              </button>
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
                className="w-full bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-lg font-black text-base transition-all neon-border-fat block text-center"
              >
                Continuar Pedido →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deleteOrderIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border-2 border-red-500 neon-border-fat rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-black text-red-400 mb-4 gold-glow text-center">
              ¡Qué dilema!
            </h3>
            {(() => {
              const order = completedOrders[deleteOrderIndex];
              const product = products.find((p) => p.id === order.productId);
              if (!product) return null;

              const salsasText = order.salsas
                .map((sId) => salsas.find((s) => s.id === sId)?.name)
                .filter((name) => name)
                .join(", ");

              const complementsText = order.complementIds.length > 0
                ? order.complementIds
                    .map((compId) => availableComplements[compId]?.name)
                    .filter((name) => name)
                    .join(", ")
                : "";

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
                  <div className="bg-gray-800/50 border border-red-400/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-amber-400 font-bold">
                        {order.quantity > 1 ? `${order.quantity}x ` : ''}{product.name}
                      </p>
                      <p className="text-amber-400 font-bold gold-glow">
                        S/ {orderTotal}
                      </p>
                    </div>
                    <p className="text-red-300 text-xs">
                      🌶️ Salsas: {salsasText}
                    </p>
                    {complementsText && (
                      <p className="text-red-300 text-xs">
                        🍟 Complementos: {complementsText}
                      </p>
                    )}
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
                className="flex-1 bg-red-500 hover:bg-red-400 text-white px-4 py-3 rounded-lg font-bold transition-all neon-border-fat"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
