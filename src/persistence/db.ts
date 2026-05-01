/*
  Dexie database — IndexedDB-backed storage for layouts and presets.

  The db singleton is imported wherever layout data is read/written. Call
  initDB() once at app boot (bootstrapLayoutStore does this) to seed the
  built-in templates if they don't yet exist.
*/

import Dexie, { type EntityTable } from 'dexie';
import type { Layout } from '@/features/layout/types';
import { BUILT_IN_LAYOUTS } from '@/features/layout/templates';

class MidiSurfaceDB extends Dexie {
  layouts!: EntityTable<Layout, 'id'>;

  constructor() {
    super('midi-surface');
    this.version(1).stores({
      layouts: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new MidiSurfaceDB();

let seeded = false;

export async function initDB(): Promise<void> {
  if (seeded) return;
  seeded = true;
  // Always overwrite built-ins so layout changes in templates.ts propagate
  // to existing users on next cold start. User layouts are untouched.
  await db.transaction('rw', db.layouts, async () => {
    for (const layout of BUILT_IN_LAYOUTS) {
      await db.layouts.put(layout);
    }
  });
}
