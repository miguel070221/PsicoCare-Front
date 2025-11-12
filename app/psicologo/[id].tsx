import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { listarPsicologosPublicos, getAvaliacoesPublicas, criarAvaliacao } from '../../lib/api';
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
        // Buscar psicólogos públicos (pode incluir psicólogos vinculados se for paciente)
        const profs = await listarPsicologosPublicos(
          user?.role === 'paciente' && user?.id ? { pacienteId: user.id } : undefined,
          token || undefined
        );
        const me = profs.find((p: any) => String(p.id) === String(id));
        setProf(me || null);
        const avs = await getAvaliacoesPublicas();
        setAvaliacoes(avs.filter(a => String(a.profissional_id) === String(id)));
      } catch (e) {
        console.error('Erro ao carregar psicólogo:', e);
        setProf(null);
        setAvaliacoes([]);
      }
    })();
  }, [id, user, token]);

  const handleEnviarAvaliacao = async () => {
    if (!token) {
      return router.push('/login');
    }
    
    const notaNum = parseInt(nota);
    if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
      alert('Por favor, informe uma nota válida entre 1 e 5.');
      return;
    }
    
    try {
      await criarAvaliacao({ 
        profissional_id: Number(id), 
        nota: notaNum, 
        comentario: comentario || undefined 
      }, token);
      
      // Recarregar avaliações públicas
      const avs = await getAvaliacoesPublicas();
      setAvaliacoes(avs.filter(a => String(a.profissional_id) === String(id)));
      setComentario('');
      setNota('5');
      alert('Avaliação enviada com sucesso!');
    } catch (e: any) {
      console.error('Erro ao enviar avaliação:', e);
      alert(e?.response?.data?.erro || e?.message || 'Erro ao enviar avaliação. Tente novamente.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {prof ? (
        <>
          <Text style={styles.name}>{prof.nome}</Text>
          <Text style={styles.meta}>
            {prof.crp ? `CRP: ${prof.crp}` : ''}
            {prof.especializacoes && Array.isArray(prof.especializacoes) && prof.especializacoes.length > 0 
              ? ` • ${prof.especializacoes.join(', ')}` 
              : ''}
          </Text>
          {prof.bio && (
            <Text style={{ marginTop: 10, color: Colors.text, lineHeight: 20 }}>{prof.bio}</Text>
          )}
          <Text style={{ marginTop: 10, color: Colors.textSecondary }}>
            {prof.disponivel ? '✓ Disponível' : '✗ Não disponível'}
          </Text>

          {/* Informações de Contato */}
          {(prof.telefone || (prof.redes_sociais && Object.keys(prof.redes_sociais).length > 0)) && (
            <View style={{ marginTop: 20, padding: 16, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontWeight: '700', marginBottom: 12, fontSize: 16 }}>Contato e Redes Sociais</Text>
              
              {prof.telefone && (
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                  onPress={() => Linking.openURL(`tel:${prof.telefone}`)}
                >
                  <Ionicons name="call-outline" size={20} color={Colors.tint} />
                  <Text style={{ marginLeft: 8, color: Colors.tint, textDecorationLine: 'underline' }}>
                    {prof.telefone}
                  </Text>
                </TouchableOpacity>
              )}
              
              {prof.redes_sociais && (
                <>
                  {prof.redes_sociais.instagram && (
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                      onPress={() => {
                        const link = prof.redes_sociais.instagram.startsWith('http') 
                          ? prof.redes_sociais.instagram 
                          : prof.redes_sociais.instagram.startsWith('@')
                          ? `https://instagram.com/${prof.redes_sociais.instagram.substring(1)}`
                          : `https://instagram.com/${prof.redes_sociais.instagram}`;
                        Linking.openURL(link);
                      }}
                    >
                      <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                      <Text style={{ marginLeft: 8, color: Colors.tint, textDecorationLine: 'underline' }}>
                        {prof.redes_sociais.instagram}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {prof.redes_sociais.linkedin && (
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                      onPress={() => {
                        const link = prof.redes_sociais.linkedin.startsWith('http') 
                          ? prof.redes_sociais.linkedin 
                          : `https://linkedin.com/in/${prof.redes_sociais.linkedin}`;
                        Linking.openURL(link);
                      }}
                    >
                      <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                      <Text style={{ marginLeft: 8, color: Colors.tint, textDecorationLine: 'underline' }}>
                        {prof.redes_sociais.linkedin}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {prof.redes_sociais.facebook && (
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                      onPress={() => {
                        const link = prof.redes_sociais.facebook.startsWith('http') 
                          ? prof.redes_sociais.facebook 
                          : `https://facebook.com/${prof.redes_sociais.facebook}`;
                        Linking.openURL(link);
                      }}
                    >
                      <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                      <Text style={{ marginLeft: 8, color: Colors.tint, textDecorationLine: 'underline' }}>
                        {prof.redes_sociais.facebook}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {prof.redes_sociais.outros && Array.isArray(prof.redes_sociais.outros) && prof.redes_sociais.outros.length > 0 && (
                    <>
                      {prof.redes_sociais.outros.map((link: string, index: number) => (
                        <TouchableOpacity 
                          key={index}
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                          onPress={() => {
                            const url = link.startsWith('http') ? link : `https://${link}`;
                            Linking.openURL(url).catch(() => {
                              alert('Link inválido');
                            });
                          }}
                        >
                          <Ionicons name="link-outline" size={20} color={Colors.tint} />
                          <Text style={{ marginLeft: 8, color: Colors.tint, textDecorationLine: 'underline', flex: 1 }}>
                            {link}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </>
              )}
            </View>
          )}

          <View style={{ marginTop: 18 }}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Avaliações</Text>
            {avaliacoes.length === 0 ? (
              <Text style={{ color: Colors.textSecondary }}>Sem avaliações ainda.</Text>
            ) : (
              avaliacoes.map(a => (
                <View key={a.id} style={{ backgroundColor: Colors.card, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: Colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>
                      {Array.from({ length: a.nota }, (_, i) => '⭐').join('')} {a.nota}/5
                    </Text>
                    <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                      {a.data_hora ? new Date(a.data_hora).toLocaleDateString('pt-BR') : ''}
                    </Text>
                  </View>
                  {a.comentario && (
                    <Text style={{ marginTop: 6, color: Colors.text, lineHeight: 20 }}>{a.comentario}</Text>
                  )}
                  {a.paciente_nome && (
                    <Text style={{ marginTop: 6, color: Colors.textSecondary, fontSize: 12 }}>
                      Por: {a.paciente_nome}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>

          {user && user.role === 'paciente' && (
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontWeight: '700', marginBottom: 8 }}>Deixe sua avaliação</Text>
              <TextInput 
                style={[styles.input, { minHeight: 60 }]} 
                value={comentario} 
                onChangeText={setComentario} 
                multiline 
                placeholder="Comentário (opcional)" 
              />
              <TextInput 
                style={styles.input} 
                value={nota} 
                onChangeText={(text) => {
                  // Validar que seja um número entre 1 e 5
                  const num = parseInt(text);
                  if (!isNaN(num) && num >= 1 && num <= 5) {
                    setNota(text);
                  } else if (text === '') {
                    setNota('');
                  }
                }}
                placeholder="Nota (1-5)" 
                keyboardType="numeric"
                maxLength={1}
              />
              <TouchableOpacity 
                style={[styles.btn, { 
                  backgroundColor: Colors.tint,
                  opacity: (!nota || parseInt(nota) < 1 || parseInt(nota) > 5) ? 0.5 : 1
                }]} 
                onPress={handleEnviarAvaliacao}
                disabled={!nota || parseInt(nota) < 1 || parseInt(nota) > 5}
              >
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
