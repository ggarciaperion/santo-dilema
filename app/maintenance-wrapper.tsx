"use client";

import { useState, useEffect } from "react";
import MaintenanceModal from "@/components/MaintenanceModal";

export default function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Ventana de mantenimiento: 11pm Lima (2026-03-29T04:00Z) → 1pm Lima Jueves (2026-04-02T18:00Z)
    const MAINTENANCE_START = new Date('2026-03-28T00:00:00Z');
    const MAINTENANCE_END   = new Date('2026-04-02T23:00:00Z');
    const now = new Date();
    setIsMaintenanceMode(now >= MAINTENANCE_START && now < MAINTENANCE_END);
    setIsChecking(false);
  }, []);

  // Mientras se verifica el dominio, mostrar pantalla vacía
  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl font-bold animate-pulse">Cargando...</div>
      </div>
    );
  }

  // Si estamos en modo mantenimiento, mostrar el modal
  if (isMaintenanceMode) {
    return <MaintenanceModal isOpen={true} />;
  }

  // Si no, mostrar el contenido normal
  return <>{children}</>;
}
