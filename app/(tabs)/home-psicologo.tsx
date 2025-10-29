import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { toggleDisponibilidade, listarAtendimentosDoPsicologo } from '../../lib/api';

export default function HomePsicologoTab() {
  const { user, token } = useAuth();
  const [disponivel, setDisponivel] = useState<boolean>(false);
  const [atendimentos, setAtendimentos] = useState<any[]>([]);

  useEffect(() => {
    // fallback visual; o real vem do backend em futuras melhorias
    setDisponivel(true);
  }, []);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const data = await listarAtendimentosDoPsicologo(token);
        setAtendimentos(data || []);
      } catch {
        setAtendimentos([]);
      }
    })();
  }, [token]);

  const handleToggle = async (value: boolean) => {
    setDisponivel(value);
    if (!token) return;
    try {
      await toggleDisponibilidade(value, token);
    } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Painel do Psicólogo</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Disponível</Text>
        <Switch value={disponivel} onValueChange={handleToggle} />
      </View>
      <Text style={[styles.title, { marginTop: 16 }]}>Pacientes vinculados</Text>
      {atendimentos.length === 0 ? (
        <Text style={styles.note}>Nenhum atendimento ativo.</Text>
      ) : (
        atendimentos.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardName}>{a.paciente_nome || `Paciente #${a.id_paciente}`}</Text>
            <Text style={styles.cardMeta}>Desde: {new Date(a.data_inicio).toLocaleDateString('pt-BR')}</Text>
            {a.link_consulta ? (
              <Text style={styles.cardMeta}>Link: {a.link_consulta}</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  label: { color: Colors.text },
  note: { color: Colors.textSecondary, marginTop: 12 },
  card: { backgroundColor: Colors.card, padding: 12, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: Colors.border },
  cardName: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  cardMeta: { color: Colors.textSecondary, marginTop: 4 },
});


