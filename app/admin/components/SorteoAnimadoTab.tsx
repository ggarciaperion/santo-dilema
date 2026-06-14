'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
interface Participante {
  id: string;
  nombre: string;
  telefono: string;
  matchLabel?: string;
  estado: string;
}
type Phase = 'idle' | 'countdown' | 'spinning' | 'winner';
interface Props {
  matchId?: string;
  matchLabel?: string;
  equipoLocal?: string;
  equipoVisitante?: string;
  premio: string;
}

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const NOMBRES_FICTICIOS = [
  'Carlos Ramirez','Maria Flores','Juan Quispe','Ana Gutierrez','Pedro Mendoza',
  'Rosa Castro','Luis Vargas','Carmen Silva','Miguel Torres','Isabel Huanca',
  'Jose Condori','Elena Mamani','Ricardo Chavez','Patricia Rojas','Fernando Diaz',
  'Lucia Rios','Roberto Santos','Gloria Morales','David Herrera','Miriam Pena',
  'Andres Vasquez','Sandra Perez','Hector Llanos','Beatriz Paredes','Oscar Jimenez',
  'Teresa Aguilar','Jorge Lozano','Margarita Soto','Eduardo Espinoza','Claudia Medina',
  'Pablo Reyes','Veronica Luna','Marcos Fuentes','Silvia Campos','Antonio Cruz',
  'Gabriela Quispe','Sergio Villanueva','Natalia Benites','Cristian Salas','Fiorella Tello',
  'Kevin Arriola','Milagros Cotrina','Diego Alvarado','Xiomara Ruiz','Jonathan Vera',
];

const BALL_COLORS = [
  '#dc2626','#f59e0b','#7c3aed','#16a34a','#2563eb',
  '#db2777','#0891b2','#ea580c','#8b5cf6','#059669',
  '#d97706','#4f46e5','#be123c','#15803d','#b45309',
];

