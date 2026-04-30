# AI Context — MIDI Keyboard Web Controller

> **Living document.** Update this whenever scope, decisions, conventions, or context change. The AI assistant should read this at the start of every session and amend it whenever something material changes.

---

## 1. Project elevator pitch

A web-based MIDI keyboard / pad / control-surface application that acts as a software alternative to the **Akai MPK series**. Runs in a Chromium browser, sends MIDI to a virtual MIDI port (e.g., loopMIDI on Windows), and the user's DAW listens on that port. Goal: highly customizable, dynamic, modern-looking, feature-rich performance + control surface.

## 2. User profile

- **Name (email):** haseeb309786@gmail.com
- **OS:** Windows 11 Pro
- **Working dir:** `C:\Users\hasee\Documents\App Projects\MIDI Project`
- **Hardware:** Dell Latitude 7420 2-in-1 (touchscreen laptop). Multi-monitor setup — **app runs on the touchscreen, DAW runs on the secondary display.**
- **No external MIDI hardware.** App is the sole controller.
- **DAWs in use:** FL Studio + Ableton Live.
- **Browser:** Brave (Chromium). _Note: Brave disables Web MIDI by default for privacy — user must enable it at `brave://settings/content/midi` or via the site shield._
- **Background:** Practicing right now; goal is full production.

## 3. Hard constraints (from user)

- Must be a **web application**.
- Must control a **running DAW** on the same computer.
- Must be **full of features** and **highly customizable / dynamic**.
- Must have **modern visuals**.
- Must **ignore touch gestures** — exact interpretation TBD (see Open Questions §10).
- Plan / feature list must be presented and approved **before any execution**.
- This file (`AI_CONTEXT.md`) must be **kept up to date** every time something material changes.

## 4. Confirmed decisions

| # | Decision | Value | Date |
|---|---|---|---|
| 1 | Target DAWs | FL Studio + Ableton Live (ship templates for both) | 2026-04-29 |
| 2 | Virtual MIDI | loopMIDI (user will install). Onboarding includes setup walkthrough. | 2026-04-29 |
| 3 | Browser | Brave (Chromium) — Web MIDI must be enabled by user; show in-app helper if `navigator.requestMIDIAccess` is blocked. | 2026-04-29 |
| 4 | Touch input | **Touch ENABLED** (this is the primary input). Suppress only browser + Windows gesture defaults — pinch-zoom, double-tap zoom, swipe-back, pull-to-refresh, long-press context menu, rubber-band scroll, edge swipes. | 2026-04-29 |
| 5 | Hardware target | Dell Latitude 7420 2-in-1 touchscreen, multi-monitor (DAW on second screen). | 2026-04-29 |
| 6 | Delivery | **Tauri 2 desktop app** (primary) + PWA fallback. Tauri uses WebView2 (Chromium) — same engine as Brave, all React code runs unchanged. Standalone `.exe` is ~4 MB, NSIS installer ~1.5 MB. Performance is identical to the browser; React/Vite/store layer is shared between the two paths. | 2026-04-30 |
| 7 | Use case | Production-grade (built for production from the start, not just practice). | 2026-04-29 |
| 8 | Visual style | **Vital-synth-inspired** — dark base, glowing controls, smooth animated gradients, **but more dynamic colors** that morph with activity / parameter state. | 2026-04-29 |
| 9 | Audio preview | **Pure MIDI-out only** for v1 (no built-in synth). Tone.js can be added later if needed. | 2026-04-29 |
| 10 | Tech stack | React 18 + TypeScript + Vite + Tailwind + Framer Motion + Zustand + Dexie + dnd-kit + vite-plugin-pwa. | 2026-04-29 |
| 11 | Layout | **Fully resizable + draggable modules** (dnd-kit); fluid responsive grid. | 2026-04-29 |
| 12 | OBS overlay | Skipped for v1. Revisit only if trivial after polish. | 2026-04-29 |

## 5. Tech stack (locked)

