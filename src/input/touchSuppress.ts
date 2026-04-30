/*
  Touch / gesture suppression layer.

  Goal (per AI_CONTEXT §4.4): touch INPUT remains enabled because it's the primary
  interaction on the Latitude 7420 2-in-1, but we kill every browser/OS gesture
  default that could hijack a pad press, knob drag, or slider tweak.

  Suppressed:
    - iOS-style multi-finger gestures (gesturestart / change / end)
    - Long-press context menu
    - Pinch-zoom via Ctrl/Meta + wheel (touchpads emit this)
    - Double-tap zoom
    - Page-level text-selection drags
    - Native HTML5 drag-start outside opted-in elements

  Opt-outs: any element with [data-allow-context], [data-allow-drag], or [data-allow-select]
  bypasses the matching suppressor — useful for the MIDI Learn menu, layout-editor
  drag handles, and inputs.

  NOT handled (OS-level on Windows, can't be intercepted from a webpage):
    - Edge swipes from screen edges
    - 3-finger / 4-finger system gestures (Windows tablet-mode task-view, etc.)
  Mitigations stack like this:
    1. Run the installed PWA in fullscreen (manifest.display = "fullscreen"),
       OR press F11 in the browser. This kills browser-chrome edge gestures.
    2. Disable Windows touchscreen multi-finger system gestures (see the README
       and AI_CONTEXT.md for the registry / Settings steps).
*/

const allowsContext = (target: EventTarget | null): boolean =>
  !!(target as HTMLElement | null)?.closest?.('[data-allow-context]');

const allowsDrag = (target: EventTarget | null): boolean =>
  !!(target as HTMLElement | null)?.closest?.('[data-allow-drag]');

const isEditable = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.matches('input, textarea, [contenteditable="true"]')) return true;
  return !!el.closest('[data-allow-select]');
};

let installed = false;

export function installTouchSuppress(): void {
  if (installed) return;
  installed = true;

  const prevent = (e: Event): void => e.preventDefault();

  // iOS-style pinch / rotate gestures (also fire on some Windows trackpads).
  for (const evt of ['gesturestart', 'gesturechange', 'gestureend'] as const) {
    window.addEventListener(evt, prevent, { passive: false });
  }

  // NOTE: We deliberately do NOT preventDefault() on `touchstart`/`touchmove`
  // here. Per the Pointer Events spec, calling preventDefault() on a
  // touchstart cancels the equivalent `pointerdown` — which silently kills
  // chord playing (2nd/3rd fingers never reach our handlers). Browser-level
  // gesture interpretation is already blocked by `touch-action: none` on the
  // root + the `gesturestart/change/end` listeners above. OS-level multi-finger
  // gestures (Windows tablet task-view, etc.) cannot be blocked from a webpage
  // and require Windows-side configuration — see AI_CONTEXT.md §8.

  // Long-press / right-click menu — kept off globally; reintroduce per-control
  // for MIDI Learn via [data-allow-context].
  window.addEventListener(
    'contextmenu',
    (e) => {
      if (!allowsContext(e.target)) e.preventDefault();
    },
    { passive: false },
  );

  // Pinch-zoom via Ctrl/Meta + wheel (trackpad).
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false },
  );

  // Double-tap zoom on touch.
  window.addEventListener('dblclick', prevent, { passive: false });

  // Block accidental text-selection drags outside editable / opted-in regions.
  window.addEventListener(
    'selectstart',
    (e) => {
      if (!isEditable(e.target)) e.preventDefault();
    },
    { passive: false },
  );

  // Disable native HTML5 drag unless explicitly opted in (dnd-kit uses pointer events,
  // so it's unaffected).
  window.addEventListener(
    'dragstart',
    (e) => {
      if (!allowsDrag(e.target)) e.preventDefault();
    },
    { passive: false },
  );

  // Keyboard zoom (Ctrl +/-/0).
  window.addEventListener(
    'keydown',
    (e) => {
      if ((e.ctrlKey || e.metaKey) && ['=', '+', '-', '0'].includes(e.key)) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
}
