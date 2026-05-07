/*
  Global app hotkeys.

  Space  → play pulse        R → record pulse
  P      → perf mode toggle  Esc → exit fullscreen + perf mode
  1–4    → pad bank A–D

  Note: P conflicts with the QWERTY piano fallback (black key 3 octaves up).
  Acceptable since the piano fallback is secondary to touch input.
*/

import { useHotkeys } from 'react-hotkeys-hook';
import { midi } from '@/features/midi-engine/MidiEngine';
import { TRANSPORT_CC } from '@/features/midi-engine/defaults';
import { useSettingsStore } from '@/store/settingsStore';
import { usePerformanceStore } from '@/store/performanceStore';
import type { MidiChannel } from '@/features/midi-engine/types';

function sendTap(cc: number): void {
  const ch = useSettingsStore.getState().defaultChannel as MidiChannel;
  midi.cc(ch, cc, 127);
  setTimeout(() => midi.cc(ch, cc, 0), 50);
}

const OPTS = { preventDefault: true, enableOnFormTags: false } as const;

export function useAppHotkeys(): void {
  useHotkeys('space', () => sendTap(TRANSPORT_CC.play), OPTS);
  useHotkeys('r', () => sendTap(TRANSPORT_CC.record), OPTS);

  useHotkeys(
    'p',
    () => {
      const s = useSettingsStore.getState();
      s.setPerfMode(!s.perfMode);
    },
    OPTS,
  );

  useHotkeys(
    'escape',
    () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      const s = useSettingsStore.getState();
      if (s.perfMode) s.setPerfMode(false);
    },
    // Don't preventDefault on Esc — browser uses it to exit fullscreen natively.
    { preventDefault: false, enableOnFormTags: true },
  );

  useHotkeys('1', () => usePerformanceStore.getState().setPadBank('A'), OPTS);
  useHotkeys('2', () => usePerformanceStore.getState().setPadBank('B'), OPTS);
  useHotkeys('3', () => usePerformanceStore.getState().setPadBank('C'), OPTS);
  useHotkeys('4', () => usePerformanceStore.getState().setPadBank('D'), OPTS);
}
