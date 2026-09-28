import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Activity, AlertTriangle, Antenna, ArrowRight, BrainCircuit, ChevronRight, CircleHelp, Clock3, CloudOff, Crosshair, Gauge, HeartPulse, LayoutDashboard, Menu, MessageSquareText, Pause, Play, Radio, RefreshCcw, RotateCcw, ShieldCheck, Sparkles, Sun, UserRound, UsersRound, Wifi, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type ViewKey = 'overview' | 'medical' | 'behavior' | 'radiation' | 'network';
type Icon = typeof Activity;

const scenarioSteps = [
  { eyebrow: 'PHASE 01 / NOMINAL', title: 'EVA nominal', copy: 'La tripulación está estable. ASTRA está observando cada señal en el borde del silencio.', tone: 'teal' },
  { eyebrow: 'PHASE 02 / SPACE WEATHER', title: 'Evento solar detectado', copy: 'Un pulso de protones energéticos cruza el corredor sur. La exposición prevista empieza a subir.', tone: 'amber' },
  { eyebrow: 'PHASE 03 / CREW STATE', title: 'Cambio multi-señal', copy: 'Pulso, temperatura de guante y patrón de movimiento se separan de la línea base de Vega.', tone: 'amber' },
  { eyebrow: 'PHASE 04 / PREVENTIVE', title: 'Intervención preventiva', copy: 'ASTRA recomienda una pausa de hidratación y el retorno al refugio más cercano antes de que el riesgo se acumule.', tone: 'red' },
  { eyebrow: 'PHASE 05 / LINK DEGRADED', title: 'Enlace interrumpido', copy: 'La Tierra ha dejado de responder. El modelo local conserva el contexto y mantiene la tripulación dentro de límites.', tone: 'red' },
  { eyebrow: 'PHASE 06 / LINK RESTORED', title: 'Enlace restaurado', copy: 'La conexión vuelve. ASTRA ordena los eventos por urgencia para que Houston reciba primero lo que cambia una decisión.', tone: 'teal' },
];

const navItems: { key: ViewKey; label: string; sub: string; icon: Icon }[] = [
  { key: 'overview', label: 'Mission overview', sub: 'Resumen de misión', icon: LayoutDashboard },
  { key: 'medical', label: 'Medical', sub: 'Fisiología', icon: HeartPulse },
  { key: 'behavior', label: 'Behavior', sub: 'Conducta y carga', icon: BrainCircuit },
  { key: 'radiation', label: 'Radiation', sub: 'Entorno solar', icon: Sun },
  { key: 'network', label: 'Network', sub: 'Enlace y buffer', icon: Antenna },
];

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'teal' | 'amber' | 'red' | 'neutral' }) {
  const colors = {
    teal: 'border-[#4b9c91]/40 bg-[#4b9c91]/10 text-[#236e68]',
    amber: 'border-[#d9a53d]/50 bg-[#f4c66b]/20 text-[#9c6811]',
    red: 'border-[#bc594c]/40 bg-[#bc594c]/10 text-[#9a3c34]',
    neutral: 'border-[#65717b]/25 bg-[#65717b]/8 text-[#59656e]',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${colors[tone]}`}>{children}</span>;
}

function Sparkline({ danger = false, flat = false }: { danger?: boolean; flat?: boolean }) {
  const points = flat ? '0,22 14,21 26,22 38,20 52,21 66,20 78,21 92,20 106,20 120,19' : danger ? '0,25 12,23 22,24 35,19 46,21 59,13 70,15 81,9 92,12 106,5 120,4' : '0,17 12,15 22,16 35,13 47,14 58,9 69,12 82,10 94,12 106,8 120,9';
  return <svg viewBox="0 0 120 28" className="h-8 w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={danger ? '#b85d4e' : '#398b82'} strokeWidth="1.7" vectorEffect="non-scaling-stroke" /></svg>;
}

function MetricCard({ label, value, unit, detail, icon: IconComponent, tone = 'teal', danger = false, flat = false }: { label: string; value: string; unit: string; detail: string; icon: Icon; tone?: 'teal' | 'amber' | 'red'; danger?: boolean; flat?: boolean }) {
  const accent = tone === 'amber' ? '#c99428' : tone === 'red' ? '#af5649' : '#398b82';
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-4 shadow-[0_1px_0_rgba(255,255,255,.65)_inset]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-[#65717b]"><IconComponent size={15} style={{ color: accent }} /><span className="text-[10px] font-bold uppercase tracking-[.16em]">{label}</span></div>
        <span className="mono text-[10px] text-[#7c8588]">LIVE</span>
      </div>
      <div className="mt-4 flex items-baseline gap-1"><span className="mono text-[28px] font-medium tracking-[-.06em] text-[#252e37]">{value}</span><span className="mono text-[11px] text-[#717b80]">{unit}</span></div>
      <div className="mt-1 text-[11px] text-[#687279]">{detail}</div>
      <div className="mt-3"><Sparkline danger={danger} flat={flat} /></div>
    </article>
  );
}

function CrewRow({ name, initials, role, status, pulse, active }: { name: string; initials: string; role: string; status: string; pulse: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 border-b border-[#d8d4c9] py-3 last:border-0 ${active ? 'opacity-100' : 'opacity-80'}`}>
      <div className={`grid h-9 w-9 place-items-center rounded-full border text-[11px] font-bold ${active ? 'border-[#398b82]/50 bg-[#398b82]/10 text-[#286c66]' : 'border-[#bfc1b8] bg-[#e5e2d9] text-[#65717b]'}`}>{initials}</div>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm font-bold text-[#27323b]">{name}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-[#398b82] signal-live" />}</div><div className="text-[10px] uppercase tracking-[.12em] text-[#7a8385]">{role}</div></div>
      <div className="text-right"><div className="mono text-[12px] text-[#36444b]">{pulse}</div><div className="text-[10px] text-[#7a8385]">{status}</div></div>
    </div>
  );
}

