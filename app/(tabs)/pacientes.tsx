import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { listarAtendimentosDoPsicologo } from '../../lib/api';
import { useRouter } from 'expo-router';

export default function PacientesTab() {
  const { token } = useAuth();
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const router = useRouter();

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

  const pacientes = useMemo(() => {
    const byId: Record<string, any> = {};
    for (const a of atendimentos) {
      byId[a.id_paciente] = byId[a.id_paciente] || { id: a.id_paciente, nome: a.paciente_nome };
    }
    return Object.values(byId);
  }, [atendimentos]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Pacientes vinculados</Text>
      {pacientes.length === 0 ? (
        <Text style={styles.note}>Nenhum paciente vinculado.</Text>
      ) : (
        pacientes.map((p: any) => (
          <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push(`/pacientes/${p.id}`)}>
            <Text style={styles.cardName}>{p.nome || `Paciente #${p.id}`}</Text>
            <Text style={styles.cardMeta}>Toque para ver histórico</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  note: { color: Colors.textSecondary },
  card: { backgroundColor: Colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cardName: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  cardMeta: { color: Colors.textSecondary, marginTop: 4 },
});





