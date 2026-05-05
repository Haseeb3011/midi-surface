; NSIS hooks for MIDI Surface.
;
; PREINSTALL: copies WebView2Loader.dll (required by the GNU build) into
;   the install dir alongside midi-surface.exe.
;
; POSTINSTALL: seeds %APPDATA%\loopMIDI\loopMIDI.cfg with a default port
;   named "MIDI Surface" iff the user has no existing config. Does NOT
;   install loopMIDI automatically — silent winget installs were found to
;   corrupt existing driver registrations. The in-app status pill prompts
;   the user to install loopMIDI manually if it is not detected.

!macro NSIS_HOOK_PREINSTALL
  DetailPrint "Installing WebView2 loader DLL..."
  ; The GNU Windows build emits WebView2Loader.dll next to the app binary.
  ; The NSIS template copies only the main exe by default, so include the DLL
  ; explicitly beside midi-surface.exe or the installed app fails at launch.
  File "/oname=WebView2Loader.dll" "$%CARGO_TARGET_DIR%\release\WebView2Loader.dll"
!macroend

!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Seeding default loopMIDI port (if user has no config)..."
  ; If %APPDATA%\loopMIDI\loopMIDI.cfg does not exist, create it with a
  ; single port named "MIDI Surface". If it already exists, leave the
  ; user's config alone.
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$cfg = Join-Path $env:APPDATA \"loopMIDI\\loopMIDI.cfg\"; if (-not (Test-Path $cfg)) { try { New-Item -ItemType Directory -Force -Path (Split-Path $cfg) | Out-Null; $xml = \"<?xml version=`\"1.0`\" encoding=`\"UTF-8`\"?>`r`n<loopMIDI><portList><port>MIDI Surface</port></portList></loopMIDI>`r`n\"; [System.IO.File]::WriteAllText($cfg, $xml, [System.Text.Encoding]::UTF8) } catch { } }"'
!macroend
