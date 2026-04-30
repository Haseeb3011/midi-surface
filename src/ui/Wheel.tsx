/*
  Generic vertical "wheel" primitive used for both pitch bend and mod wheel.

  Pitch wheel ergonomics:
    - center detent at 50%
    - springs back to center on release
    - 14-bit value range (0..16383, center 8192)

  Mod wheel ergonomics:
    - 7-bit (0..127)
    - sticky — does not spring back
*/

import { memo, useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useLearnable } from '@/ui/useLearnable';

interface WheelProps {
  controlId: string;
  label: string;
  value: number;
  min: number;
  max: number;
  /** If true, returns to `defaultValue` on release. */
  springBack?: boolean;
  defaultValue?: number;
  hue?: number;
  height?: number;
  onChange: (v: number) => void;
}

export const Wheel = memo(function Wheel({
  controlId,
  label,
  value,
  min,
  max,
  springBack = false,
  defaultValue,
  hue = 270,
  height = 200,
  onChange,
}: WheelProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<number | null>(null);
  const rafSpring = useRef<number | null>(null);
  const learn = useLearnable(controlId);

  const clamp = useCallback((v: number) => Math.max(min, Math.min(max, v)), [min, max]);

  const updateFromY = useCallback(
    (clientY: number): void => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = 1 - (clientY - rect.top) / rect.height;
      onChange(clamp(min + ratio * (max - min)));
    },
    [clamp, min, max, onChange],
  );

  const cancelSpring = useCallback((): void => {
    if (rafSpring.current !== null) {
      cancelAnimationFrame(rafSpring.current);
      rafSpring.current = null;
    }
  }, []);

  const startSpring = useCallback((): void => {
    if (!springBack || defaultValue === undefined) return;
    cancelSpring();
    const target = defaultValue;
    const tick = (): void => {
      // Read latest value from caller-provided closure via DOM data-attr is overkill;
      // instead we rely on `value` from the next render; spring physics done in caller
      // is fine for now via simple lerp on the parent. Phase 4 may switch to a worklet.
      // Here we just animate by delegating once to the parent: it is the parent's job
      // to ease toward `defaultValue` if it wants smoother motion. We do a single hard
      // snap instead.
      onChange(target);
    };
    rafSpring.current = requestAnimationFrame(tick);
  }, [springBack, defaultValue, onChange, cancelSpring]);

  useEffect(() => () => cancelSpring(), [cancelSpring]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (learn.intercept(e)) return;
    e.preventDefault();
    cancelSpring();
    ref.current?.setPointerCapture(e.pointerId);
    dragging.current = e.pointerId;
    updateFromY(e.clientY);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (dragging.current !== e.pointerId) return;
    updateFromY(e.clientY);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (dragging.current !== e.pointerId) return;
    ref.current?.releasePointerCapture?.(e.pointerId);
    dragging.current = null;
    if (springBack) startSpring();
  };

  const norm = (value - min) / (max - min);
  const thumbBottom = `${norm * 100}%`;

  return (
    <div className="flex select-none flex-col items-center" style={{ touchAction: 'none' }}>
      <div
        ref={ref}
        data-control-id={controlId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={
          'relative w-9 overflow-hidden rounded-2xl border border-border/60 bg-surface ' +
          (learn.armed
            ? 'ring-2 ring-accent animate-pulse'
            : learn.learnMode
              ? 'ring-1 ring-accent/50'
              : '')
        }
        style={{ height }}
      >
        {/* center detent for pitch wheel */}
        {springBack && (
          <div
            className="pointer-events-none absolute inset-x-1 h-px bg-accent/40"
            style={{ bottom: '50%' }}
          />
        )}
        {/* thumb */}
        <div
          className="pointer-events-none absolute left-1 right-1 h-6 rounded-md"
          style={{
            bottom: `calc(${thumbBottom} - 12px)`,
            background: `linear-gradient(180deg, hsl(${hue} 90% 70%), hsl(${hue} 90% 45%))`,
            boxShadow: `0 0 16px hsl(${hue} 90% 60% / 0.55)`,
            transition: dragging.current === null ? 'bottom 200ms cubic-bezier(0.2, 0.9, 0.2, 1)' : 'none',
          }}
        />
      </div>
      <div className="mt-2 flex flex-col items-center">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      </div>
    </div>
  );
});
