/*
  EncoderStrip — 8 rotary encoders with encoder-mode tab strip.

  Each encoder sends CC on the currently active encoder mode's CC range.
  Mode tabs switch the CC bank: plugin (16–23), mixer (24–31), sends (32–39),
  transport (40–47), custom1–4 (user-configurable, currently same as plugin).
  Per-control overrides (label, hue, channel, CC) from layoutStore are applied.
*/

import { memo, useCallback } from 'react';
import { Knob } from '@/ui/Knob';
import { midi } from '@/features/midi-engine/MidiEngine';
import { controlId } from '@/features/midi-engine/defaults';
import { usePerformanceStore } from '@/store/performanceStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useControlOverride, getControlOverride } from '@/features/layout/useControlOverride';
import type { EncoderMode } from '@/features/layout/types';

const MODE_LABELS: Record<EncoderMode, string> = {
  plugin:    'Plug-In',
  mixer:     'Mixer',
  sends:     'Sends',
  transport: 'Transport',
  custom1:   'Custom 1',
  custom2:   'Custom 2',
  custom3:   'Custom 3',
  custom4:   'Custom 4',
};

const MODE_CC_BASE: Record<EncoderMode, number> = {
  plugin:    16,
  mixer:     24,
  sends:     32,
  transport: 40,
  custom1:   16,
  custom2:   16,
  custom3:   16,
  custom4:   16,
};

const ENCODER_MODES: EncoderMode[] = ['plugin', 'mixer', 'sends', 'transport', 'custom1', 'custom2', 'custom3', 'custom4'];

interface KnobCellProps {
  index: number;
  moduleId: string;
  encoderMode: EncoderMode;
}

const KnobCell = memo(function KnobCell({ index, moduleId, encoderMode }: KnobCellProps) {
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
      const ccBase = MODE_CC_BASE[encoderMode];
      midi.cc(ov?.channel ?? defaultChannel, ov?.cc ?? ccBase + index, v);
    },
    [setKnob, index, defaultChannel, moduleId, cid, encoderMode],
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

export const EncoderStrip = memo(function EncoderStrip({ moduleId = '' }: { moduleId?: string }) {
  const encoderMode: EncoderMode = 'plugin';

  return (
    <section className="module-panel">
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <KnobCell key={i} index={i} moduleId={moduleId} encoderMode={encoderMode} />
        ))}
      </div>
      <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5">
        {ENCODER_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            className={
              'shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition ' +
              (encoderMode === mode
                ? 'bg-accent/20 text-accent'
                : 'text-muted hover:text-text')
            }
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </section>
  );
});
