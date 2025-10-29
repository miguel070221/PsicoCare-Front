import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Colors from '../../constants/Colors';
import { listarPsicologosPublicos, solicitarAtendimento } from '../../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function PsicologosScreen() {
  const [profs, setProfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listarPsicologosPublicos();
        setProfs(Array.isArray(data) ? data : []);
      } catch (e) {
        setProfs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (user?.role === 'psicologo') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Apenas pacientes podem acessar esta página.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Psicólogos disponíveis</Text>
      {profs.length === 0 && !loading && (
        <Text style={styles.meta}>Nenhum psicólogo disponível no momento.</Text>
      )}
      {profs.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>{p?.nome || `Psicólogo #${p?.id ?? ''}`}</Text>
          <Text style={styles.meta}>{Array.isArray(p?.especializacoes) ? p.especializacoes.join(', ') : ''}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.tint }]} onPress={async () => {
              if (!token) return;
              try {
                await solicitarAtendimento(p.id, token);
                alert('Solicitação enviada!');
              } catch (err) {
                alert('Falha ao enviar solicitação');
              }
            }}>
              <Text style={{ color: Colors.card }}>Solicitar atendimento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.cardAlt, borderWidth: 1, borderColor: Colors.border }]} onPress={() => setSelected(p)}>
              <Text style={{ color: Colors.text }}>Detalhes</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center' }}>
          <View style={{ backgroundColor: Colors.card, padding: 16, borderRadius: 12, width: '88%', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 18, fontWeight:'700', color: Colors.text, marginBottom: 8 }}>{selected?.nome || `Psicólogo #${selected?.id ?? ''}`}</Text>
            <Text style={{ color: Colors.textSecondary, marginBottom: 8 }}>CRP: {selected?.crp || '-'}</Text>
            <Text style={{ color: Colors.textSecondary, marginBottom: 8 }}>Especializações: {Array.isArray(selected?.especializacoes) ? selected.especializacoes.join(', ') : '-'}</Text>
            <Text style={{ color: Colors.textSecondary, marginBottom: 12 }}>{selected?.bio || 'Sem bio.'}</Text>
            <TouchableOpacity onPress={() => setSelected(null)} style={{ alignSelf:'flex-end', padding:10, backgroundColor: Colors.tint, borderRadius: 8 }}>
              <Text style={{ color: Colors.card }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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






