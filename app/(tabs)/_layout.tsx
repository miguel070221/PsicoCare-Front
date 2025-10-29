import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const role = user?.role;
  if (isLoading || !role) {
    // Evita piscar itens indevidos antes do contexto carregar
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
      {role !== 'psicologo' && (
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
      )}

      {role !== 'psicologo' && (
        <Tabs.Screen
          name="psicologos"
          options={{
            title: 'Psicólogos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" color={color} size={size} />
            ),
          }}
        />
      )}

      {role === 'psicologo' && (
        <Tabs.Screen
          name="home-psicologo"
          options={{
            title: 'Painel',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase-outline" color={color} size={size} />
            ),
          }}
        />
      )}

      {role === 'psicologo' && (
        <Tabs.Screen
          name="solicitacoes-psicologo"
          options={{
            title: 'Solicitações',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="mail-unread-outline" color={color} size={size} />
            ),
          }}
        />
      )}

      {role !== 'psicologo' && (
        <Tabs.Screen
          name="emergencias"
          options={{
            title: 'Emergências',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning-outline" color={color} size={size} />
            ),
          }}
        />
      )}

      {role !== 'psicologo' && (
        <Tabs.Screen
          name="avaliacoes"
          options={{
            title: 'Avaliações',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="star-outline" color={color} size={size} />
            ),
          }}
        />
      )}

      {(
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" color={color} size={size} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}