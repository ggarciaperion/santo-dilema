'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function CasaCampoModal() {
  const [showImage, setShowImage] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRefMobile = useRef<HTMLVideoElement>(null);
  const videoRefDesktop = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Auto-show once per session
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
    // Listen for thermometer click — always reopen regardless of session flag
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
      {/* ── MOBILE / TABLET (<lg): image overlays video in a single stacked container ── */}
      <div
        className="lg:hidden relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: 'min(calc(100vw - 1.5rem), 340px)',
          aspectRatio: '9/16',
          maxHeight: '88vh',
        }}
      >
        {/* Video fills background */}
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

        {/* Video close button (behind image when image visible) */}
        {showVideo && (
          <button
            onClick={() => setShowVideo(false)}
            className={closeBtnClass}
            style={{ ...closeBtnStyle, zIndex: 1 }}
            aria-label="Cerrar video"
          >
            ✕
          </button>
        )}

        {/* Image overlay (front, z-10) */}
        {showImage && (
          <div className="absolute inset-0 z-10">
            <Image
              src="/casacampo.jpg"
              alt="Full Day Casa de Campo — Desafío Santo Dilema"
              fill
              className="object-cover"
              priority
              sizes="340px"
            />
            <button
              onClick={() => setShowImage(false)}
              className={closeBtnClass}
              style={{ ...closeBtnStyle, zIndex: 20 }}
              aria-label="Cerrar imagen"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── DESKTOP (lg+): image and video side by side ── */}
      <div className="hidden lg:flex flex-row gap-5 items-center">
        {/* Video */}
        {showVideo && (
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
            style={{ width: '300px', aspectRatio: '9/16', maxHeight: '84vh' }}
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
            <button
              onClick={() => setShowVideo(false)}
              className={closeBtnClass}
              style={closeBtnStyle}
              aria-label="Cerrar video"
            >
              ✕
            </button>
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
