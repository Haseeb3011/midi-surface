/*
  LayoutRenderer — maps a LayoutPage's modules[] into a 4-column CSS Grid.

  Performance mode: bare divs, zero dnd-kit overhead.
  Edit mode: DndContext + SortableContext + ModuleWrapper with drag handles.
  Module picker appears as trailing tiles in edit mode.
*/

import { memo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { Transport } from '@/features/transport/Transport';
import { KnobRow } from '@/features/knobs/KnobRow';
import { FaderRow } from '@/features/faders/FaderRow';
import { PadGrid } from '@/features/pads/PadGrid';
import { Wheels } from '@/features/pitchbend-modwheel/Wheels';
import { PianoKeyboard } from '@/features/keyboard/PianoKeyboard';
import { ActivityMonitor } from '@/features/activity-monitor/ActivityMonitor';
import { ModuleWrapper } from './ModuleWrapper';
import { useLayoutStore } from '@/store/layoutStore';
import type { ModuleInstance, ModuleType } from './types';

const MODULE_LABELS: Record<ModuleType, string> = {
  transport: 'Transport',
  knobs:     'Knobs',
  faders:    'Faders',
  pads:      'Pads',
  wheels:    'Wheels',
  keyboard:  'Keyboard',
  activity:  'Activity',
};

const ALL_MODULE_TYPES: ModuleType[] = [
  'transport', 'knobs', 'faders', 'pads', 'wheels', 'keyboard', 'activity',
];

function renderModuleContent(instance: ModuleInstance): React.ReactNode {
  const id = instance.id;
  switch (instance.type) {
    case 'transport':  return <Transport />;
    case 'knobs':      return <KnobRow moduleId={id} />;
    case 'faders':     return <FaderRow moduleId={id} />;
    case 'pads':       return <PadGrid moduleId={id} />;
    case 'wheels':     return <Wheels />;
    case 'keyboard':   return <PianoKeyboard />;
    case 'activity':   return <ActivityMonitor />;
    default:           return null;
  }
}

function AddModulePicker({ pageId }: { pageId: string }) {
  const addModule = useLayoutStore((s) => s.addModule);

  return (
    <>
      {ALL_MODULE_TYPES.map((type) => (
        <div
          key={type}
          className="col-span-1 flex min-h-[48px] items-center justify-center"
        >
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              addModule(pageId, {
                id: `mod-${type}-${Date.now()}`,
                type,
                colSpan: type === 'transport' || type === 'keyboard' ? 4 : 2,
              });
            }}
            className="
              glass flex h-full w-full items-center justify-center gap-1.5
              rounded-lg border border-dashed border-border/60 font-mono
              text-[10px] uppercase tracking-wider text-muted
              transition hover:border-accent/60 hover:text-accent
            "
          >
            <span className="text-xs">+</span>
            {MODULE_LABELS[type]}
          </button>
        </div>
      ))}
    </>
  );
}

export const LayoutRenderer = memo(function LayoutRenderer({ pageId }: { pageId: string }) {
  const layout = useLayoutStore((s) => s.layout);
  const editMode = useLayoutStore((s) => s.editMode);
  const reorderModules = useLayoutStore((s) => s.reorderModules);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !layout) return;
      const page = layout.pages.find((p) => p.id === pageId);
      if (!page) return;
      const fromIndex = page.modules.findIndex((m) => m.id === active.id);
      const toIndex = page.modules.findIndex((m) => m.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderModules(pageId, fromIndex, toIndex);
      }
    },
    [layout, pageId, reorderModules],
  );

  if (!layout) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted font-mono text-xs">
        Loading layout…
      </div>
    );
  }

  const page = layout.pages.find((p) => p.id === pageId);
  if (!page) return null;

  const moduleIds = page.modules.map((m) => m.id);

  if (editMode) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={moduleIds} strategy={rectSortingStrategy}>
          <div
            className="grid content-start gap-2"
            style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
          >
            {page.modules.map((m) => (
              <ModuleWrapper key={m.id} instance={m} pageId={page.id}>
                {renderModuleContent(m)}
              </ModuleWrapper>
            ))}
            <AddModulePicker pageId={page.id} />
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div
      className="grid content-start gap-2"
      style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
    >
      {page.modules.map((m) => (
        <div
          key={m.id}
          className="min-w-0"
          style={{ gridColumn: `span ${m.colSpan}` }}
        >
          {renderModuleContent(m)}
        </div>
      ))}
    </div>
  );
});
