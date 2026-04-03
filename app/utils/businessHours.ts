// Horario de atención: Jueves a Domingo, 6:00 PM - 11:00 PM (hora Perú, UTC-5)
// Dominio de pruebas: siempre abierto
const ALWAYS_OPEN_DOMAINS = ["santo-dilema-iota.vercel.app"];

// Cierre temporal hasta Sábado 4 de Abril 2026, 18:00 hora Perú (= 23:00 UTC)
const TEMP_CLOSURE_UNTIL = new Date("2026-04-04T23:00:00Z");

export function isBusinessOpen(): boolean {
  // Staging: siempre abierto
  if (typeof window !== "undefined" && ALWAYS_OPEN_DOMAINS.includes(window.location.hostname)) {
    return true;
  }

  // Cierre temporal activo
  if (new Date() < TEMP_CLOSURE_UNTIL) return false;

  const peruDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
  );
  const day = peruDate.getDay();   // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  const hour = peruDate.getHours();

  const isOpenDay = [0, 4, 5, 6].includes(day); // Dom, Jue, Vie, Sáb
  const isOpenHour = hour >= 18 && hour < 23;    // 6pm a 11pm

  return isOpenDay && isOpenHour;
}

export function getNextOpenMessage(): string {
  // Durante cierre temporal, mensaje fijo
  if (new Date() < TEMP_CLOSURE_UNTIL) {
    return "Volvemos el Sábado a las 6:00 PM";
  }

  const peruDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
  );
  const day = peruDate.getDay();
  const hour = peruDate.getHours();

  const openDays = [0, 4, 5, 6];
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  // Si es día de apertura pero todavía no son las 6pm
  if (openDays.includes(day) && hour < 18) {
    return "Hoy abrimos a las 6:00 PM";
  }

  // Buscar el próximo día de apertura
  let daysAhead = 1;
  let nextDay = (day + daysAhead) % 7;
  while (!openDays.includes(nextDay) && daysAhead <= 7) {
    daysAhead++;
    nextDay = (day + daysAhead) % 7;
  }

  if (daysAhead === 1) return "Mañana abrimos a las 6:00 PM";
  return `Abrimos el ${dayNames[nextDay]} a las 6:00 PM`;
}
