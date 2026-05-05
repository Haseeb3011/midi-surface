/*
  MIDI Engine — performance-tuned hot path.

  Platform split:
    - **Tauri (desktop):** outputs go through the native WinMM bridge
      (`src-tauri/src/native_midi.rs`). Web MIDI is used only for inputs
      (MIDI Learn / Activity Monitor capture). WebView2's Web MIDI output
      enumeration has been observed to silently return zero ports even when
      access is granted, so we don't trust it for outbound traffic.
    - **Browser PWA:** Web MIDI for both inputs and outputs (no other choice).

  Hot-path goal: when nothing is observing MIDI events (Activity Monitor
  closed, Learn mode off), every send method should pack 2-3 bytes into a
  pre-allocated buffer and dispatch — no allocation, no Zustand updates, no
  React re-renders.
*/

import type { MidiChannel, MidiEvent, MidiEventKind, MidiPortInfo } from './types';
import {
  listNativeMidiOutputs,
  nativeMidiId,
  parseNativeMidiId,
  selectNativeMidiOutput,
  sendNativeMidiShort,
} from '@/app/nativeMidi';
import { isTauri } from '@/app/runtime';

export interface MidiSupportStatus {
  supported: boolean;
  state: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'error';
  inputs: number;
  outputs: number;
  error?: string;
}

type Listener<T> = (value: T) => void;

class MidiEngineImpl {
  private access: MIDIAccess | null = null;
  private selectedOutputId: string | null = null;
  private selectedInputId: string | null = null;
  private inputHandler: ((e: MIDIMessageEvent) => void) | null = null;
  private nativeOutputs: MidiPortInfo[] = [];
  private tauri = false;

  private portsListeners = new Set<Listener<MidiPortInfo[]>>();
  private eventListeners = new Set<Listener<MidiEvent>>();

  // Pre-allocated send buffers. MIDIOutput.send() copies synchronously, so
  // reuse is safe.
  private out2 = new Uint8Array(2);
  private out3 = new Uint8Array(3);

  // Single shared event object for broadcasting. Listeners must NOT retain
  // a reference — fields are overwritten on the next event.
  private broadcastEv: MidiEvent = {
    ts: 0,
    direction: 'out',
    kind: 'unknown',
  };

  // ---- lifecycle ------------------------------------------------------------

