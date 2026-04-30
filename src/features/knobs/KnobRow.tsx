/*
  KnobRow — split into a per-knob `KnobControl` so that dragging a single
  knob only re-renders that one component, not all 8. Each KnobControl
  subscribes to its own value slice (`s.knobs[i]`) plus the (rarely-changing)
  default channel.
*/

import { memo, useCallback } from 'react';
import { Knob } from '@/ui/Knob';
import { midi } from '@/features/midi-engine/MidiEngine';
import { KNOB_CC_BASE, controlId } from '@/features/midi-engine/defaults';
import { usePerformanceStore } from '@/store/performanceStore';
import { useSettingsStore } from '@/store/settingsStore';

const KnobControl = memo(function KnobControl({ index }: { index: number }) {
  const value = usePerformanceStore((s) => s.knobs[index] ?? 64);
  const setKnob = usePerformanceStore((s) => s.setKnob);
  const channel = useSettingsStore((s) => s.defaultChannel);
  const cc = KNOB_CC_BASE + index;
  const hue = (260 + index * 14) % 360;

  const handleChange = useCallback(
    (v: number) => {
      setKnob(index, v);
      midi.cc(channel, cc, v);
    },
    [setKnob, index, channel, cc],
  );

  return (
    <Knob
      controlId={controlId.knob(index)}
      label={`K${index + 1}`}
      value={value}
      hue={hue}
      size={52}
      onChange={handleChange}
    />
  );
});

export const KnobRow = memo(function KnobRow() {
  return (
    <section className="glass flex shrink-0 flex-col gap-1.5 p-3">
      <header className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">Knobs</h3>
        <span className="font-mono text-[10px] text-muted">CC {KNOB_CC_BASE}–{KNOB_CC_BASE + 7}</span>
      </header>
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <KnobControl key={i} index={i} />
        ))}
      </div>
    </section>
  );
});
