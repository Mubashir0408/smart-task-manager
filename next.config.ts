import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Tauri desktop app's production build (`tauri.conf.json`'s
  // beforeBuildCommand) runs `next build` into this same project. Left
  // pointed at the default `.next`, that build (and the server the
  // desktop app later launches from it) would read/write the exact same
  // directory `npm run dev` uses for the web app — if both are ever
  // active around the same time, one rewrites files out from under the
  // other, breaking CSS/JS chunk references (this is what happened).
  // Routing the Tauri-triggered build to a separate directory makes the
  // two completely independent. TAURI_BUILD is set only by
  // `beforeBuildCommand` and the desktop app's spawned server (see
  // src-tauri/tauri.conf.json and src-tauri/src/lib.rs) — `npm run dev`,
  // `npm run build`, and `npm run start` run by hand are unaffected and
  // keep using `.next` exactly as before.
  distDir: process.env.TAURI_BUILD ? ".next-tauri" : ".next",
};

export default nextConfig;
