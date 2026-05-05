import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@/app/runtime';

export interface NativeMidiOutput {
  id: number;
  name: string;
}

export const nativeMidiId = (id: number): string => `native:${id}`;

export function parseNativeMidiId(id: string | null): number | null {
  if (!id?.startsWith('native:')) return null;
  const value = Number(id.slice('native:'.length));
  return Number.isInteger(value) && value >= 0 ? value : null;
}

export async function listNativeMidiOutputs(): Promise<NativeMidiOutput[]> {
  if (!isTauri()) return [];
  try {
    return await invoke<NativeMidiOutput[]>('native_midi_outputs');
  } catch {
    return [];
  }
}

export async function selectNativeMidiOutput(id: number | null): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('native_midi_select_output', { id });
  } catch {
    /* device may have just disappeared — next refresh will re-pick */
  }
}

export function sendNativeMidiShort(status: number, data1 = 0, data2 = 0): void {
  if (!isTauri()) return;
  void invoke('native_midi_send_short', {
    status: status & 0xff,
    data1: data1 & 0x7f,
    data2: data2 & 0x7f,
  });
}
