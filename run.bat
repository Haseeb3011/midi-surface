@echo off
setlocal
title MIDI Surface
chcp 65001 >nul

REM ---- Smart launcher --------------------------------------------------------
REM 1) If the production .exe has been built, launch it directly.
REM 2) Otherwise fall back to dev mode (Vite + Tauri WebView, hot reload).
REM First-time setup: run build.bat once to produce the .exe and the installer.

cd /d "%~dp0"

set "BUILT_EXE=C:\midi-build\release\midi-surface.exe"

if exist "%BUILT_EXE%" (
    echo Launching MIDI Surface...
    start "" "%BUILT_EXE%"
    exit /b 0
)

echo No built executable found — falling back to dev mode.
echo Run build.bat once to produce a standalone .exe and installer.
echo.
call "%~dp0dev.bat"
endlocal
