# AI Context — MIDI Surface

> **Living document. Read end-to-end at every session start. Update §14 changelog whenever scope, decisions, conventions, or context change.**

---

## 1. Pitch

**MIDI Surface** — Vital-synth-inspired touch MIDI control surface. Ships as a lightweight Windows desktop app (Tauri 2, ~4 MB exe) running in WebView2, sending MIDI through **loopMIDI** to FL Studio / Ableton. Same React app runs as a PWA browser fallback. Modules: pads, piano, knobs, faders, pitch + mod wheels, transport, MIDI Learn, activity monitor.

Repo: <https://github.com/Haseeb3011/midi-surface> (private).

## 2. User profile

- **GitHub:** `Haseeb3011` · **Email:** `haseeb309786@gmail.com`
- **OS:** Windows 11 Pro · **HW:** Dell Latitude 7420 2-in-1 touchscreen, multi-monitor (app on touchscreen, DAW on secondary)
- **No external MIDI hardware.** App is the sole controller.
- **DAWs:** FL Studio + Ableton Live · **Browser:** Brave (Web MIDI must be allowed at `brave://settings/content/midi` for browser fallback only)
- **Project root:** `C:\Users\hasee\Documents\App Projects\MIDI Project`
- Builds creative tools, comfortable with technical decisions, trusts the assistant to pick "what's best" when given options.

## 3. Hard constraints

- Lightweight desktop app, **no perceptible lag** during play. Performance is first-class.
- Controls a running DAW on the secondary screen.
- Feature-rich, highly customizable / dynamic.
- Modern Vital-inspired visuals.
- **Ignore browser + Windows gestures** so they don't hijack pad presses or chords.
- **Plan presented and approved before any execution** (see §13).
- This file kept up to date on every material change.
- Git repo updated **only on explicit user instruction** (see §7).

## 4. Confirmed decisions

| # | Decision | Value | Date |
|---|---|---|---|
| 1 | Target DAWs | FL Studio + Ableton Live | 2026-04-29 |
| 2 | Virtual MIDI | loopMIDI; auto-installed via NSIS+winget; auto-launched at boot | 2026-04-29 / -05-05 |
| 3 | Browser fallback | Brave / Chrome / Edge (Chromium) | 2026-04-29 |
| 4 | Touch input | Touch ENABLED. Suppress browser+Windows gesture defaults (pinch-zoom, double-tap zoom, swipe-back, pull-to-refresh, long-press menu, edge swipes). **DO NOT** preventDefault on `touchstart` (cancels equivalent `pointerdown` and breaks chords). | 2026-04-29 |
| 5 | Hardware target | Dell Latitude 7420 2-in-1 touchscreen, multi-monitor | 2026-04-29 |
| 6 | Delivery | **Tauri 2 desktop app** (primary) + PWA fallback. Standalone exe ~4 MB, NSIS installer ~1.5 MB. | 2026-04-30 |
| 7 | Use case | Production-grade from day one | 2026-04-29 |
| 8 | Visual style | Vital-inspired — dark base, glowing controls, animated gradients, dynamic activity-driven colors | 2026-04-29 |
| 9 | Audio preview | Pure MIDI-out only for v1. Tone.js deferred. | 2026-04-29 |
| 10 | Tech stack | React 18 + TS + Vite + Tailwind + Framer Motion + Zustand + Dexie + dnd-kit + Tauri 2 + WebView2 + Rust GNU + MinGW. | 2026-04-29 / -30 |
| 11 | Layout | Fully resizable + draggable modules (dnd-kit, Phase 4) | 2026-04-29 |
| 12 | OBS overlay | Skipped for v1. Revisit only if trivial. | 2026-04-29 |
| 13 | Code signing | Skipped (SmartScreen "Run anyway" once is acceptable) | 2026-04-30 |
| 14 | Repo | Private GitHub repo `Haseeb3011/midi-surface`, branch `main` | 2026-04-30 |
| 15 | MIDI transport | **WinMM-only** on desktop (Rust `native_midi.rs` → `midiOutShortMsg`). Web MIDI used only for inputs (Learn / Activity Monitor) on desktop, and for both on browser PWA. WebView2's Web MIDI output enumeration is unreliable. | 2026-05-06 |

