/*
  layoutStore — active layout state and edit mode.

  This store is NOT persisted via Zustand persist middleware. Dexie is the
  source of truth for layouts; this store holds the in-memory working copy.
  Changes accumulate here until the user explicitly hits Save (saveLayout) or
  Discard (discardChanges). Call bootstrapLayoutStore() once at app boot.

  moduleIndex: a derived Map<moduleId, ModuleInstance> rebuilt every time the
  layout mutates. getControlOverride uses it for O(1) lookup on the MIDI hot
  path — the alternative was an O(pages × modules) walk per send, which is
  significant when chord-bashing the pad grid 50–100×/sec.
*/

import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import type { Layout, LayoutPage, ModuleInstance, ControlOverride } from '@/features/layout/types';
import { db, initDB } from '@/persistence/db';
import { DEFAULT_LAYOUT } from '@/features/layout/templates';

const ACTIVE_LAYOUT_KEY = 'midi-surface-active-layout';

interface LayoutState {
  layout: Layout | null;
  /** id → module reference. Always reflects the current `layout`. */
  moduleIndex: Map<string, ModuleInstance>;
  activePageIndex: number;
  editMode: boolean;
  /** Which module's override panel is open (null = closed). */
  overridePanelModuleId: string | null;
  overridePanelPageId: string | null;

  openOverridePanel: (pageId: string, moduleId: string) => void;
  closeOverridePanel: () => void;
  loadLayout: (id: string) => Promise<void>;
  setActivePage: (index: number) => void;
  toggleEditMode: () => void;
  reorderModules: (pageId: string, fromIndex: number, toIndex: number) => void;
  setModuleColSpan: (pageId: string, moduleId: string, colSpan: 1 | 2 | 3 | 4) => void;
  addModule: (pageId: string, module: ModuleInstance) => void;
  removeModule: (pageId: string, moduleId: string) => void;
  setControlOverride: (
    pageId: string,
    moduleId: string,
    controlId: string,
    override: Partial<ControlOverride>,
  ) => void;
  clearControlOverride: (pageId: string, moduleId: string, controlId: string) => void;
  addPage: () => void;
  removePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  saveLayout: () => Promise<void>;
  saveLayoutAs: (name: string) => Promise<void>;
  discardChanges: () => Promise<void>;
}

function buildIndex(layout: Layout | null): Map<string, ModuleInstance> {
  const map = new Map<string, ModuleInstance>();
  if (!layout) return map;
  for (const page of layout.pages) {
    for (const m of page.modules) map.set(m.id, m);
  }
  return map;
}

function withPage(
  layout: Layout,
  pageId: string,
  fn: (page: LayoutPage) => LayoutPage,
): Layout {
  return {
    ...layout,
    pages: layout.pages.map((p) => (p.id === pageId ? fn(p) : p)),
  };
}

/** Apply a layout-mutating fn and rebuild the module index in one set(). */
function mutateLayout(
  set: (partial: Partial<LayoutState>) => void,
  current: LayoutState,
  fn: (layout: Layout) => Layout,
): void {
  if (!current.layout) return;
  const next = fn(current.layout);
  set({ layout: next, moduleIndex: buildIndex(next) });
}

