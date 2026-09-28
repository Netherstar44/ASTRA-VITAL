import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, Antenna, ArrowRight, BrainCircuit, ChevronRight, CircleHelp,
  Clock3, CloudOff, Crosshair, Gauge, HeartPulse, LayoutDashboard, Loader2, Menu,
  MessageSquareText, Pause, Play, Radio, RefreshCcw, RotateCcw, Send, ShieldCheck,
  Sparkles, Sun, UserRound, UsersRound, Volume2, Wifi, X, Bell, BellOff,
  SignalHigh, SignalZero, Zap, TriangleAlert,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

// ---------------------------------------------------------------------------
// Audio / Haptic engine (FASE 6 — driven by Alert Manager profile from backend)
// ---------------------------------------------------------------------------
function playAlertChime(tone: 'alert' | 'nominal' | 'attention' | 'urgent' = 'alert') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const now = ctx.currentTime;

    const profiles: Record<string, [number, number, number, number]> = {
      nominal:   [440,  659, 0.08, 0.35],
      alert:     [587,  880, 0.12, 0.45],
      attention: [587,  880, 0.12, 0.45],
      urgent:    [880, 1174, 0.18, 0.60],
    };
    const [f1, f2, gainVal, dur] = profiles[tone] ?? profiles.alert;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.setValueAtTime(f2, now + dur * 0.33);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  } catch {
    // AudioContext blocked by policy until user interaction
  }
}

function triggerHaptic(pattern: number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator && pattern.length > 0) {
    navigator.vibrate(pattern);
  }
}

// Play alert driven by the backend Alert Manager profile
function playManagedAlert(alert: any) {
  if (!alert) return;
  const tone = alert.audio_tone as 'none' | 'soft' | 'attention' | 'urgent';
  if (tone !== 'none' && alert.audio_profile?.enabled) {
    playAlertChime(tone === 'soft' ? 'nominal' : tone);
  }
  const haptic = alert.haptic_vibration as number[];
  if (haptic?.length > 0) {
    triggerHaptic(haptic);
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ViewKey = 'overview' | 'medical' | 'behavior' | 'radiation' | 'network';
type AlertSeverity = 'nominal' | 'observation' | 'action' | 'critical';
type Icon = typeof Activity;

// ---------------------------------------------------------------------------
// Scenario steps
// ---------------------------------------------------------------------------
const scenarioSteps = [
  { eyebrow: 'PHASE 01 / NOMINAL', title: 'EVA nominal', copy: 'La tripulación está estable. ASTRA está observando cada señal en el borde del silencio.', tone: 'teal' },
  { eyebrow: 'PHASE 02 / SPACE WEATHER', title: 'Evento solar detectado', copy: 'Un pulso de protones energéticos cruza el corredor sur. La exposición prevista empieza a subir.', tone: 'amber' },
  { eyebrow: 'PHASE 03 / CREW STATE', title: 'Cambio multi-señal', copy: 'Pulso, temperatura de guante y patrón de movimiento se separan de la línea base de Vega.', tone: 'amber' },
  { eyebrow: 'PHASE 04 / PREVENTIVE', title: 'Intervención preventiva', copy: 'ASTRA recomienda una pausa de hidratación y el retorno al refugio más cercano antes de que el riesgo se acumule.', tone: 'red' },
  { eyebrow: 'PHASE 05 / LINK DEGRADED', title: 'Enlace interrumpido', copy: 'La Tierra ha dejado de responder. El modelo local conserva el contexto y mantiene la tripulación dentro de límites.', tone: 'red' },
  { eyebrow: 'PHASE 06 / LINK RESTORED', title: 'Enlace restaurado', copy: 'La conexión vuelve. ASTRA ordena los eventos por urgencia para que Houston reciba primero lo que cambia una decisión.', tone: 'teal' },
];

const navItems: { key: ViewKey; label: string; sub: string; icon: Icon }[] = [
  { key: 'overview',  label: 'Mission overview', sub: 'Resumen de misión', icon: LayoutDashboard },
  { key: 'medical',   label: 'Medical',           sub: 'Fisiología',       icon: HeartPulse },
  { key: 'behavior',  label: 'Behavior',          sub: 'Conducta y carga', icon: BrainCircuit },
  { key: 'radiation', label: 'Radiation',         sub: 'Entorno solar',    icon: Sun },
  { key: 'network',   label: 'Network',           sub: 'Enlace y buffer',  icon: Antenna },
];

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'teal' | 'amber' | 'red' | 'neutral' }) {
  const colors = {
    teal:    'border-[#4b9c91]/40 bg-[#4b9c91]/10 text-[#236e68]',
    amber:   'border-[#d9a53d]/50 bg-[#f4c66b]/20 text-[#9c6811]',
    red:     'border-[#bc594c]/40 bg-[#bc594c]/10 text-[#9a3c34]',
    neutral: 'border-[#65717b]/25 bg-[#65717b]/8 text-[#59656e]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${colors[tone]}`}>
      {children}
    </span>
  );
}

function Sparkline({ danger = false, flat = false }: { danger?: boolean; flat?: boolean }) {
  const points = flat
    ? '0,22 14,21 26,22 38,20 52,21 66,20 78,21 92,20 106,20 120,19'
    : danger
    ? '0,25 12,23 22,24 35,19 46,21 59,13 70,15 81,9 92,12 106,5 120,4'
    : '0,17 12,15 22,16 35,13 47,14 58,9 69,12 82,10 94,12 106,8 120,9';
  return (
    <svg viewBox="0 0 120 28" className="h-8 w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={danger ? '#b85d4e' : '#398b82'} strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MetricCard({ label, value, unit, detail, icon: IconComponent, tone = 'teal', danger = false, flat = false }: {
  label: string; value: string; unit: string; detail: string; icon: Icon;
  tone?: 'teal' | 'amber' | 'red'; danger?: boolean; flat?: boolean;
}) {
  const accent = tone === 'amber' ? '#c99428' : tone === 'red' ? '#af5649' : '#398b82';
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-4 shadow-[0_1px_0_rgba(255,255,255,.65)_inset]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-[#65717b]">
          <IconComponent size={15} style={{ color: accent }} />
          <span className="text-[10px] font-bold uppercase tracking-[.16em]">{label}</span>
        </div>
        <span className="mono text-[10px] text-[#7c8588]">LIVE</span>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="mono text-[28px] font-medium tracking-[-.06em] text-[#252e37]">{value}</span>
        <span className="mono text-[11px] text-[#717b80]">{unit}</span>
      </div>
      <div className="mt-1 text-[11px] text-[#687279]">{detail}</div>
      <div className="mt-3"><Sparkline danger={danger} flat={flat} /></div>
    </article>
  );
}

