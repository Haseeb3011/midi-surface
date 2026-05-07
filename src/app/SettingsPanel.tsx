import { useRef } from 'react';
import { useMidiStore } from '@/store/midiStore';
import { useSettingsStore, THEME_NAMES, type ThemeName } from '@/store/settingsStore';
import type { MidiChannel } from '@/features/midi-engine/types';
import { midi } from '@/features/midi-engine/MidiEngine';
import { exportSettings, importSettings } from '@/app/settingsIO';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
      {title}
    </h3>
    {children}
  </div>
);

const THEME_PREVIEWS: Record<ThemeName, { bg: string; accent: string; accent2: string }> = {
  'studio-dark':  { bg: '#0e0c0a', accent: '#e8614a', accent2: '#dc963c' },
  'studio-light': { bg: '#f2ede6', accent: '#e8614a', accent2: '#dc963c' },
};

const THEME_LABELS: Record<ThemeName, string> = {
  'studio-dark':  'Studio Dark',
  'studio-light': 'Studio Light',
};

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ports = useMidiStore((s) => s.ports);
  const outputId = useMidiStore((s) => s.outputId);
  const inputId = useMidiStore((s) => s.inputId);
  const setOutput = useMidiStore((s) => s.setOutput);
  const setInput = useMidiStore((s) => s.setInput);

  const settings = useSettingsStore();
  const outputs = ports.filter((p) => p.type === 'output');
  const inputs = ports.filter((p) => p.type === 'input');

  return (
    <div className="glass flex h-full w-full flex-col">
      <div className="flex items-center gap-1.5 border-b border-borderSoft/60 px-3 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Settings
        </span>
        <div className="flex-1" />
        <button type="button" onClick={onClose} className="header-btn">
          close
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-auto p-4">
        <Section title="MIDI Output (to DAW)">
          <select
            value={outputId ?? ''}
            onChange={(e) => {
              const id = e.target.value || null;
              setOutput(id);
              settings.setOutputId(id);
            }}
            className="w-full rounded-md border border-borderSoft bg-surfaceLow px-3 py-2 font-sans text-[13px] text-text outline-none focus:border-accent/60"
          >
            <option value="">— Select output —</option>
            {outputs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.state === 'disconnected' ? '(disconnected)' : ''}
              </option>
            ))}
          </select>
          {outputs.length === 0 && (
            <p className="font-sans text-[12px] text-warn">
              No outputs detected. Open loopMIDI and create a port.
            </p>
          )}
        </Section>

        <Section title="MIDI Input (from DAW, optional)">
          <select
            value={inputId ?? ''}
            onChange={(e) => {
              const id = e.target.value || null;
              setInput(id);
              settings.setInputId(id);
            }}
            className="w-full rounded-md border border-borderSoft bg-surfaceLow px-3 py-2 font-sans text-[13px] text-text outline-none focus:border-accent/60"
          >
            <option value="">— None —</option>
            {inputs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.state === 'disconnected' ? '(disconnected)' : ''}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Default channel">
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => settings.setDefaultChannel(i as MidiChannel)}
                className={
                  'rounded-md py-1.5 font-sans text-[12px] tabular-nums font-medium transition ' +
                  (settings.defaultChannel === i
                    ? 'bg-accent text-bg shadow-glowSoft'
                    : 'bg-surfaceHi/40 text-muted hover:text-text')
                }
              >
                {i + 1}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Octave / Velocity">
          <div className="flex items-center gap-3">
            <label className="flex-1 font-sans text-[13px] text-textSoft">Octave</label>
            <input
              type="number"
              min={0}
              max={8}
              value={settings.octave}
              onChange={(e) => settings.setOctave(Number(e.target.value))}
              className="w-16 rounded-md border border-borderSoft bg-surfaceLow px-2 py-1 text-right font-sans text-[13px] tabular-nums text-text outline-none focus:border-accent/60"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex-1 font-sans text-[13px] text-textSoft">Velocity</label>
            <input
              type="number"
              min={1}
              max={127}
              value={settings.velocity}
              onChange={(e) => settings.setVelocity(Number(e.target.value))}
              className="w-16 rounded-md border border-borderSoft bg-surfaceLow px-2 py-1 text-right font-sans text-[13px] tabular-nums text-text outline-none focus:border-accent/60"
            />
          </div>
        </Section>

        <Section title="Theme">
          <div className="grid grid-cols-1 gap-1.5">
            {THEME_NAMES.map((t) => {
              const preview = THEME_PREVIEWS[t];
              const isActive = settings.theme === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => settings.setTheme(t)}
                  className={
                    'flex items-center gap-3 rounded-md border px-3 py-2 transition ' +
                    (isActive
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-borderSoft bg-surfaceLow/60 hover:border-border')
                  }
                >
                  <div
                    className="flex h-6 w-12 shrink-0 items-center overflow-hidden rounded-sm border border-borderSoft"
                    style={{ background: preview.bg }}
                  >
                    <div className="h-full w-1/2" style={{ background: preview.accent }} />
                    <div className="h-full w-1/2" style={{ background: preview.accent2 }} />
                  </div>
                  <span
                    className={
                      'flex-1 text-left font-sans text-[12px] font-medium tracking-wide ' +
                      (isActive ? 'text-accent' : 'text-text')
                    }
                  >
                    {THEME_LABELS[t]}
                  </span>
                  {isActive && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
                      active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Behavior">
          <label className="flex items-center justify-between font-sans text-[13px]">
            <span className="text-textSoft">Panic on focus loss</span>
            <input
              type="checkbox"
              checked={settings.panicOnBlur}
              onChange={(e) => settings.setPanicOnBlur(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--accent))]"
            />
          </label>
          <button
            type="button"
            onClick={() => midi.panic()}
            className="w-full rounded-md bg-warn/16 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-warn transition hover:bg-warn/26"
          >
            Panic — All Notes Off
          </button>
        </Section>

        <Section title="QWERTY fallback">
          <p className="font-sans text-[12px] leading-relaxed text-textSoft">
            A–L row plays white keys, W/E/T/Y/U/O/P black. Z/X shift octave, C/V shift velocity.
          </p>
        </Section>

        <Section title="Hotkeys">
          <p className="font-sans text-[12px] leading-relaxed text-textSoft">
            Space play · R record · P perf mode · Esc exit fullscreen/perf · 1–4 pad bank
          </p>
        </Section>

        <Section title="Data">
          <button
            type="button"
            onClick={exportSettings}
            className="w-full rounded-md border border-borderSoft bg-surfaceLow px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted transition hover:bg-surfaceHi hover:text-text"
          >
            Export settings
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-md border border-borderSoft bg-surfaceLow px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted transition hover:bg-surfaceHi hover:text-text"
          >
            Import settings
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importSettings(file);
              e.target.value = '';
            }}
          />
        </Section>
      </div>
    </div>
  );
}
