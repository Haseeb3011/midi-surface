/*
  Layout system types.

  A Layout contains one or more LayoutPages. Each page is a flat sorted array of
  ModuleInstances rendered into a 4-column CSS Grid. Modules span 1–4 columns.

  New in design-phase redesign:
  - Extended ModuleType set (encoders, display, transport-bar, mode-buttons, nav)
  - ModuleProps discriminated union for per-type configurable properties
    (e.g. pads can be '2x8' or '4x4'; encoders have a default mode)
  - ControlOverride unchanged
*/

import type { MidiChannel } from '@/features/midi-engine/types';

export type ModuleType =
  | 'encoders'       // 8-knob strip with encoder-mode tabs
  | 'display'        // Preset name / CH / BPM / OCT readout
  | 'transport-bar'  // SHIFT SETTINGS PLAY REC GO◀ GO▶
  | 'mode-buttons'   // ARP / SCALE / CHORD placeholder toggles
  | 'pads'           // Pad grid (2×8 or 4×4) with pad-mode tabs
  | 'wheels'         // Pitch bend + mod wheel pair
  | 'nav'            // ▲ ▼ ▶ FX navigation column
  | 'keyboard'       // Piano keyboard
  | 'faders'         // 8-fader bank
  | 'activity';      // MIDI activity monitor

/** Encoder mode: selects which CC bank the 8 knobs send. */
export type EncoderMode =
  | 'plugin'
  | 'mixer'
  | 'sends'
  | 'transport'
  | 'custom1'
  | 'custom2'
  | 'custom3'
  | 'custom4';

/** Pad mode: switches pad-grid behaviour. */
export type PadMode =
  | 'drum'       // GM drum notes ch10
  | 'drum2'      // Second drum bank
  | 'userChord'  // User-defined chord pads (Phase 6)
  | 'chordMap'   // Scale-degree chord pads (Phase 6)
  | 'custom1'
  | 'custom2'
  | 'custom3'
  | 'custom4';

/** Per-type configurable properties. Stored inside ModuleInstance.props. */
export type ModuleProps =
  | { type: 'encoders';       defaultMode?: EncoderMode }
  | { type: 'display' }
  | { type: 'transport-bar' }
  | { type: 'mode-buttons';   show?: ('arp' | 'scale' | 'chord')[] }
  | { type: 'pads';           layout?: '2x8' | '4x4' }
  | { type: 'wheels' }
  | { type: 'nav' }
  | { type: 'keyboard';       octaves?: number; height?: number }
  | { type: 'faders' }
  | { type: 'activity' };

export interface ControlOverride {
  label?: string;
  /** HSL hue 0–360. Replaces the component's auto-computed hue. */
  colorHue?: number;
  channel?: MidiChannel;
  cc?: number;
  note?: number;
  min?: number;
  max?: number;
}

export interface ModuleOverrides {
  label?: string;
  accentColor?: string;
  controls?: Record<string, ControlOverride>;
}

export interface ModuleInstance {
  id: string;
  type: ModuleType;
  colSpan: 1 | 2 | 3 | 4;
  /** Per-type configurable properties (pad layout, encoder default mode, etc.) */
  props?: Omit<ModuleProps, 'type'>;
  overrides?: ModuleOverrides;
}

export interface LayoutPage {
  id: string;
  name: string;
  modules: ModuleInstance[];
}

export interface Layout {
  id: string;
  name: string;
  pages: LayoutPage[];
  createdAt: number;
  updatedAt: number;
  isBuiltIn?: boolean;
}
