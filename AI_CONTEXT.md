# AI Context — MIDI Surface

> **Living document.** Read this at the start of every session. Update it whenever scope, decisions, conventions, or context change. Stamp the changelog (§14) with the date.

---

## 1. Elevator pitch

**MIDI Surface** is a Vital-synth-inspired, touch-first MIDI control surface that ships as a **lightweight Windows desktop app** (Tauri 2, ~4 MB standalone exe). It runs in a WebView2 window on a Windows 2-in-1 touchscreen, sends MIDI through **loopMIDI** (a virtual MIDI port) to FL Studio / Ableton Live, and includes pads, piano keyboard, knobs, faders, pitch + mod wheels, transport, MIDI Learn, and an activity monitor. The same React app also runs as a PWA in any Chromium browser as a fallback.

Repo: <https://github.com/Haseeb3011/midi-surface> (private).

## 2. User profile

- **GitHub:** `Haseeb3011`
- **Email:** `haseeb309786@gmail.com`
- **OS:** Windows 11 Pro
- **Hardware:** Dell Latitude 7420 2-in-1 (touchscreen). Multi-monitor — app on the touchscreen, DAW on the secondary display.
- **No external MIDI hardware.** App is the sole controller.
- **DAWs in use:** FL Studio + Ableton Live.
- **Browser:** Brave (Chromium). Note: Brave disables Web MIDI by default — the WebView2 inside the Tauri app does NOT have this restriction, but the browser fallback path requires `brave://settings/content/midi` to be allowed.
- **Project root:** `C:\Users\hasee\Documents\App Projects\MIDI Project`
- **Skill level:** Builds creative tools / works with DAWs. Comfortable with technical decisions but trusts the assistant to pick "what's best" when given options.

## 3. Hard constraints

- Must be a **lightweight desktop app** with **no perceptible lag** during play. Performance is a first-class concern.
- Must control a running DAW on the secondary screen.
- Must be **full of features** and **highly customizable / dynamic**.
- Must have **modern visuals** (Vital-inspired with dynamic colors).
- Must **ignore browser + Windows gestures** so they don't hijack pad presses or chord playing.
- Plan / feature list must be presented and approved **before any execution**.
- This file (`AI_CONTEXT.md`) must be **kept up to date** every time something material changes.
- The Git repo must be **kept up to date** — see §7 for the workflow.

## 4. Confirmed decisions

| # | Decision | Value | Date |
|---|---|---|---|
| 1 | Target DAWs | FL Studio + Ableton Live | 2026-04-29 |
| 2 | Virtual MIDI | loopMIDI; one-click download via in-app onboarding | 2026-04-29 |
| 3 | Browser fallback | Brave / Chrome / Edge (Chromium) | 2026-04-29 |
| 4 | Touch input | Touch ENABLED. Suppress only browser + Windows gesture defaults — pinch-zoom, double-tap zoom, swipe-back, pull-to-refresh, long-press context menu, edge swipes. **Do NOT** preventDefault on `touchstart` (it cancels equivalent `pointerdown` events and breaks chord playing). | 2026-04-29 |
| 5 | Hardware target | Dell Latitude 7420 2-in-1 touchscreen, multi-monitor | 2026-04-29 |
| 6 | Delivery | **Tauri 2 desktop app** (primary) + PWA fallback (browser). Standalone `.exe` ~4 MB, NSIS installer ~1.5 MB. Same React code drives both. | 2026-04-30 |
| 7 | Use case | Production-grade (built for production from day one) | 2026-04-29 |
| 8 | Visual style | Vital-synth-inspired — dark base, glowing controls, animated gradients, dynamic colors that morph with activity | 2026-04-29 |
| 9 | Audio preview | Pure MIDI-out only for v1. Tone.js can be added later. | 2026-04-29 |
| 10 | Tech stack | React 18 + TypeScript + Vite + Tailwind + Framer Motion + Zustand + Dexie + dnd-kit + Tauri 2 + WebView2 + Rust GNU + MinGW. | 2026-04-29 / -30 |
| 11 | Layout | Fully resizable + draggable modules (dnd-kit, scheduled for Phase 4). | 2026-04-29 |
| 12 | OBS overlay | Skipped for v1. Revisit only if trivial. | 2026-04-29 |
| 13 | Code signing | Skipped (SmartScreen "Run anyway" once is acceptable) | 2026-04-30 |
| 14 | Repo | Private GitHub repo at `Haseeb3011/midi-surface`, branch `main` | 2026-04-30 |

