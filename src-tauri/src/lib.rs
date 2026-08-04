mod commands;
mod utils;

use tauri_plugin_log::{log::LevelFilter, Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(LevelFilter::Trace)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("dex".into()),
                    }),
                ])
                .build(),
        )
        // Exactly one invoke_handler — append commands to the single
        // generate_handler!, never add a second call (ADR-0002).
        .invoke_handler(tauri::generate_handler![commands::core::greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
