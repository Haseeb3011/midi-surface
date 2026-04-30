@echo off
setlocal enabledelayedexpansion
title MIDI Surface  -  build installer
chcp 65001 >nul

REM ---- Production build: produces the standalone .exe + NSIS / MSI installers --
REM Outputs land in C:\midi-build\release\bundle\ (not in this folder, because
REM binutils' dlltool can't handle the "App Projects" space in paths).

cd /d "%~dp0"

set "PATH=%USERPROFILE%\.cargo\bin;C:\ProgramData\mingw64\mingw64\bin;%PATH%"
set "CARGO_TARGET_DIR=C:\midi-build"

where node >nul 2>nul || ( echo [ERROR] Node not found. Install Node 20+ from https://nodejs.org/ & pause & exit /b 1 )
where cargo >nul 2>nul || ( echo [ERROR] Rust not found at %%USERPROFILE%%\.cargo\bin. Install via https://rustup.rs/ & pause & exit /b 1 )

if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install --no-audit --no-fund
    if errorlevel 1 ( pause & exit /b 1 )
)

echo.
echo Building MIDI Surface (this takes a few minutes the first time)...
echo.
call npm run tauri:build
if errorlevel 1 ( pause & exit /b 1 )

echo.
echo ============================================
echo  Build complete. Artifacts:
echo    %CARGO_TARGET_DIR%\release\midi-surface.exe        (standalone)
echo    %CARGO_TARGET_DIR%\release\bundle\nsis\            (NSIS installer)
echo    %CARGO_TARGET_DIR%\release\bundle\msi\             (MSI installer)
echo ============================================
echo.
echo Opening the bundle folder...
explorer "%CARGO_TARGET_DIR%\release\bundle"
echo.
pause
endlocal