## 5. Tech stack (locked)

| Concern | Choice |
|---|---|
| Frontend framework | React 18 + TypeScript (strict) |
| Build tool | Vite 5 (`vite-plugin-pwa` for browser fallback only — disabled under Tauri) |
| Desktop shell | **Tauri 2** with WebView2 (Chromium-based, system-shared on Windows 11) |
| Rust toolchain | Stable 1.95+, **GNU host** (`x86_64-pc-windows-gnu`) installed via `rustup` |
| C/C++ tools | **MinGW-w64** at `C:\ProgramData\mingw64\mingw64\bin` (installed via `choco install mingw -y`) — provides `gcc`, `dlltool`, `binutils` |
| Styling | TailwindCSS 3 + CSS custom properties (live theme tokens) |
| Animation | Framer Motion (UI). GSAP / pixi.js available for high-FPS visuals if ever needed. |
| State | Zustand 4 + `persist` middleware with debounced localStorage |
| Persistence | Debounced localStorage for settings; Dexie (IndexedDB) for presets (Phase 4) |
| Drag/resize | `dnd-kit` (already installed; used in Phase 4) |
| MIDI | Native Web MIDI API via the custom `MidiEngine` wrapper (zero-allocation hot path) |
| Hotkeys | `react-hotkeys-hook` (already installed) |
| Tests | Vitest (planned) + Playwright (planned) |
| Lint / format | ESLint 8 + Prettier 3 + `prettier-plugin-tailwindcss` |

## 6. MIDI routing pipeline

```
[MIDI Surface — React app inside Tauri WebView2]
      │ Web MIDI API (out.send(Uint8Array))
      ▼
[loopMIDI — virtual MIDI port on Windows]
      │
      ▼
[DAW listening on that port — FL Studio / Ableton Live]
```

User installs loopMIDI once. The in-app onboarding launches the loopMIDI download page via the Tauri shell plugin and auto-detects the new port on focus regain.

## 7. Git workflow & repo upkeep

**Repo:** `git@github.com:Haseeb3011/midi-surface.git` / `https://github.com/Haseeb3011/midi-surface` (private).

**Branch:** `main` (sole branch unless features get long enough to warrant feature branches).

**Author identity** is set per-commit via env vars — never via `git config --global` — so the user's machine-wide config is left untouched:

```bash
GIT_AUTHOR_NAME="Haseeb3011" \
GIT_AUTHOR_EMAIL="haseeb309786@gmail.com" \
GIT_COMMITTER_NAME="Haseeb3011" \
GIT_COMMITTER_EMAIL="haseeb309786@gmail.com" \
git commit -m "..."
```

### When to commit

Commit at meaningful checkpoints, not every edit:

- **After each sub-phase completes and smoke tests pass** (typecheck + build green). One commit per sub-phase keeps history readable.
- **After a focused bug fix** that's tested and working.
- **After updating `AI_CONTEXT.md`** with new decisions or scope.
- **Before starting a risky refactor** so we have a known-good baseline to revert to.

