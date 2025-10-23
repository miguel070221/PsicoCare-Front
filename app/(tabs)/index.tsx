  // Removido bloco duplicado fora do objeto styles
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentosUsuario, getAcompanhamentos } from '../../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const verify = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/login');
        }
      };
      verify();
    }, [router])
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !token) return;
      setLoading(true);
      try {
        const ags = await getAgendamentosUsuario(user.id, token);
        setAgendamentos(ags);
        const acs = await getAcompanhamentos(token);
        setAcompanhamentos(acs);
      } catch (e) {
        setAgendamentos([]);
        setAcompanhamentos([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, token]);

  const hoje = new Date();
  const dataHoje = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const proximoAgendamento = agendamentos.find((a) => new Date(a.data) >= hoje);
  const ultimoAcompanhamento = acompanhamentos[0];

  // Nome do psicólogo no próximo agendamento
  const nomePsicologo = proximoAgendamento?.psicologo_nome || proximoAgendamento?.profissional_nome || '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Início</Text>
      </View>
      <Text style={styles.hello}>Painel do Paciente</Text>
      <Text style={styles.data}>Data: {dataHoje}</Text>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Próximo agendamento</Text>
          <Text style={styles.cardValue}>
            {proximoAgendamento
              ? `${proximoAgendamento.data} ${proximoAgendamento.horario || ''}`
              : 'Nenhum'}
          </Text>
          {proximoAgendamento && nomePsicologo ? (
            <Text style={styles.cardSubtitle}>Psicólogo: {nomePsicologo}</Text>
          ) : null}
    </View>
  // ...existing code...
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Último acompanhamento</Text>
          <Text style={styles.cardValue}>
            {ultimoAcompanhamento ? new Date(ultimoAcompanhamento.data_hora).toLocaleDateString('pt-BR') : 'Nenhum'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.tint }]} onPress={() => router.push('/agendamentos')}>
          <Text style={[styles.actionText, { color: Colors.card }]}>Agendamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.cardAlt }]} onPress={() => router.push('/agendamentos')}>
          <Text style={[styles.actionText, { color: Colors.text }]}>Acompanhamento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.destructive }]} onPress={() => router.push('/emergencias')}>
          <Text style={[styles.actionText, { color: Colors.card }]}>Emergência</Text>
        </TouchableOpacity>
      </View>

      {/* Espaço reservado para relatórios e notas clínicas futuras */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  hello: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
    textAlign: 'left',
  },
  data: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 18,
    textAlign: 'left',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minHeight: 70,
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  cardTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  actionText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
  header: {
    backgroundColor: Colors.headerBlue,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 18,
  },
  headerTitle: {
    color: Colors.card,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
  },
});
