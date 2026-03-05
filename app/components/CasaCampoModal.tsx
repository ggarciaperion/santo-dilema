'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function CasaCampoModal() {
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem('casacampo_modal_v1');
    if (!seen) {
      const t = setTimeout(() => {
        setVisible(true);
        sessionStorage.setItem('casacampo_modal_v1', '1');
      }, 900);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{
          maxHeight: '88vh',
          boxShadow: '0 0 60px rgba(251,191,36,0.25), 0 0 120px rgba(251,191,36,0.1)',
        }}
      >
        {/* ── Video de fondo ── */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src="/casacampovideo-web.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Overlay oscuro sobre el video para que la imagen resalte */}
        <div className="absolute inset-0 bg-black/40" />

        {/* ── Imagen PNG en primer plano ── */}
        <div className="relative z-10" style={{ aspectRatio: '9/16' }}>
          <Image
            src="/casacampo.jpg"
            alt="Full Day Casa de Campo — Desafío Santo Dilema"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 640px) 100vw, 384px"
          />
        </div>

        {/* Botón cerrar */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all hover:scale-110 active:scale-95"
          style={{
            background: 'rgba(0,0,0,0.7)',
            border: '1.5px solid rgba(255,255,255,0.3)',
            color: 'white',
            backdropFilter: 'blur(4px)',
          }}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
