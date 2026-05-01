/*
  KnobRow — split into a per-knob `KnobControl` so that dragging a single
  knob only re-renders that one component, not all 8. Each KnobControl
  subscribes to its own value slice (`s.knobs[i]`) plus the (rarely-changing)
  default channel.

  When a moduleId is provided, per-control overrides (label, colorHue,
  channel, CC) are applied. The MIDI send path reads overrides via
  getControlOverride — a synchronous getter with a null fast-path when no
  overrides exist.
*/

import { memo, useCallback } from 'react';
import { Knob } from '@/ui/Knob';
import { midi } from '@/features/midi-engine/MidiEngine';
import { KNOB_CC_BASE, controlId } from '@/features/midi-engine/defaults';
import { usePerformanceStore } from '@/store/performanceStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useControlOverride, getControlOverride } from '@/features/layout/useControlOverride';

interface KnobControlProps {
  index: number;
  moduleId: string;
}

const KnobControl = memo(function KnobControl({ index, moduleId }: KnobControlProps) {
  const value = usePerformanceStore((s) => s.knobs[index] ?? 64);
  const setKnob = usePerformanceStore((s) => s.setKnob);
  const defaultChannel = useSettingsStore((s) => s.defaultChannel);
  const cid = controlId.knob(index);
  const override = useControlOverride(moduleId, cid);

  const effectiveHue = override?.colorHue ?? (260 + index * 14) % 360;
  const effectiveLabel = override?.label ?? `K${index + 1}`;

  const handleChange = useCallback(
    (v: number) => {
      setKnob(index, v);
      const ov = getControlOverride(moduleId, cid);
      midi.cc(ov?.channel ?? defaultChannel, ov?.cc ?? KNOB_CC_BASE + index, v);
    },
    [setKnob, index, defaultChannel, moduleId, cid],
  );

  return (
    <Knob
      controlId={cid}
      label={effectiveLabel}
      value={value}
      hue={effectiveHue}
      size={52}
      onChange={handleChange}
    />
  );
});

export const KnobRow = memo(function KnobRow({ moduleId = '' }: { moduleId?: string }) {
  return (
    <section className="glass flex shrink-0 flex-col gap-1.5 p-3">
      <header className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">Knobs</h3>
        <span className="font-mono text-[10px] text-muted">CC {KNOB_CC_BASE}–{KNOB_CC_BASE + 7}</span>
      </header>
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <KnobControl key={i} index={i} moduleId={moduleId} />
        ))}
      </div>
    </section>
  );
});
