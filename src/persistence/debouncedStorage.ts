/*
  Debounced wrapper around `localStorage` for use with zustand's `persist`
  middleware.

  Why: persist serializes + writes the whole slice on every state change, and
  localStorage writes are synchronous. With dragging knobs / faders / wheels the
  app was hitting localStorage 60+ times per second — which is the dominant
  source of input lag. This delays the actual write while keeping in-memory
  reads consistent (cached pending value), and flushes on tab hide / unload so
  no state is lost.
*/

interface BasicStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

let installed = false;

export function debouncedLocalStorage(delay = 300): BasicStorage {
  const pendingValues = new Map<string, string>();
  const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const writeNow = (name: string): void => {
    const value = pendingValues.get(name);
    if (value === undefined) return;
    try {
      localStorage.setItem(name, value);
    } catch {
      /* quota / security errors are non-fatal here */
    }
    pendingValues.delete(name);
    const t = pendingTimers.get(name);
    if (t) clearTimeout(t);
    pendingTimers.delete(name);
  };

  const flushAll = (): void => {
    for (const name of Array.from(pendingValues.keys())) writeNow(name);
  };

  // Install global flush hooks once per page so we never lose state on
  // tab close / lock / fullscreen-exit etc.
  if (!installed && typeof window !== 'undefined') {
    installed = true;
    window.addEventListener('pagehide', flushAll);
    window.addEventListener('beforeunload', flushAll);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushAll();
    });
  }

  return {
    getItem: (name) => {
      // Return any pending write so reads-after-writes are consistent.
      if (pendingValues.has(name)) return pendingValues.get(name) ?? null;
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      pendingValues.set(name, value);
      const existing = pendingTimers.get(name);
      if (existing) clearTimeout(existing);
      pendingTimers.set(
        name,
        setTimeout(() => writeNow(name), delay),
      );
    },
    removeItem: (name) => {
      pendingValues.delete(name);
      const existing = pendingTimers.get(name);
      if (existing) clearTimeout(existing);
      pendingTimers.delete(name);
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}
