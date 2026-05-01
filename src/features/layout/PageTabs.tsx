/*
  PageTabs — tab strip for switching between layout pages.

  Hidden when there is only one page and edit mode is off. In edit mode,
  shows a + button to add pages and × buttons to remove non-last pages.
*/

import { memo } from 'react';
import { useLayoutStore } from '@/store/layoutStore';

export const PageTabs = memo(function PageTabs() {
  const layout = useLayoutStore((s) => s.layout);
  const activePageIndex = useLayoutStore((s) => s.activePageIndex);
  const editMode = useLayoutStore((s) => s.editMode);
  const setActivePage = useLayoutStore((s) => s.setActivePage);
  const addPage = useLayoutStore((s) => s.addPage);
  const removePage = useLayoutStore((s) => s.removePage);

  if (!layout) return null;
  // Hide tabs when there is only one page and not in edit mode.
  if (layout.pages.length <= 1 && !editMode) return null;

  return (
    <div className="flex items-center gap-1">
      {layout.pages.map((page, i) => (
        <div key={page.id} className="flex items-center">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setActivePage(i);
            }}
            className={
              'rounded-md px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ' +
              (i === activePageIndex
                ? 'bg-accent/20 text-accent'
                : 'bg-surfaceHi/40 text-muted hover:text-text')
            }
          >
            {page.name}
          </button>
          {editMode && layout.pages.length > 1 && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                removePage(page.id);
              }}
              className="ml-0.5 px-1 font-mono text-[10px] text-muted hover:text-text"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {editMode && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            addPage();
          }}
          className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-[10px] text-muted hover:text-text transition"
        >
          +
        </button>
      )}
    </div>
  );
});
