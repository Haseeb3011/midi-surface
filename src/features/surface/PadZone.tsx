/*
  PadZone — pad grid with selectable layout (2×8 or 4×4) and pad-mode tab strip.

  In 2×8 mode: 2 rows of 8 pads. In 4×4: 4 rows of 4 pads. Both use 16 pads
  from the current pad bank. MIDI send behaviour matches PadGrid. Per-control
  overrides applied via layoutStore.
*/

import { memo, useCallback } from 'react';
import { Pad } from '@/ui/Pad';
import { midi } from '@/features/midi-engine/MidiEngine';
import { PAD_CHANNEL, controlId, padNoteFor } from '@/features/midi-engine/defaults';
import { midiToNoteName } from '@/features/midi-engine/noteNames';
import { usePerformanceStore, type PadBank } from '@/store/performanceStore';
import { useControlOverride, getControlOverride } from '@/features/layout/useControlOverride';
import type { PadMode } from '@/features/layout/types';

const BANK_HUES: Record<PadBank, number> = {
  A: 270,
  B: 195,
  C: 145,
  D: 30,
};

const BANKS: PadBank[] = ['A', 'B', 'C', 'D'];

const PAD_MODES: { id: PadMode; label: string }[] = [
  { id: 'drum',      label: 'Drum'  },
  { id: 'drum2',     label: 'Drum 2' },
  { id: 'userChord', label: 'User Chord' },
  { id: 'chordMap',  label: 'Chord Map' },
  { id: 'custom1',   label: 'Custom 1' },
  { id: 'custom2',   label: 'Custom 2' },
  { id: 'custom3',   label: 'Custom 3' },
  { id: 'custom4',   label: 'Custom 4' },
];

interface PadCellProps {
  bank: PadBank;
  index: number;
  baseHue: number;
  moduleId: string;
}

const PadCell = memo(function PadCell({ bank, index, baseHue, moduleId }: PadCellProps) {
  const defaultNote = padNoteFor(bank, index);
  const cid = controlId.pad(bank, index);
  const override = useControlOverride(moduleId, cid);

  const effectiveHue = override?.colorHue ?? (baseHue + (index % 4) * 6 + Math.floor(index / 4) * 4) % 360;
  const effectiveLabel = override?.label ?? midiToNoteName(defaultNote);

  const handlePress = useCallback(
    (velocity: number) => {
      const ov = getControlOverride(moduleId, cid);
      midi.noteOn(ov?.channel ?? PAD_CHANNEL, ov?.note ?? defaultNote, velocity);
    },
    [moduleId, cid, defaultNote],
  );

  const handleRelease = useCallback(() => {
    const ov = getControlOverride(moduleId, cid);
    midi.noteOff(ov?.channel ?? PAD_CHANNEL, ov?.note ?? defaultNote);
  }, [moduleId, cid, defaultNote]);

  return (
    <Pad
      controlId={cid}
      label={effectiveLabel}
      hue={effectiveHue}
      onPress={handlePress}
      onRelease={handleRelease}
    />
  );
});

interface Props {
  moduleId?: string;
  layout?: '2x8' | '4x4';
}

export const PadZone = memo(function PadZone({ moduleId = '', layout = '2x8' }: Props) {
  const padBank = usePerformanceStore((s) => s.padBank);
  const setPadBank = usePerformanceStore((s) => s.setPadBank);
  const baseHue = BANK_HUES[padBank];

  const gridCols = layout === '4x4' ? 4 : 8;

  return (
    <section className="module-panel">
      {/* Bank selector */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          {BANKS.map((b) => (
            <button
              key={b}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setPadBank(b);
              }}
              className={
                'flex h-7 w-7 items-center justify-center rounded font-mono text-[11px] font-semibold transition ' +
                (padBank === b
                  ? 'bg-accent/20 text-accent'
                  : 'bg-surfaceHi/50 text-muted hover:text-text')
              }
            >
              {b}
            </button>
          ))}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted/60">
          {layout}
        </span>
      </div>

      {/* Pad grid */}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <PadCell
            key={`${padBank}-${i}`}
            bank={padBank}
            index={i}
            baseHue={baseHue}
            moduleId={moduleId}
          />
        ))}
      </div>

      {/* Pad mode tab strip */}
      <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5">
        {PAD_MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={
              'shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition ' +
              (id === 'drum'
                ? 'bg-accent/20 text-accent'
                : 'text-muted hover:text-text')
            }
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
});