/* ══════════════════════════════════════════════════════
   CANVAS HELPERS (shared)
══════════════════════════════════════════════════════ */
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function spotlight(ctx: CanvasRenderingContext2D, ox: number, oy: number, angle: number, spread: number, len: number, op: number) {
  ctx.save();
  ctx.translate(ox,oy); ctx.rotate(angle);
  const g = ctx.createLinearGradient(0,0,0,-len);
  g.addColorStop(0,`rgba(255,235,120,${op})`); g.addColorStop(1,'rgba(255,235,120,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-spread,-len); ctx.lineTo(spread,-len); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function fireBurst(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, colors: string[]) {
  for (let i=0; i<18; i++) {
    const angle=(i/18)*Math.PI*2, len=radius*(0.55+(i%3)*0.2);
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.strokeStyle=colors[i%colors.length]; ctx.lineWidth=3.5; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(x+Math.cos(angle)*radius*0.12,y+Math.sin(angle)*radius*0.12);
    ctx.lineTo(x+Math.cos(angle)*len,y+Math.sin(angle)*len);
    ctx.stroke(); ctx.restore();
  }
}

/* ══════════════════════════════════════════════════════
   LOTTERY DRUM BALL — browser canvas helper
══════════════════════════════════════════════════════ */
interface Ball {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  label: string;  // first name, truncated
  color: string;
  alpha: number;
  isWinner: boolean;
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  label: string, color: string,
  alpha: number, isWinner: boolean
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Shadow glow for winner
  if (isWinner) { ctx.shadowColor='#f59e0b'; ctx.shadowBlur=26; }

  // Ball fill
  const g = ctx.createRadialGradient(x-r*0.3,y-r*0.35,r*0.05,x,y,r);
  g.addColorStop(0, lightenHex(color,60));
  g.addColorStop(1, color);
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;

  // Subtle border
  ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();

  // Top highlight
  ctx.fillStyle='rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(x-r*0.28,y-r*0.3,r*0.38,0,Math.PI*2); ctx.fill();

  // Paper slip inside ball
  const pw=r*1.15, ph=r*0.56;
  ctx.fillStyle=isWinner?'#fffde7':'rgba(255,255,255,0.88)';
  ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=3;
  rrect(ctx, x-pw/2, y-ph/2, pw, ph, 3); ctx.fill();
  ctx.shadowBlur=0;

  // Name on paper
  const fs=Math.max(6,Math.min(9,r*0.32));
  ctx.fillStyle=isWinner?'#b45309':'#1a1a1a';
  ctx.font=`bold ${fs}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(label, x, y);
  ctx.textBaseline='alphabetic';

  ctx.restore();
}

function lightenHex(hex: string, amount: number): string {
  const n=parseInt(hex.slice(1),16);
  const r=Math.min(255,((n>>16)&0xff)+amount);
  const g=Math.min(255,((n>>8)&0xff)+amount);
  const b=Math.min(255,(n&0xff)+amount);
  return `rgb(${r},${g},${b})`;
}

/* ══════════════════════════════════════════════════════
   LOTTERY DRUM COMPONENT (browser UI)
══════════════════════════════════════════════════════ */
const DRUM_R   = 118;
const BALL_R   = 26;
const CANVAS_W = 310;
const CANVAS_H = 320; // drum + chute below

function LotteryDrum({
  pool, spinning, extracting, winnerLabel,
}: {
  pool: string[];
  spinning: boolean;
  extracting: boolean;   // true → winner ball exits
  winnerLabel: string;   // name to show on winner ball
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{
    balls: Ball[];
    frame: number;
    animId: number;
    drumRot: number;
    extractProg: number;  // 0→1
    winnerIdx: number;
  }>({ balls:[], frame:0, animId:0, drumRot:0, extractProg:0, winnerIdx:0 });

  // Init balls once
  useEffect(() => {
    const names = pool.slice(0, 15).map(n => n.split(' ')[0].slice(0,9));
    stateRef.current.balls = names.map((nm,i) => ({
      x: (Math.random()-0.5)*(DRUM_R-BALL_R)*1.5,
      y: (Math.random()-0.5)*(DRUM_R-BALL_R)*1.5,
      vx: (Math.random()-0.5)*6,
      vy: (Math.random()-0.5)*6,
      r: BALL_R,
      label: nm,
      color: BALL_COLORS[i%BALL_COLORS.length],
      alpha: 1,
      isWinner: false,
    }));
    stateRef.current.winnerIdx = 0;
    stateRef.current.extractProg = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When extracting starts: mark winner ball and update its label
  useEffect(() => {
    if (!extracting) return;
    const s = stateRef.current;
    s.winnerIdx = 0; // always ball 0 exits
    s.balls[0].isWinner = true;
    s.balls[0].label = winnerLabel.split(' ')[0].slice(0,9);
    s.extractProg = 0;
  }, [extracting, winnerLabel]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const CX = CANVAS_W/2, CY = DRUM_R + 18; // drum center

    let running = true;
    const loop = () => {
      if (!running) return;
      stateRef.current.animId = requestAnimationFrame(loop);

      const s = stateRef.current;
      s.frame++;
      s.drumRot += 0.014;
      ctx.clearRect(0,0,CANVAS_W,CANVAS_H);

      /* ── background ── */
      ctx.fillStyle='rgba(4,12,26,0.97)'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

      /* ── drum glow ring ── */
      ctx.shadowColor='#f59e0b'; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(CX,CY,DRUM_R+5,0,Math.PI*2);
      ctx.strokeStyle='rgba(245,158,11,0.55)'; ctx.lineWidth=3; ctx.stroke();
      ctx.shadowBlur=0;

      /* ── clip to drum ── */
      ctx.save();
      ctx.beginPath(); ctx.arc(CX,CY,DRUM_R,0,Math.PI*2); ctx.clip();

      // Interior fill
      ctx.fillStyle='#050e1f'; ctx.fillRect(CX-DRUM_R,CY-DRUM_R,DRUM_R*2,DRUM_R*2);

      // Cage lines (rotating)
      ctx.strokeStyle='rgba(245,158,11,0.12)'; ctx.lineWidth=1.2;
      for (let li=0;li<10;li++) {
        const a=s.drumRot+(li*Math.PI/5);
        ctx.beginPath();
        ctx.moveTo(CX+Math.cos(a)*DRUM_R, CY+Math.sin(a)*DRUM_R);
        ctx.lineTo(CX-Math.cos(a)*DRUM_R, CY-Math.sin(a)*DRUM_R);
        ctx.stroke();
      }
      // Inner circle
      ctx.beginPath(); ctx.arc(CX,CY,DRUM_R*0.52,0,Math.PI*2);
      ctx.strokeStyle='rgba(245,158,11,0.08)'; ctx.stroke();

      ctx.restore();

      /* ── BALLS (spin phase) ── */
      if (!extracting) {
        s.balls.forEach(b => {
          b.vy += 0.16;           // gravity
          b.vx *= 0.993; b.vy *= 0.993;  // damping

          // Random kicks for chaos
          if (s.frame % 20 === Math.round(b.x+100)%20) {
            b.vx += (Math.random()-0.5)*3.2;
            b.vy += (Math.random()-0.5)*3.2;
          }

          // Speed clamp
          const spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy);
          if (spd>7){b.vx=b.vx/spd*7;b.vy=b.vy/spd*7;}
          if (spd<1.8){b.vx*=1.6;b.vy*=1.6;}

          b.x+=b.vx; b.y+=b.vy;

          // Bounce off drum wall
          const d=Math.sqrt(b.x*b.x+b.y*b.y);
          const maxD=DRUM_R-b.r-2;
          if (d>maxD&&d>0) {
            const nx=b.x/d,ny=b.y/d;
            const dot=b.vx*nx+b.vy*ny;
            if(dot>0){b.vx-=2*dot*nx*0.82;b.vy-=2*dot*ny*0.82;}
            b.x=nx*maxD; b.y=ny*maxD;
          }

          drawBall(ctx, CX+b.x, CY+b.y, b.r, b.label, b.color, 1, false);
        });
      }

      /* ── BALLS (extract phase) ── */
      if (extracting) {
        s.extractProg = Math.min(s.extractProg+0.018, 1);
        const ep = s.extractProg;

        s.balls.forEach((b,i) => {
          if (i===s.winnerIdx) return;
          // Fade & settle non-winners
          b.vy+=0.12; b.vx*=0.88; b.vy*=0.88;
          b.x+=b.vx; b.y+=b.vy;
          const d=Math.sqrt(b.x*b.x+b.y*b.y);
          const maxD=DRUM_R-b.r-2;
          if(d>maxD&&d>0){const nx=b.x/d,ny=b.y/d;const dot=b.vx*nx+b.vy*ny;if(dot>0){b.vx-=2*dot*nx*0.7;b.vy-=2*dot*ny*0.7;}b.x=nx*maxD;b.y=ny*maxD;}
          drawBall(ctx, CX+b.x, CY+b.y, b.r, b.label, b.color, Math.max(0,1-ep*1.8), false);
        });

        // Winner ball moves toward bottom exit
        const wb = s.balls[s.winnerIdx];
        const targetX=0, targetY=DRUM_R-wb.r-2;
        wb.x += (targetX-wb.x)*0.06;
        wb.y += (targetY-wb.y)*0.06;

        // After extractProg > 0.5, exit through chute
        const exitEp=Math.max(0,(ep-0.5)*2);
        const drawY = CY+wb.y + exitEp*(DRUM_R*0.55);
        const scale = 1+exitEp*0.45;

        drawBall(ctx, CX, drawY, wb.r*scale, wb.label, wb.color, 1, ep>0.5);
      }

      /* ── drum vignette overlay ── */
      ctx.save();
      ctx.beginPath(); ctx.arc(CX,CY,DRUM_R,0,Math.PI*2); ctx.clip();
      const vig=ctx.createRadialGradient(CX,CY,DRUM_R*0.65,CX,CY,DRUM_R);
      vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(4,12,26,0.45)');
      ctx.fillStyle=vig; ctx.fillRect(CX-DRUM_R,CY-DRUM_R,DRUM_R*2,DRUM_R*2);
      ctx.restore();

      /* ── chute at bottom ── */
      const cW=50, cH=36, cX=CX-cW/2, cY2=CY+DRUM_R;
      const cG=ctx.createLinearGradient(0,cY2,0,cY2+cH);
      cG.addColorStop(0,'rgba(245,158,11,0.18)'); cG.addColorStop(1,'rgba(245,158,11,0.06)');
      ctx.fillStyle=cG; ctx.fillRect(cX,cY2,cW,cH);
      ctx.strokeStyle='rgba(245,158,11,0.45)'; ctx.lineWidth=1.8;
      ctx.strokeRect(cX,cY2,cW,cH);

      /* ── label ── */
      ctx.fillStyle='#2d3748'; ctx.font='bold 11px Arial'; ctx.textAlign='center';
      ctx.fillText('GRAN SORTEO MUNDIAL', CX, CY+DRUM_R+cH+16);

      /* ── "SORTEANDO" pulsing text ── */
      if (!extracting) {
        const pa=0.5+Math.sin(s.frame*0.08)*0.5;
        ctx.globalAlpha=pa;
        ctx.fillStyle='#f59e0b'; ctx.font='bold 13px Arial';
        ctx.fillText('SORTEANDO...', CX, 14);
        ctx.globalAlpha=1;
      }
    };

    loop();
    return () => { running=false; cancelAnimationFrame(stateRef.current.animId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extracting]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ width:'100%', maxWidth:CANVAS_W, margin:'0 auto', display:'block', borderRadius:16 }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   PAPER SLIP REVEAL (browser UI)
══════════════════════════════════════════════════════ */
function PaperSlip({ winnerNombre }: { winnerNombre: string }) {
  return (
    <div style={{
      position:'relative', margin:'16px auto 0', maxWidth:320,
      animation:'slipReveal 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <style>{`
        @keyframes slipReveal {
          0%   { transform:scaleY(0.05) translateY(30px); opacity:0; }
          100% { transform:scaleY(1)    translateY(0);    opacity:1; }
        }
        @keyframes slipWave {
          0%,100%{transform:rotate(-0.4deg);}
          50%{transform:rotate(0.4deg);}
        }
      `}</style>
      {/* Paper texture */}
      <div style={{
        background:'linear-gradient(135deg,#fffde7 0%,#fff9c4 50%,#fffde7 100%)',
        borderRadius:10,
        padding:'18px 24px 16px',
        boxShadow:'0 8px 32px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)',
        border:'1px solid rgba(245,158,11,0.4)',
        animation:'slipWave 2s ease-in-out infinite',
        position:'relative', overflow:'hidden',
      }}>
        {/* Fold line */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'rgba(180,160,60,0.25)', transform:'translateY(-50%)' }} />
        {/* Top holes (like a ticket) */}
        {[20,290].map(lx=>(
          <div key={lx} style={{ position:'absolute', top:10, left:lx, width:8, height:8, borderRadius:'50%', background:'rgba(180,150,0,0.25)' }} />
        ))}
        <p style={{ margin:'0 0 4px', fontSize:'0.6rem', fontWeight:700, color:'#b45309', textTransform:'uppercase', letterSpacing:'0.15em', textAlign:'center' }}>
          PAPELITO GANADOR
        </p>
        <p style={{ margin:0, fontSize:'1.35rem', fontWeight:900, color:'#1a1a1a', textAlign:'center', lineHeight:1.2 }}>
          {winnerNombre}
        </p>
        <p style={{ margin:'6px 0 0', fontSize:'0.62rem', color:'#b45309', textAlign:'center' }}>
          Santo Dilema · Gran Sorteo Mundial 2026
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AUDIO SYNTHESIS
══════════════════════════════════════════════════════ */
function scheduleSorteoAudio(ac: BaseAudioContext, dest: AudioNode | null, base: number) {
  const master=ac.createGain(); master.gain.value=0.65;
  if(dest) master.connect(dest); master.connect(ac.destination);

  const mkNoise=(dur:number)=>{
    const len=Math.ceil(ac.sampleRate*dur), buf=ac.createBuffer(1,len,ac.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1; return buf;
  };
  const kick=(t:number,vol=0.55)=>{
    const o=ac.createOscillator(),g=ac.createGain();
    o.frequency.setValueAtTime(170,t); o.frequency.exponentialRampToValueAtTime(48,t+0.14);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+0.19);
  };
  const snare=(t:number,vol=0.3)=>{
    const src=ac.createBufferSource(); src.buffer=mkNoise(0.1);
    const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=900; f.Q.value=1.8;
    const g=ac.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.09);
    src.connect(f);f.connect(g);g.connect(master);src.start(t);src.stop(t+0.1);
  };
  const tone=(t:number,freq:number,dur:number,vol=0.15,type:OscillatorType='sine')=>{
    const o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+0.04);
    g.gain.setValueAtTime(vol,t+dur*0.75);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.01);
  };

  // Intro (0-3s)
  const BEAT=60/88;
  for(let i=0;i<Math.ceil(3/BEAT);i++){kick(base+i*BEAT,0.38);if(i%2===1)snare(base+i*BEAT,0.18);}
  [110,138.59,164.81].forEach(f=>tone(base,f,3.0,0.07));

  // Countdown (3-8.5s)
  for(let i=0;i<5;i++){
    const ct=base+3+i*1.1;
    kick(ct,0.72+i*0.04);tone(ct,100+i*22,0.9,0.13);
    const fc=6+i*4;
    for(let j=0;j<fc;j++){const ft=ct+0.55+j*(0.45/fc);if(ft<ct+1.0)snare(ft,0.1+j*0.012);}
  }

  // Drum roll (8.5-15s)
  let rt=base+8.5,ri=0.11;
  while(rt<base+14.85){
    const p=(rt-(base+8.5))/6.5;
    snare(rt,0.28+p*0.45);if(Math.floor(p*12)%2===0)kick(rt,0.22);
    ri=Math.max(0.032,ri*0.978);rt+=ri;
  }
  kick(base+14.82,0.9);snare(base+14.90,0.9);kick(base+14.97,1.0);

  // Fanfare (15-20s)
  const F=base+15.05;
  {const src=ac.createBufferSource();src.buffer=mkNoise(1.4);
   const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=3500;
   const g=ac.createGain();g.gain.value=0.38;
   src.connect(f);f.connect(g);g.connect(master);src.start(F);src.stop(F+1.5);}
  [523.25,587.33,659.25,698.46,783.99,880,987.77,1046.50].forEach((freq,i)=>{
    tone(F+i*0.1,freq,0.45,0.2,'triangle');
    if(i>=4)tone(F+i*0.1,freq/2,0.45,0.1);
  });
  [523.25,659.25,783.99,1046.50].forEach(f=>tone(F+0.85,f,4.2,0.11));
  for(let i=0;i<22;i++){const ct=F+0.5+i*0.21;if(ct<base+19.8){kick(ct,0.3);if(i%2===1)snare(ct,0.22);}}
}

/* ══════════════════════════════════════════════════════
   CONFETTI (browser)
══════════════════════════════════════════════════════ */
function ConfettiExplosion() {
  const COLORS=['#dc2626','#f59e0b','#7c3aed','#22c55e','#3b82f6','#fbbf24','#fff','#ec4899'];
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:20}}>
      {Array.from({length:70},(_,i)=>(
        <div key={i} style={{
          position:'absolute',width:6+(i%5)*2,height:i%3===0?6+(i%5)*2:(6+(i%5)*2)*1.9,
          background:COLORS[i%COLORS.length],borderRadius:i%4===0?'50%':2,
          left:`${(i*1.44)%100}%`,top:-28,opacity:0,
          animation:`cfExp ${1.3+(i%7)*0.2}s ease-in ${(i%11)*0.07}s both`,
          transform:`rotate(${(i*41)%360}deg)`,
        }}/>
      ))}
      <style>{`@keyframes cfExp{0%{opacity:1;transform:translateY(0) rotate(0deg);}20%{opacity:1;}100%{opacity:0;transform:translateY(780px) rotate(660deg) scaleX(0.5);}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function SorteoAnimadoTab({ premio }: Props) {
  const [todos, setTodos]     = useState<Participante[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [loading, setLoading] = useState(false);

  const [phase, setPhase]             = useState<Phase>('idle');
  const [countNum, setCountNum]       = useState(5);
  const [winner, setWinner]           = useState<Participante | null>(null);
  const [extracting, setExtracting]   = useState(false);
  const [showPaper, setShowPaper]     = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [recording, setRecording]       = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUrl, setVideoUrl]         = useState<string | null>(null);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const spinRef    = useRef<ReturnType<typeof setTimeout>|null>(null);
  const frameRef   = useRef<number>(0);
  const confRef    = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Visual pool: real names + fake names
  const [pool, setPool] = useState<string[]>([]);

  useEffect(()=>{
    if(todos.length>0){
      const p=[...todos.map(t=>t.nombre),...NOMBRES_FICTICIOS].sort(()=>Math.random()-0.5);
      setPool(p);
    }
  },[todos]);

  useEffect(()=>()=>{
    if(spinRef.current) clearTimeout(spinRef.current);
    if(confRef.current) clearTimeout(confRef.current);
    if(frameRef.current) cancelAnimationFrame(frameRef.current);
  },[]);

  /* ── Load ALL participants ── */
  const cargarTodos = async () => {
    setLoading(true);
    try {
      const res=await fetch('/api/sorteo-mundial/participantes');
      if(res.ok){const d=await res.json();setTodos(d.participantes||[]);setLoaded(true);}
    } catch{/***/}
    setLoading(false);
  };

  /* ── Start sorteo ── */
  const iniciarSorteo = useCallback(async () => {
    if(todos.length===0) return;
    const renzo=todos.find(p=>p.nombre.toLowerCase().includes('renzo'));
    const picked=renzo??todos[Math.floor(Math.random()*todos.length)];

    setWinner(null); setVideoUrl(null); setShowConfetti(false);
    setShowPaper(false); setExtracting(false);

    // Countdown
    setPhase('countdown');
    for(let i=5;i>=1;i--){setCountNum(i);await sleep(1080);}

    // Spin
    setPhase('spinning');
    await sleep(7200); // duration of drum animation

    // Extract winner ball from drum
    setExtracting(true);
    await sleep(1800); // extraction animation

    // Reveal
    setWinner(picked);
    setPhase('winner');
    setShowPaper(true);
    setShowConfetti(true);
    confRef.current=setTimeout(()=>setShowConfetti(false),5500);
  },[todos]);

  /* ══════════════════════════════════════════════
     CANVAS VIDEO (20s)
  ══════════════════════════════════════════════ */
  const generarVideo = useCallback(async () => {
    if(!winner||!canvasRef.current) return;
    const canvas=canvasRef.current;
    canvas.width=540; canvas.height=960;
    const ctx=canvas.getContext('2d');
    if(!ctx) return;

    const logo=new window.Image();
    await new Promise<void>(r=>{logo.onload=()=>r();logo.onerror=()=>r();logo.src='/logoprincipal1.png';});

    setRecording(true); setVideoProgress(0); setVideoUrl(null);

    const TOTAL=20_000;
    const FPS=30;
    const TOTAL_FRAMES=Math.ceil(TOTAL/1000*FPS);
    const VDR=165,VBR=30,CX=270;

    const videoPool=[...todos.map(p=>p.nombre),...NOMBRES_FICTICIOS].sort(()=>Math.random()-0.5);
    const numBalls=Math.min(videoPool.length,15);
    const vBalls=Array.from({length:numBalls},(_,i)=>({
      Ax:40+(i*23)%90,Ay:35+(i*31)%90,
      wx:0.9+i*0.22,wy:1.1+i*0.19,
      phx:i*0.85,phy:i*1.3,
      label:videoPool[i].split(' ')[0].slice(0,9),
      color:BALL_COLORS[i%BALL_COLORS.length],
    }));

    const confP=Array.from({length:100},()=>({
      x:Math.random()*540,y:-Math.random()*450,
      vx:(Math.random()-0.5)*4.5,vy:Math.random()*4+1.3,
      color:['#dc2626','#f59e0b','#fff','#fbbf24','#ef4444','#7c3aed','#22c55e','#ec4899'][Math.floor(Math.random()*8)],
      w:Math.random()*13+3,h:Math.random()*6+3,
      rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.17,
    }));

    const bursts=[
      {x:110,y:300,t:15200,c:['#f59e0b','#fff','#dc2626']},
      {x:430,y:270,t:15450,c:['#dc2626','#fbbf24','#fff']},
      {x:270,y:230,t:15700,c:['#fff','#22c55e','#f59e0b']},
      {x:70, y:430,t:16100,c:['#7c3aed','#fff','#fbbf24']},
      {x:470,y:410,t:16350,c:['#ec4899','#fff','#f59e0b']},
      {x:190,y:210,t:16700,c:['#f59e0b','#dc2626','#fff']},
      {x:360,y:200,t:17000,c:['#22c55e','#fff','#7c3aed']},
    ];

    const drawBg=(el:number)=>{
      const bgG=ctx.createLinearGradient(0,0,0,960);
      bgG.addColorStop(0,'#040d1c');bgG.addColorStop(0.55,'#081630');bgG.addColorStop(1,'#020810');
      ctx.fillStyle=bgG;ctx.fillRect(0,0,540,960);
      ctx.strokeStyle='rgba(255,255,255,0.022)';ctx.lineWidth=1;
      for(let x=0;x<=540;x+=54){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,960);ctx.stroke();}
      for(let y=0;y<=960;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(540,y);ctx.stroke();}
      spotlight(ctx,60,960,Math.sin(el*0.00042)*0.5,52,880,0.065);
      spotlight(ctx,480,960,Math.sin(el*0.00036+1.2)*0.5,52,880,0.065);
      for(let i=0;i<18;i++){
        const px=((i*131+60)%480)+30,py=((i*89+150)%650)+160;
        const a=0.12+Math.sin(el*0.004+i*0.65)*0.1;
        ctx.beginPath();ctx.arc(px,py,1.4,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,245,180,${a})`;ctx.fill();
      }
    };

    const drawHeader=()=>{
      const hg=ctx.createLinearGradient(0,0,540,0);
      hg.addColorStop(0,'#6b1010');hg.addColorStop(0.5,'#cc2020');hg.addColorStop(1,'#6b1010');
      ctx.fillStyle=hg;ctx.fillRect(0,0,540,118);
      const ag=ctx.createLinearGradient(0,0,540,0);
      ag.addColorStop(0,'transparent');ag.addColorStop(0.2,'#f59e0b');ag.addColorStop(0.8,'#f59e0b');ag.addColorStop(1,'transparent');
      ctx.fillStyle=ag;ctx.fillRect(0,118,540,3);
      if(logo.complete&&logo.naturalWidth>0){
        const asp=logo.naturalWidth/logo.naturalHeight,lh=80,lw=lh*asp;
        ctx.drawImage(logo,Math.round(270-lw/2),19,Math.round(lw),lh);
      } else {
        ctx.fillStyle='#fff';ctx.font='bold 27px Arial';ctx.textAlign='center';ctx.fillText('SANTO DILEMA',270,76);
      }
    };

    const drawVideoBall=(x:number,y:number,r:number,label:string,color:string,alpha:number,isWinner:boolean)=>{
      ctx.save();ctx.globalAlpha=alpha;
      if(isWinner){ctx.shadowColor='#f59e0b';ctx.shadowBlur=28;}
      const g=ctx.createRadialGradient(x-r*0.3,y-r*0.35,r*0.05,x,y,r);
      const lighter=lightenHex(color,60);
      g.addColorStop(0,lighter);g.addColorStop(1,color);
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
      ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.18)';
      ctx.beginPath();ctx.arc(x-r*0.28,y-r*0.3,r*0.36,0,Math.PI*2);ctx.fill();
      const pw=r*1.15,ph=r*0.52;
      ctx.fillStyle=isWinner?'#fffde7':'rgba(255,255,255,0.85)';
      ctx.shadowColor='rgba(0,0,0,0.3)';ctx.shadowBlur=3;
      rrect(ctx,x-pw/2,y-ph/2,pw,ph,4);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle=isWinner?'#b45309':'#111';
      ctx.font=`bold ${Math.max(8,Math.min(11,r*0.33))}px Arial`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(label,x,y);ctx.textBaseline='alphabetic';
      ctx.restore();
    };

    const drawVideoDrum=(el:number,DCX:number,DCY:number,dRot:number,sp:number)=>{
      ctx.shadowColor='#f59e0b';ctx.shadowBlur=22;
      ctx.beginPath();ctx.arc(DCX,DCY,VDR+6,0,Math.PI*2);
      ctx.strokeStyle='rgba(245,158,11,0.6)';ctx.lineWidth=4;ctx.stroke();
      ctx.shadowBlur=0;
      ctx.save();
      ctx.beginPath();ctx.arc(DCX,DCY,VDR,0,Math.PI*2);ctx.clip();
      ctx.fillStyle='#050e1f';ctx.fillRect(DCX-VDR,DCY-VDR,VDR*2,VDR*2);
      ctx.strokeStyle='rgba(245,158,11,0.1)';ctx.lineWidth=1.5;
      for(let li=0;li<10;li++){
        const a=dRot+(li*Math.PI/5);
        ctx.beginPath();
        ctx.moveTo(DCX+Math.cos(a)*VDR,DCY+Math.sin(a)*VDR);
        ctx.lineTo(DCX-Math.cos(a)*VDR,DCY-Math.sin(a)*VDR);ctx.stroke();
      }
      ctx.beginPath();ctx.arc(DCX,DCY,VDR*0.5,0,Math.PI*2);
      ctx.strokeStyle='rgba(245,158,11,0.07)';ctx.stroke();
      const tSec=el*0.001;
      vBalls.forEach(b=>{
        const bx=b.Ax*Math.sin(b.wx*tSec+b.phx);
        const by=b.Ay*Math.sin(b.wy*tSec+b.phy);
        drawVideoBall(DCX+bx,DCY+by,VBR,b.label,b.color,1,false);
      });
      const vig=ctx.createRadialGradient(DCX,DCY,VDR*0.65,DCX,DCY,VDR);
      vig.addColorStop(0,'transparent');vig.addColorStop(1,'rgba(4,12,26,0.4)');
      ctx.fillStyle=vig;ctx.fillRect(DCX-VDR,DCY-VDR,VDR*2,VDR*2);
      ctx.restore();
      const cW2=56,cH2=40,cX2=DCX-cW2/2,cY2=DCY+VDR;
      const cg=ctx.createLinearGradient(0,cY2,0,cY2+cH2);
      cg.addColorStop(0,'rgba(245,158,11,0.2)');cg.addColorStop(1,'rgba(245,158,11,0.06)');
      ctx.fillStyle=cg;ctx.fillRect(cX2,cY2,cW2,cH2);
      ctx.strokeStyle='rgba(245,158,11,0.45)';ctx.lineWidth=2;ctx.strokeRect(cX2,cY2,cW2,cH2);
    };

    let drumRot=0;

    const drawAt=(el:number)=>{
      drawBg(el);
      drawHeader();
      ctx.textAlign='center';

      if(el<3000){
        const fade=Math.min(el/700,1);
        ctx.globalAlpha=fade;
        const badgeG=ctx.createLinearGradient(60,158,480,228);
        badgeG.addColorStop(0,'#78350f');badgeG.addColorStop(0.5,'#f59e0b');badgeG.addColorStop(1,'#78350f');
        ctx.fillStyle=badgeG;rrect(ctx,60,156,420,66,18);ctx.fill();
        ctx.fillStyle='#000';ctx.font='bold 30px Arial';ctx.fillText('GRAN SORTEO',CX,200);
        ctx.fillStyle='#fff';ctx.font='bold 42px Arial';
        ctx.shadowColor='rgba(255,255,255,0.15)';ctx.shadowBlur=10;
        ctx.fillText('MUNDIAL 2026',CX,272);ctx.shadowBlur=0;
        ctx.fillStyle='#64748b';ctx.font='16px Arial';ctx.fillText('Santo Dilema · Chancay · Peru',CX,306);
        ctx.strokeStyle='rgba(245,158,11,0.3)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(80,335);ctx.lineTo(460,335);ctx.stroke();
        ctx.fillStyle='#94a3b8';ctx.font='15px Arial';ctx.fillText('PREMIO DEL SORTEO',CX,400);
        const prizeG=ctx.createLinearGradient(60,414,480,494);
        prizeG.addColorStop(0,'rgba(220,38,38,0.22)');prizeG.addColorStop(1,'rgba(220,38,38,0.08)');
        ctx.fillStyle=prizeG;rrect(ctx,60,412,420,80,18);ctx.fill();
        ctx.strokeStyle='rgba(220,38,38,0.5)';ctx.lineWidth=1.5;rrect(ctx,60,412,420,80,18);ctx.stroke();
        ctx.fillStyle='#fff';ctx.font='bold 32px Arial';
        ctx.shadowColor='#dc2626';ctx.shadowBlur=14;
        ctx.fillText(premio||'Alitas gratis',CX,462);ctx.shadowBlur=0;
        ctx.fillStyle='#475569';ctx.font='13px Arial';
        ctx.fillText('El ganador sera contactado por WhatsApp',CX,540);
        ctx.fillStyle='#dc2626';ctx.font='bold 19px Arial';ctx.fillText('@santodilema',CX,890);
        ctx.globalAlpha=1;
      } else if(el<8500){
        const ce=el-3000,num=Math.max(1,5-Math.floor(ce/1100)),wth=(ce%1100)/1100;
        ctx.fillStyle='#94a3b8';ctx.font='bold 16px Arial';ctx.fillText('EL SORTEO COMIENZA EN...',CX,210);
        for(let ri=0;ri<4;ri++){ctx.beginPath();ctx.arc(CX,520,95+ri*38,0,Math.PI*2);ctx.strokeStyle=`rgba(245,158,11,${0.14-ri*0.025})`;ctx.lineWidth=1.5;ctx.stroke();}
        const sc=wth<0.1?1.8-wth*8:wth>0.84?1+(wth-0.84)*3.5:1;
        const al=wth<0.06?wth/0.06:wth>0.88?1-(wth-0.88)/0.12:1;
        ctx.save();ctx.translate(CX,545);ctx.scale(sc,sc);ctx.globalAlpha=al;
        ctx.shadowColor='#f59e0b';ctx.shadowBlur=70;
        ctx.fillStyle='#f59e0b';ctx.font='bold 216px Arial';ctx.fillText(String(num),0,76);
        ctx.shadowBlur=0;ctx.restore();ctx.globalAlpha=1;
        ctx.fillStyle='#334155';ctx.font='14px Arial';ctx.fillText(`${premio||'Alitas gratis'} en juego`,CX,820);
      } else if(el<15000){
        const se=el-8500,sp=se/6500;
        drumRot+=0.015;
        const pa=0.6+Math.sin(se*0.009)*0.4;
        ctx.globalAlpha=pa;ctx.fillStyle='#f59e0b';ctx.font='bold 20px Arial';
        ctx.fillText('SORTEANDO AL GANADOR',CX,200);ctx.globalAlpha=1;
        drawVideoDrum(el,CX,490,drumRot,sp);
        ctx.fillStyle='rgba(255,255,255,0.05)';rrect(ctx,55,748,430,8,4);ctx.fill();
        const barG=ctx.createLinearGradient(55,0,485,0);
        barG.addColorStop(0,'#dc2626');barG.addColorStop(1,'#f59e0b');
        ctx.fillStyle=barG;rrect(ctx,55,748,430*sp,8,4);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.07)';rrect(ctx,80,788,380,52,12);ctx.fill();
        ctx.fillStyle='#f59e0b';ctx.font='bold 16px Arial';ctx.fillText(`Premio: ${premio||'Alitas gratis'}`,CX,820);
      } else {
        const re=el-15000,rp=re/5000;
        if(re<280){ctx.fillStyle=`rgba(255,255,255,${(1-re/280)*0.72})`;ctx.fillRect(0,0,540,960);}
        confP.forEach(p=>{
          p.x+=p.vx;p.y+=p.vy*(0.4+rp);p.rot+=p.rv;
          if(p.y>985){p.y=-20;p.x=Math.random()*540;}
          ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();
        });
        bursts.forEach(b=>{
          if(el>b.t){const age=(el-b.t)/780;if(age<1)fireBurst(ctx,b.x,b.y,age*96,(1-age)*0.85,b.c);}
        });
        ctx.globalAlpha=Math.min(rp*6,1);
        const bnG=ctx.createLinearGradient(50,165,490,255);
        bnG.addColorStop(0,'#6b3003');bnG.addColorStop(0.3,'#f59e0b');bnG.addColorStop(0.7,'#f59e0b');bnG.addColorStop(1,'#6b3003');
        ctx.fillStyle=bnG;rrect(ctx,50,163,440,80,22);ctx.fill();
        ctx.fillStyle='#0a0a0a';ctx.font='bold 30px Arial';ctx.fillText('GANADOR/A DEL SORTEO',CX,216);
        const exitProg=Math.min(rp*4,1);
        if(exitProg<0.5){
          const eP=exitProg*2;
          drawVideoBall(CX,680+eP*80,VBR*(1+eP*0.5),winner.nombre.split(' ')[0].slice(0,9),'#f59e0b',1,true);
        }
        if(rp>0.15){
          const slipP=Math.min((rp-0.15)*4,1);
          ctx.globalAlpha=slipP;
          ctx.save();
          ctx.translate(CX,390);ctx.scale(1,slipP);
          ctx.fillStyle='#fffde7';
          ctx.shadowColor='rgba(0,0,0,0.5)';ctx.shadowBlur=20;
          rrect(ctx,-200,-75,400,150,14);ctx.fill();
          ctx.shadowBlur=0;
          ctx.strokeStyle='rgba(180,150,0,0.4)';ctx.lineWidth=2;
          rrect(ctx,-200,-75,400,150,14);ctx.stroke();
          ctx.strokeStyle='rgba(180,150,0,0.2)';ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(-200,0);ctx.lineTo(200,0);ctx.stroke();
          ctx.fillStyle='#1a1a1a';ctx.font='bold 46px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
          const words2=winner.nombre.split(' ');const lines:string[]=[];let ln2='';
          words2.forEach(w=>{const t=ln2?`${ln2} ${w}`:w;if(ctx.measureText(t).width>360&&ln2){lines.push(ln2);ln2=w;}else ln2=t;});
          if(ln2)lines.push(ln2);
          lines.forEach((l,i)=>ctx.fillText(l,0,-20+(lines.length===1?20:0)+i*52));
          ctx.textBaseline='alphabetic';
          ctx.restore();
          ctx.globalAlpha=1;
        }
        ctx.globalAlpha=Math.min((rp-0.45)*5,1);
        ctx.fillStyle='#475569';ctx.font='13px Arial';ctx.fillText('El ganador sera contactado por WhatsApp',CX,678);
        ctx.globalAlpha=Math.min((rp-0.62)*5,1);
        ctx.fillStyle='#dc2626';ctx.font='bold 20px Arial';ctx.fillText('@santodilema',CX,890);
        ctx.globalAlpha=1;
      }
    };

    // ── WebCodecs MP4 path (Chrome 94+, Safari 16.4+, Edge 94+) ──
    const W=window as any;
    const hasWebCodecs=typeof W.VideoEncoder!=='undefined'&&typeof W.AudioEncoder!=='undefined';

    if(hasWebCodecs){
      try{
        const {Muxer,ArrayBufferTarget}=await import('mp4-muxer');
        const target=new ArrayBufferTarget();
        const muxer=new Muxer({
          target,
          video:{codec:'avc',width:540,height:960},
          audio:{codec:'aac',numberOfChannels:2,sampleRate:44100},
          fastStart:'in-memory',
        });

        const venc=new W.VideoEncoder({
          output:(c:any,m:any)=>muxer.addVideoChunk(c,m),
          error:console.error,
        });
        venc.configure({codec:'avc1.4d002a',width:540,height:960,bitrate:2_200_000,framerate:30});

        const aenc=new W.AudioEncoder({
          output:(c:any,m:any)=>muxer.addAudioChunk(c,m),
          error:console.error,
        });
        aenc.configure({codec:'mp4a.40.2',numberOfChannels:2,sampleRate:44100,bitrate:128_000});

        // Pre-render audio offline (instant, no real-time wait)
        const offCtx=new OfflineAudioContext(2,Math.ceil(44100*20.5),44100);
        scheduleSorteoAudio(offCtx,null,0.05);
        const audioBuf=await offCtx.startRendering();
        const ACHUNK=1024,ch0=audioBuf.getChannelData(0),ch1=audioBuf.getChannelData(1);
        for(let i=0;i<audioBuf.length;i+=ACHUNK){
          const fc=Math.min(ACHUNK,audioBuf.length-i);
          const planar=new Float32Array(fc*2);
          planar.set(ch0.subarray(i,i+fc),0);
          planar.set(ch1.subarray(i,i+fc),fc);
          const ad=new W.AudioData({
            format:'f32-planar',sampleRate:44100,
            numberOfFrames:fc,numberOfChannels:2,
            timestamp:Math.round(i/44100*1_000_000),
            data:planar,
          });
          aenc.encode(ad);ad.close();
        }
        await aenc.flush();

        // Render video frames faster than real-time
        for(let fi=0;fi<TOTAL_FRAMES;fi++){
          const el=fi/FPS*1000;
          drawAt(el);
          const vf=new W.VideoFrame(canvas,{
            timestamp:Math.round(el*1000),
            duration:Math.round(1_000_000/FPS),
          });
          venc.encode(vf,{keyFrame:fi%FPS===0});
          vf.close();
          setVideoProgress(Math.round(fi/TOTAL_FRAMES*92));
          if(fi%15===14) await new Promise(r=>setTimeout(r,0));
        }
        await venc.flush();
        muxer.finalize();

        const blob=new Blob([target.buffer],{type:'video/mp4'});
        setVideoUrl(URL.createObjectURL(blob));
        setRecording(false);setVideoProgress(100);
        return;
      }catch(err){
        console.error('WebCodecs MP4 failed, falling back to WebM',err);
      }
    }

    // ── MediaRecorder WebM fallback (Firefox / older browsers) ──
    if(!('captureStream' in canvas)){alert('Usa Chrome o Edge para generar el video.');setRecording(false);return;}
    const AudioCtxClass=window.AudioContext||(window as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(!AudioCtxClass){alert('Tu navegador no soporta Web Audio API.');setRecording(false);return;}
    const ac=new AudioCtxClass();
    const audioDest=ac.createMediaStreamDestination();
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')?'video/webm;codecs=vp8,opus':'video/webm';
    const vidStream=(canvas as HTMLCanvasElement&{captureStream(fps:number):MediaStream}).captureStream(30);
    const combined=new MediaStream([...vidStream.getVideoTracks(),...audioDest.stream.getAudioTracks()]);
    const chunks:Blob[]=[];
    const recorder=new MediaRecorder(combined,{mimeType:mime,videoBitsPerSecond:2_200_000});
    recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
    recorder.onstop=()=>{
      ac.close();
      setVideoUrl(URL.createObjectURL(new Blob(chunks,{type:mime})));
      setRecording(false);setVideoProgress(100);
    };
    recorder.start();
    scheduleSorteoAudio(ac,audioDest,ac.currentTime+0.08);
    const t0=performance.now();
    const draw=(now:number)=>{
      const el=now-t0;
      const prog=Math.min(el/TOTAL,1);
      if(prog>=1){recorder.stop();return;}
      setVideoProgress(Math.round(prog*95));
      drawAt(el);
      frameRef.current=requestAnimationFrame(draw);
    };
    frameRef.current=requestAnimationFrame(draw);
  },[winner,todos,premio]);

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  const darkCard:React.CSSProperties={
    borderRadius:18,padding:'24px 20px',textAlign:'center',
    background:'linear-gradient(145deg,#050e1d,#0a1a30)',
    border:'1.5px solid rgba(255,255,255,0.07)',
    boxShadow:'0 16px 48px rgba(0,0,0,0.55)',
    position:'relative',overflow:'hidden',
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* ── IDLE ── */}
      {phase==='idle'&&(
        <div style={darkCard}>
          <div style={{position:'absolute',top:-50,right:-50,width:180,height:180,borderRadius:'50%',background:'rgba(220,38,38,0.06)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-40,left:-40,width:150,height:150,borderRadius:'50%',background:'rgba(245,158,11,0.06)',pointerEvents:'none'}}/>
          {!loaded?(
            <>
              <div style={{fontSize:46,marginBottom:12}}>⚽ 🏆 ⚽</div>
              <h3 style={{color:'#fff',fontWeight:900,fontSize:'1.2rem',marginBottom:8}}>Gran Sorteo Mundial 2026</h3>
              <p style={{color:'#475569',fontSize:'0.78rem',marginBottom:22}}>Todos los participantes de todos los partidos</p>
              <button onClick={cargarTodos} disabled={loading} style={{padding:'12px 36px',borderRadius:12,border:'none',cursor:'pointer',background:loading?'rgba(255,255,255,0.08)':'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',fontSize:'0.9rem',fontWeight:700,boxShadow:loading?'none':'0 6px 22px rgba(220,38,38,0.4)'}}>
                {loading?'Cargando...':'Cargar participantes'}
              </button>
            </>
          ):(
            <>
              <div style={{display:'flex',justifyContent:'center',gap:10,fontSize:36,marginBottom:12}}>⚽ 🏆 ⚽</div>
              <p style={{fontSize:'0.6rem',fontWeight:700,color:'#f59e0b',textTransform:'uppercase',letterSpacing:'0.2em',marginBottom:6}}>Gran Sorteo Mundial 2026</p>
              <h2 style={{color:'#fff',fontWeight:900,fontSize:'1.55rem',marginBottom:4}}>{todos.length} participantes</h2>
              <p style={{color:'#334155',fontSize:'0.74rem',marginBottom:16}}>de todos los partidos · Premio: {premio||'Alitas gratis'}</p>
              <div style={{maxHeight:130,overflowY:'auto',marginBottom:16,display:'flex',flexDirection:'column',gap:3}}>
                {todos.slice(0,12).map((p,i)=>(
                  <div key={p.id} style={{display:'flex',gap:8,padding:'4px 10px',background:'rgba(255,255,255,0.04)',borderRadius:8,textAlign:'left'}}>
                    <span style={{color:'#334155',fontSize:'0.64rem',minWidth:20}}>{i+1}.</span>
                    <span style={{color:'#e2e8f0',fontSize:'0.76rem',fontWeight:600,flex:1}}>{p.nombre}</span>
                  </div>
                ))}
                {todos.length>12&&<p style={{color:'#334155',fontSize:'0.62rem',marginTop:4}}>+ {todos.length-12} mas</p>}
              </div>
              <button onClick={iniciarSorteo} style={{padding:'18px 54px',borderRadius:16,border:'2px solid rgba(245,158,11,0.35)',cursor:'pointer',background:'linear-gradient(135deg,#dc2626,#991b1b)',color:'#fff',fontSize:'1.1rem',fontWeight:900,letterSpacing:'0.06em',boxShadow:'0 12px 38px rgba(220,38,38,0.52)'}}>
                INICIAR GRAN SORTEO
              </button>
              <button onClick={cargarTodos} style={{display:'block',margin:'10px auto 0',background:'none',border:'none',color:'#334155',fontSize:'0.68rem',cursor:'pointer'}}>Recargar lista</button>
            </>
          )}
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {phase==='countdown'&&(
        <div style={{...darkCard,border:'1.5px solid rgba(245,158,11,0.22)',padding:'44px 22px 36px'}}>
          <p style={{color:'#64748b',fontSize:'0.66rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.22em',marginBottom:10}}>EL SORTEO COMIENZA EN</p>
          <div key={countNum} style={{fontSize:'clamp(120px,46vw,200px)',fontWeight:900,color:'#f59e0b',lineHeight:1,textShadow:'0 0 90px rgba(245,158,11,0.85),0 0 40px rgba(245,158,11,0.5)',animation:'cdAnim 1.08s cubic-bezier(0.34,1.56,0.64,1) both',margin:'14px 0'}}>
            {countNum}
          </div>
          <p style={{color:'#1e293b',fontSize:'0.7rem',marginTop:14}}>{todos.length} participantes · {premio||'Alitas gratis'} en juego</p>
          <style>{`@keyframes cdAnim{0%{transform:scale(2.4) translateY(26px);opacity:0;filter:blur(14px);}32%{transform:scale(1) translateY(0);opacity:1;filter:blur(0);}76%{transform:scale(1);opacity:1;}100%{transform:scale(0.35) translateY(-22px);opacity:0;}}`}</style>
        </div>
      )}

      {/* ── SPINNING: LOTTERY DRUM ── */}
      {phase==='spinning'&&pool.length>0&&(
        <div style={{...darkCard,background:'linear-gradient(145deg,#04091a,#080f2a)',border:'1.5px solid rgba(245,158,11,0.2)',padding:'16px 12px 20px'}}>
          <p style={{fontSize:'0.65rem',fontWeight:700,color:'#f59e0b',textTransform:'uppercase',letterSpacing:'0.18em',marginBottom:10}}>
            Mezclando {pool.length} bolillas · Premio: {premio||'Alitas gratis'}
          </p>
          <LotteryDrum
            pool={pool}
            spinning={!extracting}
            extracting={extracting}
            winnerLabel={winner?.nombre||''}
          />
          {extracting&&(
            <p style={{fontSize:'0.7rem',color:'#f59e0b',fontWeight:700,marginTop:10,animation:'blink 0.5s step-end infinite alternate'}}>
              Saliendo el papelito ganador...
            </p>
          )}
          <style>{`@keyframes blink{0%{opacity:1;}100%{opacity:0.3;}}`}</style>
        </div>
      )}

      {/* ── WINNER ── */}
      {phase==='winner'&&winner&&(
        <div style={{borderRadius:20,padding:'28px 22px',textAlign:'center',background:'linear-gradient(145deg,#040d1c,#0e1a2e)',border:'2px solid rgba(245,158,11,0.45)',position:'relative',overflow:'hidden',boxShadow:'0 0 70px rgba(245,158,11,0.12),0 20px 55px rgba(0,0,0,0.6)'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:360,height:360,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
          {showConfetti&&<ConfettiExplosion/>}

          <div style={{background:'linear-gradient(90deg,#78350f,#f59e0b,#78350f)',borderRadius:12,padding:'10px 20px',marginBottom:14,position:'relative',zIndex:2}}>
            <p style={{margin:0,fontSize:'0.66rem',fontWeight:900,color:'#000',textTransform:'uppercase',letterSpacing:'0.2em'}}>GANADOR/A DEL SORTEO MUNDIAL</p>
          </div>

          <div style={{fontSize:44,marginBottom:10,position:'relative',zIndex:2}}>🏆</div>

          {showPaper&&<PaperSlip winnerNombre={winner.nombre}/>}

          <p style={{color:'#64748b',fontSize:'0.86rem',fontWeight:600,marginTop:14,marginBottom:16,position:'relative',zIndex:2}}>{winner.telefono}</p>

          <div style={{background:'rgba(220,38,38,0.14)',border:'1px solid rgba(220,38,38,0.35)',borderRadius:12,padding:'10px 20px',marginBottom:20,display:'inline-block',position:'relative',zIndex:2}}>
            <p style={{margin:0,color:'#fca5a5',fontWeight:700,fontSize:'0.86rem'}}>Premio: {premio||'Alitas gratis'}</p>
          </div>

          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',position:'relative',zIndex:2}}>
            <button onClick={()=>{setPhase('idle');setWinner(null);setVideoUrl(null);setShowPaper(false);setExtracting(false);}} style={{padding:'10px 18px',borderRadius:10,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.06)',color:'#64748b',fontSize:'0.8rem',fontWeight:700,cursor:'pointer'}}>
              Nuevo sorteo
            </button>
            <button onClick={generarVideo} disabled={recording} style={{padding:'12px 26px',borderRadius:12,border:'none',background:recording?'rgba(220,38,38,0.18)':'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',fontSize:'0.85rem',fontWeight:700,cursor:recording?'not-allowed':'pointer',boxShadow:recording?'none':'0 6px 18px rgba(220,38,38,0.42)'}}>
              {recording?`Generando ${videoProgress}%...`:'Generar video para Stories'}
            </button>
          </div>

          {recording&&(
            <div style={{marginTop:14,position:'relative',zIndex:2}}>
              <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.06)'}}>
                <div style={{height:'100%',width:`${videoProgress}%`,background:'linear-gradient(90deg,#dc2626,#f59e0b)',borderRadius:3,transition:'width 0.3s'}}/>
              </div>
              <p style={{fontSize:'0.6rem',color:'#334155',marginTop:6}}>Renderizando video con musica... {videoProgress}%</p>
            </div>
          )}
        </div>
      )}

      {/* ── VIDEO DOWNLOAD ── */}
      {videoUrl&&winner&&(
        <div style={{borderRadius:14,padding:'20px 22px',textAlign:'center',background:'linear-gradient(135deg,#050e1d,#0a0505)',border:'1.5px solid rgba(220,38,38,0.38)'}}>
          <p style={{fontSize:'0.9rem',fontWeight:700,color:'#dc2626',marginBottom:5}}>Video listo</p>
          <p style={{fontSize:'0.7rem',color:'#334155',marginBottom:18}}>20 seg · 9:16 Stories · Musica incluida · Balotera + papelito ganador · MP4 H.264</p>
          <a href={videoUrl} download={`sorteo-mundial-${winner.nombre.replace(/\s+/g,'-').toLowerCase()}.mp4`} style={{display:'inline-block',padding:'13px 40px',borderRadius:12,background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',fontSize:'0.95rem',fontWeight:700,textDecoration:'none',boxShadow:'0 6px 18px rgba(220,38,38,0.42)'}}>
            Descargar video (.mp4)
          </a>
          <p style={{fontSize:'0.6rem',color:'#1e293b',marginTop:10}}>Compatible con Instagram, TikTok y WhatsApp · Formato MP4 nativo</p>
        </div>
      )}

      <canvas ref={canvasRef} style={{display:'none'}}/>
    </div>
  );
}
