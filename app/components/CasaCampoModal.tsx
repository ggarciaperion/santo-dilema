'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function CasaCampoModal() {
  const [showImage, setShowImage] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem('casacampo_modal_v1');
    if (!seen) {
      const t = setTimeout(() => {
        setShowImage(true);
        setShowVideo(true);
        sessionStorage.setItem('casacampo_modal_v1', '1');
      }, 900);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [showVideo]);

  if (!showImage && !showVideo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
    >
      {/* ── VIDEO (fondo, z-index menor) ── */}
      {showVideo && (
        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style={{ maxHeight: '88vh', aspectRatio: '9/16' }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src="/casacampovideo-web.mp4"
            autoPlay
            muted
            loop
            playsInline
          />

          {/* X del video */}
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              color: 'white',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="Cerrar video"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── IMAGEN PNG (primer plano, encima del video) ── */}
      {showImage && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ maxHeight: '88vh', aspectRatio: '9/16' }}
          >
            <Image
              src="/casacampo.jpg"
              alt="Full Day Casa de Campo — Desafío Santo Dilema"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 384px"
            />

            {/* X de la imagen */}
            <button
              onClick={() => setShowImage(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all hover:scale-110 active:scale-95"
              style={{
                background: 'rgba(0,0,0,0.7)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                color: 'white',
                backdropFilter: 'blur(4px)',
              }}
              aria-label="Cerrar imagen"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