function ScenarioRail({ step, onAdvance, paused, onPause, onReset }: { step: number; onAdvance: () => void; paused: boolean; onPause: () => void; onReset: () => void }) {
  const current = scenarioSteps[step];
  const tone = current.tone as 'teal' | 'amber' | 'red';
  return (
    <section className="rounded-xl border border-[#303f4b] bg-[#202e3a] p-4 text-[#e7e4d8] shadow-[0_12px_30px_rgba(22,30,37,.12)]" data-testid="panel-scenario">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#f3bb55] text-[#202e3a]"><Crosshair size={17} /></div><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#aeb8b6]">Narrative simulator</div><div className="mt-0.5 text-sm font-bold">Demo EVA · Asteria 07</div></div></div>
        <div className="flex items-center gap-2"><span className="mono text-[10px] text-[#9ca9ab]">STEP {String(step + 1).padStart(2, '0')} / 06</span><button onClick={onReset} className="grid h-8 w-8 place-items-center rounded-md border border-[#52616b] text-[#aeb8b6] transition hover:border-[#efc66d] hover:text-[#efc66d]" aria-label="Reset scenario" data-testid="button-reset-scenario"><RotateCcw size={14} /></button><button onClick={onPause} className="grid h-8 w-8 place-items-center rounded-md border border-[#52616b] text-[#aeb8b6] transition hover:border-[#efc66d] hover:text-[#efc66d]" aria-label={paused ? 'Resume scenario' : 'Pause scenario'} data-testid="button-pause-scenario">{paused ? <Play size={14} /> : <Pause size={14} />}</button></div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div><div className={`text-[10px] font-bold uppercase tracking-[.18em] ${tone === 'amber' ? 'text-[#efc66d]' : tone === 'red' ? 'text-[#df9080]' : 'text-[#83c6bc]'}`}>{current.eyebrow}</div><h2 className="mt-1 text-[21px] font-extrabold tracking-[-.03em]">{current.title}</h2><p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#b8c0bd]">{current.copy}</p></div>
        <button onClick={onAdvance} disabled={step === scenarioSteps.length - 1} className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#f3bb55] px-4 py-2.5 text-xs font-extrabold text-[#202e3a] transition hover:bg-[#ffd478] disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-advance-scenario">{step === scenarioSteps.length - 1 ? 'Scenario complete' : 'Advance scenario'}<ArrowRight size={15} className="transition group-hover:translate-x-0.5" /></button>
      </div>
      <div className="mt-5 flex gap-1.5">{scenarioSteps.map((item, index) => <button key={item.title} onClick={() => index <= step && onReset()} className={`h-1.5 flex-1 rounded-full transition ${index <= step ? (item.tone === 'red' ? 'bg-[#d77663]' : item.tone === 'amber' ? 'bg-[#efc66d]' : 'bg-[#72b9af]') : 'bg-[#465660]'}`} aria-label={`Scenario phase ${index + 1}`} data-testid={`button-scenario-phase-${index + 1}`} />)}</div>
    </section>
  );
}

