import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Funções administrativas fictícias
  const handleGerenciarUsuarios = () => {
    // Navegar ou abrir modal de gerenciamento de usuários
  };
  const handleGerenciarProfissionais = () => {
    // Navegar ou abrir modal de gerenciamento de profissionais
  };
  const handleVerAgendamentos = () => {
    // Navegar ou abrir modal de agendamentos
  };
  const handleVerAcompanhamentos = () => {
    // Navegar ou abrir modal de acompanhamentos
  };
  const handleVerAvaliacoes = () => {
    // Navegar ou abrir modal de avaliações
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Painel do Administrador</Text>
      <Text style={styles.subheader}>Bem-vindo, {user?.nome || 'Administrador'}!</Text>
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
      </View>
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
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.headerBlue,
    marginBottom: 12,
    marginTop: 16,
  },
  subheader: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 24,
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
});
