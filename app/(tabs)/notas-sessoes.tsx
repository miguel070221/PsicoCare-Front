import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { listarAtendimentosDoPsicologo, getAgendamentosUsuario } from '../../lib/api';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

interface Nota {
  id?: number;
  id_paciente: number;
  titulo: string;
  conteudo: string;
  data_sessao?: string;
  paciente_nome?: string;
  created_at?: string;
}

export default function NotasSessoesTab() {
  const { token } = useAuth();
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editandoNota, setEditandoNota] = useState<Nota | null>(null);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await listarAtendimentosDoPsicologo(token);
        setAtendimentos(data || []);
        // Carregar notas (por enquanto do localStorage, depois da API)
        await carregarNotas();
      } catch (e) {
        setAtendimentos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const carregarNotas = async () => {
    try {
      // Por enquanto usando AsyncStorage, depois será API
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const notasSalvas = await AsyncStorage.getItem('notas_sessoes');
      if (notasSalvas) {
        setNotas(JSON.parse(notasSalvas));
      }
    } catch (e) {
      // Ignorar erro
    }
  };

  const salvarNotas = async (novasNotas: Nota[]) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('notas_sessoes', JSON.stringify(novasNotas));
      setNotas(novasNotas);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a nota.');
    }
  };

  const pacientesUnicos = Array.from(
    new Map(atendimentos.map((a) => [a.id_paciente, { id: a.id_paciente, nome: a.paciente_nome || `Paciente #${a.id_paciente}` }])).values()
  );

  const notasDoPaciente = pacienteSelecionado ? notas.filter((n) => n.id_paciente === pacienteSelecionado) : [];

  const abrirModalNovaNota = () => {
    if (!pacienteSelecionado) {
      Alert.alert('Atenção', 'Selecione um paciente primeiro.');
      return;
    }
    setEditandoNota(null);
    setTitulo('');
    setConteudo('');
    setShowModal(true);
  };

  const abrirModalEditar = (nota: Nota) => {
    setEditandoNota(nota);
    setTitulo(nota.titulo || '');
    setConteudo(nota.conteudo);
    setShowModal(true);
  };

  const salvarNota = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      Alert.alert('Erro', 'Preencha título e conteúdo.');
      return;
    }
    if (!pacienteSelecionado) return;

    setSalvando(true);
    try {
      let novasNotas: Nota[];
      if (editandoNota?.id) {
        // Editar nota existente
        novasNotas = notas.map((n) =>
          n.id === editandoNota.id
            ? { ...n, titulo: titulo.trim(), conteudo: conteudo.trim(), updated_at: new Date().toISOString() }
            : n
        );
      } else {
        // Nova nota
        const novaNota: Nota = {
          id: Date.now(), // ID temporário até ter API
          id_paciente: pacienteSelecionado,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          paciente_nome: pacientesUnicos.find((p: any) => p.id === pacienteSelecionado)?.nome,
          created_at: new Date().toISOString(),
        };
        novasNotas = [...notas, novaNota];
      }
      await salvarNotas(novasNotas);
      setShowModal(false);
      setTitulo('');
      setConteudo('');
      setEditandoNota(null);
      Alert.alert('Sucesso', editandoNota ? 'Nota atualizada!' : 'Nota criada!');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a nota.');
    } finally {
      setSalvando(false);
    }
  };

  const deletarNota = (notaId: number | undefined) => {
    if (!notaId) return;
    Alert.alert('Confirmar', 'Deseja realmente excluir esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const novasNotas = notas.filter((n) => n.id !== notaId);
          await salvarNotas(novasNotas);
        },
      },
    ]);
  };

  const formatarData = (data: string | undefined): string => {
    if (!data) return '';
    try {
      return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return data;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <AppHeader title="Notas e Sessões" subtitle="Gerencie suas anotações" />
      
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.addButton} onPress={abrirModalNovaNota}>
          <Ionicons name="add-circle" size={24} color={Colors.card} />
          <Text style={styles.addButtonText}>Nova Nota</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Selecione um Paciente</Text>
      {loading ? (
        <ActivityIndicator color={Colors.tint} size="large" style={{ marginVertical: 20 }} />
      ) : pacientesUnicos.length === 0 ? (
        <EmptyState icon="👥" title="Nenhum paciente vinculado" hint="Aceite solicitações para ver pacientes" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pacientesList}>
          {pacientesUnicos.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.pacienteBtn, pacienteSelecionado === p.id && styles.pacienteBtnSelected]}
              onPress={() => setPacienteSelecionado(p.id)}
            >
              <Text style={[styles.pacienteBtnText, pacienteSelecionado === p.id && styles.pacienteBtnTextSelected]}>
                {p.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {pacienteSelecionado && (
        <View style={styles.notasContainer}>
          <Text style={styles.sectionTitle}>
            Notas ({notasDoPaciente.length})
          </Text>
          {notasDoPaciente.length === 0 ? (
            <EmptyState icon="📝" title="Nenhuma nota encontrada" hint="Crie sua primeira nota acima" />
          ) : (
            notasDoPaciente.map((nota) => (
              <View key={nota.id} style={styles.notaCard}>
                <View style={styles.notaHeader}>
                  <Text style={styles.notaTitulo}>{nota.titulo}</Text>
                  <View style={styles.notaActions}>
                    <TouchableOpacity onPress={() => abrirModalEditar(nota)} style={styles.actionBtn}>
                      <Ionicons name="create-outline" size={20} color={Colors.tint} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deletarNota(nota.id)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
                {nota.created_at && (
                  <Text style={styles.notaData}>{formatarData(nota.created_at)}</Text>
                )}
                <Text style={styles.notaConteudo}>{nota.conteudo}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Modal de criar/editar nota */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editandoNota ? 'Editar Nota' : 'Nova Nota'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Sessão de avaliação inicial"
              value={titulo}
              onChangeText={setTitulo}
            />
            
            <Text style={styles.label}>Conteúdo</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Anotações sobre a sessão..."
              value={conteudo}
              onChangeText={setConteudo}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, salvando && styles.buttonDisabled]}
                onPress={salvarNota}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color={Colors.card} />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: Colors.tint,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  pacientesList: {
    marginBottom: 20,
  },
  pacienteBtn: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 120,
    alignItems: 'center',
  },
  pacienteBtnSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  pacienteBtnText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  pacienteBtnTextSelected: {
    color: Colors.card,
    fontWeight: '700',
  },
  notasContainer: {
    marginTop: 8,
  },
  notaCard: {
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
  notaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notaTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  notaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  notaData: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  notaConteudo: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    minHeight: 150,
    maxHeight: 300,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.tint,
  },
  saveButtonText: {
    color: Colors.card,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

