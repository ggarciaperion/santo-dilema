'use client';

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface DayLog {
  date: string;
  weight?: number;
  water: number; // glasses
  creatine: boolean;
  meals: Record<string, boolean>;
  workoutDone: boolean;
  workoutType: string;
  exercises: ExerciseEntry[];
  notes: string;
}

interface ExerciseEntry {
  id: string;
  name: string;
  sets: SetEntry[];
}

interface SetEntry {
  reps: number;
  weight: number;
}

interface ProgressEntry {
  date: string;
  weight: number;
  waist?: number;
  chest?: number;
  arms?: number;
  notes?: string;
}

// ─────────────────────────────────────────────
// 12-WEEK PROGRAM
// ─────────────────────────────────────────────
const PROGRAM: Record<string, { phase: string; label: string; workouts: string[] }> = {
  '1-3': {
    phase: 'FASE 1 — Readaptación',
    label: 'Semanas 1–3',
    workouts: ['Full Body A', 'Full Body B', 'Full Body A', 'Descanso', 'Full Body B', 'Cardio', 'Descanso'],
  },
  '4-8': {
    phase: 'FASE 2 — Hipertrofia',
    label: 'Semanas 4–8',
    workouts: ['Upper A', 'Upper B', 'Descanso', 'Lower A', 'Lower B', 'Cardio', 'Descanso'],
  },
  '9-12': {
    phase: 'FASE 3 — Intensificación',
    label: 'Semanas 9–12',
    workouts: ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Cardio + Abs', 'Descanso'],
  },
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MEAL_NAMES = ['Desayuno', 'Media mañana', 'Almuerzo', 'Pre-entreno', 'Cena'];
const WATER_GOAL = 8; // glasses
const PROTEIN_GOAL = 165; // grams

const QUICK_EXERCISES: Record<string, string[]> = {
  'Full Body A': ['Sentadilla', 'Press banca', 'Remo con barra', 'Press militar', 'Curl bíceps', 'Press francés'],
  'Full Body B': ['RDL', 'Jalón al pecho', 'Press inclinado', 'Remo polea', 'Extensión cuád.', 'Curl femoral'],
  'Upper A': ['Press banca', 'Press inclinado DB', 'Press militar', 'Elevaciones laterales', 'Fondos', 'Extensión tríceps'],
  'Upper B': ['Dominadas', 'Remo con barra', 'Remo polea', 'Face pull', 'Curl EZ', 'Curl martillo'],
  'Lower A': ['Sentadilla', 'Prensa', 'Extensión cuád.', 'Curl femoral', 'Gemelos', 'Plancha'],
  'Lower B': ['Peso muerto', 'Sentadilla búlgara', 'Hip thrust', 'Curl femoral pie', 'RDL 1 pierna', 'Plancha lateral'],
  'Push': ['Press banca', 'Press inclinado barra', 'Aperturas polea', 'Press hombros DB', 'Elevaciones lat.', 'Fondos lastrados'],
  'Pull': ['Peso muerto', 'Dominadas lastradas', 'Remo Pendlay', 'Jalón agarre neutro', 'Remo 1 brazo', 'Curl araña'],
  'Legs': ['Sentadilla', 'Prensa 45°', 'Sentadilla búlgara', 'Extensión cuád.', 'Hip thrust', 'Gemelos'],
  'Upper': ['Press banca', 'Dominadas', 'Press militar', 'Remo con barra', 'Curl EZ', 'Tríceps polea'],
  'Lower': ['Peso muerto', 'Sentadilla búlgara', 'Hip thrust', 'Curl femoral', 'RDL', 'Gemelos'],
  'Cardio': ['Caminata rápida', 'Jogging suave', 'HIIT sprint'],
  'Cardio + Abs': ['Jogging', 'Plancha 60s', 'Ab wheel', 'Crunch bicicleta', 'Elevación piernas'],
  'Descanso': [],
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getProgramWeek(startDate: string, currentDate: string): number {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(12, Math.floor(diffDays / 7) + 1));
}

function getProgramPhaseKey(week: number): string {
  if (week <= 3) return '1-3';
  if (week <= 8) return '4-8';
  return '9-12';
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  return day === 0 ? 6 : day - 1; // convert to Mon=0
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function FitnessPage() {
  const [tab, setTab] = useState<'dashboard' | 'workout' | 'nutrition' | 'progress' | 'settings'>('dashboard');
  const [today] = useState(todayStr());
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [newExName, setNewExName] = useState('');
  const [showAddEx, setShowAddEx] = useState(false);
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [progressForm, setProgressForm] = useState({ weight: '', waist: '', chest: '', arms: '', notes: '' });

  // Load from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('fitness_logs');
    const savedProgress = localStorage.getItem('fitness_progress');
    const savedStart = localStorage.getItem('fitness_start');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedProgress) setProgress(JSON.parse(savedProgress));
    if (savedStart) setStartDate(savedStart);
    else {
      const start = todayStr();
      localStorage.setItem('fitness_start', start);
      setStartDate(start);
    }
  }, []);

  const saveLogs = useCallback((newLogs: Record<string, DayLog>) => {
    setLogs(newLogs);
    localStorage.setItem('fitness_logs', JSON.stringify(newLogs));
  }, []);

  const saveProgress = useCallback((newProgress: ProgressEntry[]) => {
    setProgress(newProgress);
    localStorage.setItem('fitness_progress', JSON.stringify(newProgress));
  }, []);

  // Get or create today's log
  const todayLog: DayLog = logs[today] || {
    date: today,
    water: 0,
    creatine: false,
    meals: {},
    workoutDone: false,
    workoutType: '',
    exercises: [],
    notes: '',
  };

  const updateTodayLog = (updates: Partial<DayLog>) => {
    const updated = { ...todayLog, ...updates };
    saveLogs({ ...logs, [today]: updated });
  };

  // Program info
  const currentWeek = startDate ? getProgramWeek(startDate, today) : 1;
  const phaseKey = getProgramPhaseKey(currentWeek);
  const phase = PROGRAM[phaseKey];
  const dayOfWeek = getDayOfWeek(today);
  const todayWorkoutType = phase.workouts[dayOfWeek];
  const suggestedExercises = QUICK_EXERCISES[todayWorkoutType] || [];

  // Stats
  const mealsChecked = MEAL_NAMES.filter(m => todayLog.meals[m]).length;
  const waterPct = Math.min(100, (todayLog.water / WATER_GOAL) * 100);

  // ─── DASHBOARD TAB ───────────────────────────
  const DashboardTab = () => (
    <div className="space-y-4">
      {/* Date + Week */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">{formatDate(today)}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">Semana {currentWeek} de 12</p>
            <p className="text-cyan-400 text-sm font-medium">{phase.phase}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-xs">Hoy toca</p>
            <p className="text-white font-bold text-sm">{todayWorkoutType}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 bg-zinc-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-cyan-500 to-teal-400 h-2 rounded-full transition-all"
            style={{ width: `${(currentWeek / 12) * 100}%` }}
          />
        </div>
        <p className="text-zinc-500 text-xs mt-1">{Math.round((currentWeek / 12) * 100)}% del programa completado</p>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Water */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Agua 💧</p>
          <p className="text-3xl font-black text-cyan-400">{todayLog.water}<span className="text-lg text-zinc-400">/{WATER_GOAL}</span></p>
          <p className="text-zinc-500 text-xs mb-3">vasos</p>
          <div className="bg-zinc-800 rounded-full h-1.5">
            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${waterPct}%` }} />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => updateTodayLog({ water: Math.max(0, todayLog.water - 1) })}
              className="flex-1 bg-zinc-800 text-white rounded-lg py-1 text-sm font-bold hover:bg-zinc-700 transition"
            >−</button>
            <button
              onClick={() => updateTodayLog({ water: Math.min(12, todayLog.water + 1) })}
              className="flex-1 bg-cyan-600 text-white rounded-lg py-1 text-sm font-bold hover:bg-cyan-500 transition"
            >+</button>
          </div>
        </div>

        {/* Creatina */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Creatina ⚡</p>
          <p className="text-3xl font-black mb-1" style={{ color: todayLog.creatine ? '#22c55e' : '#52525b' }}>
            {todayLog.creatine ? '✓' : '○'}
          </p>
          <p className="text-zinc-500 text-xs mb-3">5g/día</p>
          <button
            onClick={() => updateTodayLog({ creatine: !todayLog.creatine })}
            className={`w-full rounded-lg py-2 text-sm font-bold transition ${
              todayLog.creatine
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {todayLog.creatine ? 'Tomada ✓' : 'Marcar'}
          </button>
        </div>

        {/* Comidas */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Comidas 🍽️</p>
          <p className="text-3xl font-black text-teal-400">{mealsChecked}<span className="text-lg text-zinc-400">/{MEAL_NAMES.length}</span></p>
          <p className="text-zinc-500 text-xs">del día</p>
          <button
            onClick={() => setTab('nutrition')}
            className="mt-3 w-full bg-zinc-800 text-zinc-300 rounded-lg py-2 text-xs font-bold hover:bg-zinc-700 transition"
          >Ver →</button>
        </div>

        {/* Entreno */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Entreno 🏋️</p>
          <p className="text-3xl font-black" style={{ color: todayLog.workoutDone ? '#22c55e' : '#52525b' }}>
            {todayLog.workoutDone ? '✓' : '○'}
          </p>
          <p className="text-zinc-500 text-xs mb-3">{todayWorkoutType}</p>
          <button
            onClick={() => setTab('workout')}
            className="w-full bg-zinc-800 text-zinc-300 rounded-lg py-2 text-xs font-bold hover:bg-zinc-700 transition"
          >Ver →</button>
        </div>
      </div>

      {/* Weekly calendar */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Esta semana</p>
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map((name, i) => {
            const dateObj = new Date(today);
            const curDay = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;
            const diff = i - curDay;
            const d = new Date(dateObj);
            d.setDate(d.getDate() + diff);
            const ds = d.toISOString().split('T')[0];
            const log = logs[ds];
            const isToday = ds === today;
            const workout = phase.workouts[i];
            const isRest = workout === 'Descanso';
            const isDone = log?.workoutDone;
            return (
              <div key={i} className={`rounded-xl p-2 text-center ${isToday ? 'border border-cyan-500 bg-zinc-800' : 'bg-zinc-800/50'}`}>
                <p className="text-zinc-400 text-xs">{name}</p>
                <div className={`mt-1 w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone ? 'bg-green-500 text-white' :
                  isRest ? 'bg-zinc-700 text-zinc-500' :
                  isToday ? 'bg-cyan-600 text-white' :
                  'bg-zinc-700 text-zinc-400'
                }`}>
                  {isDone ? '✓' : isRest ? '—' : d.getDate()}
                </div>
                <p className="text-zinc-500 text-xs mt-1 truncate" style={{ fontSize: '9px' }}>{workout.split(' ')[0]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest weight */}
      {progress.length > 0 && (
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Último peso registrado</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-white">{progress[progress.length - 1].weight}<span className="text-lg text-zinc-400"> kg</span></p>
            <div className="text-right">
              <p className="text-zinc-400 text-xs">Meta</p>
              <p className="text-cyan-400 font-bold">70–72 kg</p>
            </div>
          </div>
          {progress.length >= 2 && (
            <p className={`text-sm mt-1 font-medium ${progress[progress.length - 1].weight < progress[progress.length - 2].weight ? 'text-green-400' : 'text-zinc-400'}`}>
              {progress[progress.length - 1].weight < progress[progress.length - 2].weight
                ? `↓ ${(progress[progress.length - 2].weight - progress[progress.length - 1].weight).toFixed(1)} kg vs registro anterior`
                : `→ Sin cambio vs registro anterior`}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // ─── WORKOUT TAB ────────────────────────────
  const WorkoutTab = () => {
    const addExercise = (name: string) => {
      if (!name.trim()) return;
      const ex: ExerciseEntry = {
        id: Date.now().toString(),
        name: name.trim(),
        sets: [{ reps: 0, weight: 0 }],
      };
      updateTodayLog({ exercises: [...todayLog.exercises, ex] });
      setNewExName('');
      setShowAddEx(false);
    };

    const updateSet = (exId: string, setIdx: number, field: 'reps' | 'weight', val: number) => {
      const exs = todayLog.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        const sets = ex.sets.map((s, i) => i === setIdx ? { ...s, [field]: val } : s);
        return { ...ex, sets };
      });
      updateTodayLog({ exercises: exs });
    };

    const addSet = (exId: string) => {
      const exs = todayLog.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return { ...ex, sets: [...ex.sets, { ...last }] };
      });
      updateTodayLog({ exercises: exs });
    };

    const removeExercise = (exId: string) => {
      updateTodayLog({ exercises: todayLog.exercises.filter(e => e.id !== exId) });
    };

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Hoy — Semana {currentWeek}</p>
          <p className="text-white font-black text-xl">{todayWorkoutType}</p>
          <p className="text-cyan-400 text-sm">{phase.phase}</p>
          <button
            onClick={() => updateTodayLog({ workoutDone: !todayLog.workoutDone, workoutType: todayWorkoutType })}
            className={`mt-3 w-full rounded-xl py-3 font-bold text-sm transition ${
              todayLog.workoutDone
                ? 'bg-green-600 text-white'
                : 'bg-cyan-600 text-white hover:bg-cyan-500'
            }`}
          >
            {todayLog.workoutDone ? '✅ Entrenamiento completado' : '▶ Marcar como completado'}
          </button>
        </div>

        {/* Suggested exercises */}
        {suggestedExercises.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Ejercicios sugeridos</p>
            <div className="flex flex-wrap gap-2">
              {suggestedExercises.map(ex => (
                <button
                  key={ex}
                  onClick={() => addExercise(ex)}
                  className="bg-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 hover:bg-cyan-600 hover:text-white transition"
                >
                  + {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exercise log */}
        {todayLog.exercises.map(ex => (
          <div key={ex.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold">{ex.name}</p>
              <button onClick={() => removeExercise(ex.id)} className="text-zinc-500 hover:text-red-400 text-xs">✕</button>
            </div>
            {/* Sets table */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-xs text-zinc-500 px-1">
                <span>Serie</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
                <span></span>
              </div>
              {ex.sets.map((set, si) => (
                <div key={si} className="grid grid-cols-4 gap-2 items-center">
                  <span className="text-zinc-400 text-sm font-bold px-1">{si + 1}</span>
                  <input
                    type="number"
                    value={set.weight || ''}
                    placeholder="kg"
                    onChange={e => updateSet(ex.id, si, 'weight', parseFloat(e.target.value) || 0)}
                    className="bg-zinc-800 text-white text-center rounded-lg py-2 text-sm border border-zinc-700 focus:border-cyan-500 outline-none w-full"
                  />
                  <input
                    type="number"
                    value={set.reps || ''}
                    placeholder="reps"
                    onChange={e => updateSet(ex.id, si, 'reps', parseInt(e.target.value) || 0)}
                    className="bg-zinc-800 text-white text-center rounded-lg py-2 text-sm border border-zinc-700 focus:border-cyan-500 outline-none w-full"
                  />
                  <button onClick={() => addSet(ex.id)} className="text-cyan-400 text-xs hover:text-cyan-300 text-center">+serie</button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Add exercise */}
        {showAddEx ? (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-cyan-500/30">
            <input
              type="text"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExercise(newExName)}
              placeholder="Nombre del ejercicio..."
              autoFocus
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm border border-zinc-700 focus:border-cyan-500 outline-none mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => addExercise(newExName)} className="flex-1 bg-cyan-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-cyan-500">Agregar</button>
              <button onClick={() => setShowAddEx(false)} className="flex-1 bg-zinc-800 text-zinc-400 rounded-xl py-2 text-sm">Cancelar</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddEx(true)}
            className="w-full bg-zinc-900 border border-dashed border-zinc-600 text-zinc-400 rounded-2xl py-4 text-sm hover:border-cyan-500 hover:text-cyan-400 transition"
          >
            + Agregar ejercicio personalizado
          </button>
        )}

        {/* Notes */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Notas del entrenamiento</p>
          <textarea
            value={todayLog.notes}
            onChange={e => updateTodayLog({ notes: e.target.value })}
            placeholder="¿Cómo te sentiste hoy? Pesos nuevos, PRs, dolor muscular..."
            rows={3}
            className="w-full bg-zinc-800 text-white rounded-xl px-3 py-2 text-sm border border-zinc-700 focus:border-cyan-500 outline-none resize-none"
          />
        </div>
      </div>
    );
  };

  // ─── NUTRITION TAB ──────────────────────────
  const NutritionTab = () => (
    <div className="space-y-4">
      {/* Macros target */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Objetivo diario</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Proteína', value: '165g', sub: '660 kcal', color: '#06b6d4' },
            { label: 'Carbos', value: '235g', sub: '940 kcal', color: '#14b8a6' },
            { label: 'Grasas', value: '67g', sub: '600 kcal', color: '#f59e0b' },
          ].map(m => (
            <div key={m.label} className="bg-zinc-800 rounded-xl p-3">
              <p style={{ color: m.color }} className="text-xl font-black">{m.value}</p>
              <p className="text-zinc-400 text-xs">{m.label}</p>
              <p className="text-zinc-500 text-xs">{m.sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-zinc-800 rounded-xl p-3 text-center">
          <p className="text-zinc-400 text-xs">Total diario</p>
          <p className="text-white font-black text-2xl">2,200 <span className="text-zinc-400 text-sm font-normal">kcal</span></p>
        </div>
      </div>

      {/* Meal checklist */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Check de comidas</p>
        <div className="space-y-2">
          {MEAL_NAMES.map(meal => (
            <button
              key={meal}
              onClick={() => updateTodayLog({ meals: { ...todayLog.meals, [meal]: !todayLog.meals[meal] } })}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition text-left ${
                todayLog.meals[meal] ? 'bg-green-900/30 border border-green-600/40' : 'bg-zinc-800 border border-zinc-700'
              }`}
            >
              <span className={`text-lg ${todayLog.meals[meal] ? 'text-green-400' : 'text-zinc-600'}`}>
                {todayLog.meals[meal] ? '✓' : '○'}
              </span>
              <span className={`font-medium text-sm ${todayLog.meals[meal] ? 'text-green-300' : 'text-zinc-300'}`}>
                {meal}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Water tracker */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-zinc-400 text-xs uppercase tracking-widest">Hidratación</p>
          <p className="text-cyan-400 font-bold text-sm">{todayLog.water} / {WATER_GOAL} vasos</p>
        </div>
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: WATER_GOAL }).map((_, i) => (
            <button
              key={i}
              onClick={() => updateTodayLog({ water: i < todayLog.water ? i : i + 1 })}
              className={`flex-1 h-8 rounded-lg transition ${i < todayLog.water ? 'bg-cyan-500' : 'bg-zinc-800'}`}
            />
          ))}
        </div>
        <p className="text-zinc-500 text-xs text-center">Toca para marcar vasos — Meta: 3.5–4 litros/día</p>
      </div>

      {/* Creatine */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Creatina monohidratada</p>
        <button
          onClick={() => updateTodayLog({ creatine: !todayLog.creatine })}
          className={`w-full flex items-center justify-between rounded-xl px-4 py-4 transition ${
            todayLog.creatine ? 'bg-green-900/30 border border-green-600/40' : 'bg-zinc-800 border border-zinc-700'
          }`}
        >
          <div>
            <p className={`font-bold ${todayLog.creatine ? 'text-green-300' : 'text-zinc-300'}`}>5g creatina</p>
            <p className="text-zinc-500 text-xs">Cualquier horario del día, con agua</p>
          </div>
          <span className={`text-2xl ${todayLog.creatine ? 'text-green-400' : 'text-zinc-600'}`}>
            {todayLog.creatine ? '✓' : '○'}
          </span>
        </button>
      </div>

      {/* Quick menu reference */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Menú referencia hoy</p>
        <div className="space-y-2 text-sm">
          {[
            { hora: '7:00', comida: 'Avena 100g + Whey 30g + plátano' },
            { hora: '10:30', comida: 'Shake whey + fruta' },
            { hora: '13:00', comida: 'Pollo 200g + arroz 150g + ensalada' },
            { hora: '17:30', comida: 'Pre-entreno — shake + banana' },
            { hora: '20:00', comida: 'Pollo/carne 180g + camote 150g + ensalada' },
          ].map(item => (
            <div key={item.hora} className="flex gap-3 items-start">
              <span className="text-cyan-400 font-mono text-xs w-10 shrink-0 pt-0.5">{item.hora}</span>
              <span className="text-zinc-300">{item.comida}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── PROGRESS TAB ───────────────────────────
  const ProgressTab = () => {
    const submitProgress = () => {
      const w = parseFloat(progressForm.weight);
      if (!w) return;
      const entry: ProgressEntry = {
        date: todayStr(),
        weight: w,
        waist: parseFloat(progressForm.waist) || undefined,
        chest: parseFloat(progressForm.chest) || undefined,
        arms: parseFloat(progressForm.arms) || undefined,
        notes: progressForm.notes || undefined,
      };
      const existing = progress.filter(p => p.date !== entry.date);
      saveProgress([...existing, entry].sort((a, b) => a.date.localeCompare(b.date)));
      setProgressForm({ weight: '', waist: '', chest: '', arms: '', notes: '' });
      setShowAddProgress(false);
    };

    const maxWeight = progress.length ? Math.max(...progress.map(p => p.weight)) : 80;
    const minWeight = progress.length ? Math.min(...progress.map(p => p.weight)) : 65;
    const range = maxWeight - minWeight || 10;

    return (
      <div className="space-y-4">
        {/* Add progress button */}
        {!showAddProgress ? (
          <button
            onClick={() => setShowAddProgress(true)}
            className="w-full bg-cyan-600 text-white rounded-2xl py-4 font-bold text-sm hover:bg-cyan-500 transition"
          >
            + Registrar peso y medidas de hoy
          </button>
        ) : (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-cyan-500/30 space-y-3">
            <p className="text-white font-bold text-sm">Nuevo registro — {formatDate(todayStr())}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'weight', label: 'Peso (kg) *', placeholder: 'ej. 75.0' },
                { key: 'waist', label: 'Cintura (cm)', placeholder: 'ej. 86' },
                { key: 'chest', label: 'Pecho (cm)', placeholder: 'ej. 98' },
                { key: 'arms', label: 'Brazo (cm)', placeholder: 'ej. 36' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-zinc-400 text-xs">{field.label}</label>
                  <input
                    type="number"
                    value={progressForm[field.key as keyof typeof progressForm]}
                    onChange={e => setProgressForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-zinc-800 text-white rounded-xl px-3 py-2 text-sm border border-zinc-700 focus:border-cyan-500 outline-none mt-1"
                  />
                </div>
              ))}
            </div>
            <textarea
              value={progressForm.notes}
              onChange={e => setProgressForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas opcionales (cómo te ves, energía, etc.)"
              rows={2}
              className="w-full bg-zinc-800 text-white rounded-xl px-3 py-2 text-sm border border-zinc-700 focus:border-cyan-500 outline-none resize-none"
            />
            <div className="flex gap-2">
              <button onClick={submitProgress} className="flex-1 bg-cyan-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-cyan-500">Guardar</button>
              <button onClick={() => setShowAddProgress(false)} className="flex-1 bg-zinc-800 text-zinc-400 rounded-xl py-2.5 text-sm">Cancelar</button>
            </div>
          </div>
        )}

        {/* Weight chart */}
        {progress.length >= 2 && (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Evolución de peso</p>
            <div className="flex items-end justify-between mb-2">
              <p className="text-white font-bold">{progress[progress.length - 1].weight} kg</p>
              <p className="text-zinc-400 text-xs">Meta: 70–72 kg</p>
            </div>
            {/* SVG chart */}
            <svg width="100%" height="80" viewBox={`0 0 ${Math.max(progress.length * 30, 300)} 80`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              {/* Goal line */}
              <line
                x1="0" y1={80 - ((71 - (minWeight - 2)) / (range + 4)) * 80}
                x2="100%" y2={80 - ((71 - (minWeight - 2)) / (range + 4)) * 80}
                stroke="#22c55e" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"
              />
              {/* Data line */}
              <polyline
                points={progress.map((p, i) => {
                  const x = (i / (progress.length - 1)) * 100 + '%';
                  const y = 80 - ((p.weight - (minWeight - 2)) / (range + 4)) * 76;
                  return `${(i / (progress.length - 1)) * 300},${y}`;
                }).join(' ')}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Dots */}
              {progress.map((p, i) => {
                const cx = (i / (progress.length - 1)) * 300;
                const cy = 80 - ((p.weight - (minWeight - 2)) / (range + 4)) * 76;
                return <circle key={i} cx={cx} cy={cy} r="3" fill="#06b6d4" />;
              })}
            </svg>
            <div className="flex justify-between text-zinc-500 text-xs mt-1">
              <span>{progress[0].date.slice(5)}</span>
              <span className="text-green-500">— Meta 71 kg</span>
              <span>{progress[progress.length - 1].date.slice(5)}</span>
            </div>
          </div>
        )}

        {/* Progress history */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Historial de registros</p>
          {progress.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">Aún no hay registros — empieza hoy</p>
          ) : (
            <div className="space-y-2">
              {[...progress].reverse().slice(0, 10).map((entry, i) => {
                const prev = i < progress.length - 1 ? progress[progress.length - 1 - i - 1] : null;
                const diff = prev ? entry.weight - prev.weight : 0;
                return (
                  <div key={entry.date} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{entry.date.slice(5).replace('-', '/')}</p>
                      {entry.waist && <p className="text-zinc-500 text-xs">Cintura: {entry.waist} cm{entry.arms ? ` · Brazos: ${entry.arms} cm` : ''}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{entry.weight} kg</p>
                      {prev && (
                        <p className={`text-xs font-medium ${diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                          {diff < 0 ? `↓ ${Math.abs(diff).toFixed(1)}` : diff > 0 ? `↑ ${diff.toFixed(1)}` : '—'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Targets */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Metas a 12 semanas</p>
          <div className="space-y-2 text-sm">
            {[
              { metric: 'Peso', current: '75 kg', target: '70–72 kg' },
              { metric: 'Grasa corporal', current: '~22%', target: '14–16%' },
              { metric: 'Cintura', current: '~86 cm', target: '79–82 cm' },
              { metric: 'Brazos', current: '~35 cm', target: '38–39 cm' },
              { metric: 'Bench press', current: '~70 kg', target: '90–100 kg' },
            ].map(item => (
              <div key={item.metric} className="flex items-center justify-between">
                <span className="text-zinc-400">{item.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300">{item.current}</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-cyan-400 font-medium">{item.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── SETTINGS TAB ───────────────────────────
  const SettingsTab = () => (
    <div className="space-y-4">
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Fecha de inicio del programa</p>
        <input
          type="date"
          value={startDate}
          onChange={e => {
            setStartDate(e.target.value);
            localStorage.setItem('fitness_start', e.target.value);
          }}
          className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm border border-zinc-700 focus:border-cyan-500 outline-none"
        />
        <p className="text-zinc-500 text-xs mt-2">Semana actual: {currentWeek} de 12 — {phase.label}</p>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Tu plan</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-zinc-400">Objetivo calórico</span><span className="text-white">2,200 kcal/día</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Proteína diaria</span><span className="text-cyan-400">{PROTEIN_GOAL}g</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Agua diaria</span><span className="text-white">{WATER_GOAL} vasos (3.5L)</span></div>
          <div className="flex justify-between"><span className="text-zinc-400">Creatina</span><span className="text-white">5g/día</span></div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Programa completo</p>
        <div className="space-y-3">
          {Object.entries(PROGRAM).map(([key, p]) => (
            <div key={key} className={`rounded-xl p-3 ${phaseKey === key ? 'bg-cyan-900/30 border border-cyan-600/40' : 'bg-zinc-800'}`}>
              <p className={`font-bold text-sm ${phaseKey === key ? 'text-cyan-300' : 'text-white'}`}>{p.phase}</p>
              <p className="text-zinc-400 text-xs">{p.label}</p>
              {phaseKey === key && <span className="inline-block mt-1 text-xs bg-cyan-600 text-white px-2 py-0.5 rounded-full">Fase actual</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Datos</p>
        <button
          onClick={() => {
            if (confirm('¿Borrar todos los datos? Esta acción no se puede deshacer.')) {
              localStorage.removeItem('fitness_logs');
              localStorage.removeItem('fitness_progress');
              localStorage.removeItem('fitness_start');
              setLogs({});
              setProgress([]);
              const start = todayStr();
              setStartDate(start);
              localStorage.setItem('fitness_start', start);
            }
          }}
          className="w-full bg-red-900/30 border border-red-600/30 text-red-400 rounded-xl py-3 text-sm hover:bg-red-900/50 transition"
        >
          Resetear todos los datos
        </button>
      </div>
    </div>
  );

  // ─── RENDER ─────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">QoriCash Fitness</p>
            <p className="text-white font-black text-lg leading-none">PLAN 12 SEMANAS</p>
          </div>
          <div className="text-right">
            <p className="text-cyan-400 font-bold text-sm">Sem. {currentWeek}/12</p>
            <p className="text-zinc-500 text-xs">{phase.label}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-4 pb-28">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'workout' && <WorkoutTab />}
        {tab === 'nutrition' && <NutritionTab />}
        {tab === 'progress' && <ProgressTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 z-50">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="grid grid-cols-5 gap-1">
            {[
              { key: 'dashboard', icon: '⊞', label: 'Hoy' },
              { key: 'workout', icon: '🏋️', label: 'Entreno' },
              { key: 'nutrition', icon: '🍽️', label: 'Nutrición' },
              { key: 'progress', icon: '📈', label: 'Progreso' },
              { key: 'settings', icon: '⚙️', label: 'Config' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition ${
                  tab === item.key ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs mt-0.5">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
