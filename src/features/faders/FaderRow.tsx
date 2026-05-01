/*
  FaderRow — same split-and-memo strategy as KnobRow. Each FaderControl
  subscribes to its own value slice so dragging one fader doesn't re-render
  the others.

  When a moduleId is provided, per-control overrides (label, colorHue,
  channel, CC) are applied via useControlOverride / getControlOverride.
*/

import { memo, useCallback } from 'react';
import { Fader } from '@/ui/Fader';
import { midi } from '@/features/midi-engine/MidiEngine';
import { FADER_CC_BASE, controlId } from '@/features/midi-engine/defaults';
import { usePerformanceStore } from '@/store/performanceStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useControlOverride, getControlOverride } from '@/features/layout/useControlOverride';

interface FaderControlProps {
  index: number;
  moduleId: string;
}

const FaderControl = memo(function FaderControl({ index, moduleId }: FaderControlProps) {
  const value = usePerformanceStore((s) => s.faders[index] ?? 100);
  const setFader = usePerformanceStore((s) => s.setFader);
  const defaultChannel = useSettingsStore((s) => s.defaultChannel);
  const cid = controlId.fader(index);
  const override = useControlOverride(moduleId, cid);

  const effectiveHue = override?.colorHue ?? (210 + index * 12) % 360;
  const effectiveLabel = override?.label ?? `F${index + 1}`;

  const handleChange = useCallback(
    (v: number) => {
      setFader(index, v);
      const ov = getControlOverride(moduleId, cid);
      midi.cc(ov?.channel ?? defaultChannel, ov?.cc ?? FADER_CC_BASE + index, v);
    },
    [setFader, index, defaultChannel, moduleId, cid],
  );

  return (
    <div className="flex justify-center">
      <Fader
        controlId={cid}
        label={effectiveLabel}
        value={value}
        hue={effectiveHue}
        height={130}
        onChange={handleChange}
      />
    </div>
  );
});

export const FaderRow = memo(function FaderRow({ moduleId = '' }: { moduleId?: string }) {
  return (
    <section className="glass flex shrink-0 flex-col gap-1.5 p-3">
      <header className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">Faders</h3>
        <span className="font-mono text-[10px] text-muted">CC {FADER_CC_BASE}–{FADER_CC_BASE + 7}</span>
      </header>
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <FaderControl key={i} index={i} moduleId={moduleId} />
        ))}
      </div>
    </section>
  );
});
