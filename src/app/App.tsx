import { useEffect, useState } from 'react';
import { Onboarding } from '@/app/Onboarding';
import { SettingsPanel } from '@/app/SettingsPanel';
import { ActivityMonitor } from '@/features/activity-monitor/ActivityMonitor';
import { Transport } from '@/features/transport/Transport';
import { KnobRow } from '@/features/knobs/KnobRow';
import { FaderRow } from '@/features/faders/FaderRow';
import { Wheels } from '@/features/pitchbend-modwheel/Wheels';
import { PianoKeyboard } from '@/features/keyboard/PianoKeyboard';
import { PadGrid } from '@/features/pads/PadGrid';
import {
  checkMidiSupport,
  midi,
  type MidiSupportStatus,
} from '@/features/midi-engine/MidiEngine';
import { useMidiStore, bootstrapMidiStore } from '@/store/midiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useLearnStore } from '@/store/learnStore';

type Pane = 'none' | 'settings' | 'activity';

function isFullscreen(): boolean {
  return document.fullscreenElement !== null;
}

async function toggleFullscreen(): Promise<void> {
  try {
    if (isFullscreen()) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    /* ignore — browsers reject without a user gesture */
  }
}

export function App() {
  const [status, setStatus] = useState<MidiSupportStatus | null>(null);
  const [onboarded, setOnboarded] = useState<boolean>(
    () => localStorage.getItem('onboarded') === '1',
  );
  const [pane, setPane] = useState<Pane>('none');
  const [fs, setFs] = useState(isFullscreen);

  // Slim, granular store subscriptions — re-render only on the field that
  // actually changes.
  const outputId = useMidiStore((s) => s.outputId);
  const outputName = useMidiStore(
    (s) => s.ports.find((p) => p.id === s.outputId)?.name ?? 'No output',
  );
  const theme = useSettingsStore((s) => s.theme);
  const defaultChannel = useSettingsStore((s) => s.defaultChannel);
  const learnMode = useLearnStore((s) => s.learnMode);
  const toggleLearnMode = useLearnStore((s) => s.toggleLearnMode);

  // Boot MIDI engine + stores once.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await checkMidiSupport();
      if (cancelled) return;
      setStatus(s);
      if (s.state === 'granted') {
        bootstrapMidiStore();
        const restoredOut = useSettingsStore.getState().outputId;
        const restoredIn = useSettingsStore.getState().inputId;
        if (restoredOut) useMidiStore.getState().setOutput(restoredOut);
        if (restoredIn) useMidiStore.getState().setInput(restoredIn);
        useMidiStore.getState().refreshPorts();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply persisted theme on mount and any time it changes.
  useEffect(() => {
    if (theme === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Attach the learn listener ONLY when learn mode is on. While off, the
  // MidiEngine has zero observers — every send method short-circuits past the
  // broadcast block, keeping the play hot path allocation- and React-free.
  useEffect(() => {
    if (!learnMode) return;
    return midi.onEvent((e) => {
      useLearnStore.getState().captureFromEvent(e);
    });
  }, [learnMode]);

  // Track fullscreen state for the header indicator.
  useEffect(() => {
    const handler = (): void => setFs(isFullscreen());
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleContinue = (): void => {
    localStorage.setItem('onboarded', '1');
    setOnboarded(true);
  };

  if (!onboarded || status?.state !== 'granted') {
    return (
      <Onboarding
        status={status}
        onContinue={handleContinue}
        onStatusChange={(s) => {
          setStatus(s);
          if (s.state === 'granted') {
            bootstrapMidiStore();
            useMidiStore.getState().refreshPorts();
          }
        }}
      />
    );
  }

  return (
    <div className="app-shell relative flex h-full w-full flex-col overflow-hidden">
      {/* Header */}
      <header className="m-2 flex shrink-0 items-center justify-between gap-3 px-3 py-2">
        <div className="flex items-center gap-3">
          <div
            className={
              'h-3 w-3 rounded-full transition ' +
              (outputId ? 'bg-ok glow-accent' : 'bg-warn')
            }
          />
          <h1 className="font-mono text-sm tracking-widest text-text/90">MIDI SURFACE</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-muted">
            out: <span className="text-text">{outputName}</span>
          </span>
          <span className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-muted">
            ch{defaultChannel + 1}
          </span>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              void toggleFullscreen();
            }}
            title="Fullscreen (recommended for touchscreen play)"
            className={
              'rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ' +
              (fs ? 'bg-accent/20 text-accent' : 'bg-surfaceHi/40 text-muted hover:text-text')
            }
          >
            {fs ? 'exit fs' : 'fullscreen'}
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              toggleLearnMode();
            }}
            className={
              'rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ' +
              (learnMode
                ? 'bg-accent text-white shadow-glowSoft animate-pulse'
                : 'bg-surfaceHi/40 text-muted hover:text-text')
            }
          >
            learn
          </button>
          <button
            type="button"
            onClick={() => setPane(pane === 'activity' ? 'none' : 'activity')}
            className={
              'rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ' +
              (pane === 'activity'
                ? 'bg-accent/20 text-accent'
                : 'bg-surfaceHi/40 text-muted hover:text-text')
            }
          >
            activity
          </button>
          <button
            type="button"
            onClick={() => setPane(pane === 'settings' ? 'none' : 'settings')}
            className={
              'rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ' +
              (pane === 'settings'
                ? 'bg-accent/20 text-accent'
                : 'bg-surfaceHi/40 text-muted hover:text-text')
            }
          >
            settings
          </button>
        </div>
      </header>

      {/* Main area: top row (controls) + bottom row (full-width piano).
          Top row is flex-1 + min-h-0 + overflow-auto so it can scroll if the
          viewport is too short instead of clipping content. */}
      <div className="flex flex-1 gap-2 overflow-hidden px-2 pb-2">
        <div className="flex flex-1 flex-col gap-2 overflow-hidden">
          <Transport />
          <div className="flex min-h-0 flex-1 gap-2 overflow-auto">
            <div className="flex flex-1 flex-col gap-2">
              <KnobRow />
              <FaderRow />
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <PadGrid />
              <Wheels />
            </div>
          </div>
          <PianoKeyboard />
        </div>

        {pane !== 'none' && (
          <aside className="w-[360px] shrink-0">
            {pane === 'settings' ? (
              <SettingsPanel onClose={() => setPane('none')} />
            ) : (
              <ActivityMonitor onClose={() => setPane('none')} />
            )}
          </aside>
        )}
      </div>

      {learnMode && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <div className="glass rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-accent">
            learn mode — tap a control, then send MIDI from your DAW or device
          </div>
        </div>
      )}
    </div>
  );
}
