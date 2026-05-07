/*
  Settings export / import helpers.

  Export serialises settings, MIDI Learn assignments, and the active layout to
  a JSON file the user can save for backup or transfer.

  Import reads that file back, restoring each store and persisting the layout
  to Dexie. outputId / inputId are intentionally excluded from export since
  MIDI port IDs are machine-specific.
*/

import type { Layout } from '@/features/layout/types';
import type { LearnAssignment } from '@/features/midi-engine/types';
import { db, initDB } from '@/persistence/db';
import { useLearnStore } from '@/store/learnStore';
import { useLayoutStore } from '@/store/layoutStore';
import { useSettingsStore } from '@/store/settingsStore';

interface SettingsExport {
  version: number;
  exportedAt: string;
  settings: {
    defaultChannel: number;
    octave: number;
    velocity: number;
    panicOnBlur: boolean;
    activityVisible: boolean;
    theme: string;
    pianoOctaves: number;
    pianoHeight: number;
    perfMode: boolean;
  };
  learn: { assignments: Record<string, LearnAssignment> };
  layout: Layout | null;
}

export function exportSettings(): void {
  const s = useSettingsStore.getState();
  const learn = useLearnStore.getState();
  const layout = useLayoutStore.getState().layout;

  const data: SettingsExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      defaultChannel: s.defaultChannel,
      octave: s.octave,
      velocity: s.velocity,
      panicOnBlur: s.panicOnBlur,
      activityVisible: s.activityVisible,
      theme: s.theme,
      pianoOctaves: s.pianoOctaves,
      pianoHeight: s.pianoHeight,
      perfMode: s.perfMode,
    },
    learn: { assignments: learn.assignments },
    layout: layout ?? null,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `midi-surface-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importSettings(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as Partial<SettingsExport>;

  const st = data.settings;
  if (st) {
    const s = useSettingsStore.getState();
    if (st.defaultChannel !== undefined) s.setDefaultChannel(st.defaultChannel as 0);
    if (st.octave !== undefined) s.setOctave(st.octave);
    if (st.velocity !== undefined) s.setVelocity(st.velocity);
    if (st.panicOnBlur !== undefined) s.setPanicOnBlur(st.panicOnBlur);
    if (st.activityVisible !== undefined) s.setActivityVisible(st.activityVisible);
    if (st.theme !== undefined) s.setTheme(st.theme as Parameters<typeof s.setTheme>[0]);
    if (st.pianoOctaves !== undefined) s.setPianoOctaves(st.pianoOctaves);
    if (st.pianoHeight !== undefined) s.setPianoHeight(st.pianoHeight);
    if (st.perfMode !== undefined) s.setPerfMode(st.perfMode);
  }

  if (data.learn?.assignments) {
    useLearnStore.getState().setAssignments(data.learn.assignments);
  }

  if (data.layout) {
    await initDB();
    const imported: Layout = {
      ...data.layout,
      id: `layout-import-${Date.now()}`,
      name: `${data.layout.name} (imported)`,
      isBuiltIn: false,
      updatedAt: Date.now(),
    };
    await db.layouts.put(imported);
    await useLayoutStore.getState().loadLayout(imported.id);
  }
}
