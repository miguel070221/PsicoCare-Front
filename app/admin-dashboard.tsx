import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { useAuth } from './contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { 
  getResponsivePadding, 
  getResponsiveFontSize, 
  getResponsiveGap,
  getResponsiveWidth,
  isSmallScreen,
  isXLargeScreen 
} from '../utils/responsive';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [modalLogoutVisible, setModalLogoutVisible] = useState(false);

  const handleLogout = () => {
    console.log('🚪 [LOGOUT] Botão de logout clicado');
    setModalLogoutVisible(true);
  };

  const confirmarLogout = async () => {
    console.log('🚪 [LOGOUT] Iniciando processo de logout...');
    setModalLogoutVisible(false);
    
    try {
      // Limpar token e estado primeiro
      console.log('🚪 [LOGOUT] Chamando signOut()...');
      await signOut();
      console.log('🚪 [LOGOUT] signOut() concluído');
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Forçar navegação para login - usar múltiplas estratégias
      console.log('🚪 [LOGOUT] Navegando para /login...');
      
      // No navegador, usar window.location para garantir navegação completa
      if (typeof window !== 'undefined') {
        console.log('🚪 [LOGOUT] Usando window.location.replace (navegador)');
        // Usar replace para não deixar histórico
        window.location.replace('/login');
      } else {
        console.log('🚪 [LOGOUT] Usando router.replace (mobile)');
        // Tentar múltiplas vezes se necessário
        router.replace('/login');
        setTimeout(() => {
          router.replace('/login');
        }, 50);
      }
    } catch (error) {
      console.error('❌ [LOGOUT] Erro ao fazer logout:', error);
      // Mesmo com erro, forçar navegação
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      } else {
        router.replace('/login');
        setTimeout(() => {
          router.replace('/login');
        }, 50);
      }
    }
  };

  const handleGerenciarUsuarios = () => {
    router.push('/admin-usuarios');
  };
  const handleVerAgendamentos = () => {
    router.push('/admin-agendamentos');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerContainer}>
        <AppHeader title="Painel do Administrador" subtitle={`Bem-vindo, ${user?.nome || 'Administrador'}!`} />
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.destructive} />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.button} onPress={handleGerenciarUsuarios}>
          <Text style={styles.buttonText}>Gerenciar Usuários</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleVerAgendamentos}>
          <Text style={styles.buttonText}>Ver Agendamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.logoutButtonLarge]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.card} />
          <Text style={styles.buttonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Confirmação de Logout */}
      <Modal
        visible={modalLogoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sair</Text>
            <Text style={styles.modalMessage}>
              Tem certeza que deseja sair?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => {
                  console.log('🚪 [LOGOUT] Cancelado pelo usuário');
                  setModalLogoutVisible(false);
                }} 
                style={styles.modalButtonCancel}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmarLogout} 
                style={styles.modalButtonConfirm}
              >
                <Text style={styles.modalButtonConfirmText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: getResponsivePadding(24),
    alignItems: 'center',
    paddingBottom: isSmallScreen ? 100 : 120,
    flexGrow: 1,
  },
  headerContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: getResponsiveGap(8),
  },
  logoutButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveGap(6),
    paddingVertical: getResponsivePadding(8),
    paddingHorizontal: getResponsivePadding(12),
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.destructive,
    maxWidth: isSmallScreen ? getResponsiveWidth(35) : undefined,
  },
  logoutButtonText: {
    color: Colors.destructive,
    fontWeight: '600',
    fontSize: getResponsiveFontSize(14),
  },
  section: {
    width: '100%',
    alignItems: 'center',
    maxWidth: isXLargeScreen ? 600 : '100%',
    alignSelf: 'center',
  },
  button: {
    backgroundColor: Colors.tint,
    paddingVertical: getResponsivePadding(16),
    paddingHorizontal: getResponsivePadding(32),
    borderRadius: 12,
    marginBottom: getResponsiveGap(18),
    width: isSmallScreen ? '95%' : isXLargeScreen ? '85%' : '90%',
    alignItems: 'center',
    shadowColor: Colors.tint,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    minHeight: isSmallScreen ? 50 : 56,
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.card,
    fontWeight: 'bold',
    fontSize: getResponsiveFontSize(18),
    textAlign: 'center',
  },
  logoutButtonLarge: {
    backgroundColor: Colors.destructive,
    marginTop: getResponsiveGap(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsivePadding(16),
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: getResponsivePadding(24),
    width: isSmallScreen ? '95%' : '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: '700',
    marginBottom: getResponsiveGap(12),
    color: Colors.text,
  },
  modalMessage: {
    fontSize: getResponsiveFontSize(15),
    color: Colors.textSecondary,
    marginBottom: getResponsiveGap(24),
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: getResponsiveGap(12),
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    padding: getResponsivePadding(14),
    borderRadius: 8,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: getResponsiveFontSize(16),
  },
  modalButtonConfirm: {
    flex: 1,
    padding: getResponsivePadding(14),
    borderRadius: 8,
    backgroundColor: Colors.destructive,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  modalButtonConfirmText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: getResponsiveFontSize(16),
  },
});
