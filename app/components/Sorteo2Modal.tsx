'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Sorteo2Modal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem('sorteo2_modal_v1');
    if (!seen) {
      const t = setTimeout(() => {
        setShow(true);
        sessionStorage.setItem('sorteo2_modal_v1', '1');
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={() => setShow(false)}
    >
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: '420px', width: '100%', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <Image
          src="/sorteo2.png"
          alt="Sorteo Santo Dilema"
          width={420}
          height={560}
          className="w-full h-auto object-contain"
          priority
        />
        <button
          onClick={() => setShow(false)}
          aria-label="Cerrar"
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all hover:scale-110 active:scale-95"
          style={{
            background: 'rgba(0,0,0,0.75)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            color: 'white',
            backdropFilter: 'blur(4px)',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
