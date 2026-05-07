/*
  learnStore — MIDI Learn assignments.

  A control opts in by setting `armed` to its `controlId`. The next inbound MIDI
  event that matches a learnable shape (note / cc / pitchBend / programChange)
  becomes the assignment. Assignments persist to localStorage.

  Phase 1 only stores assignments; controls don't react to them yet — that wiring
  comes in Phase 2 when actual modules exist.
*/

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LearnAssignment, LearnTarget, MidiChannel, MidiEvent } from '@/features/midi-engine/types';
import { debouncedLocalStorage } from '@/persistence/debouncedStorage';

interface LearnState {
  /** Global learn mode toggle. While true, taps arm controls instead of playing them. */
  learnMode: boolean;
  /** controlId currently armed for capture, or null. */
  armed: string | null;
  /** controlId -> assignment */
  assignments: Record<string, LearnAssignment>;

  setLearnMode: (v: boolean) => void;
  toggleLearnMode: () => void;
  arm: (controlId: string | null) => void;
  /** Convenience: arm if not armed, unarm if already armed. */
  toggleArm: (controlId: string) => void;
  unassign: (controlId: string) => void;
  /** Capture the next learnable event into the armed control. Returns true if applied. */
  captureFromEvent: (e: MidiEvent) => boolean;
  /** Bulk-restore assignments (used by settings import). */
  setAssignments: (assignments: Record<string, LearnAssignment>) => void;
}

function eventToTarget(e: MidiEvent): LearnTarget | null {
  const ch = e.channel as MidiChannel | undefined;
  if (ch === undefined) return null;
  switch (e.kind) {
    case 'noteOn':
      if (e.data1 === undefined) return null;
      return { kind: 'note', channel: ch, note: e.data1 };
    case 'cc':
      if (e.data1 === undefined) return null;
      return { kind: 'cc', channel: ch, cc: e.data1 };
    case 'pitchBend':
      return { kind: 'pitchBend', channel: ch };
    case 'programChange':
      if (e.data1 === undefined) return null;
      return { kind: 'programChange', channel: ch, program: e.data1 };
    default:
      return null;
  }
}

export const useLearnStore = create<LearnState>()(
  persist(
    (set, get) => ({
      learnMode: false,
      armed: null,
      assignments: {},

      setLearnMode: (v) => set({ learnMode: v, armed: v ? get().armed : null }),
      toggleLearnMode: () =>
        set((s) => ({ learnMode: !s.learnMode, armed: s.learnMode ? null : s.armed })),
      arm: (controlId) => set({ armed: controlId }),
      toggleArm: (controlId) =>
        set((s) => ({ armed: s.armed === controlId ? null : controlId })),
      unassign: (controlId) =>
        set((s) => {
          const next = { ...s.assignments };
          delete next[controlId];
          return { assignments: next };
        }),
      setAssignments: (assignments) => set({ assignments }),
      captureFromEvent: (e) => {
        const armed = get().armed;
        if (!armed || e.direction !== 'in') return false;
        const target = eventToTarget(e);
        if (!target) return false;
        set((s) => ({
          armed: null,
          assignments: { ...s.assignments, [armed]: { controlId: armed, target } },
        }));
        return true;
      },
    }),
    {
      name: 'midi-surface-learn',
      version: 1,
      storage: createJSONStorage(() => debouncedLocalStorage(300)),
      partialize: (s) => ({ assignments: s.assignments }),
    },
  ),
);
