/*
  ControlOverridePanel — sidebar panel for editing per-control overrides.

  Shows each control in the selected module (by module type) with fields for
  label, colorHue (0–360), MIDI channel (1–16), and CC or note number.
  Changes are applied immediately to layoutStore in-memory state. The user
  must hit Save in the header to persist to Dexie.
*/

import { memo } from 'react';
import { useLayoutStore } from '@/store/layoutStore';
import type { ControlOverride, ModuleType } from './types';
import type { MidiChannel } from '@/features/midi-engine/types';
import {
  KNOB_CC_BASE,
  FADER_CC_BASE,
  PAD_CHANNEL,
  TRANSPORT_CC,
  padNoteFor,
  type TransportKey,
} from '@/features/midi-engine/defaults';
import { midiToNoteName } from '@/features/midi-engine/noteNames';

interface ControlDef {
  controlId: string;
  defaultLabel: string;
  defaultChannel: MidiChannel;
  defaultCC?: number;
  defaultNote?: number;
}

function getControls(type: ModuleType): ControlDef[] {
  switch (type) {
    case 'knobs':
      return Array.from({ length: 8 }, (_, i) => ({
        controlId: `knob:${i}`,
        defaultLabel: `K${i + 1}`,
        defaultChannel: 0,
        defaultCC: KNOB_CC_BASE + i,
      }));
    case 'faders':
      return Array.from({ length: 8 }, (_, i) => ({
        controlId: `fader:${i}`,
        defaultLabel: `F${i + 1}`,
        defaultChannel: 0,
        defaultCC: FADER_CC_BASE + i,
      }));
    case 'pads':
      return Array.from({ length: 16 }, (_, i) => ({
        controlId: `pad:A:${i}`,
        defaultLabel: midiToNoteName(padNoteFor('A', i)),
        defaultChannel: PAD_CHANNEL,
        defaultNote: padNoteFor('A', i),
      }));
    case 'transport':
      return (['play', 'stop', 'record', 'loop', 'metronome'] as TransportKey[]).map((k) => ({
        controlId: `transport:${k}`,
        defaultLabel: k.charAt(0).toUpperCase() + k.slice(1),
        defaultChannel: 0,
        defaultCC: TRANSPORT_CC[k],
      }));
    default:
      return [];
  }
}

const HUE_PRESETS = [0, 30, 60, 120, 180, 210, 270, 300, 330];

interface ControlRowProps {
  def: ControlDef;
  override: ControlOverride | undefined;
  onSet: (fields: Partial<ControlOverride>) => void;
  onReset: () => void;
}

function ControlRow({ def, override, onSet, onReset }: ControlRowProps) {
  const hasOverride = override && Object.keys(override).length > 0;
  const hue = override?.colorHue ?? null;

  return (
    <div className="flex flex-col gap-1 rounded-md bg-surfaceHi/30 p-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {def.defaultLabel}
        </span>
        {hasOverride && (
          <button
            type="button"
            onClick={onReset}
            className="font-mono text-[9px] uppercase tracking-wider text-muted hover:text-text transition"
          >
            reset
          </button>
        )}
      </div>

      {/* Label override */}
      <input
        type="text"
        placeholder={def.defaultLabel}
        value={override?.label ?? ''}
        onChange={(e) => onSet({ label: e.target.value || undefined })}
        className="w-full rounded bg-surface px-2 py-1 font-mono text-[11px] text-text outline-none focus:ring-1 focus:ring-accent/60"
        maxLength={12}
      />

      {/* Color hue */}
      <div className="flex items-center gap-1">
        <span className="w-8 font-mono text-[9px] text-muted">Hue</span>
        <div className="flex gap-1">
          {HUE_PRESETS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onSet({ colorHue: h })}
              className={
                'h-4 w-4 rounded-full transition ' +
                (hue === h ? 'ring-2 ring-white/60' : 'opacity-70 hover:opacity-100')
              }
              style={{ background: `hsl(${h} 80% 55%)` }}
              title={`Hue ${h}`}
            />
          ))}
          {hue !== null && (
            <button
              type="button"
              onClick={() => onSet({ colorHue: undefined })}
              className="ml-1 font-mono text-[9px] text-muted hover:text-text"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* MIDI channel */}
      <div className="flex items-center gap-1">
        <span className="w-8 shrink-0 font-mono text-[9px] text-muted">CH</span>
        <select
          value={override?.channel !== undefined ? override.channel + 1 : ''}
          onChange={(e) =>
            onSet({
              channel: e.target.value
                ? ((Number(e.target.value) - 1) as MidiChannel)
                : undefined,
            })
          }
          className="flex-1 rounded bg-surface px-1 py-0.5 font-mono text-[11px] text-text outline-none focus:ring-1 focus:ring-accent/60"
        >
          <option value="">default ({def.defaultChannel + 1})</option>
          {Array.from({ length: 16 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      {/* CC or Note */}
      {def.defaultCC !== undefined && (
        <div className="flex items-center gap-1">
          <span className="w-8 shrink-0 font-mono text-[9px] text-muted">CC</span>
          <input
            type="number"
            min={0}
            max={127}
            placeholder={String(def.defaultCC)}
            value={override?.cc ?? ''}
            onChange={(e) =>
              onSet({ cc: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded bg-surface px-2 py-0.5 font-mono text-[11px] text-text outline-none focus:ring-1 focus:ring-accent/60"
          />
        </div>
      )}
      {def.defaultNote !== undefined && (
        <div className="flex items-center gap-1">
          <span className="w-8 shrink-0 font-mono text-[9px] text-muted">Note</span>
          <input
            type="number"
            min={0}
            max={127}
            placeholder={String(def.defaultNote)}
            value={override?.note ?? ''}
            onChange={(e) =>
              onSet({ note: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded bg-surface px-2 py-0.5 font-mono text-[11px] text-text outline-none focus:ring-1 focus:ring-accent/60"
          />
        </div>
      )}
    </div>
  );
}

export const ControlOverridePanel = memo(function ControlOverridePanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const layout = useLayoutStore((s) => s.layout);
  const moduleId = useLayoutStore((s) => s.overridePanelModuleId);
  const pageId = useLayoutStore((s) => s.overridePanelPageId);
  const setControlOverride = useLayoutStore((s) => s.setControlOverride);
  const clearControlOverride = useLayoutStore((s) => s.clearControlOverride);

  if (!layout || !moduleId || !pageId) return null;

  const page = layout.pages.find((p) => p.id === pageId);
  const module = page?.modules.find((m) => m.id === moduleId);
  if (!module) return null;

  const controls = getControls(module.type);

  if (controls.length === 0) {
    return (
      <div className="glass flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-borderSoft/60 px-3 py-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Overrides — {module.type}
          </span>
          <button type="button" onClick={onClose} className="header-btn">
            close
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center text-muted font-mono text-xs">
          No per-control overrides for this module.
        </div>
      </div>
    );
  }

  return (
    <div className="glass flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-borderSoft/60 px-3 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Overrides — {module.type}
        </span>
        <button type="button" onClick={onClose} className="header-btn">
          close
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="flex flex-col gap-2">
          {controls.map((def) => {
            const ov = module.overrides?.controls?.[def.controlId];
            return (
              <ControlRow
                key={def.controlId}
                def={def}
                override={ov}
                onSet={(fields) => setControlOverride(pageId, moduleId, def.controlId, fields)}
                onReset={() => clearControlOverride(pageId, moduleId, def.controlId)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
