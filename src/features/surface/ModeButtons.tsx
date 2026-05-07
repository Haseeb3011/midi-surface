/*
  ModeButtons — ARP / SCALE / CHORD placeholder toggle buttons.
  Non-functional in Phase 5; chevron chevron opens the respective sheet (Phase 6).
  Renders as a row of labeled toggle buttons with a chevron dropdown indicator.
*/

import { memo } from 'react';

interface ModeToggleProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

function ModeToggle({ label, active, onToggle }: ModeToggleProps) {
  return (
    <div className="flex overflow-hidden rounded-md">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onToggle();
        }}
        className={
          'select-none px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ' +
          (active
            ? 'bg-accent/20 text-accent'
            : 'bg-surfaceHi/60 text-muted hover:text-text')
        }
      >
        {label}
      </button>
      <button
        type="button"
        className={
          'border-l px-1.5 font-mono text-[9px] transition ' +
          (active
            ? 'border-accent/20 bg-accent/10 text-accent/70 hover:text-accent'
            : 'border-border/40 bg-surfaceHi/40 text-muted/60 hover:text-muted')
        }
        title={`${label} settings`}
      >
        ▾
      </button>
    </div>
  );
}

export const ModeButtons = memo(function ModeButtons() {
  return (
    <section className="module-panel">
      <div className="flex flex-wrap items-center gap-1.5">
        <ModeToggle label="ARP" active={false} onToggle={() => {}} />
        <ModeToggle label="Scale" active={false} onToggle={() => {}} />
        <ModeToggle label="Chord" active={false} onToggle={() => {}} />
      </div>
    </section>
  );
});