function AlertCard({ onOpen }: { onOpen: () => void }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#d19d47]/55 bg-[#fbf2dc] p-4" data-testid="card-preventive-alert">
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-7 -translate-y-7 rounded-full border-[12px] border-[#d9a53d]/10" />
      <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eab95c]/25 text-[#a6731c]"><AlertTriangle size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone="amber">Preventive</Badge><span className="mono text-[10px] text-[#8e7b58]">ASTRA / 14:32:08Z</span></div><h3 className="mt-2 text-[15px] font-extrabold text-[#4b3a20]">Recommend shelter transition</h3><p className="mt-1 text-[12px] leading-5 text-[#766246]">Tres señales convergen. La exposición de Vega podría superar el umbral operativo en 18 min si mantiene el trayecto actual.</p><button onClick={onOpen} className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#9c6811] hover:text-[#69470c]" data-testid="button-open-alert">Review context <ChevronRight size={14} /></button></div></div>
    </article>
  );
}

function AssistantPanel({ onClose, step }: { onClose: () => void; step: number }) {
  const responses = step >= 4 ? 'El enlace está degradado. Mantengo el hilo local: Vega está a 11 min del refugio, el buffer contiene 6 eventos y la recomendación preventiva sigue vigente.' : step >= 2 ? 'Veo una convergencia moderada entre pulso, temperatura de guante y cadencia. No es una emergencia; sí una buena ventana para intervenir con calma.' : 'La misión está dentro de parámetros. Estoy comparando cada señal con la línea base de Vega y el contexto del corredor sur.';
  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[390px] flex-col border-l border-[#3c4b56] bg-[#1d2b36] text-[#e8e5da] shadow-[-18px_0_40px_rgba(25,31,35,.18)] reveal" data-testid="panel-assistant">
      <div className="flex items-center justify-between border-b border-[#3b4a55] px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#398b82] text-[#e9f0e8]"><Sparkles size={17} /></div><div><div className="text-sm font-bold">ASTRA assistant</div><div className="mono text-[9px] uppercase tracking-[.18em] text-[#8ca5a5]">Local intelligence layer</div></div></div><button onClick={onClose} className="text-[#aeb8b6] hover:text-[#efc66d]" aria-label="Close assistant" data-testid="button-close-assistant"><X size={18} /></button></div>
      <div className="panel-grid flex-1 overflow-y-auto p-5"><div className="mb-6 text-[11px] leading-5 text-[#9eaeae]">Context is local to this console. No command is transmitted without controller confirmation.</div><div className="flex gap-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#398b82]/20 text-[#83c6bc]"><Sparkles size={13} /></div><div className="rounded-xl rounded-tl-none border border-[#42535e] bg-[#263741] p-3 text-[12px] leading-5 text-[#d1d8d2]">{responses}</div></div><div className="mt-7 border-t border-[#3b4a55] pt-4"><div className="mono text-[9px] uppercase tracking-[.18em] text-[#85999d]">Reasoning trace</div><div className="mt-3 space-y-3">{['Establishing mission context', 'Checking crew baseline', 'Ranking next safe action'].map((label, index) => <div key={label} className="flex items-center gap-2 text-[11px] text-[#bdc8c5]"><span className={`h-1.5 w-1.5 rounded-full ${index <= Math.min(step, 2) ? 'bg-[#efc66d]' : 'bg-[#52636c]'}`} />{label}<span className="ml-auto mono text-[9px] text-[#718389]">{index <= Math.min(step, 2) ? 'READY' : 'QUEUED'}</span></div>)}</div></div></div>
      <div className="border-t border-[#3b4a55] p-4"><div className="flex items-center gap-2 rounded-lg border border-[#42535e] bg-[#263741] px-3 py-2.5 text-[11px] text-[#829499]"><MessageSquareText size={14} />Ask about this mission…<span className="ml-auto mono text-[9px]">LOCAL</span></div></div>
    </aside>
  );
}