- **Frontend:** React 18 + TypeScript + Vite
- **Desktop shell:** Tauri 2 + WebView2 (Chromium-based, system-shared on Windows 11). Rust 1.95 GNU toolchain.
- **Styling:** TailwindCSS + CSS variables for theme tokens
- **Animation:** Framer Motion (UI) + GSAP if needed for high-perf visualizers
- **MIDI:** native Web MIDI API via thin `MidiEngine` wrapper (pre-allocated send buffers, listener-gated broadcast)
- **State:** Zustand with debounced localStorage persist
- **Persistence:** Dexie (IndexedDB) for presets; debounced localStorage for settings
- **Build:** Vite + `@tauri-apps/cli` + cargo. ESLint + Prettier + Vitest for unit tests + Playwright for E2E.
- **Deployment:**
  - **Primary:** standalone `midi-surface.exe` (4 MB) + NSIS installer (1.5 MB) + MSI (2.2 MB) via `build.bat`.
  - **Browser fallback:** PWA via `npm run dev` / `npm run build`. Service worker disabled when invoked under Tauri.

## 6. MIDI routing pipeline

```
[Web App in Chrome]
      │ Web MIDI API
      ▼
[Virtual MIDI Port — loopMIDI on Windows]
      │
      ▼
[DAW listening on that port]
```

User must install **loopMIDI** (or equivalent) once. Setup guide will be part of onboarding.

## 7. Feature scope (preliminary — see Open Questions before locking)

### Core performance
- Drum pads (configurable grid, velocity, aftertouch, banks A/B/C/D, color, sample preview)
- Piano keyboard (2–5 octaves, scrollable, octave shift, scale lock, chord mode)
- Pitch bend + mod wheel
- 8–16 assignable knobs (CC, value display, fine/coarse)
- 8 faders
- XY pad
- Transport: Play / Stop / Record / Loop / Tap-tempo / Metronome
- Step sequencer (per-pad, 16/32 steps)
- Arpeggiator (rate, pattern, gate, octaves, latch)
- Chord generator (scale-aware, inversions)
- Note repeat
- Sustain / expression pedal toggles

### Customization
- MIDI Learn on every control
- Per-control color, label, icon, MIDI channel
- Drag-and-drop layout editor (resize / move / hide modules)
- Preset save/load with per-DAW templates
- Multi-page layouts + hotkey switching
- Theme editor (colors, glow, accent, font)
- Scale & chord palettes

### Visuals
- Modern theming (style TBD with user)
- Velocity glow + ripple animations
- Waveform / spectrum analyzer (when audio preview on)
- LED-style indicators
- MIDI activity monitor
- Optional shader effects (CRT / bloom / scanline)

### System
- Computer keyboard as MIDI fallback
- MIDI clock sync
- Touch-gesture suppression (interpretation TBD)
- Fullscreen / kiosk mode
- Import/export presets as JSON
- Persistent state via IndexedDB

### Phase 2+
- In-app MIDI pattern recorder + `.mid` export
- LFO modulation
- Macro controls (one knob → multi-CC + curves)
- Scene/snapshot morphing
- Network MIDI (phone as secondary surface)

## 8. UI / UX principles

- **Performance-grade responsiveness.** MIDI latency from click to port emit must stay sub-10ms.
- **Touch-gesture suppression** at the document root: `touch-action: none`, prevent default on `touchstart`, `gesturestart`, `contextmenu`, multi-touch where appropriate.
- **Keyboard-first navigation** for live use (every common action has a hotkey).
- **No accidental triggers** — pad presses don't navigate, scroll, or zoom.
- **Modular layout system** — every module is a self-contained, draggable, MIDI-Learn-aware widget.
- **Themeability is a first-class feature**, not a postscript.

### OS-level gesture caveat (Windows touchscreen)

3-finger / 4-finger touchscreen gestures (task view, virtual desktop switch, etc.) are intercepted by **Windows itself** before the browser sees them. The app blocks all browser-level gesture interpretation, but for chord-playing reliability the user must ALSO:

1. **Run fullscreen** — click the `fullscreen` button in the header, or press `F11`, or install as PWA (manifest is `display: fullscreen`). This kills browser-chrome edge gestures and most OS multitouch hand-offs.
2. **Disable Windows multi-finger touchscreen gestures** if still problematic:
   - `Settings → Bluetooth & devices → Touchpad → Three-finger / Four-finger gestures → Nothing` (covers touchpad).
   - For touchscreen multitouch: open `Pen & Windows Ink` and turn off press-and-hold for right-click, or check Dell SupportAssist / Synaptics control panel for touchscreen gesture toggles.
   - Last resort: registry — under `HKCU\Software\Microsoft\Wisp\Touch`, gesture flags can be disabled per-finger-count.

