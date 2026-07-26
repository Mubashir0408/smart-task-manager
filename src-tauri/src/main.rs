// Prevents an extra console window from appearing on Windows in release
// builds. Part of Tauri's standard scaffold — do not remove.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    taskflow_desktop_lib::run();
}
