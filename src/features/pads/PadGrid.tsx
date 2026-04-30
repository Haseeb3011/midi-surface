/*
  4×4 drum pad grid with bank switcher (A / B / C / D).

  Each pad triggers `noteOn` on the GM drum channel (channel 10) at the velocity
  produced by the Pad primitive. Bank switching changes the underlying note range
  for all 16 pads at once.

  Each bank gets its own hue family so the grid visually shifts when you switch.
*/

import { memo, useCallback } from 'react';
import { Pad } from '@/ui/Pad';
import { useLearnable } from '@/ui/useLearnable';
import { midi } from '@/features/midi-engine/MidiEngine';
import { PAD_CHANNEL, controlId, padNoteFor } from '@/features/midi-engine/defaults';
import { midiToNoteName } from '@/features/midi-engine/noteNames';
import { usePerformanceStore, type PadBank } from '@/store/performanceStore';

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
  hue: number;
}

const PadCell = memo(function PadCell({ bank, index, hue }: PadCellProps) {
  const note = padNoteFor(bank, index);
  const handlePress = useCallback(
    (velocity: number) => midi.noteOn(PAD_CHANNEL, note, velocity),
    [note],
  );
  const handleRelease = useCallback(() => midi.noteOff(PAD_CHANNEL, note), [note]);
  return (
    <Pad
      controlId={controlId.pad(bank, index)}
      label={midiToNoteName(note)}
      hue={hue}
      onPress={handlePress}
      onRelease={handleRelease}
    />
  );
});

export const PadGrid = memo(function PadGrid() {
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
        {Array.from({ length: 16 }).map((_, i) => {
          const hue = (baseHue + (i % 4) * 6 + Math.floor(i / 4) * 4) % 360;
          return <PadCell key={`${padBank}-${i}`} bank={padBank} index={i} hue={hue} />;
        })}
      </div>
    </section>
  );
});
