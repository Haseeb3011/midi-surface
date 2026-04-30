/*
  Vertical fader primitive.

  - Pointer-down anywhere on the track jumps to that position.
  - Drag to set; pointer capture follows finger off the track.
  - Wheel to nudge by 1 (shift = 4).
  - Double-tap = snap to default.
*/

import { memo, useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useLearnable } from '@/ui/useLearnable';

interface FaderProps {
  controlId: string;
  label?: string;
  value: number; // 0..127
  defaultValue?: number;
  hue?: number;
  height?: number;
  onChange: (v: number) => void;
}

export const Fader = memo(function Fader({
  controlId,
  label,
  value,
  defaultValue = 100,
  hue = 270,
  height = 180,
  onChange,
}: FaderProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<number | null>(null);
  const learn = useLearnable(controlId);

  const clamp = useCallback((v: number) => Math.max(0, Math.min(127, Math.round(v))), []);

  const updateFromY = useCallback(
    (clientY: number): void => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = 1 - (clientY - rect.top) / rect.height;
      onChange(clamp(ratio * 127));
    },
    [clamp, onChange],
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (learn.intercept(e)) return;
    e.preventDefault();
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
  };

  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    const step = e.shiftKey ? 4 : 1;
    const dir = e.deltaY > 0 ? -1 : 1;
    onChange(clamp(value + dir * step));
  };

  const norm = value / 127;
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
        onWheel={handleWheel}
        onDoubleClick={() => onChange(clamp(defaultValue))}
        className={
          'relative w-7 rounded-full border border-border/60 bg-surface ' +
          (learn.armed
            ? 'ring-2 ring-accent animate-pulse'
            : learn.learnMode
              ? 'ring-1 ring-accent/50'
              : '')
        }
        style={{ height }}
      >
        {/* track fill */}
        <div
          className="pointer-events-none absolute inset-x-1 bottom-1 rounded-full"
          style={{
            height: thumbBottom,
            background: `linear-gradient(180deg, hsl(${hue} 90% 65% / 0.65), hsl(${hue} 90% 50% / 0.85))`,
            boxShadow: `0 0 12px hsl(${hue} 90% 60% / ${0.25 + norm * 0.4})`,
            transition: 'height 60ms ease-out',
          }}
        />
        {/* thumb */}
        <div
          className="pointer-events-none absolute left-1/2 h-3 w-[110%] -translate-x-1/2 rounded-md bg-text/90 shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
          style={{
            bottom: `calc(${thumbBottom} - 6px)`,
            transition: 'bottom 60ms ease-out',
          }}
        />
      </div>
      <div className="mt-2 flex flex-col items-center">
        {label && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
        )}
        <span className="font-mono text-[10px] text-text/80">{value}</span>
      </div>
    </div>
  );
});
