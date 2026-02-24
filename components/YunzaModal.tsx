"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface YunzaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Premios disponibles en la Yunza
const PRIZES = [
  { id: 1, label: '20% OFF', color: '#3b82f6', emoji: '🎁' },
  { id: 2, label: '30% OFF', color: '#ef4444', emoji: '🎊' },
  { id: 3, label: 'Delivery Gratis 🏍️', color: '#f59e0b', emoji: '🎉' },
  { id: 4, label: '40% OFF', color: '#10b981', emoji: '🎈' },
  { id: 5, label: '2x1 en toda la carta', color: '#a855f7', emoji: '🎪' },
  { id: 6, label: '20% OFF', color: '#06b6d4', emoji: '🎁' },
  { id: 7, label: 'Delivery Gratis 🏍️', color: '#f59e0b', emoji: '🎉' },
  { id: 8, label: '30% OFF', color: '#ec4899', emoji: '🎊' },
  { id: 9, label: 'Delivery Gratis 🏍️', color: '#f59e0b', emoji: '🎉' },
  { id: 10, label: '20% OFF', color: '#8b5cf6', emoji: '🎁' },
  { id: 11, label: '40% OFF', color: '#14b8a6', emoji: '🎈' },
  { id: 12, label: 'Delivery Gratis 🏍️', color: '#f59e0b', emoji: '🎉' },
];

