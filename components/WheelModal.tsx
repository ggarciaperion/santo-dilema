"use client";

import { useState, useEffect } from "react";

interface WheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIZES = [
  { id: 0, label: '10% OFF', color: '#FF6B6B', probability: 0.25 },
  { id: 1, label: '15% OFF', color: '#4ECDC4', probability: 0.15 },
  { id: 2, label: 'Delivery Gratis', color: '#FFD93D', probability: 0.20 },
  { id: 3, label: '2x1 Combos', color: '#95E1D3', probability: 0.10 },
  { id: 4, label: '5% OFF', color: '#F38181', probability: 0.30 },
];

export default function WheelModal({ isOpen, onClose }: WheelModalProps) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'spin' | 'result'>('phone');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<any>(null);
  const [couponPreview, setCouponPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset al cerrar
      setPhone('');
      setStep('phone');
      setPrize(null);
      setCouponPreview('');
      setError('');
      setRotation(0);
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
        // Calcular rotación: 5 vueltas completas + posición del premio
        const prizeIndex = PRIZES.findIndex(p => p.label === data.prize.label);
        const degreesPerPrize = 360 / PRIZES.length;
        const baseDegrees = 360 * 5; // 5 vueltas completas
        const prizeDegrees = 360 - (prizeIndex * degreesPerPrize + degreesPerPrize / 2); // Invertido para que gire en sentido horario

        const finalRotation = baseDegrees + prizeDegrees;
        setRotation(finalRotation);

        // Esperar a que termine la animación
        setTimeout(() => {
          setPrize(data.prize);
          setCouponPreview(data.couponPreview);
          setStep('result');
          setSpinning(false);
        }, 4000); // 4 segundos de animación
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border-4 border-orange-400">

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ✕
        </button>

        {/* STEP 1: TELÉFONO */}
        {step === 'phone' && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎰</div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              ¡Gira y Gana!
            </h2>
            <p className="text-gray-600 mb-6">
              Ingresa tu WhatsApp para participar
            </p>

            <div className="mb-4">
              <div className="flex gap-2">
                <span className="px-3 py-3 bg-white border-2 border-orange-300 rounded-lg font-bold text-gray-700">
                  +51
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="999 888 777"
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-orange-300 focus:border-orange-500 focus:outline-none text-lg font-semibold"
                  maxLength={9}
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-2 font-semibold">{error}</p>
              )}
            </div>

            <button
              onClick={validatePhone}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-xl text-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
            >
              CONTINUAR
            </button>

            <p className="text-xs text-gray-500 mt-4">
              * Solo puedes girar una vez
            </p>
          </div>
        )}

        {/* STEP 2: RULETA */}
        {step === 'spin' && (
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {spinning ? '¡Girando!' : '¡Haz click para girar!'}
            </h2>

            {/* Ruleta */}
            <div className="relative w-64 h-64 mx-auto mb-6">
              {/* Indicador (flecha) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-600"></div>
              </div>

              {/* Círculo de la ruleta */}
              <div
                className="w-full h-full rounded-full shadow-2xl relative overflow-hidden border-8 border-white"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                }}
              >
                {PRIZES.map((prize, index) => {
                  const angle = (360 / PRIZES.length) * index;
                  return (
                    <div
                      key={prize.id}
                      className="absolute w-full h-full"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: 'center'
                      }}
                    >
                      <div
                        className="absolute top-0 left-1/2 w-1/2 h-1/2 -translate-x-1/2"
                        style={{
                          backgroundColor: prize.color,
                          clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                          transformOrigin: 'bottom center'
                        }}
                      >
                        <div
                          className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-bold text-xs whitespace-nowrap"
                          style={{
                            transform: 'rotate(0deg)'
                          }}
                        >
                          {prize.label}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Centro de la ruleta */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-orange-500">
                  <span className="text-2xl">🎰</span>
                </div>
              </div>
            </div>

            <button
              onClick={spinWheel}
              disabled={spinning}
              className={`w-full font-black py-4 rounded-xl text-lg transition-all transform shadow-lg ${
                spinning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:scale-105'
              }`}
            >
              {spinning ? 'GIRANDO...' : '¡GIRAR RULETA!'}
            </button>
          </div>
        )}

        {/* STEP 3: RESULTADO */}
        {step === 'result' && prize && (
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              ¡FELICIDADES!
            </h2>
            <p className="text-2xl font-bold text-orange-600 mb-6">
              Ganaste: {prize.label}
            </p>

            <div className="bg-white rounded-xl p-6 mb-6 border-2 border-orange-300">
              <p className="text-sm text-gray-600 mb-2">Tu código termina en:</p>
              <div className="text-5xl font-black text-orange-600 mb-3">
                **{couponPreview}
              </div>
              <p className="text-xs text-gray-500">
                El código completo se envió a:
              </p>
              <p className="text-sm font-bold text-gray-700">
                WhatsApp: +51 {phone}
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 font-semibold">
                📱 Revisa tu WhatsApp para obtener el código completo y úsalo en tu próxima compra
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black py-4 rounded-xl text-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
            >
              ¡IR A PEDIR AHORA!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
