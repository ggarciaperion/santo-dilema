"use client";

import Image from "next/image";
import Link from "next/link";

export default function MpPendingPage() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-amber-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="flex justify-center mb-4">
          <Image src="/logoprincipal.png" alt="Santo Dilema" width={160} height={45} className="h-10 w-auto" />
        </div>

        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⏳</span>
        </div>

        <h2 className="text-white font-black text-xl mb-1">Pago en revisión</h2>
        <p className="text-gray-400 text-sm mb-5">
          Tu pago está siendo procesado. Una vez confirmado recibirás tu pedido. Para consultas escríbenos por WhatsApp.
        </p>

        <Link
          href="/"
          className="block w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black py-3 rounded-xl transition-all active:scale-95"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
