import { useEffect, useState } from 'react';
import { Onboarding } from '@/app/Onboarding';
import { SettingsPanel } from '@/app/SettingsPanel';
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
  const [onboarded, setOnboarded] = useState<boolean>(
    () => localStorage.getItem('onboarded') === '1',
  );
  const [pane, setPane] = useState<Pane>('none');
  const [fs, setFs] = useState(isFullscreen);

  // Slim, granular store subscriptions — re-render only on the field that changes.
  const outputId = useMidiStore((s) => s.outputId);
  const outputName = useMidiStore(
    (s) => s.ports.find((p) => p.id === s.outputId)?.name ?? 'No output',
  );
  const theme = useSettingsStore((s) => s.theme);
  const defaultChannel = useSettingsStore((s) => s.defaultChannel);
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
      }
    })();
    void bootstrapLayoutStore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply persisted theme on mount and any time it changes.
  useEffect(() => {
    if (theme === 'default') document.documentElement.removeAttribute('data-theme');
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
      <header className="m-2 flex shrink-0 items-center gap-3 px-3 py-2">
        {/* Left: status dot + title */}
        <div className="flex shrink-0 items-center gap-3">
          <div
            className={
              'h-3 w-3 rounded-full transition ' +
              (outputId ? 'bg-ok glow-accent' : 'bg-warn')
            }
          />
          <h1 className="font-mono text-sm tracking-widest text-text/90">MIDI SURFACE</h1>
        </div>

        {/* Center: page tabs */}
        <div className="flex flex-1 justify-center">
          <PageTabs />
        </div>

        {/* Right: port info + action buttons */}
        <div className="flex shrink-0 items-center gap-2 text-xs">
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
                className="rounded-md bg-ok/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ok transition hover:bg-ok/30"
              >
                save
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  void discardChanges();
                }}
                className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted transition hover:text-text"
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
              className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted transition hover:text-text"
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
            onClick={() => setPane(pane === 'presets' ? 'none' : 'presets')}
            className={
              'rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ' +
              (pane === 'presets'
                ? 'bg-accent/20 text-accent'
                : 'bg-surfaceHi/40 text-muted hover:text-text')
            }
          >
            presets
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

      {/* Main area */}
      <div className="flex flex-1 gap-2 overflow-hidden px-2 pb-2">
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
