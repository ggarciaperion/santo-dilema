'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ─── KEYFRAME ANIMATIONS ──────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    0%   { transform: scale(0.8); opacity: 0; }
    70%  { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 8px rgba(6,182,212,0.3); }
    50%       { box-shadow: 0 0 24px rgba(6,182,212,0.7); }
  }
  @keyframes shimmer {
    from { background-position: -200% center; }
    to   { background-position: 200% center; }
  }
  @keyframes countUp {
    from { transform: translateY(6px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes firePulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.2); }
  }
  @keyframes ringFill {
    from { stroke-dashoffset: 264; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes prBadge {
    0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
    60%  { transform: scale(1.2) rotate(5deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes toastIn {
    from { transform: translateY(-20px) scale(0.95); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes timerPulse {
    0%,100% { color: #22d3ee; }
    50%      { color: #ffffff; }
  }
  .anim-fade-up   { animation: fadeSlideUp 0.35s ease both; }
  .anim-pop       { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .anim-glow      { animation: glow 2s ease-in-out infinite; }
  .anim-fire      { animation: firePulse 1s ease-in-out infinite; }
  .anim-pr        { animation: prBadge 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
  .anim-slide-in  { animation: slideIn 0.3s ease both; }
  .anim-timer     { animation: timerPulse 1s ease-in-out infinite; }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  button, a { touch-action: manipulation; }
  .shimmer-text {
    background: linear-gradient(90deg, #06b6d4 0%, #fff 40%, #14b8a6 60%, #06b6d4 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  .bar-fill {
    transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ring-path {
    transition: stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`;

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface SetEntry { reps: number; weight: number; done?: boolean; }
interface ExerciseEntry { id: string; name: string; sets: SetEntry[]; }
interface DayLog {
  date: string; water: number; creatine: boolean; whey: number; cardio: boolean;
  meals: Record<string, boolean>; workoutDone: boolean;
  workoutType: string; exercises: ExerciseEntry[];
  notes: string; workoutStartedAt?: number; workoutDuration?: number;
}
interface ProgressEntry {
  date: string; weight: number; waist?: number; chest?: number; arms?: number; notes?: string;
}
interface Toast { id: number; msg: string; type: 'pr' | 'done' | 'info'; }
interface PlannedEx { name: string; sets: number; reps: string; rest: number; tip?: string; }
interface DaySession { label: string; color: string; emoji: string; isRest: boolean; isCardio: boolean; isHome?: boolean; exercises: PlannedEx[]; }

// ─── SESIONES PLANIFICADAS ────────────────────────────────────────────────────
const HOME_DB: PlannedEx[] = [
  { name: 'Sentadilla goblet (mancuerna al pecho)', sets: 3, reps: '12–15', rest: 90, tip: 'Talones en el suelo, rodillas hacia afuera, espalda recta — sin importar el peso' },
  { name: 'Hip thrust en suelo con mancuerna', sets: 4, reps: '15', rest: 90, tip: 'Hombros en el suelo, empuja con los glúteos, aprieta 1 segundo arriba' },
  { name: 'Zancadas alternas con mancuernas', sets: 3, reps: '10/lado', rest: 90, tip: 'Rodilla trasera casi toca el suelo, torso recto' },
  { name: 'Press de suelo con mancuernas (floor press)', sets: 3, reps: '10–12', rest: 90, tip: 'Tumbado en el suelo, codos a 45° del cuerpo, baja hasta tocar el suelo' },
  { name: 'Remo inclinado 1 brazo (apoyo en silla)', sets: 3, reps: '10/lado', rest: 75, tip: 'Codo pegado al cuerpo, jala hacia la cadera, no gires el torso' },
  { name: 'Press de hombros sentado con mancuernas', sets: 3, reps: '10–12', rest: 90, tip: 'Mancuernas a la altura de los oídos, empuja hacia arriba sin arquear la espalda' },
  { name: 'Curl de bíceps alternado', sets: 3, reps: '12', rest: 60, tip: 'Codo fijo al cuerpo, sube hasta el hombro, baja en 2 segundos' },
  { name: 'Extensión de tríceps tumbado (skullcrusher DB)', sets: 3, reps: '12', rest: 60, tip: 'Codos apuntando al techo, baja hacia la frente, extiende arriba' },
  { name: 'Plancha frontal', sets: 3, reps: '30 seg', rest: 45, tip: 'Cuerpo recto de cabeza a talones, aprieta abdomen y glúteos' },
];
const UPPER_A_EX: PlannedEx[] = [
  { name: 'Press de banca con mancuernas', sets: 3, reps: '10–12', rest: 90, tip: 'Codos a 45°, baja hasta sentir el pecho estirado, sube explosivo' },
  { name: 'Press inclinado mancuernas (30°)', sets: 3, reps: '10–12', rest: 90, tip: 'Banco inclinado, enfoca la parte alta del pecho' },
  { name: 'Press militar sentado con mancuernas', sets: 3, reps: '10–12', rest: 90, tip: 'Mancuernas a la altura de los oídos, no arquees la espalda' },
  { name: 'Elevaciones laterales', sets: 3, reps: '12–15', rest: 60, tip: 'Muy ligero, codo ligeramente doblado, llega a la altura del hombro' },
  { name: 'Fondos en banco o máquina', sets: 3, reps: '10–12', rest: 60, tip: 'Codos hacia atrás, no los abras al lado' },
  { name: 'Extensión tríceps en polea', sets: 3, reps: '12–15', rest: 60, tip: 'Codos fijos al costado del cuerpo, extiende completamente' },
];
const LOWER_A_EX: PlannedEx[] = [
  { name: 'Sentadilla goblet o con barra', sets: 4, reps: '10–12', rest: 120, tip: 'Talones en el suelo, rodillas hacia afuera, profundidad paralela' },
  { name: 'Prensa de piernas', sets: 3, reps: '12', rest: 90, tip: 'Pies a lo ancho de hombros, no bloquees las rodillas arriba' },
  { name: 'Extensión cuádriceps en máquina', sets: 3, reps: '12–15', rest: 60, tip: 'Extiende completamente, baja controlado en 2–3 segundos' },
  { name: 'Hip thrust con barra o mancuerna', sets: 4, reps: '12–15', rest: 90, tip: 'Hombros en el banco, aprieta los glúteos arriba y mantén 1 seg' },
  { name: 'Zancadas con mancuernas', sets: 3, reps: '10/lado', rest: 90, tip: 'Paso largo, rodilla trasera casi al suelo, torso recto' },
  { name: 'Elevación de talones (pantorrillas)', sets: 4, reps: '15–20', rest: 45, tip: 'Sube todo lo que puedas, baja lento, siéntelo estirar bien' },
];
const UPPER_B_EX: PlannedEx[] = [
  { name: 'Jalón al pecho en polea', sets: 4, reps: '10–12', rest: 90, tip: 'Agarre más ancho que hombros, lleva la barra al pecho, no balancees' },
  { name: 'Remo con barra', sets: 4, reps: '10–12', rest: 90, tip: 'Torso a 45°, lleva la barra al ombligo, aprieta la espalda arriba' },
  { name: 'Remo mancuerna 1 brazo', sets: 3, reps: '10/lado', rest: 75, tip: 'Apoyado en banco, codo pegado, jala hasta la cadera' },
  { name: 'Curl de bíceps con barra', sets: 3, reps: '10–12', rest: 60, tip: 'Codos fijos al lado, sube hasta arriba, baja en 2 segundos' },
  { name: 'Curl martillo con mancuernas', sets: 3, reps: '12', rest: 60, tip: 'Agarre neutro (pulgar arriba), trabaja el braquial' },
  { name: 'Plancha frontal', sets: 3, reps: '30–45 seg', rest: 45, tip: 'Cuerpo recto, aprieta el abdomen y los glúteos' },
];
const LOWER_B_EX: PlannedEx[] = [
  { name: 'Hip thrust con barra (GLÚTEOS — prioridad)', sets: 4, reps: '12–15', rest: 90, tip: 'Aprieta fuerte los glúteos arriba, no uses la espalda baja' },
  { name: 'Peso muerto rumano (RDL)', sets: 4, reps: '10–12', rest: 120, tip: 'Espalda recta, siente el estiramiento en isquiotibiales, rodillas ligeramente dobladas' },
  { name: 'Curl femoral acostado en máquina', sets: 3, reps: '12–15', rest: 75, tip: 'Baja controlado en 2–3 segundos, sin impulso' },
  { name: 'Abducción de cadera en máquina', sets: 3, reps: '15–20', rest: 60, tip: 'Peso ligero, abre lento, cierra más lento todavía' },
  { name: 'Sentadilla sumo con mancuerna', sets: 3, reps: '12', rest: 90, tip: 'Pies abiertos y puntados hacia afuera, mancuerna en el centro' },
  { name: 'Crunch en polea o suelo', sets: 3, reps: '15–20', rest: 45, tip: 'Flexiona desde el ombligo, no jales con el cuello' },
  { name: 'Elevaciones de piernas tumbado', sets: 3, reps: '12–15', rest: 45, tip: 'Espalda pegada al suelo, sube las piernas rectas, baja lento' },
];
const CARDIO_EX: PlannedEx[] = [
  { name: 'Caminata inclinada (12% / 5.5 km/h)', sets: 1, reps: '35 min', rest: 0, tip: 'Meta: frecuencia cardíaca 120–140 ppm · "Puedes hablar pero con esfuerzo"' },
  { name: 'Bicicleta estacionaria (alternativa)', sets: 1, reps: '30 min', rest: 0, tip: 'Ritmo moderado sostenido — misma zona cardíaca' },
];
const SESSION_BY_DOW: DaySession[] = [
  { label: 'Upper A — Pecho · Hombros · Tríceps',      color: '#8b5cf6', emoji: '💪', isRest: false, isCardio: false, exercises: UPPER_A_EX },
  { label: 'Lower A — Cuádriceps · Glúteos',            color: '#06b6d4', emoji: '🦵', isRest: false, isCardio: false, exercises: LOWER_A_EX },
  { label: 'Descanso activo',                            color: '#22c55e', emoji: '🌿', isRest: true,  isCardio: false, exercises: [] },
  { label: 'Upper B — Espalda · Bíceps · Core',         color: '#f59e0b', emoji: '🏋️', isRest: false, isCardio: false, exercises: UPPER_B_EX },
  { label: 'Lower B — Glúteos · Isquiotibiales',        color: '#ec4899', emoji: '🍑', isRest: false, isCardio: false, exercises: LOWER_B_EX },
  { label: 'Cardio — Quema de grasa',                   color: '#14b8a6', emoji: '🏃', isRest: false, isCardio: true,  exercises: CARDIO_EX },
  { label: 'Descanso total — recarga y come bien',       color: '#6b7280', emoji: '😴', isRest: true,  isCardio: false, exercises: [] },
];
const HOME_SESSION: DaySession = {
  label: 'Casa — Full Body con Mancuernas', color: '#f59e0b', emoji: '🏠',
  isRest: false, isCardio: false, isHome: true, exercises: HOME_DB,
};
const DAY_LABEL = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PROGRAM: Record<string, { phase: string; short: string; color: string; workouts: string[] }> = {
  '1-3': { phase: 'FASE 1 — Readaptación', short: 'F1', color: '#06b6d4',
    workouts: ['Full Body A', 'Full Body B', 'Full Body A', 'Descanso', 'Full Body B', 'Cardio', 'Descanso'] },
  '4-8': { phase: 'FASE 2 — Hipertrofia', short: 'F2', color: '#8b5cf6',
    workouts: ['Upper A', 'Upper B', 'Descanso', 'Lower A', 'Lower B', 'Cardio', 'Descanso'] },
  '9-12': { phase: 'FASE 3 — Intensificación', short: 'F3', color: '#f59e0b',
    workouts: ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Cardio + Abs', 'Descanso'] },
};
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MEAL_NAMES  = ['Desayuno', 'Media mañana', 'Almuerzo', 'Pre-entreno', 'Post-entreno', 'Cena', 'Snack nocturno'];
const MEAL_ICONS  = ['☀️', '🍌', '🍽️', '⚡', '💪', '🌙', '🌛'];
const MEAL_TIMES  = ['7:00', '10:30', '13:00', '17:00', '19:00', '20:30', '22:00'];
const MEAL_DESC   = [
  'Avena 80g + 2 huevos + 3 claras + plátano',
  '1 scoop whey + manzana o pera',
  'Pollo 200g + arroz 150g + ensalada libre',
  'Pollo 100g + arroz 100g + fruta',
  '1 scoop whey + plátano grande',
  'Carne/pollo 180g + verduras + papa 100g',
  '3 claras hervidas o ½ scoop whey (opcional)',
];
// Proteína estimada por comida (g)
const MEAL_PROTEIN = [45, 25, 45, 20, 30, 40, 12];
const WATER_GOAL = 8;
const QUICK_EX: Record<string, string[]> = {
  'Full Body A': ['Sentadilla', 'Press banca', 'Remo con barra', 'Press militar', 'Curl bíceps', 'Press francés'],
  'Full Body B': ['RDL', 'Jalón al pecho', 'Press inclinado DB', 'Remo polea', 'Extensión cuád.', 'Curl femoral'],
  'Upper A': ['Press banca mancuernas', 'Press inclinado DB', 'Press militar sentado', 'Elevaciones laterales', 'Fondos banco/máquina', 'Extensión tríceps polea'],
  'Upper B': ['Jalón al pecho', 'Remo con barra', 'Remo mancuerna 1 brazo', 'Curl bíceps barra', 'Curl martillo', 'Plancha frontal'],
  'Lower A': ['Sentadilla goblet', 'Prensa de piernas', 'Extensión cuádriceps', 'Hip thrust', 'Zancadas mancuernas', 'Elevación talones'],
  'Lower B': ['Hip thrust barra', 'Peso muerto rumano RDL', 'Curl femoral acostado', 'Abducción cadera máquina', 'Sentadilla sumo DB', 'Crunch polea/suelo'],
  'Push': ['Press banca', 'Press inclinado barra', 'Aperturas polea', 'Press hombros DB', 'Elevaciones lat.', 'Fondos lastrados'],
  'Pull': ['Peso muerto', 'Dominadas lastradas', 'Remo Pendlay', 'Jalón agarre neutro', 'Remo 1 brazo', 'Curl araña'],
  'Legs': ['Sentadilla', 'Prensa 45°', 'Sentadilla búlgara', 'Extensión cuád.', 'Hip thrust', 'Gemelos'],
  'Upper': ['Press banca', 'Dominadas', 'Press militar', 'Remo con barra', 'Curl EZ', 'Tríceps polea'],
  'Lower': ['Peso muerto', 'Sentadilla búlgara', 'Hip thrust', 'Curl femoral', 'RDL', 'Gemelos'],
  'Cardio': ['Caminata rápida', 'Jogging suave', 'HIIT sprint'],
  'Cardio + Abs': ['Jogging', 'Plancha 60s', 'Ab wheel', 'Crunch bicicleta', 'Elevación piernas'],
  'Descanso': [],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
// Convert a Date object to local YYYY-MM-DD (avoids UTC offset bug)
const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function getProgramWeek(start: string, current: string) {
  const diff = Math.floor((new Date(current).getTime() - new Date(start).getTime()) / 86400000);
  return Math.max(1, Math.min(12, Math.floor(diff / 7) + 1));
}
function getPhaseKey(w: number) { return w <= 3 ? '1-3' : w <= 8 ? '4-8' : '9-12'; }
function getDOW(d: string) { const n = new Date(d + 'T12:00:00').getDay(); return n === 0 ? 6 : n - 1; }
function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
}
function fmtSecs(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
function getExerciseHistory(name: string, logs: Record<string, DayLog>, skip?: string) {
  const hist: { date: string; maxWeight: number; totalVol: number; sets: SetEntry[] }[] = [];
  Object.entries(logs).forEach(([d, log]) => {
    if (d === skip) return;
    log.exercises.forEach(ex => {
      if (ex.name.toLowerCase() === name.toLowerCase()) {
        const maxW = Math.max(0, ...ex.sets.map(s => s.weight));
        const vol  = ex.sets.reduce((a, s) => a + s.weight * s.reps, 0);
        hist.push({ date: d, maxWeight: maxW, totalVol: vol, sets: ex.sets });
      }
    });
  });
  return hist.sort((a, b) => b.date.localeCompare(a.date));
}
function getExercisePR(name: string, logs: Record<string, DayLog>, skip?: string) {
  return Math.max(0, ...getExerciseHistory(name, logs, skip).map(h => h.maxWeight));
}
function dailyScore(log: DayLog) {
  const meals  = MEAL_NAMES.filter(m => log.meals[m]).length / MEAL_NAMES.length;
  const water  = Math.min(log.water, WATER_GOAL) / WATER_GOAL;
  const supls  = (log.creatine ? 1 : 0) + (log.whey >= 1 ? 1 : 0);
  return Math.round(meals * 25 + water * 20 + supls * 7.5 + (log.workoutDone ? 35 : 0) + (log.cardio ? 5 : 0));
}
function estimatedProtein(log: DayLog) {
  return MEAL_NAMES.reduce((sum, m, i) => sum + (log.meals[m] ? MEAL_PROTEIN[i] : 0), 0);
}
function getStreak(logs: Record<string, DayLog>) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = localDateStr(d);
    const l = logs[ds];
    const active = l && (l.workoutDone || l.water >= 4 || Object.values(l.meals).some(Boolean) || l.creatine);
    if (active) streak++;
    else if (i > 0) break;
  }
  return streak;
}
function bodyFatEstimate(waistCm?: number) {
  if (!waistCm) return null;
  // Simplified US Navy formula (no neck measurement): BF% ≈ 495 / (1.0324 - 0.19077*log10(waist) + 0.15456*log10(170)) - 450
  const bf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm) + 0.15456 * Math.log10(170)) - 450;
  return Math.max(4, Math.min(40, Math.round(bf * 10) / 10));
}
function weeklyAdherence(logs: Record<string, DayLog>, phaseKey: string) {
  const plan = PROGRAM[phaseKey].workouts;
  const today = new Date();
  let planned = 0, done = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - getDOW(todayStr()) + i);
    const ds = localDateStr(d);
    const dow = getDOW(ds);
    if (plan[dow] !== 'Descanso') { planned++; if (logs[ds]?.workoutDone) done++; }
  }
  return planned > 0 ? Math.round((done / planned) * 100) : 0;
}

// Bezier curve path from points
function bezierPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], cpx = (p.x + c.x) / 2;
    d += ` C${cpx},${p.y} ${cpx},${c.y} ${c.x},${c.y}`;
  }
  return d;
}

// ─── ANIMATED RING ────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 90, color = '#06b6d4' }: { score: number; size?: number; color?: string }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const [disp, setDisp] = useState(0);
  useEffect(() => { const t = setTimeout(() => setDisp(score), 150); return () => clearTimeout(t); }, [score]);
  const offset = circ - (disp / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth="7" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#rg)`} strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="ring-path" />
    </svg>
  );
}

// ─── ANIMATED BAR ─────────────────────────────────────────────────────────────
function Bar({ pct, color = '#06b6d4', h = 6, delay = 0 }:
  { pct: number; color?: string; h?: number; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(Math.min(100, pct)), 200 + delay); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div style={{ height: h, borderRadius: h }} className="w-full bg-zinc-800 overflow-hidden">
      <div className="bar-fill h-full rounded-full" style={{ width: `${w}%`, background: color, transitionDelay: `${delay}ms` }} />
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="anim-pop pointer-events-auto max-w-xs w-full mx-4"
          style={{ animation: 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
          onClick={() => remove(t.id)}>
          <div className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-2xl flex items-center gap-2 ${
            t.type === 'pr'   ? 'bg-amber-500 text-black' :
            t.type === 'done' ? 'bg-green-500 text-black' : 'bg-zinc-800 text-white border border-zinc-600'
          }`}>
            <span>{t.type === 'pr' ? '🏆' : t.type === 'done' ? '✅' : 'ℹ️'}</span>
            {t.msg}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function FitnessPage() {
  const [tab, setTab] = useState<'dashboard' | 'workout' | 'nutrition' | 'progress' | 'settings'>('dashboard');
  const [today] = useState(todayStr);
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [startDate, setStartDate] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Workout timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rest timer
  const [rest, setRest] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const afterRestRef = useRef<(() => void) | null>(null);

  // Guided workout
  const [guided, setGuided] = useState(false);
  const [gExIdx, setGExIdx] = useState(0);
  const [gSetIdx, setGSetIdx] = useState(0);
  const [gWeight, setGWeight] = useState('');
  const [gReps, setGReps] = useState('');

  // Workout UI
  const [newExName, setNewExName] = useState('');
  const [showAddEx, setShowAddEx] = useState(false);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);

  // Progress form
  const [showPF, setShowPF] = useState(false);
  const [pf, setPf] = useState({ weight: '', waist: '', chest: '', arms: '', notes: '' });

  // ── Load ──
  useEffect(() => {
    const sl = localStorage.getItem('fitness_logs');
    const sp = localStorage.getItem('fitness_progress');
    const ss = localStorage.getItem('fitness_start');
    const parsedLogs = sl ? JSON.parse(sl) : {};
    if (sl) setLogs(parsedLogs);
    if (sp) setProgress(JSON.parse(sp));
    const todayLocal = todayStr();
    // If no log data yet, always start from today (fixes timezone off-by-one bug)
    const hasAnyLog = Object.keys(parsedLogs).length > 0;
    const s = (hasAnyLog && ss) ? ss : todayLocal;
    localStorage.setItem('fitness_start', s);
    setStartDate(s);
  }, []);

  // ── Save ──
  const saveLogs = useCallback((nl: Record<string, DayLog>) => {
    setLogs(nl); localStorage.setItem('fitness_logs', JSON.stringify(nl));
  }, []);
  const saveProgress = useCallback((np: ProgressEntry[]) => {
    setProgress(np); localStorage.setItem('fitness_progress', JSON.stringify(np));
  }, []);

  // ── Toast ──
  const addToast = useCallback((msg: string, type: Toast['type'] = 'info') => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  // ── Today log ──
  const todayLog: DayLog = logs[today] ?? {
    date: today, water: 0, creatine: false, whey: 0, cardio: false, meals: {}, workoutDone: false,
    workoutType: '', exercises: [], notes: '',
  };

  const updateToday = useCallback((updates: Partial<DayLog>) => {
    const u = { ...todayLog, ...updates };
    saveLogs({ ...logs, [today]: u });
  }, [todayLog, logs, today, saveLogs]);

  // ── Workout timer ──
  useEffect(() => {
    if (todayLog.workoutStartedAt && !todayLog.workoutDone) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - (todayLog.workoutStartedAt ?? 0)) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [todayLog.workoutStartedAt, todayLog.workoutDone]);

  // ── Rest timer ──
  useEffect(() => {
    if (restActive && rest > 0) {
      restRef.current = setInterval(() => setRest(r => {
        if (r <= 1) {
          setRestActive(false);
          clearInterval(restRef.current!);
          if (afterRestRef.current) { afterRestRef.current(); afterRestRef.current = null; }
          return 0;
        }
        return r - 1;
      }), 1000);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restActive]);

  const startRest = (secs: number) => {
    if (restRef.current) clearInterval(restRef.current);
    setRest(secs); setRestActive(true);
  };

  // ── Program ──
  const currentWeek = startDate ? getProgramWeek(startDate, today) : 1;
  const phaseKey   = getPhaseKey(currentWeek);
  const phase      = PROGRAM[phaseKey];
  const todayWT    = phase.workouts[getDOW(today)];
  const suggestedEx = QUICK_EX[todayWT] ?? [];

  // ── Creatine dose: 6g loading phase (week 1), 3g maintenance ──
  const creatineDose = currentWeek <= 1 ? 6 : 3;

  // ── Today's planned session ──
  const todayDOW = getDOW(today);
  const isFirstDay = startDate === today;
  const todaySession: DaySession = (isFirstDay && todayDOW === 1)
    ? HOME_SESSION
    : SESSION_BY_DOW[todayDOW] ?? SESSION_BY_DOW[0];

  // ── Guided workout functions ──
  const startGuided = useCallback(() => {
    if (todaySession.exercises.length > 0 && todayLog.exercises.length === 0) {
      const exs: ExerciseEntry[] = todaySession.exercises.map(pe => ({
        id: `g_${pe.name.slice(0, 20)}_${Date.now()}`,
        name: pe.name,
        sets: Array.from({ length: pe.sets }, () => ({ reps: 0, weight: 0, done: false })),
      }));
      updateToday({ exercises: exs, workoutStartedAt: Date.now(), workoutType: todaySession.label });
    } else {
      updateToday({ workoutStartedAt: Date.now(), workoutType: todaySession.label });
    }
    setGuided(true); setGExIdx(0); setGSetIdx(0); setGWeight(''); setGReps('');
  }, [todaySession, todayLog.exercises.length, updateToday]);

  const completeSet = useCallback(() => {
    const ex = todaySession.exercises[gExIdx];
    if (!ex) return;
    const w = parseFloat(gWeight) || 0;
    const r = parseInt(gReps) || parseInt(ex.reps.split('–')[0]) || 12;
    const prevPR = getExercisePR(ex.name, logs, today);
    const exs = todayLog.exercises.map(e => {
      if (e.name !== ex.name) return e;
      const sets = e.sets.map((s, si) => si === gSetIdx ? { ...s, weight: w, reps: r, done: true } : s);
      if (w > prevPR && prevPR > 0) setTimeout(() => addToast(`🏆 PR en ${ex.name}: ${w} kg!`, 'pr'), 200);
      return { ...e, sets };
    });
    updateToday({ exercises: exs });
    setGWeight(''); setGReps('');
    const isLastSet = gSetIdx >= ex.sets - 1;
    const isLastEx  = gExIdx >= todaySession.exercises.length - 1;
    if (isLastSet && isLastEx) {
      const dur = todayLog.workoutStartedAt ? Math.floor((Date.now() - todayLog.workoutStartedAt) / 1000) : 0;
      if (timerRef.current) clearInterval(timerRef.current);
      updateToday({ workoutDone: true, workoutType: todaySession.label, workoutDuration: dur });
      addToast('¡Entrenamiento completado! 💪', 'done');
      setGuided(false);
      return;
    }
    const advance = isLastSet
      ? () => { setGExIdx(g => g + 1); setGSetIdx(0); }
      : () => { setGSetIdx(s => s + 1); };
    if (ex.rest > 0) { afterRestRef.current = advance; startRest(ex.rest); }
    else advance();
  }, [gExIdx, gSetIdx, gWeight, gReps, todaySession, todayLog, logs, today, updateToday, addToast, startRest, timerRef]);

  // ── Daily stats ──
  const score       = useMemo(() => dailyScore(todayLog), [todayLog]);
  const streak      = useMemo(() => getStreak(logs), [logs]);
  const adherence   = useMemo(() => weeklyAdherence(logs, phaseKey), [logs, phaseKey]);
  const mealsCount  = MEAL_NAMES.filter(m => todayLog.meals[m]).length;
  const proteinEst  = useMemo(() => estimatedProtein(todayLog), [todayLog]);
  const sessionVol  = todayLog.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0);

  // ── Exercise helpers ──
  const addExercise = (name: string) => {
    if (!name.trim()) return;
    const ex: ExerciseEntry = { id: Date.now().toString(), name: name.trim(), sets: [{ reps: 0, weight: 0 }] };
    updateToday({ exercises: [...todayLog.exercises, ex] });
    setNewExName(''); setShowAddEx(false); setExpandedEx(ex.id);
  };

  const updateSet = (exId: string, si: number, field: 'reps' | 'weight', val: number) => {
    const prev = getExercisePR(
      todayLog.exercises.find(e => e.id === exId)?.name ?? '',
      logs, today
    );
    const exs = todayLog.exercises.map(ex => {
      if (ex.id !== exId) return ex;
      const sets = ex.sets.map((s, i) => i === si ? { ...s, [field]: val } : s);
      // PR check
      if (field === 'weight' && val > prev && prev > 0) {
        setTimeout(() => addToast(`🏆 PR en ${ex.name}: ${val} kg!`, 'pr'), 300);
      }
      return { ...ex, sets };
    });
    updateToday({ exercises: exs });
  };

  const toggleSetDone = (exId: string, si: number) => {
    const exs = todayLog.exercises.map(ex => {
      if (ex.id !== exId) return ex;
      const sets = ex.sets.map((s, i) => i === si ? { ...s, done: !s.done } : s);
      return { ...ex, sets };
    });
    updateToday({ exercises: exs });
    startRest(90); // auto rest timer after completing a set
  };

  const addSet = (exId: string) => {
    const exs = todayLog.exercises.map(ex => {
      if (ex.id !== exId) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { ...last, done: false }] };
    });
    updateToday({ exercises: exs });
  };

  const removeExercise = (exId: string) => updateToday({ exercises: todayLog.exercises.filter(e => e.id !== exId) });

  const markWorkoutDone = () => {
    const dur = todayLog.workoutStartedAt ? Math.floor((Date.now() - todayLog.workoutStartedAt) / 1000) : 0;
    if (timerRef.current) clearInterval(timerRef.current);
    updateToday({ workoutDone: true, workoutType: todayWT, workoutDuration: dur });
    addToast('Entrenamiento completado 💪', 'done');
  };

  const startWorkout = () => {
    const started = Date.now();
    updateToday({ workoutStartedAt: started, workoutType: todayWT });
    setElapsed(0);
  };

  // ─── TAB: DASHBOARD ───────────────────────────────────────────────────────
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  };

  const DashboardContent = (
    <div className="space-y-4 anim-fade-up">
      {/* Hero card with ring */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #0c1a1a 100%)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(circle at 80% 50%, ${phase.color} 0%, transparent 60%)` }} />
        <p className="text-zinc-400 text-xs uppercase tracking-widest">{greeting()} · {fmtDate(today)}</p>
        <div className="flex items-center justify-between mt-3 gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-white font-black text-2xl leading-none">Semana {currentWeek}<span className="text-zinc-500 text-base font-normal"> /12</span></p>
            <p className="font-semibold mt-1 truncate" style={{ color: phase.color }}>{phase.phase}</p>
            <p className="text-zinc-400 text-sm mt-1 truncate">Hoy: <span className="text-white font-bold">{todayWT}</span></p>
            {/* Progress bar */}
            <div className="mt-3">
              <Bar pct={(currentWeek / 12) * 100} color={phase.color} h={4} />
              <p className="text-zinc-500 text-xs mt-1">{Math.round((currentWeek / 12) * 100)}% completado</p>
            </div>
          </div>
          {/* Score ring */}
          <div className="relative flex-shrink-0">
            <ScoreRing score={score} size={90} color={phase.color} />
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ transform: 'rotate(0deg)' }}>
              <p className="text-white font-black text-xl leading-none">{score}</p>
              <p className="text-zinc-400 text-xs">score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Streak + adherence */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-3">
          <span className="text-3xl anim-fire">🔥</span>
          <div>
            <p className="text-white font-black text-2xl leading-none">{streak}</p>
            <p className="text-zinc-400 text-xs">días de racha</p>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <p className="font-black text-2xl leading-none" style={{ color: adherence >= 80 ? '#22c55e' : adherence >= 50 ? '#f59e0b' : '#ef4444' }}>
              {adherence}%
            </p>
            <p className="text-zinc-400 text-xs">adherencia semana</p>
          </div>
        </div>
      </div>

      {/* Daily metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Water */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-400 text-xs uppercase tracking-widest">Agua</p>
            <span className="text-lg">💧</span>
          </div>
          <p className="text-3xl font-black text-cyan-400">{todayLog.water}<span className="text-sm text-zinc-500">/{WATER_GOAL}</span></p>
          <div className="my-2"><Bar pct={(todayLog.water / WATER_GOAL) * 100} color="#06b6d4" h={5} /></div>
          <div className="flex gap-2">
            <button onClick={() => updateToday({ water: Math.max(0, todayLog.water - 1) })}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-2 font-bold transition-all active:scale-95">−</button>
            <button onClick={() => updateToday({ water: Math.min(12, todayLog.water + 1) })}
              className="flex-1 text-white rounded-xl py-2 font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0891b2, #14b8a6)' }}>+</button>
          </div>
        </div>

        {/* Creatine + Whey */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-xs uppercase tracking-widest">Suplementos</p>
            <span className="text-lg">⚡</span>
          </div>
          {/* Creatina */}
          <button onClick={() => updateToday({ creatine: !todayLog.creatine })}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all active:scale-[0.98] ${
              todayLog.creatine ? 'bg-green-900/30 border border-green-600/40' : 'bg-zinc-800 border border-zinc-700'
            }`}>
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <div className="text-left">
                <p className={`text-sm font-bold ${todayLog.creatine ? 'text-green-300' : 'text-zinc-300'}`}>Creatina {creatineDose}g{creatineDose === 6 ? ' (carga)' : ''}</p>
                <p className="text-zinc-500 text-xs">Creapure · post-entreno</p>
              </div>
            </div>
            <span className={`text-lg transition-all ${todayLog.creatine ? 'anim-pop' : ''}`}
              style={{ color: todayLog.creatine ? '#22c55e' : '#3f3f46' }}>
              {todayLog.creatine ? '✓' : '○'}
            </span>
          </button>
          {/* Whey */}
          <div className={`w-full rounded-xl px-3 py-2.5 border ${(todayLog.whey ?? 0) >= 1 ? 'bg-cyan-900/20 border-cyan-600/40' : 'bg-zinc-800 border-zinc-700'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🥤</span>
                <div>
                  <p className={`text-sm font-bold ${(todayLog.whey ?? 0) >= 1 ? 'text-cyan-300' : 'text-zinc-300'}`}>
                    Whey {todayLog.whey ?? 0}/2 scoops
                  </p>
                  <p className="text-zinc-500 text-xs">Meta: 1–2 scoops · ~25g c/u</p>
                </div>
              </div>
              <span className="text-lg" style={{ color: (todayLog.whey ?? 0) >= 2 ? '#22c55e' : (todayLog.whey ?? 0) >= 1 ? '#06b6d4' : '#3f3f46' }}>
                {(todayLog.whey ?? 0) >= 2 ? '✓' : (todayLog.whey ?? 0) >= 1 ? '½' : '○'}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => updateToday({ whey: Math.max(0, (todayLog.whey ?? 0) - 1) })}
                className="flex-1 bg-zinc-700 text-white rounded-lg py-1 text-sm font-bold transition-all active:scale-95">−</button>
              <button onClick={() => updateToday({ whey: Math.min(3, (todayLog.whey ?? 0) + 1) })}
                className="flex-1 text-white rounded-lg py-1 text-sm font-bold transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #0891b2, #14b8a6)' }}>+ scoop</button>
            </div>
          </div>
        </div>

        {/* Meals */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-all"
          onClick={() => setTab('nutrition')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-400 text-xs uppercase tracking-widest">Comidas</p>
            <span className="text-lg">🍽️</span>
          </div>
          <p className="text-3xl font-black text-teal-400">{mealsCount}<span className="text-sm text-zinc-500">/{MEAL_NAMES.length}</span></p>
          <div className="my-2"><Bar pct={(mealsCount / MEAL_NAMES.length) * 100} color="#14b8a6" h={5} /></div>
          <p className="text-cyan-400 text-xs font-bold">{proteinEst}g proteína estimada</p>
        </div>

        {/* Workout */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-all"
          onClick={() => setTab('workout')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-400 text-xs uppercase tracking-widest">Entreno</p>
            <span className="text-lg">🏋️</span>
          </div>
          <p className={`text-3xl font-black leading-none mb-1 ${todayLog.workoutDone ? 'anim-pop' : ''}`}
            style={{ color: todayLog.workoutDone ? '#22c55e' : '#3f3f46' }}>
            {todayLog.workoutDone ? '✓' : todayLog.workoutStartedAt ? '▶' : '○'}
          </p>
          <p className="text-zinc-500 text-xs mb-1">{todayWT}</p>
          {todayLog.workoutStartedAt && !todayLog.workoutDone && (
            <p className="text-cyan-400 text-xs font-mono font-bold anim-timer">{fmtSecs(elapsed)}</p>
          )}
          {todayLog.workoutDone && todayLog.workoutDuration && (
            <p className="text-green-400 text-xs">{fmtSecs(todayLog.workoutDuration)}</p>
          )}
        </div>
      </div>

      {/* Weekly calendar */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Esta semana</p>
        <div className="grid grid-cols-7 gap-0.5">
          {DAY_NAMES.map((name, i) => {
            const base = new Date(today + 'T12:00:00');
            const diff = i - getDOW(today);
            base.setDate(base.getDate() + diff);
            const ds = localDateStr(base);
            const l = logs[ds];
            const isToday = ds === today;
            const wt = phase.workouts[i];
            const isRest = wt === 'Descanso';
            const isDone = l?.workoutDone;
            const isPast = ds < today;
            return (
              <div key={i} className={`rounded-lg p-1 text-center transition-all ${isToday ? 'ring-1' : ''}`}
                style={{ background: isToday ? 'rgba(6,182,212,0.08)' : 'rgba(39,39,42,0.4)',
                  boxShadow: isToday ? `0 0 0 1px ${phase.color}` : 'none' }}>
                <p className="text-zinc-500" style={{ fontSize: '9px' }}>{name}</p>
                <div className={`mt-0.5 w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone ? 'text-white' : isRest ? 'bg-zinc-800 text-zinc-600' :
                  isToday ? 'text-white' : isPast ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-800 text-zinc-400'
                }`} style={isDone ? { background: '#16a34a' } : isToday && !isDone ? { background: phase.color } : {}}>
                  {isDone ? '✓' : isRest ? '—' : base.getDate()}
                </div>
                <p className="text-zinc-600 mt-0.5 truncate" style={{ fontSize: '7px' }}>{wt.split(' ')[0]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest weight */}
      {progress.length > 0 && (() => {
        const last = progress[progress.length - 1];
        const prev = progress.length >= 2 ? progress[progress.length - 2] : null;
        const diff = prev ? last.weight - prev.weight : 0;
        const toGoal = last.weight - 71;
        const bf = bodyFatEstimate(last.waist);
        return (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Composición corporal</p>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-black text-4xl">{last.weight}<span className="text-zinc-400 text-lg font-normal"> kg</span></p>
                {diff !== 0 && (
                  <p className={`text-sm font-semibold mt-1 ${diff < 0 ? 'text-green-400' : 'text-orange-400'}`}>
                    {diff < 0 ? '↓' : '↑'} {Math.abs(diff).toFixed(1)} kg vs anterior
                  </p>
                )}
                <p className="text-zinc-500 text-xs mt-1">
                  {toGoal > 0 ? `↓ ${toGoal.toFixed(1)} kg para meta` : '✓ En rango objetivo'}
                </p>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <p className="text-zinc-500 text-xs">Meta</p>
                  <p className="text-cyan-400 font-bold">71 kg</p>
                </div>
                {bf !== null && (
                  <div>
                    <p className="text-zinc-500 text-xs">%BF estimado</p>
                    <p className={`font-bold ${bf < 15 ? 'text-green-400' : bf < 20 ? 'text-yellow-400' : 'text-orange-400'}`}>~{bf}%</p>
                  </div>
                )}
              </div>
            </div>
            {/* Mini trend */}
            {progress.length >= 3 && (
              <div className="mt-3">
                <Bar pct={Math.max(0, Math.min(100, ((75 - last.weight) / (75 - 71)) * 100))} color="#22c55e" h={4} />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>Inicio 75 kg</span>
                  <span className="text-green-400">{Math.round(Math.max(0, Math.min(100, ((75 - last.weight) / (75 - 71)) * 100)))}% al objetivo</span>
                  <span>Meta 71 kg</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );

  // ─── TAB: WORKOUT ─────────────────────────────────────────────────────────
  const todaySess = todaySession;
  const WorkoutContent = (
    <div className="space-y-4 anim-fade-up">

      {/* ── COMPLETADO ─────────────────────────────────────────── */}
      {todayLog.workoutDone ? (
        <div className="rounded-3xl p-6 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #052e16, #14532d)', border: '1px solid rgba(34,197,94,0.4)' }}>
          <p className="text-5xl mb-3 anim-pop">🎉</p>
          <p className="text-green-400 font-black text-xl">¡Entrenamiento completado!</p>
          <p className="text-white text-base font-bold mt-1">{todaySess.label}</p>
          <p className="text-green-300 text-sm mt-2">
            {todayLog.workoutDuration ? `Duración: ${fmtSecs(todayLog.workoutDuration)}` : ''}
            {sessionVol > 0 ? ` · Volumen: ${sessionVol.toLocaleString()} kg` : ''}
          </p>
          <p className="text-green-700 text-xs mt-3">Registra tu peso y medidas en la pestaña Progreso →</p>
        </div>

      ) : guided ? (
        // ── MODO GUIADO ────────────────────────────────────────────
        (() => {
          const ex = todaySess.exercises[gExIdx];
          if (!ex) return null;
          const isLastEx  = gExIdx >= todaySess.exercises.length - 1;
          const isLastSet = gSetIdx >= ex.sets - 1;
          const prevHist  = getExerciseHistory(ex.name, logs, today);
          const prevSess  = prevHist[0];
          const restTotal = ex.rest;

          return (
            <div className="space-y-3">
              {/* Progress dots */}
              <div className="flex items-center gap-0.5 px-1">
                {todaySess.exercises.map((_, i) => (
                  <div key={i} className="flex-1 rounded-full transition-all duration-500"
                    style={{ height: i === gExIdx ? 6 : 4,
                      background: i < gExIdx ? todaySess.color : i === gExIdx ? todaySess.color : '#27272a' }} />
                ))}
              </div>
              <p className="text-zinc-500 text-xs text-center">
                Ejercicio {gExIdx + 1} de {todaySess.exercises.length} · Semana {currentWeek}
              </p>

              {/* Exercise card */}
              <div className="rounded-3xl p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0d1117, #0f172a)', border: `1.5px solid ${todaySess.color}50` }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ background: `radial-gradient(circle at 80% 20%, ${todaySess.color}, transparent 60%)` }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{todaySess.emoji}</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ background: `${todaySess.color}20`, color: todaySess.color }}>
                      Serie {gSetIdx + 1}/{ex.sets}
                    </span>
                  </div>
                  <p className="text-white font-black text-lg leading-tight">{ex.name}</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: todaySess.color }}>
                    {ex.sets} × {ex.reps} reps · Descanso {ex.rest}s
                  </p>
                  {ex.tip && (
                    <div className="mt-3 bg-zinc-800/70 rounded-xl px-3 py-2.5">
                      <p className="text-zinc-400 text-xs leading-relaxed">💡 {ex.tip}</p>
                    </div>
                  )}
                  {prevSess && (
                    <div className="mt-2 flex items-center justify-between bg-zinc-800/40 rounded-xl px-3 py-2 gap-2">
                      <p className="text-zinc-500 text-xs flex-shrink-0">Última vez:</p>
                      <p className="text-cyan-400 text-xs font-bold text-right truncate">
                        {prevSess.sets.slice(0, 3).map(s => `${s.weight || '—'}×${s.reps}`).join(' · ')}
                      </p>
                    </div>
                  )}
                  {/* Workout timer */}
                  {todayLog.workoutStartedAt && (
                    <p className="text-zinc-600 text-xs mt-2 font-mono">⏱ {fmtSecs(elapsed)}</p>
                  )}
                </div>
              </div>

              {/* REST TIMER */}
              {restActive ? (
                <div className="bg-zinc-900 rounded-2xl p-5 border border-amber-500/50 text-center anim-pop">
                  <p className="text-amber-400 text-xs uppercase tracking-widest mb-1 font-bold">Descansando</p>
                  <p className="text-white font-black font-mono leading-none mb-3" style={{ fontSize: 'clamp(2.5rem, 14vw, 4rem)' }}>{fmtSecs(rest)}</p>
                  <Bar pct={restTotal > 0 ? (rest / restTotal) * 100 : 0} color="#f59e0b" h={8} />
                  <p className="text-zinc-500 text-xs mt-3 mb-4">
                    Próximo: {isLastSet
                      ? (isLastEx ? 'Último ejercicio completado 🎉' : `→ ${todaySess.exercises[gExIdx + 1]?.name}`)
                      : `Serie ${gSetIdx + 2} de ${ex.sets}`}
                  </p>
                  <button onClick={() => { setRestActive(false); setRest(0); if (afterRestRef.current) { afterRestRef.current(); afterRestRef.current = null; } }}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl py-3 text-sm font-bold transition-all active:scale-95">
                    Saltar descanso →
                  </button>
                </div>
              ) : (
                /* SET INPUT */
                <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-4">
                  <p className="text-zinc-400 text-xs uppercase tracking-widest">
                    Registra la serie {gSetIdx + 1} · Meta: {ex.reps} reps
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-zinc-500 text-xs mb-1.5 block">Peso (kg) · pon 0 si es corporal</label>
                      <input type="number" inputMode="decimal" value={gWeight}
                        onChange={e => setGWeight(e.target.value)}
                        placeholder={prevSess ? String(prevSess.sets[Math.min(gSetIdx, prevSess.sets.length - 1)]?.weight ?? 0) : '0'}
                        className="w-full bg-zinc-800 text-white text-center rounded-xl py-3 text-xl font-black border border-zinc-700 focus:border-cyan-500 outline-none" style={{ fontSize: '1.25rem' }} />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-xs mb-1.5 block">Reps completadas</label>
                      <input type="number" inputMode="numeric" value={gReps}
                        onChange={e => setGReps(e.target.value)}
                        placeholder={ex.reps.split('–')[0]}
                        className="w-full bg-zinc-800 text-white text-center rounded-xl py-3 text-xl font-black border border-zinc-700 focus:border-cyan-500 outline-none" style={{ fontSize: '1.25rem' }} />
                    </div>
                  </div>
                  <button onClick={completeSet}
                    className="w-full text-black font-black text-lg rounded-2xl py-5 transition-all active:scale-[0.97]"
                    style={{ background: `linear-gradient(135deg, ${todaySess.color}, #14b8a6)`,
                      boxShadow: `0 6px 24px ${todaySess.color}50` }}>
                    ✓ Serie {gSetIdx + 1} completada
                    {isLastSet && isLastEx ? ' · Finalizar' : isLastSet ? ' · Siguiente ejercicio' : ''}
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-2">
                {gExIdx > 0 && !restActive && (
                  <button onClick={() => { setGExIdx(g => g - 1); setGSetIdx(0); setGWeight(''); setGReps(''); }}
                    className="bg-zinc-800 text-zinc-400 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95">
                    ← Anterior
                  </button>
                )}
                {!restActive && (
                  <button onClick={() => {
                    if (isLastEx) { markWorkoutDone(); setGuided(false); }
                    else { setGExIdx(g => g + 1); setGSetIdx(0); setGWeight(''); setGReps(''); }
                  }}
                    className="flex-1 bg-zinc-800 text-zinc-400 rounded-xl py-3 text-sm font-bold transition-all active:scale-95">
                    {isLastEx ? '🎉 Finalizar entreno' : 'Saltar ejercicio →'}
                  </button>
                )}
              </div>
            </div>
          );
        })()

      ) : (
        // ── VISTA PREVIA / INICIO ──────────────────────────────────
        <>
          {/* Header sesión */}
          <div className="rounded-3xl p-5 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d1117, #0f172a)', border: `1px solid ${todaySess.color}40` }}>
            <div className="absolute inset-0 opacity-10"
              style={{ background: `radial-gradient(circle at 70% 40%, ${todaySess.color}, transparent 60%)` }} />
            <div className="relative z-10">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">
                {DAY_LABEL[todayDOW]} · Semana {currentWeek}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl flex-shrink-0">{todaySess.emoji}</span>
                <div>
                  <p className="text-white font-black text-lg leading-tight">{todaySess.label}</p>
                  {todaySess.isHome && (
                    <p className="text-amber-400 text-xs mt-1 font-medium">🏠 En casa · Solo mancuernas · Cuerpo completo</p>
                  )}
                  {!todaySess.isRest && (
                    <p className="text-zinc-500 text-xs mt-0.5">{todaySess.exercises.length} ejercicios · ~{todaySess.isCardio ? '35' : '60'} min</p>
                  )}
                </div>
              </div>
              {!todaySess.isRest ? (
                <button onClick={startGuided}
                  className="w-full text-black font-black text-base rounded-2xl py-4 transition-all active:scale-[0.97]"
                  style={{ background: `linear-gradient(135deg, ${todaySess.color}, #14b8a6)`,
                    boxShadow: `0 4px 24px ${todaySess.color}50` }}>
                  ▶ Iniciar entrenamiento
                </button>
              ) : (
                <div className="bg-green-900/20 border border-green-600/30 rounded-2xl px-4 py-3 text-center">
                  <p className="text-green-400 font-bold text-sm">Día de descanso — recupera y come bien</p>
                  <p className="text-green-700 text-xs mt-0.5">Camina 20–30 min suave si quieres activarte</p>
                </div>
              )}
            </div>
          </div>

          {/* Lista de ejercicios del día */}
          {todaySess.exercises.length > 0 && (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <p className="text-zinc-400 text-xs uppercase tracking-widest">Plan de hoy — ejercicio a ejercicio</p>
                <p className="text-xs font-bold" style={{ color: todaySess.color }}>{todaySess.exercises.length} ejerc.</p>
              </div>
              {todaySess.exercises.map((ex, i) => {
                const done = todayLog.exercises.find(e => e.name === ex.name)?.sets.every(s => s.done);
                return (
                  <div key={i} className={`px-4 py-3 flex items-start gap-3 transition-all ${
                    i < todaySess.exercises.length - 1 ? 'border-b border-zinc-800/60' : ''
                  } ${done ? 'opacity-50' : ''}`}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5"
                      style={{ background: done ? '#16a34a' : `${todaySess.color}20`, color: done ? '#fff' : todaySess.color }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${done ? 'text-zinc-500' : 'text-white'}`}>{ex.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{ex.sets} series × {ex.reps} · descanso {ex.rest === 0 ? 'continuo' : `${ex.rest}s`}</p>
                      {ex.tip && !done && <p className="text-zinc-600 text-xs mt-0.5 italic leading-relaxed">{ex.tip}</p>}
                    </div>
                    <span className="text-zinc-700 text-xs font-mono flex-shrink-0">{ex.sets}×{ex.reps}</span>
                  </div>
                );
              })}
              <div className="px-4 pb-4 pt-3">
                <button onClick={startGuided}
                  className="w-full text-black font-black text-sm rounded-xl py-3 transition-all active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${todaySess.color}, #14b8a6)` }}>
                  ▶ Empezar con ejercicio 1
                </button>
              </div>
            </div>
          )}

          {/* Cardio tracker */}
          {todaySess.isCardio && (
            <button onClick={() => updateToday({ cardio: !todayLog.cardio, workoutDone: !todayLog.cardio, workoutType: todaySess.label })}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-4 transition-all active:scale-[0.98] border ${
                todayLog.cardio ? 'border-green-600/40' : 'bg-zinc-900 border-zinc-800'
              }`}
              style={todayLog.cardio ? { background: 'rgba(22,163,74,0.1)' } : {}}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏃</span>
                <div>
                  <p className={`font-bold ${todayLog.cardio ? 'text-green-300' : 'text-zinc-200'}`}>Cardio completado</p>
                  <p className="text-zinc-500 text-xs">Caminata inclinada 35 min · 120–140 ppm</p>
                </div>
              </div>
              <span className={`text-2xl ${todayLog.cardio ? 'anim-pop' : ''}`}
                style={{ color: todayLog.cardio ? '#22c55e' : '#3f3f46' }}>
                {todayLog.cardio ? '✓' : '○'}
              </span>
            </button>
          )}

          {/* Notas */}
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Notas del día</p>
            <textarea value={todayLog.notes} onChange={e => updateToday({ notes: e.target.value })}
              placeholder="PRs, sensaciones, dolores, energía..."
              rows={2} className="w-full bg-zinc-800 text-white rounded-xl px-3 py-2.5 border border-zinc-700 focus:border-cyan-500 outline-none resize-none transition-colors" style={{ fontSize: '16px' }} />
          </div>
        </>
      )}
    </div>
  );

  // ─── TAB: NUTRITION ───────────────────────────────────────────────────────
  const NutritionContent = (
    <div className="space-y-4 anim-fade-up">
      {/* Macro overview */}
      <div className="rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, #0d1117, #0f1f1a)', border: '1px solid rgba(20,184,166,0.2)' }}>
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Objetivos nutricionales · 2,150 kcal</p>
        {/* Proteína en tiempo real */}
        <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-2xl p-3 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-cyan-300 text-sm font-bold flex items-center gap-1.5">💪 Proteína del día</span>
            <div className="flex items-baseline gap-1">
              <span className="text-cyan-400 font-black text-xl">{proteinEst}</span>
              <span className="text-zinc-500 text-xs">/165g</span>
            </div>
          </div>
          <Bar pct={(proteinEst / 165) * 100} color="#06b6d4" h={8} />
          <p className="text-zinc-500 text-xs mt-1">
            {proteinEst >= 165 ? '✓ Meta cumplida' : `Faltan ${165 - proteinEst}g · suma comidas abajo`}
          </p>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Proteína', g: 165, kcal: 660, color: '#06b6d4', icon: '💪' },
            { label: 'Carbohidratos', g: 215, kcal: 860, color: '#8b5cf6', icon: '⚡' },
            { label: 'Grasas', g: 70, kcal: 630, color: '#f59e0b', icon: '🥑' },
          ].map((m, i) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-300 text-sm flex items-center gap-1.5">{m.icon} {m.label}</span>
                <div className="flex items-center gap-2">
                  <span style={{ color: m.color }} className="font-black">{m.g}g</span>
                  <span className="text-zinc-600 text-xs">{m.kcal} kcal</span>
                </div>
              </div>
              <Bar pct={(m.kcal / 2150) * 100} color={m.color} h={6} delay={i * 150} />
            </div>
          ))}
        </div>
      </div>

      {/* Meal checklist */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-zinc-400 text-xs uppercase tracking-widest">Comidas del día</p>
          <span className="text-teal-400 font-bold text-sm">{mealsCount}/{MEAL_NAMES.length}</span>
        </div>
        <div className="space-y-2">
          {MEAL_NAMES.map((meal, i) => {
            const checked = todayLog.meals[meal];
            return (
              <button key={meal}
                onClick={() => updateToday({ meals: { ...todayLog.meals, [meal]: !checked } })}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`anim-slide-in w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] text-left ${
                  checked ? 'bg-green-900/20 border border-green-600/30' : 'bg-zinc-800/60 border border-zinc-700/60 hover:border-zinc-500'
                }`}>
                <span className="text-xl">{MEAL_ICONS[i]}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${checked ? 'text-green-300' : 'text-zinc-200'}`}>{meal}</p>
                  <p className="text-zinc-500 text-xs">{MEAL_TIMES[i]} · {MEAL_DESC[i]}</p>
                </div>
                <span className={`text-xl transition-all duration-300 ${checked ? 'anim-pop' : ''}`}
                  style={{ color: checked ? '#22c55e' : '#3f3f46' }}>
                  {checked ? '✓' : '○'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Water */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-zinc-400 text-xs uppercase tracking-widest">Hidratación</p>
          <p className="text-cyan-400 font-bold">{todayLog.water}/{WATER_GOAL} vasos</p>
        </div>
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: WATER_GOAL }).map((_, i) => (
            <button key={i}
              onClick={() => updateToday({ water: i < todayLog.water ? i : i + 1 })}
              className="flex-1 rounded-xl transition-all active:scale-y-90 overflow-hidden"
              style={{ height: 36 }}>
              <div className="w-full h-full rounded-xl transition-all duration-300"
                style={{ background: i < todayLog.water ? 'linear-gradient(180deg, #22d3ee, #0891b2)' : '#27272a',
                  boxShadow: i < todayLog.water ? '0 2px 8px rgba(6,182,212,0.4)' : 'none' }} />
            </button>
          ))}
        </div>
        <p className="text-zinc-600 text-xs text-center">Toca para marcar · Meta 3.5–4 litros/día</p>
      </div>

      {/* Suplementación */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3">
        <p className="text-zinc-400 text-xs uppercase tracking-widest">Suplementación</p>
        {/* Creatina */}
        <button onClick={() => updateToday({ creatine: !todayLog.creatine })}
          className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] ${
            todayLog.creatine ? 'border border-green-600/40' : 'bg-zinc-800 border border-zinc-700'
          }`}
          style={todayLog.creatine ? { background: 'rgba(22,163,74,0.1)' } : {}}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className={`font-bold ${todayLog.creatine ? 'text-green-300' : 'text-zinc-200'}`}>Creatina Creapure {creatineDose}g{creatineDose === 6 ? ' 🔥 carga' : ''}</p>
              <p className="text-zinc-500 text-xs">Dymatize · {creatineDose === 6 ? 'semana 1: carga · 2 tomas de 3g' : 'mantenimiento · post-entreno'}</p>
            </div>
          </div>
          <span className={`text-2xl transition-all duration-300 ${todayLog.creatine ? 'anim-pop' : ''}`}
            style={{ color: todayLog.creatine ? '#22c55e' : '#3f3f46' }}>
            {todayLog.creatine ? '✓' : '○'}
          </span>
        </button>
        {/* Whey */}
        <div className={`rounded-2xl px-4 py-3.5 border ${(todayLog.whey ?? 0) >= 1 ? 'border-cyan-600/40' : 'bg-zinc-800 border-zinc-700'}`}
          style={(todayLog.whey ?? 0) >= 1 ? { background: 'rgba(8,145,178,0.1)' } : {}}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥤</span>
              <div>
                <p className={`font-bold ${(todayLog.whey ?? 0) >= 1 ? 'text-cyan-300' : 'text-zinc-200'}`}>
                  100% Whey — {todayLog.whey ?? 0} scoop{(todayLog.whey ?? 0) !== 1 ? 's' : ''}
                </p>
                <p className="text-zinc-500 text-xs">Meta: 1–2 scoops · ~25g proteína c/u</p>
              </div>
            </div>
            <span className="text-2xl" style={{ color: (todayLog.whey ?? 0) >= 2 ? '#22c55e' : (todayLog.whey ?? 0) >= 1 ? '#06b6d4' : '#3f3f46' }}>
              {(todayLog.whey ?? 0) >= 2 ? '✓' : (todayLog.whey ?? 0) >= 1 ? '½' : '○'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateToday({ whey: Math.max(0, (todayLog.whey ?? 0) - 1) })}
              className="flex-1 bg-zinc-700 text-white rounded-xl py-2 text-sm font-bold transition-all active:scale-95">− scoop</button>
            <button onClick={() => updateToday({ whey: Math.min(3, (todayLog.whey ?? 0) + 1) })}
              className="flex-1 text-white rounded-xl py-2 text-sm font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0891b2, #14b8a6)' }}>+ scoop</button>
          </div>
        </div>
      </div>

      {/* Quick insights */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Referencia rápida</p>
        <div className="space-y-2 text-xs text-zinc-400">
          <p>• <span className="text-cyan-400 font-bold">165g proteína</span> = 4–5 pechugas de pollo (200g) + 2 scoops whey</p>
          <p>• <span className="text-purple-400 font-bold">215g carbos</span> = 3 tazas arroz cocido + 1 camote mediano + 2 plátanos</p>
          <p>• <span className="text-amber-400 font-bold">70g grasas</span> = 2 cucharadas aceite oliva + huevos enteros del día</p>
          <p>• <span className="text-green-400 font-bold">Creatina:</span> {creatineDose === 6 ? <><strong className="text-white">6g/día esta semana</strong> (fase de carga — 2 tomas de 3g). Semana 2: bajas a 3g/día</> : <>3g/día (mantenimiento). Semana 1 fueron 6g de carga</>} — siempre post-entreno</p>
          <p>• El <span className="text-white font-bold">score diario</span> incluye comidas, agua, creatina, whey y entreno</p>
        </div>
      </div>
    </div>
  );

  // ─── TAB: PROGRESS ────────────────────────────────────────────────────────
  const submitProgress = () => {
    const w = parseFloat(pf.weight);
    if (!w) return;
    const entry: ProgressEntry = {
      date: todayStr(), weight: w,
      waist: parseFloat(pf.waist) || undefined,
      chest: parseFloat(pf.chest) || undefined,
      arms:  parseFloat(pf.arms)  || undefined,
      notes: pf.notes || undefined,
    };
    const existing = progress.filter(p => p.date !== entry.date);
    saveProgress([...existing, entry].sort((a, b) => a.date.localeCompare(b.date)));
    setPf({ weight: '', waist: '', chest: '', arms: '', notes: '' });
    setShowPF(false);
    addToast('Registro guardado 📊', 'info');
  };

  const ProgressContent = (
    <div className="space-y-4 anim-fade-up">
      {/* Register button */}
      {!showPF ? (
        <button onClick={() => setShowPF(true)}
          className="w-full text-white rounded-2xl py-4 font-bold text-sm transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #0891b2, #14b8a6)', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}>
          + Registrar peso y medidas de hoy
        </button>
      ) : (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-cyan-500/30 space-y-3 anim-pop">
          <p className="text-white font-bold">Nuevo registro · {fmtDate(todayStr())}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'weight', label: 'Peso (kg) *', ph: 'ej. 75.0' },
              { key: 'waist',  label: 'Cintura (cm)', ph: 'ej. 86' },
              { key: 'chest',  label: 'Pecho (cm)', ph: 'ej. 98' },
              { key: 'arms',   label: 'Brazo (cm)', ph: 'ej. 35' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-zinc-400 text-xs">{f.label}</label>
                <input type="number" value={pf[f.key as keyof typeof pf]} placeholder={f.ph}
                  onChange={e => setPf(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-zinc-800 text-white rounded-xl px-3 py-2.5 border border-zinc-700 focus:border-cyan-500 outline-none mt-1 transition-colors" style={{ fontSize: '16px' }} />
              </div>
            ))}
          </div>
          <textarea value={pf.notes} onChange={e => setPf(p => ({ ...p, notes: e.target.value }))}
            placeholder="Notas (cómo te ves, energía, fotos tomadas...)" rows={2}
            className="w-full bg-zinc-800 text-white rounded-xl px-3 py-2 border border-zinc-700 focus:border-cyan-500 outline-none resize-none transition-colors" style={{ fontSize: '16px' }} />
          <div className="flex gap-2">
            <button onClick={submitProgress}
              className="flex-1 text-white rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0891b2, #14b8a6)' }}>Guardar</button>
            <button onClick={() => setShowPF(false)}
              className="flex-1 bg-zinc-800 text-zinc-400 rounded-xl py-3 text-sm transition-all">Cancelar</button>
          </div>
        </div>
      )}

      {/* Weight chart */}
      {progress.length >= 2 && (() => {
        const W = 320, H = 100;
        const weights = progress.map(p => p.weight);
        const mn = Math.min(...weights) - 1.5;
        const mx = Math.max(...weights) + 1.5;
        const pts = progress.map((p, i) => ({
          x: (i / (progress.length - 1)) * W,
          y: H - ((p.weight - mn) / (mx - mn)) * (H - 12) - 6,
        }));
        const linePath = bezierPath(pts);
        const areaPath = linePath + ` L${W},${H} L0,${H} Z`;
        const goalY = H - ((71 - mn) / (mx - mn)) * (H - 12) - 6;
        const last = progress[progress.length - 1];
        const first = progress[0];
        const totalLost = first.weight - last.weight;
        return (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-widest">Evolución de peso</p>
                <p className="text-white font-black text-2xl mt-1">{last.weight} <span className="text-zinc-400 text-base font-normal">kg</span></p>
              </div>
              {totalLost !== 0 && (
                <div className={`text-right px-3 py-2 rounded-xl ${totalLost > 0 ? 'bg-green-900/30 border border-green-600/30' : 'bg-red-900/30 border border-red-600/30'}`}>
                  <p className={`font-black text-lg ${totalLost > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalLost > 0 ? '↓' : '↑'} {Math.abs(totalLost).toFixed(1)} kg
                  </p>
                  <p className="text-zinc-500 text-xs">desde inicio</p>
                </div>
              )}
            </div>
            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              {/* Grid */}
              {[0.25, 0.5, 0.75].map(f => (
                <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="#27272a" strokeWidth="1" />
              ))}
              {/* Goal line */}
              <line x1="0" y1={goalY} x2={W} y2={goalY} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.6" />
              <text x={W - 4} y={goalY - 4} fill="#22c55e" fontSize="9" textAnchor="end" opacity="0.7">meta 71 kg</text>
              {/* Area */}
              <path d={areaPath} fill="url(#areaGrad)" />
              {/* Line */}
              <path d={linePath} fill="none" stroke="url(#lineG)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {/* Dots */}
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#0d1117" stroke="#06b6d4" strokeWidth="2" />
                  {i === pts.length - 1 && (
                    <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
                  )}
                </g>
              ))}
            </svg>
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>{first.date.slice(5).replace('-', '/')}</span>
              <span>{last.date.slice(5).replace('-', '/')}</span>
            </div>
          </div>
        );
      })()}

      {/* Targets with progress bars */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Metas a 12 semanas</p>
        {[
          { label: 'Peso', start: 75, goal: 71, current: progress.length ? progress[progress.length - 1].weight : 75, unit: 'kg', invert: true, color: '#06b6d4' },
          { label: 'Cintura', start: 86, goal: 80, current: progress.length ? (progress[progress.length - 1].waist ?? 86) : 86, unit: 'cm', invert: true, color: '#14b8a6' },
          { label: 'Brazos', start: 35, goal: 39, current: progress.length ? (progress[progress.length - 1].arms ?? 35) : 35, unit: 'cm', invert: false, color: '#8b5cf6' },
        ].map((m, i) => {
          const pct = m.invert
            ? Math.max(0, Math.min(100, ((m.start - m.current) / (m.start - m.goal)) * 100))
            : Math.max(0, Math.min(100, ((m.current - m.start) / (m.goal - m.start)) * 100));
          return (
            <div key={m.label} className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-zinc-300 text-sm font-medium">{m.label}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">{m.current} {m.unit}</span>
                  <span className="text-zinc-600">→</span>
                  <span style={{ color: m.color }} className="font-bold">{m.goal} {m.unit}</span>
                  <span className="text-zinc-600 ml-1">{Math.round(pct)}%</span>
                </div>
              </div>
              <Bar pct={pct} color={m.color} h={6} delay={i * 200} />
            </div>
          );
        })}
        {/* Body fat */}
        {progress.length > 0 && (() => {
          const last = progress[progress.length - 1];
          const bf = bodyFatEstimate(last.waist);
          if (!bf) return null;
          const bfPct = Math.max(0, Math.min(100, ((22 - bf) / (22 - 15)) * 100));
          return (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-zinc-300 text-sm font-medium">% Grasa corporal</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">~{bf}%</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-green-400 font-bold">14–16%</span>
                  <span className="text-zinc-600 ml-1">{Math.round(bfPct)}%</span>
                </div>
              </div>
              <Bar pct={bfPct} color="#22c55e" h={6} delay={600} />
              <p className="text-zinc-600 text-xs mt-0.5">Estimado con fórmula US Navy · solo de cintura</p>
            </div>
          );
        })()}
      </div>

      {/* History */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Historial</p>
        {progress.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-6">Sin registros aún — empieza hoy</p>
        ) : (
          <div className="space-y-2">
            {[...progress].reverse().slice(0, 12).map((e, i) => {
              const prev = i < progress.length - 1 ? [...progress].reverse()[i + 1] : null;
              const diff = prev ? e.weight - prev.weight : 0;
              const bf = bodyFatEstimate(e.waist);
              return (
                <div key={e.date} className="bg-zinc-800/60 rounded-2xl px-4 py-3 anim-slide-in"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white text-sm font-semibold">{e.date.slice(5).replace('-', '/')}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {e.waist ? `Cintura: ${e.waist} cm` : ''}
                        {e.arms ? ` · Brazos: ${e.arms} cm` : ''}
                        {bf ? ` · BF: ~${bf}%` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black">{e.weight} kg</p>
                      {prev && diff !== 0 && (
                        <p className={`text-xs font-bold ${diff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {diff < 0 ? `↓ ${Math.abs(diff).toFixed(1)}` : `↑ ${diff.toFixed(1)}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {e.notes && <p className="text-zinc-500 text-xs mt-1 italic">{e.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly workout history */}
      {Object.keys(logs).length > 0 && (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Análisis de entrenamientos</p>
          {(() => {
            const workoutLogs = Object.values(logs).filter(l => l.workoutDone);
            const totalWorkouts = workoutLogs.length;
            const totalVolume = workoutLogs.reduce((a, l) => a + l.exercises.reduce((b, ex) => b + ex.sets.reduce((c, s) => c + s.weight * s.reps, 0), 0), 0);
            const avgDur = workoutLogs.filter(l => l.workoutDuration).reduce((a, l, _, arr) => a + (l.workoutDuration ?? 0) / arr.length, 0);
            return (
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Entrenos', value: totalWorkouts, unit: 'sesiones', color: '#06b6d4' },
                  { label: 'Volumen total', value: Math.round(totalVolume / 1000), unit: 'ton', color: '#8b5cf6' },
                  { label: 'Duración media', value: avgDur > 0 ? Math.round(avgDur / 60) : '—', unit: 'min', color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="bg-zinc-800 rounded-xl p-3">
                    <p style={{ color: s.color }} className="font-black text-lg leading-none">{s.value}</p>
                    <p className="text-zinc-500 text-xs">{s.unit}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  // ─── TAB: SETTINGS ────────────────────────────────────────────────────────
  const SettingsContent = (
    <div className="space-y-4 anim-fade-up">
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Inicio del programa</p>
        <div className="flex gap-2 items-center">
          <input type="date" value={startDate}
            onChange={e => { setStartDate(e.target.value); localStorage.setItem('fitness_start', e.target.value); }}
            className="flex-1 bg-zinc-800 text-white rounded-xl px-4 py-3 border border-zinc-700 focus:border-cyan-500 outline-none transition-colors" style={{ fontSize: '16px' }} />
          <button onClick={() => { const t = todayStr(); setStartDate(t); localStorage.setItem('fitness_start', t); }}
            className="bg-cyan-600 text-white rounded-xl px-4 py-3 text-sm font-bold flex-shrink-0 transition-all active:scale-95">
            Hoy
          </button>
        </div>
        <p className="text-zinc-500 text-xs mt-2">Semana {currentWeek} de 12 · {phase.phase}</p>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Parámetros del plan</p>
        <div className="space-y-2">
          {[
            { l: 'Calorías diarias', v: '2,200 kcal', c: '#fff' },
            { l: 'Proteína', v: '165 g/día', c: '#06b6d4' },
            { l: 'Carbohidratos', v: '235 g/día', c: '#8b5cf6' },
            { l: 'Grasas', v: '67 g/día', c: '#f59e0b' },
            { l: 'Agua', v: '8 vasos (3.5L)', c: '#fff' },
            { l: 'Creatina', v: creatineDose === 6 ? `${creatineDose}g/día (carga sem.1)` : `${creatineDose}g/día (mantenimiento)`, c: '#22c55e' },
            { l: 'Sueño mínimo', v: '7.5 horas', c: '#fff' },
          ].map(r => (
            <div key={r.l} className="flex justify-between py-1.5 border-b border-zinc-800 last:border-0">
              <span className="text-zinc-400 text-sm">{r.l}</span>
              <span className="font-bold text-sm" style={{ color: r.c }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Fases del programa</p>
        <div className="space-y-2">
          {Object.entries(PROGRAM).map(([key, p]) => (
            <div key={key} className={`rounded-2xl p-3 transition-all ${phaseKey === key ? 'border' : 'bg-zinc-800'}`}
              style={phaseKey === key ? { background: `${p.color}10`, borderColor: `${p.color}40` } : {}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: phaseKey === key ? p.color : '#e4e4e7' }}>{p.phase}</p>
                  <p className="text-zinc-500 text-xs">{p.workouts.filter(w => w !== 'Descanso').length} días/semana</p>
                </div>
                {phaseKey === key && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold text-black" style={{ background: p.color }}>
                    ACTUAL
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Datos almacenados</p>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-zinc-400">Días registrados</span>
          <span className="text-white font-bold">{Object.keys(logs).length}</span>
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-zinc-400">Registros de peso</span>
          <span className="text-white font-bold">{progress.length}</span>
        </div>
        <button onClick={() => {
          if (confirm('¿Borrar todos los datos? No hay marcha atrás.')) {
            localStorage.removeItem('fitness_logs');
            localStorage.removeItem('fitness_progress');
            localStorage.removeItem('fitness_start');
            setLogs({}); setProgress([]);
            const s = todayStr(); setStartDate(s); localStorage.setItem('fitness_start', s);
          }
        }} className="w-full bg-red-900/20 border border-red-700/30 text-red-400 rounded-xl py-3 text-sm font-medium hover:bg-red-900/40 transition-all">
          Resetear todos los datos
        </button>
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <ToastContainer toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />

      <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#080b0f' }}>
        {/* Header */}
        <div className="sticky top-0 z-40" style={{ background: 'rgba(8,11,15,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(39,39,42,0.8)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Plan 12 semanas</p>
              <p className="font-black text-lg leading-none shimmer-text">FITNESS TRACKER</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Rest timer indicator in header */}
              {restActive && (
                <div className="anim-pop px-2 py-1 rounded-full border border-amber-500/40 text-amber-400 font-mono text-xs font-bold"
                  style={{ background: 'rgba(245,158,11,0.1)' }}>
                  ⏱ {fmtSecs(rest)}
                </div>
              )}
              <div className="text-right">
                <p className="font-bold text-sm" style={{ color: phase.color }}>S{currentWeek}/12</p>
                <p className="text-zinc-500 text-[10px] truncate max-w-[80px]">{todayWT}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto px-4 py-4 pb-36">
          {tab === 'dashboard' && DashboardContent}
          {tab === 'workout'   && WorkoutContent}
          {tab === 'nutrition' && NutritionContent}
          {tab === 'progress'  && ProgressContent}
          {tab === 'settings'  && SettingsContent}
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40"
          style={{ background: 'rgba(8,11,15,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(39,39,42,0.8)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="max-w-md mx-auto px-2 py-2">
            <div className="grid grid-cols-5 gap-1">
              {([
                { key: 'dashboard', icon: '◉', label: 'Hoy' },
                { key: 'workout',   icon: '🏋️', label: 'Entreno' },
                { key: 'nutrition', icon: '🍽️', label: 'Nutrición' },
                { key: 'progress',  icon: '📈', label: 'Progreso' },
                { key: 'settings',  icon: '⚙️', label: 'Config' },
              ] as const).map(item => (
                <button key={item.key} onClick={() => setTab(item.key)}
                  className={`flex flex-col items-center py-2.5 px-0.5 rounded-xl transition-all active:scale-95 min-w-0 ${
                    tab === item.key ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  style={tab === item.key ? {
                    background: `linear-gradient(135deg, ${phase.color}25, ${phase.color}10)`,
                    boxShadow: `0 0 0 1px ${phase.color}40`,
                  } : {}}>
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[10px] mt-0.5 font-medium leading-none">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
