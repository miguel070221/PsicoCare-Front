import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
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
      setLoading(true);
      try {
        // Passa o ID do usuário se for paciente, para incluir psicólogos vinculados
        const data = await listarPsicologosPublicos(
          user?.role === 'paciente' && user?.id ? { pacienteId: user.id } : undefined,
          token || undefined
        );
        setProfs(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error('Erro ao carregar psicólogos:', e);
        setProfs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, token]);

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
      {loading && (
        <Text style={styles.meta}>Carregando...</Text>
      )}
      {profs.length === 0 && !loading && (
        <Text style={styles.meta}>Nenhum psicólogo disponível no momento.</Text>
      )}
      {profs.map((p) => (
        <View key={p.id} style={[styles.card, p.vinculado && styles.cardVinculado]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={styles.name}>{p?.nome || p?.nome_completo || p?.nomeCompleto || `Psicólogo #${p?.id ?? ''}`}</Text>
                {p.vinculado && (
                  <View style={{ backgroundColor: Colors.tint, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 9, color: Colors.card, fontWeight: '700' }}>VINCULADO</Text>
                  </View>
                )}
              </View>
            </View>
            {p.disponivel ? (
              <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, color: '#4CAF50', fontWeight: '600' }}>Disponível</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, color: '#FF9800', fontWeight: '600' }}>Indisponível</Text>
              </View>
            )}
          </View>
          <Text style={styles.meta}>CRP: {p?.crp || 'Não informado'}</Text>
          <Text style={styles.meta}>{Array.isArray(p?.especializacoes) && p.especializacoes.length > 0 ? p.especializacoes.join(', ') : 'Sem especializações'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {!p.vinculado ? (
              <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.tint }]} onPress={async () => {
                if (!token) {
                  alert('Você precisa estar logado para solicitar atendimento.');
                  return;
                }
                try {
                  await solicitarAtendimento(p.id, token);
                  alert('Solicitação enviada!');
                  // Recarregar lista
                  const data = await listarPsicologosPublicos(
                    user?.role === 'paciente' && user?.id ? { pacienteId: user.id } : undefined,
                    token
                  );
                  setProfs(Array.isArray(data) ? data : []);
                } catch (err: any) {
                  alert(err?.message || 'Falha ao enviar solicitação');
                }
              }}>
                <Text style={{ color: Colors.card }}>Solicitar atendimento</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.btn, { backgroundColor: Colors.cardAlt, borderWidth: 1, borderColor: Colors.tint }]}>
                <Text style={{ color: Colors.tint, fontWeight: '600' }}>✓ Já vinculado</Text>
              </View>
            )}
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { 
    fontSize: isSmallScreen ? 18 : 20, 
    fontWeight: '700', 
    color: Colors.text, 
    margin: isSmallScreen ? 6 : 8 
  },
  card: { 
    backgroundColor: Colors.card, 
    padding: isSmallScreen ? 10 : 12, 
    borderRadius: 10, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  cardVinculado: { borderColor: Colors.tint, borderWidth: 2 },
  name: { 
    fontSize: isSmallScreen ? 14 : 16, 
    fontWeight: '700', 
    color: Colors.text 
  },
  meta: { 
    color: Colors.textSecondary, 
    marginTop: 4,
    fontSize: isSmallScreen ? 12 : 14
  },
  btn: { 
    padding: isSmallScreen ? 8 : 10, 
    borderRadius: 8 
  },
});










