/*
  layoutStore — active layout state and edit mode.

  This store is NOT persisted via Zustand persist middleware. Dexie is the
  source of truth for layouts; this store holds the in-memory working copy.
  Changes accumulate here until the user explicitly hits Save (saveLayout) or
  Discard (discardChanges). Call bootstrapLayoutStore() once at app boot.
*/

import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import type { Layout, LayoutPage, ModuleInstance, ControlOverride } from '@/features/layout/types';
import { db, initDB } from '@/persistence/db';
import { DEFAULT_LAYOUT } from '@/features/layout/templates';

const ACTIVE_LAYOUT_KEY = 'midi-surface-active-layout';

interface LayoutState {
  layout: Layout | null;
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
  setModuleColSpan: (pageId: string, moduleId: string, colSpan: 1 | 2 | 4) => void;
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

export const useLayoutStore = create<LayoutState>()((set, get) => ({
  layout: null,
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
      set({ layout, activePageIndex: 0, editMode: false });
      localStorage.setItem(ACTIVE_LAYOUT_KEY, id);
    }
  },

  setActivePage: (index) => set({ activePageIndex: index }),

  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  reorderModules: (pageId, fromIndex, toIndex) =>
    set((s) => {
      if (!s.layout) return s;
      return {
        layout: withPage(s.layout, pageId, (page) => ({
          ...page,
          modules: arrayMove(page.modules, fromIndex, toIndex),
        })),
      };
    }),

  setModuleColSpan: (pageId, moduleId, colSpan) =>
    set((s) => {
      if (!s.layout) return s;
      return {
        layout: withPage(s.layout, pageId, (page) => ({
          ...page,
          modules: page.modules.map((m) => (m.id === moduleId ? { ...m, colSpan } : m)),
        })),
      };
    }),

  addModule: (pageId, module) =>
    set((s) => {
      if (!s.layout) return s;
      return {
        layout: withPage(s.layout, pageId, (page) => ({
          ...page,
          modules: [...page.modules, module],
        })),
      };
    }),

  removeModule: (pageId, moduleId) =>
    set((s) => {
      if (!s.layout) return s;
      return {
        layout: withPage(s.layout, pageId, (page) => ({
          ...page,
          modules: page.modules.filter((m) => m.id !== moduleId),
        })),
      };
    }),

  setControlOverride: (pageId, moduleId, controlId, override) =>
    set((s) => {
      if (!s.layout) return s;
      return {
        layout: withPage(s.layout, pageId, (page) => ({
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
      };
    }),

  clearControlOverride: (pageId, moduleId, controlId) =>
    set((s) => {
      if (!s.layout) return s;
      return {
        layout: withPage(s.layout, pageId, (page) => ({
          ...page,
          modules: page.modules.map((m) => {
            if (m.id !== moduleId) return m;
            const controls = { ...m.overrides?.controls };
            delete controls[controlId];
            return { ...m, overrides: { ...m.overrides, controls } };
          }),
        })),
      };
    }),

  addPage: () =>
    set((s) => {
      if (!s.layout) return s;
      const newPage: LayoutPage = {
        id: `page-${Date.now()}`,
        name: `Page ${s.layout.pages.length + 1}`,
        modules: [],
      };
      return {
        layout: { ...s.layout, pages: [...s.layout.pages, newPage] },
        activePageIndex: s.layout.pages.length,
      };
    }),

  removePage: (pageId) =>
    set((s) => {
      if (!s.layout || s.layout.pages.length <= 1) return s;
      const pages = s.layout.pages.filter((p) => p.id !== pageId);
      return {
        layout: { ...s.layout, pages },
        activePageIndex: Math.min(s.activePageIndex, pages.length - 1),
      };
    }),

  renamePage: (pageId, name) =>
    set((s) => {
      if (!s.layout) return s;
      return { layout: withPage(s.layout, pageId, (p) => ({ ...p, name })) };
    }),

  saveLayout: async () => {
    const { layout } = get();
    if (!layout) return;
    const updated: Layout = { ...layout, updatedAt: Date.now() };
    await db.layouts.put(updated);
    set({ layout: updated });
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
    set({ layout: newLayout });
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
