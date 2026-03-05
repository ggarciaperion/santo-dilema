"use client";

import { useState, useEffect } from "react";
import MaintenanceModal from "@/components/MaintenanceModal";

export default function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Mantenimiento solo en producción (santodilema.com)
    // El staging (santo-dilema-iota.vercel.app) permanece accesible
    setIsMaintenanceMode(false);
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
