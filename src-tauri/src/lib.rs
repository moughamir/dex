mod commands;
mod database;
pub mod providers;
mod utils;

use tauri::Manager;
use tauri_plugin_log::{log::LevelFilter, Target, TargetKind};

async fn setup_backend(app: tauri::AppHandle) {
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    if let Some(state) = app.try_state::<std::sync::Mutex<commands::core::SetupState>>() {
        let _ = commands::core::set_complete(
            app.clone(),
            state,
            commands::core::SetCompleteArgs {
                task: "backend".into(),
            },
        )
        .await;
    }
}

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
        .manage(std::sync::Mutex::new(commands::core::SetupState {
            frontend_task: false,
            backend_task: false,
        }))
        .setup(|app| {
            // Initialize the local SQLite store (M0.6): open/create the
            // database and apply pending migrations. The runner is
            // idempotent, so a repeated call or restart is a no-op.
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            database::init(&app_data_dir.join("dex.db"))?;

            tauri::async_runtime::spawn(setup_backend(app.handle().clone()));
            Ok(())
        })
        // Exactly one invoke_handler — append commands to the single
        // generate_handler!, never add a second call (ADR-0002).
        .invoke_handler(tauri::generate_handler![
            commands::core::greet,
            commands::core::set_complete
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