## 5. Tech stack (locked)

| Concern | Choice |
|---|---|
| Frontend | React 18 + TypeScript (strict) |
| Build | Vite 5 (vite-plugin-pwa for browser fallback only — disabled under Tauri) |
| Desktop shell | **Tauri 2** + WebView2 (system-shared, Win11) |
| Rust toolchain | Stable 1.95+, **GNU host** (`x86_64-pc-windows-gnu`) via `rustup` |
| C/C++ | **MinGW-w64** at `C:\ProgramData\mingw64\mingw64\bin` (`choco install mingw -y`) |
| Styling | TailwindCSS 3 + CSS custom properties (live theme tokens) |
| Animation | Framer Motion (UI). GSAP / pixi.js available if ever needed for high-FPS visuals. |
| State | Zustand 4 + `persist` w/ debounced localStorage |
| Persistence | Debounced localStorage (settings); Dexie (IndexedDB) for presets |
| Drag / resize | `dnd-kit` |
| MIDI (desktop output) | **WinMM** via `src-tauri/src/native_midi.rs` (`midiOutOpen`/`midiOutShortMsg`), bridge in `src/app/nativeMidi.ts` |
| MIDI (input + browser output) | Native Web MIDI API via `MidiEngine` (zero-allocation hot path) |
| Hotkeys | `react-hotkeys-hook` |
| Tests | Vitest + Playwright (planned) |
| Lint / format | ESLint 8 + Prettier 3 + `prettier-plugin-tailwindcss` |

## 6. MIDI routing pipeline

```
[MIDI Surface — React app inside Tauri WebView2]
      │ Output:  Tauri invoke → WinMM (midiOutShortMsg)   ← desktop
      │          MIDIOutput.send(Uint8Array)              ← browser PWA
      │ Input:   Web MIDI (in-process)                    ← both
      ▼
[loopMIDI — virtual MIDI port on Windows]
      │
      ▼
[FL Studio / Ableton Live]
```

loopMIDI installed silently via NSIS+winget on first install; auto-launched on boot if not running. Header status pill reports live state with recovery actions (start, refresh, download).

## 7. Git workflow & repo upkeep

**Repo:** `git@github.com:Haseeb3011/midi-surface.git` (private). **Branch:** `main`.

**Author identity** is set per-commit via env vars — never `git config --global`:

```bash
GIT_AUTHOR_NAME="Haseeb3011" GIT_AUTHOR_EMAIL="haseeb309786@gmail.com" \
GIT_COMMITTER_NAME="Haseeb3011" GIT_COMMITTER_EMAIL="haseeb309786@gmail.com" \
git commit -m "..."
```

### **Push policy — STRICT**

