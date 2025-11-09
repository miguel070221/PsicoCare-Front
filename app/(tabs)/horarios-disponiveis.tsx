import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Switch, TouchableWithoutFeedback, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { listarHorariosDisponiveis, criarHorarioDisponivel, atualizarHorarioDisponivel, removerHorarioDisponivel } from '../../lib/api';
import { formatarHora } from '../../lib/formatters';
import AppHeader from '../../components/AppHeader';

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export default function HorariosDisponiveisScreen() {
  const { token } = useAuth();
  const [horarios, setHorarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form fields
  const [diaSemana, setDiaSemana] = useState<number>(1);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState('60');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    carregarHorarios();
  }, [token]);

  const carregarHorarios = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listarHorariosDisponiveis(token);
      setHorarios(data || []);
    } catch (e: any) {
      Alert.alert('Erro', 'Falha ao carregar horários disponíveis.');
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (horario?: any) => {
    if (horario) {
      setEditingId(horario.id);
      setDiaSemana(horario.dia_semana);
      setHoraInicio(horario.hora_inicio);
      setHoraFim(horario.hora_fim);
      setDuracaoMinutos(String(horario.duracao_minutos || 60));
      setAtivo(horario.ativo === 1 || horario.ativo === true);
    } else {
      setEditingId(null);
      setDiaSemana(1);
      setHoraInicio('');
      setHoraFim('');
      setDuracaoMinutos('60');
      setAtivo(true);
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const validarHora = (hora: string): boolean => {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(hora);
  };

  const salvarHorario = async () => {
    console.log('Salvar horário chamado');
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = [];
    
    if (!horaInicio || !horaInicio.trim()) {
      camposFaltando.push('Hora de Início');
    }
    if (!horaFim || !horaFim.trim()) {
      camposFaltando.push('Hora de Fim');
    }
    if (!duracaoMinutos || !duracaoMinutos.trim()) {
      camposFaltando.push('Duração');
    }
    
    if (camposFaltando.length > 0) {
      Alert.alert(
        'Campos obrigatórios',
        `Por favor, preencha os seguintes campos:\n\n• ${camposFaltando.join('\n• ')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!token) {
      Alert.alert('Erro', 'Você precisa estar autenticado.');
      return;
    }

    if (!horaInicio || !validarHora(horaInicio)) {
      Alert.alert('Erro', 'Digite a hora de início no formato HH:MM.');
      return;
    }

    if (!horaFim || !validarHora(horaFim)) {
      Alert.alert('Erro', 'Digite a hora de fim no formato HH:MM.');
      return;
    }

    if (horaInicio >= horaFim) {
      Alert.alert('Erro', 'A hora de fim deve ser maior que a hora de início.');
      return;
    }

    const duracao = parseInt(duracaoMinutos);
    if (isNaN(duracao) || duracao < 15 || duracao > 240) {
      Alert.alert('Erro', 'A duração deve ser entre 15 e 240 minutos.');
      return;
    }

    try {
      const dados = {
        dia_semana: diaSemana,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        duracao_minutos: duracao,
        ativo,
      };

      console.log('Dados para salvar:', dados, 'editingId:', editingId);

      if (editingId) {
        await atualizarHorarioDisponivel(editingId, dados, token);
        Alert.alert('Sucesso', 'Horário atualizado com sucesso!');
      } else {
        await criarHorarioDisponivel(dados, token);
        Alert.alert('Sucesso', 'Horário criado com sucesso!');
      }

      fecharModal();
      carregarHorarios();
    } catch (e: any) {
      console.error('Erro ao salvar horário:', e);
      const mensagem = e?.message || e?.response?.data?.erro || 'Falha ao salvar horário.';
      Alert.alert('Erro', mensagem);
    }
  };

  const removerHorario = async (id: number) => {
    console.log('=== FUNÇÃO REMOVER HORÁRIO CHAMADA ===');
    console.log('ID recebido:', id);
    console.log('Tipo:', typeof id);
    console.log('É NaN?', isNaN(id));
    console.log('Token presente:', !!token);
    
    if (!id || isNaN(id)) {
      console.error('ID inválido!');
      Alert.alert('Erro', 'ID do horário inválido.');
      return;
    }
    
    if (!token) {
      console.error('Token ausente!');
      Alert.alert('Erro', 'Você precisa estar autenticado.');
      return;
    }
    
    // Tentar remover diretamente primeiro para testar
    try {
      console.log('Tentando remover diretamente sem confirmação...');
      const resultado = await removerHorarioDisponivel(id, token);
      console.log('✅ Resultado da remoção:', resultado);
      Alert.alert('Sucesso', 'Horário removido com sucesso!');
      setTimeout(() => {
        console.log('Recarregando lista de horários...');
        carregarHorarios();
      }, 300);
    } catch (e: any) {
      console.error('❌ ERRO AO REMOVER HORÁRIO:');
      console.error('Erro completo:', e);
      console.error('Mensagem:', e?.message);
      console.error('Response:', e?.response);
      console.error('Response data:', e?.response?.data);
      const mensagem = e?.message || e?.response?.data?.erro || 'Falha ao remover horário. Verifique sua conexão.';
      Alert.alert('Erro', mensagem);
    }
  };

  const horariosPorDia = DIAS_SEMANA.map(dia => ({
    ...dia,
    horarios: horarios.filter(h => h.dia_semana === dia.value),
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader title="Horários Disponíveis" subtitle="Configure seus horários de atendimento" />

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => {
          console.log('Botão adicionar pressionado');
          abrirModal();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>+ Adicionar Horário</Text>
      </TouchableOpacity>

      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : horarios.length === 0 ? (
        <Text style={styles.empty}>Nenhum horário configurado. Adicione horários para que os pacientes possam agendar.</Text>
      ) : (
        horariosPorDia.map(({ label, value, horarios: h }) => {
          if (h.length === 0) return null;
          return (
            <View key={value} style={styles.daySection}>
              <Text style={styles.dayTitle}>{label}</Text>
              {h.map((horario: any) => (
                <View key={horario.id} style={styles.horarioCard} pointerEvents="box-none">
                  <View style={styles.horarioInfo} pointerEvents="none">
                    <Text style={styles.horarioText}>
                      {horario.hora_inicio} - {horario.hora_fim}
                    </Text>
                    <Text style={styles.duracaoText}>
                      Duração: {horario.duracao_minutos || 60} min
                    </Text>
                  </View>
                  <View style={styles.horarioActions} pointerEvents="auto">
                    <Switch
                      value={horario.ativo === 1 || horario.ativo === true}
                      onValueChange={async (value) => {
                        try {
                          await atualizarHorarioDisponivel(horario.id, { ativo: value }, token!);
                          carregarHorarios();
                        } catch (e: any) {
                          Alert.alert('Erro', 'Falha ao atualizar horário.');
                        }
                      }}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.editButton,
                        pressed && styles.buttonPressed
                      ]}
                      onPress={() => {
                        console.log('Editar horário:', horario.id);
                        abrirModal(horario);
                      }}
                    >
                      <Text style={styles.editButtonText}>Editar</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.buttonPressed
                      ]}
                      onPress={() => {
                        console.log('=== BOTÃO REMOVER PRESSIONADO ===');
                        console.log('ID:', horario.id);
                        console.log('Tipo:', typeof horario.id);
                        console.log('Token presente:', !!token);
                        
                        if (!horario.id) {
                          Alert.alert('Erro', 'ID do horário não encontrado.');
                          return;
                        }
                        
                        removerHorario(Number(horario.id));
                      }}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                      <Text style={styles.deleteButtonText}>Remover</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          );
        })
      )}

      <Modal 
        visible={showModal} 
        transparent 
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <TouchableWithoutFeedback onPress={fecharModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <Text style={styles.modalTitle}>
                  {editingId ? 'Editar Horário' : 'Novo Horário'}
                </Text>

                <Text style={styles.label}>Dia da Semana</Text>
                <View style={styles.diaSelector}>
                  {DIAS_SEMANA.map((dia) => (
                    <TouchableOpacity
                      key={dia.value}
                      style={[
                        styles.diaButton,
                        diaSemana === dia.value && styles.diaButtonSelected,
                      ]}
                      onPress={() => setDiaSemana(dia.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.diaButtonText,
                          diaSemana === dia.value && styles.diaButtonTextSelected,
                        ]}
                      >
                        {dia.label.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Hora de Início (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00"
                  value={horaInicio}
                  onChangeText={(text) => {
                    const formatado = formatarHora(text);
                    setHoraInicio(formatado);
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                />

                <Text style={styles.label}>Hora de Fim (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="18:00"
                  value={horaFim}
                  onChangeText={(text) => {
                    const formatado = formatarHora(text);
                    setHoraFim(formatado);
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                />

                <Text style={styles.label}>Duração (minutos)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="60"
                  value={duracaoMinutos}
                  onChangeText={setDuracaoMinutos}
                  keyboardType="numeric"
                />

                <View style={styles.switchRow}>
                  <Text style={styles.label}>Ativo</Text>
                  <Switch value={ativo} onValueChange={setAtivo} />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      console.log('Botão cancelar pressionado');
                      fecharModal();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={() => {
                      console.log('Botão salvar pressionado');
                      salvarHorario();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  addButton: {
    backgroundColor: Colors.tint,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: { color: Colors.card, fontWeight: '700', fontSize: 16 },
  loading: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, padding: 20 },
  daySection: { marginBottom: 24 },
  dayTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  horarioCard: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horarioInfo: { flex: 1 },
  horarioText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  duracaoText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  horarioActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: {
    backgroundColor: Colors.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { color: Colors.text, fontSize: 12, fontWeight: '600' },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    flexDirection: 'row',
    gap: 4,
  },
  deleteButtonText: { color: '#D32F2F', fontSize: 12, fontWeight: '600' },
  buttonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 12, marginBottom: 8 },
  diaSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  diaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  diaButtonSelected: { backgroundColor: Colors.tint, borderColor: Colors.tint },
  diaButtonText: { color: Colors.text, fontSize: 12 },
  diaButtonTextSelected: { color: Colors.card, fontWeight: '700' },
  input: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: { color: Colors.text, fontWeight: '600' },
  saveButton: { backgroundColor: Colors.tint },
  saveButtonText: { color: Colors.card, fontWeight: '700' },
});

