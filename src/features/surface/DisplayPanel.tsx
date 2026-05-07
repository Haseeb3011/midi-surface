/*
  DisplayPanel — live readout of surface state: preset name, channel, BPM, octave.
  Reads from layoutStore (preset name) and settingsStore / performanceStore.
*/

import { memo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { usePerformanceStore } from '@/store/performanceStore';
import { useLayoutStore } from '@/store/layoutStore';

export const DisplayPanel = memo(function DisplayPanel() {
  const channel = useSettingsStore((s) => s.defaultChannel);
  const octave = useSettingsStore((s) => s.octave);
  const tempo = usePerformanceStore((s) => s.tempo);
  const layoutName = useLayoutStore((s) => s.layout?.name ?? '—');

  return (
    <section className="module-panel">
      <div className="flex h-full flex-col justify-between rounded-md bg-surfaceLow/60 px-3 py-2 font-mono">
        <div className="truncate text-[13px] font-semibold tracking-wide text-text">
          {layoutName}
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[10px] text-muted">
            CH <span className="text-text-soft">{channel + 1}</span>
          </span>
          <span className="text-[10px] text-muted">
            BPM <span className="text-text-soft">{tempo}</span>
          </span>
          <span className="text-[10px] text-muted">
            OCT <span className="text-text-soft">{octave >= 0 ? '+' : ''}{octave}</span>
          </span>
        </div>
      </div>
    </section>
  );
});
