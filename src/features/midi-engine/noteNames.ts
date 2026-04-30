/*
  Tiny utility for rendering MIDI numbers as note names.
  Used by the Activity Monitor and (later) the keyboard module's labels.
*/

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export function midiToNoteName(n: number): string {
  if (n < 0 || n > 127) return '?';
  const name = NAMES[n % 12];
  const octave = Math.floor(n / 12) - 1;
  return `${name}${octave}`;
}
