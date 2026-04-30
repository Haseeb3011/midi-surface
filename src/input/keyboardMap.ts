/*
  QWERTY -> MIDI fallback.

  Two stacked rows mimic a piano layout (white keys on the home row, black keys
  on the row above), shifted by an octave between them. Useful for testing on
  the laptop keyboard without touching the touchscreen.

  Layout (US QWERTY):
    Black keys:  W E   T Y U   O P
    White keys:  A S D F G H J K L
    + ZX shifts octave -/+, CV shifts velocity -/+.
*/

import { midi } from '@/features/midi-engine/MidiEngine';
import { useSettingsStore } from '@/store/settingsStore';

const KEY_TO_SEMITONE: Record<string, number> = {
  // lower row (white keys, starts at C of current octave)
  KeyA: 0,
  KeyS: 2,
  KeyD: 4,
  KeyF: 5,
  KeyG: 7,
  KeyH: 9,
  KeyJ: 11,
  KeyK: 12,
  KeyL: 14,
  Semicolon: 16,
  Quote: 17,
  // upper row (black keys, where they exist)
  KeyW: 1,
  KeyE: 3,
  KeyT: 6,
  KeyY: 8,
  KeyU: 10,
  KeyO: 13,
  KeyP: 15,
};

let installed = false;
const heldNotes = new Map<string, number>(); // code -> midi note

export function installKeyboardFallback(): void {
  if (installed) return;
  installed = true;

  const isTypingTarget = (e: KeyboardEvent): boolean => {
    const t = e.target as HTMLElement | null;
    if (!t) return false;
    const tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
  };

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (isTypingTarget(e)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const settings = useSettingsStore.getState();

    if (e.code === 'KeyZ') {
      settings.setOctave(settings.octave - 1);
      return;
    }
    if (e.code === 'KeyX') {
      settings.setOctave(settings.octave + 1);
      return;
    }
    if (e.code === 'KeyC') {
      settings.setVelocity(settings.velocity - 8);
      return;
    }
    if (e.code === 'KeyV') {
      settings.setVelocity(settings.velocity + 8);
      return;
    }

    const semitone = KEY_TO_SEMITONE[e.code];
    if (semitone === undefined) return;
    const note = clampMidi(settings.octave * 12 + 12 + semitone);
    if (heldNotes.has(e.code)) return;
    heldNotes.set(e.code, note);
    midi.noteOn(settings.defaultChannel, note, settings.velocity);
    e.preventDefault();
  });

  window.addEventListener('keyup', (e) => {
    if (isTypingTarget(e)) return;
    const note = heldNotes.get(e.code);
    if (note === undefined) return;
    heldNotes.delete(e.code);
    const ch = useSettingsStore.getState().defaultChannel;
    midi.noteOff(ch, note);
  });

  window.addEventListener('blur', () => {
    if (heldNotes.size === 0) return;
    const ch = useSettingsStore.getState().defaultChannel;
    for (const note of heldNotes.values()) midi.noteOff(ch, note);
    heldNotes.clear();
    if (useSettingsStore.getState().panicOnBlur) midi.panic();
  });
}

function clampMidi(n: number): number {
  return Math.max(0, Math.min(127, n));
}
