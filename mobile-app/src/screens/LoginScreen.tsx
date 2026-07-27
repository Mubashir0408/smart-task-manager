import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors, glassPanel, radius, spacing } from "../theme";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = (toValue: number) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : signInError.message
      );
    }
    // On success, the root navigator switches screens automatically via
    // useAuth()'s onAuthStateChange subscription — no manual navigation.
  };

  return (
    <View style={styles.screen}>
      {/* Soft accent glows standing in for a blurred hero background — see
          theme.ts for why this isn't a real blur/gradient. */}
      <View style={[styles.glow, styles.glowBlue]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowCyan]} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoGlyph}>✓</Text>
          </View>
          <Text style={styles.title}>TaskFlow</Text>
        </View>
        <Text style={styles.subtitle}>Log in to manage your tasks</Text>

        <View style={styles.card}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!isSubmitting}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            editable={!isSubmitting}
          />

          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
              onPress={handleSubmit}
              onPressIn={() => animatePress(0.97)}
              onPressOut={() => animatePress(1)}
              disabled={isSubmitting}
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#04121a" />
              ) : (
                <Text style={styles.buttonText}>Log in</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.22,
  },
  glowBlue: {
    backgroundColor: colors.accent,
    top: -60,
    left: -60,
  },
  glowCyan: {
    backgroundColor: colors.accentCyan,
    bottom: -60,
    right: -60,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accentCyan,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoGlyph: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  card: {
    ...glassPanel,
    padding: spacing.xl,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderColor: "rgba(251,113,133,0.3)",
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: "#fecdd3",
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: spacing.xs,
    shadowColor: colors.accentCyan,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#04121a",
    fontWeight: "700",
    fontSize: 15,
  },
});
