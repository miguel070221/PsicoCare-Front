
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { toggleDisponibilidade, getPsicologoMe } from '../../lib/api';
import AppHeader from '../../components/AppHeader';

export default function Perfil() {
  const router = useRouter();
  const { user, signOut, token } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [profissional, setProfissional] = useState<any | null>(null);
  const [loadingProf, setLoadingProf] = useState(false);

  // Hook deve ficar sempre antes de qualquer return condicional
  useEffect(() => {
    (async () => {
      if (user?.role === 'psicologo') {
        setLoadingProf(true);
        try {
          if (token) {
            const me = await getPsicologoMe(token);
            setProfissional(me);
          } else {
            setProfissional({ id: user.id, disponivel: false });
          }
        } catch {
          setProfissional({ id: user.id, disponivel: false });
        } finally {
          setLoadingProf(false);
        }
      } else {
        setProfissional(null);
      }
    })();
  }, [user]);

  const handleLogout = async () => {
    setModalVisible(false);
    await signOut();
    router.replace('/login');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 100);
  };

  const isLoadingUser = !user;

  return (
    <ScrollView style={styles.container}>
      <AppHeader title="Perfil" subtitle="Gerencie suas informações" />
      <View style={styles.headerContainer}>
        <Ionicons name="person-circle" size={80} color={Colors.tint} />
        <Text style={styles.userName}>{(user?.role === 'psicologo' ? profissional?.nome : user?.nome) || 'Usuário'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.listItem} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="person-outline" size={24} color={Colors.tint} />
          <Text style={styles.listItemText}>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem} onPress={() => setModalVisible(true)}>
          <Ionicons name="log-out-outline" size={24} color={Colors.destructive} />
          <Text style={[styles.listItemText, { color: Colors.destructive }]}>Sair</Text>
        </TouchableOpacity>
        {user?.role === 'psicologo' && profissional && (
            <TouchableOpacity style={styles.listItem} onPress={async () => {
            // toggle
            const novo = profissional.disponivel ? 0 : 1;
            try {
                // precisa de token; usamos contexto
                if (!token) return;
                await toggleDisponibilidade(novo === 1, token as string);
              setProfissional({ ...profissional, disponivel: novo });
            } catch (e) {
              // ignore
            }
          }}>
            <Ionicons name={profissional.disponivel ? 'checkmark-circle' : 'close-circle'} size={24} color={Colors.tint} />
            <Text style={styles.listItemText}>{profissional.disponivel ? 'Estou disponível' : 'Não apareço na lista'}</Text>
          </TouchableOpacity>
        )}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(11,42,74,0.6)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 20, width: 320, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: Colors.text }}>Terminar Sessão</Text>
              <Text style={{ fontSize: 15, color: Colors.textSecondary, marginBottom: 20, textAlign: 'center' }}>
                Deseja realmente encerrar sua sessão?
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 12, borderRadius: 8, backgroundColor: Colors.cardAlt, marginRight: 8, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ color: Colors.text }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={{ padding: 12, borderRadius: 8, backgroundColor: Colors.tint }}>
                  <Text style={{ color: Colors.card, fontWeight: '600' }}>Sair</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: Colors.card,
    paddingVertical: isSmallScreen ? 20 : 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userName: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
  },
  userEmail: {
    fontSize: isSmallScreen ? 14 : 16,
    color: Colors.icon,
    marginTop: 5,
  },
  menuContainer: {
    marginTop: isSmallScreen ? 20 : 30,
  },
  listItem: {
    backgroundColor: Colors.card,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 12 : 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: isSmallScreen ? 14 : 16,
    color: Colors.text,
  },
});