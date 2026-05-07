/*
  ModuleWrapper — wraps each module in edit mode with a drag handle, delete
  button, and resize grip. Uses @dnd-kit/sortable for drag-to-reorder.

  Only rendered in edit mode. In performance mode LayoutRenderer uses bare divs
  so there is zero dnd-kit overhead during play.
*/

import { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ResizeHandle } from './ResizeHandle';
import { useLayoutStore } from '@/store/layoutStore';
import type { ModuleInstance, ModuleType } from './types';

const MODULE_LABELS: Record<ModuleType, string> = {
  encoders:        'Encoders',
  display:         'Display',
  'transport-bar': 'Transport',
  'mode-buttons':  'Mode Buttons',
  pads:            'Pads',
  wheels:          'Wheels',
  nav:             'Nav',
  keyboard:        'Keyboard',
  faders:          'Faders',
  activity:        'Activity',
};

interface Props {
  instance: ModuleInstance;
  pageId: string;
  children: React.ReactNode;
}

export function ModuleWrapper({ instance, pageId, children }: Props) {
  const removeModule = useLayoutStore((s) => s.removeModule);
  const openOverridePanel = useLayoutStore((s) => s.openOverridePanel);
  const moduleRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: instance.id });

  const style: React.CSSProperties = {
    gridColumn: `span ${instance.colSpan}`,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (moduleRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      className="min-w-0"
    >
      {/* Drag handle bar */}
      <div
        {...listeners}
        {...attributes}
        className="
          mb-1 flex cursor-grab items-center justify-between rounded-md
          bg-surfaceHi/60 px-2 py-1 text-[10px] font-mono uppercase
          tracking-wider text-muted active:cursor-grabbing select-none
        "
      >
        <span className="flex items-center gap-1.5">
          <span className="text-muted/50">⠿</span>
          {MODULE_LABELS[instance.type]}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              openOverridePanel(pageId, instance.id);
            }}
            className="rounded px-1 text-muted transition hover:text-accent"
            title="Edit control overrides"
          >
            ⚙
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              removeModule(pageId, instance.id);
            }}
            className="rounded px-1 text-muted transition hover:text-text"
          >
            ×
          </button>
        </div>
      </div>

      {/* Module content */}
      {children}

      {/* Resize handle — bottom-right corner */}
      <ResizeHandle instance={instance} pageId={pageId} moduleRef={moduleRef} />
    </div>
  );
}
