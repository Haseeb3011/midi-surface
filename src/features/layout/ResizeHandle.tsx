/*
  ResizeHandle — bottom-right corner grip that changes a module's colSpan.

  On pointerdown, measures one grid column's width by dividing the module
  element's current width by its current colSpan. Then on pointermove (global,
  so the pointer can leave the handle), computes the new colSpan and snaps to
  the nearest valid value for this module type. Applies on pointerup.
*/

import { useRef, useCallback } from 'react';
import { useLayoutStore } from '@/store/layoutStore';
import type { ModuleInstance, ModuleType } from './types';

const MIN_COLSPAN: Record<ModuleType, 1 | 2 | 3 | 4> = {
  encoders:      2,
  display:       1,
  'transport-bar': 2,
  'mode-buttons':  1,
  pads:          1,
  wheels:        1,
  nav:           1,
  keyboard:      2,
  faders:        2,
  activity:      1,
};

function snapColSpan(raw: number, type: ModuleType): 1 | 2 | 3 | 4 {
  const min = MIN_COLSPAN[type];
  const valid = ([1, 2, 3, 4] as const).filter((v) => v >= min);
  let best = valid[0]!;
  let bestDist = Math.abs(raw - best);
  for (const v of valid) {
    const dist = Math.abs(raw - v);
    if (dist < bestDist) {
      best = v;
      bestDist = dist;
    }
  }
  return best;
}

interface Props {
  instance: ModuleInstance;
  pageId: string;
  moduleRef: React.RefObject<HTMLElement | null>;
}

export function ResizeHandle({ instance, pageId, moduleRef }: Props) {
  const setModuleColSpan = useLayoutStore((s) => s.setModuleColSpan);
  const dragState = useRef<{ startX: number; oneColWidth: number } | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current) return;
      const { startX, oneColWidth } = dragState.current;
      const rawSpan = instance.colSpan + (e.clientX - startX) / oneColWidth;
      const snapped = snapColSpan(rawSpan, instance.type);
      if (snapped !== instance.colSpan) {
        setModuleColSpan(pageId, instance.id, snapped);
      }
    },
    [instance, pageId, setModuleColSpan],
  );

  const onPointerUp = useCallback(() => {
    dragState.current = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  }, [onPointerMove]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = moduleRef.current;
      if (!el) return;
      const width = el.getBoundingClientRect().width;
      dragState.current = {
        startX: e.clientX,
        oneColWidth: width / instance.colSpan,
      };
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp, { once: true });
    },
    [instance, moduleRef, onPointerMove, onPointerUp],
  );

  return (
    <div
      onPointerDown={handlePointerDown}
      className="
        absolute bottom-0 right-0 flex h-5 w-5 cursor-ew-resize items-center
        justify-center rounded-tl-md bg-surfaceHi/60 text-[9px] text-muted
        transition hover:bg-accent/20 hover:text-accent select-none
      "
      title="Drag to resize"
    >
      ↔
    </div>
  );
}
