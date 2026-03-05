'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function CasaCampoModal() {
  const [showImage, setShowImage] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRefMobile = useRef<HTMLVideoElement>(null);
  const videoRefDesktop = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Auto-show once per session — start both simultaneously so video is ready behind image
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
    // Thermometer click: show image + preload video simultaneously
    const handleOpen = () => {
      setShowImage(true);
      setShowVideo(true);
    };
    window.addEventListener('openCasaCampo', handleOpen);
    return () => window.removeEventListener('openCasaCampo', handleOpen);
  }, []);

  useEffect(() => {
    if (showVideo) {
      videoRefMobile.current?.play().catch(() => {});
      videoRefDesktop.current?.play().catch(() => {});
    }
  }, [showVideo]);

  if (!showImage && !showVideo) return null;

  const closeBtnClass =
    'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all hover:scale-110 active:scale-95';
  const closeBtnStyle = {
    background: 'rgba(0,0,0,0.7)',
    border: '1.5px solid rgba(255,255,255,0.3)',
    color: 'white',
    backdropFilter: 'blur(4px)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
    >
      {/* ── MOBILE / TABLET (<lg) ── */}
      <div
        className="lg:hidden relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: 'min(calc(100vw - 1.5rem), 340px)',
          aspectRatio: '9/16',
          maxHeight: '88vh',
          background: '#000',
        }}
      >
        {/* Video plays silently in background from the start */}
        {showVideo && (
          <video
            ref={videoRefMobile}
            className="absolute inset-0 w-full h-full object-cover"
            src="/casacampovideo-web.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        {/* Video ✕ — only visible once image is closed */}
        {showVideo && !showImage && (
          <button
            onClick={() => setShowVideo(false)}
            className={closeBtnClass}
            style={{ ...closeBtnStyle, zIndex: 10 }}
            aria-label="Cerrar video"
          >
            ✕
          </button>
        )}

        {/* Image overlay — bg-black prevents video flash while image loads */}
        {showImage && (
          <div className="absolute inset-0 bg-black" style={{ zIndex: 20 }}>
            <Image
              src="/casacampo.jpg"
              alt="Full Day Casa de Campo — Desafío Santo Dilema"
              fill
              className="object-cover"
              priority
              sizes="340px"
            />
            {/* Closing image instantly reveals already-playing video */}
            <button
              onClick={() => setShowImage(false)}
              className={closeBtnClass}
              style={{ ...closeBtnStyle, zIndex: 30 }}
              aria-label="Cerrar imagen"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── DESKTOP (lg+): side by side ── */}
      <div className="hidden lg:flex flex-row gap-5 items-center">
        {/* Video pre-loaded but hidden behind image container until image is closed */}
        {showVideo && (
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
            style={{
              width: '300px',
              aspectRatio: '9/16',
              maxHeight: '84vh',
              visibility: showImage ? 'hidden' : 'visible',
            }}
          >
            <video
              ref={videoRefDesktop}
              className="w-full h-full object-cover"
              src="/casacampovideo-web.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            {!showImage && (
              <button
                onClick={() => setShowVideo(false)}
                className={closeBtnClass}
                style={closeBtnStyle}
                aria-label="Cerrar video"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Image */}
        {showImage && (
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
            style={{ width: '300px', aspectRatio: '9/16', maxHeight: '84vh' }}
          >
            <Image
              src="/casacampo.jpg"
              alt="Full Day Casa de Campo — Desafío Santo Dilema"
              fill
              className="object-cover"
              priority
              sizes="300px"
            />
            <button
              onClick={() => setShowImage(false)}
              className={closeBtnClass}
              style={closeBtnStyle}
              aria-label="Cerrar imagen"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
