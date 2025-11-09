import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { listarAtendimentosDoPsicologo, getAgendamentosUsuario, listarNotasSessoes, criarNotaSessao, atualizarNotaSessao, removerNotaSessao } from '../../lib/api';
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
  const notasRef = useRef<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editandoNota, setEditandoNota] = useState<Nota | null>(null);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [notaParaExcluir, setNotaParaExcluir] = useState<number | null>(null);

  // Atualizar ref sempre que notas mudar
  useEffect(() => {
    notasRef.current = notas;
  }, [notas]);

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

  // Debug: monitorar mudanças nas notas
  useEffect(() => {
    console.log('=== ESTADO DE NOTAS ATUALIZADO ===');
    console.log('Total de notas:', notas.length);
    console.log('Notas:', JSON.stringify(notas.map(n => ({ id: n.id, titulo: n.titulo }))));
  }, [notas]);

  const carregarNotas = async () => {
    if (!token) return;
    try {
      const notasAPI = await listarNotasSessoes(pacienteSelecionado || undefined, token);
      setNotas(notasAPI || []);
      notasRef.current = notasAPI || [];
    } catch (e: any) {
      console.error('Erro ao carregar notas:', e);
      // Se houver erro, tentar carregar do AsyncStorage como fallback
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const notasSalvas = await AsyncStorage.getItem('notas_sessoes');
        if (notasSalvas) {
          const notasArray = JSON.parse(notasSalvas);
          setNotas(notasArray);
          notasRef.current = notasArray;
        }
      } catch (e2) {
        setNotas([]);
      }
    }
  };

  const salvarNotas = async (novasNotas: Nota[]) => {
    // Esta função não é mais usada, mas mantida para compatibilidade
    // As notas agora são salvas diretamente via API
    setNotas(novasNotas);
    notasRef.current = novasNotas;
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
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios:\n\n• Título\n• Conteúdo');
      return;
    }
    if (!pacienteSelecionado || !token) return;

    setSalvando(true);
    try {
      if (editandoNota?.id) {
        // Editar nota existente
        await atualizarNotaSessao(editandoNota.id, {
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          data_sessao: editandoNota.data_sessao
        }, token);
        Alert.alert('Sucesso', 'Nota atualizada com sucesso!');
      } else {
        // Nova nota
        await criarNotaSessao({
          id_paciente: pacienteSelecionado,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
        }, token);
        Alert.alert('Sucesso', 'Nota criada com sucesso!');
      }
      
      // Recarregar notas
      await carregarNotas();
      fecharModal();
    } catch (e: any) {
      console.error('Erro ao salvar nota:', e);
      Alert.alert('Erro', e.message || 'Não foi possível salvar a nota. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditandoNota(null);
    setTitulo('');
    setConteudo('');
  };

  const abrirConfirmacaoExclusao = (notaId: number | undefined) => {
    if (!notaId) {
      Alert.alert('Erro', 'ID da nota não encontrado.');
      return;
    }
    setNotaParaExcluir(notaId);
    setShowConfirmDelete(true);
  };

  const confirmarExclusao = async () => {
    if (!notaParaExcluir || !token) return;
    
    try {
      await removerNotaSessao(notaParaExcluir, token);
      await carregarNotas();
      Alert.alert('Sucesso', 'Nota removida com sucesso!');
      setShowConfirmDelete(false);
      setNotaParaExcluir(null);
    } catch (e: any) {
      console.error('Erro ao deletar nota:', e);
      Alert.alert('Erro', e.message || 'Não foi possível remover a nota. Tente novamente.');
    }
  };

  const cancelarExclusao = () => {
    setShowConfirmDelete(false);
    setNotaParaExcluir(null);
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
            notasDoPaciente.map((nota, index) => (
              <View key={nota.id || `nota-${index}`} style={styles.notaCard}>
                <View style={styles.notaHeader}>
                  <Text style={styles.notaTitulo}>{nota.titulo}</Text>
                  <View style={styles.notaActions}>
                    <TouchableOpacity 
                      onPress={() => abrirModalEditar(nota)} 
                      style={styles.actionBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="create-outline" size={20} color={Colors.tint} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        if (!nota.id) {
                          Alert.alert('Erro', 'ID da nota não encontrado.');
                          return;
                        }
                        abrirConfirmacaoExclusao(nota.id);
                      }} 
                      style={styles.actionBtn}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      activeOpacity={0.7}
                    >
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

      {/* Modal de confirmação de exclusão */}
      <Modal visible={showConfirmDelete} transparent animationType="fade">
        <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={styles.modalConfirmContent}>
            <Text style={styles.modalConfirmTitle}>Confirmar exclusão</Text>
            {notaParaExcluir && (() => {
              const nota = notas.find((n) => Number(n.id) === Number(notaParaExcluir));
              return (
                <Text style={styles.modalConfirmText}>
                  Tem certeza que deseja excluir a nota "{nota?.titulo || 'esta nota'}"?
                  {'\n\n'}Esta ação não pode ser desfeita.
                </Text>
              );
            })()}
            <View style={styles.modalConfirmActions}>
              <TouchableOpacity
                style={[styles.modalConfirmButton, styles.modalConfirmCancel]}
                onPress={cancelarExclusao}
              >
                <Text style={styles.modalConfirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, styles.modalConfirmDelete]}
                onPress={confirmarExclusao}
              >
                <Text style={styles.modalConfirmDeleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de criar/editar nota */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editandoNota ? 'Editar Nota' : 'Nova Nota'}</Text>
              <TouchableOpacity onPress={fecharModal}>
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
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={fecharModal}>
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
    zIndex: 10,
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
  buttonPressed: {
    opacity: 0.6,
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
  modalConfirmContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
  },
  modalConfirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalConfirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmCancel: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalConfirmCancelText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmDelete: {
    backgroundColor: Colors.destructive,
  },
  modalConfirmDeleteText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
});



