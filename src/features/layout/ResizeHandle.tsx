/*
  ResizeHandle — bottom-right corner grip that changes a module's colSpan.

  The key invariant: onPointerMove and onPointerUp are created ONCE (stable
  refs), registered once on pointerdown, and never need re-registration during
  a drag. All mutable state (startX, oneColWidth, startColSpan, current
  instance/pageId) lives in refs so the stable handlers always see fresh values.

  Prior bug: handlers closed over `instance.colSpan` at creation time. When
  snapping fired mid-drag, React recreated the callbacks but the old ones were
  still registered — causing the base colSpan to reset and jumps to repeat.
*/

import { useRef, useCallback, useEffect } from 'react';
import { useLayoutStore } from '@/store/layoutStore';
import type { ModuleInstance, ModuleType } from './types';

const MIN_COLSPAN: Record<ModuleType, 1 | 2 | 3 | 4> = {
  encoders:        2,
  display:         1,
  'transport-bar': 2,
  'mode-buttons':  1,
  pads:            1,
  wheels:          1,
  nav:             1,
  keyboard:        2,
  faders:          2,
  activity:        1,
};

function snapColSpan(raw: number, type: ModuleType): 1 | 2 | 3 | 4 {
  const min = MIN_COLSPAN[type];
  const valid = ([1, 2, 3, 4] as const).filter((v) => v >= min);
  let best = valid[0]!;
  let bestDist = Math.abs(raw - best);
  for (const v of valid) {
    const dist = Math.abs(raw - v);
    if (dist < bestDist) { best = v; bestDist = dist; }
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

  // Keep latest values in refs so stable handlers see them without re-registering.
  const instanceRef = useRef(instance);
  const pageIdRef = useRef(pageId);
  const setModuleColSpanRef = useRef(setModuleColSpan);
  useEffect(() => { instanceRef.current = instance; }, [instance]);
  useEffect(() => { pageIdRef.current = pageId; }, [pageId]);
  useEffect(() => { setModuleColSpanRef.current = setModuleColSpan; }, [setModuleColSpan]);

  // Drag state: startColSpan is fixed at pointerdown so all delta math stays stable.
  const dragState = useRef<{
    startX: number;
    oneColWidth: number;
    startColSpan: number;
  } | null>(null);

  // Stable handlers — never change identity, registered once per drag.
  const onPointerMove = useRef((e: PointerEvent) => {
    if (!dragState.current) return;
    const { startX, oneColWidth, startColSpan } = dragState.current;
    const inst = instanceRef.current;
    const rawSpan = startColSpan + (e.clientX - startX) / oneColWidth;
    const snapped = snapColSpan(rawSpan, inst.type);
    setModuleColSpanRef.current(pageIdRef.current, inst.id, snapped);
  }).current;

  const onPointerUp = useRef(() => {
    dragState.current = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  }).current;

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
        startColSpan: instance.colSpan,
      };
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp, { once: true });
    },
    [instance.colSpan, moduleRef, onPointerMove, onPointerUp],
  );

  return (
    <div
      onPointerDown={handlePointerDown}
      className="
        absolute bottom-0 right-0 z-10 flex h-6 w-6 cursor-ew-resize items-center
        justify-center rounded-tl-md bg-surfaceHi/80 text-[10px] text-muted
        transition hover:bg-accent/30 hover:text-accent select-none
      "
      title="Drag to resize (snaps to grid)"
    >
      ↔
    </div>
  );
}
