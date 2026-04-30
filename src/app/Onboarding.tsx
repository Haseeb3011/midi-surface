import { useEffect, useState } from 'react';
import type { MidiSupportStatus } from '@/features/midi-engine/MidiEngine';
import { checkMidiSupport, midi } from '@/features/midi-engine/MidiEngine';
import { isTauri, openExternal } from '@/app/runtime';

interface OnboardingProps {
  status: MidiSupportStatus | null;
  onContinue: () => void;
  onStatusChange?: (s: MidiSupportStatus) => void;
}

const Step = ({
  num,
  title,
  ok,
  children,
}: {
  num: number;
  title: string;
  ok?: boolean;
  children: React.ReactNode;
}) => (
  <div className="glass flex gap-4 p-5">
    <div
      className={
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm ' +
        (ok ? 'bg-ok/20 text-ok' : 'bg-surfaceHi text-muted')
      }
    >
      {ok ? '✓' : num}
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-text">{title}</h3>
      <div className="mt-1 text-sm text-muted">{children}</div>
    </div>
  </div>
);

const LOOPMIDI_URL = 'https://www.tobias-erichsen.de/software/loopmidi.html';

export function Onboarding({ status, onContinue, onStatusChange }: OnboardingProps) {
  const midiOk = status?.state === 'granted';
  const supported = status?.supported ?? false;
  const tauri = isTauri();
  const [refreshing, setRefreshing] = useState(false);
  const [hasOutputs, setHasOutputs] = useState((status?.outputs ?? 0) > 0);

  useEffect(() => {
    setHasOutputs((status?.outputs ?? 0) > 0);
  }, [status?.outputs]);

  // Auto-refresh ports when the window regains focus — likely after the user
  // came back from running the loopMIDI installer in another window.
  useEffect(() => {
    const handler = (): void => {
      if (!midiOk) return;
      void (async () => {
        const next = await checkMidiSupport();
        onStatusChange?.(next);
        setHasOutputs(next.outputs > 0);
      })();
    };
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [midiOk, onStatusChange]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      // Re-enumerate via MidiEngine + force a status snapshot.
      await midi.ensureAccess();
      const next = await checkMidiSupport();
      onStatusChange?.(next);
      setHasOutputs(next.outputs > 0);
    } finally {
      setRefreshing(false);
    }
  };

  const handleInstallLoopMidi = async (): Promise<void> => {
    await openExternal(LOOPMIDI_URL);
  };

  return (
    <div className="app-shell flex h-full w-full items-center justify-center overflow-auto p-6">
      <div className="w-full max-w-2xl space-y-4">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to MIDI Surface</h1>
          <p className="mt-2 text-sm text-muted">
            Three steps and you&rsquo;re sending MIDI to FL Studio / Ableton.
          </p>
        </header>

        <Step num={1} title="Install loopMIDI (virtual MIDI port)" ok={midiOk && hasOutputs}>
          {midiOk && hasOutputs ? (
            <p>
              Detected {status?.outputs ?? 0} output port(s). You&rsquo;re good to go.
            </p>
          ) : (
            <div className="space-y-3">
              <p>
                MIDI Surface needs a virtual MIDI port so your DAW can listen to it. The simplest
                option is loopMIDI — free, 3 MB, one-time install.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallLoopMidi}
                  className="rounded-lg bg-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-white shadow-glowSoft hover:shadow-glow"
                >
                  Open loopMIDI download page
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-lg bg-surfaceHi/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:text-text disabled:opacity-50"
                >
                  {refreshing ? 'Refreshing…' : 'Refresh ports'}
                </button>
              </div>
              <p className="text-xs text-muted">
                After install: open loopMIDI, click <span className="font-mono">+</span> to create
                a port called <span className="font-mono text-text">MIDI Surface</span>, then come
                back and tap Refresh ports. In your DAW, set that port as a controller input.
              </p>
            </div>
          )}
        </Step>

        <Step
          num={2}
          title={tauri ? 'Web MIDI access' : 'Enable Web MIDI in Brave'}
          ok={midiOk}
        >
          {supported ? (
            midiOk ? (
              <p>Granted.</p>
            ) : tauri ? (
              <p>
                Web MIDI was denied. Restart MIDI Surface — the WebView should grant it
                automatically.
              </p>
            ) : (
              <p>
                Brave blocks Web MIDI by default. Open{' '}
                <span className="font-mono">brave://settings/content/midi</span> and allow this
                site, or click the shield icon &rarr; allow MIDI. Then reload.
              </p>
            )
          ) : (
            <p>
              This browser doesn&rsquo;t expose Web MIDI. Use the desktop app or Brave / Chrome /
              Edge.
            </p>
          )}
        </Step>

        <Step num={3} title="You&rsquo;re ready">
          {tauri ? (
            <p>
              Running as a desktop app. Press <span className="font-mono">F11</span> for fullscreen
              during play.
            </p>
          ) : (
            <p>
              Running in the browser. For best feel, install as a PWA from the address bar, or
              grab the desktop build.
            </p>
          )}
        </Step>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onContinue}
            disabled={!midiOk || !hasOutputs}
            className={
              'rounded-xl px-6 py-3 font-medium transition ' +
              (midiOk && hasOutputs
                ? 'bg-accent text-white shadow-glow hover:shadow-glowSoft'
                : 'cursor-not-allowed bg-surfaceHi text-muted')
            }
          >
            {midiOk && hasOutputs
              ? 'Continue →'
              : !midiOk
                ? 'Waiting for MIDI access…'
                : 'Waiting for a virtual MIDI port…'}
          </button>
        </div>
      </div>
    </div>
  );
}
