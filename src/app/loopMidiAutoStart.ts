/*
  loopMIDI auto-start helper.

  On app boot, if no output port is visible and we're under Tauri, give the OS
  a brief moment to enumerate ports, then try to launch loopMIDI from its
  known install paths via the shell plugin's `open()` (which on Windows uses
  ShellExecute to run the .exe). After the spawn, wait up to 3 s for a port
  to appear (the MidiEngine fires onPortsChanged when loopMIDI starts).

  All steps are best-effort — failures (loopMIDI not installed, capability
  blocked, etc.) just resolve false; the inline status pill in the header
  takes over and surfaces actionable buttons to the user.
*/

import { isTauri } from '@/app/runtime';
import { useMidiStore } from '@/store/midiStore';

const LOOPMIDI_PATHS = [
  'C:\\Program Files\\Tobias Erichsen\\loopMIDI\\loopMIDI.exe',
  'C:\\Program Files (x86)\\Tobias Erichsen\\loopMIDI\\loopMIDI.exe',
];

function hasOutputPort(): boolean {
  return useMidiStore.getState().ports.some((p) => p.type === 'output');
}

function refreshPorts(): void {
  useMidiStore.getState().refreshPorts();
}

function waitForPortsOrTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const interval = window.setInterval(() => {
      refreshPorts();
      if (hasOutputPort()) finish();
    }, 250);
    const finish = (): void => {
      if (done) return;
      done = true;
      clearTimeout(t);
      clearInterval(interval);
      unsub();
      resolve();
    };
    const t = setTimeout(finish, ms);
    const unsub = useMidiStore.subscribe((s, prev) => {
      if (s.ports.length > prev.ports.length) finish();
    });
  });
}

/** Spawn loopMIDI.exe via the Tauri shell plugin. Returns true on success. */
async function launchLoopMidi(): Promise<boolean> {
  try {
    const { open } = await import('@tauri-apps/plugin-shell');
    for (const path of LOOPMIDI_PATHS) {
      try {
        await open(path);
        return true;
      } catch {
        /* try next path */
      }
    }
  } catch {
    /* shell plugin import failed */
  }
  return false;
}

/** Returns true iff a port is visible after the auto-start attempt. */
export async function tryAutoStartLoopMidi(): Promise<boolean> {
  if (!isTauri()) return false;
  refreshPorts();
  if (hasOutputPort()) return true;

  // Give the OS a moment to settle in case loopMIDI is already running.
  await waitForPortsOrTimeout(1500);
  refreshPorts();
  if (hasOutputPort()) return true;

  // Try to spawn it.
  const launched = await launchLoopMidi();
  if (!launched) return false;

  // Wait briefly for it to surface its ports.
  await waitForPortsOrTimeout(3000);
  refreshPorts();
  return hasOutputPort();
}

/** Manual launch — used by the MidiStatus popover's "Start loopMIDI" button. */
export async function launchLoopMidiManual(): Promise<void> {
  if (!isTauri()) return;
  await launchLoopMidi();
  await waitForPortsOrTimeout(3000);
  refreshPorts();
}