// Componente de confetti festivo
function Confetti() {
  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 1.5,
    rotate: Math.random() * 360,
    type: Math.random() > 0.5 ? 'circle' : 'square',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-3 h-3 animate-confetti-fall ${
            particle.type === 'circle' ? 'rounded-full' : ''
          }`}
          style={{
            left: `${particle.x}%`,
            top: '-10%',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: `rotate(${particle.rotate}deg)`,
            background: `linear-gradient(45deg, ${
              ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)]
            }, transparent)`,
          }}
        />
      ))}
    </div>
  );
}

// Componente de serpentinas
function Serpentinas() {
  const serpentinas = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: (100 / 15) * i,
    delay: Math.random() * 0.5,
    duration: 3 + Math.random() * 2,
    color: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {serpentinas.map((serp) => (
        <div
          key={serp.id}
          className="absolute w-2 opacity-70 animate-serpentina-fall"
          style={{
            left: `${serp.x}%`,
            top: '-20%',
            height: '200px',
            animationDelay: `${serp.delay}s`,
            animationDuration: `${serp.duration}s`,
            background: `repeating-linear-gradient(
              0deg,
              ${serp.color} 0px,
              ${serp.color} 10px,
              transparent 10px,
              transparent 20px
            )`,
            transform: 'rotate(15deg)',
          }}
        />
      ))}
    </div>
  );
}

export default function YunzaModal({ isOpen, onClose }: YunzaModalProps) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'select' | 'result'>('phone');
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const [prize, setPrize] = useState<any>(null);
  const [couponPreview, setCouponPreview] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSerpentinas, setShowSerpentinas] = useState(false);
  const [animatingGift, setAnimatingGift] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setStep('phone');
      setPrize(null);
      setCouponPreview('');
      setError('');
      setSelectedGift(null);
      setShowConfetti(false);
      setShowSerpentinas(false);
      setAnimatingGift(null);
    }
  }, [isOpen]);

  const validatePhone = async () => {
    if (!phone || phone.length < 9) {
      setError('Ingresa un número válido');
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/yunza?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();

      if (data.canParticipate) {
        setStep('select');
        setShowSerpentinas(true);
      } else {
        setError(data.message || 'Este número ya participó en la Yunza');
      }
    } catch (err) {
      setError('Error al verificar el número');
    }
  };

  const selectGift = async (giftId: number) => {
    if (animatingGift !== null) return;

    setAnimatingGift(giftId);
    setError('');

    try {
      const response = await fetch('/api/yunza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, giftId })
      });

      const data = await response.json();

      if (data.success) {
        setTimeout(() => {
          setPrize(data.prize);
          setCouponPreview(data.couponPreview);
          setShowConfetti(true);
          setStep('result');
          setAnimatingGift(null);

          // Detener serpentinas
          setShowSerpentinas(false);
          // Detener confetti después de 6 segundos
          setTimeout(() => setShowConfetti(false), 6000);
        }, 1500);
      } else {
        setError(data.error || 'Error al seleccionar regalo');
        setAnimatingGift(null);
      }
    } catch (err) {
      setError('Error al procesar la selección');
      setAnimatingGift(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }

        @keyframes serpentina-fall {
          0% { transform: translateY(0) rotate(15deg); opacity: 0.7; }
          100% { transform: translateY(110vh) rotate(15deg); opacity: 0; }
        }

        @keyframes gift-shake {
          0%, 100% { transform: rotate(-3deg) scale(1); }
          25% { transform: rotate(3deg) scale(1.05); }
          50% { transform: rotate(-3deg) scale(1.05); }
          75% { transform: rotate(3deg) scale(1.05); }
        }

        @keyframes gift-swing {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes gift-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes gift-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(500px) rotate(180deg) scale(0.5); opacity: 0; }
        }

        @keyframes tree-sway {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .animate-serpentina-fall {
          animation: serpentina-fall linear forwards;
        }

        .gift-hover:hover {
          animation: gift-shake 0.5s ease-in-out;
        }

        .gift-swing {
          animation: gift-swing 2.5s ease-in-out infinite;
        }

        .gift-float {
          animation: gift-float 3s ease-in-out infinite;
        }

        .gift-selected {
          animation: gift-fall 1.5s ease-in forwards;
        }

        .tree-sway {
          animation: tree-sway 3s ease-in-out infinite;
        }

        .glass-morphism {
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.15);
        }

        .carnival-glow {
          text-shadow:
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 0 30px currentColor,
            0 0 40px currentColor;
        }
      `}</style>

      {showSerpentinas && <Serpentinas />}
      {showConfetti && <Confetti />}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="glass-morphism rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 relative overflow-hidden border-4 border-fuchsia-500" style={{
          boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)'
        }}>

          {/* Fondo decorativo */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-600 via-yellow-500 to-purple-600 blur-3xl"></div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-pink-400 hover:text-pink-300 text-2xl font-bold z-10 transition-all hover:scale-110"
          >
            ✕
          </button>

          {/* STEP 1: TELÉFONO */}
          {step === 'phone' && (
            <div className="text-center relative z-10">
              <div className="mb-6">
                <div className="text-7xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-3xl md:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-500 to-purple-500 carnival-glow">
                  ¡La Yunza del Sabor!
                </h2>
                <p className="text-xl md:text-2xl font-bold text-yellow-400 mb-2">
                  Carnavales Santo Dilema
                </p>
                <p className="text-pink-300 text-sm md:text-base">
                  Ingresa tu WhatsApp y elige un regalo del árbol 🎊
                </p>
              </div>

              <div className="mb-6">
                <div className="flex gap-2">
                  <span className="px-4 py-4 glass-morphism rounded-xl font-black text-yellow-400 border border-white/20 text-lg">
                    +51
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="999 888 777"
                    className="flex-1 px-6 py-4 rounded-xl glass-morphism text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 border border-white/20 placeholder-gray-500 transition-all"
                    maxLength={9}
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm mt-3 font-bold">{error}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-black py-4 md:py-5 rounded-xl text-lg md:text-xl hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Cerrar
                </button>
                <button
                  onClick={validatePhone}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black py-4 md:py-5 rounded-xl text-lg md:text-xl hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Participar
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4 opacity-70">
                * Solo puedes participar una vez
              </p>
            </div>
          )}

          {/* STEP 2: SELECCIONAR REGALO */}
          {step === 'select' && (
            <div className="text-center relative z-10">
              <div className="mb-4">
                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-500 to-purple-500 mb-2">
                  ¡Elige tu regalo!
                </h2>
                <p className="text-pink-300 text-sm md:text-base">
                  Haz clic en cualquier regalo colgando del árbol 🌳
                </p>
              </div>

              {/* Árbol de Yunza */}
              <div className="relative mx-auto w-full max-w-lg h-[500px] md:h-[600px] mb-4 flex items-center justify-center">
                {/* Imagen del árbol de fondo con animación */}
                <div className="absolute inset-0 flex items-center justify-center tree-sway" style={{ transformOrigin: 'bottom center' }}>
                  <img
                    src="/yunza.png"
                    alt="Árbol de Yunza"
                    className="w-full h-full object-contain drop-shadow-2xl"
                    style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }}
                  />
                </div>

                {/* Regalos colgando - distribuidos estratégicamente en las ramas */}
                {PRIZES.map((prize, index) => {
                  // Posiciones estratégicas para 12 regalos más dispersos en el árbol
                  const positions = [
                    // Capa superior (3 regalos) - Más arriba y dispersos
                    { x: 0, y: 10, rope: 30 },       // Centro arriba
                    { x: -70, y: 18, rope: 35 },     // Izquierda arriba
                    { x: 75, y: 16, rope: 32 },      // Derecha arriba

                    // Capa media-alta (3 regalos) - Más separados
                    { x: -100, y: 30, rope: 38 },    // Extremo izquierdo
                    { x: -25, y: 28, rope: 25 },     // Centro-izquierda
                    { x: 95, y: 32, rope: 36 },      // Extremo derecho

                    // Capa media (3 regalos) - Bien distribuidos
                    { x: -115, y: 48, rope: 42 },    // Extremo izquierdo media
                    { x: 15, y: 45, rope: 28 },      // Centro-derecha media
                    { x: 120, y: 50, rope: 40 },     // Extremo derecho media

                    // Capa inferior (3 regalos) - Máxima dispersión
                    { x: -130, y: 65, rope: 48 },    // Extremo izquierdo abajo
                    { x: -40, y: 62, rope: 33 },     // Centro-izquierda abajo
                    { x: 135, y: 68, rope: 46 },     // Extremo derecho abajo
                  ];

                  const pos = positions[index];
                  const ropeLength = pos.rope;

                  // Animaciones diferentes para cada regalo
                  const animationType = index % 2 === 0 ? 'gift-swing' : 'gift-float';
                  const animationDelay = `${(index * 0.2)}s`;

                  return (
                    <div
                      key={prize.id}
                      className="absolute z-20"
                      style={{
                        left: `calc(50% + ${pos.x}px)`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Cuerda del regalo - más visible y realista */}
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-amber-800 to-amber-900 shadow-lg"
                        style={{
                          height: `${ropeLength}px`,
                          transform: `translateX(-50%) translateY(-${ropeLength}px)`,
                        }}
                      >
                        {/* Nudo superior */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-900 rounded-full"></div>
                      </div>

                      {/* Regalo */}
                      <button
                        onClick={() => selectGift(prize.id)}
                        disabled={animatingGift !== null}
                        className={`relative w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-2xl transition-all ${
                          animatingGift === prize.id
                            ? 'gift-selected'
                            : animatingGift === null
                            ? `gift-hover hover:scale-110 cursor-pointer ${animationType}`
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${prize.color} 0%, ${prize.color}dd 100%)`,
                          boxShadow: `0 4px 20px ${prize.color}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
                          animationDelay: animatingGift === null ? animationDelay : '0s',
                        }}
                      >
                        {/* Lazo del regalo - más destacado */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white/40 shadow-md"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/40 shadow-md"></div>

                        {/* Moño en la parte superior */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          <div className="w-2 h-2 bg-white/60 rounded-full shadow-md"></div>
                          <div className="w-2 h-2 bg-white/60 rounded-full shadow-md"></div>
                        </div>

                        {/* Emoji del premio */}
                        <span className="absolute inset-0 flex items-center justify-center text-xl md:text-2xl drop-shadow-lg">
                          {prize.emoji}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="text-red-400 text-sm font-bold mb-4">{error}</p>
              )}

              <p className="text-yellow-300 text-xs md:text-sm font-bold animate-pulse">
                ✨ Todos los regalos tienen premio ✨
              </p>
            </div>
          )}

          {/* STEP 3: RESULTADO */}
          {step === 'result' && prize && (
            <div className="text-center relative z-10 animate-in zoom-in duration-500">
              <div className="text-7xl md:text-8xl mb-6 animate-bounce">🎊</div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-500 to-purple-500">
                ¡FELICIDADES!
              </h2>
              <div className="relative inline-block mb-6">
                <p className="text-2xl md:text-3xl font-black text-white carnival-glow">
                  {prize.label}
                </p>
              </div>

              <div className="glass-morphism rounded-2xl p-6 md:p-8 mb-6 border border-pink-400/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10"></div>
                <p className="text-sm text-gray-300 mb-3 relative z-10">Tu código termina en:</p>
                <div className="text-6xl md:text-7xl font-black mb-4 text-yellow-400 relative z-10">
                  **{couponPreview}
                </div>
                <p className="text-xs text-gray-400 mb-1 relative z-10">
                  El código completo se envió a:
                </p>
                <p className="text-lg font-bold text-pink-400 relative z-10">
                  WhatsApp: +51 {phone}
                </p>
              </div>

              <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-300 font-bold">
                  📱 Revisa tu WhatsApp para el código completo
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black py-4 md:py-5 rounded-xl text-lg md:text-xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                ¡IR A PEDIR AHORA!
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