Do **NOT** commit:
- Mid-refactor work that doesn't typecheck.
- Build artifacts (`dist/`, `dev-dist/`, `target/`, `C:\midi-build\` — already gitignored).
- Anything with secrets, tokens, or credentials.

### Commit message convention

- One-line subject (under 72 chars), imperative mood (e.g. "Add layout editor with snap-grid").
- Blank line, then a short body explaining the *why* + any non-obvious decisions.
- End with `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- Use HEREDOC for multi-line messages to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
Subject line under 72 chars

Body paragraph explaining the why and any tricky decisions.
Bullet points for separable items.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Push cadence

- **Push after every commit** to keep the remote in sync (`git push`).
- The repo is private; force-pushing to `main` without an explicit user ask is forbidden.
- Never bypass hooks (`--no-verify`) or signing flags unless the user explicitly asks.

### Pre-work checklist

At the start of any new work session:

1. `git status` — confirm a clean working tree.
2. `git pull --rebase` — sync with remote in case the user pushed from another machine.
3. Read this file (§14 changelog + §11 phase plan) to know where things stand.

### `gh` operations

The user has GitHub CLI (`gh`) authenticated as `Haseeb3011` with `repo`, `gist`, `read:org`, and `workflow` scopes — use it for issues / PRs / releases when appropriate (e.g., `gh issue create`, `gh release create v0.2.0 --notes "..."`).

## 8. Build environment & gotchas

### Required tools (already installed on user's machine)

| Tool | Where | Purpose |
|---|---|---|
| Node.js 25 + npm 11 | system PATH | Vite + React build |
| Rust 1.95 stable, GNU toolchain | `~/.cargo/bin` | Tauri Rust shell |
| MinGW-w64 | `C:\ProgramData\mingw64\mingw64\bin` | `dlltool` + binutils for the GNU toolchain |
| WebView2 | built into Windows 11 | Browser engine the Tauri app embeds |
| GitHub CLI | system PATH | `gh repo create`, `gh issue`, etc. |
| Chocolatey | `~\AppData\Local\UniGetUI\Chocolatey\bin` | for installing Windows packages |

### `CARGO_TARGET_DIR=C:\midi-build` is required

`binutils` `dlltool.exe` cannot handle paths containing spaces. The project lives at `C:\Users\hasee\Documents\App Projects\MIDI Project` (note "App Projects"). Without redirecting the cargo target dir, `cargo build` fails with `can't open Projects\MIDI for reading: No such file or directory`.

The launcher scripts (`dev.bat`, `build.bat`) set this automatically. If running cargo manually from a shell, prepend:

```bash
export PATH="$HOME/.cargo/bin:/c/ProgramData/mingw64/mingw64/bin:$PATH"
export CARGO_TARGET_DIR="C:/midi-build"
```

### Launcher scripts

| Script | What it does |
|---|---|
| `run.bat` | Smart launcher — runs `C:\midi-build\release\midi-surface.exe` if it exists, else falls back to `dev.bat`. |
| `dev.bat` | `npm run tauri:dev` — Vite + Tauri WebView with hot reload. Compiles src-tauri on first run. |
| `build.bat` | `npm run tauri:build` — produces standalone `.exe`, NSIS installer, MSI installer. Opens the bundle folder when done. |

### Build output paths

After `build.bat` completes:

- Standalone: `C:\midi-build\release\midi-surface.exe` (~4 MB)
- NSIS installer: `C:\midi-build\release\bundle\nsis\MIDI Surface_*.exe` (~1.5 MB)
- MSI installer: `C:\midi-build\release\bundle\msi\MIDI Surface_*.msi` (~2.2 MB)

### Performance / zero-alloc invariants — DO NOT REGRESS

- `MidiEngine.send*()` methods reuse pre-allocated `Uint8Array(2)` and `Uint8Array(3)` buffers. Never allocate per-send.
- The broadcast path is **listener-gated** — `if (this.eventListeners.size === 0) return` before doing any event work. During normal play (no Activity Monitor open, Learn off), zero observers means zero allocations and zero React re-renders.
- The learn listener in `App.tsx` only attaches when `learnMode` is true (`useEffect` dep `[learnMode]`).
- Piano key visuals are toggled imperatively (`data-active='1'` attribute + CSS in `globals.css`). No React state on press / release / glide.
- Pad press visuals are also imperative — `data-active` + `--pad-glow` CSS var, no React state.
- All persisted Zustand stores (`settingsStore`, `learnStore`, `performanceStore`) use `debouncedLocalStorage(300)` from `src/persistence/debouncedStorage.ts` — never the default storage. This prevents the synchronous localStorage write from happening on every drag tick.
- Knob / Fader rows are split into per-control `KnobControl` / `FaderControl` components that subscribe to their own slot only.
- All UI primitives (`Pad`, `Knob`, `Fader`, `Wheel`, `TransportButton`) and feature modules (`PadGrid`, `KnobRow`, `FaderRow`, `Wheels`, `Transport`, `ActivityMonitor`) are wrapped in `React.memo`.

## 9. Touch / gesture suppression strategy

Layered defenses, top to bottom:

1. **CSS:** `touch-action: none`, `overscroll-behavior: none`, `user-select: none` on `html` / `body` in `src/styles/globals.css`.
2. **Viewport meta:** `user-scalable=no, maximum-scale=1, viewport-fit=cover` in `index.html`.
3. **JS event suppression** in `src/input/touchSuppress.ts`:
   - `gesturestart` / `gesturechange` / `gestureend` → `preventDefault`.
   - `contextmenu` → `preventDefault` unless `[data-allow-context]`.
   - `wheel` with `ctrlKey` / `metaKey` → `preventDefault` (zoom).
   - `dblclick` → `preventDefault` (zoom).
   - `selectstart` / `dragstart` → `preventDefault` outside opt-in elements.
   - `keydown` Ctrl/Meta + `=` / `+` / `-` / `0` → `preventDefault`.
   - **DO NOT** preventDefault on `touchstart` / `touchmove` — the spec says that cancels the equivalent `pointerdown` and silently breaks chord playing.
4. **PWA / Tauri standalone**: no browser chrome, no edge-swipe-back, no tab strip.
5. **OS-level (Windows touchscreen 3-finger gestures)**: cannot be intercepted from a webpage. Mitigation: run the Tauri app fullscreen (F11) and disable Windows touchpad multi-finger gestures via `Settings → Bluetooth & devices → Touchpad`. For touchscreen-specific gestures, check Dell SupportAssist / Synaptics control panel.

## 10. UI / UX principles

- **Performance-grade responsiveness.** Click-to-MIDI-emit must stay sub-10 ms.
- **No accidental triggers.** Pad presses don't navigate, scroll, or zoom.
- **Modular layout.** Every module is a self-contained, MIDI-Learn-aware widget; in Phase 4 they become draggable / resizable.
- **Themeability is first-class**, not a postscript.
- **Onboarding gates entry.** Until Web MIDI is granted AND a virtual MIDI port is detected, the user is on the onboarding screen.
- **Default-friendly MIDI map.** Pads on channel 10 (drum), CCs grouped (knobs 16–23, faders 20–27, transport 115–119), so MIDI Learn in any DAW is one tap.

## 11. Phase plan & current status

### ✅ Done

- **Phase 0** — Scaffolding (Vite + React + TS + Tailwind, touch suppression, PWA manifest)
- **Phase 1** — MIDI core (`MidiEngine`, port enumeration, hot-plug, MIDI Learn, activity monitor, QWERTY fallback)
- **Phase 2** — Performance modules (pads, piano, knobs, faders, pitch + mod wheels, transport with tap-tempo)
- **Phase 2.1** — Chord robustness + responsive resizable keyboard
- **Phase 2.2** — Chord-killer fix (don't preventDefault touchstart) + perf overhaul (debounced storage, imperative piano, React.memo, per-control subscriptions)
- **Phase 2.3** — Zero-allocation MIDI hot path (pre-allocated send buffers, listener-gated broadcast, imperative Pad press)
- **Phase 3** — Tauri 2 desktop app (4 MB standalone exe, 1.5 MB NSIS installer, in-app loopMIDI download flow)
- **Phase 4** — Customization: drag-and-drop layout editor, multi-page tabs, Dexie preset store, per-control overrides, JSON import/export
- **Phase 4.7** — UI refinement & 5-theme system: full design-token rewrite (12 color tokens × 5 themes, radius/spacing/elevation scales), `.module-panel` / `.header-btn` shared utilities, refined primitives (thinner knob arc, slimmer fader/wheel, dim-by-default pads), LANDR-inspired flat-surface aesthetic, theme picker with swatches
- **Phase 4.8** — Performance optimization: piano key DOM Map cache (O(1) visual update), math-based piano hit-testing (no `elementFromPoint`), `layoutStore.moduleIndex` for O(1) override lookup, stable selectors, in-place performanceStore mutation, split `PerformanceGrid` / `EditableGrid` so dnd-kit only mounts in edit mode, imperative TransportButton press

### 🟡 Next — pending user sequencing approval
- **Phase 5 — Quick wins**: custom app icon, hotkeys (Space play/stop, R record, P performance mode, F1 help, Esc exit fullscreen, 1–4 pad bank), performance mode (auto-hide chrome), settings export/import
- **Phase 6 — Advanced musical features**: step sequencer, arpeggiator, chord generator, scale lock, XY pad, note repeat, MIDI clock sync
- **Phase 7 — Visual polish & theming**: dynamic accent system, velocity ripples, animated background, theme editor, preset themes (Vital Default, Cyber Neon, Sunset, Mono)
- **Phase 8 — Stretch**: LFO modulation routing, macro controls (1 knob → N CCs with curves), scenes/snapshot morphing, network MIDI (phone as 2nd surface), in-app pattern recorder + `.mid` export, Tone.js audio preview, OBS transparent-background mode

## 12. Coding conventions

- TypeScript strict mode; `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `noImplicitOverride` all on.
- Function components + hooks. No class components.
- Naming: `PascalCase` components, `camelCase` functions, `SCREAMING_SNAKE_CASE` constants.
- Feature-folder layout: `src/features/<feature>/`. Shared primitives in `src/ui/`. Stores in `src/store/`. Persistence helpers in `src/persistence/`.
- Path alias: `@/...` maps to `src/...`.
- No comments unless explaining a non-obvious *why*. Prefer self-explanatory names.
- Avoid premature abstraction — three similar lines beats a wrong-shaped helper.
- Top-of-file comment block on every non-trivial file, briefly explaining what the file owns.
- React.memo every UI primitive and feature module; subscribe to Zustand store slices, not whole stores.

## 13. Working agreement / instructions for future AI sessions

**Always at session start:**

1. Read this file end-to-end. Especially §3 (constraints), §8 (build invariants), §11 (phase plan), §14 (changelog).
2. `git status` → confirm clean working tree.
3. `git pull --rebase` → sync from remote.

**Always when working:**

- **Never start coding without an approved plan.** When the user asks for something non-trivial, present a plan first and wait for approval.
- **Never add features beyond the locked plan** without asking. Open Questions in §15 must be resolved with the user before proceeding.
- **Default to terse output.** No emoji unless the user asks.
- **Validate before claiming done.** Run `npm run typecheck` and `npm run build` (or `npm run tauri:build` for desktop) after meaningful changes. Never mark a task complete if a check failed.
- **Touch gestures must remain suppressed** per §9. Do NOT preventDefault on `touchstart`.
- **MIDI latency is sacred.** Do not introduce blocking work on the MIDI emit path. Maintain the zero-allocation invariants in §8.
- **Persist user state via debounced storage.** Losing a custom layout / preset is unacceptable.
- **Communicate non-obvious decisions** by adding a row to §4 with a date.

**Always when finishing a sub-phase:**

1. Run `npm run typecheck` and `npm run tauri:build` (or `npm run build` if browser-only changes). Both must be green.
2. Update §11 (mark phase as done).
3. Add a changelog entry to §14 with the date and a substantive summary of what shipped, why, and any non-obvious decisions.
4. **Commit** using the convention in §7 (HEREDOC, env-var identity, Co-Authored-By).
5. **Push** to `origin/main`.

**Never:**

- Modify global git config.
- Commit build artifacts or anything in `node_modules/`, `dist/`, `dev-dist/`, `target/`, `C:\midi-build\`.
- Add Web MIDI broadcasts or state pushes that fire on every MIDI event without gating on listener presence.
- Add `preventDefault` to `touchstart`.
- Force-push to `main`.
- Skip hooks (`--no-verify`) without an explicit user ask.
- Bundle large binaries or unused dependencies — the standalone `.exe` should stay under 5 MB.

## 14. Changelog

| Date | Change | By |
|---|---|---|
| 2026-04-29 | Initial context file created with preliminary scope, open questions, and proposed stack. | Claude |
| 2026-04-29 | Open questions resolved: FL+Ableton, loopMIDI, Brave, touch-enabled with gesture suppression, Latitude 7420 2-in-1 multi-monitor, PWA delivery, production use, Vital-inspired dynamic visuals, MIDI-only audio, full stack locked, resizable layout, no OBS. Locked plan written. | Claude |
| 2026-04-29 | **Phase 0 — Scaffolding.** Vite+React+TS scaffold; Tailwind/ESLint/Prettier/strict TS configured; `touchSuppress.ts` installed at root; vite-plugin-pwa wired; Onboarding screen gates entry until `requestMIDIAccess` resolves. Bundle: 148 KB JS / 9.8 KB CSS. | Claude |
| 2026-04-29 | **Phase 1 — MIDI core.** `MidiEngine` owns the live `MIDIAccess`: port enumeration with hot-plug, output port selection + send helpers, input subscription with parsed `MidiEvent` broadcasting, parser for all standard channel + system real-time messages. Stores: `midiStore`, `settingsStore`, `learnStore`. Activity Monitor module. Settings panel. QWERTY fallback (A–L scale, W/E/T/Y/U/O/P black, Z/X octave, C/V velocity, blur → panic). Removed `@types/webmidi` (clashes with TS 5.5 lib.dom). Bundle: 171 KB JS / 13 KB CSS. | Claude |
| 2026-04-29 | **Phase 2 — Performance modules.** `performanceStore`. Default MIDI map (`src/features/midi-engine/defaults.ts`): pads → ch10 notes 36–51 / 52–67 / 68–83 / 84–99 (banks A/B/C/D), knobs → CC 16–23, faders → CC 20–27, mod wheel → CC 1, transport → CC 115–119. Stable controlIds. UI primitives: Pad, Knob (SVG arc), Fader, Wheel, TransportButton. Feature modules: PadGrid (4×4 + bank switcher), KnobRow + FaderRow (8 each), Wheels, PianoKeyboard (3 octaves, multi-touch + glide), Transport (Play/Stop/Rec/Loop/Metro/Tap-tempo). Global Learn toggle. Bundle: 191 KB JS / 17 KB CSS. | Claude |
| 2026-04-29 | **Phase 2.1 — Chord robustness + responsive keyboard.** Added multi-touch `preventDefault` (turned out to be a regression — see 2.2). PianoKeyboard rewritten as fully responsive via ResizeObserver, configurable 1..7 octaves with in-header zoom, drag-to-resize bottom edge. Layout: piano spans full bottom row. Settings: `pianoOctaves`, `pianoHeight`. Fullscreen toggle button. | Claude |
| 2026-04-29 | **Phase 2.2 — Chord-killer fix + perf overhaul.** Critical bug fixed: the multi-touch `preventDefault` from 2.1 was silently cancelling 2nd/3rd-finger `pointerdown` events. Reverted that listener; rely on `touch-action: none` + `gesturestart/change/end` prevent. Performance: `debouncedLocalStorage` (300 ms) wraps all three persisted stores. PianoKeyboard hot path uses `data-active` DOM toggling instead of React state. Per-key refcount for chord-shared keys. `Pad` / `Knob` / `Fader` / `Wheel` / `TransportButton` wrapped in `memo`. `KnobRow` / `FaderRow` split into per-control components. App subscribes to slim store slices. Layout: knob 62→52, fader 180→130, wheel 200→130 horizontal. Bundle: 194 KB JS / 18 KB CSS. | Claude |
| 2026-04-29 | **Phase 2.3 — Zero-alloc MIDI hot path.** `MidiEngine` rewritten with pre-allocated `Uint8Array(2)` and `Uint8Array(3)` send buffers + shared mutable broadcast event. Broadcast gated on `eventListeners.size > 0`. `MidiEvent.raw` made optional, skipped for outgoing. `midiStore` reduced to ports / outputId / inputId — no events buffer. `ActivityMonitor` owns its own buffer fed by listener; 10 Hz `setInterval` refresh. App attaches learn listener only while `learnMode` true. `Pad` press is fully imperative — `data-active='1'` + `--pad-glow` CSS var, zero React state. Bundle: 195 KB JS / 19 KB CSS. | Claude |
| 2026-04-30 | **Phase 3 — Tauri 2 desktop app.** Rust 1.95 GNU toolchain via `rustup --default-host x86_64-pc-windows-gnu --profile minimal`. MinGW-w64 via `choco install mingw -y` at `C:\ProgramData\mingw64\mingw64\bin`. `src-tauri/` with Cargo.toml (release profile tuned for size: `lto, opt-level="z", codegen-units=1, panic=abort, strip=true`), tauri.conf.json (1600×1000 default, dark theme, NSIS + MSI bundles, identifier `com.midisurface.app`), capabilities (core + window controls + `shell:allow-open` allow-list). `vite.config.ts` skips PWA when `TAURI_ENV_PLATFORM` set. **`CARGO_TARGET_DIR=C:\midi-build`** is required because binutils' dlltool can't handle the project path's space. Onboarding wires `@tauri-apps/plugin-shell` for the loopMIDI download link + Refresh-ports button + auto-refresh on focus. New `src/app/runtime.ts` with `isTauri()` and `openExternal()`. Launchers: `run.bat` (smart), `dev.bat`, `build.bat`. Removed `run-preview.bat`. **Artifacts**: 4 MB standalone `.exe`, 1.5 MB NSIS installer, 2.2 MB MSI. | Claude |
| 2026-04-30 | **Repo published.** Initial commit covering all phases (75 files, ~910 KB). Private GitHub repo at `Haseeb3011/midi-surface`. Author identity set per-commit via env vars (no global git config touched). | Claude |
| 2026-04-30 | **AI_CONTEXT.md fully rewritten.** Consolidated into a clean living document with explicit git workflow (§7), build environment & gotchas (§8), zero-alloc invariants, and end-of-session checklist for keeping the repo updated. | Claude |
| 2026-05-01 | **Phase 4 — Customization.** Layout system: `Layout`, `LayoutPage`, `ModuleInstance`, `ControlOverride` types in `src/features/layout/types.ts`. Dexie DB in `src/persistence/db.ts` (seeded with 3 built-in presets: Default, Drums Focus, Keys Focus). `layoutStore` (Zustand, in-memory working copy; explicit save to Dexie). `LayoutRenderer` maps module arrays to 4-column CSS Grid. `PageTabs` for multi-page navigation. `ModuleWrapper` with dnd-kit `useSortable` drag handle + `ResizeHandle` corner grip (colSpan snap: 1/2/4). Per-control overrides (`colorHue`, `label`, `channel`, `CC`, `note`) wired into KnobRow, FaderRow, PadGrid — render via `useControlOverride` hook, MIDI send via `getControlOverride` synchronous getter (null fast-path, zero overhead during play). `ControlOverridePanel` sidebar: label, 9-hue swatch row, channel select, CC/note inputs per control. `PresetBrowser` sidebar: live Dexie list via `useLiveQuery`, load/duplicate/rename/delete/export JSON/import JSON. Edit mode toggle in header; Save/Discard buttons; built-ins prompt "save as" on Save. Bundle: 364 KB JS / 21 KB CSS (Vite build clean, Tauri build clean — Rust compiled in 4m 14s). | Claude |
| 2026-05-05 | **Phase 4.8 — Performance optimization.** Targets identified by a chord-storm audit. Piano keyboard: replaced per-press `container.querySelector('[data-note]')` with a `Map<note, HTMLElement>` rebuilt in `useLayoutEffect` keyed on layout — O(1) visual updates instead of O(36) DOM scans per key (4× per chord press + 4× per release). Replaced `document.elementFromPoint` (forces sync layout flush) in `pointermove` with math-based hit-testing using cached container bounds + the layout's pre-computed key positions: black keys take precedence in the upper Y-band via short linear scan, whites resolve via `Math.floor(x / whiteWidth)`. ResizeObserver in `PianoKeyboard` coalesced via `requestAnimationFrame` so dnd-kit-driven width churn doesn't fire setState every frame. CSS `transition: background 60ms` removed from `.piano-key-white` and `.piano-key-black` — instant snap on chord press / release; eliminates overlapping transition pile-ups during glissandos. `layoutStore` gained a derived `moduleIndex: Map<string, ModuleInstance>` rebuilt inside every layout-mutating action; `getControlOverride` and `useControlOverride` now do O(1) Map lookup instead of `pages × modules` linear walk per MIDI event. `useControlOverride` selector is `useMemo`-stabilized per `(moduleId, controlId)` so Zustand reuses the memoized result and editMode toggles don't trigger 60+ selector re-runs. `performanceStore.setKnob` / `setFader` switched to in-place mutation with a no-op fast-path (skip set when rounded value unchanged) — eliminates the per-drag-tick `array.slice()` allocation; safe because every consumer subscribes via `s.knobs[i]` (primitive). `LayoutRenderer` split into `PerformanceGrid` (subscribes only to active page's modules) and `EditableGrid` (mounts dnd-kit `DndContext` + `SortableContext` only when editMode is true) — flipping edit mode no longer cascades into module re-renders during play. Pad imperative path: `el.removeAttribute('data-active')` instead of `delete el.dataset.active`, `String(glow)` instead of `glow.toFixed(3)` to skip a string allocation per press. `TransportButton` press visual moved off React state to `data-pressed` attribute + `.transport-btn` CSS class — zero re-renders on press / release. Bundle: 364 KB JS / 26.5 KB CSS (essentially unchanged). Tauri Rust compile 2m 34s (down from 3m 02s in 4.7 — fewer changes for the linker to chew on). | Claude |
| 2026-05-03 | **Phase 4.7 — UI refinement & theme overhaul.** Full design-token rewrite in `src/styles/tokens.css`: 12 color tokens (added `surface-low`, `border-soft`, `border-strong`, `text-soft`) × 5 themes — **LANDR (new default, deep teal/blue minimal)**, Vital, Cyber, Sunset, Mono. Each theme rewires the entire palette; structure is theme-invariant. Added radius scale (`--r-sm` 6 / `--r-md` 10 / `--r-lg` 14 / `--r-xl` 18) and elevation scale (`--elev-1`, `--elev-2`, `--elev-glow`). `tailwind.config.ts` exposes new color/radius/shadow utilities. New shared CSS classes in `globals.css`: `.module-panel` (flat theme-tinted module surface, 16px padding, no backdrop-blur), `.module-header` / `.module-title` / `.module-meta`, and `.header-btn` (canonical 32px-height pill with `data-active` and `data-tone='ok'\|'warn'\|'accent'` variants). `.glass` reserved for sidebar panels (settings/activity/presets/override) only — modules are now flat. Primitives refined: Knob arc 3→2px stroke, indicator dot replaced with thin radial line, recessed body via stacked surface circles, value text in sans tabular-nums; Fader track 28→20px wide, thumb 12→8px, lower glow base; Wheel 36→28px wide, thumb 24→16px; Pad: dim by default (glow=0), border-soft, radius-md; TransportButton pinned to h-9, sans label, halved active glow. Piano black-key gradient now reads `--surface-low → --bg` (was hardcoded). Every feature module migrated from `.glass` to `.module-panel`. App header, page tabs, sidebar panels (Settings, Activity, Presets, Override) and module sub-controls (PadGrid bank buttons, PianoKeyboard root/zoom, PresetBrowser/ControlOverridePanel) all use `.header-btn`. SettingsPanel theme picker rebuilt with full per-theme palette swatch previews. `settingsStore` extended: `ThemeName` union (`landr` \| `vital` \| `cyber` \| `sunset` \| `mono`), persist version bumped to 3, migration maps legacy `'default'` → `'landr'`. App.tsx theme effect treats `'landr'` as the `:root` baseline (no `data-theme` attr). Performance invariants preserved — no new React state on hot paths, no per-control re-renders, theme switch is still a single CSS-variable swap. Bundle: 363 KB JS / 26 KB CSS. Tauri build clean (Rust 3m 02s). | Claude |

## 15. Open questions

_None at the moment — all resolved. Add new ones here as they come up._

## 16. Next-session quickstart cheat sheet

```bash
# 1) Always: sync from remote
cd "C:/Users/hasee/Documents/App Projects/MIDI Project"
git status
git pull --rebase

# 2) For Rust / Tauri work, prepend the toolchain to PATH and redirect target dir:
export PATH="$HOME/.cargo/bin:/c/ProgramData/mingw64/mingw64/bin:$PATH"
export CARGO_TARGET_DIR="C:/midi-build"

# 3) Smoke test before claiming done:
npm run typecheck
npm run tauri:build  # or `npm run build` for browser-only changes

# 4) Commit (env-var identity, HEREDOC, Co-Authored-By):
GIT_AUTHOR_NAME="Haseeb3011" GIT_AUTHOR_EMAIL="haseeb309786@gmail.com" \
GIT_COMMITTER_NAME="Haseeb3011" GIT_COMMITTER_EMAIL="haseeb309786@gmail.com" \
git commit -m "$(cat <<'EOF'
<subject under 72 chars>

<body explaining why + tricky decisions>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 5) Push
git push
```