## 9. Coding conventions (placeholder — fill in after stack lock)

- TypeScript strict mode on
- Components: function components + hooks; no class components
- Naming: `PascalCase` components, `camelCase` functions, `SCREAMING_SNAKE_CASE` constants
- File layout: feature-folder (`src/features/pads/`, `src/features/keyboard/`, `src/features/midi-engine/`)
- No comments unless explaining a non-obvious why
- Avoid premature abstraction — three similar lines beats a wrong-shaped helper

## 10. Open questions

_All initial questions resolved on 2026-04-29 — see §4 Confirmed Decisions. Future open questions go here._

## 11. Working agreement / instructions for future AI sessions

- **Always read this file first.** It's the single source of truth for project context.
- **Update this file whenever** scope, stack, decisions, conventions, or user preferences change. Stamp the date in the table in §4.
- **Never start coding** without an approved plan locked in §12.
- **Never add features** beyond the locked plan without asking.
- **Default to terse output.** No emoji unless user asks. No trailing summaries.
- **Validate before claiming done.** If a feature can't be tested headlessly, say so.
- **Touch gestures must remain suppressed** per the locked interpretation in §10 Q4.
- **MIDI latency is sacred.** Never introduce blocking work on the MIDI emit path.
- **Persist user state** — losing a custom layout is unacceptable.
- **Communicate changes here** — if you make a non-obvious decision, log it in §4 with a date.

## 12. Locked plan

### Vision (one line)
A Vital-inspired, touch-first, fully-customizable MIDI control surface that runs as a PWA on a Windows 2-in-1, sends MIDI through loopMIDI to FL Studio / Ableton, and feels like a native instrument.

### Tech stack (locked)
| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite + `vite-plugin-pwa` |
| Styling | TailwindCSS + CSS custom properties (live theme tokens) |
| Animation | Framer Motion (UI), Canvas/WebGL via `pixi.js` for high-FPS visualizers |
| State | Zustand (with `persist` middleware) |
| Persistence | Dexie (IndexedDB) for presets/layouts; localStorage for fast settings |
| Drag/resize | `dnd-kit` (sortable + free drag) + `react-resizable` for module resize |
| MIDI | Native Web MIDI API, thin `MidiEngine` wrapper |
| Hotkeys | `mousetrap` or `react-hotkeys-hook` |
| Tests | Vitest (unit) + Playwright (E2E for layout editor / preset round-trip) |
| Lint/format | ESLint + Prettier + TypeScript strict |
| Audio (later) | Tone.js — left out of v1 by decision §4.9 |

### File / folder layout
```
midi-project/
├── public/
│   ├── icons/                       PWA icons (192, 256, 384, 512)
│   ├── presets/                     Bundled FL/Ableton template JSON
│   └── manifest.webmanifest
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── Providers.tsx            Zustand + Theme + MIDI providers
│   │   └── Onboarding.tsx           First-run loopMIDI + Brave-MIDI guide
│   ├── features/
│   │   ├── midi-engine/             Web MIDI wrapper, port enum, learn, monitor
│   │   ├── pads/                    Drum pad grid + banks
│   │   ├── keyboard/                Piano keyboard
│   │   ├── knobs/                   Rotary knob widget + container
│   │   ├── faders/                  Linear fader strip
│   │   ├── transport/               Play/Stop/Rec/Loop/Tempo
│   │   ├── sequencer/               Step sequencer
│   │   ├── arpeggiator/
│   │   ├── chord-engine/            Scale / chord generation
│   │   ├── xy-pad/
│   │   ├── pitchbend-modwheel/
│   │   └── activity-monitor/        MIDI in/out console
│   ├── layout/
│   │   ├── LayoutCanvas.tsx         dnd-kit canvas
│   │   ├── Module.tsx               Resizable, draggable container
│   │   ├── LayoutEditor.tsx         Edit-mode toolbar
│   │   └── pages.ts                 Multi-page support
│   ├── theme/
│   │   ├── tokens.css               CSS vars for theme
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeEditor.tsx
│   │   └── dynamicAccent.ts         Activity-driven gradient morph
│   ├── store/
│   │   ├── layoutStore.ts
│   │   ├── presetStore.ts
│   │   ├── settingsStore.ts
│   │   ├── midiStore.ts
│   │   └── learnStore.ts
│   ├── persistence/
│   │   ├── db.ts                    Dexie schema
│   │   └── presetIO.ts              Import / export JSON
│   ├── input/
│   │   ├── touchSuppress.ts         Gesture suppression layer
│   │   ├── keyboardMap.ts           QWERTY → MIDI fallback
│   │   └── hotkeys.ts
│   ├── presets/
│   │   ├── fl-studio.template.json
│   │   └── ableton-live.template.json
│   ├── ui/                          Reusable primitives (Knob, Fader, Pad, LED)
│   └── styles/
│       ├── globals.css
│       └── tokens.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── AI_CONTEXT.md                    (this file)
```