export const useLayoutStore = create<LayoutState>()((set, get) => ({
  layout: null,
  moduleIndex: new Map(),
  activePageIndex: 0,
  editMode: false,
  overridePanelModuleId: null,
  overridePanelPageId: null,

  openOverridePanel: (pageId, moduleId) =>
    set({ overridePanelModuleId: moduleId, overridePanelPageId: pageId }),
  closeOverridePanel: () => set({ overridePanelModuleId: null, overridePanelPageId: null }),

  loadLayout: async (id) => {
    await initDB();
    const layout = await db.layouts.get(id);
    if (layout) {
      set({
        layout,
        moduleIndex: buildIndex(layout),
        activePageIndex: 0,
        editMode: false,
      });
      localStorage.setItem(ACTIVE_LAYOUT_KEY, id);
    }
  },

  setActivePage: (index) => set({ activePageIndex: index }),

  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  reorderModules: (pageId, fromIndex, toIndex) =>
    mutateLayout(set, get(), (layout) =>
      withPage(layout, pageId, (page) => ({
        ...page,
        modules: arrayMove(page.modules, fromIndex, toIndex),
      })),
    ),

  setModuleColSpan: (pageId, moduleId, colSpan) =>
    mutateLayout(set, get(), (layout) =>
      withPage(layout, pageId, (page) => ({
        ...page,
        modules: page.modules.map((m) => (m.id === moduleId ? { ...m, colSpan } : m)),
      })),
    ),

  addModule: (pageId, module) =>
    mutateLayout(set, get(), (layout) =>
      withPage(layout, pageId, (page) => ({
        ...page,
        modules: [...page.modules, module],
      })),
    ),

  removeModule: (pageId, moduleId) =>
    mutateLayout(set, get(), (layout) =>
      withPage(layout, pageId, (page) => ({
        ...page,
        modules: page.modules.filter((m) => m.id !== moduleId),
      })),
    ),

  setControlOverride: (pageId, moduleId, controlId, override) =>
    mutateLayout(set, get(), (layout) =>
      withPage(layout, pageId, (page) => ({
        ...page,
        modules: page.modules.map((m) => {
          if (m.id !== moduleId) return m;
          const existing = m.overrides?.controls?.[controlId] ?? {};
          return {
            ...m,
            overrides: {
              ...m.overrides,
              controls: {
                ...m.overrides?.controls,
                [controlId]: { ...existing, ...override },
              },
            },
          };
        }),
      })),
    ),

  clearControlOverride: (pageId, moduleId, controlId) =>
    mutateLayout(set, get(), (layout) =>
      withPage(layout, pageId, (page) => ({
        ...page,
        modules: page.modules.map((m) => {
          if (m.id !== moduleId) return m;
          const controls = { ...m.overrides?.controls };
          delete controls[controlId];
          return { ...m, overrides: { ...m.overrides, controls } };
        }),
      })),
    ),

  addPage: () => {
    const s = get();
    if (!s.layout) return;
    const newPage: LayoutPage = {
      id: `page-${Date.now()}`,
      name: `Page ${s.layout.pages.length + 1}`,
      modules: [],
    };
    const next: Layout = { ...s.layout, pages: [...s.layout.pages, newPage] };
    set({
      layout: next,
      moduleIndex: buildIndex(next),
      activePageIndex: s.layout.pages.length,
    });
  },

  removePage: (pageId) => {
    const s = get();
    if (!s.layout || s.layout.pages.length <= 1) return;
    const pages = s.layout.pages.filter((p) => p.id !== pageId);
    const next: Layout = { ...s.layout, pages };
    set({
      layout: next,
      moduleIndex: buildIndex(next),
      activePageIndex: Math.min(s.activePageIndex, pages.length - 1),
    });
  },

  renamePage: (pageId, name) =>
    mutateLayout(set, get(), (layout) =>
      withPage(layout, pageId, (p) => ({ ...p, name })),
    ),

  saveLayout: async () => {
    const { layout } = get();
    if (!layout) return;
    const updated: Layout = { ...layout, updatedAt: Date.now() };
    await db.layouts.put(updated);
    set({ layout: updated, moduleIndex: buildIndex(updated) });
    localStorage.setItem(ACTIVE_LAYOUT_KEY, updated.id);
  },

  saveLayoutAs: async (name) => {
    const { layout } = get();
    if (!layout) return;
    const newLayout: Layout = {
      ...layout,
      id: `layout-${Date.now()}`,
      name,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.layouts.put(newLayout);
    set({ layout: newLayout, moduleIndex: buildIndex(newLayout) });
    localStorage.setItem(ACTIVE_LAYOUT_KEY, newLayout.id);
  },

  discardChanges: async () => {
    const { layout } = get();
    if (!layout) return;
    await get().loadLayout(layout.id);
  },
}));

export async function bootstrapLayoutStore(): Promise<void> {
  const lastId = localStorage.getItem(ACTIVE_LAYOUT_KEY) ?? DEFAULT_LAYOUT.id;
  await useLayoutStore.getState().loadLayout(lastId);
}
