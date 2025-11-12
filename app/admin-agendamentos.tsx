import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useAuth } from './contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { getAgendamentosUsuario, criarAgendamento, atualizarAgendamento, listarUsuariosCompleto, deletarAgendamento } from '../lib/api';
import EmptyState from '../components/EmptyState';

export default function AdminAgendamentos() {
  const { token } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState<any>(null);
  
  // Estados de filtros e busca
  const [busca, setBusca] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'agendado' | 'cancelado'>('todos');
  const [filtroPsicologo, setFiltroPsicologo] = useState<string>('');
  const [filtroPaciente, setFiltroPaciente] = useState<string>('');
  const [filtroData, setFiltroData] = useState<string>('');
  
  // Estados do formulário
  const [psicologoId, setPsicologoId] = useState<string>('');
  const [pacienteId, setPacienteId] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [horario, setHorario] = useState<string>('');
  
  // Busca nos modais
  const [buscaPsicologo, setBuscaPsicologo] = useState<string>('');
  const [buscaPaciente, setBuscaPaciente] = useState<string>('');
  
  // Listas para seleção
  const [psicologos, setPsicologos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [carregandoListas, setCarregandoListas] = useState(false);

  const carregarAgendamentos = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const dados = await getAgendamentosUsuario(0, token);
      setAgendamentos(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      console.error('Erro ao carregar agendamentos:', error);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const carregarListas = useCallback(async () => {
    if (!token) return;
    
    setCarregandoListas(true);
    try {
      const dados = await listarUsuariosCompleto(token);
      setPsicologos((dados.psicologos || []).map((p: any) => ({ id: p.id, nome: p.nome })));
      setPacientes((dados.pacientes || []).map((p: any) => ({ id: p.id, nome: p.nome })));
    } catch (error: any) {
      console.error('Erro ao carregar listas:', error);
      Alert.alert('Erro', 'Não foi possível carregar psicólogos e pacientes.');
    } finally {
      setCarregandoListas(false);
    }
  }, [token]);

  useEffect(() => {
    carregarAgendamentos();
    carregarListas();
  }, [carregarAgendamentos, carregarListas]);

  // Filtrar agendamentos
  useEffect(() => {
    let filtrados = [...agendamentos];

    // Filtro por busca (nome do paciente ou psicólogo)
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      filtrados = filtrados.filter(ag => 
        (ag.paciente_nome?.toLowerCase().includes(buscaLower)) ||
        (ag.psicologo_nome?.toLowerCase().includes(buscaLower))
      );
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(ag => {
        const status = ag.status?.toLowerCase() || 'agendado';
        if (filtroStatus === 'agendado') {
          return status === 'agendado' || !ag.status;
        } else if (filtroStatus === 'cancelado') {
          return status === 'cancelado';
        }
        return true;
      });
    }

    // Filtro por psicólogo
    if (filtroPsicologo) {
      filtrados = filtrados.filter(ag => 
        ag.profissional_id?.toString() === filtroPsicologo ||
        ag.psicologo_nome?.toLowerCase().includes(filtroPsicologo.toLowerCase())
      );
    }

    // Filtro por paciente
    if (filtroPaciente) {
      filtrados = filtrados.filter(ag => 
        ag.usuario_id?.toString() === filtroPaciente ||
        ag.paciente_nome?.toLowerCase().includes(filtroPaciente.toLowerCase())
      );
    }

    // Filtro por data
    if (filtroData) {
      filtrados = filtrados.filter(ag => {
        if (ag.data) {
          return ag.data === filtroData || ag.data.includes(filtroData);
        }
        if (ag.data_hora) {
          try {
            const dt = new Date(ag.data_hora);
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const yyyy = dt.getFullYear();
            const dataFormatada = `${dd}-${mm}-${yyyy}`;
            return dataFormatada === filtroData || dataFormatada.includes(filtroData);
          } catch {
            return false;
          }
        }
        return false;
      });
    }

    setAgendamentosFiltrados(filtrados);
  }, [agendamentos, busca, filtroStatus, filtroPsicologo, filtroPaciente, filtroData]);

  const abrirModalCriar = () => {
    setPsicologoId('');
    setPacienteId('');
    setData('');
    setHorario('');
    setBuscaPsicologo('');
    setBuscaPaciente('');
    setAgendamentoEditando(null);
    setModalVisible(true);
  };

  const abrirModalEditar = (ag: any) => {
    // Extrair data e horário do agendamento
    let dataFormatada = '';
    let horarioFormatado = '';
    
    if (ag.data_hora) {
      try {
        const dt = new Date(ag.data_hora);
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = dt.getFullYear();
        dataFormatada = `${dd}-${mm}-${yyyy}`;
        horarioFormatado = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      } catch (e) {
        console.error('Erro ao parsear data_hora:', e);
      }
    } else if (ag.data && ag.horario) {
      // Se vier separado, converter formato DD-MM-YYYY
      const [dd, mm, yyyy] = ag.data.split('-');
      if (dd && mm && yyyy) {
        dataFormatada = `${dd}-${mm}-${yyyy}`;
      } else {
        dataFormatada = ag.data;
      }
      horarioFormatado = ag.horario;
    }
    
    // usuario_id é sempre o paciente, profissional_id é sempre o psicólogo
    setPsicologoId(ag.profissional_id?.toString() || '');
    setPacienteId(ag.usuario_id?.toString() || '');
    setData(dataFormatada);
    setHorario(horarioFormatado);
    setAgendamentoEditando(ag);
    setModalEditVisible(true);
  };

  const fecharModal = () => {
    setModalVisible(false);
    setModalEditVisible(false);
    setAgendamentoEditando(null);
    setBuscaPsicologo('');
    setBuscaPaciente('');
  };

  const salvarAgendamento = async () => {
    if (!psicologoId || !pacienteId || !data || !horario) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      // Converter data e horário para formato ISO
      const [dd, mm, yyyy] = data.split('-');
      const [hora, minuto] = horario.split(':');
      
      if (!dd || !mm || !yyyy || !hora || !minuto) {
        Alert.alert('Erro', 'Data ou horário inválidos. Use o formato DD-MM-AAAA e HH:MM');
        return;
      }

      const dataUTC = new Date(Date.UTC(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hora),
        Number(minuto)
      ));
      const dataHoraISO = dataUTC.toISOString();

      if (agendamentoEditando) {
        // Editar
        await atualizarAgendamento(agendamentoEditando.id, { data_hora: dataHoraISO }, token!);
        Alert.alert('Sucesso', 'Agendamento atualizado com sucesso!');
      } else {
        // Criar
        await criarAgendamento({
          profissional_id: Number(psicologoId),
          paciente_id: Number(pacienteId),
          data_hora: dataHoraISO
        }, token!);
        Alert.alert('Sucesso', 'Agendamento criado com sucesso!');
      }

      fecharModal();
      carregarAgendamentos();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      Alert.alert('Erro', error?.response?.data?.erro || 'Não foi possível salvar o agendamento.');
    }
  };

  const handleCancelarAgendamento = (ag: any) => {
    Alert.alert(
      'Cancelar Agendamento',
      `Tem certeza que deseja cancelar o agendamento de ${ag.paciente_nome || 'paciente'} com ${ag.psicologo_nome || 'psicólogo'} em ${ag.data} às ${ag.horario}?`,
      [
        {
          text: 'Não',
          style: 'cancel'
        },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletarAgendamento(ag.id, token!);
              Alert.alert('Sucesso', 'Agendamento cancelado com sucesso!');
              carregarAgendamentos();
            } catch (error: any) {
              console.error('Erro ao cancelar agendamento:', error);
              Alert.alert('Erro', error?.response?.data?.erro || 'Não foi possível cancelar o agendamento.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Agendamentos" subtitle="Gerencie todos os agendamentos do sistema" />
      
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.buttonCriar} onPress={abrirModalCriar}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.card} />
          <Text style={styles.buttonCriarText}>Novo Agendamento</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros e Busca */}
      <View style={styles.filtrosContainer}>
        <View style={styles.buscaContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={styles.buscaIcon} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar por paciente ou psicólogo..."
            value={busca}
            onChangeText={setBusca}
            placeholderTextColor={Colors.textSecondary}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.buscaClear}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtrosRow}>
          <TouchableOpacity
            style={[styles.filtroButton, filtroStatus === 'todos' && styles.filtroButtonAtivo]}
            onPress={() => setFiltroStatus('todos')}
          >
            <Text style={[styles.filtroButtonText, filtroStatus === 'todos' && styles.filtroButtonTextAtivo]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filtroButton, filtroStatus === 'agendado' && styles.filtroButtonAtivo]}
            onPress={() => setFiltroStatus('agendado')}
          >
            <Text style={[styles.filtroButtonText, filtroStatus === 'agendado' && styles.filtroButtonTextAtivo]}>
              Agendados
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filtroButton, filtroStatus === 'cancelado' && styles.filtroButtonAtivo]}
            onPress={() => setFiltroStatus('cancelado')}
          >
            <Text style={[styles.filtroButtonText, filtroStatus === 'cancelado' && styles.filtroButtonTextAtivo]}>
              Cancelados
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtrosRow}>
          <View style={styles.filtroSelectContainer}>
            <Text style={styles.filtroLabel}>Psicólogo:</Text>
            <ScrollView style={styles.filtroSelect} horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filtroSelectOption, !filtroPsicologo && styles.filtroSelectOptionAtivo]}
                onPress={() => setFiltroPsicologo('')}
              >
                <Text style={[styles.filtroSelectText, !filtroPsicologo && styles.filtroSelectTextAtivo]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {psicologos.map((psic) => (
                <TouchableOpacity
                  key={psic.id}
                  style={[styles.filtroSelectOption, filtroPsicologo === psic.id.toString() && styles.filtroSelectOptionAtivo]}
                  onPress={() => setFiltroPsicologo(filtroPsicologo === psic.id.toString() ? '' : psic.id.toString())}
                >
                  <Text style={[styles.filtroSelectText, filtroPsicologo === psic.id.toString() && styles.filtroSelectTextAtivo]}>
                    {psic.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.filtrosRow}>
          <View style={styles.filtroSelectContainer}>
            <Text style={styles.filtroLabel}>Paciente:</Text>
            <ScrollView style={styles.filtroSelect} horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filtroSelectOption, !filtroPaciente && styles.filtroSelectOptionAtivo]}
                onPress={() => setFiltroPaciente('')}
              >
                <Text style={[styles.filtroSelectText, !filtroPaciente && styles.filtroSelectTextAtivo]}>
                  Todos
                </Text>
              </TouchableOpacity>
              {pacientes.map((pac) => (
                <TouchableOpacity
                  key={pac.id}
                  style={[styles.filtroSelectOption, filtroPaciente === pac.id.toString() && styles.filtroSelectOptionAtivo]}
                  onPress={() => setFiltroPaciente(filtroPaciente === pac.id.toString() ? '' : pac.id.toString())}
                >
                  <Text style={[styles.filtroSelectText, filtroPaciente === pac.id.toString() && styles.filtroSelectTextAtivo]}>
                    {pac.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.filtroDataContainer}>
          <Text style={styles.filtroLabel}>Data (DD-MM-AAAA):</Text>
          <TextInput
            style={styles.filtroDataInput}
            placeholder="Ex: 25-12-2024"
            value={filtroData}
            onChangeText={setFiltroData}
            placeholderTextColor={Colors.textSecondary}
          />
          {filtroData.length > 0 && (
            <TouchableOpacity onPress={() => setFiltroData('')} style={styles.filtroDataClear}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.tint} style={styles.loader} />
        ) : agendamentosFiltrados.length === 0 ? (
          <EmptyState 
            icon="📅" 
            title="Nenhum agendamento encontrado" 
            hint={busca || filtroStatus !== 'todos' || filtroPsicologo || filtroPaciente || filtroData ? "Tente ajustar os filtros" : "Clique em 'Novo Agendamento' para criar um"} 
          />
        ) : (
          agendamentosFiltrados.map((ag, idx) => {
            const isCancelado = ag.status === 'cancelado' || ag.status === 'Cancelado';
            const isAgendado = ag.status === 'agendado' || ag.status === 'Agendado' || !ag.status;
            
            return (
              <View style={[styles.card, isCancelado && styles.cardCancelado]} key={ag.id || idx}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardDateContainer}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.tint} />
                    <Text style={styles.date}>{ag.data || 'Data não informada'}</Text>
                  </View>
                  <View style={styles.cardTimeContainer}>
                    <Ionicons name="time-outline" size={20} color={Colors.tint} />
                    <Text style={styles.horario}>{ag.horario || ''}</Text>
                  </View>
                </View>
                
                {ag.paciente_nome && (
                  <View style={styles.cardInfoRow}>
                    <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.profissionalNome}>Paciente: {ag.paciente_nome}</Text>
                  </View>
                )}
                
                {ag.psicologo_nome && (
                  <View style={styles.cardInfoRow}>
                    <Ionicons name="person-circle-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.profissionalNome}>Psicólogo: {ag.psicologo_nome}</Text>
                  </View>
                )}
                
                <View style={styles.cardActions}>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusBadge,
                      isAgendado && styles.statusBadgeAgendado,
                      isCancelado && styles.statusBadgeCancelado,
                    ]}>
                      <Text style={[
                        styles.status,
                        isAgendado && styles.statusAgendado,
                        isCancelado && styles.statusCancelado,
                      ]}>
                        {isAgendado ? '✓ Agendado' : isCancelado ? '✗ Cancelado' : ag.status || 'agendado'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardActionsButtons}>
                    {!isCancelado && (
                      <TouchableOpacity
                        style={styles.buttonEditar}
                        onPress={() => abrirModalEditar(ag)}
                      >
                        <Ionicons name="create-outline" size={18} color={Colors.card} />
                        <Text style={styles.buttonEditarText}>Editar</Text>
                      </TouchableOpacity>
                    )}
                    
                    {!isCancelado && (
                      <TouchableOpacity
                        style={styles.buttonCancelar}
                        onPress={() => handleCancelarAgendamento(ag)}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={Colors.card} />
                        <Text style={styles.buttonCancelarText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Criar/Editar */}
      <Modal
        visible={modalVisible || modalEditVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {agendamentoEditando ? 'Editar Agendamento' : 'Novo Agendamento'}
              </Text>
              <TouchableOpacity onPress={fecharModal}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {carregandoListas ? (
                <ActivityIndicator size="large" color={Colors.tint} />
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Psicólogo *</Text>
                    <View style={styles.buscaModalContainer}>
                      <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.buscaModalIcon} />
                      <TextInput
                        style={styles.buscaModalInput}
                        placeholder="Buscar psicólogo..."
                        value={buscaPsicologo}
                        onChangeText={setBuscaPsicologo}
                        placeholderTextColor={Colors.textSecondary}
                      />
                      {buscaPsicologo.length > 0 && (
                        <TouchableOpacity onPress={() => setBuscaPsicologo('')}>
                          <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView style={styles.selectContainer} nestedScrollEnabled>
                      {psicologos
                        .filter(psic => 
                          !buscaPsicologo || 
                          psic.nome.toLowerCase().includes(buscaPsicologo.toLowerCase())
                        )
                        .map((psic) => (
                        <TouchableOpacity
                          key={psic.id}
                          style={[
                            styles.selectOption,
                            psicologoId === psic.id.toString() && styles.selectOptionSelected
                          ]}
                          onPress={() => setPsicologoId(psic.id.toString())}
                        >
                          <Text style={[
                            styles.selectOptionText,
                            psicologoId === psic.id.toString() && styles.selectOptionTextSelected
                          ]}>
                            {psic.nome}
                          </Text>
                          {psicologoId === psic.id.toString() && (
                            <Ionicons name="checkmark" size={20} color={Colors.tint} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {psicologoId && (
                      <Text style={styles.selectedText}>
                        Selecionado: {psicologos.find(p => p.id.toString() === psicologoId)?.nome}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Paciente *</Text>
                    <View style={styles.buscaModalContainer}>
                      <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.buscaModalIcon} />
                      <TextInput
                        style={styles.buscaModalInput}
                        placeholder="Buscar paciente..."
                        value={buscaPaciente}
                        onChangeText={setBuscaPaciente}
                        placeholderTextColor={Colors.textSecondary}
                      />
                      {buscaPaciente.length > 0 && (
                        <TouchableOpacity onPress={() => setBuscaPaciente('')}>
                          <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView style={styles.selectContainer} nestedScrollEnabled>
                      {pacientes
                        .filter(pac => 
                          !buscaPaciente || 
                          pac.nome.toLowerCase().includes(buscaPaciente.toLowerCase())
                        )
                        .map((pac) => (
                        <TouchableOpacity
                          key={pac.id}
                          style={[
                            styles.selectOption,
                            pacienteId === pac.id.toString() && styles.selectOptionSelected
                          ]}
                          onPress={() => setPacienteId(pac.id.toString())}
                        >
                          <Text style={[
                            styles.selectOptionText,
                            pacienteId === pac.id.toString() && styles.selectOptionTextSelected
                          ]}>
                            {pac.nome}
                          </Text>
                          {pacienteId === pac.id.toString() && (
                            <Ionicons name="checkmark" size={20} color={Colors.tint} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {pacienteId && (
                      <Text style={styles.selectedText}>
                        Selecionado: {pacientes.find(p => p.id.toString() === pacienteId)?.nome}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Data * (DD-MM-AAAA)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={data}
                      onChangeText={setData}
                      placeholder="Ex: 25-12-2024"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Horário * (HH:MM)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={horario}
                      onChangeText={setHorario}
                      placeholder="Ex: 14:30"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={fecharModal}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={salvarAgendamento}
                disabled={carregandoListas}
              >
                <Text style={[styles.modalButtonText, { color: Colors.card }]}>
                  {agendamentoEditando ? 'Salvar' : 'Criar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActions: {
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  buttonCriar: {
    backgroundColor: Colors.tint,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonCriarText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginBottom: 12,
    borderColor: Colors.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardCancelado: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: Colors.destructive,
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
  cardDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  horario: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.headerBlue,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  profissionalNome: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardActionsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeAgendado: {
    backgroundColor: Colors.tint + '20',
  },
  statusBadgeCancelado: {
    backgroundColor: Colors.destructive + '20',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusAgendado: {
    color: Colors.tint,
  },
  statusCancelado: {
    color: Colors.destructive,
  },
  buttonEditar: {
    backgroundColor: Colors.tint,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonEditarText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonCancelar: {
    backgroundColor: Colors.destructive,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonCancelarText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: Colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.tint,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  selectContainer: {
    maxHeight: 150,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectOptionSelected: {
    backgroundColor: Colors.tint + '20',
  },
  selectOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectOptionTextSelected: {
    fontWeight: '600',
    color: Colors.tint,
  },
  selectedText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.tint,
    fontWeight: '500',
  },
  filtrosContainer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buscaIcon: {
    marginRight: 8,
  },
  buscaInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  buscaClear: {
    padding: 4,
  },
  filtrosRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filtroButtonAtivo: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tint,
  },
  filtroButtonText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  filtroButtonTextAtivo: {
    color: Colors.card,
    fontWeight: '600',
  },
  filtroSelectContainer: {
    flex: 1,
  },
  filtroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  filtroSelect: {
    flexDirection: 'row',
  },
  filtroSelectOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filtroSelectOptionAtivo: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tint,
  },
  filtroSelectText: {
    fontSize: 12,
    color: Colors.text,
  },
  filtroSelectTextAtivo: {
    color: Colors.card,
    fontWeight: '600',
  },
  filtroDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filtroDataInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
  },
  filtroDataClear: {
    padding: 4,
  },
  buscaModalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buscaModalIcon: {
    marginRight: 8,
  },
  buscaModalInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
  },
});
