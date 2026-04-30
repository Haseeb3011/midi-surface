/*
  Tiny runtime helpers for distinguishing the Tauri-wrapped desktop app from a
  plain browser visit. Anything that depends on Tauri APIs should guard with
  `isTauri()` so the app still runs in the browser fallback path.
*/

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Open a URL in the user's default browser, regardless of runtime. */
export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(url);
    return;
  }
  window.open(url, '_blank', 'noopener');
}
