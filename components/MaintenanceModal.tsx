"use client";

interface MaintenanceModalProps {
  isOpen: boolean;
}

export default function MaintenanceModal({ isOpen }: MaintenanceModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4">
        {/* Fondo con gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_50%)]"></div>
        </div>

        {/* Contenido del modal */}
        <div className="relative z-10 max-w-2xl w-full text-center">
          {/* Icono de herramientas animado */}
          <div className="mb-8 animate-float">
            <div className="text-8xl md:text-9xl mb-4">🔧</div>
          </div>

          {/* Título principal */}
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 animate-pulse">
            SANTO DILEMA
          </h1>

          {/* Mensaje de mantenimiento */}
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-xl border-2 border-amber-500/50 rounded-3xl p-8 md:p-12 mb-8 animate-pulse-glow">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Estamos trabajando en algo especial
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
              Actualmente estamos implementando nuevas promociones que arrancan este
              <span className="font-black text-yellow-400"> jueves 26 de febrero</span>
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-xl md:text-2xl font-black text-yellow-400">
              Regresamos en breve
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <p className="text-gray-400 text-sm md:text-base">
              Disculpa las molestias. Estamos preparando una experiencia aún mejor para ti.
            </p>
            <p className="text-gray-500 text-xs md:text-sm mt-2">
              Para consultas, contáctanos por WhatsApp
            </p>
          </div>

          {/* Decoración inferior */}
          <div className="mt-8 flex justify-center gap-4">
            <div className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🎉</div>
            <div className="text-4xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎊</div>
            <div className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎁</div>
          </div>
        </div>

        {/* Partículas decorativas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