- **Never push, force-push, or upload to GitHub without an explicit user instruction.** Local commits are fine; remote sync is gated.
- When the user instructs "push" / "upload" / "update GitHub" / "ship":
  1. Push commits to `origin/main`.
  2. **Also update the GitHub release** for the current `package.json` version: rebuild if not already fresh, then upload `midi-surface.exe`, `MIDI Surface_<ver>_x64-setup.exe` (NSIS), and `MIDI Surface_<ver>_x64_en-US.msi` (if built) via `gh release upload <tag> <files> --clobber` (or `gh release create <tag> <files>` if the tag doesn't exist). Use the version from `package.json` and tag `v<version>`.
- Never bypass hooks (`--no-verify`) or signing flags unless explicitly asked.
- Never modify global git config.

### Commit cadence (local)

Commit at meaningful checkpoints, not every edit:
- After each sub-phase passes typecheck + build.
- After a focused, tested bug fix.
- After updating `AI_CONTEXT.md`.
- Before a risky refactor (known-good baseline).

Don't commit: mid-refactor work that doesn't typecheck; build artifacts (`dist/`, `dev-dist/`, `target/`, `C:\midi-build\`); secrets/tokens.

### Commit message convention

One-line subject (<72 chars, imperative). Blank line. Short body explaining *why* + non-obvious decisions. End with `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`. Use HEREDOC for multi-line messages.

### Pre-work checklist (every session)

1. `git status` — confirm clean tree.
2. `git pull --rebase` — sync from remote.
3. Read this file (§3 constraints, §8 invariants, §11 phases, §14 changelog, §15 open questions).

### `gh` operations

User has `gh` authenticated as `Haseeb3011` (`repo`, `gist`, `read:org`, `workflow`). Use for issues / PRs / releases when explicitly requested.

## 8. Build environment & gotchas

### Required tools (already installed)

| Tool | Where | Purpose |
|---|---|---|
| Node 25 + npm 11 | system PATH | Vite + React build |
| Rust 1.95 stable, GNU | `~/.cargo/bin` | Tauri Rust shell |
| MinGW-w64 | `C:\ProgramData\mingw64\mingw64\bin` | `dlltool` + binutils |
| WebView2 | built into Win11 | Browser engine the Tauri app embeds |
| `gh` CLI | system PATH | issues / PRs / releases |
| Chocolatey | `~\AppData\Local\UniGetUI\Chocolatey\bin` | Windows packages |

### `CARGO_TARGET_DIR=C:\midi-build` is required

`dlltool.exe` cannot handle paths containing spaces. Project lives at `C:\Users\hasee\Documents\App Projects\MIDI Project` (note "App Projects"). Without redirecting cargo target dir, build fails with `can't open Projects\MIDI for reading`.

`run.bat` / `dev.bat` / `build.bat` (gitignored) set this automatically. From a shell, prepend:

```bash
export PATH="$HOME/.cargo/bin:/c/ProgramData/mingw64/mingw64/bin:$PATH"
export CARGO_TARGET_DIR="C:/midi-build"
```

### Launcher scripts (local-only, gitignored)

| Script | Action |
|---|---|
| `run.bat` | Smart launcher — runs `C:\midi-build\release\midi-surface.exe` if it exists, else falls back to `dev.bat` |
| `dev.bat` | `npm run tauri:dev` (Vite + Tauri WebView, hot reload) |
| `build.bat` | `npm run tauri:build` — produces `.exe`, NSIS, MSI; opens bundle folder |

### Build output paths

After `build.bat`:
- Standalone: `C:\midi-build\release\midi-surface.exe` (~4 MB)
- NSIS installer: `C:\midi-build\release\bundle\nsis\MIDI Surface_<ver>_x64-setup.exe` (~1.5 MB)
- MSI installer: `C:\midi-build\release\bundle\msi\MIDI Surface_<ver>_x64_en-US.msi` (~2.2 MB)

If MSI bundling fails with `Access is denied. (os error 5)` (msiexec holding old MSI), build into a fresh no-space target dir like `C:\midi-build-fresh` instead.

### NSIS hooks (`src-tauri/windows/installer-hooks.nsh`)

- `NSIS_HOOK_PREINSTALL`: copies `WebView2Loader.dll` from the cargo release dir to `$INSTDIR`. **Do not remove** unless switching off GNU Windows builds.
- `NSIS_HOOK_POSTINSTALL`: silently installs loopMIDI via `winget install -e --id TobiasErichsen.loopMIDI`; seeds `%APPDATA%\loopMIDI\loopMIDI.cfg` with a default `MIDI Surface` port iff none exists.

### MIDI architecture invariants

- **Desktop output** is exclusively WinMM (`src-tauri/src/native_midi.rs`). Web MIDI outputs are never enumerated or sent to under Tauri — WebView2's Web MIDI output enumeration has been observed to silently return zero ports.
- **Browser output** is Web MIDI only.
- **Inputs** (MIDI Learn, Activity Monitor capture) always go through Web MIDI; on desktop, failure to acquire `MIDIAccess` is non-fatal — outputs still work.
- Native output ids use `native:<n>` prefix; Web MIDI ids use the browser's own port id strings. `bootstrapMidiStore` auto-selects the first port whose name matches `/loop|midi surface/i` when the persisted id is stale.

### loopMIDI redistribution

Do **not** bundle the loopMIDI binary directly. Tobias Erichsen's loopMIDI/virtualMIDI pages do not confirm a redistribution license. Stick with NSIS+winget install + auto-launch.

### Performance / zero-alloc invariants — DO NOT REGRESS

- `MidiEngine.send*()` reuses pre-allocated `Uint8Array(2)` and `Uint8Array(3)` buffers (browser path). Never allocate per-send.
- Broadcast path is **listener-gated** — `if (this.eventListeners.size === 0) return` before any event work. During normal play (Activity Monitor closed, Learn off), zero observers means zero allocations and zero React re-renders.
- Learn listener attaches only when `learnMode` is true (`useEffect` dep `[learnMode]`).
- Piano key, pad, transport-button visuals are toggled imperatively (`data-active` / `data-pressed` attributes + CSS). No React state on press / release / glide.
- All persisted Zustand stores (`settingsStore`, `learnStore`, `performanceStore`) use `debouncedLocalStorage(300)` — never default storage.
- Knob / Fader rows split into per-control components subscribing to their own slot only.
- All UI primitives (`Pad`, `Knob`, `Fader`, `Wheel`, `TransportButton`) and feature modules wrapped in `React.memo`.
- `layoutStore.moduleIndex: Map<id, ModuleInstance>` rebuilt on every mutation; override lookups are O(1).
- Piano key DOM cached as `Map<note, HTMLElement>` rebuilt in `useLayoutEffect`; hit-testing is math-based (no `elementFromPoint`).

## 9. Touch / gesture suppression

Layered defenses:

1. **CSS:** `touch-action: none`, `overscroll-behavior: none`, `user-select: none` on `html` / `body` (`src/styles/globals.css`).
2. **Viewport meta:** `user-scalable=no, maximum-scale=1, viewport-fit=cover` (`index.html`).
3. **JS** (`src/input/touchSuppress.ts`):
   - `gesturestart/change/end` → preventDefault.
   - `contextmenu` → preventDefault unless `[data-allow-context]`.
   - `wheel` w/ ctrl/meta → preventDefault (zoom).
   - `dblclick` → preventDefault.
   - `selectstart`, `dragstart` → preventDefault outside opt-in.
   - `keydown` ctrl/meta + `=`/`+`/`-`/`0` → preventDefault.
   - **Never** preventDefault on `touchstart`/`touchmove` — cancels equivalent `pointerdown` and breaks chords.
4. PWA / Tauri standalone: no browser chrome, no edge-swipe-back, no tab strip.
5. **OS-level**: cannot be intercepted from a webpage. Mitigation: run fullscreen (F11) and disable Windows touchpad multi-finger gestures via Settings → Bluetooth & devices → Touchpad. For touchscreen-specific gestures, check Dell SupportAssist / Synaptics control panel.

## 10. UI/UX principles

- **Performance-grade responsiveness** — click-to-MIDI-emit < 10 ms.
- **No accidental triggers** — pad presses don't navigate, scroll, or zoom.
- **Modular layout** — every module is self-contained, MIDI-Learn-aware, draggable + resizable in edit mode.
- **Themeability is first-class.**
- **No splash gate** — surface renders immediately. `<MidiStatus />` reports loopMIDI state inline in the header with one-click recovery.
- **Default-friendly MIDI map** — pads ch10 / knobs CC 16–23 / faders CC 20–27 / transport CC 115–119 (one-tap MIDI Learn in any DAW).

## 11. Phase plan & current status

### ✅ Done
- **Phase 0** — Scaffolding (Vite/React/TS/Tailwind, touch suppression, PWA manifest)
- **Phase 1** — MIDI core (`MidiEngine`, port enumeration, hot-plug, MIDI Learn, activity monitor, QWERTY fallback)
- **Phase 2** — Performance modules (pads, piano, knobs, faders, pitch+mod wheels, transport with tap-tempo)
- **Phase 2.1** — Chord robustness + responsive resizable keyboard
- **Phase 2.2** — Chord-killer fix (don't preventDefault touchstart) + perf overhaul (debounced storage, imperative piano, React.memo, per-control subscriptions)
- **Phase 2.3** — Zero-allocation MIDI hot path (pre-allocated send buffers, listener-gated broadcast, imperative pad press)
- **Phase 3** — Tauri 2 desktop app (4 MB exe, 1.5 MB NSIS, in-app loopMIDI download)
- **Phase 4** — Customization: drag-and-drop layout editor, multi-page tabs, Dexie preset store, per-control overrides, JSON import/export
- **Phase 4.7** — UI refinement & 5-theme system (LANDR default, Vital, Cyber, Sunset, Mono); `.module-panel` / `.header-btn` shared utilities; refined primitives
- **Phase 4.8** — Performance optimization: piano key DOM Map cache (O(1) visual update), math-based hit-testing, `layoutStore.moduleIndex`, stable selectors, in-place performanceStore mutation, `PerformanceGrid`/`EditableGrid` split, imperative TransportButton press
- **Phase 4.9** — loopMIDI auto-install + onboarding-gate removal: NSIS hook installs loopMIDI silently via winget and seeds default port; app boot auto-launches loopMIDI; full-screen splash replaced by inline header status pill
- **Phase 5.0 (MIDI transport unification)** — Removed Web MIDI output fallback on desktop. WinMM is the sole output backend in Tauri; Web MIDI used only for inputs. Eliminates duplicate ports + WebView2-zero-output detection failures.

### 🟡 Next — pending user sequencing approval
- **Phase 5 — Quick wins**: custom app icon, hotkeys (Space play/stop, R record, P perf mode, F1 help, Esc exit fullscreen, 1–4 pad bank), perf mode (auto-hide chrome), settings export/import
- **Phase 6 — Advanced musical features**: step sequencer, arpeggiator, chord generator, scale lock, XY pad, note repeat, MIDI clock sync
- **Phase 7 — Visual polish & theming**: dynamic accent system, velocity ripples, animated background, theme editor
- **Phase 8 — Stretch**: LFO modulation, macros, scenes/snapshot morphing, network MIDI, in-app pattern recorder + `.mid` export, Tone.js audio preview, OBS transparent-background mode

## 12. Coding conventions

- TS strict; `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `noImplicitOverride` all on.
- Function components + hooks. No classes.
- `PascalCase` components, `camelCase` functions, `SCREAMING_SNAKE_CASE` constants.
- Feature folders: `src/features/<feature>/`. Shared primitives in `src/ui/`. Stores in `src/store/`. Persistence helpers in `src/persistence/`.
- Path alias: `@/...` maps to `src/...`.
- No comments unless explaining a non-obvious *why*. Self-explanatory names preferred.
- Avoid premature abstraction — three similar lines beats a wrong-shaped helper.
- Top-of-file comment block on every non-trivial file briefly explaining what it owns.
- React.memo every UI primitive and feature module. Subscribe to Zustand slices, not whole stores.

## 13. Working agreement — instructions for future AI sessions

### **Core directives (non-negotiable)**

1. **Always read this file end-to-end at session start** — especially §3, §8, §11, §14, §15.
2. **Never start coding without an approved plan.** For any non-trivial change, present the plan first and wait for explicit approval.
3. **Ask before executing anything with side effects** — installs, builds, file writes outside the immediate task, deletions, restarts, anything destructive. Read-only investigation (Read/Grep/Glob) does not require asking.
4. **Never push to GitHub or upload release artifacts without an explicit user instruction.** Local commits are OK. Remote sync requires the user to say "push" / "upload" / "update GitHub" / "ship".
5. **When the user does say to push:** push commits to `origin/main` AND update the GitHub release (`gh release upload v<ver> <files> --clobber` for the version in `package.json`, attaching the standalone exe + NSIS + MSI from `C:\midi-build\release\` and its `bundle/` subfolders).
6. **Never add features beyond the locked plan** without asking. Open questions in §15 must be resolved with the user before proceeding.
7. **Default to terse output.** No emoji unless the user asks.
8. **Validate before claiming done.** `npm run typecheck` AND `npm run tauri:build` (or `npm run build` for browser-only) must pass. Never mark complete on a failed check.
9. **Touch gestures must remain suppressed per §9.** Never preventDefault on `touchstart`.
10. **MIDI latency is sacred.** No blocking work on the emit path. Maintain zero-allocation invariants in §8.
11. **Persist user state via debounced storage.** Losing a custom layout / preset is unacceptable.
12. **Communicate non-obvious decisions** by adding a row to §4 with a date.
13. **Update §11 + §14 after every sub-phase** with what shipped, why, and any non-obvious decisions.

### Sub-phase finish ritual

1. `npm run typecheck` and `npm run tauri:build` (or `npm run build` for browser-only). Both green.
2. Update §11 (mark done).
3. Add §14 changelog entry: date + substantive summary.
4. Commit (HEREDOC, env-var identity, Co-Authored-By).
5. **STOP. Do not push.** Wait for user instruction before any `git push` or release upload.

### Forbidden actions

- Modify global git config.
- Commit `node_modules/`, `dist/`, `dev-dist/`, `target/`, `C:\midi-build\`, secrets/tokens, `*.bat` files.
- Add Web MIDI broadcasts or state pushes that fire on every MIDI event without listener gating.
- `preventDefault` on `touchstart`.
- Force-push to `main`.
- Skip hooks (`--no-verify`) without explicit instruction.
- Bundle large binaries or unused deps — standalone exe must stay under 5 MB.
- Push to GitHub or upload release artifacts without explicit user instruction.

## 14. Changelog

| Date | Change | By |
|---|---|---|
| 2026-05-06 | **Phase 5.0 — WinMM-only desktop transport.** Removed dual Web MIDI + native fallback. `MidiEngine` now platform-splits: Tauri uses WinMM exclusively for outputs; Web MIDI used only for inputs (Learn / Activity Monitor) and gracefully tolerates failure. Browser PWA still uses Web MIDI for both. Fixes: duplicate loopMIDI ports in the picker, silent send-no-ops when persisted id mismatched the active backend, WebView2's intermittent zero-output enumeration. `midiStore.refreshPorts` is now async; `loopMidiAutoStart` polling awaits it so the next-tick check sees authoritative state. **Repo hygiene:** `.bat` files (`run.bat`, `dev.bat`, `build.bat`) untracked + gitignored as user-machine-specific. **AI_CONTEXT** rewritten/compressed; tightened push policy (no GitHub push or release upload without explicit user instruction; releases must be updated with fresh artifacts when pushing). | Claude |
| 2026-05-05 | **Native Windows MIDI output fallback.** User showed loopMIDI running with a `MIDI Surface` port while the app still displayed `no MIDI port`, proving WebView2/Web MIDI had access but returned zero outputs. Added Tauri WinMM bridge (`src-tauri/src/native_midi.rs` + `src/app/nativeMidi.ts` + `MidiEngine` integration). Validated; native ports exposed as `native:<id>`. *Superseded by 2026-05-06 (fallback removed; WinMM is now the sole desktop output path).* | Codex |
| 2026-05-05 | **loopMIDI detection hardening + redistribution decision.** Auto-start launched loopMIDI but relied on Web MIDI `onstatechange`; if that didn't fire, header stuck at `no MIDI port`. Updated `loopMidiAutoStart` to poll/refresh during the wait window; `App.tsx` refreshes ports/status after `tryAutoStartLoopMidi()` resolves. loopMIDI/virtualMIDI redistribution permission unconfirmed → keep winget+download flow. | Codex |
| 2026-05-05 | **Fixed NSIS missing `WebView2Loader.dll`.** Hit `WebView2Loader.dll was not found` after NSIS install. Added `NSIS_HOOK_PREINSTALL` to copy the loader DLL from cargo release dir into `$INSTDIR`. | Codex |
| 2026-05-05 | **Release-prep audit + fresh artifacts.** Stale MSI in `C:\midi-build`; rebuild blocked by msiexec lock. Built into `C:\midi-build-fresh` instead. Aligned npm metadata to 0.1.0; added missing PWA icons in `public/icons/`. | Codex |
| 2026-05-05 | **Phase 4.9 — loopMIDI auto-install + onboarding-gate removal.** NSIS post-install hook silently installs loopMIDI via `winget` (`TobiasErichsen.loopMIDI`) and seeds `%APPDATA%\loopMIDI\loopMIDI.cfg` w/ a default `MIDI Surface` port iff none exists. New `src/app/loopMidiAutoStart.ts` auto-launches loopMIDI on boot if no port appears within 1.5 s, then waits up to 3 s. Capability allow-list extended to the two known loopMIDI install paths. New `MidiStatus.tsx` header pill with three live states (green / amber / red) + popover with Start / Refresh / Download. Onboarding splash deleted; legacy `onboarded` localStorage one-shot cleaned up. | Claude |
| 2026-05-03 | **Phase 4.8 — Performance optimization.** Piano key `Map<note, HTMLElement>` cache; math-based hit-testing (no `elementFromPoint`); ResizeObserver coalesced via rAF; piano-key CSS transitions removed. `layoutStore.moduleIndex` for O(1) override lookup. `useControlOverride` selector `useMemo`-stabilized. `performanceStore.setKnob`/`setFader` in-place w/ no-op fast-path. `LayoutRenderer` split into `PerformanceGrid` + `EditableGrid` (dnd-kit only mounts in edit mode). Pad imperative `removeAttribute` + `String(glow)`. `TransportButton` press → `data-pressed` (no React state). | Claude |
| 2026-05-03 | **Phase 4.7 — UI refinement & theme overhaul.** 12 color tokens × 5 themes (LANDR new default, Vital, Cyber, Sunset, Mono). Radius + elevation scales. New shared classes: `.module-panel`, `.module-header`, `.header-btn` (with `data-tone='ok'\|'warn'\|'accent'`). `.glass` reserved for sidebar panels. Refined primitives. `settingsStore` `ThemeName` union, persist v3 migration. | Claude |
| 2026-05-01 | **Phase 4 — Customization.** Layout system (`Layout`, `LayoutPage`, `ModuleInstance`, `ControlOverride`). Dexie DB w/ 3 built-in presets. `layoutStore` (in-memory working copy; explicit save). `LayoutRenderer` 4-col CSS grid. `PageTabs`, `ModuleWrapper` w/ dnd-kit + `ResizeHandle` (colSpan snap 1/2/4). Per-control overrides (hue, label, channel, CC, note). `ControlOverridePanel` + `PresetBrowser` (load/duplicate/rename/delete/export/import). | Claude |
| 2026-04-30 | **Phase 3 — Tauri 2 desktop app.** Rust GNU + MinGW. NSIS + MSI bundles. `CARGO_TARGET_DIR=C:\midi-build` required. Onboarding wires `@tauri-apps/plugin-shell`. New `runtime.ts` (`isTauri()`, `openExternal()`). Launcher `.bat` files. Artifacts: 4 MB exe, 1.5 MB NSIS, 2.2 MB MSI. | Claude |
| 2026-04-30 | **Repo published.** Initial commit covering all phases. Private GitHub repo `Haseeb3011/midi-surface`. Per-commit env-var identity. | Claude |
| 2026-04-29 | **Phase 2.3 — Zero-alloc MIDI hot path.** Pre-allocated `Uint8Array(2)`/`(3)` send buffers, shared mutable broadcast event. Broadcast gated on listener count. `midiStore` no events buffer. `ActivityMonitor` owns its own ring buffer. Pad press fully imperative. | Claude |
| 2026-04-29 | **Phase 2.2 — Chord-killer fix + perf overhaul.** Reverted multi-touch `preventDefault` from 2.1 (it was cancelling 2nd/3rd-finger `pointerdown`). `debouncedLocalStorage(300)` for all persisted stores. PianoKeyboard imperative via `data-active`. Per-key refcount. `Pad`/`Knob`/`Fader`/`Wheel`/`TransportButton` memoized. Slim slice subscriptions. | Claude |
| 2026-04-29 | **Phase 2.1 — Chord robustness + responsive keyboard.** PianoKeyboard rewritten responsive via ResizeObserver, 1..7 octaves, drag-to-resize. Fullscreen toggle. (Multi-touch preventDefault from this phase reverted in 2.2.) | Claude |
| 2026-04-29 | **Phase 2 — Performance modules.** `performanceStore`, default MIDI map (pads ch10 / knobs CC 16–23 / faders CC 20–27 / mod wheel CC 1 / transport CC 115–119), Pad/Knob/Fader/Wheel/TransportButton primitives, PadGrid (4×4 + bank switcher), KnobRow + FaderRow, Wheels, PianoKeyboard, Transport (Play/Stop/Rec/Loop/Metro/Tap-tempo), global Learn toggle. | Claude |
| 2026-04-29 | **Phase 1 — MIDI core.** `MidiEngine`, parser, `midiStore`, `settingsStore`, `learnStore`, Activity Monitor, Settings panel, QWERTY fallback. | Claude |
| 2026-04-29 | **Phase 0 — Scaffolding.** Vite/React/TS, Tailwind, ESLint/Prettier, `touchSuppress.ts`, vite-plugin-pwa, Onboarding splash. | Claude |
| 2026-04-29 | Open questions resolved + locked plan. | Claude |
| 2026-04-29 | Initial AI_CONTEXT created. | Claude |

## 15. Open questions

_None at the moment._

## 16. Next-session quickstart

```bash
# 1) Sync from remote
cd "C:/Users/hasee/Documents/App Projects/MIDI Project"
git status
git pull --rebase

# 2) Rust/Tauri shell env
export PATH="$HOME/.cargo/bin:/c/ProgramData/mingw64/mingw64/bin:$PATH"
export CARGO_TARGET_DIR="C:/midi-build"

# 3) Smoke test before claiming done
npm run typecheck
npm run tauri:build  # or `npm run build` for browser-only changes

# 4) Commit (env-var identity, HEREDOC, Co-Authored-By)
GIT_AUTHOR_NAME="Haseeb3011" GIT_AUTHOR_EMAIL="haseeb309786@gmail.com" \
GIT_COMMITTER_NAME="Haseeb3011" GIT_COMMITTER_EMAIL="haseeb309786@gmail.com" \
git commit -m "$(cat <<'EOF'
<subject under 72 chars>

<body explaining why + tricky decisions>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 5) STOP. Do NOT push or upload to GitHub without an explicit user instruction.
#    When the user does say to push:
#       git push
#       VER=$(node -p "require('./package.json').version")
#       gh release upload "v$VER" \
#         "C:/midi-build/release/midi-surface.exe" \
#         "C:/midi-build/release/bundle/nsis/MIDI Surface_${VER}_x64-setup.exe" \
#         "C:/midi-build/release/bundle/msi/MIDI Surface_${VER}_x64_en-US.msi" \
#         --clobber
#       # (or `gh release create v$VER <files> --title "..." --notes "..."` if tag missing)
```
