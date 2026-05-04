/*
  Transport / momentary or latched button.

  - Momentary: fires onPress on pointerdown, onRelease on pointerup.
  - Latched: visual `active` prop reflects state; tap toggles via parent.

  Press visuals are imperative (data-pressed + CSS var) — no React state on
  the press path, matching the Pad / piano-key idiom. The active prop still
  flows through React because it's owned by performanceStore.
*/

import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { memo, useCallback, useRef } from 'react';
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
  const ref = useRef<HTMLButtonElement | null>(null);
  const pressed = useRef(false);
  const learn = useLearnable(controlId);

  const setPressedVisual = useCallback((on: boolean): void => {
    const el = ref.current;
    if (!el) return;
    if (on) el.dataset.pressed = '1';
    else el.removeAttribute('data-pressed');
  }, []);

  const handleDown = (e: ReactPointerEvent<HTMLButtonElement>): void => {
    if (learn.intercept(e)) return;
    e.preventDefault();
    pressed.current = true;
    setPressedVisual(true);
    onPress?.();
    onTap?.();
  };

  const handleUp = (): void => {
    if (!pressed.current) return;
    pressed.current = false;
    setPressedVisual(false);
    onRelease?.();
  };

  return (
    <button
      ref={ref}
      type="button"
      data-control-id={controlId}
      data-active={active ? '1' : undefined}
      style={{ ['--btn-hue' as string]: String(hue) }}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
      className={
        'transport-btn ' +
        (learn.armed
          ? 'ring-2 ring-accent animate-pulse '
          : learn.learnMode
            ? 'ring-1 ring-accent/50 '
            : '')
      }
    >
      {icon && <span className="text-sm leading-none">{icon}</span>}
      <span>{label}</span>
    </button>
  );
});
