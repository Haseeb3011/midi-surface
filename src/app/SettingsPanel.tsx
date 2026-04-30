import { useMidiStore } from '@/store/midiStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { MidiChannel } from '@/features/midi-engine/types';
import { midi } from '@/features/midi-engine/MidiEngine';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted">{title}</h3>
    {children}
  </div>
);

export function SettingsPanel({ onClose }: { onClose: () => void }) {
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
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">Settings</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-text"
        >
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
            className="w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-text"
          >
            <option value="">— Select output —</option>
            {outputs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.state === 'disconnected' ? '(disconnected)' : ''}
              </option>
            ))}
          </select>
          {outputs.length === 0 && (
            <p className="text-xs text-warn">
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
            className="w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-text"
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
                  'rounded-md py-1.5 font-mono text-xs transition ' +
                  (settings.defaultChannel === i
                    ? 'bg-accent text-white shadow-glowSoft'
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
            <label className="flex-1 text-sm text-muted">Octave</label>
            <input
              type="number"
              min={0}
              max={8}
              value={settings.octave}
              onChange={(e) => settings.setOctave(Number(e.target.value))}
              className="w-16 rounded-md border border-border/60 bg-surface px-2 py-1 text-right text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex-1 text-sm text-muted">Velocity</label>
            <input
              type="number"
              min={1}
              max={127}
              value={settings.velocity}
              onChange={(e) => settings.setVelocity(Number(e.target.value))}
              className="w-16 rounded-md border border-border/60 bg-surface px-2 py-1 text-right text-sm"
            />
          </div>
        </Section>

        <Section title="Theme">
          <div className="grid grid-cols-4 gap-1">
            {(['default', 'cyber', 'sunset', 'mono'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  settings.setTheme(t);
                  if (t === 'default') document.documentElement.removeAttribute('data-theme');
                  else document.documentElement.setAttribute('data-theme', t);
                }}
                className={
                  'rounded-md py-1.5 font-mono text-[10px] uppercase transition ' +
                  (settings.theme === t
                    ? 'bg-accent/20 text-accent'
                    : 'bg-surfaceHi/40 text-muted hover:text-text')
                }
              >
                {t}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Behavior">
          <label className="flex items-center justify-between text-sm">
            <span className="text-muted">Panic on focus loss</span>
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
            className="w-full rounded-md bg-warn/20 py-2 font-mono text-xs uppercase tracking-widest text-warn hover:bg-warn/30"
          >
            Panic — All Notes Off
          </button>
        </Section>

        <Section title="QWERTY fallback">
          <p className="text-xs text-muted">
            A–L row plays white keys, W/E/T/Y/U/O/P black. Z/X shift octave, C/V shift velocity.
          </p>
        </Section>
      </div>
    </div>
  );
}
