use serde::Serialize;
use std::sync::Mutex;

use windows_sys::Win32::Media::Audio::{
    midiOutClose, midiOutGetDevCapsW, midiOutGetNumDevs, midiOutOpen, midiOutShortMsg, HMIDIOUT,
    MIDIOUTCAPSW, CALLBACK_NULL,
};

#[derive(Default)]
pub struct NativeMidiState {
    output: Mutex<Option<NativeMidiOutputHandle>>,
}

struct NativeMidiOutputHandle {
    handle: usize,
}

#[derive(Serialize)]
pub struct NativeMidiOutput {
    id: u32,
    name: String,
}

fn result(code: u32, action: &str) -> Result<(), String> {
    if code == 0 {
        Ok(())
    } else {
        Err(format!("{action} failed with WinMM code {code}"))
    }
}

fn close_output(output: NativeMidiOutputHandle) {
    unsafe {
        let _ = midiOutClose(output.handle as HMIDIOUT);
    }
}

#[tauri::command]
pub fn native_midi_outputs() -> Vec<NativeMidiOutput> {
    let count = unsafe { midiOutGetNumDevs() };
    let mut outputs = Vec::with_capacity(count as usize);

    for id in 0..count {
        let mut caps = MIDIOUTCAPSW::default();
        let code = unsafe {
            midiOutGetDevCapsW(
                id as usize,
                &mut caps,
                std::mem::size_of::<MIDIOUTCAPSW>() as u32,
            )
        };
        if code != 0 {
            continue;
        }

        let name_buf = unsafe { std::ptr::addr_of!(caps.szPname).read_unaligned() };
        let len = name_buf
            .iter()
            .position(|c| *c == 0)
            .unwrap_or(name_buf.len());
        let name = String::from_utf16_lossy(&name_buf[..len]);
        outputs.push(NativeMidiOutput { id, name });
    }

    outputs
}

#[tauri::command]
pub fn native_midi_select_output(
    state: tauri::State<'_, NativeMidiState>,
    id: Option<u32>,
) -> Result<(), String> {
    let mut selected = state
        .output
        .lock()
        .map_err(|_| "native MIDI state is poisoned".to_string())?;

    if let Some(output) = selected.take() {
        close_output(output);
    }

    let Some(id) = id else {
        return Ok(());
    };

    let mut handle: HMIDIOUT = std::ptr::null_mut();
    let code = unsafe { midiOutOpen(&mut handle, id, 0, 0, CALLBACK_NULL) };
    result(code, "midiOutOpen")?;
    *selected = Some(NativeMidiOutputHandle {
        handle: handle as usize,
    });
    Ok(())
}

#[tauri::command]
pub fn native_midi_send_short(
    state: tauri::State<'_, NativeMidiState>,
    status: u8,
    data1: u8,
    data2: u8,
) -> Result<(), String> {
    let selected = state
        .output
        .lock()
        .map_err(|_| "native MIDI state is poisoned".to_string())?;
    let Some(output) = selected.as_ref() else {
        return Ok(());
    };

    let message = status as u32 | ((data1 as u32) << 8) | ((data2 as u32) << 16);
    let code = unsafe { midiOutShortMsg(output.handle as HMIDIOUT, message) };
    result(code, "midiOutShortMsg")
}