### Touch / gesture suppression strategy
1. `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">`
2. Root CSS: `html, body { touch-action: none; overscroll-behavior: none; -webkit-user-select: none; user-select: none; }`
3. Global listeners with `preventDefault`:
   - `gesturestart`, `gesturechange`, `gestureend`
   - `contextmenu` (long-press menu)
   - `wheel` when `ctrlKey` (pinch-zoom on trackpads)
   - `dblclick` (zoom)
   - `selectstart`, `dragstart` outside designated drag handles
4. PWA `display: "fullscreen"` (fallback `standalone`) hides browser chrome → no swipe-back, no pull-to-refresh.
5. Edge-swipe / 3-finger swipe are OS-level on Windows; documented as a known limitation. Mitigation: run installed PWA in fullscreen on the touchscreen.
6. All interactive controls use **Pointer Events** (not Touch/Mouse separately) for unified handling and palm-rejection.

### Phased build plan

**Phase 0 — Scaffolding** (~half day)
- `npm create vite@latest` → React + TS template
- Install Tailwind, Framer Motion, Zustand, Dexie, dnd-kit, vite-plugin-pwa
- ESLint + Prettier + strict TS
- `touchSuppress.ts` mounted globally on day one
- Smoke test: empty PWA installs and runs fullscreen on touchscreen
- Onboarding screen stub: "Install loopMIDI", "Enable Web MIDI in Brave"

**Phase 1 — MIDI core** (~2 days)
- `MidiEngine` class: `requestMIDIAccess`, port enumeration, hot-plug events
- Output port picker UI
- MIDI Learn engine (any control → assign note/CC/channel; right-click & long-press both invoke)
- Activity Monitor (rolling buffer of last N events, in/out tabs)
- Settings persistence (Zustand + Dexie)
- Computer-keyboard fallback (QWERTY → MIDI for testing without touch)

**Phase 2 — Performance modules MVP** (~4 days)
- Drum pads (4×4 default, configurable to 8×8 / 8×2 / 16×1; banks A–D; velocity from pointer pressure where supported, velocity ramp from Y-position fallback)
- Piano keyboard (resizable octave range, scrollable, shift)
- Knobs ×8 (rotary, drag-up/down, double-tap to reset, scroll-wheel fine)
- Faders ×8
- Pitch bend wheel + mod wheel
- Transport bar (Play/Stop/Rec/Loop/Tap-tempo/Metronome)
- All controls expose MIDI Learn

