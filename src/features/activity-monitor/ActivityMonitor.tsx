/*
  Activity Monitor — owns its own ring buffer fed by a `midi.onEvent` listener.
  The listener receives a transient shared MidiEvent reference, so we copy
  the fields we need into a stable record. UI re-renders at 10 Hz via a
  setInterval — diagnostic display, not a real-time scope, so this is plenty
  responsive without burning frames.

  When this component unmounts (panel closed), the listener detaches and the
  MidiEngine sees zero observers → fully zero-overhead send path.
*/

import { memo, useEffect, useRef, useState } from 'react';
import { midi } from '@/features/midi-engine/MidiEngine';
import { midiToNoteName } from '@/features/midi-engine/noteNames';
import type { MidiChannel, MidiEvent, MidiEventKind } from '@/features/midi-engine/types';

type Filter = 'all' | 'in' | 'out';

interface MonitorRecord {
  ts: number;
  direction: 'in' | 'out';
  kind: MidiEventKind;
  channel: MidiChannel | undefined;
  data1: number | undefined;
  data2: number | undefined;
  raw: number[] | undefined;
}

const BUFFER_SIZE = 256;

function describe(e: MonitorRecord): string {
  const ch = e.channel !== undefined ? `ch${e.channel + 1}` : '';
  switch (e.kind) {
    case 'noteOn':
      return `${ch} NOTE ON  ${midiToNoteName(e.data1 ?? 0)} v${e.data2 ?? 0}`;
    case 'noteOff':
      return `${ch} NOTE OFF ${midiToNoteName(e.data1 ?? 0)}`;
    case 'cc':
      return `${ch} CC ${e.data1 ?? 0} = ${e.data2 ?? 0}`;
    case 'pitchBend':
      return `${ch} PITCH ${(((e.data2 ?? 0) << 7) | (e.data1 ?? 0)) - 8192}`;
    case 'programChange':
      return `${ch} PROG ${e.data1 ?? 0}`;
    case 'channelPressure':
      return `${ch} AFTERTOUCH ${e.data1 ?? 0}`;
    case 'polyPressure':
      return `${ch} POLY-AT ${midiToNoteName(e.data1 ?? 0)} ${e.data2 ?? 0}`;
    case 'clock':
      return `CLOCK`;
    case 'start':
      return `START`;
    case 'stop':
      return `STOP`;
    case 'continue':
      return `CONTINUE`;
    case 'sysex':
      return `SYSEX (${e.raw?.length ?? 0}B)`;
    default:
      return `RAW ${(e.raw ?? []).map((b) => b.toString(16).padStart(2, '0')).join(' ')}`;
  }
}

export const ActivityMonitor = memo(function ActivityMonitor({
  onClose,
}: {
  onClose?: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  // Mutable ring buffer — fed from the listener, read on a timer.
  const buffer = useRef<MonitorRecord[]>([]);
  const seq = useRef(0);
  const lastSeq = useRef(0);
  const [, force] = useState(0);

  useEffect(() => {
    const handler = (ev: MidiEvent): void => {
      const buf = buffer.current;
      // Append a stable copy (the source ev is reused on the next event).
      buf.push({
        ts: ev.ts,
        direction: ev.direction,
        kind: ev.kind,
        channel: ev.channel,
        data1: ev.data1,
        data2: ev.data2,
        raw: ev.raw ? ev.raw.slice() : undefined,
      });
      if (buf.length > BUFFER_SIZE) buf.shift();
      seq.current++;
    };
    return midi.onEvent(handler);
  }, []);

  // 10 Hz refresh — only re-render when there are new events.
  useEffect(() => {
    const id = setInterval(() => {
      if (seq.current !== lastSeq.current) {
        lastSeq.current = seq.current;
        force((n) => n + 1);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  const all = buffer.current;
  const visible = (filter === 'all' ? all : all.filter((e) => e.direction === filter))
    .slice(-128)
    .reverse();

  return (
    <div className="glass flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">Activity</span>
        <div className="flex-1" />
        {(['all', 'in', 'out'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              'rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ' +
              (filter === f
                ? 'bg-accent/20 text-accent'
                : 'bg-surfaceHi/40 text-muted hover:text-text')
            }
          >
            {f}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            buffer.current = [];
            seq.current++;
            force((n) => n + 1);
          }}
          className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-text"
        >
          clear
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-surfaceHi/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-text"
          >
            close
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto px-2 py-1 font-mono text-[11px] leading-tight">
        {visible.length === 0 ? (
          <div className="p-4 text-center text-muted">No MIDI events yet — play something.</div>
        ) : (
          visible.map((e, i) => (
            <div
              key={`${e.ts}-${i}`}
              className="flex items-center gap-2 rounded px-2 py-[3px] hover:bg-surfaceHi/40"
            >
              <span
                className={
                  'h-1.5 w-1.5 rounded-full ' +
                  (e.direction === 'in' ? 'bg-accent2' : 'bg-accent')
                }
              />
              <span className="w-12 text-muted">{(e.ts | 0).toString().padStart(5, ' ')}</span>
              <span className="w-7 uppercase text-muted">{e.direction}</span>
              <span className="text-text">{describe(e)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
