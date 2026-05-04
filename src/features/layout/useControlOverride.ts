/*
  Control override accessors.

  Both the hook (render path) and the synchronous getter (MIDI send path) read
  from `layoutStore.moduleIndex` — a Map<id, ModuleInstance> rebuilt on every
  layout mutation. That makes lookup O(1) regardless of how many pages or
  modules the user has. The selector closure is stable per (moduleId, controlId)
  pair via useMemo, so Zustand's shallow-equality check can short-circuit on
  unchanged overrides instead of re-running across all subscribers.
*/

import { useMemo } from 'react';
import { useLayoutStore } from '@/store/layoutStore';
import type { ControlOverride } from './types';

export function useControlOverride(
  moduleId: string,
  controlId: string,
): ControlOverride | null {
  const selector = useMemo(
    () =>
      (s: ReturnType<typeof useLayoutStore.getState>): ControlOverride | null => {
        if (!moduleId) return null;
        const m = s.moduleIndex.get(moduleId);
        if (!m) return null;
        return m.overrides?.controls?.[controlId] ?? null;
      },
    [moduleId, controlId],
  );
  return useLayoutStore(selector);
}

export function getControlOverride(
  moduleId: string,
  controlId: string,
): ControlOverride | null {
  if (!moduleId) return null;
  const m = useLayoutStore.getState().moduleIndex.get(moduleId);
  if (!m) return null;
  return m.overrides?.controls?.[controlId] ?? null;
}
