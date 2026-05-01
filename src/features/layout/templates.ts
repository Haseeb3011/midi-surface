/*
  Built-in layout templates seeded into Dexie on first run.

  Module IDs within built-in layouts are stable strings so MIDI Learn
  assignments (keyed by controlId, not moduleId) aren't affected by layout
  changes. Users can duplicate and edit these; the originals are read-only.
*/

import type { Layout } from './types';

export const DEFAULT_LAYOUT: Layout = {
  id: 'builtin-default',
  name: 'Default',
  isBuiltIn: true,
  createdAt: 0,
  updatedAt: 0,
  pages: [
    {
      id: 'page-default-main',
      name: 'Main',
      modules: [
        { id: 'mod-transport', type: 'transport', colSpan: 4 },
        { id: 'mod-knobs',     type: 'knobs',     colSpan: 2 },
        { id: 'mod-pads',      type: 'pads',      colSpan: 2 },
        { id: 'mod-faders',    type: 'faders',    colSpan: 4 },
        { id: 'mod-wheels',    type: 'wheels',    colSpan: 1 },
        { id: 'mod-keyboard',  type: 'keyboard',  colSpan: 3 },
      ],
    },
  ],
};

export const DRUMS_LAYOUT: Layout = {
  id: 'builtin-drums',
  name: 'Drums Focus',
  isBuiltIn: true,
  createdAt: 0,
  updatedAt: 0,
  pages: [
    {
      id: 'page-drums-main',
      name: 'Drums',
      modules: [
        { id: 'mod-pads-d', type: 'pads', colSpan: 4 },
        { id: 'mod-knobs-d', type: 'knobs', colSpan: 2 },
        { id: 'mod-wheels-d', type: 'wheels', colSpan: 2 },
        { id: 'mod-faders-d', type: 'faders', colSpan: 4 },
        { id: 'mod-transport-d', type: 'transport', colSpan: 4 },
      ],
    },
  ],
};

export const KEYS_LAYOUT: Layout = {
  id: 'builtin-keys',
  name: 'Keys Focus',
  isBuiltIn: true,
  createdAt: 0,
  updatedAt: 0,
  pages: [
    {
      id: 'page-keys-main',
      name: 'Keys',
      modules: [
        { id: 'mod-wheels-k',    type: 'wheels',    colSpan: 1 },
        { id: 'mod-keyboard-k',  type: 'keyboard',  colSpan: 3 },
        { id: 'mod-knobs-k',     type: 'knobs',     colSpan: 2 },
        { id: 'mod-transport-k', type: 'transport', colSpan: 2 },
      ],
    },
  ],
};

export const BUILT_IN_LAYOUTS: Layout[] = [DEFAULT_LAYOUT, DRUMS_LAYOUT, KEYS_LAYOUT];
