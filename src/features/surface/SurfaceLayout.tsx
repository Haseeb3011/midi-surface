/*
  SurfaceLayout — master surface container.

  Picks the active page from layoutStore and passes its id to LayoutRenderer.
  In edit mode, exposes the PageTabs strip for adding/switching pages.
  In play mode, the page is navigated via NavPanel's ▶ button.
*/

import { memo } from 'react';
import { LayoutRenderer } from '@/features/layout/LayoutRenderer';
import { PageTabs } from '@/features/layout/PageTabs';
import { useLayoutStore } from '@/store/layoutStore';

export const SurfaceLayout = memo(function SurfaceLayout() {
  const layout = useLayoutStore((s) => s.layout);
  const activePageIndex = useLayoutStore((s) => s.activePageIndex);
  const editMode = useLayoutStore((s) => s.editMode);

  if (!layout) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-xs text-muted">
        Loading layout…
      </div>
    );
  }

  const activePage = layout.pages[activePageIndex];
  if (!activePage) return null;

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Page tabs — only shown in edit mode with multiple pages */}
      {editMode && layout.pages.length > 1 && (
        <div className="flex shrink-0 items-center gap-1.5 px-1">
          <PageTabs />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        <LayoutRenderer pageId={activePage.id} />
      </div>
    </div>
  );
});