function CrewRow({ name, initials, role, status, pulse, active }: {
  name: string; initials: string; role: string; status: string; pulse: string; active?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 border-b border-[#d8d4c9] py-3 last:border-0 ${active ? 'opacity-100' : 'opacity-80'}`}>
      <div className={`grid h-9 w-9 place-items-center rounded-full border text-[11px] font-bold ${active ? 'border-[#398b82]/50 bg-[#398b82]/10 text-[#286c66]' : 'border-[#bfc1b8] bg-[#e5e2d9] text-[#65717b]'}`}>{initials}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#27323b]">{name}</span>
          {active && <span className="h-1.5 w-1.5 rounded-full bg-[#398b82] signal-live" />}
        </div>
        <div className="text-[10px] uppercase tracking-[.12em] text-[#7a8385]">{role}</div>
      </div>
      <div className="text-right">
        <div className="mono text-[12px] text-[#36444b]">{pulse}</div>
        <div className="text-[10px] text-[#7a8385]">{status}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FASE 6 — Alert Manager Banner (driven entirely by backend Alert Manager)
// ---------------------------------------------------------------------------
const ALERT_STYLES: Record<AlertSeverity, { bg: string; border: string; symbol_color: string; title_color: string; text_color: string }> = {
  nominal:     { bg: 'bg-[#f0f7f5]',   border: 'border-[#398b82]/35',  symbol_color: 'text-[#286e68]', title_color: 'text-[#1d4f4c]', text_color: 'text-[#4a6460]' },
  observation: { bg: 'bg-[#fbf5e6]',   border: 'border-[#d9a53d]/45',  symbol_color: 'text-[#9c6811]', title_color: 'text-[#5c3d0d]', text_color: 'text-[#7a5820]' },
  action:      { bg: 'bg-[#fdf0ed]',   border: 'border-[#c05a47]/45',  symbol_color: 'text-[#9a3c34]', title_color: 'text-[#6e2620]', text_color: 'text-[#8a3c33]' },
  critical:    { bg: 'bg-[#fce8e5]',   border: 'border-[#b03328]/55',  symbol_color: 'text-[#8c2820]', title_color: 'text-[#6a1a12]', text_color: 'text-[#8c2820]' },
};

function AlertManagerBanner({ alert, onTestAudio, onOpenContext }: {
  alert: any; onTestAudio: () => void; onOpenContext: () => void;
}) {
  if (!alert) return null;
  const severity: AlertSeverity = alert.severity ?? 'nominal';
  const styles = ALERT_STYLES[severity];
  const tone = severity === 'nominal' ? 'teal' : severity === 'observation' ? 'amber' : 'red';

  return (
    <article
      className={`relative overflow-hidden rounded-xl border ${styles.border} ${styles.bg} p-4`}
      data-testid="card-alert-manager-banner"
    >
      {/* Decorative ring */}
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full border-[14px] border-current opacity-[0.07]" />

      <div className="flex items-start gap-4">
        {/* HUD Symbol */}
        <div className={`mt-0.5 shrink-0 text-[28px] font-extrabold leading-none tabular-nums ${styles.symbol_color}`}
          aria-label={`Alert symbol: ${alert.hud_symbol}`}>
          {alert.hud_symbol}
        </div>

        <div className="min-w-0 flex-1">
          {/* Top row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={tone}>{alert.severity?.toUpperCase()}</Badge>
              <span className="mono text-[10px] text-[#8e7b58]">ALERT MANAGER / {alert.priority}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Audio + Haptic test button — fires actual profile from backend */}
              <button
                onClick={onTestAudio}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition ${
                  severity === 'nominal' ? 'border-[#398b82]/40 bg-[#e9f5f3] text-[#286e68] hover:bg-[#d4eeea]'
                  : severity === 'critical' ? 'border-[#b03328]/40 bg-[#f8e0dd] text-[#8c2820] hover:bg-[#f2c9c5]'
                  : 'border-[#d19d47]/60 bg-[#faeccd] text-[#9c6811] hover:bg-[#f5e3b8]'
                }`}
                title={`Test ${alert.audio_tone} audio + ${alert.haptic_pattern} haptic`}
                data-testid="button-test-alert-audio"
              >
                <Volume2 size={11} />
                {alert.audio_tone} · {alert.haptic_pattern}
              </button>
            </div>
          </div>

          {/* HUD Label */}
          <div className={`mt-2 mono text-[10px] font-bold uppercase tracking-[.16em] ${styles.symbol_color}`}>
            {alert.hud_symbol} {alert.hud_label}
          </div>

          {/* Title */}
          <h3 className={`mt-1 text-[15px] font-extrabold ${styles.title_color}`}>{alert.title}</h3>

          {/* Calm message */}
          <p className={`mt-1 text-[12px] leading-5 ${styles.text_color}`}>{alert.message}</p>

          {/* Action hint */}
          {severity !== 'nominal' && (
            <div className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium ${
              severity === 'critical' ? 'bg-[#f4d0cb] text-[#7a2018]'
              : severity === 'action'  ? 'bg-[#f4d8d4] text-[#7a2018]'
              : 'bg-[#f2e6c8] text-[#7a5820]'
            }`}>
              <TriangleAlert size={13} className="shrink-0" />
              <span>{alert.action_hint}</span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={onOpenContext}
              className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[.13em] transition ${
                severity === 'nominal' ? 'text-[#286e68] hover:text-[#1b4d4a]'
                : severity === 'critical' ? 'text-[#8c2820] hover:text-[#6a1a12]'
                : 'text-[#9c6811] hover:text-[#69470c]'
              }`}
              data-testid="button-open-alert-context"
            >
              Review context <ChevronRight size={14} />
            </button>
            <span className="mono text-[10px] text-[#9ca3a6]">
              Interruption: {alert.interruption_level}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Scenario Rail
// ---------------------------------------------------------------------------
function ScenarioRail({ step, onAdvance, paused, onPause, onReset }: {
  step: number; onAdvance: () => void; paused: boolean; onPause: () => void; onReset: () => void;
}) {
  const current = scenarioSteps[step];
  const tone = current.tone as 'teal' | 'amber' | 'red';
  return (
    <section className="rounded-xl border border-[#303f4b] bg-[#202e3a] p-4 text-[#e7e4d8] shadow-[0_12px_30px_rgba(22,30,37,.12)]" data-testid="panel-scenario">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#f3bb55] text-[#202e3a]"><Crosshair size={17} /></div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#aeb8b6]">Narrative simulator</div>
            <div className="mt-0.5 text-sm font-bold">Demo EVA · Asteria 07</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] text-[#9ca9ab]">STEP {String(step + 1).padStart(2, '0')} / 06</span>
          <button onClick={onReset} className="grid h-8 w-8 place-items-center rounded-md border border-[#52616b] text-[#aeb8b6] transition hover:border-[#efc66d] hover:text-[#efc66d]" aria-label="Reset scenario" data-testid="button-reset-scenario"><RotateCcw size={14} /></button>
          <button onClick={onPause} className="grid h-8 w-8 place-items-center rounded-md border border-[#52616b] text-[#aeb8b6] transition hover:border-[#efc66d] hover:text-[#efc66d]" aria-label={paused ? 'Resume scenario' : 'Pause scenario'} data-testid="button-pause-scenario">{paused ? <Play size={14} /> : <Pause size={14} />}</button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-[.18em] ${tone === 'amber' ? 'text-[#efc66d]' : tone === 'red' ? 'text-[#df9080]' : 'text-[#83c6bc]'}`}>{current.eyebrow}</div>
          <h2 className="mt-1 text-[21px] font-extrabold tracking-[-.03em]">{current.title}</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#b8c0bd]">{current.copy}</p>
        </div>
        <button onClick={onAdvance} disabled={step === scenarioSteps.length - 1} className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#f3bb55] px-4 py-2.5 text-xs font-extrabold text-[#202e3a] transition hover:bg-[#ffd478] disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-advance-scenario">
          {step === scenarioSteps.length - 1 ? 'Scenario complete' : 'Advance scenario'}<ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
        </button>
      </div>
      <div className="mt-5 flex gap-1.5">
        {scenarioSteps.map((item, index) => (
          <button key={item.title} onClick={() => index <= step && onReset()} className={`h-1.5 flex-1 rounded-full transition ${index <= step ? (item.tone === 'red' ? 'bg-[#d77663]' : item.tone === 'amber' ? 'bg-[#efc66d]' : 'bg-[#72b9af]') : 'bg-[#465660]'}`} aria-label={`Scenario phase ${index + 1}`} data-testid={`button-scenario-phase-${index + 1}`} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// AI Assistant Panel (FASE 9 — Multi-Role Context-Aware Intelligence)
// ---------------------------------------------------------------------------
type AssistantRole = 'astronaut' | 'flight_controller' | 'medical_officer' | 'behavioral_health';

interface RoleConfig {
  key: AssistantRole;
  label: string;
  shortLabel: string;
  icon: typeof UserRound;
  color: string;
  description: string;
  suggestions: string[];
}

const ROLES: RoleConfig[] = [
  {
    key: 'astronaut',
    label: 'Astronaut (EVA)',
    shortLabel: 'Astronaut',
    icon: UserRound,
    color: '#82bdb5',
    description: 'HUD directo, calmado y accionable para tripulación en traje.',
    suggestions: [
      '¿Por qué me estás alertando?',
      '¿Qué debo hacer ahora?',
      '¿Cuál es el estado de radiación y refugio?',
      '¿Cómo están mis signos vitales en el traje?',
    ],
  },
  {
    key: 'flight_controller',
    label: 'Flight Controller',
    shortLabel: 'Flight Ops',
    icon: Radio,
    color: '#efc66d',
    description: 'Telemetría de sistemas, redes DTN y línea de tiempo de misión.',
    suggestions: [
      '¿Qué está ocurriendo con Crew-07?',
      '¿Cuál es el estado del buffer DTN y reintentos?',
      '¿Cuál es la evaluación de riesgo operacional?',
      '¿Qué impacto hay en el cronograma EVA?',
    ],
  },
  {
    key: 'medical_officer',
    label: 'Medical Officer',
    shortLabel: 'Surgeon',
    icon: HeartPulse,
    color: '#df9080',
    description: 'Fisiopatología, capnografía, anomalías y tolerancia basal.',
    suggestions: [
      '¿Qué cambios fisiológicos presenta?',
      '¿Hay anomalías fisiológicas o arritmias?',
      '¿Cuáles son los parámetros de SpO2 y CO2?',
      '¿Cuál es el historial y tolerancia acumulada?',
    ],
  },
  {
    key: 'behavioral_health',
    label: 'Behavioral Health',
    shortLabel: 'Neuro-Health',
    icon: BrainCircuit,
    color: '#a9b5df',
    description: 'Carga cognitiva, temblor fino, fatiga motriz y estresores.',
    suggestions: [
      '¿Se han detectado cambios de comportamiento?',
      '¿Cuál es el índice de temblor fino en guante?',
      '¿Cómo evoluciona la carga cognitiva y estrés?',
      '¿Qué factores estresores de misión influyen?',
    ],
  },
];

function AssistantPanel({ onClose, step }: { onClose: () => void; step: number }) {
  const [role, setRole] = useState<AssistantRole>('flight_controller');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'astra'; text: string; role?: AssistantRole; time: string }>>([{
    sender: 'astra',
    role: 'flight_controller',
    text: step >= 4
      ? 'Enlace con Tierra interrumpido. Núcleo de IA local operativo al 100%: Vega a 11 min del refugio, buffer DTN resguardando telemetría multiseñal y protocolos preventivos activos.'
      : step >= 2
      ? 'Divergencia moderada detectada entre pulso, radiación ambiental y temblor fino. Ventana de prevención óptima para hidratación y repliegue seguro.'
      : 'Sistemas dentro de límites nominales. Comparando telemetría multiseñal con la línea base adaptativa en el corredor lunar sur.',
    time: 'LOCAL',
  }]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const activeRoleConfig = ROLES.find(r => r.key === role) ?? ROLES[1];

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setMessages(prev => [...prev, {
      sender: 'user',
      role,
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, question: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          sender: 'astra',
          role,
          text: data.answer || 'Información procesada en el nodo local.',
          time: 'ASTRA',
        }]);
        playAlertChime('nominal');
      } else throw new Error();
    } catch {
      setMessages(prev => [...prev, {
        sender: 'astra',
        role,
        text: 'Nodo de inteligencia local respondiendo autónomamente: Telemetría dentro de límites evaluados.',
        time: 'LOCAL',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[460px] flex-col border-l border-[#3c4b56] bg-[#1d2b36] text-[#e8e5da] shadow-[-18px_0_40px_rgba(25,31,35,.25)] reveal" data-testid="panel-assistant">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3b4a55] px-5 py-4 bg-[#192630]">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#398b82] text-[#e9f0e8] shadow-sm">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight">ASTRA Assistant</span>
              <span className="mono rounded bg-[#263741] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#82bdb5] border border-[#3b4a55]">
                FASE 9
              </span>
            </div>
            <div className="mono text-[9px] uppercase tracking-[.18em] text-[#8ca5a5]">Context-Aware Edge AI</div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-[#aeb8b6] hover:bg-[#263741] hover:text-[#efc66d] transition" aria-label="Close assistant" data-testid="button-close-assistant">
          <X size={18} />
        </button>
      </div>

      {/* Role Selector Tabs (FASE 9) */}
      <div className="border-b border-[#3b4a55] bg-[#17232c] px-3 py-2.5">
        <div className="mono text-[9px] uppercase tracking-[.14em] text-[#7d9196] mb-1.5 px-1">
          Select Operational Role:
        </div>
        <div className="grid grid-cols-4 gap-1">
          {ROLES.map(r => {
            const IconComp = r.icon;
            const active = role === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`flex flex-col items-center gap-1 rounded-md px-1.5 py-1.5 text-center transition ${
                  active
                    ? 'bg-[#2b3e4a] text-[#ffffff] shadow-sm border border-[#486070]'
                    : 'text-[#8ca0a6] hover:bg-[#202f3a] hover:text-[#c4d0d3] border border-transparent'
                }`}
                title={r.label}
                data-testid={`button-role-${r.key}`}
              >
                <IconComp size={14} style={{ color: active ? r.color : undefined }} />
                <span className="text-[10px] font-bold truncate max-w-full leading-tight">{r.shortLabel}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2 rounded bg-[#1e2e38] px-2.5 py-1.5 text-[10px] text-[#9db0b5] border border-[#2e404c]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: activeRoleConfig.color }} />
          <span className="font-semibold text-[#e1e9ea]">{activeRoleConfig.label}:</span>
          <span className="truncate">{activeRoleConfig.description}</span>
        </div>
      </div>

      {/* Chat messages */}
      <div className="panel-grid flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3">
          {messages.map((m, idx) => {
            const isUser = m.sender === 'user';
            const msgRoleConfig = ROLES.find(r => r.key === m.role);
            return (
              <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {!isUser && msgRoleConfig && (
                  <div className="mb-1 flex items-center gap-1.5 text-[9px] mono uppercase tracking-wider text-[#82bdb5] pl-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: msgRoleConfig.color }} />
                    ASTRA Intelligence · {msgRoleConfig.shortLabel}
                  </div>
                )}
                <div className={`flex gap-2.5 max-w-[90%] ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#398b82]/20 text-[#83c6bc] mt-0.5">
                      <Sparkles size={13} />
                    </div>
                  )}
                  <div
                    className={`rounded-xl p-3 text-[12px] leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-[#398b82] text-[#f2f8f7] rounded-tr-none shadow-sm'
                        : 'bg-[#243542] text-[#d6dfdc] border border-[#3b4e5c] rounded-tl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
                <span className="mono mt-1 text-[8px] text-[#71858a] px-1">{m.time}</span>
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#8ca5a5] pl-9 py-2">
              <Loader2 size={14} className="animate-spin text-[#82bdb5]" />
              <span>ASTRA evaluando contexto ({activeRoleConfig.shortLabel})...</span>
            </div>
          )}
        </div>

        {/* Suggested questions per role */}
        <div className="pt-2 border-t border-[#31424e]">
          <div className="mono text-[9px] uppercase tracking-[.18em] text-[#85999d] mb-2 flex items-center justify-between">
            <span>Preguntas sugeridas · {activeRoleConfig.shortLabel}</span>
            <span className="text-[8px] text-[#5e747a]">Context-tailored</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {activeRoleConfig.suggestions.map(s => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="group flex items-center justify-between rounded-lg border border-[#374955] bg-[#22333e] px-3 py-2 text-[11px] text-[#b8c6c4] hover:border-[#82bdb5] hover:bg-[#283c48] hover:text-[#e8e5da] text-left transition"
              >
                <span>{s}</span>
                <ArrowRight size={12} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={e => { e.preventDefault(); ask(question); }} className="border-t border-[#3b4a55] p-3 flex items-center gap-2 bg-[#17232c]">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder={`Consulta ASTRA como ${activeRoleConfig.shortLabel}...`}
          className="flex-1 bg-[#243542] border border-[#3b4e5c] rounded-lg px-3 py-2 text-[12px] text-[#e8e5da] placeholder-[#7d8f94] focus:outline-none focus:border-[#82bdb5]"
          data-testid="input-assistant-question"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="grid h-8 w-8 place-items-center rounded-lg bg-[#398b82] text-[#e9f0e8] hover:bg-[#439c92] disabled:opacity-40 transition"
          data-testid="button-assistant-send"
        >
          <Send size={14} />
        </button>
      </form>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// HUD View — reflects Alert Manager hud_symbol + hud_label
// ---------------------------------------------------------------------------
function HudView({ step, onBack, backendState }: { step: number; onBack: () => void; backendState?: any }) {
  const alert = backendState?.alert;
  const linkDown = step >= 4 || backendState?.link_status === 'buffering';
  const readings = backendState?.readings || {};
  const dtn = backendState?.dtn || {};
  const hr = readings.heart_rate != null ? Math.round(readings.heart_rate) : (step >= 2 ? 84 : 72);
  const temp = readings.temperature != null ? readings.temperature.toFixed(1) : '36.8';
  const rad = readings.radiation != null ? readings.radiation.toFixed(2) : (step >= 1 ? '0.61' : '0.22');
  const bufferCount = dtn.buffered != null ? dtn.buffered : (linkDown ? 18 : 0);
  const severity: AlertSeverity = alert?.severity ?? 'nominal';

  const hudAccent =
    severity === 'critical'    ? 'text-[#e05b4a]'
    : severity === 'action'    ? 'text-[#e07055]'
    : severity === 'observation' ? 'text-[#eab95c]'
    : 'text-[#80c1b7]';

  return (
    <div className="fixed inset-0 z-40 bg-[#101b23] text-[#e4e6db]" data-testid="view-astronaut-hud">
      <div className="scan-overlay" />
      <header className="flex items-center justify-between border-b border-[#34444d] px-5 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="ASTRA-VITAL Logo" className="h-8 w-8 rounded-md object-contain border border-[#34444d] bg-[#15232d]" />
          <div>
            <div className="text-sm font-extrabold tracking-[.2em]">ASTRA-VITAL</div>
            <div className="mono text-[9px] uppercase tracking-[.16em] text-[#8fa0a2]">Astronaut interface / V-02</div>
          </div>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 rounded-md border border-[#46565f] px-3 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#b7c1be] hover:border-[#eab95c] hover:text-[#eab95c]" data-testid="button-exit-hud">
          <X size={14} /> Exit HUD
        </button>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 md:px-10 md:py-14">
        <div className="flex items-end justify-between">
          <div>
            <div className={`mono text-[11px] uppercase tracking-[.18em] ${hudAccent}`}>VEGA / LUNAR SOUTH CORRIDOR</div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em] md:text-6xl">Stay ahead of the signal.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#9faeb0]">Tu estado está dentro de límites operativos. ASTRA seguirá observando contigo.</p>
          </div>
          <div className="hidden text-right md:block">
            <div className="mono text-2xl text-[#eab95c]">14:32:08</div>
            <div className="mono text-[9px] uppercase tracking-[.17em] text-[#778b8e]">MET 04:18:22</div>
          </div>
        </div>

        {/* Alert Manager HUD bar */}
        {alert && severity !== 'nominal' && (
          <div className={`flex items-center gap-3 rounded-xl border px-5 py-3 ${
            severity === 'critical' ? 'border-[#e05b4a]/50 bg-[#1e1015]'
            : severity === 'action' ? 'border-[#e07055]/40 bg-[#1e1518]'
            : 'border-[#eab95c]/40 bg-[#1e1c10]'
          }`}>
            <span className={`text-2xl font-extrabold ${hudAccent}`}>{alert.hud_symbol}</span>
            <div className="flex-1">
              <div className={`mono text-[10px] font-bold uppercase tracking-[.18em] ${hudAccent}`}>{alert.hud_label}</div>
              <div className="text-[12px] text-[#a5b1ae]">{alert.action_hint}</div>
            </div>
            <div className="mono text-[10px] text-[#8a9a9d]">{alert.priority} · {alert.interruption_level}</div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className={`rounded-xl border p-5 ${linkDown ? 'border-[#b85d4e]/60 bg-[#321f25]' : 'border-[#398b82]/50 bg-[#1c3638]'}`}>
            <div className="flex items-center justify-between">
              <span className="mono text-[10px] uppercase tracking-[.16em] text-[#9cacaa]">Suit link</span>
              {linkDown ? <CloudOff size={16} className="text-[#df9080]" /> : <Wifi size={16} className="text-[#83c6bc]" />}
            </div>
            <div className={`mt-6 text-2xl font-bold ${linkDown ? 'text-[#df9080]' : 'text-[#83c6bc]'}`}>{linkDown ? 'BUFFERING' : 'CONNECTED'}</div>
            <div className="mt-1 text-xs text-[#a5b1ae]">{linkDown ? `${bufferCount} events held locally (DTN)` : 'Latency 1.8 s · stable'}</div>
          </div>
          <div className="rounded-xl border border-[#3b4d57] bg-[#192933] p-5">
            <div className="flex items-center justify-between">
              <span className="mono text-[10px] uppercase tracking-[.16em] text-[#9cacaa]">Vitals</span>
              <HeartPulse size={16} className="text-[#83c6bc]" />
            </div>
            <div className="mt-6 text-2xl font-bold text-[#e4e6db]">{hr} <span className="mono text-xs font-normal text-[#8ca0a1]">BPM</span></div>
            <div className="mt-1 text-xs text-[#a5b1ae]">Core temp {temp}° · nominal</div>
          </div>
          <div className="rounded-xl border border-[#d19d47]/50 bg-[#332b1e] p-5">
            <div className="flex items-center justify-between">
              <span className="mono text-[10px] uppercase tracking-[.16em] text-[#b8a27c]">Radiation</span>
              <Sun size={16} className="text-[#efc66d]" />
            </div>
            <div className="mt-6 text-2xl font-bold text-[#efc66d]">{rad} <span className="mono text-xs font-normal text-[#b8a27c]">mSv/h</span></div>
            <div className="mt-1 text-xs text-[#b8a27c]">{step >= 1 ? 'Rising · shelter path advised' : 'Nominal · 43 min margin'}</div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#34444d] pt-5">
          <div className="flex items-center gap-2 text-[11px] text-[#9eaeae]">
            <span className="h-2 w-2 rounded-full bg-[#83c6bc] signal-live" />ASTRA local guidance active
          </div>
          <div className="mono text-[10px] text-[#718388]">SYNC STATE / {linkDown ? 'HOLD' : 'LIVE'}</div>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Insight card (sidebar context)
// ---------------------------------------------------------------------------
function Insight({ title, copy, icon: IconComponent }: { title: string; copy: string; icon: Icon }) {
  return (
    <aside className="rounded-xl border border-[#c9c6ba] bg-[#e9e6dc] p-5">
      <div className="flex items-center gap-2 text-[#59686d]">
        <IconComponent size={16} />
        <span className="mono text-[10px] uppercase tracking-[.17em]">{title}</span>
      </div>
      <p className="mt-5 text-sm leading-6 text-[#526066]">{copy}</p>
      <div className="mt-6 flex items-center gap-2 border-t border-[#d0cdc2] pt-4 text-[10px] font-bold uppercase tracking-[.13em] text-[#398b82]">
        <ShieldCheck size={14} />Context maintained locally
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Workspace views
// ---------------------------------------------------------------------------
function WorkspaceView({ view, step, onOpenAlert, backendState }: {
  view: ViewKey; step: number; onOpenAlert: () => void; backendState: any;
}) {
  const readings = backendState?.readings || {};
  const dtn      = backendState?.dtn      || {};
  const env      = backendState?.environment || {};

  // ---- Medical -----------------------------------------------------------
  if (view === 'medical') {
    const hr   = readings.heart_rate   != null ? Math.round(readings.heart_rate) : (step >= 2 ? 84 : 72);
    const spo2 = readings.spo2         != null ? Math.round(readings.spo2) : 98;
    const temp = readings.temperature  != null ? readings.temperature.toFixed(1) : (step >= 2 ? '37.1' : '36.8');
    const co2  = readings.co2          != null ? readings.co2.toFixed(1) : '3.8';
    return (
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Physiology / live read (Suit 01)</div>
              <h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Vega · crew health &amp; vitals</h2>
            </div>
            <Badge tone={step >= 3 ? 'amber' : 'teal'}>{step >= 3 ? 'Watch' : 'Within limits'}</Badge>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Heart rate" value={String(hr)} unit="BPM" detail={step >= 2 ? '↑ Diverging from baseline' : 'Baseline nominal'} icon={HeartPulse} tone={step >= 2 ? 'amber' : 'teal'} danger={step >= 2} />
            <MetricCard label="Core temp"  value={String(temp)} unit="°C" detail="Suit thermal telemetry" icon={Activity} tone="teal" flat />
            <MetricCard label="Blood SpO2" value={String(spo2)} unit="%" detail="Pulse oximeter (calibrated)" icon={HeartPulse} tone={spo2 < 95 ? 'amber' : 'teal'} flat />
            <MetricCard label="Helmet CO2" value={String(co2)} unit="mmHg" detail="Suit loop partial pressure" icon={Gauge} tone={Number(co2) > 5 ? 'amber' : 'teal'} flat />
          </div>
        </section>
        <Insight title="Clinical context" icon={CircleHelp} copy={step >= 2 ? 'La desviacion fisiologica es temprana y reversible. ASTRA recomienda hidratacion + sombra termica antes de que el riesgo se acumule.' : 'No hay divergencias significativas respecto a la linea base individual adaptativa de Vega.'} />
      </div>
    );
  }

  // ---- Behavior ----------------------------------------------------------
  if (view === 'behavior') {
    const taskAcc = readings.task_accuracy != null ? Math.round(readings.task_accuracy * 100) : (step >= 2 ? 88 : 98);
    const tremor  = readings.tremor        != null ? readings.tremor.toFixed(2) : (step >= 2 ? '0.42' : '0.08');
    const imu     = readings.imu           != null ? readings.imu.toFixed(2) : '1.08';
    return (
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Behavior / cognitive load</div>
              <h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Task rhythm &amp; stability</h2>
            </div>
            <Badge tone={step >= 2 ? 'amber' : 'teal'}>{step >= 2 ? 'Watch' : 'Nominal'}</Badge>
          </div>
          <div className="mt-7 flex h-32 items-end gap-2 border-b border-[#d3d0c5] px-2">
            {[32,42,37,51,56,49,68,74,step>=2?88:62,step>=2?76:58,70,64].map((h, i) => (
              <div key={i} className={`flex-1 rounded-t-sm ${i > 7 && step >= 2 ? 'bg-[#d19d47]' : 'bg-[#6aa59b]'}`} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-[#e9e6dc] p-2.5"><div className="mono text-lg text-[#28343c]">{taskAcc}%</div><div className="mono text-[9px] uppercase tracking-wider text-[#788284]">Task Accuracy</div></div>
            <div className="rounded-lg bg-[#e9e6dc] p-2.5"><div className="mono text-lg text-[#28343c]">{tremor}</div><div className="mono text-[9px] uppercase tracking-wider text-[#788284]">Glove Tremor</div></div>
            <div className="rounded-lg bg-[#e9e6dc] p-2.5"><div className="mono text-lg text-[#28343c]">{imu}g</div><div className="mono text-[9px] uppercase tracking-wider text-[#788284]">IMU Motion</div></div>
          </div>
        </section>
        <Insight title="Pattern note" icon={BrainCircuit} copy={step >= 2 ? 'La cadencia motora y precision de recoleccion muestran fatiga temprana acumulada. Senal procesada localmente.' : 'Movimiento y secuencia de tarea siguen el perfil esperado para un tramo de recoleccion lunar nominal.'} />
      </div>
    );
  }

  // ---- Radiation ---------------------------------------------------------
  if (view === 'radiation') {
    const rad = readings.radiation != null ? readings.radiation.toFixed(2) : (step >= 1 ? '0.61' : '0.22');
    const eventName = env.event_name || (step >= 1 ? 'Solar corridor event S-17' : 'Quiet solar corridor');
    return (
      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Radiation / space weather</div>
              <h2 className="mt-1 text-lg font-extrabold text-[#28343c]">{eventName}</h2>
            </div>
            <Sun size={20} className="text-[#c99428]" />
          </div>
          <div className="mt-7 flex items-end gap-4">
            <span className="mono text-5xl tracking-[-.08em] text-[#28343c]">{rad}</span>
            <span className="mono mb-2 text-xs text-[#788284]">mSv/h<br />PROJECTED</span>
          </div>
          <div className="mt-5 h-24 rounded-lg border border-[#d8c7a4] bg-[#f7edda] p-3">
            <Sparkline danger={step >= 1} />
            <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[.12em] text-[#9c8354]">
              <span>Now: {rad} mSv/h</span>
              <span>+15 min: {(Number(rad)*1.3).toFixed(2)}</span>
              <span>+30 min: {(Number(rad)*1.6).toFixed(2)}</span>
            </div>
          </div>
        </section>
        <Insight title="Space weather note" icon={Sun} copy={step >= 1 ? 'El pulso de protones eleva la tasa de dosis. Regla determinista activa: radiacion elevada + EVA no blindada → planificar retorno temprano al refugio.' : 'El corredor sur mantiene fondo bajo de radiacion cosmica. La ventana prevista de EVA conserva margen.'} />
      </div>
    );
  }

  // ---- Network (FASE 7 — full DTN detail) --------------------------------
  if (view === 'network') {
    const buffered    = dtn.buffered    != null ? String(dtn.buffered).padStart(2, '0')    : (step >= 4 ? '18' : '00');
    const transmitted = dtn.transmitted != null ? String(dtn.transmitted).padStart(2, '0') : (step >= 5 ? '18' : '00');
    const linkBuffering = step >= 4 && step < 5;
    const bufByPri = dtn.buffer_by_priority    || { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
    const txByPri  = dtn.transmitted_by_priority || { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
    const retry    = dtn.retry || { total: 0, delivered: 0, pending: 0, dead_letters: 0 };
    const lastFlush: any[] = dtn.last_flush || [];

    const priLabels: Record<string, string> = { P0: 'Critical', P1: 'Health', P2: 'Env', P3: 'Telemetry', P4: 'Bulk' };
    const priColors: Record<string, string> = { P0: 'bg-[#b85d4e]', P1: 'bg-[#c99428]', P2: 'bg-[#7baab2]', P3: 'bg-[#6aa59b]', P4: 'bg-[#8fa0a3]' };

    return (
      <div className="space-y-4">
        {/* Main link status */}
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Network / DTN Store-and-Forward</div>
                <h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Mission link &amp; telemetry queue</h2>
              </div>
              <Badge tone={linkBuffering ? 'red' : 'teal'}>{linkBuffering ? 'Degraded / Buffering' : step >= 5 ? 'Restored / Synced' : 'Connected'}</Badge>
            </div>

            {/* Summary counters */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#e9e6dc] p-3">
                <div className="mono text-2xl text-[#28343c]">{buffered}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#788284]">DTN Buffer</div>
              </div>
              <div className="rounded-lg bg-[#e9e6dc] p-3">
                <div className="mono text-2xl text-[#28343c]">{linkBuffering ? '—' : '1.8'}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#788284]">Latency / sec</div>
              </div>
              <div className="rounded-lg bg-[#e9e6dc] p-3">
                <div className="mono text-2xl text-[#28343c]">{transmitted}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#788284]">Prioritized sync</div>
              </div>
            </div>

            {/* Per-priority breakdown (FASE 7) */}
            <div className="mt-4 rounded-lg border border-[#d3d0c5] p-3">
              <div className="mono text-[10px] text-[#718087] mb-2">Buffer by priority (store-and-forward)</div>
              <div className="flex gap-2">
                {(['P0','P1','P2','P3','P4'] as const).map(p => (
                  <div key={p} className="flex-1 text-center">
                    <div className={`h-1.5 w-full rounded-full mb-1 ${priColors[p]}`} style={{ opacity: bufByPri[p] > 0 ? 1 : 0.2 }} />
                    <div className="mono text-[11px] text-[#28343c]">{bufByPri[p]}</div>
                    <div className="text-[9px] uppercase text-[#7c8789]">{priLabels[p]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transmitted breakdown */}
            {(step >= 5 || transmitted !== '00') && (
              <div className="mt-3 rounded-lg border border-[#d3d0c5] p-3">
                <div className="mono text-[10px] text-[#718087] mb-2">Transmitted (priority order · last flush)</div>
                <div className="flex gap-2">
                  {(['P0','P1','P2','P3','P4'] as const).map(p => (
                    <div key={p} className="flex-1 text-center">
                      <div className={`h-1.5 w-full rounded-full mb-1 ${priColors[p]}`} style={{ opacity: txByPri[p] > 0 ? 1 : 0.15 }} />
                      <div className="mono text-[11px] text-[#28343c]">{txByPri[p]}</div>
                      <div className="text-[9px] uppercase text-[#7c8789]">{p}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status row */}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-[#697579]">
              <span className={`h-2 w-2 rounded-full ${linkBuffering ? 'bg-[#b85d4e]' : 'bg-[#398b82]'}`} />
              {step >= 5
                ? 'Enlace restaurado · cola priorizada transmitida a Houston (P1 > P2 > P3)'
                : linkBuffering
                ? 'Buffer local activo · resguardo Store-and-Forward sin perdida de datos'
                : 'Relay nominal · round-trip de 1.8 segundos confirmado'}
            </div>
          </section>

          {/* Retry / reliability panel (FASE 7) */}
          <div className="space-y-3">
            <Insight title="Continuity policy" icon={CloudOff} copy="ASTRA no depende del enlace a Tierra para proteger al astronauta. Cada recomendacion y calculo de riesgo opera 100% en el Edge hasta que la conexion se restablezca." />
            <div className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-4">
              <div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087] mb-3">Retry &amp; reliability</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Total bundles', retry.total],
                  ['Delivered', retry.delivered],
                  ['Pending retry', retry.pending],
                  ['Dead letters', retry.dead_letters],
                ].map(([label, val]) => (
                  <div key={label as string} className="rounded-lg bg-[#e9e6dc] p-2.5">
                    <div className="mono text-[15px] text-[#28343c]">{val}</div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-[.1em] text-[#7c8789]">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-[#697579]">
                Max retries: 5 · TTL: 1 h · Back-off: exponential
              </div>
            </div>
          </div>
        </div>

        {/* Last flush log */}
        {lastFlush.length > 0 && (
          <div className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-4">
            <div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087] mb-3">
              Last sync — {lastFlush.length} bundle{lastFlush.length !== 1 ? 's' : ''} transmitted in priority order
            </div>
            <div className="flex flex-wrap gap-2">
              {lastFlush.slice(0, 12).map((b: any, i: number) => (
                <div key={b.bundle_id} className="flex items-center gap-1.5 rounded-md border border-[#d3d0c5] bg-[#eae7dd] px-2.5 py-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${priColors[b.priority] ?? 'bg-[#8fa0a3]'}`} />
                  <span className="mono text-[10px] text-[#3c4c54]">{b.priority}</span>
                  <span className="text-[9px] text-[#7c8789]">{b.payload_type}</span>
                </div>
              ))}
              {lastFlush.length > 12 && <div className="text-[10px] text-[#7c8789] self-center">+{lastFlush.length - 12} more</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Overview (default) ------------------------------------------------
  return <Overview step={step} onOpenAlert={onOpenAlert} backendState={backendState} />;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function Overview({ step, onOpenAlert, backendState }: { step: number; onOpenAlert: () => void; backendState?: any }) {
  const solarUp   = step >= 1;
  const preventive = step >= 3;
  const readings  = backendState?.readings || {};
  const alert     = backendState?.alert;
  const rad = readings.radiation != null ? readings.radiation.toFixed(2) : (solarUp ? '0.61' : '0.22');
  const hr  = readings.heart_rate != null ? Math.round(readings.heart_rate) : (step >= 2 ? 84 : 72);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <MetricCard label="Crew readiness" value={step >= 2 ? '82' : '94'} unit="%" detail={step >= 2 ? 'Moderate deviation / Vega' : 'All crew within baseline'} icon={Gauge} tone={step >= 2 ? 'amber' : 'teal'} danger={step >= 2} />
        <MetricCard label="Radiation field" value={rad} unit="mSv/h" detail={solarUp ? 'Solar event S-17 / rising' : 'Quiet corridor / nominal'} icon={Sun} tone={solarUp ? 'amber' : 'teal'} danger={solarUp} />
        <MetricCard label="Earth relay" value={step >= 4 && step < 5 ? 'OFF' : step >= 5 ? 'SYNC' : 'LIVE'} unit="" detail={step >= 5 ? 'Priority queue delivered' : step >= 4 ? 'Local buffer engaged' : 'Round trip 1.8 sec'} icon={step >= 4 && step < 5 ? CloudOff : Radio} tone={step >= 4 && step < 5 ? 'red' : 'teal'} flat />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5" data-testid="panel-crew">
          <div className="flex items-center justify-between">
            <div>
              <div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Crew / surface presence</div>
              <h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Two humans, one shared context</h2>
            </div>
            <Badge tone="teal"><UsersRound size={12} />2 active</Badge>
          </div>
          <div className="mt-4">
            <CrewRow name="Dr. Vega Solano" initials="VS" role="EV-02 · Science lead" pulse={`${hr} BPM`} status={step >= 2 ? 'watch' : 'nominal'} active />
            <CrewRow name="Cmdr. Imani Okafor" initials="IO" role="EV-01 · EVA lead" pulse="68 BPM" status="nominal" />
          </div>
        </section>
        <section className="rounded-xl border border-[#c9c6ba] bg-[#e9e6dc] p-5" data-testid="panel-timeline">
          <div className="flex items-center justify-between">
            <div>
              <div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Signal timeline</div>
              <h2 className="mt-1 text-lg font-extrabold text-[#28343c]">What changed</h2>
            </div>
            <Clock3 size={17} className="text-[#718087]" />
          </div>
          <div className="mt-5 space-y-4">
            {[
              { time: '14:24:11Z', text: 'EVA state nominal', tone: 'teal' },
              { time: '14:28:43Z', text: solarUp ? 'Solar event S-17 detected' : 'Corridor weather scan complete', tone: solarUp ? 'amber' : 'neutral' },
              { time: '14:31:52Z', text: step >= 2 ? 'Multi-signal deviation observed' : 'Crew signals aligned', tone: step >= 2 ? 'amber' : 'teal' },
            ].map(event => (
              <div className="flex gap-3" key={event.time}>
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.tone === 'amber' ? 'bg-[#c99428]' : event.tone === 'teal' ? 'bg-[#398b82]' : 'bg-[#869095]'}`} />
                <div className="flex flex-1 justify-between gap-3">
                  <span className="text-xs text-[#48565c]">{event.text}</span>
                  <span className="mono shrink-0 text-[9px] text-[#889092]">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Alert Manager banner (FASE 6) — replaces the old AlertCard */}
      {preventive && alert ? (
        <AlertManagerBanner
          alert={alert}
          onTestAudio={() => playManagedAlert(alert)}
          onOpenContext={onOpenAlert}
        />
      ) : !preventive ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#c9c6ba] bg-[#e9e6dc] px-5 py-4 text-[12px] text-[#5e6a6e]">
          <ShieldCheck size={17} className="text-[#398b82]" />
          <span><strong className="text-[#35454b]">No intervention needed.</strong> ASTRA está observando el contexto y no encuentra una acción preventiva que mejore la misión ahora.</span>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home (main shell)
// ---------------------------------------------------------------------------
function Home() {
  const [step, setStep] = useState(0);
  const [backendState, setBackendState] = useState<any>(null);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<ViewKey>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [hud, setHud] = useState(false);
  const [assistant, setAssistant] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [relayDisabled, setRelayDisabled] = useState(false);
  const prevSeverityRef = useRef<string>('nominal');

  const scenarioLinkDown = step >= 4 || relayDisabled || backendState?.link_status === 'buffering';

  const syncBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/mission/state');
      if (res.ok) {
        const data = await res.json();
        // Trigger managed audio/haptic when severity increases
        const newSev = data?.alert?.severity ?? 'nominal';
        const prevSev = prevSeverityRef.current;
        const sevOrder = { nominal: 0, observation: 1, action: 2, critical: 3 };
        if ((sevOrder[newSev as AlertSeverity] ?? 0) > (sevOrder[prevSev as AlertSeverity] ?? 0)) {
          playManagedAlert(data.alert);
        }
        prevSeverityRef.current = newSev;
        setBackendState(data);
        if (typeof data.step === 'number') setStep(data.step);
      }
    } catch {
      // offline fallback
    }
  }, []);

  useEffect(() => {
    syncBackend();
    const timer = setInterval(syncBackend, 2500);
    return () => clearInterval(timer);
  }, [syncBackend]);

  const connectionLabel = useMemo(
    () => scenarioLinkDown ? 'RELAY DEGRADED' : step >= 5 ? 'LINK RESTORED' : 'LINK NOMINAL',
    [scenarioLinkDown, step]
  );

  const advance = async () => {
    try {
      const res = await fetch('/api/mission/advance', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBackendState(data);
        setStep(data.step);
        prevSeverityRef.current = data?.alert?.severity ?? 'nominal';
        if (data?.alert?.severity === 'action' || data?.alert?.severity === 'critical') {
          playManagedAlert(data.alert);
        }
        return;
      }
    } catch {}
    setStep(current => Math.min(current + 1, scenarioSteps.length - 1));
  };

  const reset = async () => {
    try {
      const res = await fetch('/api/mission/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBackendState(data);
        setStep(data.step);
      }
    } catch { setStep(0); }
    setPaused(false);
    setRelayDisabled(false);
    setAlertOpen(false);
    prevSeverityRef.current = 'nominal';
  };

  const toggleRelay = async () => {
    const nextEnabled = relayDisabled; // if currently disabled, next = enable
    try {
      const res = await fetch('/api/communications/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setBackendState(data);
        setRelayDisabled(!nextEnabled);
        return;
      }
    } catch {}
    setRelayDisabled(v => !v);
  };

  if (hud) return <HudView step={step} onBack={() => setHud(false)} backendState={backendState} />;

  return (
    <div className="astra-shell flex text-[#28343c]">
      {/* Sidebar */}
      <aside className="hidden w-[248px] shrink-0 flex-col bg-[#172530] text-[#e2e4d8] md:flex" data-testid="sidebar-navigation">
        <div className="border-b border-[#33434e] px-5 py-5">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="ASTRA-VITAL Logo" className="h-9 w-9 rounded-lg object-contain bg-[#172530] border border-[#33434e] p-0.5" />
            <div>
              <div className="text-[13px] font-extrabold tracking-[.2em]">ASTRA-VITAL</div>
              <div className="mono mt-1 text-[9px] uppercase tracking-[.17em] text-[#8ca0a3]">Mission ops console</div>
            </div>
          </div>
        </div>
        <div className="px-3 py-5">
          <div className="px-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#72868c]">Workspace</div>
          <nav className="mt-2 space-y-1">
            {navItems.map(({ key, label, sub, icon: IconComponent }) => (
              <button key={key} onClick={() => setView(key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${view === key ? 'bg-[#2c414c] text-[#f0c765]' : 'text-[#a9b6b4] hover:bg-[#20333f] hover:text-[#e1e5d8]'}`} data-testid={`button-view-${key}`}>
                <IconComponent size={17} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-bold">{label}</span>
                  <span className="mt-0.5 block text-[10px] text-[#839398]">{sub}</span>
                </span>
                {view === key && <span className="h-1.5 w-1.5 rounded-full bg-[#eab95c]" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-[#33434e] p-4">
          <button onClick={() => setHud(true)} className="flex w-full items-center gap-3 rounded-lg border border-[#42535e] bg-[#20333f] px-3 py-3 text-left hover:border-[#eab95c]" data-testid="button-open-hud">
            <UserRound size={16} className="text-[#82bdb5]" />
            <span>
              <span className="block text-[11px] font-bold">Astronaut HUD</span>
              <span className="mono mt-0.5 block text-[9px] text-[#82959a]">Open field interface</span>
            </span>
            <ChevronRight size={14} className="ml-auto text-[#82959a]" />
          </button>
          <div className="mt-4 flex items-center gap-2 px-1 text-[10px] text-[#7e9296]">
            <span className={`h-1.5 w-1.5 rounded-full ${scenarioLinkDown ? 'bg-[#d77663]' : 'bg-[#77b9af]'} signal-live`} />
            {connectionLabel}
            <span className="ml-auto mono">A07</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="flex min-h-[74px] items-center justify-between border-b border-[#c9c6ba] bg-[#eeeae0]/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNav(true)} className="grid h-9 w-9 place-items-center rounded-md border border-[#c9c6ba] text-[#5d696e] md:hidden" aria-label="Open navigation" data-testid="button-open-mobile-nav"><Menu size={17} /></button>
            <div>
              <div className="mono text-[10px] uppercase tracking-[.18em] text-[#6f7d81]">Mission / Asteria 07 / EVA 02</div>
              <h1 className="mt-1 text-[17px] font-extrabold tracking-[-.02em] text-[#29353d]">{navItems.find(i => i.key === view)?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden items-center gap-2 text-right md:flex">
              <div className={`h-2 w-2 rounded-full ${scenarioLinkDown ? 'bg-[#b85d4e]' : 'bg-[#398b82]'} signal-live`} />
              <div>
                <div className="mono text-[10px] font-medium text-[#44535a]">{connectionLabel}</div>
                <div className="text-[9px] text-[#7f898c]">{scenarioLinkDown ? 'Local continuity active' : 'Ground link · 1.8 sec'}</div>
              </div>
            </div>
            <button onClick={() => setAssistant(true)} className="flex items-center gap-2 rounded-lg border border-[#bfc0b7] bg-[#f4f0e6] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#4c5b60] transition hover:border-[#398b82] hover:text-[#286e68]" data-testid="button-open-assistant">
              <Sparkles size={14} className="text-[#398b82]" />
              <span className="hidden sm:inline">Ask ASTRA</span>
            </button>
          </div>
        </header>

        {/* Mobile nav drawer */}
        {mobileNav && (
          <div className="fixed inset-0 z-20 bg-[#172530]/30 md:hidden" onClick={() => setMobileNav(false)}>
            <div className="h-full w-[285px] bg-[#172530] p-4 text-[#e2e4d8] shadow-[12px_0_30px_rgba(23,37,48,.22)]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-[#33434e] pb-4">
                <div className="flex items-center gap-2.5">
                  <img src="/favicon.png" alt="ASTRA-VITAL Logo" className="h-6 w-6 rounded object-contain" />
                  <div className="mono text-[10px] font-bold uppercase tracking-[.18em] text-[#eab95c]">ASTRA-VITAL</div>
                </div>
                <button onClick={() => setMobileNav(false)} className="text-[#9ba9aa] hover:text-[#eab95c]" aria-label="Close navigation" data-testid="button-close-mobile-nav"><X size={18} /></button>
              </div>
              <nav className="mt-4 space-y-1">
                {navItems.map(({ key, label, sub, icon: IconComponent }) => (
                  <button key={key} onClick={() => { setView(key); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${view === key ? 'bg-[#2c414c] text-[#f0c765]' : 'text-[#a9b6b4]'}`} data-testid={`button-mobile-view-${key}`}>
                    <IconComponent size={17} />
                    <span><span className="block text-[12px] font-bold">{label}</span><span className="mt-0.5 block text-[10px] text-[#839398]">{sub}</span></span>
                  </button>
                ))}
              </nav>
              <button onClick={() => { setHud(true); setMobileNav(false); }} className="mt-5 flex w-full items-center gap-3 rounded-lg border border-[#42535e] bg-[#20333f] px-3 py-3 text-left" data-testid="button-mobile-hud">
                <UserRound size={16} className="text-[#82bdb5]" />
                <span className="text-[11px] font-bold">Astronaut HUD</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 md:px-8 md:py-7">
          <ScenarioRail step={step} onAdvance={advance} paused={paused} onPause={() => setPaused(v => !v)} onReset={reset} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="mono text-[10px] uppercase tracking-[.18em] text-[#748186]">Live workspace</span>
              {step >= 3 && <Badge tone="amber"><AlertTriangle size={11} />Preventive context available</Badge>}
              {step >= 5 && <Badge tone="teal"><RefreshCcw size={11} />Sync complete</Badge>}
            </div>
            <button
              onClick={toggleRelay}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] transition ${
                relayDisabled
                  ? 'border-[#398b82]/50 bg-[#398b82]/10 text-[#286e68]'
                  : 'border-[#c9c6ba] bg-[#e9e6dc] text-[#697579] hover:border-[#b85d4e] hover:text-[#9a3c34]'
              }`}
              data-testid="button-toggle-relay"
            >
              {relayDisabled ? <Wifi size={14} /> : <CloudOff size={14} />}
              {relayDisabled ? 'Restore relay' : 'Disable relay'}
            </button>
          </div>
          <WorkspaceView view={view} step={step} onOpenAlert={() => setAlertOpen(true)} backendState={backendState} />
        </div>
      </main>

      {/* Panels */}
      {assistant && <AssistantPanel step={step} onClose={() => setAssistant(false)} />}

      {/* Alert context dialog (FASE 6) */}
      {alertOpen && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-[#172530]/20 p-4 backdrop-blur-[2px] md:items-center" onClick={() => setAlertOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-6 shadow-[0_18px_55px_rgba(30,39,44,.22)] reveal" onClick={e => e.stopPropagation()} data-testid="dialog-alert-context">
            <div className="flex items-start justify-between">
              <div>
                <Badge tone="amber">Alert Manager — context</Badge>
                <h2 className="mt-3 text-2xl font-extrabold tracking-[-.04em] text-[#28343c]">Context before urgency</h2>
              </div>
              <button onClick={() => setAlertOpen(false)} className="text-[#778286] hover:text-[#28343c]" aria-label="Close alert details" data-testid="button-close-alert"><X size={18} /></button>
            </div>
            {backendState?.alert && (
              <>
                <div className="mt-4 rounded-lg border border-[#d3d0c5] bg-[#eae7dd] p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-extrabold text-[#9c6811]">{backendState.alert.hud_symbol}</span>
                    <div>
                      <div className="mono text-[10px] font-bold uppercase tracking-[.14em] text-[#9c6811]">{backendState.alert.hud_label}</div>
                      <div className="text-[12px] text-[#59666b]">{backendState.alert.title}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-[#59666b]">{backendState.alert.message}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    [backendState.alert.priority, 'Comm priority'],
                    [backendState.alert.audio_tone, 'Audio profile'],
                    [backendState.alert.haptic_pattern, 'Haptic pattern'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-lg bg-[#e9e6dc] p-3">
                      <div className="mono text-[13px] text-[#28343c]">{value}</div>
                      <div className="mt-1 text-[9px] uppercase tracking-[.1em] text-[#7c8789]">{label}</div>
                    </div>
                  ))}
                </div>
                {backendState.alert.factors?.length > 0 && (
                  <div className="mt-4">
                    <div className="mono text-[9px] uppercase tracking-[.14em] text-[#718087] mb-2">Contributing factors</div>
                    <div className="flex flex-wrap gap-1.5">
                      {backendState.alert.factors.map((f: string) => (
                        <span key={f} className="rounded-md border border-[#d3d0c5] bg-[#eae7dd] px-2.5 py-1 text-[10px] text-[#4c5b60]">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <p className="mt-4 text-sm leading-6 text-[#59666b]">ASTRA no está declarando una emergencia. Está identificando el momento más seguro para cambiar de plan.</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[['+18 min', 'projected threshold'], ['3', 'signals converging'], ['11 min', 'to nearest shelter']].map(([value, label]) => (
                <div key={label} className="rounded-lg bg-[#e9e6dc] p-3">
                  <div className="mono text-lg text-[#28343c]">{value}</div>
                  <div className="mt-1 text-[9px] uppercase tracking-[.1em] text-[#7c8789]">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => { setAlertOpen(false); setView('radiation'); }} className="flex-1 rounded-lg bg-[#253641] px-4 py-3 text-xs font-extrabold text-[#e9e6d9] hover:bg-[#314955]" data-testid="button-view-radiation-context">View radiation context</button>
              <button onClick={() => setAlertOpen(false)} className="rounded-lg border border-[#c9c6ba] px-4 py-3 text-xs font-bold text-[#637075] hover:border-[#889194]" data-testid="button-dismiss-alert">Keep observing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Router / App
// ---------------------------------------------------------------------------
function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;