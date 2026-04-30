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
        'flex select-none items-center gap-2 rounded-xl border border-border/60 bg-surface px-3 py-2 ' +
        'font-mono text-xs uppercase tracking-widest text-muted transition-[transform,box-shadow,color] duration-100 ' +
        'active:scale-[0.97] ' +
        (glow ? 'text-text ' : 'hover:text-text ') +
        (learn.armed
          ? 'ring-2 ring-accent animate-pulse '
          : learn.learnMode
            ? 'ring-1 ring-accent/50 '
            : '')
      }
      style={{
        boxShadow: glow ? `0 0 18px hsl(${hue} 90% 60% / 0.7), inset 0 0 0 1px hsl(${hue} 90% 60% / 0.5)` : '',
      }}
    >
      {icon && <span className="text-base leading-none">{icon}</span>}
      <span>{label}</span>
    </button>
  );
});
