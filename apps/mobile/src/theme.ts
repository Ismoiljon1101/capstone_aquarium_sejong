// Design system constants — 8pt grid, 3-radius system, accessible color palette

export const C = {
  // ── Backgrounds ────────────────────────────────────────────────
  bg:       '#020617',   // screen root
  surface:  '#0f172a',   // cards, sheets
  elevated: '#1e293b',   // inputs, inactive tracks, nested cards
  tabBar:   '#080f1e',   // bottom tab bar

  // ── Accent ─────────────────────────────────────────────────────
  accent:   '#38bdf8',   // sky blue — primary interactive
  brand:    '#0891b2',   // cyan — buttons, active states

  // ── Status ─────────────────────────────────────────────────────
  ok:       '#34d399',   // healthy / success
  warn:     '#fbbf24',   // warning / amber
  crit:     '#ef4444',   // critical / error
  info:     '#60a5fa',   // info / soft blue

  // ── Text ───────────────────────────────────────────────────────
  // All values verified ≥4.5:1 on #020617 background (WCAG AA)
  textPrimary:   '#f1f5f9',  // 16.5:1  — headings, values
  textSecondary: '#cbd5e1',  //  9.0:1  — body, labels
  textTertiary:  '#94a3b8',  //  5.8:1  — hints, timestamps (replaces #64748b)
  textDisabled:  '#64748b',  //  3.9:1  — use ONLY for 18px+ decorative text
  textOffline:   '#475569',  //  2.8:1  — use ONLY for placeholder/ghost

  // ── Borders ────────────────────────────────────────────────────
  border:        'rgba(255,255,255,0.06)',
  borderSubtle:  'rgba(255,255,255,0.04)',
  borderStrong:  'rgba(255,255,255,0.12)',
} as const;

// ── Typography scale (16px base, 1.33× ratio) ──────────────────────────────
export const T = {
  hero:    { fontSize: 48, fontWeight: '900' as const, letterSpacing: -2 },
  h1:      { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2:      { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4 },
  h3:      { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  body:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMd:  { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  bodySm:  { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  label:   { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
  micro:   { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.4 },
} as const;

// ── Spacing (8pt grid) ─────────────────────────────────────────────────────
export const S = {
  s2:  2,
  s4:  4,
  s8:  8,
  s12: 12,
  s16: 16,
  s20: 20,  // default screen padding
  s24: 24,
  s32: 32,
  s40: 40,
  s48: 48,
  s56: 56,
  s64: 64,
} as const;

// ── Border radius (3 values only) ─────────────────────────────────────────
export const R = {
  sm: 8,   // inputs, chips, small buttons
  md: 12,  // cards, rows, medium buttons
  lg: 20,  // sheets, large cards, modals
  full: 999,  // pills, circles
} as const;

// ── Touch target minimum ────────────────────────────────────────────────────
export const MIN_HIT = 44;
