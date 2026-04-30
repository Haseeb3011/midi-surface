@echo off
setlocal enabledelayedexpansion
title MIDI Surface  -  dev (Tauri)
chcp 65001 >nul

REM ---- Live dev mode: Vite + Tauri WebView with hot reload --------------------
REM Uses Rust + MinGW from the standard install paths and redirects cargo's target
REM dir to a no-space path (binutils' dlltool can't handle "App Projects" in paths).

cd /d "%~dp0"

set "PATH=%USERPROFILE%\.cargo\bin;C:\ProgramData\mingw64\mingw64\bin;%PATH%"
set "CARGO_TARGET_DIR=C:\midi-build"

where node >nul 2>nul || ( echo [ERROR] Node not found. Install Node 20+ from https://nodejs.org/ & pause & exit /b 1 )
where cargo >nul 2>nul || ( echo [ERROR] Rust not found at %%USERPROFILE%%\.cargo\bin. Install via https://rustup.rs/ & pause & exit /b 1 )

if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install --no-audit --no-fund
)

echo.
echo Launching MIDI Surface (Tauri dev). Ctrl+C to stop.
echo.
call npm run tauri:dev

endlocal
