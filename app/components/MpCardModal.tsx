"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const MP_PUBLIC_KEY = "APP_USR-10a4a6b8-b93e-4f68-86bd-2c1ffa8b7ec2";

interface MpCardModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: (paymentId: string | number) => void;
  onPaymentError: (detail: string) => void;
}

export default function MpCardModal({
  isOpen,
  amount,
  onClose,
  onSuccess,
  onPaymentError,
}: MpCardModalProps) {
  const brickControllerRef = useRef<any>(null);
  const [brickReady, setBrickReady] = useState(false);
  const [initError, setInitError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      brickControllerRef.current?.unmount?.();
      brickControllerRef.current = null;
      setBrickReady(false);
      setInitError("");
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        // Load SDK if not already loaded
        if (!(window as any).MercadoPago) {
          await new Promise<void>((resolve, reject) => {
            if (document.getElementById("mp-sdk-script")) {
              resolve();
              return;
            }
            const script = document.createElement("script");
            script.id = "mp-sdk-script";
            script.src = "https://sdk.mercadopago.com/js/v2";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("No se pudo cargar el SDK de Mercado Pago"));
            document.head.appendChild(script);
          });
        }

        if (cancelled) return;

        const mp = new (window as any).MercadoPago(MP_PUBLIC_KEY, { locale: "es-PE" });
        const bricksBuilder = mp.bricks();

        // Wait for the container to exist in DOM
        await new Promise<void>((resolve) => {
          const check = () => {
            if (document.getElementById("mp-brick-container")) resolve();
            else setTimeout(check, 50);
          };
          check();
        });

        if (cancelled) return;

        brickControllerRef.current = await bricksBuilder.create(
          "cardPayment",
          "mp-brick-container",
          {
            initialization: { amount },
            customization: {
              visual: {
                style: { theme: "dark" },
                hideFormTitle: true,
              },
              paymentMethods: { maxInstallments: 1, types: { excluded: [] } },
            },
            callbacks: {
              onReady: () => {
                if (!cancelled) setBrickReady(true);
              },
              onSubmit: async (cardFormData: any) => {
                try {
                  const res = await fetch("/api/mercadopago/payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...cardFormData,
                      transaction_amount: amount,
                    }),
                  });
                  const data = await res.json();
                  console.log("MP payment response:", data);

                  if (data.status === "approved") {
                    onSuccess(data.id);
                  } else if (data.status === "in_process" || data.status === "pending") {
                    onSuccess(data.id);
                  } else {
                    const detail = data.status_detail || data.error || `status: ${data.status}`;
                    onPaymentError(detail);
                  }
                } catch {
                  onPaymentError("Error al procesar el pago. Intenta nuevamente.");
                }
              },
              onError: (error: any) => {
                console.error("Brick error:", error);
              },
            },
          }
        );
      } catch (err: any) {
        if (!cancelled) setInitError(err.message || "Error al cargar el formulario.");
      }
    };

    // Small delay so the modal DOM is painted before brick initialization
    const timer = setTimeout(init, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-start justify-center z-[110] p-4 overflow-y-auto">
      <div
        className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border-2 border-blue-500/40 w-full max-w-sm shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-gray-700/50">
          <div className="flex justify-center mb-3">
            <Image
              src="/logoprincipal.png"
              alt="Santo Dilema"
              width={150}
              height={45}
              className="h-9 w-auto"
            />
          </div>
          <h3 className="text-lg font-black text-white text-center mb-0.5">
            Pagar con tarjeta
          </h3>
          <p className="text-gray-400 text-sm text-center">
            Total:{" "}
            <span className="text-amber-400 font-black font-mono text-base">
              S/ {amount.toFixed(2)}
            </span>
          </p>
        </div>

        {/* Brick container */}
        <div className="p-5">
          {initError ? (
            <div className="text-center py-6">
              <p className="text-red-400 text-sm mb-4">{initError}</p>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-sm underline"
              >
                Cerrar y usar otro método
              </button>
            </div>
          ) : (
            <>
              {!brickReady && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div id="mp-brick-container" />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.83-2.57 7.42-6 8.63C8.57 18.42 6 14.83 6 11V7.67L12 5z"/>
            </svg>
            <span>Pago seguro · Powered by Mercado Pago</span>
          </div>
          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-gray-200 text-sm transition-colors py-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