**Phase 3 — Customization** (~3 days)
- Layout editor (toggle Edit Mode → drag/resize/hide modules, snap-grid)
- Multi-page layouts (swipe between pages with on-screen tabs, NOT system swipe)
- Preset save/load via Dexie + JSON import/export
- Bundled templates: FL Studio + Ableton Live (mapped to common defaults — FL transport CCs, Ableton's Mackie-ish channel layout)
- Per-control: color, label, icon, MIDI channel override

**Phase 4 — Visuals + theming (Vital-inspired, dynamic)** (~3 days)
- Dark glassy base; vibrant glow auras per control
- **Dynamic accent system:** active controls emit colored light that bleeds into the background gradient; idle = cool blue/violet, building activity = warm magenta/orange morph
- Velocity-driven ripples on pad hits
- Animated background (subtle low-FPS gradient mesh + activity-reactive bloom)
- Theme editor (live HSL sliders → CSS custom properties)
- Preset themes: "Vital Default", "Cyber Neon", "Sunset", "Mono", user-savable

**Phase 5 — Advanced features** (~4 days)
- Step sequencer (per-pad row, 16/32 steps, swing, polyrhythm)
- Arpeggiator (rate, pattern, gate, octaves, latch)
- Chord generator (scale-aware, inversions, voicing)
- Scale lock (lock keyboard to selected scale)
- XY pad (assignable to any 2 CCs)
- Note repeat / roll
- MIDI clock sync (master or follow)

**Phase 6 — Polish + delivery** (~2 days)
- Fullscreen / kiosk mode toggle
- Hotkey overlay (F1)
- First-run tour
- PWA install prompt + icon polish
- Brave Web MIDI helper (detects denial, links to settings)
- README + screenshots
- Lighthouse audit, perf pass (target sub-10 ms input → MIDI emit)

**Phase 7 — Stretch (post-v1)**
- In-app MIDI pattern recorder + `.mid` export
- LFO modulation routing
- Macro controls (1 knob → N CCs with curves)
- Scenes / snapshot morphing
- Network MIDI (phone as secondary surface over LAN)
- Tone.js audio preview / built-in sampler
- OBS transparent-background mode (only if cheap)

### MVP cut line (what must work for v1.0)
- MIDI engine + port selection + Learn ✅
- Pads, piano, knobs, faders, pitch/mod, transport ✅
- Drag/resize layout + save/load presets ✅
- FL + Ableton template presets ✅
- Vital-inspired dynamic theme ✅
- Touch gesture suppression ✅
- PWA install + fullscreen ✅
- Onboarding (loopMIDI + Brave MIDI) ✅

Sequencer / arp / chord / XY can slip to v1.1 if Phase 2–4 take longer than planned, but the architecture supports them from day one.

## 13. Changelog

| Date | Change | By |
|---|---|---|
| 2026-04-29 | Initial context file created with preliminary scope, open questions, and proposed stack. | Claude |
| 2026-04-29 | Open questions resolved: FL+Ableton, loopMIDI (to install), Brave, touch-enabled with gesture suppression, Latitude 7420 2-in-1 multi-monitor, PWA delivery, production use, Vital-inspired dynamic visuals, MIDI-only audio, full stack locked, resizable layout, no OBS. Locked plan written into §12. | Claude |
| 2026-04-29 | **Phase 0 complete.** Vite+React+TS scaffold; Tailwind/ESLint/Prettier/strict TS configured; `touchSuppress.ts` installed at root (gestures, contextmenu, ctrl+wheel zoom, dblclick, selectstart, dragstart, ctrl-+/-/0); vite-plugin-pwa wired (fullscreen manifest); Onboarding screen (loopMIDI + Brave Web MIDI guidance) gates entry until `requestMIDIAccess` resolves; MIDI engine stub exposes `checkMidiSupport()`. `npm run typecheck` and `npm run build` both green; `npm run dev` boots in ~750ms. Bundle: 148 KB JS / 9.8 KB CSS. PWA service worker generated. | Claude |
| 2026-04-29 | **Phase 1 complete.** MidiEngine (`src/features/midi-engine/MidiEngine.ts`) now owns the live `MIDIAccess`: port enumeration with hot-plug, output port selection + send helpers (noteOn/noteOff/cc/pitchBend/programChange/channelPressure/panic), input subscription with parsed `MidiEvent` broadcasting, and a parser for all standard channel + system real-time messages. Stores: `midiStore` (ports / event buffer of 256, ephemeral), `settingsStore` (persisted: outputId, inputId, defaultChannel, octave, velocity, panicOnBlur, theme), `learnStore` (persisted assignments + armed-control capture). Activity Monitor module shows in/out tabs with note-name rendering. Settings panel ships output/input port pickers, channel selector, octave/velocity, theme switcher (default/cyber/sunset/mono), panic button, QWERTY help. QWERTY fallback (`src/input/keyboardMap.ts`): A–L row plays scale, W/E/T/Y/U/O/P black keys, Z/X octave shift, C/V velocity shift, blur → panic. Header chip shows live output name + channel + activity count. Removed `@types/webmidi` (clashes with TS 5.5 lib.dom). Typecheck + build green; bundle now 171 KB JS / 13 KB CSS / 56 modules. | Claude |
| 2026-04-29 | **Phase 2 complete — performance modules online.** Added `performanceStore` (persistent: padBank, knob[8], fader[8], modWheel, loop, metronome, tempo) and `learnStore.learnMode` (global tap-to-arm flag). Default MIDI map (`src/features/midi-engine/defaults.ts`): pads → ch10 notes 36–51 / 52–67 / 68–83 / 84–99 (banks A/B/C/D), knobs → CC 16–23, faders → CC 20–27, mod wheel → CC 1, transport → CC 115–119. Stable controlIds via `controlId.*` for every widget. UI primitives (`src/ui/`): **Pad** (pointer-pressure → velocity, ripple, hue per pad), **Knob** (SVG arc -135°→+135°, vertical drag = 200 px range, shift = 5× fine, wheel nudge, dbl-tap reset), **Fader** (jump-to-pos + drag, wheel nudge), **Wheel** (pitch springs to center / mod is sticky, 14-bit pitch), **TransportButton** (momentary + latch). Feature modules: **PadGrid** (4×4 with bank A/B/C/D switcher, hue family per bank), **KnobRow** + **FaderRow** (8 each), **Wheels** (pitch + mod), **PianoKeyboard** (3 octaves, multi-touch via container pointer capture + `document.elementFromPoint`, glide on slide, octave +/−), **Transport** (Play/Stop/Rec/Loop/Metro + Tap-tempo + BPM input). All controls expose **MIDI Learn** via global Learn toggle in header — tap a control while armed → learn on next inbound MIDI event. Default surface layout wired in `App.tsx`. Typecheck + build green; bundle now 191 KB JS / 17 KB CSS / 71 modules. | Claude |
| 2026-04-29 | **Phase 2.1 — chord robustness + responsive keyboard.** Reported: 3-finger chords on the touchscreen sometimes triggered a Windows / browser gesture instead of playing. Fixed on the app side: `touchSuppress.ts` now installs capture-phase `touchstart` / `touchmove` / `touchend` listeners that `preventDefault` whenever ≥2 touches are present. Pointer Events are synthesized independently, so each finger still gets its own pointerdown/up — chords keep working. OS-level 3-finger gestures still need a Windows-side disable (documented in §8). Added a `fullscreen` toggle button in the header (uses `requestFullscreen({ navigationUI: 'hide' })`) — recommended for live play. PianoKeyboard rewritten: now fully responsive via ResizeObserver, fills container width, configurable 1..7 octaves with in-header zoom controls, drag the bottom edge to resize height, labels auto-hide when keys are too narrow. Layout restructured: piano now occupies the full bottom row of the main column. Settings store: added `pianoOctaves` (default 3) and `pianoHeight` (default 200px), bumped persist version to 2. Typecheck + build green; bundle now 194 KB JS / 17 KB CSS. | Claude |
| 2026-04-29 | **Phase 2.2 — chord-killer fix + perf overhaul.** **Critical bug**: the multi-touch `preventDefault()` added in Phase 2.1 was silently cancelling 2nd/3rd-finger `pointerdown` events (per the Pointer Events spec, calling preventDefault on touchstart cancels the equivalent pointerdown). That's what was making chords feel "laggy" — the events never fired at all. Removed those listeners; relying on `touch-action: none` + `gesturestart/change/end` prevent for browser-level gesture suppression. **Performance overhaul** (no features cut): (1) `src/persistence/debouncedStorage.ts` — wraps localStorage with a 300 ms debounce, flushes on `pagehide` / `visibilitychange:hidden` / `beforeunload` so no state is lost. Wired into all three persisted stores (settings / learn / performance). Eliminates the ~60-Hz synchronous localStorage write that was happening during every knob/fader/wheel drag. (2) PianoKeyboard hot path no longer re-renders React on press / release / glide — visual state is set via `data-active="1"` on the matching key DOM node, picked up by new `.piano-key-white[data-active='1']` / `.piano-key-black[data-active='1']` CSS in globals.css. (3) Added per-key refcount so chord-shared keys release cleanly. (4) `Pad`, `Knob`, `Fader`, `Wheel`, `TransportButton` all wrapped in `React.memo`. (5) `KnobRow` and `FaderRow` split into per-control `KnobControl` / `FaderControl` that subscribe to their own slot only — dragging knob #3 no longer re-renders knobs 1–2, 4–8. (6) `PadGrid`, `Wheels`, `Transport`, `KnobRow`, `FaderRow` exported via `memo`. (7) `App.tsx` now subscribes to specific store slices (`theme`, `defaultChannel`, `outputId`, `outputName`) instead of the whole settings store. **Layout fixes**: knob size 62 → 52, fader height 180 → 130, wheel height 200 → 130 with pitch + mod side-by-side instead of stacked, `shrink-0` on all top-row modules so nothing gets clipped, `overflow-auto` fallback on the middle row when the viewport is too short. Typecheck + build green; bundle 194 KB JS / 18 KB CSS / 73 modules. | Claude |
| 2026-04-29 | **Phase 2.3 — zero-alloc MIDI hot path.** User reported lingering "not super fast" feel after 2.2. Profiled the remaining work and removed it. **MidiEngine** rewritten: pre-allocated `Uint8Array(2)` and `Uint8Array(3)` send buffers reused across every `noteOn` / `noteOff` / `cc` / `pitchBend` / `programChange` / `channelPressure` (Web MIDI's `send()` copies synchronously, so reuse is safe). A single shared mutable `MidiEvent` object is used for broadcast — listeners receive a transient ref (must read fields immediately, not retain). Critically, the broadcast block is gated on `eventListeners.size > 0` — when nothing is observing, every send does literally just `out.send(buf)` and returns. `MidiEvent.raw` is now optional and skipped entirely for outgoing messages; even for inbound, raw is allocated only for sysex / unknown (where the bytes are needed for display). **midiStore** reduced to ports / outputId / inputId — no events buffer, no pushEvent, no eventSeq. Eliminates the ~100/sec Zustand updates that were happening during chord + glide playing. **ActivityMonitor** owns its own ring buffer fed by the `midi.onEvent` listener; UI re-renders at 10 Hz via `setInterval`, only when the seq counter has advanced. When the panel closes, the listener detaches → engine sees zero observers again. **App.tsx** attaches the learn listener ONLY while `learnMode` is on (effect deps `[learnMode]`). During normal play, both Activity Monitor closed and Learn off → `eventListeners.size === 0` → MidiEngine fast-paths every send. **Pad** rewritten to be fully imperative on press: handler toggles `data-active='1'` and writes `--pad-glow` directly to the DOM; `.pad-cell[data-active='1']` selector in globals.css does the rest. No React state, no re-render on press / release — pressing 4 pads simultaneously = 0 reconciles. Typecheck + build green; bundle 195 KB JS / 19 KB CSS / 73 modules. | Claude |
| 2026-04-30 | **Phase 3.0 — desktop app via Tauri 2.** Goal: ship as a real Windows app instead of (or alongside) a browser tab, without performance regression. Stack additions: Rust stable 1.95 (GNU toolchain via rustup), MinGW-w64 (gcc + binutils, installed via `choco install mingw`), `@tauri-apps/cli`, `@tauri-apps/api`, `@tauri-apps/plugin-shell`. `src-tauri/` directory: `Cargo.toml` (release profile tuned for size — `lto=true, opt-level="z", codegen-units=1, panic=abort, strip=true`), `tauri.conf.json` (1600×1000 default window, 1024×600 min, dark theme, NSIS + MSI bundles, identifier `com.midisurface.app`), `capabilities/default.json` (core + window controls + `shell:allow-open` allow-list for the loopMIDI download URL only). `vite.config.ts` skips `vite-plugin-pwa` when `TAURI_ENV_PLATFORM` is set (service workers conflict with Tauri's custom protocol). **Build artifacts**: standalone `midi-surface.exe` = **4.0 MB**, NSIS installer = **1.5 MB**, MSI = **2.2 MB**. **Build environment caveat**: `binutils dlltool` can't handle paths containing spaces (the project lives at `App Projects/`), so `CARGO_TARGET_DIR=C:\midi-build` is set in `dev.bat` / `build.bat` to redirect compilation artifacts to a no-space path. Source stays at the original location. **Onboarding**: detects no virtual MIDI port → shows "Open loopMIDI download page" button (uses `@tauri-apps/plugin-shell` `open()` in the Tauri build, falls back to `window.open` in browser) + "Refresh ports" button + auto-refresh on window focus. New `src/app/runtime.ts` exposes `isTauri()` and `openExternal()` helpers. **Launchers**: `run.bat` is now a smart launcher (built `.exe` if it exists, else dev mode), `dev.bat` runs `npm run tauri:dev`, `build.bat` runs `npm run tauri:build` and opens the bundle folder. Removed `run-preview.bat`. Both `cargo check` and full `npm run tauri:build` green; incremental rebuilds ~2 min. | Claude |
