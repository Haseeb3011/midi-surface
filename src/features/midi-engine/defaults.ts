/*
  Default MIDI mappings for every built-in control.

  These are the "factory" assignments. The Phase 3 customization editor will let
  users override per-control. For now they're hard-coded — chosen to be friendly
  to FL Studio's default MIDI Learn and Ableton Live's user-mode MIDI map.
*/

import type { MidiChannel } from './types';
import type { PadBank } from '@/store/performanceStore';

/** Pad grids: 16 notes per bank, all on the GM drum channel (10 → index 9). */
export const PAD_BANK_START: Record<PadBank, number> = {
  A: 36, // C1 — kick at start (FPC default-ish)
  B: 52,
  C: 68,
  D: 84,
};

export const PAD_CHANNEL: MidiChannel = 9;

export function padNoteFor(bank: PadBank, index: number): number {
  return Math.min(127, PAD_BANK_START[bank] + index);
}

/** 8 knobs → CC 16..23 on the user's default channel. */
export const KNOB_CC_BASE = 16;

/** 8 faders → CC 20..27 on the user's default channel. */
export const FADER_CC_BASE = 20;

/** Mod wheel = standard CC 1. */
export const MOD_WHEEL_CC = 1;

/** Transport — generic CC pulses (127 on press, 0 on release). */
export const TRANSPORT_CC = {
  play: 118,
  stop: 117,
  record: 119,
  loop: 116,
  metronome: 115,
} as const;
export type TransportKey = keyof typeof TRANSPORT_CC;

/** Stable controlId helpers — used by learnStore, must not change. */
export const controlId = {
  pad: (bank: PadBank, i: number) => `pad:${bank}:${i}`,
  knob: (i: number) => `knob:${i}`,
  fader: (i: number) => `fader:${i}`,
  pitchBend: () => 'wheel:pitch',
  modWheel: () => 'wheel:mod',
  transport: (key: TransportKey) => `transport:${key}`,
  pianoKey: (note: number) => `piano:${note}`,
} as const;
