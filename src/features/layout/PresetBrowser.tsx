/*
  PresetBrowser — sidebar panel for managing named layout presets.

  Lists all layouts stored in Dexie (built-ins first, locked). Actions:
  Load, Duplicate, Rename, Delete (built-ins protected), Export JSON,
  Import JSON. Uses useLiveQuery so the list stays reactive.
*/

import { memo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/persistence/db';
import { useLayoutStore } from '@/store/layoutStore';
import type { Layout } from './types';

async function downloadJSON(layout: Layout): Promise<void> {
  const json = JSON.stringify(layout, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${layout.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isValidLayout(obj: unknown): obj is Layout {
  if (!obj || typeof obj !== 'object') return false;
  const l = obj as Record<string, unknown>;
  return (
    typeof l.id === 'string' &&
    typeof l.name === 'string' &&
    Array.isArray(l.pages)
  );
}

export const PresetBrowser = memo(function PresetBrowser({
  onClose,
}: {
  onClose: () => void;
}) {
  const layouts = useLiveQuery(() =>
    db.layouts.orderBy('createdAt').toArray().then((rows) => {
      // Built-ins first, then user layouts newest-first.
      const builtins = rows.filter((r) => r.isBuiltIn);
      const custom = rows.filter((r) => !r.isBuiltIn).reverse();
      return [...builtins, ...custom];
    }),
  );

  const activeLayoutId = useLayoutStore((s) => s.layout?.id);
  const loadLayout = useLayoutStore((s) => s.loadLayout);
  const saveLayoutAs = useLayoutStore((s) => s.saveLayoutAs);
  const layout = useLayoutStore((s) => s.layout);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDuplicate = async (src: Layout): Promise<void> => {
    const name = window.prompt('Name for duplicated layout:', `${src.name} (copy)`);
    if (!name) return;
    const newLayout: Layout = {
      ...src,
      id: `layout-${Date.now()}`,
      name,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.layouts.put(newLayout);
    await loadLayout(newLayout.id);
  };

  const handleRename = async (src: Layout): Promise<void> => {
    if (src.isBuiltIn) return;
    const name = window.prompt('New name:', src.name);
    if (!name || name === src.name) return;
    const updated = { ...src, name, updatedAt: Date.now() };
    await db.layouts.put(updated);
    if (src.id === activeLayoutId) await loadLayout(src.id);
  };

  const handleDelete = async (src: Layout): Promise<void> => {
    if (src.isBuiltIn) return;
    if (!window.confirm(`Delete layout "${src.name}"?`)) return;
    await db.layouts.delete(src.id);
    if (src.id === activeLayoutId) await loadLayout('builtin-default');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isValidLayout(parsed)) throw new Error('Invalid layout file');
      const imported: Layout = {
        ...parsed,
        id: `layout-${Date.now()}`,
        isBuiltIn: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.layouts.put(imported);
      await loadLayout(imported.id);
    } catch {
      alert('Failed to import: invalid or corrupted layout file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveCurrent = async (): Promise<void> => {
    if (!layout) return;
    if (layout.isBuiltIn) {
      const name = window.prompt('Save current layout as:', `${layout.name} (custom)`);
      if (!name) return;
      await saveLayoutAs(name);
    } else {
      const updated = { ...layout, updatedAt: Date.now() };
      await db.layouts.put(updated);
    }
  };

  return (
    <div className="glass flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">Presets</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveCurrent}
            className="rounded-md bg-accent/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent transition hover:bg-accent/30"
          >
            save current
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-[10px] text-muted transition hover:text-text"
          >
            close
          </button>
        </div>
      </div>

      {/* Layout list */}
      <div className="flex-1 overflow-auto p-3">
        {!layouts ? (
          <div className="py-4 text-center font-mono text-xs text-muted">Loading…</div>
        ) : (
          <div className="flex flex-col gap-2">
            {layouts.map((l) => {
              const isActive = l.id === activeLayoutId;
              return (
                <div
                  key={l.id}
                  className={
                    'flex flex-col gap-1 rounded-lg p-2 transition ' +
                    (isActive ? 'bg-accent/10 ring-1 ring-accent/40' : 'bg-surfaceHi/30')
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-text">
                      {l.isBuiltIn && (
                        <span className="text-[9px] text-muted" title="Built-in">🔒</span>
                      )}
                      {l.name}
                      {isActive && (
                        <span className="font-mono text-[9px] text-accent">● active</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => void loadLayout(l.id)}
                          className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent transition hover:bg-accent/20"
                        >
                          load
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDuplicate(l)}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted transition hover:text-text"
                      >
                        dup
                      </button>
                      {!l.isBuiltIn && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleRename(l)}
                            className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted transition hover:text-text"
                          >
                            ren
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(l)}
                            className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted transition hover:text-warn"
                          >
                            del
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => void downloadJSON(l)}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted transition hover:text-text"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-muted">
                    {l.pages.length} page{l.pages.length !== 1 ? 's' : ''} ·{' '}
                    {l.pages.reduce((n, p) => n + p.modules.length, 0)} modules
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Import / footer */}
      <div className="shrink-0 border-t border-border/40 px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => void handleImport(e)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-md bg-surfaceHi/40 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted transition hover:text-text"
        >
          + Import JSON
        </button>
      </div>
    </div>
  );
});
