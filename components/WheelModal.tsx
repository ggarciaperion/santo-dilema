"use client";

import { useState, useEffect } from "react";

interface WheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIZES = [
  { id: 0, label: '20% OFF', color: '#1e3a8a', glow: '#3b82f6', probability: 0.25 },      // Azul elegante
  { id: 1, label: '30% OFF', color: '#713f12', glow: '#f59e0b', probability: 0.20 },      // Dorado
  { id: 2, label: '40% OFF', color: '#1e293b', glow: '#64748b', probability: 0.15 },      // Gris oscuro elegante
  { id: 3, label: '2x1 en toda la carta', color: '#581c87', glow: '#a855f7', probability: 0.15 }, // Morado profundo
  { id: 4, label: 'Delivery Gratis', color: '#065f46', glow: '#10b981', probability: 0.25 },      // Verde esmeralda
];

// Componente de confetti
function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: '-10%',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: `rotate(${particle.rotate}deg)`,
            background: `linear-gradient(45deg, ${
              ['#3b82f6', '#f59e0b', '#64748b', '#a855f7', '#10b981'][Math.floor(Math.random() * 5)]
            }, transparent)`,
          }}
        />
      ))}
    </div>
  );
}

// Componente de explosión con destellos
function Explosion() {
  const colors = ['#3b82f6', '#f59e0b', '#64748b', '#a855f7', '#10b981', '#FFFFFF'];

  // Crear diferentes tipos de partículas
  const sparkles = Array.from({ length: 30 }, (_, i) => ({
    id: `sparkle-${i}`,
    type: 'sparkle',
    angle: (360 / 30) * i,
    distance: 100 + Math.random() * 150,
    delay: Math.random() * 0.2,
    duration: 1 + Math.random() * 0.5,
    size: 4 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: `star-${i}`,
    type: 'star',
    angle: (360 / 20) * i + 9,
    distance: 80 + Math.random() * 120,
    delay: Math.random() * 0.3,
    duration: 1.2 + Math.random() * 0.6,
    size: 8 + Math.random() * 12,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const circles = Array.from({ length: 15 }, (_, i) => ({
    id: `circle-${i}`,
    type: 'circle',
    angle: (360 / 15) * i + 4.5,
    distance: 60 + Math.random() * 100,
    delay: Math.random() * 0.15,
    duration: 0.8 + Math.random() * 0.4,
    size: 6 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const allParticles = [...sparkles, ...stars, ...circles];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {/* Flash central */}
      <div className="absolute animate-explosion-flash">
        <div className="w-40 h-40 rounded-full bg-white opacity-90 blur-3xl"></div>
      </div>

      {/* Ondas expansivas */}
      <div className="absolute w-20 h-20 rounded-full border-8 border-white animate-explosion-ring" style={{ animationDelay: '0s' }}></div>
      <div className="absolute w-20 h-20 rounded-full border-8 border-blue-400 animate-explosion-ring" style={{ animationDelay: '0.1s' }}></div>
      <div className="absolute w-20 h-20 rounded-full border-8 border-amber-400 animate-explosion-ring" style={{ animationDelay: '0.2s' }}></div>

      {/* Partículas */}
      {allParticles.map((particle) => {
        const rad = (particle.angle * Math.PI) / 180;
        const x = Math.cos(rad) * particle.distance;
        const y = Math.sin(rad) * particle.distance;

        return (
          <div
            key={particle.id}
            className="absolute animate-explosion-particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              '--tx': `${x}px`,
              '--ty': `${y}px`,
            } as React.CSSProperties}
          >
            {particle.type === 'star' ? (
              <div className="relative w-full h-full" style={{ color: particle.color }}>
                <div className="absolute inset-0" style={{
                  background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                }}></div>
              </div>
            ) : particle.type === 'sparkle' ? (
              <div className="relative w-full h-full" style={{
                background: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              }}></div>
            ) : (
              <div className="w-full h-full rounded-full" style={{
                background: particle.color,
                boxShadow: `0 0 ${particle.size}px ${particle.color}`,
              }}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function WheelModal({ isOpen, onClose }: WheelModalProps) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'spin' | 'result'>('phone');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<any>(null);
  const [couponPreview, setCouponPreview] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setStep('phone');
      setPrize(null);
      setCouponPreview('');
      setError('');
      setRotation(0);
      setShowConfetti(false);
      setShowExplosion(false);
    }
  }, [isOpen]);

  const validatePhone = async () => {
    if (!phone || phone.length < 9) {
      setError('Ingresa un número válido');
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/wheel-spin?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();

      if (data.canSpin) {
        setStep('spin');
      } else {
        setError(data.message || 'Este número ya giró la ruleta');
      }
    } catch (err) {
      setError('Error al verificar el número');
    }
  };

  const spinWheel = async () => {
    if (spinning) return;

    setSpinning(true);
    setError('');

    try {
      const response = await fetch('/api/wheel-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (data.success) {
        const prizeIndex = PRIZES.findIndex(p => p.label === data.prize.label);
        const degreesPerPrize = 360 / PRIZES.length;
        const baseDegrees = 360 * 8; // 8 vueltas
        const prizeDegrees = 360 - (prizeIndex * degreesPerPrize + degreesPerPrize / 2);
        const finalRotation = baseDegrees + prizeDegrees;

        setRotation(finalRotation);

        setTimeout(() => {
          setPrize(data.prize);
          setCouponPreview(data.couponPreview);
          setShowExplosion(true);
          setShowConfetti(true);
          setStep('result');
          setSpinning(false);

          // Detener explosión después de 2 segundos
          setTimeout(() => setShowExplosion(false), 2000);
          // Detener confetti después de 5 segundos
          setTimeout(() => setShowConfetti(false), 5000);
        }, 5000);
      } else {
        setError(data.error || 'Error al girar');
        setSpinning(false);
      }
    } catch (err) {
      setError('Error al procesar el giro');
      setSpinning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes neon-pulse {
          0%, 100% { filter: drop-shadow(0 0 5px currentColor) drop-shadow(0 0 15px currentColor); }
          50% { filter: drop-shadow(0 0 10px currentColor) drop-shadow(0 0 30px currentColor); }
        }

        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes prize-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes glow-rotate {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .neon-border {
          box-shadow:
            0 0 5px currentColor,
            0 0 10px currentColor,
            0 0 20px currentColor,
            inset 0 0 5px currentColor;
        }

        .neon-text {
          text-shadow:
            0 0 5px currentColor,
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 0 40px currentColor;
        }

        .wheel-segment {
          transition: filter 0.3s ease;
        }

        .wheel-segment:hover {
          filter: brightness(1.3);
        }

        .glass-morphism {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .gradient-animated {
          background: linear-gradient(
            45deg,
            #3b82f6, #f59e0b, #a855f7, #10b981
          );
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes explosion-flash {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }

        @keyframes explosion-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(15); opacity: 0; }
        }

        @keyframes explosion-particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        .animate-explosion-flash {
          animation: explosion-flash 0.6s ease-out forwards;
        }

        .animate-explosion-ring {
          animation: explosion-ring 1s ease-out forwards;
        }

        .animate-explosion-particle {
          animation: explosion-particle linear forwards;
        }
      `}</style>

      {showExplosion && <Explosion />}
      {showConfetti && <Confetti />}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="glass-morphism rounded-3xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">

          {/* Efecto de fondo animado */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-amber-500 blur-3xl animate-spin-slow"></div>
          </div>

          {/* Botón cerrar NEÓN */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-400 hover:text-blue-300 text-2xl font-bold z-10 transition-all hover:scale-110 neon-text"
          >
            ✕
          </button>

          {/* STEP 1: TELÉFONO */}
          {step === 'phone' && (
            <div className="text-center relative z-10">
              <div className="text-7xl mb-4 animate-bounce">🎰</div>
              <h2 className="text-4xl font-black mb-2 gradient-animated bg-clip-text text-transparent">
                ¡GIRA Y GANA!
              </h2>
              <p className="text-blue-300 mb-8 text-lg neon-text">
                Ingresa tu WhatsApp para participar
              </p>

              <div className="mb-6">
                <div className="flex gap-2">
                  <span className="px-4 py-4 glass-morphism rounded-xl font-black text-amber-400 neon-border text-lg">
                    +51
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="999 888 777"
                    className="flex-1 px-6 py-4 rounded-xl glass-morphism text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 neon-border placeholder-gray-500 transition-all"
                    maxLength={9}
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm mt-3 font-bold neon-text animate-pulse">{error}</p>
                )}
              </div>

              <button
                onClick={validatePhone}
                className="w-full gradient-animated text-white font-black py-5 rounded-xl text-xl hover:scale-105 transition-all duration-300 shadow-lg neon-border relative overflow-hidden group"
              >
                <span className="relative z-10">CONTINUAR</span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <p className="text-xs text-gray-400 mt-4 opacity-70">
                * Solo puedes girar una vez
              </p>
            </div>
          )}

          {/* STEP 2: RULETA */}
          {step === 'spin' && (
            <div className="text-center relative z-10">
              <h2 className="text-3xl font-black mb-8 gradient-animated bg-clip-text text-transparent">
                {spinning ? '¡GIRANDO!' : '¡HAZ CLICK PARA GIRAR!'}
              </h2>

              {/* Ruleta con efecto NEÓN */}
              <div className="relative w-72 h-72 mx-auto mb-8">
                {/* Aros de neón alrededor */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 opacity-40 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-400 opacity-25 animate-pulse"></div>

                {/* Indicador (flecha NEÓN) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30">
                  <div className="relative">
                    <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[40px] border-t-amber-500 neon-text"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Círculo de la ruleta */}
                <div
                  className="w-full h-full rounded-full shadow-2xl relative overflow-hidden border-8 border-white/20 neon-border"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                    boxShadow: spinning ? '0 0 60px rgba(59, 130, 246, 0.6)' : '0 0 30px rgba(59, 130, 246, 0.4)',
                    background: '#1e293b' // Fondo sólido para eliminar espacios negros
                  }}
                >
                  {/* Segmentos */}
                  {PRIZES.map((prize, index) => {
                    const angle = (360 / PRIZES.length) * index;
                    const segmentAngle = 360 / PRIZES.length;
                    // Calculamos los puntos del polígono para que cubra exactamente el ángulo del segmento
                    const halfAngle = (segmentAngle / 2) + 1; // +1 grado para evitar gaps
                    const leftX = 50 - Math.tan((halfAngle * Math.PI) / 180) * 100;
                    const rightX = 50 + Math.tan((halfAngle * Math.PI) / 180) * 100;

                    return (
                      <div
                        key={prize.id}
                        className="absolute w-full h-full wheel-segment"
                        style={{ transform: `rotate(${angle}deg)`, transformOrigin: 'center' }}
                      >
                        <div
                          className="absolute top-0 left-1/2 w-1/2 h-1/2 -translate-x-1/2"
                          style={{
                            background: `linear-gradient(135deg, ${prize.color}, ${prize.glow}80)`,
                            clipPath: `polygon(${leftX}% 0%, ${rightX}% 0%, 50% 100%)`,
                            transformOrigin: 'bottom center',
                            boxShadow: `0 0 15px ${prize.glow}40`
                          }}
                        >
                          <div
                            className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-black text-xs neon-text flex flex-col items-center gap-0.5 leading-tight"
                            style={{ transform: 'rotate(0deg)', maxWidth: '80px' }}
                          >
                            {prize.label.split(' ').map((word, i) => (
                              <div key={i} className="text-center">{word}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Centro NEÓN */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full shadow-lg flex items-center justify-center border-4 border-blue-500 neon-border" style={{
                    background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)'
                  }}>
                    <span className="text-3xl animate-spin-slow">🎰</span>
                  </div>
                </div>
              </div>

              <button
                onClick={spinWheel}
                disabled={spinning}
                className={`w-full font-black py-5 rounded-xl text-xl transition-all duration-300 shadow-lg ${
                  spinning
                    ? 'bg-gray-700 cursor-not-allowed opacity-50'
                    : 'gradient-animated neon-border hover:scale-105 text-white'
                }`}
              >
                {spinning ? 'GIRANDO...' : '¡GIRAR RULETA!'}
              </button>
            </div>
          )}

          {/* STEP 3: RESULTADO CON FESTEJO */}
          {step === 'result' && prize && (
            <div className="text-center relative z-10 animate-in zoom-in duration-500">
              <div className="text-8xl mb-6 animate-bounce">🎉</div>
              <h2 className="text-4xl font-black mb-4 gradient-animated bg-clip-text text-transparent animate-pulse">
                ¡FELICIDADES!
              </h2>
              <div className="relative inline-block mb-8">
                <p className="text-3xl font-black neon-text" style={{ color: PRIZES.find(p => p.label === prize.label)?.glow }}>
                  {prize.label}
                </p>
                <div className="absolute inset-0 blur-xl opacity-50" style={{ background: PRIZES.find(p => p.label === prize.label)?.glow }}></div>
              </div>

              <div className="glass-morphism rounded-2xl p-8 mb-6 neon-border relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 animate-pulse" style={{ background: `linear-gradient(45deg, ${PRIZES.find(p => p.label === prize.label)?.glow}, transparent)` }}></div>
                <p className="text-sm text-gray-300 mb-3">Tu código termina en:</p>
                <div className="text-7xl font-black mb-4 gradient-animated bg-clip-text text-transparent relative">
                  **{couponPreview}
                  <div className="absolute inset-0 blur-2xl opacity-30" style={{ background: PRIZES.find(p => p.label === prize.label)?.glow }}></div>
                </div>
                <p className="text-xs text-gray-400 mb-1">
                  El código completo se envió a:
                </p>
                <p className="text-lg font-bold text-blue-400 neon-text">
                  WhatsApp: +51 {phone}
                </p>
              </div>

              <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-4 mb-6 neon-border">
                <p className="text-sm text-yellow-300 font-bold neon-text">
                  📱 Revisa tu WhatsApp para el código completo
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full gradient-animated text-white font-black py-5 rounded-xl text-xl hover:scale-105 transition-all duration-300 shadow-lg neon-border relative overflow-hidden group"
              >
                <span className="relative z-10">¡IR A PEDIR AHORA!</span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
