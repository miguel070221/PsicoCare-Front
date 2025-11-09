import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { listarSolicitacoesPendentesPsicologo, aceitarSolicitacaoPsicologo, recusarSolicitacaoPsicologo } from '../../lib/api';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';

export default function SolicitacoesPsicologoTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const data = await listarSolicitacoesPendentesPsicologo(token);
        setItems(data || []);
      } catch {
        setItems([]);
      }
    })();
  }, [token]);

  const aceitar = async (s: any) => {
    if (!token) return;
    await aceitarSolicitacaoPsicologo(s.id, s.id_paciente, token);
    setItems((prev) => prev.filter((i) => i.id !== s.id));
  };

  const recusar = async (s: any) => {
    if (!token) return;
    await recusarSolicitacaoPsicologo(s.id, token);
    setItems((prev) => prev.filter((i) => i.id !== s.id));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <AppHeader title="Solicitações" subtitle="Gerencie solicitações de atendimento" />
      {items.length === 0 ? (
        <EmptyState icon="📧" title="Sem solicitações pendentes" hint="Novas solicitações aparecerão aqui" />
      ) : (
        items.map((s) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.name}>{s.paciente_nome}</Text>
            <Text style={styles.meta}>Preferência: {s.preferencia_comunicacao} / {s.contato_preferido || '-'}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity onPress={() => aceitar(s)} style={{ backgroundColor: Colors.tint, padding: 10, borderRadius: 8 }}>
                <Text style={{ color: Colors.card }}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => recusar(s)} style={{ backgroundColor: Colors.cardAlt, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ color: Colors.text }}>Recusar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  card: { backgroundColor: Colors.card, padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text },
  meta: { color: Colors.textSecondary, marginTop: 4 },
  empty: { color: Colors.textSecondary },
});


