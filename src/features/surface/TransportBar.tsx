/*
  TransportBar — hardware-style transport controls.
  SHIFT and SETTINGS are UI-only for now. PLAY, REC, GO◀, GO▶ send CC pulses.
  LOOP and METRONOME are latching toggles that track state in performanceStore.
*/

import { memo, useRef } from 'react';
import { midi } from '@/features/midi-engine/MidiEngine';
import { TRANSPORT_CC } from '@/features/midi-engine/defaults';
import { useSettingsStore } from '@/store/settingsStore';
import { usePerformanceStore } from '@/store/performanceStore';
import { TapTempo } from '@/features/transport/tapTempo';

function pulse(channel: number, cc: number): void {
  midi.cc(channel as 0, cc, 127);
  setTimeout(() => midi.cc(channel as 0, cc, 0), 50);
}

interface TransportBtnProps {
  label: string;
  active?: boolean;
  danger?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  title?: string;
}

function TransportBtn({ label, active, danger, onPointerDown, title }: TransportBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onPointerDown={(e) => {
        e.preventDefault();
        onPointerDown?.(e);
      }}
      className={
        'select-none rounded px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ' +
        (active
          ? 'bg-accent/20 text-accent'
          : danger
            ? 'bg-surfaceHi/60 text-red-400 hover:bg-red-500/20'
            : 'bg-surfaceHi/60 text-muted hover:text-text')
      }
    >
      {label}
    </button>
  );
}

export const TransportBar = memo(function TransportBar() {
  const channel = useSettingsStore((s) => s.defaultChannel);
  const loop = usePerformanceStore((s) => s.loop);
  const setLoop = usePerformanceStore((s) => s.setLoop);
  const metronome = usePerformanceStore((s) => s.metronome);
  const setMetronome = usePerformanceStore((s) => s.setMetronome);
  const tap = useRef(new TapTempo()).current;
  const tempo = usePerformanceStore((s) => s.tempo);
  const setTempo = usePerformanceStore((s) => s.setTempo);

  return (
    <section className="module-panel">
      <div className="flex flex-wrap items-center gap-1.5">
        <TransportBtn label="Shift" />
        <div className="mx-0.5 h-4 w-px bg-border/40" />

        <TransportBtn
          label="▶ Play"
          onPointerDown={() => pulse(channel, TRANSPORT_CC.play)}
        />
        <TransportBtn
          label="■ Stop"
          onPointerDown={() => pulse(channel, TRANSPORT_CC.stop)}
        />
        <TransportBtn
          label="● Rec"
          danger
          onPointerDown={() => pulse(channel, TRANSPORT_CC.record)}
        />
        <div className="mx-0.5 h-4 w-px bg-border/40" />

        <TransportBtn
          label="⟲ Loop"
          active={loop}
          onPointerDown={() => {
            const next = !loop;
            setLoop(next);
            midi.cc(channel, TRANSPORT_CC.loop, next ? 127 : 0);
          }}
        />
        <TransportBtn
          label="◐ Metro"
          active={metronome}
          onPointerDown={() => {
            const next = !metronome;
            setMetronome(next);
            midi.cc(channel, TRANSPORT_CC.metronome, next ? 127 : 0);
          }}
        />
        <div className="mx-0.5 h-4 w-px bg-border/40" />

        <TransportBtn
          label="Go ◀"
          onPointerDown={() => pulse(channel, 114)}
          title="Previous marker / pattern (CC 114)"
        />
        <TransportBtn
          label="Go ▶"
          onPointerDown={() => pulse(channel, 115)}
          title="Next marker / pattern (CC 115)"
        />

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              const bpm = tap.tap();
              if (bpm) setTempo(bpm);
            }}
            className="select-none rounded bg-surfaceHi/60 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted transition hover:text-text"
          >
            Tap
          </button>
          <input
            type="number"
            min={20}
            max={300}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="w-14 rounded bg-surfaceLow px-2 py-1.5 text-right font-mono text-[11px] tabular-nums text-text outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
      </div>
    </section>
  );
});
