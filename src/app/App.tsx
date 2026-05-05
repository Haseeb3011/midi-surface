import { useEffect, useState } from 'react';
import { SettingsPanel } from '@/app/SettingsPanel';
import { MidiStatus } from '@/app/MidiStatus';
import { tryAutoStartLoopMidi } from '@/app/loopMidiAutoStart';
import { ActivityMonitor } from '@/features/activity-monitor/ActivityMonitor';
import { LayoutRenderer } from '@/features/layout/LayoutRenderer';
import { PageTabs } from '@/features/layout/PageTabs';
import { ControlOverridePanel } from '@/features/layout/ControlOverridePanel';
import { PresetBrowser } from '@/features/layout/PresetBrowser';
import {
  checkMidiSupport,
  midi,
  type MidiSupportStatus,
} from '@/features/midi-engine/MidiEngine';
import { useMidiStore, bootstrapMidiStore } from '@/store/midiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useLearnStore } from '@/store/learnStore';
import { useLayoutStore, bootstrapLayoutStore } from '@/store/layoutStore';

type Pane = 'none' | 'settings' | 'activity' | 'presets';

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
  const [pane, setPane] = useState<Pane>('none');
  const [fs, setFs] = useState(isFullscreen);

  // Slim, granular store subscriptions — re-render only on the field that changes.
  const theme = useSettingsStore((s) => s.theme);
  const learnMode = useLearnStore((s) => s.learnMode);
  const toggleLearnMode = useLearnStore((s) => s.toggleLearnMode);
  const layout = useLayoutStore((s) => s.layout);
  const activePageIndex = useLayoutStore((s) => s.activePageIndex);
  const editMode = useLayoutStore((s) => s.editMode);
  const toggleEditMode = useLayoutStore((s) => s.toggleEditMode);
  const saveLayout = useLayoutStore((s) => s.saveLayout);
  const saveLayoutAs = useLayoutStore((s) => s.saveLayoutAs);
  const discardChanges = useLayoutStore((s) => s.discardChanges);
  const overridePanelModuleId = useLayoutStore((s) => s.overridePanelModuleId);
  const closeOverridePanel = useLayoutStore((s) => s.closeOverridePanel);

  const activePage = layout?.pages[activePageIndex];

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
        // Best-effort: if no output port appears on its own, try to launch
        // loopMIDI from its known install path. Silent no-op when not under
        // Tauri or when loopMIDI isn't installed.
        void (async () => {
          await tryAutoStartLoopMidi();
          if (cancelled) return;
          useMidiStore.getState().refreshPorts();
          setStatus(await checkMidiSupport());
        })();
      }
    })();
    void bootstrapLayoutStore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply persisted theme on mount and any time it changes.
  // 'landr' lives on :root, so no data-theme attribute is needed for it.
  useEffect(() => {
    if (theme === 'landr') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Attach the learn listener ONLY when learn mode is on.
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

  // Stale `onboarded` localStorage key from earlier versions — clean up so
  // it doesn't linger in user storage forever.
  useEffect(() => {
    if (localStorage.getItem('onboarded') !== null) {
      localStorage.removeItem('onboarded');
    }
  }, []);

  // No splash gate — the app shell renders immediately. Status (granted /
  // denied / no port) is reflected inline by <MidiStatus />, which also
  // handles the recovery actions we used to show in the Onboarding screen.

  return (
    <div className="app-shell relative flex h-full w-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-4 border-b border-borderSoft/60 px-4 py-2.5">
        {/* Left: title only — port status moved into <MidiStatus /> */}
        <div className="flex shrink-0 items-center gap-2.5">
          <h1 className="font-mono text-[12px] font-semibold tracking-[0.22em] text-text/90">MIDI SURFACE</h1>
        </div>

        {/* Center: page tabs */}
        <div className="flex flex-1 justify-center">
          <PageTabs />
        </div>

        {/* Right: live MIDI status + action buttons */}
        <div className="flex shrink-0 items-center gap-1.5">
          <MidiStatus status={status} onStatusChange={setStatus} />
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              void toggleFullscreen();
            }}
            title="Fullscreen (recommended for touchscreen play)"
            className="header-btn"
            data-active={fs ? 'true' : 'false'}
          >
            {fs ? 'exit fs' : 'fullscreen'}
          </button>
          {/* Edit mode controls */}
          {editMode ? (
            <>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (layout?.isBuiltIn) {
                    const name = window.prompt(
                      'Save as new layout:',
                      `${layout.name} (custom)`,
                    );
                    if (name) void saveLayoutAs(name);
                  } else {
                    void saveLayout();
                  }
                  toggleEditMode();
                }}
                className="header-btn"
                data-tone="ok"
              >
                save
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  void discardChanges();
                }}
                className="header-btn"
              >
                discard
              </button>
            </>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                toggleEditMode();
              }}
              title="Edit layout"
              className="header-btn"
            >
              edit
            </button>
          )}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              toggleLearnMode();
            }}
            className={'header-btn ' + (learnMode ? 'animate-pulse' : '')}
            data-active={learnMode ? 'true' : 'false'}
          >
            learn
          </button>
          <button
            type="button"
            onClick={() => setPane(pane === 'activity' ? 'none' : 'activity')}
            className="header-btn"
            data-active={pane === 'activity' ? 'true' : 'false'}
          >
            activity
          </button>
          <button
            type="button"
            onClick={() => setPane(pane === 'presets' ? 'none' : 'presets')}
            className="header-btn"
            data-active={pane === 'presets' ? 'true' : 'false'}
          >
            presets
          </button>
          <button
            type="button"
            onClick={() => setPane(pane === 'settings' ? 'none' : 'settings')}
            className="header-btn"
            data-active={pane === 'settings' ? 'true' : 'false'}
          >
            settings
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 gap-3 overflow-hidden p-3">
        <div className="min-h-0 flex-1 overflow-auto">
          {activePage ? (
            <LayoutRenderer pageId={activePage.id} />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-xs text-muted">
              Loading…
            </div>
          )}
        </div>

        {(pane !== 'none' || overridePanelModuleId) && (
          <aside className="w-[360px] shrink-0">
            {overridePanelModuleId ? (
              <ControlOverridePanel
                onClose={() => {
                  closeOverridePanel();
                  setPane('none');
                }}
              />
            ) : pane === 'settings' ? (
              <SettingsPanel onClose={() => setPane('none')} />
            ) : pane === 'activity' ? (
              <ActivityMonitor onClose={() => setPane('none')} />
            ) : pane === 'presets' ? (
              <PresetBrowser onClose={() => setPane('none')} />
            ) : null}
          </aside>
        )}
      </div>

      {/* Edit mode overlay indicator */}
      {editMode && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <div className="glass rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-accent/80">
            edit mode — drag to reorder · save or discard when done
          </div>
        </div>
      )}

      {/* Learn mode indicator */}
      {learnMode && !editMode && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <div className="glass rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-accent">
            learn mode — tap a control, then send MIDI from your DAW or device
          </div>
        </div>
      )}
    </div>
  );
}
