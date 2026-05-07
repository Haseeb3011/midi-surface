/* FX drawer — placeholder for Phase 8. */

import { memo } from 'react';

interface Props {
  onClose: () => void;
}

export const FXDrawer = memo(function FXDrawer({ onClose }: Props) {
  return (
    <div className="glass drawer flex flex-col p-4" data-open="">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          FX
        </span>
        <button type="button" onClick={onClose} className="header-btn">close</button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-sans text-[12px] text-muted">FX — coming in Phase 8.</p>
      </div>
    </div>
  );
});
