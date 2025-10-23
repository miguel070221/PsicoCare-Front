import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from './contexts/AuthContext';
import { getAgendamentosUsuario, listarProfissionais } from '../lib/api';

export default function HomePsicologo() {
  const { user, token } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !token || !user.profissionalId) return;
      setLoading(true);
      try {
        // Buscar agendamentos do psicólogo
        const ags = await getAgendamentosUsuario(user.profissionalId, token);
        setAgendamentos(ags);
        // Buscar pacientes (simples: filtrar agendamentos por status 'aceito')
        setPacientes(ags.filter(a => a.status === 'aceito'));
      } catch (e) {
        setAgendamentos([]);
        setPacientes([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, token]);

  const proximoAgendamento = agendamentos.find((a) => new Date(a.data_hora) >= new Date());

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home Psicólogo</Text>
      </View>
      <Text style={styles.title}>Próxima consulta</Text>
      {proximoAgendamento ? (
        <View style={styles.card}>
          <Text style={styles.cardValue}>{new Date(proximoAgendamento.data_hora).toLocaleString('pt-BR')}</Text>
          <Text style={styles.cardMeta}>Paciente: {proximoAgendamento.nome_paciente || '-'}</Text>
        </View>
      ) : (
        <Text style={styles.cardMeta}>Nenhuma consulta agendada</Text>
      )}
      <Text style={[styles.title, { marginTop: 24 }]}>Pacientes aceitos</Text>
      {pacientes.length === 0 ? (
        <Text style={styles.cardMeta}>Nenhum paciente aceito</Text>
      ) : (
        pacientes.map((p, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.cardValue}>{p.nome_paciente || '-'}</Text>
            <Text style={styles.cardMeta}>{new Date(p.data_hora).toLocaleString('pt-BR')}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.headerBlue, padding: 16, borderRadius: 8, marginBottom: 18 },
  headerTitle: { color: Colors.card, fontSize: 18, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  card: { backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  cardValue: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  cardMeta: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
});
