// Horario de atención: Jueves a Domingo, 6:00 PM - 11:00 PM (hora Perú, UTC-5)
// Dominio de pruebas: siempre abierto
const TEST_DOMAIN = "santo-dilema-iota.vercel.app";

export function isBusinessOpen(): boolean {
  if (typeof window !== "undefined" && window.location.hostname === TEST_DOMAIN) {
    return true;
  }

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
