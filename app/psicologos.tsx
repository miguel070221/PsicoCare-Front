import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../constants/Colors';
import { listarProfissionais } from '../lib/api';
import { useRouter } from 'expo-router';

export default function Psicologos() {
  const [profs, setProfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await listarProfissionais();
        setProfs(data);
      } catch (e) {
        setProfs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Psicólogos disponíveis</Text>
      {profs.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>{p.nome}</Text>
          <Text style={styles.meta}>{p.especialidade || ''} {p.disponivel ? '' : '(Indisponível)'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.tint }]} onPress={() => router.push({ pathname: '/agendamentos', params: { profissionalId: String(p.id) } })} disabled={!p.disponivel}>
              <Text style={{ color: Colors.card }}>Agendar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, margin: 8 },
  card: { backgroundColor: Colors.card, padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text },
  meta: { color: Colors.textSecondary, marginTop: 4 },
  btn: { padding: 10, borderRadius: 8 },
});
