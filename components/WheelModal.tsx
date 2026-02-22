"use client";

import { useState, useEffect } from "react";

interface WheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIZES = [
  { id: 0, label: '10% OFF', color: '#FF1744', glow: '#FF1744', probability: 0.25 },
  { id: 1, label: '15% OFF', color: '#00E5FF', glow: '#00E5FF', probability: 0.15 },
  { id: 2, label: 'Delivery Gratis', color: '#FFEA00', glow: '#FFEA00', probability: 0.20 },
  { id: 3, label: '2x1 Combos', color: '#B388FF', glow: '#B388FF', probability: 0.10 },
  { id: 4, label: '5% OFF', color: '#FF4081', glow: '#FF4081', probability: 0.30 },
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
              ['#FF1744', '#00E5FF', '#FFEA00', '#B388FF', '#FF4081'][Math.floor(Math.random() * 5)]
            }, transparent)`,
          }}
        />
      ))}
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

  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setStep('phone');
      setPrize(null);
      setCouponPreview('');
      setError('');
      setRotation(0);
      setShowConfetti(false);
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
          setShowConfetti(true);
          setStep('result');
          setSpinning(false);

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
            #FF1744, #00E5FF, #FFEA00, #B388FF, #FF4081
          );
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {showConfetti && <Confetti />}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="glass-morphism rounded-3xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">

          {/* Efecto de fondo animado */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-fuchsia-500 via-cyan-500 to-yellow-500 blur-3xl animate-spin-slow"></div>
          </div>

          {/* Botón cerrar NEÓN */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-fuchsia-400 hover:text-fuchsia-300 text-2xl font-bold z-10 transition-all hover:scale-110 neon-text"
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
              <p className="text-cyan-300 mb-8 text-lg neon-text">
                Ingresa tu WhatsApp para participar
              </p>

              <div className="mb-6">
                <div className="flex gap-2">
                  <span className="px-4 py-4 glass-morphism rounded-xl font-black text-fuchsia-400 neon-border text-lg">
                    +51
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="999 888 777"
                    className="flex-1 px-6 py-4 rounded-xl glass-morphism text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500 neon-border placeholder-gray-500 transition-all"
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
                <div className="absolute inset-0 rounded-full border-4 border-fuchsia-500 opacity-50 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500 opacity-30 animate-pulse"></div>

                {/* Indicador (flecha NEÓN) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30">
                  <div className="relative">
                    <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[40px] border-t-fuchsia-500 neon-text"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Círculo de la ruleta */}
                <div
                  className="w-full h-full rounded-full shadow-2xl relative overflow-hidden border-8 border-white/20 neon-border"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                    boxShadow: spinning ? '0 0 60px rgba(255, 23, 68, 0.8)' : '0 0 30px rgba(255, 23, 68, 0.5)'
                  }}
                >
                  {/* Segmentos */}
                  {PRIZES.map((prize, index) => {
                    const angle = (360 / PRIZES.length) * index;
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
                            clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                            transformOrigin: 'bottom center',
                            boxShadow: `0 0 20px ${prize.glow}`
                          }}
                        >
                          <div
                            className="absolute top-12 left-1/2 -translate-x-1/2 text-white font-black text-sm whitespace-nowrap neon-text"
                            style={{ transform: 'rotate(0deg)' }}
                          >
                            {prize.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Centro NEÓN */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full shadow-lg flex items-center justify-center border-4 border-fuchsia-500 neon-border" style={{
                    background: 'radial-gradient(circle, #1a1a2e 0%, #0f0f1e 100%)'
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
                <p className="text-lg font-bold text-cyan-400 neon-text">
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
