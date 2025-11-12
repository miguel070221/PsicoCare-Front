import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { useAuth } from './contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';

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
  const handleGerenciarProfissionais = () => {
    router.push('/admin-usuarios');
  };
  const handleVerAgendamentos = () => {
    router.push('/admin-agendamentos');
  };
  const handleVerAcompanhamentos = () => {
    // Navegar ou abrir modal de acompanhamentos
  };
  const handleVerAvaliacoes = () => {
    // Navegar ou abrir modal de avaliações
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
        <TouchableOpacity style={styles.button} onPress={handleGerenciarProfissionais}>
          <Text style={styles.buttonText}>Gerenciar Psicólogos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleVerAgendamentos}>
          <Text style={styles.buttonText}>Ver Agendamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleVerAcompanhamentos}>
          <Text style={styles.buttonText}>Ver Acompanhamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleVerAvaliacoes}>
          <Text style={styles.buttonText}>Ver Avaliações</Text>
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
    padding: 24,
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  logoutButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.destructive,
  },
  logoutButtonText: {
    color: Colors.destructive,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: Colors.tint,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 18,
    width: '90%',
    alignItems: 'center',
    shadowColor: Colors.tint,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonText: {
    color: Colors.card,
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoutButtonLarge: {
    backgroundColor: Colors.destructive,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: Colors.text,
  },
  modalMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.destructive,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
});
