import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Colors from '../../constants/Colors';
import { listarProfissionais, getAvaliacoesPublicas, criarAvaliacao } from '../../lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../app/contexts/AuthContext';

export default function PsicologoPublic() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id } = params as any;
  const [prof, setProf] = useState<any | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [nota, setNota] = useState('5');
  const [comentario, setComentario] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const profs = await listarProfissionais();
        const me = profs.find((p: any) => String(p.id) === String(id));
        setProf(me || null);
        const avs = await getAvaliacoesPublicas();
        setAvaliacoes(avs.filter(a => String(a.profissional_id) === String(id)));
      } catch (e) {
        setProf(null);
        setAvaliacoes([]);
      }
    })();
  }, [id]);

  const handleEnviarAvaliacao = async () => {
    if (!token) return router.push('/login');
    try {
      await criarAvaliacao({ profissional_id: Number(id), nota: Number(nota), comentario }, token);
      // recarregar avaliações públicas
      const avs = await getAvaliacoesPublicas();
      setAvaliacoes(avs.filter(a => String(a.profissional_id) === String(id)));
      setComentario('');
      setNota('5');
    } catch (e) {
      // ignore
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {prof ? (
        <>
          <Text style={styles.name}>{prof.nome}</Text>
          <Text style={styles.meta}>{prof.especialidade}</Text>
          <Text style={{ marginTop: 10, color: Colors.textSecondary }}>{prof.disponivel ? 'Disponível' : 'Não disponível'}</Text>

          <View style={{ marginTop: 18 }}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Avaliações públicas</Text>
            {avaliacoes.length === 0 ? (
              <Text style={{ color: Colors.textSecondary }}>Sem avaliações públicas ainda.</Text>
            ) : (
              avaliacoes.map(a => (
                <View key={a.id} style={{ backgroundColor: Colors.card, padding: 10, borderRadius: 8, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700' }}>Nota: {a.nota}</Text>
                  <Text style={{ color: Colors.textSecondary }}>{new Date(a.data_hora).toLocaleDateString()}</Text>
                  <Text style={{ marginTop: 6 }}>{a.comentario}</Text>
                </View>
              ))
            )}
          </View>

          {user && user.role === 'paciente' && (
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontWeight: '700', marginBottom: 8 }}>Deixe sua avaliação</Text>
              <TextInput style={[styles.input, { minHeight: 60 }]} value={comentario} onChangeText={setComentario} multiline placeholder="Comentário" />
              <TextInput style={styles.input} value={nota} onChangeText={setNota} placeholder="Nota (1-5)" keyboardType="numeric" />
              <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.tint }]} onPress={handleEnviarAvaliacao}>
                <Text style={{ color: Colors.card }}>Enviar avaliação</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <Text>Carregando...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text },
  meta: { color: Colors.textSecondary, marginTop: 6 },
  input: { backgroundColor: Colors.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  btn: { padding: 12, borderRadius: 8, alignItems: 'center' },
});
