mod commands;
mod database;
pub mod providers;
mod utils;

use tauri::Manager;
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
        .setup(|app| {
            // Initialize the local SQLite store (M0.6): open/create the
            // database and apply pending migrations. The runner is
            // idempotent, so a repeated call or restart is a no-op.
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            database::init(&app_data_dir.join("dex.db"))?;
            Ok(())
        })
        // Exactly one invoke_handler — append commands to the single
        // generate_handler!, never add a second call (ADR-0002).
        .invoke_handler(tauri::generate_handler![commands::core::greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
