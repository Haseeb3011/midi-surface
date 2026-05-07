/*
  settingsStore — persistent user preferences.

  Persists to localStorage so cold-starts immediately recall the user's last
  output port, default channel, and global toggles. Preset / layout data lives
  in Dexie (see src/persistence/db.ts in Phase 3).
*/

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MidiChannel } from '@/features/midi-engine/types';
import { debouncedLocalStorage } from '@/persistence/debouncedStorage';

export type ThemeName = 'landr' | 'vital' | 'cyber' | 'sunset' | 'mono';
export const THEME_NAMES: ThemeName[] = ['landr', 'vital', 'cyber', 'sunset', 'mono'];

interface SettingsState {
  /** Persisted output port id; `MidiEngine` is wired up from this on boot. */
  outputId: string | null;
  inputId: string | null;
  defaultChannel: MidiChannel;
  octave: number;
  velocity: number;
  /** Quiet panic: emit All-Notes-Off on every channel when the app loses focus. */
  panicOnBlur: boolean;
  /** Show the activity monitor pane. */
  activityVisible: boolean;
  theme: ThemeName;
  /** Number of octaves rendered by the piano keyboard (1..7). */
  pianoOctaves: number;
  /** Piano keyboard height in px. */
  pianoHeight: number;
  /** Perf mode: hide header chrome so the surface fills the screen. Toggle with P. */
  perfMode: boolean;

  setOutputId: (id: string | null) => void;
  setInputId: (id: string | null) => void;
  setDefaultChannel: (ch: MidiChannel) => void;
  setOctave: (octave: number) => void;
  setVelocity: (v: number) => void;
  setPanicOnBlur: (v: boolean) => void;
  setActivityVisible: (v: boolean) => void;
  setTheme: (t: SettingsState['theme']) => void;
  setPianoOctaves: (n: number) => void;
  setPianoHeight: (h: number) => void;
  setPerfMode: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      outputId: null,
      inputId: null,
      defaultChannel: 0,
      octave: 4,
      velocity: 100,
      panicOnBlur: true,
      activityVisible: false,
      theme: 'landr' as ThemeName,
      pianoOctaves: 3,
      pianoHeight: 200,
      perfMode: false,

      setOutputId: (id) => set({ outputId: id }),
      setInputId: (id) => set({ inputId: id }),
      setDefaultChannel: (defaultChannel) => set({ defaultChannel }),
      setOctave: (octave) => set({ octave: Math.max(0, Math.min(8, octave)) }),
      setVelocity: (velocity) => set({ velocity: Math.max(1, Math.min(127, velocity)) }),
      setPanicOnBlur: (panicOnBlur) => set({ panicOnBlur }),
      setActivityVisible: (activityVisible) => set({ activityVisible }),
      setTheme: (theme) => set({ theme }),
      setPianoOctaves: (n) => set({ pianoOctaves: Math.max(1, Math.min(7, Math.round(n))) }),
      setPianoHeight: (h) => set({ pianoHeight: Math.max(100, Math.min(360, Math.round(h))) }),
      setPerfMode: (perfMode) => set({ perfMode }),
    }),
    {
      name: 'midi-surface-settings',
      version: 4,
      storage: createJSONStorage(() => debouncedLocalStorage(300)),
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<SettingsState>;
        if (version < 3) {
          // Legacy 'default' theme maps to the new LANDR default.
          const legacyTheme = (s.theme as string | undefined) ?? 'landr';
          s.theme = (legacyTheme === 'default' ? 'landr' : legacyTheme) as ThemeName;
        }
        s.perfMode ??= false;
        return s as SettingsState;
      },
    },
  ),
);
