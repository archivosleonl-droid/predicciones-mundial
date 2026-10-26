export const colors = {
  background: "#0B1120",
  surface: "#111827",
  surfaceAlt: "#1E293B",
  border: "#243044",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  primary: "#22C55E",
  primaryDark: "#052E16",
  accent: "#38BDF8",
  danger: "#F87171",
  warning: "#FBBF24",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800" as const,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700" as const,
  },
};