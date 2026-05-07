/* Scale Lock bottom sheet — placeholder for Phase 6. */

import { memo } from 'react';

interface Props {
  onClose: () => void;
}

export const ScaleSheet = memo(function ScaleSheet({ onClose }: Props) {
  return (
    <div className="glass bottom-sheet p-4" data-open="">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Scale Lock
        </span>
        <button type="button" onClick={onClose} className="header-btn">close</button>
      </div>
      <p className="font-sans text-[12px] text-muted">
        Scale lock controls coming in Phase 6.
      </p>
    </div>
  );
});
