/*
  Control override accessors.

  Two forms:
  - useControlOverride (React hook) — subscribe to override in render paths
    (label display, color). Triggers re-render only when this specific control's
    override changes.
  - getControlOverride (pure getter) — reads Zustand state synchronously for
    the MIDI send path. No React, no subscription, zero overhead when null.
*/

import { useLayoutStore } from '@/store/layoutStore';
import type { ControlOverride } from './types';

export function useControlOverride(
  moduleId: string,
  controlId: string,
): ControlOverride | null {
  return useLayoutStore((s) => {
    if (!s.layout) return null;
    for (const page of s.layout.pages) {
      const mod = page.modules.find((m) => m.id === moduleId);
      if (mod) return mod.overrides?.controls?.[controlId] ?? null;
    }
    return null;
  });
}

export function getControlOverride(
  moduleId: string,
  controlId: string,
): ControlOverride | null {
  const { layout } = useLayoutStore.getState();
  if (!layout) return null;
  for (const page of layout.pages) {
    const mod = page.modules.find((m) => m.id === moduleId);
    if (mod) return mod.overrides?.controls?.[controlId] ?? null;
  }
  return null;
}
