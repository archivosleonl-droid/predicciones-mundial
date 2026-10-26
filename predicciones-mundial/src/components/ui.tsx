import { Link } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../utils/theme";
import type { Prediction } from "../utils/predictions";

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.primaryButton, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function TeamChips({ teams }: { teams: string[] }) {
  return (
    <View style={styles.teamGrid}>
      {teams.map((team) => (
        <Text key={team} style={styles.teamChip}>
          {team}
        </Text>
      ))}
    </View>
  );
}

export function PredictionCard({
  prediction,
  roundLabel,
}: {
  prediction: Prediction;
  roundLabel: string;
}) {
  return (
    <View style={styles.matchCard}>
      <Text style={styles.roundLabel}>{roundLabel}</Text>

      <Text style={styles.matchTeams}>
        {prediction.homeTeam} vs {prediction.awayTeam}
      </Text>

      <View style={styles.probabilityRow}>
        <ProbabilityBar
          label={prediction.homeTeam}
          value={prediction.homeWinProbability}
          color={colors.primary}
        />

        <ProbabilityBar
          label="Empate"
          value={prediction.drawProbability}
          color={colors.warning}
        />

        <ProbabilityBar
          label={prediction.awayTeam}
          value={prediction.awayWinProbability}
          color={colors.accent}
        />
      </View>

      <Text style={styles.winner}>
        Ganador previsto: {prediction.predictedWinner}
      </Text>
    </View>
  );
}

function ProbabilityBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.probabilityItem}>
      <Text style={styles.probabilityLabel} numberOfLines={1}>
        {label}
      </Text>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: `${Math.round(value * 100)}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.probabilityValue}>
        {(value * 100).toFixed(1)}%
      </Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function ScreenLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link href={href} style={styles.link}>
      {label}
    </Link>
  );
}

export function EmptyState({
  message,
  linkHref,
  linkLabel,
}: {
  message: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>

      {linkHref && linkLabel && (
        <ScreenLink href={linkHref} label={linkLabel} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  teamChip: {
    backgroundColor: "#14532D",
    color: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    fontSize: 12,
    fontWeight: "600",
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  roundLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  matchTeams: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  probabilityRow: {
    gap: spacing.sm,
  },
  probabilityItem: {
    marginBottom: spacing.sm,
  },
  probabilityLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  track: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  probabilityValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  winner: {
    color: colors.primary,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.section,
    marginBottom: spacing.md,
  },
  link: {
    color: colors.accent,
    textAlign: "center",
    marginTop: spacing.md,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});