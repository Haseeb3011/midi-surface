/*
  performanceStore — runtime state for the live surface.

  Persists per-control values so the surface "remembers" what every fader / knob /
  latch was at when you reload. Pad bank also persists.
*/

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { debouncedLocalStorage } from '@/persistence/debouncedStorage';

export type PadBank = 'A' | 'B' | 'C' | 'D';

interface PerformanceState {
  padBank: PadBank;
  knobs: number[]; // length 8, 0..127
  faders: number[]; // length 8, 0..127
  modWheel: number; // 0..127
  loop: boolean;
  metronome: boolean;
  tempo: number; // BPM, decoupled from MIDI clock for now

  setPadBank: (bank: PadBank) => void;
  setKnob: (i: number, value: number) => void;
  setFader: (i: number, value: number) => void;
  setModWheel: (v: number) => void;
  setLoop: (v: boolean) => void;
  setMetronome: (v: boolean) => void;
  setTempo: (bpm: number) => void;
}

const KNOB_DEFAULTS = [64, 64, 64, 64, 64, 64, 64, 64];
const FADER_DEFAULTS = [100, 100, 100, 100, 100, 100, 100, 100];

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      padBank: 'A',
      knobs: KNOB_DEFAULTS.slice(),
      faders: FADER_DEFAULTS.slice(),
      modWheel: 0,
      loop: false,
      metronome: false,
      tempo: 120,

      setPadBank: (padBank) => set({ padBank }),
      setKnob: (i, value) =>
        set((s) => {
          const knobs = s.knobs.slice();
          knobs[i] = clamp7(value);
          return { knobs };
        }),
      setFader: (i, value) =>
        set((s) => {
          const faders = s.faders.slice();
          faders[i] = clamp7(value);
          return { faders };
        }),
      setModWheel: (modWheel) => set({ modWheel: clamp7(modWheel) }),
      setLoop: (loop) => set({ loop }),
      setMetronome: (metronome) => set({ metronome }),
      setTempo: (tempo) => set({ tempo: Math.max(20, Math.min(300, Math.round(tempo))) }),
    }),
    {
      name: 'midi-surface-performance',
      version: 1,
      storage: createJSONStorage(() => debouncedLocalStorage(300)),
    },
  ),
);

function clamp7(v: number): number {
  return Math.max(0, Math.min(127, Math.round(v)));
}
