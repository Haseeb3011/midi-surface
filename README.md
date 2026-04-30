# MIDI Surface

A Vital-inspired, touch-first MIDI control surface. Ships as a **lightweight Windows desktop app** (Tauri, ~4 MB). Falls back to a PWA / browser build for users who don't want to install. Sends MIDI through **loopMIDI** to FL Studio / Ableton Live.

> Source of truth for project context, decisions, and plan: [`AI_CONTEXT.md`](./AI_CONTEXT.md). Update it whenever scope or decisions change.

## Quick start

| What you want | Run |
| --- | --- |
| **Run the app** (after first build) | `run.bat` — launches the standalone `.exe` |
| **Live development** (hot reload Tauri window) | `dev.bat` |
| **Build the installer** (NSIS + MSI) | `build.bat` |

After `build.bat` completes, the artifacts are at `C:\midi-build\release\`:
- `midi-surface.exe` — standalone, 4 MB, no install needed
- `bundle\nsis\MIDI Surface_*.exe` — NSIS installer (1.5 MB)
- `bundle\msi\MIDI Surface_*.msi` — MSI installer (2.2 MB)

(The build target lives outside the project folder because `binutils` `dlltool` can't handle paths with spaces. Source stays put.)

## Prerequisites

| Tool | Why | Install |
| --- | --- | --- |
| **Node.js 20+** | Vite + React build | <https://nodejs.org/> |
| **Rust (stable, GNU toolchain)** | Tauri Rust shell | <https://rustup.rs/> with `--default-host x86_64-pc-windows-gnu --profile minimal` |
| **MinGW-w64** | `dlltool`, `gcc`, `binutils` for the GNU toolchain | `choco install mingw -y` (already installed at `C:\ProgramData\mingw64\mingw64\bin`) |
| **WebView2** | Browser engine the desktop app embeds | Built into Windows 11 |
| **loopMIDI** | Virtual MIDI port the DAW listens on | <https://www.tobias-erichsen.de/software/loopmidi.html> — auto-link from in-app onboarding |

## Browser fallback

The Tauri build is the primary distribution, but the same React app still runs in any Chromium browser:

```bash
npm install
npm run dev          # http://localhost:5173
```

Brave: enable Web MIDI at `brave://settings/content/midi` first.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (browser) |
| `npm run dev:host` | Vite exposed on LAN |
| `npm run build` | Vite production bundle (used by `tauri:build` automatically) |
| `npm run preview` | Serve production bundle in the browser |
| `npm run lint` / `format` / `typecheck` | Static checks |
| `npm run tauri` | Tauri CLI passthrough |
| `npm run tauri:dev` | Tauri dev mode (Vite + Rust shell with hot reload) |
| `npm run tauri:build` | Production: Vite build + Rust release + NSIS/MSI bundling |

## Tech stack

React 18 · TypeScript · Vite · TailwindCSS · Framer Motion · Zustand · Dexie · dnd-kit · vite-plugin-pwa · **Tauri 2** · WebView2.

## Layout

```
src/
├── app/                  shell, providers, onboarding, runtime helper
├── features/             midi-engine, pads, keyboard, knobs, faders, transport,
│                         sequencer, arpeggiator, chord-engine, xy-pad,
│                         pitchbend-modwheel, activity-monitor
├── layout/               draggable / resizable canvas (dnd-kit)
├── theme/                CSS-var theme system + editor
├── store/                zustand slices (layout, presets, settings, midi, learn)
├── persistence/          Dexie schema + preset I/O + debounced storage
├── input/                touchSuppress, keyboardMap, hotkeys
├── presets/              FL Studio + Ableton bundled templates
├── ui/                   primitives (Knob, Fader, Pad, LED…)
└── styles/               tokens.css + tailwind base

src-tauri/
├── Cargo.toml            Rust shell config (size-optimized release profile)
├── build.rs              Tauri build script
├── src/
│   ├── main.rs           entry
│   └── lib.rs            shell setup (logger + shell plugin)
├── tauri.conf.json       window, bundle, identifier, icons
├── capabilities/         permissions (shell:open allow-list, window controls)
└── icons/                app icons (PNG, ICO, ICNS)
```

## Touch / gesture suppression

Browser- and OS-level gesture defaults are blocked at the document root so pad presses, knob drags, and fader sweeps never trigger zoom / swipe-back / context menus / pull-to-refresh. See [`src/input/touchSuppress.ts`](src/input/touchSuppress.ts). Windows OS-level gestures (edge swipes, multi-finger system gestures) are mitigated by running the Tauri app fullscreen (`F11`) — the WebView has no browser chrome to swipe from.

## License

Private project.
