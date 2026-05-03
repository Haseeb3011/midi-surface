import { memo, useRef } from 'react';
import { TransportButton } from '@/ui/TransportButton';
import { midi } from '@/features/midi-engine/MidiEngine';
import { TRANSPORT_CC, controlId, type TransportKey } from '@/features/midi-engine/defaults';
import { useSettingsStore } from '@/store/settingsStore';
import { usePerformanceStore } from '@/store/performanceStore';
import { TapTempo } from '@/features/transport/tapTempo';

const HUES: Record<TransportKey, number> = {
  play: 145,
  stop: 0,
  record: 350,
  loop: 270,
  metronome: 200,
};

function sendTransport(channel: number, key: TransportKey, value: number): void {
  midi.cc(channel as 0, TRANSPORT_CC[key], value);
}

export const Transport = memo(function Transport() {
  const channel = useSettingsStore((s) => s.defaultChannel);
  const loop = usePerformanceStore((s) => s.loop);
  const setLoop = usePerformanceStore((s) => s.setLoop);
  const metronome = usePerformanceStore((s) => s.metronome);
  const setMetronome = usePerformanceStore((s) => s.setMetronome);
  const tempo = usePerformanceStore((s) => s.tempo);
  const setTempo = usePerformanceStore((s) => s.setTempo);
  const tap = useRef(new TapTempo()).current;

  return (
    <section className="module-panel flex flex-wrap items-center gap-3">
      <TransportButton
        controlId={controlId.transport('play')}
        label="Play"
        icon="▶"
        hue={HUES.play}
        onPress={() => sendTransport(channel, 'play', 127)}
        onRelease={() => sendTransport(channel, 'play', 0)}
      />
      <TransportButton
        controlId={controlId.transport('stop')}
        label="Stop"
        icon="■"
        hue={HUES.stop}
        onPress={() => sendTransport(channel, 'stop', 127)}
        onRelease={() => sendTransport(channel, 'stop', 0)}
      />
      <TransportButton
        controlId={controlId.transport('record')}
        label="Rec"
        icon="●"
        hue={HUES.record}
        onPress={() => sendTransport(channel, 'record', 127)}
        onRelease={() => sendTransport(channel, 'record', 0)}
      />
      <TransportButton
        controlId={controlId.transport('loop')}
        label="Loop"
        icon="⟲"
        hue={HUES.loop}
        active={loop}
        onTap={() => {
          const next = !loop;
          setLoop(next);
          sendTransport(channel, 'loop', next ? 127 : 0);
        }}
      />
      <TransportButton
        controlId={controlId.transport('metronome')}
        label="Metro"
        icon="◐"
        hue={HUES.metronome}
        active={metronome}
        onTap={() => {
          const next = !metronome;
          setMetronome(next);
          sendTransport(channel, 'metronome', next ? 127 : 0);
        }}
      />

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            const bpm = tap.tap();
            if (bpm) setTempo(bpm);
          }}
          className="flex h-9 select-none items-center rounded-md border border-borderSoft bg-surfaceLow px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted transition hover:bg-surfaceHi hover:text-text active:scale-[0.97]"
        >
          Tap
        </button>
        <div className="flex h-9 items-center gap-2 rounded-md border border-borderSoft bg-surfaceLow px-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">BPM</span>
          <input
            type="number"
            min={20}
            max={300}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="w-14 bg-transparent text-right font-sans text-sm tabular-nums text-text outline-none"
          />
        </div>
      </div>
    </section>
  );
});
