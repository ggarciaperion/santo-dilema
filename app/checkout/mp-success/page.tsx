"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function MpSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const confirmMpOrder = async () => {
      try {
        const paymentId = searchParams.get("payment_id");
        const externalReference = searchParams.get("external_reference");
        const status = searchParams.get("status");

        if (status !== "approved") {
          router.push("/checkout/mp-pending");
          return;
        }

        // Recuperar datos del pedido guardados antes del redirect
        const pendingOrderRaw = sessionStorage.getItem("santo-dilema-mp-pending");
        if (!pendingOrderRaw) {
          setError("No se encontraron los datos del pedido.");
          setIsProcessing(false);
          return;
        }

        const pendingOrder = JSON.parse(pendingOrderRaw);

        // Registrar el pedido con el método de pago "tarjeta"
        const formDataToSend = new FormData();
        formDataToSend.append("name", pendingOrder.name);
        formDataToSend.append("phone", pendingOrder.phone);
        formDataToSend.append("address", pendingOrder.address);
        formDataToSend.append("completedOrders", JSON.stringify(pendingOrder.completedOrders));
        formDataToSend.append("totalItems", pendingOrder.completedOrders.length.toString());
        formDataToSend.append("totalPrice", pendingOrder.totalPrice.toString());
        formDataToSend.append("comboDiscount", "0");
        formDataToSend.append("couponDiscount", pendingOrder.couponDiscount || "0");
        formDataToSend.append("couponCode", pendingOrder.couponCode || "");
        formDataToSend.append("paymentMethod", "tarjeta-mp");
        formDataToSend.append("mpPaymentId", paymentId || "");
        formDataToSend.append("mpExternalReference", externalReference || "");
        formDataToSend.append("deliveryOption", pendingOrder.deliveryOption || "centro");
        formDataToSend.append("deliveryCost", pendingOrder.deliveryCost || "0");
        formDataToSend.append("timestamp", new Date().toISOString());

        const response = await fetch("/api/orders", {
          method: "POST",
          body: formDataToSend,
        });

        if (response.ok) {
          sessionStorage.removeItem("santo-dilema-mp-pending");
          sessionStorage.removeItem("santo-dilema-orders");
          setOrderConfirmed(true);
        } else {
          setError("El pago fue exitoso pero hubo un error registrando el pedido. Escríbenos por WhatsApp.");
        }
      } catch (err) {
        console.error(err);
        setError("Error al confirmar el pedido. Contáctanos por WhatsApp.");
      } finally {
        setIsProcessing(false);
      }
    };

    confirmMpOrder();
  }, []);

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-amber-400 font-bold animate-pulse">Confirmando tu pedido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-red-500/40 rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-white font-black text-xl mb-2">Pago exitoso</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <a
            href="https://wa.me/51999999999"
            className="block w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition-all"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-green-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="flex justify-center mb-4">
          <Image src="/logoprincipal.png" alt="Santo Dilema" width={160} height={45} className="h-10 w-auto" />
        </div>

        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>

        <h2 className="text-white font-black text-xl mb-1">¡Pago exitoso!</h2>
        <p className="text-green-400 font-bold text-sm mb-3">Tu pedido está siendo preparado</p>

        <div className="bg-black/40 rounded-xl p-3 mb-5">
          <p className="text-gray-400 text-xs">
            Recibirás una confirmación. Para consultas escríbenos por WhatsApp.
          </p>
        </div>

        <Link
          href="/"
          className="block w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-3 rounded-xl transition-all active:scale-95"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
