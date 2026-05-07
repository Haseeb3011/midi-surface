/*
  Built-in layout templates seeded into Dexie on first run.

  Module IDs are stable strings so MIDI Learn assignments survive layout changes.
  These are the edit-mode module arrangements; the fixed SurfaceLayout component
  renders the Launchkey-style hardware view in play mode.
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
        { id: 'mod-encoders',      type: 'encoders',      colSpan: 4 },
        { id: 'mod-wheels',        type: 'wheels',        colSpan: 1 },
        { id: 'mod-display',       type: 'display',       colSpan: 2 },
        { id: 'mod-nav',           type: 'nav',           colSpan: 1 },
        { id: 'mod-transport-bar', type: 'transport-bar', colSpan: 2 },
        { id: 'mod-mode-buttons',  type: 'mode-buttons',  colSpan: 2 },
        { id: 'mod-pads',          type: 'pads',          colSpan: 4, props: { layout: '2x8' } },
        { id: 'mod-keyboard',      type: 'keyboard',      colSpan: 4 },
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
        { id: 'mod-encoders-d',  type: 'encoders',      colSpan: 4 },
        { id: 'mod-pads-d',      type: 'pads',          colSpan: 3, props: { layout: '4x4' } },
        { id: 'mod-nav-d',       type: 'nav',           colSpan: 1 },
        { id: 'mod-transport-d', type: 'transport-bar', colSpan: 4 },
        { id: 'mod-keyboard-d',  type: 'keyboard',      colSpan: 4 },
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
        { id: 'mod-encoders-k',  type: 'encoders',      colSpan: 4 },
        { id: 'mod-wheels-k',    type: 'wheels',        colSpan: 1 },
        { id: 'mod-display-k',   type: 'display',       colSpan: 2 },
        { id: 'mod-nav-k',       type: 'nav',           colSpan: 1 },
        { id: 'mod-transport-k', type: 'transport-bar', colSpan: 4 },
        { id: 'mod-keyboard-k',  type: 'keyboard',      colSpan: 4, props: { octaves: 5 } },
      ],
    },
  ],
};

export const BUILT_IN_LAYOUTS: Layout[] = [DEFAULT_LAYOUT, DRUMS_LAYOUT, KEYS_LAYOUT];
