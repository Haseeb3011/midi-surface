/*
  Tauri shell entry. Keeps the Rust side minimal — the React app drives
  everything via Web MIDI in the WebView. The shell plugin is wired so the
  React onboarding can launch the loopMIDI installer with a single click.
*/

mod native_midi;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(native_midi::NativeMidiState::default())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            native_midi::native_midi_outputs,
            native_midi::native_midi_select_output,
            native_midi::native_midi_send_short,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
