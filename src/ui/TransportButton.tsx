/*
  Transport / momentary or latched button.

  - Momentary: fires onPress on pointerdown, onRelease on pointerup.
  - Latched: visual `active` prop reflects state; tap toggles via parent.

  Visuals: pill-shaped glass button with accent glow when active or pressed.
*/

import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { memo, useState } from 'react';
import { useLearnable } from '@/ui/useLearnable';

interface TransportButtonProps {
  controlId: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  hue?: number;
  onPress?: () => void;
  onRelease?: () => void;
  onTap?: () => void;
}

export const TransportButton = memo(function TransportButton({
  controlId,
  label,
  icon,
  active = false,
  hue = 270,
  onPress,
  onRelease,
  onTap,
}: TransportButtonProps) {
  const [pressed, setPressed] = useState(false);
  const learn = useLearnable(controlId);

  const handleDown = (e: ReactPointerEvent<HTMLButtonElement>): void => {
    if (learn.intercept(e)) return;
    e.preventDefault();
    setPressed(true);
    onPress?.();
    onTap?.();
  };

  const handleUp = (): void => {
    if (!pressed) return;
    setPressed(false);
    onRelease?.();
  };

  const glow = active || pressed;

  return (
    <button
      type="button"
      data-control-id={controlId}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
      className={
        'flex h-9 select-none items-center gap-2 rounded-md border border-borderSoft bg-surfaceLow px-3 ' +
        'font-sans text-[11px] font-medium tracking-[0.08em] text-muted transition-[transform,box-shadow,color,background] duration-100 ' +
        'active:scale-[0.97] ' +
        (glow ? 'text-text bg-surfaceHi ' : 'hover:text-text hover:bg-surfaceHi ') +
        (learn.armed
          ? 'ring-2 ring-accent animate-pulse '
          : learn.learnMode
            ? 'ring-1 ring-accent/50 '
            : '')
      }
      style={{
        boxShadow: glow
          ? `0 0 12px hsl(${hue} 88% 60% / 0.45), inset 0 0 0 1px hsl(${hue} 88% 60% / 0.4)`
          : '',
      }}
    >
      {icon && <span className="text-sm leading-none">{icon}</span>}
      <span>{label}</span>
    </button>
  );
});
