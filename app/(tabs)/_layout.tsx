import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { 
  getResponsivePadding, 
  getResponsiveFontSize,
  getResponsiveWidth,
  isSmallScreen,
  SCREEN_DIMENSIONS 
} from '../../utils/responsive';

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
          bottom: isSmallScreen ? 10 : 20,
          left: isSmallScreen ? 8 : 16,
          right: isSmallScreen ? 8 : 16,
          elevation: 5,
          backgroundColor: Colors.background,
          borderRadius: 14,
          height: isSmallScreen ? 56 : 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          borderWidth: 1,
          borderColor: Colors.border,
          paddingHorizontal: isSmallScreen ? 2 : 4,
          paddingBottom: 4,
          paddingTop: 4,
        },
        // Cores dos ícones e texto
        tabBarActiveTintColor: Colors.headerBlue,
        tabBarInactiveTintColor: Colors.icon,
        tabBarLabelStyle: {
          fontSize: getResponsiveFontSize(isSmallScreen ? 9 : 10),
          fontWeight: '600',
          marginBottom: 2,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
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
            <Ionicons name="home-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="psicologos"
        options={{
          href: role === 'psicologo' ? null : undefined,
          title: 'Psicólogos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="emergencias"
        options={{
          href: role === 'psicologo' ? null : undefined,
          title: 'Emergências',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="avaliacoes"
        options={{
          href: role === 'psicologo' ? null : undefined,
          title: 'Avaliações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="home-psicologo"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Painel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Pacientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-circle-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="solicitacoes-psicologo"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Solicitações',
          tabBarLabel: 'Solicit.',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail-unread-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="acompanhamentos-psicologo"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Acompanhamentos',
          tabBarLabel: 'Acompanh.',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="notas-sessoes"
        options={{
          href: role !== 'psicologo' ? null : undefined,
          title: 'Notas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="agendamentos"
        options={{
          title: 'Agendamentos',
          tabBarLabel: 'Agendam.',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size ? size - 2 : 20} />
          ),
        }}
      />
    </Tabs>
  );
}