/*
  Piano keyboard module — multi-touch with glide, fully responsive,
  zero-React-re-render hot path for key visuals.

  Performance notes:
    - Layout (key positions) is memoized; rebuilt only when octaves /
      containerWidth / height change.
    - Key press visuals are NOT React state. The pointer handlers toggle
      `data-active="1"` on the matching DOM node — see piano-key-white /
      piano-key-black CSS in globals.css. This is the chord-friendly hot path.
    - Hit-testing uses `document.elementFromPoint` so glide between keys is
      cheap (no per-key event handlers, no React reconciliation).
*/

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { midi } from '@/features/midi-engine/MidiEngine';
import { useSettingsStore } from '@/store/settingsStore';
import { useLearnable } from '@/ui/useLearnable';
import { controlId } from '@/features/midi-engine/defaults';

interface KeySpec {
  note: number;
  isBlack: boolean;
  x: number;
  width: number;
  isC: boolean;
}

interface KeyboardLayout {
  whites: KeySpec[];
  blacks: KeySpec[];
  whiteWidth: number;
  whiteHeight: number;
  blackHeight: number;
}

const SEMITONE_PATTERN = [0, 2, 4, 5, 7, 9, 11];
const BLACK_PATTERN = [1, 3, 6, 8, 10];
const BLACK_OFFSETS = [1, 2, 4, 5, 6];
const BLACK_TO_WHITE_RATIO = 0.62;
const BLACK_HEIGHT_RATIO = 0.62;

function buildLayout(
  startOctave: number,
  octaves: number,
  containerWidth: number,
  whiteHeight: number,
): KeyboardLayout {
  const whiteCount = octaves * 7;
  const whiteWidth = containerWidth > 0 ? containerWidth / whiteCount : 36;
  const blackWidth = whiteWidth * BLACK_TO_WHITE_RATIO;
  const blackHeight = whiteHeight * BLACK_HEIGHT_RATIO;
  const whites: KeySpec[] = [];
  const blacks: KeySpec[] = [];

  for (let o = 0; o < octaves; o++) {
    const baseNote = (startOctave + o + 1) * 12;
    const baseX = o * 7 * whiteWidth;
    for (let i = 0; i < 7; i++) {
      const note = baseNote + SEMITONE_PATTERN[i]!;
      whites.push({
        note,
        isBlack: false,
        x: baseX + i * whiteWidth,
        width: whiteWidth,
        isC: i === 0,
      });
    }
    BLACK_PATTERN.forEach((semi, idx) => {
      blacks.push({
        note: baseNote + semi,
        isBlack: true,
        x: baseX + BLACK_OFFSETS[idx]! * whiteWidth - blackWidth / 2,
        width: blackWidth,
        isC: false,
      });
    });
  }
  return { whites, blacks, whiteWidth, whiteHeight, blackHeight };
}

