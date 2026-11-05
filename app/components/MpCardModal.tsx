"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const MP_PUBLIC_KEY = "APP_USR-10a4a6b8-b93e-4f68-86bd-2c1ffa8b7ec2";

interface MpCardModalProps {
  isOpen: boolean;
  amount: number;
  payerPhone?: string;
  onClose: () => void;
  onSuccess: (paymentId: string | number) => void;
  onPaymentError: (detail: string) => void;
}

export default function MpCardModal({
  isOpen,
  amount,
  payerPhone,
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
            initialization: {
              amount,
              payer: {
                email: payerPhone ? `${payerPhone}@santodilema.com` : "cliente@santodilema.com",
              },
            },
            customization: {
              visual: {
                style: { theme: "default" },
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
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
      style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm mx-4 my-4 md:my-8 rounded-2xl shadow-2xl"
        style={{ background: "#fff", border: "2px solid #F58424" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-3 pb-2.5" style={{ borderBottom: "1px solid rgba(245,132,36,.2)" }}>
          {/* Zona del logo — altura fija, imagen escalada para recortar márgenes transparentes */}
          <div
            className="flex justify-center overflow-hidden mx-auto"
            style={{ height: 48, width: "100%" }}
          >
            <Image
              src="/3334.png"
              alt="Santo Dilema"
              width={200}
              height={200}
              priority
              className="w-auto"
              style={{ height: "150%", objectFit: "contain", transform: "translateY(-16%)" }}
            />
          </div>
          <h3 className="text-base font-black text-black text-center mt-1 mb-0">
            Pagar con tarjeta
          </h3>
          <p className="text-sm text-black/50 text-center">
            Total:{" "}
            <span className="font-black text-sm" style={{ color: "#F58424" }}>
              S/ {amount.toFixed(2)}
            </span>
          </p>
        </div>

        {/* Brick container */}
        <div className="px-5 py-3">
          {initError ? (
            <div className="text-center py-6">
              <p className="text-sm text-red-500 mb-4">{initError}</p>
              <button
                onClick={onClose}
                className="text-sm font-semibold underline"
                style={{ color: "#F58424" }}
              >
                Cerrar y usar otro método
              </button>
            </div>
          ) : (
            <>
              {!brickReady && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: "#F58424", borderTopColor: "transparent" }}
                  />
                  <p className="text-xs text-black/40 font-semibold">Cargando formulario…</p>
                </div>
              )}
              {/* MP Brick — rendered by MercadoPago SDK, theme: default (light) */}
              <div id="mp-brick-container" />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(0,0,0,.06)" }}>
          <div className="flex items-center justify-center gap-1.5 pt-2" style={{ color: "rgba(0,0,0,.35)" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.83-2.57 7.42-6 8.63C8.57 18.42 6 14.83 6 11V7.67L12 5z"/>
            </svg>
            <span className="text-xs font-semibold">Pago seguro · Powered by Mercado Pago</span>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border-2 text-sm font-black transition-colors"
            style={{ borderColor: "rgba(0,0,0,.12)", color: "#000" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
