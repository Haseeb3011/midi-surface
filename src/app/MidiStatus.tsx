/*
  MidiStatus — header pill that reports live loopMIDI / Web MIDI status and
  exposes recovery actions in a popover. Replaces the old full-screen
  Onboarding splash.

  States:
   - connected:   green dot, port name, channel pill
   - no-port:     amber dot + "no MIDI port", popover with Start / Refresh /
                  Open download buttons
   - denied:      red dot + "MIDI denied" (browser fallback), popover with
                  permission instructions
   - unsupported: red dot + "MIDI unsupported" (browser fallback)
*/

import { memo, useEffect, useRef, useState } from 'react';
import type { MidiSupportStatus } from '@/features/midi-engine/MidiEngine';
import { checkMidiSupport, midi } from '@/features/midi-engine/MidiEngine';
import { useMidiStore } from '@/store/midiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { isTauri, openExternal } from '@/app/runtime';
import { launchLoopMidiManual } from '@/app/loopMidiAutoStart';

const LOOPMIDI_URL = 'https://www.tobias-erichsen.de/software/loopmidi.html';

interface Props {
  status: MidiSupportStatus | null;
  onStatusChange: (s: MidiSupportStatus) => void;
}

type Tone = 'ok' | 'warn' | 'err';

export const MidiStatus = memo(function MidiStatus({ status, onStatusChange }: Props) {
  const outputId = useMidiStore((s) => s.outputId);
  const outputName = useMidiStore(
    (s) => s.ports.find((p) => p.id === s.outputId)?.name ?? null,
  );
  const defaultChannel = useSettingsStore((s) => s.defaultChannel);

  const supported = status?.supported ?? false;
  const granted = status?.state === 'granted';
  const tauri = isTauri();
  const hasPort = !!outputId && !!outputName;

  let tone: Tone;
  let label: string;
  if (granted && hasPort) {
    tone = 'ok';
    label = outputName!;
  } else if (granted) {
    tone = 'warn';
    label = 'no MIDI port';
  } else if (!supported) {
    tone = 'err';
    label = 'MIDI unsupported';
  } else {
    tone = 'err';
    label = 'MIDI denied';
  }

  const [openPopover, setOpenPopover] = useState(false);
  const [busy, setBusy] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Click-outside dismiss.
  useEffect(() => {
    if (!openPopover) return;
    const onDown = (e: PointerEvent): void => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpenPopover(false);
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [openPopover]);

  // Auto-refresh status when window regains focus (user came back from
  // running loopMIDI manually). Mirrors the old Onboarding behavior.
  useEffect(() => {
    const handler = (): void => {
      if (!supported) return;
      void (async () => {
        const next = await checkMidiSupport();
        onStatusChange(next);
      })();
    };
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [supported, onStatusChange]);

  const handleStartLoopMidi = async (): Promise<void> => {
    setBusy(true);
    try {
      await launchLoopMidiManual();
      const next = await checkMidiSupport();
      onStatusChange(next);
      useMidiStore.getState().refreshPorts();
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setBusy(true);
    try {
      await midi.ensureAccess();
      const next = await checkMidiSupport();
      onStatusChange(next);
      useMidiStore.getState().refreshPorts();
    } finally {
      setBusy(false);
    }
  };

  const dotClass =
    tone === 'ok'
      ? 'bg-ok shadow-[0_0_10px_rgb(var(--ok)/0.7)]'
      : tone === 'warn'
        ? 'bg-warn'
        : 'bg-warn opacity-80';

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpenPopover((v) => !v)}
        title={
          tone === 'ok'
            ? 'MIDI output connected'
            : 'Open MIDI status / diagnostics'
        }
        className="flex h-8 items-center gap-2 rounded-md bg-surfaceHi/40 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition hover:bg-surfaceHi/70 hover:text-text"
      >
        <span className={'h-2.5 w-2.5 rounded-full transition ' + dotClass} />
        <span className={tone === 'ok' ? 'text-text' : 'text-muted'}>
          out:&nbsp;<span className={tone === 'ok' ? 'text-text' : 'text-text/80'}>{label}</span>
        </span>
      </button>
      <span className="flex h-8 items-center rounded-md bg-surfaceHi/40 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        ch{defaultChannel + 1}
      </span>

      {openPopover && (
        <div
          ref={popoverRef}
          className="glass absolute right-0 top-10 z-50 w-80 p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className={'h-2 w-2 rounded-full ' + dotClass} />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              MIDI status
            </span>
          </div>

          {tone === 'ok' && (
            <p className="font-sans text-[12px] leading-relaxed text-textSoft">
              Connected to <span className="text-text">{outputName}</span>. Sending on
              channel <span className="text-text">{defaultChannel + 1}</span>.
            </p>
          )}

          {tone === 'warn' && (
            <div className="space-y-3">
              <p className="font-sans text-[12px] leading-relaxed text-textSoft">
                MIDI access is granted, but no output port is visible. loopMIDI may not
                be running yet, or no virtual port has been created.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tauri && (
                  <button
                    type="button"
                    onClick={() => void handleStartLoopMidi()}
                    disabled={busy}
                    className="header-btn"
                    data-tone="accent"
                  >
                    {busy ? 'starting…' : 'start loopMIDI'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={busy}
                  className="header-btn"
                >
                  refresh
                </button>
                <button
                  type="button"
                  onClick={() => void openExternal(LOOPMIDI_URL)}
                  className="header-btn"
                >
                  download loopMIDI
                </button>
              </div>
              <p className="font-sans text-[11px] leading-relaxed text-muted">
                Tip: in loopMIDI, click <span className="font-mono">+</span> to create a
                port called <span className="font-mono text-text">MIDI Surface</span>,
                then click refresh.
              </p>
            </div>
          )}

          {tone === 'err' && !supported && (
            <p className="font-sans text-[12px] leading-relaxed text-textSoft">
              This browser doesn't expose Web MIDI. Use the desktop app, or open MIDI
              Surface in Brave / Chrome / Edge.
            </p>
          )}

          {tone === 'err' && supported && (
            <div className="space-y-3">
              <p className="font-sans text-[12px] leading-relaxed text-textSoft">
                {tauri
                  ? 'Web MIDI was denied inside the app shell. Restarting MIDI Surface should fix it.'
                  : 'The browser is blocking Web MIDI. In Brave: open '}
                {!tauri && (
                  <span className="font-mono text-text">brave://settings/content/midi</span>
                )}
                {!tauri && ' and allow this site, then reload.'}
              </p>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={busy}
                className="header-btn"
              >
                refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
