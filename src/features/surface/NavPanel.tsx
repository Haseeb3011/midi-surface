/*
  NavPanel — right-column navigation controls.
  Up/Down navigate pad banks. Right advances the layout page.
  FX is a placeholder (Phase 8).
*/

import { memo } from 'react';
import { usePerformanceStore, type PadBank } from '@/store/performanceStore';
import { useLayoutStore } from '@/store/layoutStore';

const BANKS: PadBank[] = ['A', 'B', 'C', 'D'];

function NavBtn({ label, title, onPointerDown }: { label: string; title?: string; onPointerDown?: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onPointerDown={(e) => {
        e.preventDefault();
        onPointerDown?.();
      }}
      className="flex h-10 w-full items-center justify-center rounded-md bg-surfaceHi/60 font-mono text-[13px] text-muted transition hover:bg-surfaceHi hover:text-text select-none"
    >
      {label}
    </button>
  );
}

export const NavPanel = memo(function NavPanel() {
  const padBank = usePerformanceStore((s) => s.padBank);
  const setPadBank = usePerformanceStore((s) => s.setPadBank);
  const activePageIndex = useLayoutStore((s) => s.activePageIndex);
  const pageCount = useLayoutStore((s) => s.layout?.pages.length ?? 1);
  const setActivePage = useLayoutStore((s) => s.setActivePage);

  function shiftBank(dir: 1 | -1) {
    const idx = BANKS.indexOf(padBank);
    const next = BANKS[Math.max(0, Math.min(BANKS.length - 1, idx + dir))];
    if (next) setPadBank(next);
  }

  return (
    <section className="module-panel">
      <div className="flex flex-col gap-1.5">
        <NavBtn
          label="▲"
          title="Pad bank up"
          onPointerDown={() => shiftBank(-1)}
        />
        <NavBtn
          label="▼"
          title="Pad bank down"
          onPointerDown={() => shiftBank(1)}
        />
        <NavBtn
          label="▶"
          title="Next page"
          onPointerDown={() => setActivePage((activePageIndex + 1) % pageCount)}
        />
        <NavBtn label="FX" title="FX (coming soon)" />
      </div>
    </section>
  );
});
