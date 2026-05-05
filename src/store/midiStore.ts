/*
  midiStore — port state only. No event buffer here.

  Live MIDI events are NOT pushed through Zustand. The MidiEngine fires
  listeners only when there are subscribers (Activity Monitor mounted, or
  Learn mode on). During normal play the entire send path is allocation-free
  and React-render-free.
*/

import { create } from 'zustand';
import type { MidiPortInfo } from '@/features/midi-engine/types';
import { midi } from '@/features/midi-engine/MidiEngine';

// Windows built-in MIDI devices that are never useful as a DAW target.
// They are still shown in the output picker so the user can manually choose
// them, but auto-select skips them in favour of a real virtual port.
const SYSTEM_MIDI_RE = /microsoft gs wavetable|microsoft midi mapper/i;

interface MidiState {
  ports: MidiPortInfo[];
  outputId: string | null;
  inputId: string | null;

  setOutput: (id: string | null) => void;
  setInput: (id: string | null) => void;
  refreshPorts: () => Promise<void>;
}

export const useMidiStore = create<MidiState>((set) => ({
  ports: [],
  outputId: null,
  inputId: null,

  setOutput: (id) => {
    midi.selectOutput(id);
    set({ outputId: id });
  },
  setInput: (id) => {
    midi.selectInput(id);
    set({ inputId: id });
  },
  refreshPorts: async () => {
    await midi.refreshNativeOutputs();
    set({ ports: midi.listPorts() });
  },
}));

let initialized = false;

export function bootstrapMidiStore(): void {
  if (initialized) return;
  initialized = true;

  midi.onPortsChanged((ports) => {
    useMidiStore.setState({ ports });
    const state = useMidiStore.getState();

    const currentPort = ports.find((p) => p.type === 'output' && p.id === state.outputId);
    const persistedExists = !!currentPort;
    // True if current selection is already a preferred virtual port.
    const currentIsPreferred = persistedExists && /loop|midi surface/i.test(currentPort!.name);
    // True if a preferred virtual port just became available.
    const preferredAvailable = ports.some(
      (p) => p.type === 'output' && /loop|midi surface/i.test(p.name),
    );

    // Re-pick when: no selection, selection disappeared, or a preferred port
    // arrived while we were stuck on a system fallback (GS Wavetable, etc.).
    if (!state.outputId || !persistedExists || (!currentIsPreferred && preferredAvailable)) {
      const guess =
        ports.find((p) => p.type === 'output' && /loop|midi surface/i.test(p.name)) ??
        ports.find(
          (p) => p.type === 'output' && p.state === 'connected' && !SYSTEM_MIDI_RE.test(p.name),
        );
      if (guess) state.setOutput(guess.id);
    }
  });
  void useMidiStore.getState().refreshPorts();
}
