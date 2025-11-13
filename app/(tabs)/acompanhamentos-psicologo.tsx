import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { listarAtendimentosDoPsicologo, getAcompanhamentosPaciente } from '../../lib/api';
import { useRouter } from 'expo-router';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function AcompanhamentosPsicologoTab() {
  const { token } = useAuth();
  const router = useRouter();
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<number | null>(null);
  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAcompanhamentos, setLoadingAcompanhamentos] = useState(false);
  const [buscaPaciente, setBuscaPaciente] = useState('');

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await listarAtendimentosDoPsicologo(token);
        setAtendimentos(data || []);
      } catch (e) {
        setAtendimentos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!pacienteSelecionado || !token) {
      setAcompanhamentos([]);
      return;
    }
    (async () => {
      setLoadingAcompanhamentos(true);
      try {
        const data = await getAcompanhamentosPaciente(pacienteSelecionado, token);
        setAcompanhamentos(data || []);
      } catch (e: any) {
        Alert.alert('Erro', 'Não foi possível carregar os acompanhamentos.');
        setAcompanhamentos([]);
      } finally {
        setLoadingAcompanhamentos(false);
      }
    })();
  }, [pacienteSelecionado, token]);

  const pacientesUnicos = useMemo(() => {
    const pacientes = Array.from(
      new Map(atendimentos.map((a) => [a.id_paciente, { id: a.id_paciente, nome: a.paciente_nome || `Paciente #${a.id_paciente}` }])).values()
    );
    
    if (!buscaPaciente.trim()) {
      return pacientes;
    }
    
    const termoBusca = buscaPaciente.toLowerCase().trim();
    return pacientes.filter((p: any) => 
      p.nome.toLowerCase().includes(termoBusca)
    );
  }, [atendimentos, buscaPaciente]);

  const formatarData = (dataHora: string): string => {
    try {
      const data = new Date(dataHora);
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dataHora;
    }
  };

  const formatarHora = (dataHora: string): string => {
    try {
      const data = new Date(dataHora);
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getHumorEmoji = (humor: string): string => {
    const emojiMap: Record<string, string> = {
      feliz: '😊',
      triste: '😢',
      ansioso: '😰',
      calmo: '😌',
      irritado: '😠',
      cansado: '😴',
      motivado: '💪',
      estressado: '😓',
    };
    return emojiMap[humor?.toLowerCase()] || '😐';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <AppHeader title="Acompanhamentos" subtitle="Visualize os registros dos pacientes" />
      
      <Text style={styles.sectionTitle}>Selecione um Paciente</Text>
      
      {!loading && atendimentos.length > 0 && (
        <View style={styles.buscaContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.buscaIcon} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar paciente..."
            placeholderTextColor={Colors.textSecondary}
            value={buscaPaciente}
            onChangeText={setBuscaPaciente}
          />
          {buscaPaciente.length > 0 && (
            <TouchableOpacity onPress={() => setBuscaPaciente('')} style={styles.buscaClear}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {loading ? (
        <ActivityIndicator color={Colors.tint} size="large" style={{ marginVertical: 20 }} />
      ) : pacientesUnicos.length === 0 ? (
        <EmptyState 
          icon="👥" 
          title={buscaPaciente.trim() ? "Nenhum paciente encontrado" : "Nenhum paciente vinculado"} 
          hint={buscaPaciente.trim() ? "Tente buscar com outro termo" : "Aceite solicitações para ver acompanhamentos"} 
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pacientesList}>
          {pacientesUnicos.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.pacienteBtn,
                pacienteSelecionado === p.id && styles.pacienteBtnSelected,
              ]}
              onPress={() => setPacienteSelecionado(p.id)}
            >
              <Text
                style={[
                  styles.pacienteBtnText,
                  pacienteSelecionado === p.id && styles.pacienteBtnTextSelected,
                ]}
              >
                {p.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {pacienteSelecionado && (
        <View style={styles.acompanhamentosContainer}>
          <Text style={styles.sectionTitle}>Registros de Acompanhamento</Text>
          {loadingAcompanhamentos ? (
            <ActivityIndicator color={Colors.tint} size="large" style={{ marginVertical: 20 }} />
          ) : acompanhamentos.length === 0 ? (
            <EmptyState 
              icon="📝" 
              title="Nenhum registro encontrado" 
              hint="Este paciente ainda não fez registros de acompanhamento"
            />
          ) : (
            acompanhamentos.map((acomp: any) => (
              <View key={acomp.id} style={styles.acompanhamentoCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dataText}>{formatarData(acomp.data_hora)}</Text>
                  <Text style={styles.horaText}>{formatarHora(acomp.data_hora)}</Text>
                </View>
                
                {acomp.humor && (
                  <View style={styles.humorContainer}>
                    <Text style={styles.humorEmoji}>{getHumorEmoji(acomp.humor)}</Text>
                    <Text style={styles.humorText}>{acomp.humor}</Text>
                  </View>
                )}
                
                {acomp.qualidade_sono !== null && acomp.qualidade_sono !== undefined && (
                  <View style={styles.sonoContainer}>
                    <Text style={styles.sonoLabel}>Qualidade do Sono:</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text key={star} style={styles.star}>
                          {star <= acomp.qualidade_sono ? '⭐' : '☆'}
                        </Text>
                      ))}
                      <Text style={styles.sonoValue}> {acomp.qualidade_sono}/5</Text>
                    </View>
                  </View>
                )}
                
                {acomp.texto && (
                  <View style={styles.textoContainer}>
                    <Text style={styles.textoLabel}>Observações:</Text>
                    <Text style={styles.textoContent}>{acomp.texto}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 150,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 10,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 40,
  },
  buscaIcon: {
    marginRight: 8,
  },
  buscaInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
  },
  buscaClear: {
    padding: 4,
  },
  pacientesList: {
    marginBottom: 16,
  },
  pacienteBtn: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 80,
    maxWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  pacienteBtnSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  pacienteBtnText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  pacienteBtnTextSelected: {
    color: Colors.card,
    fontWeight: '700',
    fontSize: 12,
  },
  acompanhamentosContainer: {
    marginTop: 8,
  },
  acompanhamentoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dataText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  horaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  humorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  humorEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  humorText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sonoContainer: {
    marginBottom: 12,
  },
  sonoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 18,
    marginRight: 4,
  },
  sonoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: 8,
  },
  textoContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  textoContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
});

















