use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
async fn save_file_to_disk(
    app: tauri::AppHandle,
    data: Vec<u8>,
    filename: String,
) -> Result<String, String> {
    let file_path = app
        .dialog()
        .file()
        .set_file_name(&filename)
        .add_filter("PNG Image", &["png"])
        .blocking_save_file();

    match file_path {
        Some(path) => {
            std::fs::write(path.to_path(), data).map_err(|e| e.to_string())?;
            Ok(path.to_string())
        }
        None => Err("User cancelled file save".to_string()),
    }
}

#[tauri::command]
async fn show_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn copy_image_to_clipboard(
    app: tauri::AppHandle,
    data: Vec<u8>,
) -> Result<(), String> {
    // Write raw bytes to clipboard as fallback (text representation)
    let base64_data = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &data);
    app.clipboard()
        .write_text(&base64_data)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    log::info!("Starting Creative Drawing Board application");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            save_file_to_disk,
            show_notification,
            copy_image_to_clipboard,
        ])
        .setup(|app| {
            log::info!("Application setup complete");
            let _ = app.get_webview_window("main");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}