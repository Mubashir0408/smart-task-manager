/**
 * TaskFlow Mobile — React Native (TypeScript) client for the existing
 * TaskFlow Supabase backend. Same Auth users, same `tasks` table, same
 * RLS policies as the Next.js web app, Tauri desktop app, and Chrome
 * extension — this is just a fourth client, no separate backend.
 *
 * @format
 */

import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { LoginScreen } from './src/screens/LoginScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { colors } from './src/theme';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AuthProvider>
        <RootScreen />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootScreen() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accentCyan} />
      </View>
    );
  }

  return session ? <TasksScreen /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default App;
