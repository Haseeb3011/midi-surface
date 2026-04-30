/*
  Returns the learn-state for a given controlId so widgets can render an
  "armed" outline and intercept tap behavior when global Learn mode is on.

  Widgets call:
    const { learnMode, armed, intercept } = useLearnable(id);
    // intercept(e) — call from pointerdown; returns true if the gesture was
    // consumed by the learn flow (caller should bail out of normal play).
*/

import type { PointerEvent as ReactPointerEvent } from 'react';
import { useLearnStore } from '@/store/learnStore';

export interface LearnableHandle {
  learnMode: boolean;
  armed: boolean;
  /** Call from pointerdown / click. Returns true if the event was consumed. */
  intercept: (e?: ReactPointerEvent | MouseEvent) => boolean;
}

export function useLearnable(controlId: string): LearnableHandle {
  const learnMode = useLearnStore((s) => s.learnMode);
  const armed = useLearnStore((s) => s.armed === controlId);

  const intercept: LearnableHandle['intercept'] = (e) => {
    if (!learnMode) return false;
    e?.stopPropagation?.();
    e?.preventDefault?.();
    useLearnStore.getState().toggleArm(controlId);
    return true;
  };

  return { learnMode, armed, intercept };
}
