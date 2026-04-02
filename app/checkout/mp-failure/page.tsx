"use client";

import Image from "next/image";
import Link from "next/link";

export default function MpFailurePage() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-red-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="flex justify-center mb-4">
          <Image src="/logoprincipal.png" alt="Santo Dilema" width={160} height={45} className="h-10 w-auto" />
        </div>

        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">❌</span>
        </div>

        <h2 className="text-white font-black text-xl mb-1">Pago no completado</h2>
        <p className="text-gray-400 text-sm mb-5">
          No se pudo procesar tu pago. Puedes intentarlo de nuevo o elegir otro método de pago.
        </p>

        <Link
          href="/checkout"
          className="block w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-3 rounded-xl transition-all active:scale-95 mb-3"
        >
          Volver al checkout
        </Link>

        <Link href="/" className="block w-full text-gray-400 hover:text-gray-200 text-sm py-2 transition-colors">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
