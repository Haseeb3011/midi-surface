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
    const persistedExists = ports.some((p) => p.type === 'output' && p.id === state.outputId);
    if (!state.outputId || !persistedExists) {
      // Prefer a port whose name looks like a loopMIDI / "MIDI Surface" virtual
      // port. Fall back to any connected output.
      const guess =
        ports.find((p) => p.type === 'output' && /loop|midi surface/i.test(p.name)) ??
        ports.find((p) => p.type === 'output' && p.state === 'connected');
      if (guess) state.setOutput(guess.id);
    }
  });
  void useMidiStore.getState().refreshPorts();
}
