import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentosUsuario, getAcompanhamentosPaciente } from '../../lib/api';

export default function PacienteDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pacienteId = Number(id);
  const { token } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!token || !pacienteId) return;
      try {
        const ags = await getAgendamentosUsuario(pacienteId, token);
        setAgendamentos(ags || []);
      } catch { setAgendamentos([]); }
      try {
        const acs = await getAcompanhamentosPaciente(pacienteId, token);
        setAcompanhamentos((acs || []).map((a: any) => ({ ...a, dataHora: a.data_hora ? new Date(a.data_hora).toLocaleString('pt-BR') : '' })));
      } catch { setAcompanhamentos([]); }
    })();
  }, [token, pacienteId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Histórico do Paciente</Text>

      <Text style={styles.sectionTitle}>Consultas</Text>
      {agendamentos.length === 0 ? (
        <Text style={styles.note}>Nenhuma consulta encontrada.</Text>
      ) : agendamentos.map((a, idx) => (
        <View key={a.id || idx} style={styles.card}>
          <Text style={styles.cardName}>{a.data} {a.horario}</Text>
          <Text style={styles.cardMeta}>Status: {a.status || '-'}</Text>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Autoavaliações</Text>
      {acompanhamentos.length === 0 ? (
        <Text style={styles.note}>Nenhum registro.</Text>
      ) : acompanhamentos.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.cardName}>{a.dataHora}</Text>
          <Text style={styles.cardMeta}>Sono: {a.qualidade_sono || '-'}</Text>
          <Text style={{ color: Colors.text, marginTop: 4 }}>Humor: {a.humor || '-'}</Text>
          <Text style={{ color: Colors.text }}>{a.texto}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 4, marginBottom: 8 },
  note: { color: Colors.textSecondary },
  card: { backgroundColor: Colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cardName: { color: Colors.text, fontWeight: '700' },
  cardMeta: { color: Colors.textSecondary, marginTop: 2 },
});










