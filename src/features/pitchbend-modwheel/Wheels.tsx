/*
  Pitch + Mod wheels — horizontal compact pair so the module fits comfortably
  next to the pad grid without being clipped by the keyboard below.

  Pitch is 14-bit and springs back to centre on release; mod is 7-bit sticky.
*/

import { memo, useEffect, useState } from 'react';
import { Wheel } from '@/ui/Wheel';
import { midi } from '@/features/midi-engine/MidiEngine';
import { MOD_WHEEL_CC, controlId } from '@/features/midi-engine/defaults';
import { useSettingsStore } from '@/store/settingsStore';
import { usePerformanceStore } from '@/store/performanceStore';

const PITCH_CENTER = 8192;
const PITCH_MAX = 16383;

export const Wheels = memo(function Wheels() {
  const channel = useSettingsStore((s) => s.defaultChannel);
  const modWheel = usePerformanceStore((s) => s.modWheel);
  const setModWheel = usePerformanceStore((s) => s.setModWheel);

  // Pitch bend never persists — purely transient.
  const [pitch, setPitch] = useState(PITCH_CENTER);

  useEffect(() => {
    midi.pitchBend(channel, pitch);
  }, [pitch, channel]);

  return (
    <section className="module-panel">
      <header className="module-header">
        <h3 className="module-title">Wheels</h3>
      </header>
      <div className="flex items-center justify-center gap-3">
        <Wheel
          controlId={controlId.pitchBend()}
          label="Pitch"
          value={pitch}
          min={0}
          max={PITCH_MAX}
          springBack
          defaultValue={PITCH_CENTER}
          hue={290}
          height={130}
          onChange={setPitch}
        />
        <Wheel
          controlId={controlId.modWheel()}
          label="Mod"
          value={modWheel}
          min={0}
          max={127}
          hue={330}
          height={130}
          onChange={(v) => {
            if (v !== modWheel) {
              setModWheel(v);
              midi.cc(channel, MOD_WHEEL_CC, v);
            }
          }}
        />
      </div>
    </section>
  );
});
