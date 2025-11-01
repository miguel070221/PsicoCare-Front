import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from './contexts/AuthContext';
import Colors from '../constants/Colors';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user) {
      // Não está autenticado, redireciona para login
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      // Está autenticado mas não está nas tabs, redireciona para tabs
      if (user.role === 'psicologo') {
        router.replace('/(tabs)/home-psicologo');
      } else if (user.role === 'admin') {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.tint} />
    </View>
  );
}

