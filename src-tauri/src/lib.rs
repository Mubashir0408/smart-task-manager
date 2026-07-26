// TaskFlow desktop — Tauri v2 entry point.
//
// This app defines zero custom Tauri commands and does no JS<->Rust IPC:
// the entire UI is the existing Next.js frontend, loaded directly into the
// window from a URL — never bundled/embedded into the app itself.
//
//   - `tauri dev`   -> `build.beforeDevCommand` (`npm run dev`) starts the
//                      existing Next.js dev server, and the Tauri CLI waits
//                      for `build.devUrl` (http://localhost:3000) before
//                      opening the window. Nothing below runs in this mode.
//   - `tauri build` -> the built app's window loads `app.windows[0].url`
//                      (also http://localhost:3000), so something needs to
//                      be listening there. `setup()` below spawns the
//                      existing `npm run start` script against the project
//                      directory (path resolved at COMPILE time via
//                      Cargo's `CARGO_MANIFEST_DIR`, not guessed at
//                      runtime), and `on_window_event` below kills that
//                      whole process tree when the window closes — without
//                      this, the server would keep running in the
//                      background indefinitely, still holding port 3000
//                      and the project's `.next` build output, and collide
//                      with a later `npm run dev` session for the web app.
//
// Everything else (auth, task CRUD, Realtime, canvas annotation, signature
// pad) is unmodified web-platform behavior already handled by the existing
// frontend running inside Tauri's webview — none of it needs Rust code.

#[cfg(not(debug_assertions))]
struct ServerHandle(std::sync::Mutex<Option<std::process::Child>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // `Manager` provides both `app.state::<T>()` (used in `setup` below) and
    // `window.app_handle()` (used in `on_window_event` below) — it must be
    // in scope here, in the block containing both closures, not just inside
    // one of them.
    #[cfg(not(debug_assertions))]
    use tauri::Manager;

    #[cfg(not(debug_assertions))]
    let builder = builder
        .manage(ServerHandle(std::sync::Mutex::new(None)))
        .setup(|app| {
            if let Some(child) = start_production_server() {
                *app.state::<ServerHandle>().0.lock().unwrap() = Some(child);
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                stop_production_server(window.app_handle());
            }
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Runs `npm run start` (the project's existing, unmodified script — just
/// `next start` against the build `beforeBuildCommand` already produced)
/// against the project root. Requires Node.js/npm on this machine; this
/// does not bundle a Node runtime.
#[cfg(not(debug_assertions))]
fn start_production_server() -> Option<std::process::Child> {
    use std::path::Path;
    use std::process::Command;
    use std::time::Duration;

    let project_root = Path::new(env!("CARGO_MANIFEST_DIR")).join("..");

    // TAURI_BUILD=1 must match what `beforeBuildCommand` set when it ran
    // `next build` (see tauri.conf.json and next.config.ts's `distDir`) —
    // it's what tells this `next start` to read `.next-tauri` instead of
    // `.next`, the same isolated directory that was actually built, and
    // keeps it from ever touching the `.next` the web app's `npm run dev`
    // uses.
    //
    // `npm` is a `.cmd` shim on Windows, which `Command::new("npm")` cannot
    // execute directly — it must be run through the shell.
    #[cfg(target_os = "windows")]
    let spawn_result = Command::new("cmd")
        .args(["/C", "npm run start"])
        .current_dir(&project_root)
        .env("PORT", "3000")
        .env("TAURI_BUILD", "1")
        .spawn();

    #[cfg(not(target_os = "windows"))]
    let spawn_result = Command::new("npm")
        .args(["run", "start"])
        .current_dir(&project_root)
        .env("PORT", "3000")
        .env("TAURI_BUILD", "1")
        .spawn();

    match spawn_result {
        Ok(child) => {
            println!(
                "[TaskFlow] Launched `npm run start` (pid {}) in {}",
                child.id(),
                project_root.display()
            );
            // `next start` typically takes a second or two to bind its
            // port. This is a simple fixed head start, not a readiness
            // check — if the window still shows a connection error on a
            // slower machine, its built-in Refresh button will work once
            // the server finishes starting.
            std::thread::sleep(Duration::from_millis(1500));
            Some(child)
        }
        Err(err) => {
            eprintln!(
                "[TaskFlow] Failed to launch `npm run start` in {} — is Node.js/npm installed and on PATH? ({err})",
                project_root.display()
            );
            None
        }
    }
}

/// Terminates the server process tree started by `start_production_server`,
/// if any. Called when the window is closing, so the app never leaves a
/// server running in the background after it quits.
#[cfg(not(debug_assertions))]
fn stop_production_server(app: &tauri::AppHandle) {
    use tauri::Manager;

    let state = app.state::<ServerHandle>();
    let mut guard = state.0.lock().unwrap();
    let Some(child) = guard.take() else { return };
    let pid = child.id();
    println!("[TaskFlow] Stopping server (pid {pid}) and its child processes...");

    // `Child::kill()` alone only terminates the direct child (`cmd.exe` on
    // Windows, which itself launched npm -> node -> the actual Next.js
    // server) — it does NOT kill that whole tree, which is why Windows
    // uses `taskkill /T` (tree-kill) instead.
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .output();
    }
    #[cfg(not(target_os = "windows"))]
    {
        let mut child = child;
        let _ = child.kill();
    }
}