function HudView({ step, onBack }: { step: number; onBack: () => void }) {
  const linkDown = step >= 4;
  return (
    <div className="fixed inset-0 z-40 bg-[#101b23] text-[#e4e6db]" data-testid="view-astronaut-hud">
      <div className="scan-overlay" />
      <header className="flex items-center justify-between border-b border-[#34444d] px-5 py-4 md:px-10"><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-md bg-[#eab95c] text-[#15232d]"><Crosshair size={16} /></div><div><div className="text-sm font-extrabold tracking-[.2em]">ASTRA-VITAL</div><div className="mono text-[9px] uppercase tracking-[.16em] text-[#8fa0a2]">Astronaut interface / V-02</div></div></div><button onClick={onBack} className="flex items-center gap-2 rounded-md border border-[#46565f] px-3 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#b7c1be] hover:border-[#eab95c] hover:text-[#eab95c]" data-testid="button-exit-hud"><X size={14} /> Exit HUD</button></header>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 md:px-10 md:py-14"><div className="flex items-end justify-between"><div><div className="mono text-[11px] uppercase tracking-[.18em] text-[#80c1b7]">VEGA / LUNAR SOUTH CORRIDOR</div><h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em] md:text-6xl">Stay ahead of the signal.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-[#9faeb0]">Tu estado está dentro de límites operativos. ASTRA seguirá observando contigo.</p></div><div className="hidden text-right md:block"><div className="mono text-2xl text-[#eab95c]">14:32:08</div><div className="mono text-[9px] uppercase tracking-[.17em] text-[#778b8e]">MET 04:18:22</div></div></div>
        <div className="grid gap-4 md:grid-cols-3"><div className={`rounded-xl border p-5 ${linkDown ? 'border-[#b85d4e]/60 bg-[#321f25]' : 'border-[#398b82]/50 bg-[#1c3638]'}`}><div className="flex items-center justify-between"><span className="mono text-[10px] uppercase tracking-[.16em] text-[#9cacaa]">Suit link</span>{linkDown ? <CloudOff size={16} className="text-[#df9080]" /> : <Wifi size={16} className="text-[#83c6bc]" />}</div><div className={`mt-6 text-2xl font-bold ${linkDown ? 'text-[#df9080]' : 'text-[#83c6bc]'}`}>{linkDown ? 'BUFFERING' : 'CONNECTED'}</div><div className="mt-1 text-xs text-[#a5b1ae]">{linkDown ? '6 events held locally' : 'Latency 1.8 s · stable'}</div></div><div className="rounded-xl border border-[#3b4d57] bg-[#192933] p-5"><div className="flex items-center justify-between"><span className="mono text-[10px] uppercase tracking-[.16em] text-[#9cacaa]">Vitals</span><HeartPulse size={16} className="text-[#83c6bc]" /></div><div className="mt-6 text-2xl font-bold text-[#e4e6db]">72 <span className="mono text-xs font-normal text-[#8ca0a1]">BPM</span></div><div className="mt-1 text-xs text-[#a5b1ae]">Core temp 36.8° · nominal</div></div><div className="rounded-xl border border-[#d19d47]/50 bg-[#332b1e] p-5"><div className="flex items-center justify-between"><span className="mono text-[10px] uppercase tracking-[.16em] text-[#b8a27c]">Radiation</span><Sun size={16} className="text-[#efc66d]" /></div><div className="mt-6 text-2xl font-bold text-[#efc66d]">{step >= 1 ? '0.61' : '0.22'} <span className="mono text-xs font-normal text-[#b8a27c]">mSv/h</span></div><div className="mt-1 text-xs text-[#b8a27c]">{step >= 1 ? 'Rising · shelter path advised' : 'Nominal · 43 min margin'}</div></div></div>
        <div className="flex items-center justify-between border-t border-[#34444d] pt-5"><div className="flex items-center gap-2 text-[11px] text-[#9eaeae]"><span className="h-2 w-2 rounded-full bg-[#83c6bc] signal-live" />ASTRA local guidance active</div><div className="mono text-[10px] text-[#718388]">SYNC STATE / {linkDown ? 'HOLD' : 'LIVE'}</div></div></main>
    </div>
  );
}

function WorkspaceView({ view, step, onOpenAlert }: { view: ViewKey; step: number; onOpenAlert: () => void }) {
  if (view === 'medical') return <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5"><div className="flex items-center justify-between"><div><div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Physiology / live read</div><h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Vega · crew health</h2></div><Badge tone="teal">Within limits</Badge></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><MetricCard label="Heart rate" value={step >= 2 ? '84' : '72'} unit="BPM" detail={step >= 2 ? '↑ 12 from baseline' : 'Baseline stable'} icon={HeartPulse} tone={step >= 2 ? 'amber' : 'teal'} danger={step >= 2} /><MetricCard label="Core temp" value={step >= 2 ? '37.1' : '36.8'} unit="°C" detail="Suit sensor / thermal layer" icon={Activity} tone="teal" flat /></div></section><Insight title="Clinical context" icon={CircleHelp} copy={step >= 2 ? 'La desviación es temprana y reversible. Hidratación + sombra térmica ofrecen la intervención de menor carga.' : 'No hay divergencias significativas respecto a la línea base individual de Vega.'} /></div>;
  if (view === 'behavior') return <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5"><div className="flex items-center justify-between"><div><div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Behavior / cognitive load</div><h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Task rhythm</h2></div><Badge tone={step >= 2 ? 'amber' : 'teal'}>{step >= 2 ? 'Watch' : 'Nominal'}</Badge></div><div className="mt-7 flex h-32 items-end gap-2 border-b border-[#d3d0c5] px-2">{[32, 42, 37, 51, 56, 49, 68, 74, step >= 2 ? 88 : 62, step >= 2 ? 76 : 58, 70, 64].map((height, index) => <div key={index} className={`flex-1 rounded-t-sm ${index > 7 && step >= 2 ? 'bg-[#d19d47]' : 'bg-[#6aa59b]'}`} style={{ height: `${height}%` }} />)}</div><div className="mt-3 flex justify-between text-[10px] text-[#7d8587]"><span>14:08</span><span>14:18</span><span>14:28</span><span>NOW</span></div></section><Insight title="Pattern note" icon={BrainCircuit} copy={step >= 2 ? 'La cadencia de tarea se acelera mientras la trayectoria se alarga. Es una señal contextual, no un diagnóstico.' : 'Movimiento y secuencia de tarea siguen el perfil esperado para un tramo de recolección.'} /></div>;
  if (view === 'radiation') return <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5"><div className="flex items-start justify-between"><div><div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Radiation / space weather</div><h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Solar corridor exposure</h2></div><Sun size={20} className="text-[#c99428]" /></div><div className="mt-7 flex items-end gap-4"><span className="mono text-5xl tracking-[-.08em] text-[#28343c]">{step >= 1 ? '0.61' : '0.22'}</span><span className="mono mb-2 text-xs text-[#788284]">mSv/h<br />PROJECTED</span></div><div className="mt-5 h-24 rounded-lg border border-[#d8c7a4] bg-[#f7edda] p-3"><Sparkline danger={step >= 1} /><div className="mt-2 flex justify-between text-[9px] uppercase tracking-[.12em] text-[#9c8354]"><span>Now</span><span>+15 min</span><span>+30 min</span></div></div></section><Insight title="Space weather note" icon={Sun} copy={step >= 1 ? 'El pulso S-17 está elevando el fondo de protones. No requiere alarma; sí una decisión temprana sobre la ruta de retorno.' : 'El corredor sur mantiene fondo bajo. La ventana prevista de EVA conserva margen operativo.'} /></div>;
  if (view === 'network') return <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5"><div className="flex items-center justify-between"><div><div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Network / local continuity</div><h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Mission link</h2></div><Badge tone={step >= 4 ? 'red' : 'teal'}>{step >= 4 ? 'Degraded' : 'Connected'}</Badge></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-[#e9e6dc] p-3"><div className="mono text-2xl text-[#28343c]">{step >= 4 ? '06' : '00'}</div><div className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#788284]">Buffered events</div></div><div className="rounded-lg bg-[#e9e6dc] p-3"><div className="mono text-2xl text-[#28343c]">{step >= 4 ? '—' : '1.8'}</div><div className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#788284]">Latency / sec</div></div><div className="rounded-lg bg-[#e9e6dc] p-3"><div className="mono text-2xl text-[#28343c]">{step >= 5 ? '06' : step >= 4 ? '00' : '—'}</div><div className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#788284]">Priority sync</div></div></div><div className="mt-5 flex items-center gap-3 rounded-lg border border-[#d3d0c5] p-3 text-[11px] text-[#697579]"><div className={`h-2 w-2 rounded-full ${step >= 4 && step < 5 ? 'bg-[#b85d4e]' : 'bg-[#398b82]'}`} />{step >= 5 ? 'Link restored · priority queue flushed to Houston' : step >= 4 ? 'Local buffer active · crew guidance continues' : 'Relay nominal · round trip confirmed'}</div></section><Insight title="Continuity policy" icon={CloudOff} copy="ASTRA no depende del enlace para proteger la siguiente decisión. Cada recomendación conserva su contexto hasta que la Tierra pueda recibirlo." /></div>;
  return <Overview step={step} onOpenAlert={onOpenAlert} />;
}

function Insight({ title, copy, icon: IconComponent }: { title: string; copy: string; icon: Icon }) {
  return <aside className="rounded-xl border border-[#c9c6ba] bg-[#e9e6dc] p-5"><div className="flex items-center gap-2 text-[#59686d]"><IconComponent size={16} /><span className="mono text-[10px] uppercase tracking-[.17em]">{title}</span></div><p className="mt-5 text-sm leading-6 text-[#526066]">{copy}</p><div className="mt-6 flex items-center gap-2 border-t border-[#d0cdc2] pt-4 text-[10px] font-bold uppercase tracking-[.13em] text-[#398b82]"><ShieldCheck size={14} />Context maintained locally</div></aside>;
}

function Overview({ step, onOpenAlert }: { step: number; onOpenAlert: () => void }) {
  const solarUp = step >= 1;
  const preventive = step >= 3;
  return <div className="space-y-4"><div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]"><MetricCard label="Crew readiness" value={step >= 2 ? '82' : '94'} unit="%" detail={step >= 2 ? 'Moderate deviation / Vega' : 'All crew within baseline'} icon={Gauge} tone={step >= 2 ? 'amber' : 'teal'} danger={step >= 2} /><MetricCard label="Radiation field" value={solarUp ? '0.61' : '0.22'} unit="mSv/h" detail={solarUp ? 'Solar event S-17 / rising' : 'Quiet corridor / nominal'} icon={Sun} tone={solarUp ? 'amber' : 'teal'} danger={solarUp} /><MetricCard label="Earth relay" value={step >= 4 && step < 5 ? 'OFF' : step >= 5 ? 'SYNC' : 'LIVE'} unit="" detail={step >= 5 ? 'Priority queue delivered' : step >= 4 ? 'Local buffer engaged' : 'Round trip 1.8 sec'} icon={step >= 4 && step < 5 ? CloudOff : Radio} tone={step >= 4 && step < 5 ? 'red' : 'teal'} flat /></div><div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-5" data-testid="panel-crew"><div className="flex items-center justify-between"><div><div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Crew / surface presence</div><h2 className="mt-1 text-lg font-extrabold text-[#28343c]">Two humans, one shared context</h2></div><Badge tone="teal"><UsersRound size={12} />2 active</Badge></div><div className="mt-4"><CrewRow name="Dr. Vega Solano" initials="VS" role="EV-02 · Science lead" pulse={step >= 2 ? '84 BPM' : '72 BPM'} status={step >= 2 ? 'watch' : 'nominal'} active /><CrewRow name="Cmdr. Imani Okafor" initials="IO" role="EV-01 · EVA lead" pulse="68 BPM" status="nominal" /></div></section><section className="rounded-xl border border-[#c9c6ba] bg-[#e9e6dc] p-5" data-testid="panel-timeline"><div className="flex items-center justify-between"><div><div className="mono text-[10px] uppercase tracking-[.17em] text-[#718087]">Signal timeline</div><h2 className="mt-1 text-lg font-extrabold text-[#28343c]">What changed</h2></div><Clock3 size={17} className="text-[#718087]" /></div><div className="mt-5 space-y-4">{[{time:'14:24:11Z', text:'EVA state nominal', tone:'teal'}, {time:'14:28:43Z', text:solarUp ? 'Solar event S-17 detected' : 'Corridor weather scan complete', tone:solarUp ? 'amber' : 'neutral'}, {time:'14:31:52Z', text:step >= 2 ? 'Multi-signal deviation observed' : 'Crew signals aligned', tone:step >= 2 ? 'amber' : 'teal'}].map((event, index) => <div className="flex gap-3" key={event.time}><div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.tone === 'amber' ? 'bg-[#c99428]' : event.tone === 'teal' ? 'bg-[#398b82]' : 'bg-[#869095]'}`} /><div className="flex flex-1 justify-between gap-3"><span className="text-xs text-[#48565c]">{event.text}</span><span className="mono shrink-0 text-[9px] text-[#889092]">{event.time}</span></div></div>)}</div></section></div>{preventive ? <AlertCard onOpen={onOpenAlert} /> : <div className="flex items-center gap-3 rounded-xl border border-[#c9c6ba] bg-[#e9e6dc] px-5 py-4 text-[12px] text-[#5e6a6e]"><ShieldCheck size={17} className="text-[#398b82]" /><span><strong className="text-[#35454b]">No intervention needed.</strong> ASTRA está observando el contexto y no encuentra una acción preventiva que mejore la misión ahora.</span></div>}</div>;
}

function Home() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<ViewKey>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [hud, setHud] = useState(false);
  const [assistant, setAssistant] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [relayDisabled, setRelayDisabled] = useState(false);
  const scenarioLinkDown = step >= 4 || relayDisabled;

  useEffect(() => {
    if (paused || step >= scenarioSteps.length - 1) return;
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, scenarioSteps.length - 1)), 30000);
    return () => window.clearInterval(timer);
  }, [paused, step]);

  const connectionLabel = useMemo(() => scenarioLinkDown ? 'RELAY DEGRADED' : step >= 5 ? 'LINK RESTORED' : 'LINK NOMINAL', [scenarioLinkDown, step]);
  const advance = () => setStep((current) => Math.min(current + 1, scenarioSteps.length - 1));
  const reset = () => { setStep(0); setPaused(false); setRelayDisabled(false); setAlertOpen(false); };

  if (hud) return <HudView step={step} onBack={() => setHud(false)} />;
  return <div className="astra-shell flex text-[#28343c]">
    <aside className="hidden w-[248px] shrink-0 flex-col bg-[#172530] text-[#e2e4d8] md:flex" data-testid="sidebar-navigation">
      <div className="border-b border-[#33434e] px-5 py-5"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eab95c] text-[#172530]"><Crosshair size={18} /></div><div><div className="text-[13px] font-extrabold tracking-[.2em]">ASTRA-VITAL</div><div className="mono mt-1 text-[9px] uppercase tracking-[.17em] text-[#8ca0a3]">Mission ops console</div></div></div></div>
      <div className="px-3 py-5"><div className="px-3 text-[9px] font-bold uppercase tracking-[.2em] text-[#72868c]">Workspace</div><nav className="mt-2 space-y-1">{navItems.map(({ key, label, sub, icon: IconComponent }) => <button key={key} onClick={() => setView(key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${view === key ? 'bg-[#2c414c] text-[#f0c765]' : 'text-[#a9b6b4] hover:bg-[#20333f] hover:text-[#e1e5d8]'}`} data-testid={`button-view-${key}`}><IconComponent size={17} /><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold">{label}</span><span className="mt-0.5 block text-[10px] text-[#839398]">{sub}</span></span>{view === key && <span className="h-1.5 w-1.5 rounded-full bg-[#eab95c]" />}</button>)}</nav></div>
      <div className="mt-auto border-t border-[#33434e] p-4"><button onClick={() => setHud(true)} className="flex w-full items-center gap-3 rounded-lg border border-[#42535e] bg-[#20333f] px-3 py-3 text-left hover:border-[#eab95c]" data-testid="button-open-hud"><UserRound size={16} className="text-[#82bdb5]" /><span><span className="block text-[11px] font-bold">Astronaut HUD</span><span className="mono mt-0.5 block text-[9px] text-[#82959a]">Open field interface</span></span><ChevronRight size={14} className="ml-auto text-[#82959a]" /></button><div className="mt-4 flex items-center gap-2 px-1 text-[10px] text-[#7e9296]"><span className={`h-1.5 w-1.5 rounded-full ${scenarioLinkDown ? 'bg-[#d77663]' : 'bg-[#77b9af]'} signal-live`} />{connectionLabel}<span className="ml-auto mono">A07</span></div></div>
    </aside>
    <main className="min-w-0 flex-1">
      <header className="flex min-h-[74px] items-center justify-between border-b border-[#c9c6ba] bg-[#eeeae0]/90 px-4 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} className="grid h-9 w-9 place-items-center rounded-md border border-[#c9c6ba] text-[#5d696e] md:hidden" aria-label="Open navigation" data-testid="button-open-mobile-nav"><Menu size={17} /></button><div><div className="mono text-[10px] uppercase tracking-[.18em] text-[#6f7d81]">Mission / Asteria 07 / EVA 02</div><h1 className="mt-1 text-[17px] font-extrabold tracking-[-.02em] text-[#29353d]">{navItems.find((item) => item.key === view)?.label}</h1></div></div><div className="flex items-center gap-2 md:gap-4"><div className="hidden items-center gap-2 text-right md:flex"><div className={`h-2 w-2 rounded-full ${scenarioLinkDown ? 'bg-[#b85d4e]' : 'bg-[#398b82]'} signal-live`} /><div><div className="mono text-[10px] font-medium text-[#44535a]">{connectionLabel}</div><div className="text-[9px] text-[#7f898c]">{scenarioLinkDown ? 'Local continuity active' : 'Ground link · 1.8 sec'}</div></div></div><button onClick={() => setAssistant(true)} className="flex items-center gap-2 rounded-lg border border-[#bfc0b7] bg-[#f4f0e6] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#4c5b60] transition hover:border-[#398b82] hover:text-[#286e68]" data-testid="button-open-assistant"><Sparkles size={14} className="text-[#398b82]" /><span className="hidden sm:inline">Ask ASTRA</span></button></div></header>
      {mobileNav && <div className="fixed inset-0 z-20 bg-[#172530]/30 md:hidden" onClick={() => setMobileNav(false)}><div className="h-full w-[285px] bg-[#172530] p-4 text-[#e2e4d8] shadow-[12px_0_30px_rgba(23,37,48,.22)]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-[#33434e] pb-4"><div className="mono text-[10px] font-bold uppercase tracking-[.18em] text-[#eab95c]">Workspace</div><button onClick={() => setMobileNav(false)} className="text-[#9ba9aa] hover:text-[#eab95c]" aria-label="Close navigation" data-testid="button-close-mobile-nav"><X size={18} /></button></div><nav className="mt-4 space-y-1">{navItems.map(({ key, label, sub, icon: IconComponent }) => <button key={key} onClick={() => { setView(key); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${view === key ? 'bg-[#2c414c] text-[#f0c765]' : 'text-[#a9b6b4]'}`} data-testid={`button-mobile-view-${key}`}><IconComponent size={17} /><span><span className="block text-[12px] font-bold">{label}</span><span className="mt-0.5 block text-[10px] text-[#839398]">{sub}</span></span></button>)}</nav><button onClick={() => { setHud(true); setMobileNav(false); }} className="mt-5 flex w-full items-center gap-3 rounded-lg border border-[#42535e] bg-[#20333f] px-3 py-3 text-left" data-testid="button-mobile-hud"><UserRound size={16} className="text-[#82bdb5]" /><span className="text-[11px] font-bold">Astronaut HUD</span></button></div></div>}
      <div className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 md:px-8 md:py-7"><ScenarioRail step={step} onAdvance={advance} paused={paused} onPause={() => setPaused((value) => !value)} onReset={reset} /><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="mono text-[10px] uppercase tracking-[.18em] text-[#748186]">Live workspace</span>{step >= 3 && <Badge tone="amber"><AlertTriangle size={11} />Preventive context available</Badge>}{step >= 5 && <Badge tone="teal"><RefreshCcw size={11} />Sync complete</Badge>}</div><button onClick={() => setRelayDisabled((value) => !value)} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] transition ${relayDisabled ? 'border-[#398b82]/50 bg-[#398b82]/10 text-[#286e68]' : 'border-[#c9c6ba] bg-[#e9e6dc] text-[#697579] hover:border-[#b85d4e] hover:text-[#9a3c34]'}`} data-testid="button-toggle-relay">{relayDisabled ? <Wifi size={14} /> : <CloudOff size={14} />}{relayDisabled ? 'Restore relay' : 'Disable relay'}</button></div><WorkspaceView view={view} step={step} onOpenAlert={() => setAlertOpen(true)} /></div>
    </main>
    {assistant && <AssistantPanel step={step} onClose={() => setAssistant(false)} />}
    {alertOpen && <div className="fixed inset-0 z-20 flex items-end justify-center bg-[#172530]/20 p-4 backdrop-blur-[2px] md:items-center" onClick={() => setAlertOpen(false)}><div className="w-full max-w-lg rounded-xl border border-[#c9c6ba] bg-[#f4f0e6] p-6 shadow-[0_18px_55px_rgba(30,39,44,.22)] reveal" onClick={(event) => event.stopPropagation()} data-testid="dialog-alert-context"><div className="flex items-start justify-between"><div><Badge tone="amber">Preventive alert</Badge><h2 className="mt-3 text-2xl font-extrabold tracking-[-.04em] text-[#28343c]">Context before urgency</h2></div><button onClick={() => setAlertOpen(false)} className="text-[#778286] hover:text-[#28343c]" aria-label="Close alert details" data-testid="button-close-alert"><X size={18} /></button></div><p className="mt-4 text-sm leading-6 text-[#59666b]">ASTRA no está declarando una emergencia. Está identificando el momento más seguro para cambiar de plan: el riesgo de radiación sube, la carga de tarea aumenta y la fisiología de Vega se separa de su base.</p><div className="mt-5 grid grid-cols-3 gap-2">{[['+18 min','projected threshold'],['3','signals converging'],['11 min','to nearest shelter']].map(([value, label]) => <div key={label} className="rounded-lg bg-[#e9e6dc] p-3"><div className="mono text-lg text-[#28343c]">{value}</div><div className="mt-1 text-[9px] uppercase tracking-[.1em] text-[#7c8789]">{label}</div></div>)}</div><div className="mt-6 flex flex-col gap-2 sm:flex-row"><button onClick={() => { setAlertOpen(false); setView('radiation'); }} className="flex-1 rounded-lg bg-[#253641] px-4 py-3 text-xs font-extrabold text-[#e9e6d9] hover:bg-[#314955]" data-testid="button-view-radiation-context">View radiation context</button><button onClick={() => setAlertOpen(false)} className="rounded-lg border border-[#c9c6ba] px-4 py-3 text-xs font-bold text-[#637075] hover:border-[#889194]" data-testid="button-dismiss-alert">Keep observing</button></div></div></div>}
  </div>;
}

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;