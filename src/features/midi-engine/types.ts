/*
  Shared MIDI engine types.

  Channels here are 0-indexed (0..15) — friendlier for arithmetic. The UI
  displays them as 1..16, conversion happens at the edge.
*/

export type MidiChannel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface MidiPortInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  type: 'input' | 'output';
}

export type MidiEventKind =
  | 'noteOn'
  | 'noteOff'
  | 'cc'
  | 'pitchBend'
  | 'channelPressure'
  | 'polyPressure'
  | 'programChange'
  | 'clock'
  | 'start'
  | 'stop'
  | 'continue'
  | 'sysex'
  | 'unknown';

export interface MidiEvent {
  ts: number;
  direction: 'in' | 'out';
  kind: MidiEventKind;
  channel?: MidiChannel;
  data1?: number;
  data2?: number;
  /** Only populated for inbound messages (sysex / unknown display). */
  raw?: number[];
  portId?: string;
  portName?: string;
}

export type LearnTarget =
  | { kind: 'note'; channel: MidiChannel; note: number }
  | { kind: 'cc'; channel: MidiChannel; cc: number }
  | { kind: 'pitchBend'; channel: MidiChannel }
  | { kind: 'programChange'; channel: MidiChannel; program: number };

export interface LearnAssignment {
  controlId: string;
  target: LearnTarget;
  inverted?: boolean;
  min?: number;
  max?: number;
}
