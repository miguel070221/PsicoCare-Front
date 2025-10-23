// Localização: (app)/_layout.tsx

import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext'; // 1. Importar o Provider

export default function RootLayout() {
  return (
    // 2. Envolver a aplicação com o AuthProvider
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Criar Conta' }} />
      </Stack>
    </AuthProvider>
  );
}