/**
 * TaskFlow Mobile — shared design tokens.
 *
 * Mirrors the web app's dark "Liquid Glass" theme (same dark navy base,
 * blue -> cyan accent, same semantic status/priority colors), adapted for
 * React Native's constraints: there is no native `backdrop-filter` here
 * without adding a native blur module (`@react-native-community/blur` or
 * similar), which would require another full native rebuild — given how
 * much effort went into stabilizing that build, "glass" is approximated
 * with layered translucent surfaces + borders instead of a real blur.
 * Likewise, RN has no CSS gradients without a native SVG/gradient module,
 * so accents use solid colors plus a colored shadow/glow rather than a
 * literal gradient fill.
 */

export const colors = {
  background: "#05070f",
  backgroundElevated: "#0b1220",

  glass: "rgba(255,255,255,0.06)",
  glassStrong: "rgba(255,255,255,0.1)",
  glassBorder: "rgba(255,255,255,0.12)",
  glassBorderStrong: "rgba(255,255,255,0.2)",

  accent: "#3b82f6", // blue-500
  accentCyan: "#22d3ee", // cyan-400

  textPrimary: "#f1f5ff",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",

  danger: "#fb7185",
  dangerBg: "rgba(244,63,94,0.15)",
  success: "#34d399",
  successBg: "rgba(16,185,129,0.15)",

  status: {
    todo: { fg: "#cbd5f5", bg: "rgba(148,163,184,0.18)" },
    in_progress: { fg: "#fcd34d", bg: "rgba(251,191,36,0.16)" },
    completed: { fg: "#6ee7b7", bg: "rgba(52,211,153,0.16)" },
  },
  priority: {
    low: { fg: "#7dd3fc", bg: "rgba(56,189,248,0.15)", accent: "#38bdf8" },
    medium: { fg: "#c4b5fd", bg: "rgba(167,139,250,0.15)", accent: "#a78bfa" },
    high: { fg: "#fda4af", bg: "rgba(251,113,133,0.15)", accent: "#fb7185" },
  },
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

/** Common "glass panel" surface — spread into a component's style array. */
export const glassPanel = {
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: radius.lg,
  shadowColor: "#000",
  shadowOpacity: 0.35,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
} as const;

/** Accent (blue->cyan-ish) call-to-action surface — solid fill + glow. */
export const accentSurface = {
  backgroundColor: colors.accent,
  shadowColor: colors.accentCyan,
  shadowOpacity: 0.45,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 8,
} as const;
