; NSIS post-install hook for MIDI Surface.
;
; Installs loopMIDI silently via winget so the user doesn't have to do it
; manually, then seeds a default port named "MIDI Surface" by writing
; loopMIDI.cfg if (and only if) the user has no existing config.
;
; Failures are intentionally tolerated: if winget is unavailable or the
; install fails, the in-app status pill takes over and prompts the user to
; install loopMIDI from the official site.

!macro NSIS_HOOK_PREINSTALL
  DetailPrint "Installing WebView2 loader DLL..."
  ; The GNU Windows build emits WebView2Loader.dll next to the app binary.
  ; The NSIS template copies only the main exe by default, so include the DLL
  ; explicitly beside midi-surface.exe or the installed app fails at launch.
  File "/oname=WebView2Loader.dll" "$%CARGO_TARGET_DIR%\release\WebView2Loader.dll"
!macroend

!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Installing loopMIDI (via winget)..."
  ; PowerShell wraps the winget call in try/catch so an exit code other
  ; than 0 (e.g. winget missing on older Windows builds) doesn't abort
  ; the rest of the install. ExecToLog so the output ends up in the
  ; installer's detail view if the user expanded it.
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process -FilePath \"winget\" -ArgumentList \"install\",\"-e\",\"--id\",\"TobiasErichsen.loopMIDI\",\"--silent\",\"--accept-source-agreements\",\"--accept-package-agreements\" -Wait -NoNewWindow -ErrorAction SilentlyContinue } catch { }"'

  DetailPrint "Seeding default loopMIDI port (if user has no config)..."
  ; If %APPDATA%\loopMIDI\loopMIDI.cfg does not exist, create it with a
  ; single port named "MIDI Surface". If it already exists, leave the
  ; user's config alone. Schema is loopMIDI's standard XML format.
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$cfg = Join-Path $env:APPDATA \"loopMIDI\\loopMIDI.cfg\"; if (-not (Test-Path $cfg)) { try { New-Item -ItemType Directory -Force -Path (Split-Path $cfg) | Out-Null; $xml = \"<?xml version=`\"1.0`\" encoding=`\"UTF-8`\"?>`r`n<loopMIDI><portList><port>MIDI Surface</port></portList></loopMIDI>`r`n\"; [System.IO.File]::WriteAllText($cfg, $xml, [System.Text.Encoding]::UTF8) } catch { } }"'
!macroend
