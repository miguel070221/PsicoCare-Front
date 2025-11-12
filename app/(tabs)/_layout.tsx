import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role;

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  if (!role) {
    return null;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        // Estilo flutuante com fundo branco e borda em azul pastel
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          elevation: 5,
          backgroundColor: Colors.background,
          borderRadius: 14,
          height: 62,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        // Cores dos ícones e texto
        tabBarActiveTintColor: Colors.headerBlue,
        tabBarInactiveTintColor: Colors.icon,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      {/* Declarar todas as telas uma vez e esconder via href:null */}
      <Tabs.Screen
        name="index"
        options={{
          href: role === 'psicologo' ? null : undefined,
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="psicologos"
        options={{
          href: role === 'psicologo' ? null : undefined,
          title: 'Psicólogos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="emergencias"
        options={{
          href: role === 'psicologo' ? null : undefined,
          title: 'Emergências',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="avaliacoes"
        options={{
          href: role === 'psicologo' ? null : undefined,
          title: 'Avaliações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="home-psicologo"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Painel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Pacientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="solicitacoes-psicologo"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Solicitações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail-unread-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="acompanhamentos-psicologo"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Acompanhamentos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notas-sessoes"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Notas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="relatorios-estatisticas"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Relatórios',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="agendamentos"
        options={{
          title: 'Agendamentos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}