export function PianoKeyboard() {
  const startOctave = useSettingsStore((s) => s.octave);
  const setOctave = useSettingsStore((s) => s.setOctave);
  const channel = useSettingsStore((s) => s.defaultChannel);
  const velocity = useSettingsStore((s) => s.velocity);
  const octaves = useSettingsStore((s) => s.pianoOctaves);
  const setOctaves = useSettingsStore((s) => s.setPianoOctaves);
  const height = useSettingsStore((s) => s.pianoHeight);
  const setHeight = useSettingsStore((s) => s.setPianoHeight);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizeRef = useRef<{ pointerId: number; startY: number; startH: number } | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  /** pointerId -> currently sounding note. Mutated directly; no React state. */
  const activePointers = useRef<Map<number, number>>(new Map());
  /** Refcount of how many pointers are holding a given note (for chords sharing a key). */
  const heldRefs = useRef<Map<number, number>>(new Map());
  const learn = useLearnable('piano:container');

  // Track container width for responsive layout.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
    });
    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => buildLayout(startOctave, octaves, containerWidth, height),
    [startOctave, octaves, containerWidth, height],
  );

  // ---- Visual hot path (no React state) -----------------------------------
  const setKeyVisual = useCallback((note: number, on: boolean): void => {
    const c = containerRef.current;
    if (!c) return;
    const el = c.querySelector(`[data-note="${note}"]`) as HTMLElement | null;
    if (!el) return;
    if (on) el.dataset.active = '1';
    else delete el.dataset.active;
  }, []);

  const acquireNote = useCallback(
    (note: number): void => {
      const refs = heldRefs.current;
      const next = (refs.get(note) ?? 0) + 1;
      refs.set(note, next);
      if (next === 1) {
        midi.noteOn(channel, note, velocity);
        setKeyVisual(note, true);
      }
    },
    [channel, velocity, setKeyVisual],
  );

  const releaseNote = useCallback(
    (note: number): void => {
      const refs = heldRefs.current;
      const next = (refs.get(note) ?? 0) - 1;
      if (next <= 0) {
        refs.delete(note);
        midi.noteOff(channel, note);
        setKeyVisual(note, false);
      } else {
        refs.set(note, next);
      }
    },
    [channel, setKeyVisual],
  );

  // ---- Hit-testing --------------------------------------------------------
  const noteFromTarget = (clientX: number, clientY: number): number | null => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;
    const noteAttr = el.dataset.note;
    if (!noteAttr) return null;
    return Number(noteAttr);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (learn.intercept(e)) return;
    e.preventDefault();
    const note = noteFromTarget(e.clientX, e.clientY);
    if (note === null) return;
    containerRef.current?.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, note);
    acquireNote(note);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const previous = activePointers.current.get(e.pointerId);
    if (previous === undefined) return;
    const note = noteFromTarget(e.clientX, e.clientY);
    if (note === null || note === previous) return;
    releaseNote(previous);
    acquireNote(note);
    activePointers.current.set(e.pointerId, note);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    containerRef.current?.releasePointerCapture?.(e.pointerId);
    const note = activePointers.current.get(e.pointerId);
    if (note === undefined) return;
    releaseNote(note);
    activePointers.current.delete(e.pointerId);
  };

  // Drag the bottom edge to resize.
  const handleResizeDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { pointerId: e.pointerId, startY: e.clientY, startH: height };
  };
  const handleResizeMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (!resizeRef.current || resizeRef.current.pointerId !== e.pointerId) return;
    const dy = e.clientY - resizeRef.current.startY;
    setHeight(resizeRef.current.startH + dy);
  };
  const handleResizeUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (!resizeRef.current || resizeRef.current.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    resizeRef.current = null;
  };

  // Cleanup hung notes on unmount or channel change.
  useEffect(() => {
    const refs = heldRefs.current;
    return () => {
      for (const [note] of refs) midi.noteOff(channel, note);
      refs.clear();
      activePointers.current.clear();
    };
  }, [channel]);

  const showLabels = layout.whiteWidth >= 30;

  return (
    <section className="module-panel">
      <header className="module-header">
        <h3 className="module-title">Keyboard</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">root</span>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setOctave(startOctave - 1);
              }}
              className="header-btn"
              style={{ height: 28, padding: '0 8px' }}
            >
              −
            </button>
            <span className="w-9 text-center font-sans text-[11px] tabular-nums text-textSoft">C{startOctave}</span>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setOctave(startOctave + 1);
              }}
              className="header-btn"
              style={{ height: 28, padding: '0 8px' }}
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">zoom</span>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setOctaves(octaves - 1);
              }}
              className="header-btn"
              style={{ height: 28, padding: '0 8px' }}
            >
              −
            </button>
            <span className="w-12 text-center font-sans text-[11px] tabular-nums text-textSoft">{octaves} oct</span>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setOctaves(octaves + 1);
              }}
              className="header-btn"
              style={{ height: 28, padding: '0 8px' }}
            >
              +
            </button>
          </div>
        </div>
      </header>

      <div ref={wrapperRef} className="relative w-full">
        <div
          ref={containerRef}
          data-control-id="piano:container"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={
            'relative select-none overflow-hidden rounded-md ' +
            (learn.armed
              ? 'ring-2 ring-accent animate-pulse'
              : learn.learnMode
                ? 'ring-1 ring-accent/50'
                : '')
          }
          style={{ width: '100%', height: layout.whiteHeight, touchAction: 'none' }}
        >
          {layout.whites.map((k) => (
            <div
              key={k.note}
              data-note={k.note}
              data-control-id={controlId.pianoKey(k.note)}
              className="piano-key-white"
              style={{ left: k.x, width: Math.max(1, k.width - 1), height: layout.whiteHeight }}
            >
              {showLabels && k.isC && (
                <div className="absolute inset-x-0 bottom-1 text-center font-mono text-[9px] text-bg/70">
                  C{Math.floor(k.note / 12) - 1}
                </div>
              )}
            </div>
          ))}
          {layout.blacks.map((k) => (
            <div
              key={k.note}
              data-note={k.note}
              data-control-id={controlId.pianoKey(k.note)}
              className="piano-key-black"
              style={{ left: k.x, width: k.width, height: layout.blackHeight }}
            />
          ))}
        </div>

        <div
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onPointerCancel={handleResizeUp}
          className="group mt-1 flex h-3 w-full cursor-ns-resize items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <div className="h-[3px] w-10 rounded-full bg-borderSoft transition group-hover:bg-accent/70" />
        </div>
      </div>
    </section>
  );
}
