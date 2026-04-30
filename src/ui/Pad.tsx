/*
  Drum pad primitive — fully imperative press visual.

  No React state on press / release. The pointer handlers toggle
  `data-active="1"` on the host div and write `--pad-glow` directly to its
  CSS custom property. The `.pad-cell[data-active='1']` selector in
  globals.css picks up the styling. Result: pressing 4 pads at once = 0
  React re-renders.

  Velocity is computed from `pressure` (touchscreens / pen) and falls back to
  Y-position within the pad. Multi-pointer aware (different fingers on
  different pads simultaneously).
*/

import { memo, useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, CSSProperties } from 'react';
import { useLearnable } from '@/ui/useLearnable';

interface PadProps {
  controlId: string;
  label?: string;
  /** 0..360 hue used for the glow color. */
  hue?: number;
  defaultVelocity?: number;
  onPress: (velocity: number) => void;
  onRelease: () => void;
  className?: string;
}

export const Pad = memo(function Pad({
  controlId,
  label,
  hue = 270,
  defaultVelocity = 100,
  onPress,
  onRelease,
  className = '',
}: PadProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Mutable ref instead of React state — no re-renders on press / release.
  const activePointerId = useRef<number | null>(null);
  const learn = useLearnable(controlId);

  const computeVelocity = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>): number => {
      const rect = ref.current?.getBoundingClientRect();
      if (e.pressure && e.pressure > 0 && e.pointerType !== 'mouse') {
        return Math.max(1, Math.min(127, Math.round(e.pressure * 127)));
      }
      if (rect) {
        const y = (e.clientY - rect.top) / rect.height;
        const v = Math.round((1 - y) * 64) + defaultVelocity - 32;
        return Math.max(20, Math.min(127, v));
      }
      return defaultVelocity;
    },
    [defaultVelocity],
  );

  const setActive = useCallback((on: boolean, glow = 0): void => {
    const el = ref.current;
    if (!el) return;
    if (on) {
      el.dataset.active = '1';
      el.style.setProperty('--pad-glow', glow.toFixed(3));
    } else {
      delete el.dataset.active;
    }
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (activePointerId.current !== null) return;
    if (learn.intercept(e)) return;
    e.preventDefault();
    ref.current?.setPointerCapture(e.pointerId);
    const velocity = computeVelocity(e);
    activePointerId.current = e.pointerId;
    setActive(true, 0.25 + (velocity / 127) * 0.85);
    onPress(velocity);
  };

  const release = useCallback((): void => {
    if (activePointerId.current === null) return;
    activePointerId.current = null;
    setActive(false);
    onRelease();
  }, [onRelease, setActive]);

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (activePointerId.current !== e.pointerId) return;
    ref.current?.releasePointerCapture?.(e.pointerId);
    release();
  };

  const handlePointerLeave = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (activePointerId.current !== e.pointerId) return;
    release();
  };

  const style: CSSProperties = {
    ['--pad-hue' as string]: `${hue}`,
  };

  return (
    <div
      ref={ref}
      data-control-id={controlId}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={
        'pad-cell ' +
        (learn.armed
          ? 'ring-2 ring-accent ring-offset-0 animate-pulse '
          : learn.learnMode
            ? 'ring-1 ring-accent/50 '
            : '') +
        className
      }
    >
      <div className="pad-cell-bg" />
      {label && <div className="pad-cell-label">{label}</div>}
    </div>
  );
});
