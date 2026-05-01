/*
  4×4 drum pad grid with bank switcher (A / B / C / D).

  Each pad triggers `noteOn` on the GM drum channel (channel 10) at the velocity
  produced by the Pad primitive. Bank switching changes the underlying note range
  for all 16 pads at once.

  When a moduleId is provided, per-pad overrides (label, colorHue, channel,
  note) are applied via useControlOverride / getControlOverride.
*/

import { memo, useCallback } from 'react';
import { Pad } from '@/ui/Pad';
import { useLearnable } from '@/ui/useLearnable';
import { midi } from '@/features/midi-engine/MidiEngine';
import { PAD_CHANNEL, controlId, padNoteFor } from '@/features/midi-engine/defaults';
import { midiToNoteName } from '@/features/midi-engine/noteNames';
import { usePerformanceStore, type PadBank } from '@/store/performanceStore';
import { useControlOverride, getControlOverride } from '@/features/layout/useControlOverride';

const BANK_HUES: Record<PadBank, number> = {
  A: 270, // violet
  B: 195, // cyan
  C: 145, // green
  D: 30,  // orange
};

const BANKS: PadBank[] = ['A', 'B', 'C', 'D'];

function BankButton({ bank, active, onSelect }: { bank: PadBank; active: boolean; onSelect: () => void }) {
  const id = `padbank:${bank}`;
  const learn = useLearnable(id);
  return (
    <button
      type="button"
      data-control-id={id}
      onPointerDown={(e) => {
        if (learn.intercept(e)) return;
        e.preventDefault();
        onSelect();
      }}
      className={
        'flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm tracking-wider transition ' +
        (active
          ? 'bg-accent/20 text-accent shadow-glowSoft'
          : 'bg-surfaceHi/40 text-muted hover:text-text') +
        ' ' +
        (learn.armed
          ? 'ring-2 ring-accent animate-pulse'
          : learn.learnMode
            ? 'ring-1 ring-accent/50'
            : '')
      }
    >
      {bank}
    </button>
  );
}

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
      const ch = ov?.channel ?? PAD_CHANNEL;
      const note = ov?.note ?? defaultNote;
      midi.noteOn(ch, note, velocity);
    },
    [moduleId, cid, defaultNote],
  );

  const handleRelease = useCallback(() => {
    const ov = getControlOverride(moduleId, cid);
    const ch = ov?.channel ?? PAD_CHANNEL;
    const note = ov?.note ?? defaultNote;
    midi.noteOff(ch, note);
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

export const PadGrid = memo(function PadGrid({ moduleId = '' }: { moduleId?: string }) {
  const padBank = usePerformanceStore((s) => s.padBank);
  const setPadBank = usePerformanceStore((s) => s.setPadBank);
  const baseHue = BANK_HUES[padBank];

  return (
    <section className="glass flex shrink-0 flex-col gap-2 p-3">
      <header className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">Pads</h3>
        <div className="flex gap-1">
          {BANKS.map((b) => (
            <BankButton
              key={b}
              bank={b}
              active={padBank === b}
              onSelect={() => setPadBank(b)}
            />
          ))}
        </div>
      </header>

      <div className="grid grid-cols-4 gap-1.5">
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
    </section>
  );
});
