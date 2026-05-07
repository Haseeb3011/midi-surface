/* Chord mode bottom sheet — placeholder for Phase 6. */

import { memo } from 'react';

interface Props {
  onClose: () => void;
}

export const ChordSheet = memo(function ChordSheet({ onClose }: Props) {
  return (
    <div className="glass bottom-sheet p-4" data-open="">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Chord
        </span>
        <button type="button" onClick={onClose} className="header-btn">close</button>
      </div>
      <p className="font-sans text-[12px] text-muted">
        Chord controls coming in Phase 6.
      </p>
    </div>
  );
});
