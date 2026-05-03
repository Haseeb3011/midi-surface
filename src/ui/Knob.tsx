/*
  Rotary knob primitive.

  - Pointer-drag: vertical movement changes value.
  - Sensitivity: ~200 px = full 0..127 range. Shift / pen-erase / two-finger
    intent → 5× finer.
  - Wheel: 1 step per detent, +Shift = 4 steps.
  - Double-tap / double-click: snap to default value.
  - SVG arc indicator from -135° to +135°, glow scales with proximity to extremes.
*/

import { memo, useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useLearnable } from '@/ui/useLearnable';

interface KnobProps {
  controlId: string;
  label?: string;
  value: number; // 0..127
  defaultValue?: number;
  min?: number;
  max?: number;
  hue?: number;
  size?: number; // px
  onChange: (v: number) => void;
}

const ARC_START = -135;
const ARC_END = 135;
const ARC_SWEEP = ARC_END - ARC_START; // 270deg
const SENSITIVITY_PX = 200;

export const Knob = memo(function Knob({
  controlId,
  label,
  value,
  defaultValue = 64,
  min = 0,
  max = 127,
  hue = 270,
  size = 64,
  onChange,
}: KnobProps) {
  const dragging = useRef<{ startY: number; startValue: number; pointerId: number } | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const learn = useLearnable(controlId);

  const clamp = useCallback((v: number) => Math.max(min, Math.min(max, v)), [min, max]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (learn.intercept(e)) return;
    if (dragging.current) return;
    e.preventDefault();
    ref.current?.setPointerCapture(e.pointerId);
    dragging.current = { startY: e.clientY, startValue: value, pointerId: e.pointerId };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging.current || dragging.current.pointerId !== e.pointerId) return;
    const fine = e.shiftKey;
    const dy = dragging.current.startY - e.clientY;
    const range = max - min;
    const px = fine ? SENSITIVITY_PX * 5 : SENSITIVITY_PX;
    const next = clamp(dragging.current.startValue + (dy / px) * range);
    onChange(Math.round(next));
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging.current || dragging.current.pointerId !== e.pointerId) return;
    ref.current?.releasePointerCapture?.(e.pointerId);
    dragging.current = null;
  };

  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    const step = e.shiftKey ? 4 : 1;
    const dir = e.deltaY > 0 ? -1 : 1;
    onChange(clamp(value + dir * step));
  };

  const handleDoubleClick = (): void => {
    onChange(clamp(defaultValue));
  };

  const norm = (value - min) / (max - min);
  const angle = ARC_START + norm * ARC_SWEEP;
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const arcLen = 2 * Math.PI * r * (ARC_SWEEP / 360);
  const filled = arcLen * norm;

  // Polar angle for the indicator line.
  const rad = (angle * Math.PI) / 180;

  return (
    <div
      ref={ref}
      data-control-id={controlId}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      className={
        'group relative flex select-none flex-col items-center justify-center ' +
        (learn.armed
          ? 'rounded-full ring-2 ring-accent animate-pulse'
          : learn.learnMode
            ? 'rounded-full ring-1 ring-accent/50'
            : '')
      }
      style={{ touchAction: 'none' }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        style={{ filter: `drop-shadow(0 0 6px hsl(${hue} 90% 60% / ${0.06 + norm * 0.22}))` }}
      >
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(var(--border-soft))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${1000}`}
          transform={`rotate(${ARC_START + 90} ${cx} ${cy})`}
        />
        {/* filled arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`hsl(${hue} 90% 65%)`}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${1000}`}
          transform={`rotate(${ARC_START + 90} ${cx} ${cy})`}
        />
        {/* knob body — recessed look via two stacked circles */}
        <circle
          cx={cx}
          cy={cy}
          r={r - 7}
          fill="rgb(var(--surface-low))"
          stroke="rgb(var(--border-soft))"
          strokeWidth={1}
        />
        <circle
          cx={cx}
          cy={cy - 1}
          r={r - 9}
          fill="rgb(var(--surface-hi))"
          opacity={0.85}
        />
        {/* indicator — thin line from rim inward (LANDR style) */}
        <line
          x1={cx + Math.sin(rad) * (r - 9)}
          y1={cy - Math.cos(rad) * (r - 9)}
          x2={cx + Math.sin(rad) * (r - 4)}
          y2={cy - Math.cos(rad) * (r - 4)}
          stroke={`hsl(${hue} 95% 78%)`}
          strokeWidth={1.75}
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1.5 flex flex-col items-center leading-tight">
        {label && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</span>
        )}
        <span className="font-sans text-[10px] tabular-nums text-textSoft">{value}</span>
      </div>
    </div>
  );
});