  async ensureAccess(): Promise<MIDIAccess | null> {
    if (this.access) return this.access;
    this.tauri = isTauri();
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      if (this.tauri) return null;
      throw new Error('Web MIDI API is not supported in this browser.');
    }
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false, software: true });
      this.access.onstatechange = () => this.emitPorts();
    } catch (err) {
      // Under Tauri we tolerate Web MIDI being unavailable — outputs use WinMM.
      // Inputs (Learn / Activity Monitor) just won't work in that case.
      if (this.tauri) return null;
      throw err;
    }
    return this.access;
  }

  async checkSupport(): Promise<MidiSupportStatus> {
    this.tauri = isTauri();

    if (this.tauri) {
      await this.refreshNativeOutputs();
      try {
        await this.ensureAccess();
      } catch {
        /* inputs unavailable — outputs still work via WinMM */
      }
      return {
        supported: true,
        state: 'granted',
        inputs: this.access?.inputs.size ?? 0,
        outputs: this.nativeOutputs.length,
      };
    }

    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      return { supported: false, state: 'unsupported', inputs: 0, outputs: 0 };
    }

    try {
      const access = await this.ensureAccess();
      if (!access) {
        return { supported: false, state: 'error', inputs: 0, outputs: 0 };
      }
      return {
        supported: true,
        state: 'granted',
        inputs: access.inputs.size,
        outputs: access.outputs.size,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const denied = /denied|secur|not allowed|permission/i.test(msg);
      return {
        supported: true,
        state: denied ? 'denied' : 'error',
        inputs: 0,
        outputs: 0,
        error: msg,
      };
    }
  }

  // ---- ports ----------------------------------------------------------------

  listPorts(): MidiPortInfo[] {
    const out: MidiPortInfo[] = [];
    if (this.access) {
      for (const p of this.access.inputs.values()) out.push(this.toInfo(p, 'input'));
      if (!this.tauri) {
        for (const p of this.access.outputs.values()) out.push(this.toInfo(p, 'output'));
      }
    }
    if (this.tauri) out.push(...this.nativeOutputs);
    return out;
  }

  async refreshNativeOutputs(): Promise<void> {
    if (!this.tauri) return;
    const outputs = await listNativeMidiOutputs();
    this.nativeOutputs = outputs.map((p) => ({
      id: nativeMidiId(p.id),
      name: p.name,
      manufacturer: 'Windows MIDI',
      state: 'connected',
      type: 'output',
    }));
    this.emitPorts();
  }

  onPortsChanged(listener: Listener<MidiPortInfo[]>): () => void {
    this.portsListeners.add(listener);
    listener(this.listPorts());
    return () => {
      this.portsListeners.delete(listener);
    };
  }

  private emitPorts(): void {
    const snap = this.listPorts();
    for (const l of this.portsListeners) l(snap);
  }

  private toInfo(p: MIDIPort, type: 'input' | 'output'): MidiPortInfo {
    return {
      id: p.id,
      name: p.name ?? '(unnamed)',
      manufacturer: p.manufacturer ?? '',
      state: p.state === 'connected' ? 'connected' : 'disconnected',
      type,
    };
  }

  // ---- output ---------------------------------------------------------------

  selectOutput(id: string | null): void {
    this.selectedOutputId = id;
    if (this.tauri) {
      void selectNativeMidiOutput(parseNativeMidiId(id));
    }
  }

  getSelectedOutputId(): string | null {
    return this.selectedOutputId;
  }

  private getWebOutput(): MIDIOutput | null {
    if (this.tauri) return null;
    if (!this.access || !this.selectedOutputId) return null;
    return this.access.outputs.get(this.selectedOutputId) ?? null;
  }

  private getNativeOutput(): MidiPortInfo | null {
    if (!this.tauri) return null;
    if (parseNativeMidiId(this.selectedOutputId) === null) return null;
    return this.nativeOutputs.find((p) => p.id === this.selectedOutputId) ?? null;
  }

  /** Generic 1..N byte send. Browser path only — no equivalent in WinMM bridge. */
  send(bytes: number[] | Uint8Array): void {
    const out = this.getWebOutput();
    if (!out) return;
    out.send(bytes);
  }

  noteOn(channel: MidiChannel, note: number, velocity = 100): void {
    if (this.tauri) {
      const native = this.getNativeOutput();
      if (!native) return;
      sendNativeMidiShort(0x90 | channel, note, velocity);
      if (this.eventListeners.size > 0) {
        this.broadcast(
          'out',
          velocity === 0 ? 'noteOff' : 'noteOn',
          channel,
          note,
          velocity,
          native.id,
          native.name,
        );
      }
      return;
    }
    const out = this.getWebOutput();
    if (!out) return;
    const buf = this.out3;
    buf[0] = 0x90 | channel;
    buf[1] = note & 0x7f;
    buf[2] = velocity & 0x7f;
    out.send(buf);
    if (this.eventListeners.size > 0) {
      this.broadcast(
        'out',
        velocity === 0 ? 'noteOff' : 'noteOn',
        channel,
        note,
        velocity,
        out.id,
        out.name ?? '',
      );
    }
  }

  noteOff(channel: MidiChannel, note: number, velocity = 0): void {
    if (this.tauri) {
      const native = this.getNativeOutput();
      if (!native) return;
      sendNativeMidiShort(0x80 | channel, note, velocity);
      if (this.eventListeners.size > 0) {
        this.broadcast('out', 'noteOff', channel, note, velocity, native.id, native.name);
      }
      return;
    }
    const out = this.getWebOutput();
    if (!out) return;
    const buf = this.out3;
    buf[0] = 0x80 | channel;
    buf[1] = note & 0x7f;
    buf[2] = velocity & 0x7f;
    out.send(buf);
    if (this.eventListeners.size > 0) {
      this.broadcast('out', 'noteOff', channel, note, velocity, out.id, out.name ?? '');
    }
  }

  cc(channel: MidiChannel, cc: number, value: number): void {
    if (this.tauri) {
      const native = this.getNativeOutput();
      if (!native) return;
      sendNativeMidiShort(0xb0 | channel, cc, value);
      if (this.eventListeners.size > 0) {
        this.broadcast('out', 'cc', channel, cc, value, native.id, native.name);
      }
      return;
    }
    const out = this.getWebOutput();
    if (!out) return;
    const buf = this.out3;
    buf[0] = 0xb0 | channel;
    buf[1] = cc & 0x7f;
    buf[2] = value & 0x7f;
    out.send(buf);
    if (this.eventListeners.size > 0) {
      this.broadcast('out', 'cc', channel, cc, value, out.id, out.name ?? '');
    }
  }

  pitchBend(channel: MidiChannel, value14: number): void {
    const v = Math.max(0, Math.min(0x3fff, value14 | 0));
    const lsb = v & 0x7f;
    const msb = (v >> 7) & 0x7f;
    if (this.tauri) {
      const native = this.getNativeOutput();
      if (!native) return;
      sendNativeMidiShort(0xe0 | channel, lsb, msb);
      if (this.eventListeners.size > 0) {
        this.broadcast('out', 'pitchBend', channel, lsb, msb, native.id, native.name);
      }
      return;
    }
    const out = this.getWebOutput();
    if (!out) return;
    const buf = this.out3;
    buf[0] = 0xe0 | channel;
    buf[1] = lsb;
    buf[2] = msb;
    out.send(buf);
    if (this.eventListeners.size > 0) {
      this.broadcast('out', 'pitchBend', channel, lsb, msb, out.id, out.name ?? '');
    }
  }

  programChange(channel: MidiChannel, program: number): void {
    if (this.tauri) {
      const native = this.getNativeOutput();
      if (!native) return;
      sendNativeMidiShort(0xc0 | channel, program, 0);
      if (this.eventListeners.size > 0) {
        this.broadcast('out', 'programChange', channel, program, undefined, native.id, native.name);
      }
      return;
    }
    const out = this.getWebOutput();
    if (!out) return;
    const buf = this.out2;
    buf[0] = 0xc0 | channel;
    buf[1] = program & 0x7f;
    out.send(buf);
    if (this.eventListeners.size > 0) {
      this.broadcast('out', 'programChange', channel, program, undefined, out.id, out.name ?? '');
    }
  }

  channelPressure(channel: MidiChannel, value: number): void {
    if (this.tauri) {
      const native = this.getNativeOutput();
      if (!native) return;
      sendNativeMidiShort(0xd0 | channel, value, 0);
      if (this.eventListeners.size > 0) {
        this.broadcast('out', 'channelPressure', channel, value, undefined, native.id, native.name);
      }
      return;
    }
    const out = this.getWebOutput();
    if (!out) return;
    const buf = this.out2;
    buf[0] = 0xd0 | channel;
    buf[1] = value & 0x7f;
    out.send(buf);
    if (this.eventListeners.size > 0) {
      this.broadcast('out', 'channelPressure', channel, value, undefined, out.id, out.name ?? '');
    }
  }

  allNotesOff(channel: MidiChannel): void {
    this.cc(channel, 123, 0);
  }

  panic(): void {
    for (let ch = 0; ch < 16; ch++) {
      this.cc(ch as MidiChannel, 120, 0); // all sound off
      this.cc(ch as MidiChannel, 123, 0); // all notes off
    }
  }

  // ---- input ----------------------------------------------------------------

  selectInput(id: string | null): void {
    if (this.selectedInputId === id) return;
    this.detachInput();
    this.selectedInputId = id;
    this.attachInput();
  }

  getSelectedInputId(): string | null {
    return this.selectedInputId;
  }

  private detachInput(): void {
    if (!this.access || !this.selectedInputId || !this.inputHandler) return;
    const port = this.access.inputs.get(this.selectedInputId);
    if (port) port.onmidimessage = null;
    this.inputHandler = null;
  }

  private attachInput(): void {
    if (!this.access || !this.selectedInputId) return;
    const port = this.access.inputs.get(this.selectedInputId);
    if (!port) return;
    const handler = (e: MIDIMessageEvent): void => {
      if (this.eventListeners.size === 0) return;
      this.parseAndBroadcast(e, port);
    };
    port.onmidimessage = handler;
    this.inputHandler = handler;
  }

  // ---- listeners ------------------------------------------------------------

  onEvent(listener: Listener<MidiEvent>): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private broadcast(
    direction: 'in' | 'out',
    kind: MidiEventKind,
    channel: MidiChannel | undefined,
    data1: number | undefined,
    data2: number | undefined,
    portId: string,
    portName: string,
    raw?: number[],
  ): void {
    const ev = this.broadcastEv;
    ev.ts = performance.now();
    ev.direction = direction;
    ev.kind = kind;
    ev.channel = channel;
    ev.data1 = data1;
    ev.data2 = data2;
    ev.portId = portId;
    ev.portName = portName;
    ev.raw = raw;
    for (const l of this.eventListeners) l(ev);
  }

  private parseAndBroadcast(e: MIDIMessageEvent, port: MIDIInput): void {
    const data = e.data;
    if (!data || data.length === 0) return;
    const status = data[0];
    if (status === undefined) return;
    const ch = (status & 0x0f) as MidiChannel;
    const high = status & 0xf0;

    let kind: MidiEventKind = 'unknown';
    let data1: number | undefined;
    let data2: number | undefined;
    let channel: MidiChannel | undefined;

    switch (high) {
      case 0x80:
        kind = 'noteOff';
        data1 = data[1];
        data2 = data[2];
        channel = ch;
        break;
      case 0x90:
        data1 = data[1];
        data2 = data[2];
        kind = (data2 ?? 0) === 0 ? 'noteOff' : 'noteOn';
        channel = ch;
        break;
      case 0xa0:
        kind = 'polyPressure';
        data1 = data[1];
        data2 = data[2];
        channel = ch;
        break;
      case 0xb0:
        kind = 'cc';
        data1 = data[1];
        data2 = data[2];
        channel = ch;
        break;
      case 0xc0:
        kind = 'programChange';
        data1 = data[1];
        channel = ch;
        break;
      case 0xd0:
        kind = 'channelPressure';
        data1 = data[1];
        channel = ch;
        break;
      case 0xe0:
        kind = 'pitchBend';
        data1 = data[1];
        data2 = data[2];
        channel = ch;
        break;
      default:
        switch (status) {
          case 0xf8: kind = 'clock'; break;
          case 0xfa: kind = 'start'; break;
          case 0xfb: kind = 'continue'; break;
          case 0xfc: kind = 'stop'; break;
          case 0xf0: kind = 'sysex'; break;
          default: kind = 'unknown';
        }
    }

    const needsRaw = kind === 'sysex' || kind === 'unknown';
    const raw = needsRaw ? Array.from(data) : undefined;

    const ev = this.broadcastEv;
    ev.ts = e.timeStamp;
    ev.direction = 'in';
    ev.kind = kind;
    ev.channel = channel;
    ev.data1 = data1;
    ev.data2 = data2;
    ev.portId = port.id;
    ev.portName = port.name ?? '';
    ev.raw = raw;
    for (const l of this.eventListeners) l(ev);
  }
}

export const midi = new MidiEngineImpl();

export async function checkMidiSupport(): Promise<MidiSupportStatus> {
  return midi.checkSupport();
}
