"use client";

interface MaintenanceModalProps {
  isOpen: boolean;
}

export default function MaintenanceModal({ isOpen }: MaintenanceModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes tuerca-spin {
          0%   { transform: rotate(0deg) scale(1); }
          40%  { transform: rotate(180deg) scale(1.05); }
          80%  { transform: rotate(340deg) scale(1); }
          90%  { transform: rotate(360deg) scale(1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes maint-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.35), 0 0 40px rgba(251,191,36,0.15); }
          50%       { box-shadow: 0 0 35px rgba(251,191,36,0.6),  0 0 70px rgba(251,191,36,0.25); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
        .tuerca { animation: tuerca-spin 2.4s ease-in-out infinite; display: inline-block; }
        .maint-card { animation: maint-glow 2.5s ease-in-out infinite; }
        .dot1 { animation: dot-bounce 1.4s ease-in-out infinite 0s; }
        .dot2 { animation: dot-bounce 1.4s ease-in-out infinite 0.2s; }
        .dot3 { animation: dot-bounce 1.4s ease-in-out infinite 0.4s; }
      `}</style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4">
        {/* Fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(251,191,36,0.08), transparent 60%)' }} />
        </div>

        <div className="relative z-10 max-w-md w-full text-center">

          {/* Logo */}
          <p className="text-yellow-400/60 font-black text-sm tracking-[0.3em] uppercase mb-6">Santo Dilema</p>

          {/* Tuerca animada */}
          <div className="mb-6">
            <span className="tuerca text-7xl md:text-8xl">🔧</span>
          </div>

          {/* Tarjeta principal */}
          <div className="maint-card bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border-2 border-amber-500/40 rounded-3xl px-8 py-8 mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
              Actualizando promociones
            </h2>
            <p className="text-amber-200/80 text-base mb-5 leading-relaxed">
              Estamos preparando <span className="text-yellow-300 font-bold">grandes novedades</span> para ti.<br />
              Volvemos en breve 🚀
            </p>

            {/* Dots loader */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="dot1 w-2.5 h-2.5 bg-yellow-400 rounded-full" />
              <div className="dot2 w-2.5 h-2.5 bg-yellow-400 rounded-full" />
              <div className="dot3 w-2.5 h-2.5 bg-yellow-400 rounded-full" />
            </div>

            {/* Horario hoy */}
            <div className="bg-black/40 border border-yellow-400/30 rounded-2xl px-6 py-4">
              <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-1">Hoy sí atendemos</p>
              <p className="text-yellow-300 font-black text-2xl">6:00 pm — 11:00 pm</p>
              <p className="text-white/40 text-xs mt-1">Pedidos por WhatsApp</p>
            </div>
          </div>

          {/* Nota inferior */}
          <p className="text-gray-600 text-xs">
            Disculpa las molestias · Gracias por tu paciencia 🙏
          </p>
        </div>
      </div>
    </>
  );
}
