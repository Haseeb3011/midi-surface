/*
  Layout system types.

  A Layout contains one or more LayoutPages. Each page is a flat sorted array of
  ModuleInstances rendered into a 4-column CSS Grid. Modules may span 1, 2, or 4
  columns; CSS Grid auto-places and wraps them.

  ControlOverride lets users reassign label, color, and MIDI target (channel /
  CC / note) for any individual control within a module.
*/

import type { MidiChannel } from '@/features/midi-engine/types';

export type ModuleType =
  | 'transport'
  | 'knobs'
  | 'faders'
  | 'pads'
  | 'wheels'
  | 'keyboard'
  | 'activity';

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
  colSpan: 1 | 2 | 4;
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
