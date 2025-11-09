// Localização: (app)/agendamentos.tsx

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentosUsuario, listarPsicologosPublicos, criarAgendamento, getSlotsDisponiveis, listarAtendimentosDoPaciente, listarPsicologosVinculadosPorAtendimentos, getDiasSemanaDisponiveis, listarHorariosDisponiveisPublico, getAgendamentosPsicologo, cancelarAgendamento, listarAtendimentosDoPsicologo, getPsicologoMe } from '../../lib/api';
import { useLocalSearchParams } from 'expo-router';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { formatarHora, formatarData } from '../../lib/formatters';

export default function Agendamentos() {
  const router = useRouter();
  const { user, token } = useAuth();
  const searchParams = useLocalSearchParams();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Estados do formulário
  const [selectedProfissional, setSelectedProfissional] = useState<number | null>(null);
  const [dataInput, setDataInput] = useState(''); // 'DD-MM-AAAA'
  const [horaInput, setHoraInput] = useState(''); // 'HH:MM'
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [slotsDisponiveis, setSlotsDisponiveis] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [diasComHorarios, setDiasComHorarios] = useState<Set<string>>(new Set());
  const [horariosConfigurados, setHorariosConfigurados] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]); // Para psicólogos
  const [pacienteSelecionado, setPacienteSelecionado] = useState<number | null>(null); // Para psicólogos
  const [psicologoId, setPsicologoId] = useState<number | null>(null); // ID do psicólogo logado

  const isPaciente = user?.role === 'paciente';
  const isPsicologo = user?.role === 'psicologo';
  
  // Debug: verificar se o componente está renderizando corretamente
  useEffect(() => {
    console.log('🔵 COMPONENTE RENDERIZADO');
    console.log('🔵 user:', user);
    console.log('🔵 isPaciente:', isPaciente);
    console.log('🔵 profissionais.length:', profissionais.length);
    console.log('🔵 profissionais:', profissionais);
  }, [user, isPaciente, profissionais]);

  // Função auxiliar para formatar Date para DD-MM-AAAA
  const formatarDataParaInput = (data: Date): string => {
    const dd = String(data.getDate()).padStart(2, '0');
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const yyyy = data.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    const fetchAgendamentos = async () => {
      console.log('=== fetchAgendamentos INICIADO ===');
      console.log('user:', user);
      console.log('token:', token ? 'presente' : 'ausente');
      
      if (!user || !token) {
        console.log('RETORNO: user ou token ausente');
        return;
      }
      
      setLoading(true);
      
      try {
        // Buscar agendamentos conforme o role
        if (isPaciente) {
          const data = await getAgendamentosUsuario(user.id, token);
          setAgendamentos(data);
          console.log('Agendamentos do paciente carregados:', data?.length || 0);
        } else if (isPsicologo) {
          const data = await getAgendamentosPsicologo(token);
          setAgendamentos(data);
          console.log('Agendamentos do psicólogo carregados:', data?.length || 0);
          
          // Buscar ID do psicólogo
          try {
            const psicologo = await getPsicologoMe(token);
            if (psicologo?.id) {
              setPsicologoId(psicologo.id);
            }
          } catch (e) {
            console.error('Erro ao buscar ID do psicólogo:', e);
          }
          
          // Buscar pacientes vinculados
          try {
            const atendimentos = await listarAtendimentosDoPsicologo(token);
            const pacientesUnicos = Array.from(
              new Map(
                atendimentos
                  .filter((a: any) => a.status === 'ativo' || !a.status)
                  .map((a: any) => [a.id_paciente, { id: a.id_paciente, nome: a.paciente_nome || `Paciente #${a.id_paciente}` }])
              ).values()
            );
            setPacientes(pacientesUnicos);
            console.log('Pacientes vinculados:', pacientesUnicos.length);
          } catch (e) {
            console.error('Erro ao buscar pacientes:', e);
            setPacientes([]);
          }
        }
        
        // buscar lista de profissionais vinculados ao paciente (apenas se for paciente)
        if (isPaciente) {
          console.log('=== BUSCANDO PSICÓLOGOS VINCULADOS ===');
          console.log('Paciente ID:', user.id);
          console.log('User completo:', JSON.stringify(user, null, 2));
          console.log('Token presente:', !!token);
          console.log('isPaciente:', isPaciente);
          
          let profsEncontrados: any[] = [];
          
          // Método 1: buscar psicólogos vinculados diretamente pelos atendimentos
          try {
            console.log('🔍 Método 1: Buscando psicólogos vinculados por atendimentos...');
            const profsVinculados = await listarPsicologosVinculadosPorAtendimentos(token);
            console.log('📊 Resultado método 1:', profsVinculados);
            console.log('📊 Tipo:', typeof profsVinculados);
            console.log('📊 É array?', Array.isArray(profsVinculados));
            console.log('📊 Quantidade:', Array.isArray(profsVinculados) ? profsVinculados.length : 'N/A');
            
            if (Array.isArray(profsVinculados) && profsVinculados.length > 0) {
              console.log('✅ Método 1: Psicólogos encontrados! Quantidade:', profsVinculados.length);
              profsEncontrados = profsVinculados;
            } else {
              console.warn('⚠️ Método 1: Nenhum psicólogo retornado ou array vazio');
            }
          } catch (eDireto: any) {
            console.error('❌ Erro no método 1:', eDireto);
            console.error('Mensagem:', eDireto?.message);
            console.error('Status:', eDireto?.response?.status);
            console.error('Dados:', eDireto?.response?.data);
          }
          
          // Método 2: buscar através de atendimentos e filtrar
          if (profsEncontrados.length === 0) {
            try {
              console.log('🔍 Método 2: Buscando através de atendimentos...');
              const atendimentos = await listarAtendimentosDoPaciente(token);
              console.log('📊 Atendimentos encontrados:', atendimentos?.length || 0);
              
              const atendimentosAtivos = Array.isArray(atendimentos) 
                ? atendimentos.filter((a: any) => a.status === 'ativo' || !a.status || a.status === null)
                : [];
              
              console.log('📊 Atendimentos ativos:', atendimentosAtivos.length);
              
              if (atendimentosAtivos.length > 0) {
                const idsPsicologos = atendimentosAtivos
                  .map((a: any) => Number(a.id_psicologo || a.id_psicologo))
                  .filter((id: any) => !isNaN(id) && id > 0);
                
                console.log('📊 IDs dos psicólogos:', idsPsicologos);
                
                if (idsPsicologos.length > 0) {
                  const todosProfs = await listarPsicologosPublicos(
                    { pacienteId: user.id },
                    token
                  );
                  
                  console.log('📊 Todos os profissionais retornados:', todosProfs?.length || 0);
                  
                  const profsVinculados = Array.isArray(todosProfs)
                    ? todosProfs.filter((p: any) => idsPsicologos.includes(Number(p.id)))
                    : [];
                  
                  console.log('✅ Método 2: Psicólogos vinculados encontrados:', profsVinculados.length);
                  profsEncontrados = profsVinculados;
                }
              }
            } catch (eAtendimentos: any) {
              console.error('❌ Erro no método 2:', eAtendimentos);
            }
          }
          
          // Método 3: último fallback - buscar com apenasVinculados
          if (profsEncontrados.length === 0) {
            try {
              console.log('🔍 Método 3: Buscando com apenasVinculados=true...');
              const profs = await listarPsicologosPublicos(
                { pacienteId: user.id, apenasVinculados: true },
                token
              );
              
              console.log('📊 Resultado método 3:', profs?.length || 0);
              
              const profsVinculados = Array.isArray(profs) 
                ? profs.filter((p: any) => p.vinculado === true || p.vinculado === 1 || String(p.vinculado) === '1')
                : [];
              
              console.log('✅ Método 3: Psicólogos vinculados encontrados:', profsVinculados.length);
              profsEncontrados = profsVinculados;
            } catch (eFinal: any) {
              console.error('❌ Erro no método 3:', eFinal);
            }
          }
          
          console.log('🎯 RESULTADO FINAL: Profissionais encontrados:', profsEncontrados.length);
          if (profsEncontrados.length > 0) {
            console.log('🎯 IDs:', profsEncontrados.map(p => ({ id: p.id, nome: p.nome })));
          }
          
          setProfissionais(profsEncontrados);
          
          // Selecionar profissional se vier na URL
          const pid = searchParams.profissionalId;
          if (pid) {
            setSelectedProfissional(Number(pid));
          }
        }
      } catch (eAgendamentos) {
        console.warn('Erro ao carregar agendamentos (continuando):', eAgendamentos);
        setAgendamentos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgendamentos();
  }, [user, token, isPaciente, isPsicologo]);

  // Carregar horários configurados do psicólogo quando selecionado
  useEffect(() => {
    const carregarHorariosConfigurados = async () => {
      const profissionalId = isPsicologo ? psicologoId : selectedProfissional;
      if (!profissionalId) {
        setHorariosConfigurados([]);
        return;
      }

      try {
        const horarios = await listarHorariosDisponiveisPublico(profissionalId);
        console.log('Horários configurados:', horarios);
        setHorariosConfigurados(horarios || []);
      } catch (e) {
        console.error('Erro ao carregar horários configurados:', e);
        setHorariosConfigurados([]);
      }
    };

    carregarHorariosConfigurados();
  }, [selectedProfissional, psicologoId, isPsicologo]);

  // Precarregar dias com horários disponíveis quando um psicólogo é selecionado
  useEffect(() => {
    const carregarDiasComHorarios = async () => {
      const profissionalId = isPsicologo ? psicologoId : selectedProfissional;
      if (!profissionalId) {
        setDiasComHorarios(new Set());
        return;
      }

      try {
        // Primeiro, buscar quais dias da semana o psicólogo tem horários configurados
        const { diasSemana } = await getDiasSemanaDisponiveis(profissionalId);
        console.log('Dias da semana disponíveis:', diasSemana);
        
        if (!diasSemana || diasSemana.length === 0) {
          setDiasComHorarios(new Set());
          return;
        }

        // Calcular as próximas ocorrências desses dias da semana
        const dias: Set<string> = new Set();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Buscar próximas 8 semanas (56 dias) para garantir que tenha dias suficientes
        for (let i = 0; i < 56; i++) {
          const dia = new Date(hoje);
          dia.setDate(hoje.getDate() + i);
          const diaSemana = dia.getDay(); // 0 = Domingo, 1 = Segunda, etc.
          
          // Se este dia da semana está na lista de disponíveis
          if (diasSemana.includes(diaSemana)) {
            const dataISO = dia.toISOString().split('T')[0];
            
            // Verificar se ainda tem slots disponíveis (considerando agendamentos já feitos)
            try {
              const response = await getSlotsDisponiveis(profissionalId, dataISO);
              if (response.slots && response.slots.length > 0) {
                const dataFormatada = formatarData(dia);
                dias.add(dataFormatada);
                // Limitar a 14 dias para não sobrecarregar a UI
                if (dias.size >= 14) break;
              }
            } catch (e) {
              // Ignora erros para dias individuais
            }
          }
        }
        
        console.log('Dias disponíveis calculados:', Array.from(dias));
        setDiasComHorarios(dias);
      } catch (e) {
        console.error('Erro ao carregar dias com horários:', e);
        setDiasComHorarios(new Set());
      }
    };

    carregarDiasComHorarios();
  }, [selectedProfissional, psicologoId, isPsicologo]);

  // Carregar slots disponíveis quando profissional e data forem selecionados
  useEffect(() => {
    const carregarSlots = async () => {
      const profissionalId = isPsicologo ? psicologoId : selectedProfissional;
      if (!profissionalId || !dataInput) {
        setSlotsDisponiveis([]);
        return;
      }

      setLoadingSlots(true);
      try {
        // Converter DD-MM-AAAA para formato ISO
        const [dd, mm, yyyy] = dataInput.split('-');
        const dataISO = `${yyyy}-${mm}-${dd}`;
        
        const response = await getSlotsDisponiveis(profissionalId, dataISO);
        setSlotsDisponiveis(response.slots || []);
      } catch (e: any) {
        console.error('Erro ao carregar slots:', e);
        setSlotsDisponiveis([]);
        Alert.alert('Aviso', 'Não foi possível carregar os horários disponíveis. Verifique se o psicólogo configurou horários.');
      } finally {
        setLoadingSlots(false);
      }
    };

    carregarSlots();
  }, [selectedProfissional, dataInput, psicologoId, isPsicologo]);

  // Debug: Log quando os estados mudarem
  useEffect(() => {
    console.log('=== ESTADOS ATUALIZADOS ===');
    console.log('selectedProfissional:', selectedProfissional);
    console.log('dataInput:', dataInput);
    console.log('horaInput:', horaInput);
    console.log('diasComHorarios:', Array.from(diasComHorarios));
    console.log('slotsDisponiveis:', slotsDisponiveis);
    console.log('profissionais.length:', profissionais.length);
    console.log('profissionais:', profissionais.map(p => ({ id: p.id, nome: p.nome, disponivel: p.disponivel })));
  }, [selectedProfissional, dataInput, horaInput, diasComHorarios, slotsDisponiveis, profissionais]);

  const getMonthDays = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const formatarData = (data: Date): string => {
    const dd = String(data.getDate()).padStart(2, '0');
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const yyyy = String(data.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
  };

  const validarHora = (hora: string): boolean => {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(hora);
  };

  const validarDataFutura = (dataStr: string): boolean => {
    const [dd, mm, yyyy] = dataStr.split('-');
    const dataAgendamento = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataAgendamento.setHours(0, 0, 0, 0);
    return dataAgendamento >= hoje;
  };

  const handleCriarAgendamento = async () => {
    // Validação de campos obrigatórios
    const camposFaltando: string[] = [];
    
    if (isPaciente && !selectedProfissional) {
      camposFaltando.push('Profissional');
    }
    if (isPsicologo && !pacienteSelecionado) {
      camposFaltando.push('Paciente');
    }
    if (!dataInput || !dataInput.trim()) {
      camposFaltando.push('Data');
    }
    if (!horaInput || !horaInput.trim()) {
      camposFaltando.push('Hora');
    }
    
    if (camposFaltando.length > 0) {
      Alert.alert(
        'Campos obrigatórios',
        `Por favor, preencha os seguintes campos:\n\n• ${camposFaltando.join('\n• ')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Validações
    if (!dataInput.match(/^\d{2}-\d{2}-\d{4}$/)) {
      Alert.alert('Erro', 'Digite a data no formato DD-MM-AAAA.');
      return;
    }

    if (!validarDataFutura(dataInput)) {
      Alert.alert('Erro', 'A data deve ser hoje ou no futuro.');
      return;
    }

    if (!validarHora(horaInput)) {
      Alert.alert('Erro', 'Digite a hora no formato HH:MM (ex: 14:30).');
      return;
    }

    // Verificar se o horário está disponível
    const profissionalId = isPsicologo ? psicologoId : selectedProfissional;
    if (slotsDisponiveis.length > 0 && !slotsDisponiveis.includes(horaInput)) {
      Alert.alert('Erro', 'Este horário não está disponível. Por favor, escolha um dos horários disponíveis.');
      return;
    }

    if (!token || !user) {
      Alert.alert('Erro', 'Você precisa estar autenticado.');
      return;
    }

    try {
      setCreating(true);
      // Converter DD-MM-AAAA para ISO
      const [dd, mm, yyyy] = dataInput.split('-');
      const iso = new Date(`${yyyy}-${mm}-${dd}T${horaInput}:00`).toISOString();
      
      // Criar agendamento conforme o role
      if (isPaciente) {
        await criarAgendamento({ profissional_id: selectedProfissional, data_hora: iso }, token);
      } else if (isPsicologo) {
        await criarAgendamento({ paciente_id: pacienteSelecionado, data_hora: iso }, token);
      }
      
      Alert.alert('Sucesso', 'Agendamento criado com sucesso!');
      
      // Recarregar lista de agendamentos
      if (isPaciente) {
        const data = await getAgendamentosUsuario(user.id, token);
        setAgendamentos(data);
      } else if (isPsicologo) {
        const data = await getAgendamentosPsicologo(token);
        setAgendamentos(data);
      }
      
      // Recarregar slots disponíveis para remover o horário ocupado
      if (profissionalId && dataInput) {
        const [dd, mm, yyyy] = dataInput.split('-');
        const dataISO = `${yyyy}-${mm}-${dd}`;
        try {
          const response = await getSlotsDisponiveis(profissionalId, dataISO);
          setSlotsDisponiveis(response.slots || []);
          // Limpar horário selecionado para permitir nova seleção
          setHoraInput('');
        } catch (e) {
          console.error('Erro ao recarregar slots:', e);
        }
      }
      
      // Limpar campos
      if (isPaciente) {
        setDataInput('');
        setHoraInput('');
      } else if (isPsicologo) {
        setPacienteSelecionado(null);
        setDataInput('');
        setHoraInput('');
      }
    } catch (error: any) {
      const mensagem = error?.message || error?.response?.data?.erro || 'Erro ao criar agendamento. Tente novamente.';
      Alert.alert('Erro', mensagem);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelarAgendamento = async (agendamentoId: number) => {
    Alert.alert(
      'Cancelar Agendamento',
      'Tem certeza que deseja cancelar este agendamento?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) {
                Alert.alert('Erro', 'Você precisa estar autenticado.');
                return;
              }
              
              await cancelarAgendamento(agendamentoId, token);
              Alert.alert('Sucesso', 'Agendamento cancelado com sucesso!');
              
              // Recarregar lista de agendamentos
              if (isPaciente) {
                const data = await getAgendamentosUsuario(user.id, token);
                setAgendamentos(data);
              } else if (isPsicologo) {
                const data = await getAgendamentosPsicologo(token);
                setAgendamentos(data);
              }
            } catch (error: any) {
              const mensagem = error?.message || error?.response?.data?.erro || 'Erro ao cancelar agendamento. Tente novamente.';
              Alert.alert('Erro', mensagem);
            }
          }
        }
      ]
    );
  };


  const profissionalSelecionado = profissionais.find((p) => Number(p.id) === Number(selectedProfissional));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader title="Agendamentos" subtitle="Gerencie suas consultas" />
      
      {/* Debug info - remover depois */}
      {__DEV__ && (
        <View style={{ padding: 8, backgroundColor: '#f0f0f0', marginBottom: 8, borderRadius: 4 }}>
          <Text style={{ fontSize: 10 }}>DEBUG: Role: {user?.role || 'desconhecido'}</Text>
          <Text style={{ fontSize: 10 }}>DEBUG: User ID: {user?.id || 'nenhum'}</Text>
          <Text style={{ fontSize: 10 }}>DEBUG: isPaciente: {String(isPaciente)}</Text>
          <Text style={{ fontSize: 10 }}>DEBUG: Token presente: {token ? 'sim' : 'não'}</Text>
          <Text style={{ fontSize: 10 }}>DEBUG: Loading: {String(loading)}</Text>
          <Text style={{ fontSize: 10 }}>DEBUG: Profissionais encontrados: {profissionais.length}</Text>
          {profissionais.length > 0 && (
            <>
              <Text style={{ fontSize: 10 }}>DEBUG: IDs: {profissionais.map(p => p.id).join(', ')}</Text>
              <Text style={{ fontSize: 10 }}>DEBUG: Nomes: {profissionais.map(p => p.nome || 'sem nome').join(', ')}</Text>
            </>
          )}
          <Text style={{ fontSize: 10 }}>DEBUG: Profissional selecionado: {selectedProfissional || 'nenhum'}</Text>
          <Text style={{ fontSize: 10 }}>DEBUG: Data selecionada: {dataInput || 'nenhuma'}</Text>
          <Text style={{ fontSize: 10 }}>DEBUG: Hora selecionada: {horaInput || 'nenhuma'}</Text>
        </View>
      )}
      
      {/* Formulário de agendamento */}
      <View style={[styles.acompanhamentoCard, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>Novo Agendamento</Text>
        
        {/* Seleção de paciente (apenas para psicólogos) */}
        {isPsicologo && (
          <>
            <Text style={styles.label}>Selecione o Paciente</Text>
            {pacientes.length === 0 ? (
              loading ? (
                <ActivityIndicator color={Colors.tint} size="small" style={{ marginVertical: 8 }} />
              ) : (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: Colors.textSecondary, marginBottom: 8 }}>
                    Nenhum paciente vinculado encontrado.
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                    Você precisa ter pacientes vinculados para criar agendamentos.
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.profissionaisContainer}>
                {pacientes.map((p) => (
                  <TouchableOpacity 
                    key={p.id} 
                    style={[
                      styles.profissionalCard, 
                      Number(pacienteSelecionado) === Number(p.id) && styles.profissionalCardSelected,
                    ]} 
                    onPress={() => {
                      console.log('Paciente selecionado:', p.id);
                      setPacienteSelecionado(p.id);
                      setDataInput(''); // Limpar data ao mudar paciente
                      setSlotsDisponiveis([]);
                      setHoraInput('');
                      setShowCalendar(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.profissionalCardContent} pointerEvents="none">
                      <View style={styles.profissionalCardHeader}>
                        <Text style={[
                          styles.profissionalCardNome,
                          Number(pacienteSelecionado) === Number(p.id) && styles.profissionalCardNomeSelected,
                        ]}>
                          {p.nome}
                        </Text>
                      </View>
                      {Number(pacienteSelecionado) === Number(p.id) && (
                        <Text style={styles.profissionalCardSelectedText}>
                          ✓ Selecione uma data e horário abaixo
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        
        {/* Seleção de profissional (apenas para pacientes) */}
        {isPaciente && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.label}>Selecione o Profissional</Text>
              <TouchableOpacity 
                onPress={async () => {
                  console.log('🔄 Botão recarregar clicado');
                  console.log('🔄 Token:', token ? 'presente' : 'ausente');
                  console.log('🔄 User ID:', user?.id);
                  setLoading(true);
                  try {
                    console.log('🔄 Chamando listarPsicologosVinculadosPorAtendimentos...');
                    const profs = await listarPsicologosVinculadosPorAtendimentos(token!);
                    console.log('🔄 Resultado recebido:', profs);
                    console.log('🔄 Tipo:', typeof profs);
                    console.log('🔄 É array?', Array.isArray(profs));
                    console.log('🔄 Quantidade:', Array.isArray(profs) ? profs.length : 'N/A');
                    const profsArray = Array.isArray(profs) ? profs : [];
                    console.log('🔄 Definindo profissionais com:', profsArray.length, 'itens');
                    setProfissionais(profsArray);
                    console.log('🔄 Estado atualizado');
                  } catch (e: any) {
                    console.error('🔄 Erro ao recarregar:', e);
                    console.error('🔄 Mensagem:', e?.message);
                    console.error('🔄 Stack:', e?.stack);
                    setProfissionais([]);
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ padding: 8, backgroundColor: Colors.tint, borderRadius: 4 }}
              >
                <Text style={{ color: Colors.card, fontSize: 12, fontWeight: 'bold' }}>🔄 Recarregar</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator color={Colors.tint} size="small" style={{ marginVertical: 8 }} />
            ) : profissionais.length === 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: Colors.textSecondary, marginBottom: 8 }}>
                  Nenhum psicólogo vinculado encontrado.
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                  Para agendar uma consulta, você precisa solicitar um atendimento na página de Psicólogos primeiro.
                </Text>
                <TouchableOpacity 
                  style={[styles.button, { marginTop: 12, backgroundColor: Colors.cardAlt }]} 
                  onPress={() => {
                    console.log('Botão ir para psicólogos clicado');
                    router.push('/(tabs)/psicologos');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, { color: Colors.text }]}>Ir para Psicólogos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.hintText, { marginBottom: 8 }]}>
                  {profissionais.length} psicólogo(s) vinculado(s) encontrado(s)
                </Text>
                <View style={styles.profissionaisContainer}>
                  {profissionais.map((p) => {
                    console.log('Renderizando profissional:', p.id, p.nome, 'disponivel:', p.disponivel);
                    return (
                      <TouchableOpacity 
                        key={p.id} 
                        style={[
                          styles.profissionalCard, 
                          Number(selectedProfissional) === Number(p.id) && styles.profissionalCardSelected,
                          p.disponivel === false && styles.profissionalCardDisabled
                        ]} 
                        onPress={() => {
                          // Permitir seleção se disponivel não for explicitamente false
                          if (p.disponivel !== false) {
                            console.log('Profissional selecionado:', p.id, 'Tipo:', typeof p.id);
                            console.log('selectedProfissional atual:', selectedProfissional, 'Tipo:', typeof selectedProfissional);
                            const novoId = Number(p.id);
                            console.log('Definindo selectedProfissional como:', novoId);
                            setSelectedProfissional(novoId);
                            setDataInput(''); // Limpar data ao mudar profissional
                            setSlotsDisponiveis([]);
                            setHoraInput('');
                            setShowCalendar(false);
                            console.log('Estado atualizado');
                          } else {
                            console.log('Profissional não disponível:', p.id);
                          }
                        }}
                        disabled={p.disponivel === false}
                        activeOpacity={0.7}
                      >
                        <View style={styles.profissionalCardContent} pointerEvents="none">
                          <View style={styles.profissionalCardHeader}>
                            <Text style={[
                              styles.profissionalCardNome,
                              Number(selectedProfissional) === Number(p.id) && styles.profissionalCardNomeSelected,
                              p.disponivel === false && styles.profissionalCardNomeDisabled
                            ]}>
                              {p.nome || `Psicólogo #${p.id}`}
                            </Text>
                            {p.vinculado && (
                              <View style={styles.vinculadoBadge}>
                                <Text style={styles.vinculadoBadgeText}>✓ Vinculado</Text>
                              </View>
                            )}
                          </View>
                          {p.crp && (
                            <Text style={styles.profissionalCardCrp}>CRP: {p.crp}</Text>
                          )}
                          {p.especializacoes && Array.isArray(p.especializacoes) && p.especializacoes.length > 0 && (
                            <Text style={styles.profissionalCardEspecializacoes}>
                              {p.especializacoes.join(', ')}
                            </Text>
                          )}
                          {Number(selectedProfissional) === Number(p.id) && (
                            <Text style={styles.profissionalCardSelectedText}>
                              ✓ Selecione uma data e horário abaixo
                            </Text>
                          )}
                          {p.disponivel === false && (
                            <Text style={styles.profissionalCardIndisponivel}>Indisponível</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* Formulário de data/hora (mostra apenas se tiver profissional/paciente selecionado) */}
        {(isPaciente && profissionalSelecionado) || (isPsicologo && pacienteSelecionado && psicologoId) ? (
          <>
            {/* Mostrar horários configurados pelo psicólogo - selecionáveis */}
            {horariosConfigurados.length > 0 && (
              <View style={styles.horariosConfiguradosContainer}>
                <Text style={styles.label}>📋 Selecione um horário disponível:</Text>
                <Text style={styles.hintText}>Clique em um horário para selecionar automaticamente a próxima data disponível</Text>
                
                {horariosConfigurados.map((h, idx) => {
                  // Encontrar TODOS os dias disponíveis para este dia da semana
                  const diasDisponiveisParaEsteDia = Array.from(diasComHorarios).filter(dia => {
                    const [dd, mm, yyyy] = dia.split('-');
                    const dataObj = new Date(`${yyyy}-${mm}-${dd}`);
                    return dataObj.getDay() === h.dia_semana;
                  });
                  
                  // Pegar o primeiro dia disponível (próximo dia deste dia da semana)
                  const proximoDiaDisponivel = diasDisponiveisParaEsteDia[0];
                  
                  // Gerar slots do horário configurado
                  const horaInicio = h.hora_inicio?.substring(0, 5);
                  const horaFim = h.hora_fim?.substring(0, 5);
                  const duracao = h.duracao_minutos || 60;
                  
                  // Calcular slots dentro deste intervalo
                  const slots: string[] = [];
                  if (horaInicio && horaFim) {
                    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
                    const [hFim, mFim] = horaFim.split(':').map(Number);
                    const inicioMinutos = hInicio * 60 + mInicio;
                    const fimMinutos = hFim * 60 + mFim;
                    
                    for (let minutos = inicioMinutos; minutos + duracao <= fimMinutos; minutos += duracao) {
                      const hh = Math.floor(minutos / 60);
                      const mm = minutos % 60;
                      slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
                    }
                  }
                  
                  const handleSelecionarHorario = async (slot: string) => {
                    try {
                      const profissionalId = isPsicologo ? psicologoId : selectedProfissional;
                      console.log('handleSelecionarHorario chamado com slot:', slot);
                      console.log('proximoDiaDisponivel:', proximoDiaDisponivel);
                      console.log('profissionalId:', profissionalId);
                      
                      // Buscar o próximo dia disponível para este dia da semana
                      let diaParaUsar = proximoDiaDisponivel;
                      
                      if (!diaParaUsar) {
                        console.log('Calculando próximo dia da semana...');
                        // Se não encontrou na lista carregada, calcular o próximo dia da semana
                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);
                        const diaSemanaHoje = hoje.getDay();
                        let diasParaAdicionar = h.dia_semana - diaSemanaHoje;
                        
                        console.log('Dia da semana hoje:', diaSemanaHoje);
                        console.log('Dia da semana do horário:', h.dia_semana);
                        console.log('Dias para adicionar (inicial):', diasParaAdicionar);
                        
                        // Se o dia da semana já passou esta semana, buscar na próxima semana
                        if (diasParaAdicionar <= 0) {
                          diasParaAdicionar += 7;
                        }
                        
                        // Se for hoje e já passou o horário, buscar na próxima semana
                        if (diasParaAdicionar === 0) {
                          const agora = new Date();
                          const [hSlot, mSlot] = slot.split(':').map(Number);
                          const horaSlot = new Date(agora);
                          horaSlot.setHours(hSlot, mSlot, 0, 0);
                          
                          if (agora >= horaSlot) {
                            diasParaAdicionar = 7;
                          }
                        }
                        
                        console.log('Dias para adicionar (final):', diasParaAdicionar);
                        
                        const proximoDia = new Date(hoje);
                        proximoDia.setDate(hoje.getDate() + diasParaAdicionar);
                        diaParaUsar = formatarDataParaInput(proximoDia);
                        
                        console.log('Dia calculado:', diaParaUsar);
                        
                        // Verificar se este dia realmente tem slots disponíveis
                        if (profissionalId) {
                          try {
                            const [dd, mm, yyyy] = diaParaUsar.split('-');
                            const dataISO = `${yyyy}-${mm}-${dd}`;
                            console.log('Verificando slots para:', dataISO);
                            const response = await getSlotsDisponiveis(profissionalId, dataISO);
                            console.log('Resposta de slots:', response);
                            
                            if (response.slots && response.slots.length > 0 && response.slots.includes(slot)) {
                              // Dia encontrado e tem slots disponíveis
                              console.log('Slot disponível encontrado! Definindo:', diaParaUsar, slot);
                              setDataInput(diaParaUsar);
                              setHoraInput(slot);
                              setShowCalendar(false);
                              return;
                            } else {
                              console.log('Slot não disponível neste dia, buscando próximo...');
                              // Este dia não tem mais slots disponíveis, buscar próximo
                              const proximoDiaTemp = new Date(proximoDia);
                              for (let i = 0; i < 4; i++) { // Tentar até 4 semanas
                                proximoDiaTemp.setDate(proximoDiaTemp.getDate() + 7);
                                const dataFormatada = formatarDataParaInput(proximoDiaTemp);
                                const [dd2, mm2, yyyy2] = dataFormatada.split('-');
                                const dataISO2 = `${yyyy2}-${mm2}-${dd2}`;
                                const response2 = await getSlotsDisponiveis(profissionalId, dataISO2);
                                
                                if (response2.slots && response2.slots.includes(slot)) {
                                  console.log('Slot encontrado em data alternativa:', dataFormatada);
                                  setDataInput(dataFormatada);
                                  setHoraInput(slot);
                                  setShowCalendar(false);
                                  return;
                                }
                              }
                              // Se não encontrou em nenhuma data, usar a primeira calculada mesmo assim
                              console.log('Usando data calculada mesmo sem confirmação de slot');
                              setDataInput(diaParaUsar);
                              setHoraInput(slot);
                              setShowCalendar(false);
                              return;
                            }
                          } catch (e) {
                            console.error('Erro ao verificar disponibilidade:', e);
                            // Em caso de erro, usar o dia calculado mesmo assim
                            console.log('Erro na verificação, usando data calculada:', diaParaUsar);
                            setDataInput(diaParaUsar);
                            setHoraInput(slot);
                            setShowCalendar(false);
                            return;
                          }
                        } else {
                          // Se não tem profissional selecionado, ainda assim definir os valores
                          console.log('Sem profissional selecionado, mas definindo valores mesmo assim');
                          setDataInput(diaParaUsar);
                          setHoraInput(slot);
                          setShowCalendar(false);
                          return;
                        }
                      }
                      
                      // Se já tinha dia disponível, verificar se o slot ainda está disponível
                      if (diaParaUsar && profissionalId) {
                        try {
                          const [dd, mm, yyyy] = diaParaUsar.split('-');
                          const dataISO = `${yyyy}-${mm}-${dd}`;
                          const response = await getSlotsDisponiveis(profissionalId, dataISO);
                          if (response.slots && response.slots.includes(slot)) {
                            console.log('Slot confirmado disponível, definindo:', diaParaUsar, slot);
                            setDataInput(diaParaUsar);
                            setHoraInput(slot);
                            setShowCalendar(false);
                          } else {
                            console.log('Slot não disponível mais');
                            Alert.alert('Horário indisponível', 'Este horário já foi agendado. Por favor, selecione outro.');
                          }
                        } catch (e) {
                          console.error('Erro ao verificar disponibilidade final:', e);
                          // Em caso de erro, ainda assim definir os valores se tivermos um dia
                          console.log('Erro na verificação final, usando valores mesmo assim');
                          setDataInput(diaParaUsar);
                          setHoraInput(slot);
                          setShowCalendar(false);
                        }
                      } else if (diaParaUsar) {
                        // Se não conseguiu verificar mas tem um dia, usar mesmo assim
                        console.log('Usando dia disponível sem verificação:', diaParaUsar);
                        setDataInput(diaParaUsar);
                        setHoraInput(slot);
                        setShowCalendar(false);
                      } else {
                        console.error('Nenhum dia disponível encontrado');
                        Alert.alert('Erro', 'Não foi possível encontrar uma data disponível. Tente novamente.');
                      }
                    } catch (error) {
                      console.error('Erro em handleSelecionarHorario:', error);
                      Alert.alert('Erro', 'Não foi possível selecionar o horário. Tente novamente.');
                    }
                  };
                  
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.horarioConfiguradoCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        console.log('Card de horário clicado');
                        console.log('Slots disponíveis:', slots);
                        console.log('proximoDiaDisponivel:', proximoDiaDisponivel);
                        // Se houver slots, selecionar o primeiro disponível
                        if (slots.length > 0) {
                          console.log('Selecionando primeiro slot:', slots[0]);
                          handleSelecionarHorario(slots[0]);
                        } else {
                          console.log('Nenhum slot disponível');
                        }
                      }}
                    >
                      <View style={styles.horarioConfiguradoHeader} pointerEvents="none">
                        <Text style={styles.horarioConfiguradoDia}>
                          {h.dia_semana_nome || ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][h.dia_semana]}
                        </Text>
                        <Text style={styles.horarioConfiguradoHorario}>
                          {horaInicio} - {horaFim}
                        </Text>
                      </View>
                      <Text style={styles.horarioConfiguradoDuracao} pointerEvents="none">
                        Duração: {duracao} minutos
                      </Text>
                      
                      {/* Mostrar slots disponíveis para este horário */}
                      {slots.length > 0 ? (
                        proximoDiaDisponivel ? (
                          <View style={styles.slotsDoHorarioContainer} pointerEvents="box-none">
                            <Text style={styles.slotsDoHorarioLabel} pointerEvents="none">
                              Próxima data disponível: {proximoDiaDisponivel.split('-').reverse().join('/')}
                            </Text>
                            <Text style={styles.slotsDoHorarioLabel} pointerEvents="none">Clique em um horário para selecionar:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsDoHorarioList} nestedScrollEnabled>
                              {slots.map((slot) => {
                                const isSelected = dataInput === proximoDiaDisponivel && horaInput === slot;
                                return (
                                  <TouchableOpacity
                                    key={slot}
                                    style={[
                                      styles.slotHorarioBtn,
                                      isSelected && styles.slotHorarioBtnSelected
                                    ]}
                                    onPress={() => {
                                      console.log('Botão de slot clicado:', slot);
                                      handleSelecionarHorario(slot);
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[
                                      styles.slotHorarioBtnText,
                                      isSelected && styles.slotHorarioBtnTextSelected
                                    ]}>
                                      {slot}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        ) : (
                          <View style={styles.slotsDoHorarioContainer} pointerEvents="none">
                            <Text style={styles.slotsDoHorarioLabel}>
                              ⏳ Carregando próximas datas disponíveis...
                            </Text>
                            <Text style={[styles.slotsDoHorarioLabel, { marginTop: 4 }]}>
                              Ou clique no card para selecionar {horaInicio} (próxima {h.dia_semana_nome || ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][h.dia_semana]})
                            </Text>
                          </View>
                        )
                      ) : (
                        <Text style={styles.horarioConfiguradoDuracao} pointerEvents="none">
                          Aguardando carregamento dos dias disponíveis...
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            
            <Text style={styles.label}>Data da Consulta</Text>
            
            {/* Mostrar próximos dias disponíveis se já carregados */}
            {diasComHorarios.size > 0 ? (
              <View style={styles.diasDisponiveisContainer}>
                <Text style={styles.diasDisponiveisLabel}>
                  📅 Dias disponíveis para agendamento (clique para selecionar):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diasDisponiveisList} nestedScrollEnabled>
                  {Array.from(diasComHorarios).slice(0, 14).map((dia) => {
                    const [dd, mm, yyyy] = dia.split('-');
                    const dataObj = new Date(`${yyyy}-${mm}-${dd}`);
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const isToday = dia === formatarData(hoje);
                    const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dataObj.getDay()];
                    const mesNome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][dataObj.getMonth()];
                    
                    return (
                      <TouchableOpacity
                        key={dia}
                        style={[
                          styles.diaDisponivelBtn,
                          dataInput === dia && styles.diaDisponivelBtnSelected
                        ]}
                        onPress={() => {
                          console.log('Botão de dia clicado:', dia);
                          console.log('Estado atual dataInput:', dataInput);
                          // Atualizar estados de forma síncrona
                          setDataInput(dia);
                          setHoraInput('');
                          setShowCalendar(false);
                          console.log('Estados atualizados - dataInput:', dia, 'horaInput: ""');
                          // Forçar re-render
                          setTimeout(() => {
                            console.log('Verificação após timeout - dataInput:', dataInput);
                          }, 100);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.diaDisponivelDiaSemana,
                          dataInput === dia && styles.diaDisponivelDiaSemanaSelected
                        ]}>
                          {diaSemana}
                        </Text>
                        <Text style={[
                          styles.diaDisponivelDia,
                          dataInput === dia && styles.diaDisponivelDiaSelected
                        ]}>
                          {dd} {mesNome}
                        </Text>
                        {isToday && (
                          <Text style={[
                            styles.diaDisponivelHoje,
                            dataInput === dia && styles.diaDisponivelHojeSelected
                          ]}>
                            Hoje
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : selectedProfissional && (
              <View style={styles.diasDisponiveisContainer}>
                <Text style={styles.hintText}>
                  ⏳ Carregando dias disponíveis...
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.inputArea} 
              onPress={() => {
                console.log('Input de data clicado');
                setShowCalendar(!showCalendar);
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: dataInput ? Colors.text : Colors.textSecondary }}>
                {dataInput || 'Selecione uma data (DD-MM-AAAA) ou escolha um dia disponível acima'}
              </Text>
            </TouchableOpacity>
            {showCalendar && (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                onPress={() => {
                  const m = calendarMonth - 1;
                  if (m < 0) { 
                    setCalendarMonth(11); 
                    setCalendarYear(calendarYear - 1); 
                  } else { 
                    setCalendarMonth(m); 
                  }
                }}
                style={styles.calendarNavBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarNavText}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {String(calendarMonth + 1).padStart(2, '0')}/{calendarYear}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  const m = calendarMonth + 1;
                  if (m > 11) { 
                    setCalendarMonth(0); 
                    setCalendarYear(calendarYear + 1); 
                  } else { 
                    setCalendarMonth(m); 
                  }
                }}
                style={styles.calendarNavBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarNavText}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarDays}>
              {getMonthDays(calendarYear, calendarMonth).map((d, idx) => {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const dataAtual = new Date(d);
                dataAtual.setHours(0, 0, 0, 0);
                const isPast = dataAtual < hoje;
                const isSelected = dataInput === formatarData(d);
                const dataFormatada = formatarData(d);
                const temHorarios = diasComHorarios.has(dataFormatada);
                
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      isPast && styles.calendarDayPast,
                      temHorarios && !isPast && !isSelected && styles.calendarDayWithSlots
                    ]} 
                    onPress={() => {
                      if (!isPast && temHorarios) {
                        console.log('Dia do calendário clicado:', formatarData(d));
                        setDataInput(formatarData(d));
                        setShowCalendar(false);
                        setHoraInput('');
                      }
                    }}
                    disabled={isPast || !temHorarios}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextSelected,
                      isPast && styles.calendarDayTextPast,
                      temHorarios && !isPast && !isSelected && styles.calendarDayTextWithSlots
                    ]}>
                      {d.getDate()}
                    </Text>
                    {temHorarios && !isPast && (
                      <View style={styles.calendarDayDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity 
              style={[styles.button, { marginTop: 8, backgroundColor: Colors.cardAlt }]} 
              onPress={() => {
                console.log('Botão fechar calendário clicado');
                setShowCalendar(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: Colors.text }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
        )}
        
            <Text style={styles.label}>Hora da Consulta</Text>
            {!dataInput ? (
              <>
                <Text style={styles.hintText}>
                  ⏰ Selecione uma data acima para ver os horários disponíveis
                </Text>
                <TextInput 
                  style={[styles.inputArea, { opacity: 0.5 }]} 
                  placeholder="Selecione uma data primeiro" 
                  value={horaInput} 
                  editable={false}
                />
              </>
            ) : loadingSlots ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.tint} size="small" />
                <Text style={styles.hintText}>Carregando horários disponíveis...</Text>
              </View>
            ) : slotsDisponiveis.length > 0 ? (
              <>
                <Text style={styles.hintText}>
                  ⏰ Horários disponíveis para {dataInput} (clique para selecionar):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsContainer} nestedScrollEnabled>
                  {slotsDisponiveis.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotButton,
                        horaInput === slot && styles.slotButtonSelected,
                      ]}
                      onPress={() => {
                        console.log('Botão de horário clicado:', slot);
                        console.log('Estado atual horaInput:', horaInput);
                        console.log('Estado atual dataInput:', dataInput);
                        setHoraInput(slot);
                        console.log('Estado atualizado - horaInput:', slot);
                        // Forçar re-render
                        setTimeout(() => {
                          console.log('Verificação após timeout - horaInput:', horaInput);
                        }, 100);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.slotButtonText,
                          horaInput === slot && styles.slotButtonTextSelected,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.hintText}>Ou digite manualmente:</Text>
                <TextInput 
                  style={styles.inputArea} 
                  placeholder="14:30" 
                  value={horaInput} 
                  onChangeText={(text) => {
                    const formatado = formatarHora(text);
                    setHoraInput(formatado);
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </>
            ) : (
              <>
                <Text style={[styles.hintText, { color: Colors.destructive }]}>
                  ⚠️ Nenhum horário disponível para esta data. Tente selecionar outro dia disponível acima.
                </Text>
                <TextInput 
                  style={[styles.inputArea, { opacity: 0.5 }]} 
                  placeholder="Nenhum horário disponível" 
                  value={horaInput} 
                  editable={false}
                />
              </>
            )}
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { marginTop: 16, backgroundColor: Colors.tint },
            ((isPaciente && !selectedProfissional) || (isPsicologo && !pacienteSelecionado) || !dataInput || !horaInput || creating) && styles.buttonDisabled
          ]} 
          onPress={() => {
            console.log('Botão criar agendamento clicado');
            handleCriarAgendamento();
          }}
          disabled={(isPaciente && !selectedProfissional) || (isPsicologo && !pacienteSelecionado) || !dataInput || !horaInput || creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color={Colors.card} />
          ) : (
            <Text style={styles.buttonText}>Criar Agendamento</Text>
          )}
        </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* Lista de agendamentos */}
      <View style={{ marginTop: 24 }}>
        <Text style={styles.title}>Meus Agendamentos</Text>
        {loading ? (
          <ActivityIndicator color={Colors.tint} size="large" style={{ marginTop: 32 }} />
        ) : agendamentos.length === 0 ? (
          <EmptyState icon="📅" title="Nenhum agendamento encontrado" hint="Crie um novo agendamento acima" />
        ) : (
          agendamentos.map((ag, idx) => (
            <View style={styles.card} key={ag.id || idx}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{ag.data || 'Data não informada'}</Text>
                <Text style={styles.horario}>{ag.horario || ''}</Text>
              </View>
              {isPaciente && ag.psicologo_nome && (
                <Text style={styles.profissionalNome}>Dr(a). {ag.psicologo_nome}</Text>
              )}
              {isPsicologo && ag.paciente_nome && (
                <Text style={styles.profissionalNome}>Paciente: {ag.paciente_nome}</Text>
              )}
              <View style={styles.statusContainer}>
                <Text style={[
                  styles.status,
                  (ag.status === 'agendado' || ag.status === 'Agendado') && styles.statusAgendado,
                  (ag.status === 'cancelado' || ag.status === 'Cancelado') && styles.statusCancelado,
                  (ag.status === 'concluido' || ag.status === 'Concluído') && styles.statusConcluido
                ]}>
                  {ag.status || 'agendado'}
                </Text>
              </View>
              {/* Botão de cancelar (apenas se não estiver cancelado) */}
              {(ag.status !== 'cancelado' && ag.status !== 'Cancelado') && (
                <TouchableOpacity
                  style={[styles.button, { marginTop: 12, backgroundColor: Colors.destructive }]}
                  onPress={() => handleCancelarAgendamento(ag.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>Cancelar Agendamento</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.text,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  profissionalNome: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  desc: {
    fontSize: 14,
    marginTop: 4,
    color: Colors.textSecondary,
  },
  statusContainer: {
    marginTop: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusAgendado: {
    backgroundColor: Colors.cardAlt,
    color: Colors.headerBlue,
  },
  statusCancelado: {
    backgroundColor: '#FFEBEE',
    color: Colors.destructive,
  },
  statusConcluido: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  button: {
    marginTop: 8,
    backgroundColor: Colors.tint,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
  inputArea: {
    backgroundColor: Colors.cardAlt,
    color: Colors.text,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 15,
    minHeight: 50,
  },
  acompanhamentoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  label: {
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    fontSize: 14,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  profissionaisContainer: {
    marginBottom: 8,
  },
  profissionalCard: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profissionalCardSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  profissionalCardDisabled: {
    opacity: 0.6,
  },
  profissionalCardContent: {
    width: '100%',
  },
  profissionalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profissionalCardNome: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  profissionalCardNomeSelected: {
    color: Colors.card,
  },
  profissionalCardNomeDisabled: {
    color: Colors.textSecondary,
  },
  vinculadoBadge: {
    backgroundColor: Colors.tint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vinculadoBadgeText: {
    color: Colors.card,
    fontSize: 10,
    fontWeight: '600',
  },
  profissionalCardCrp: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  profissionalCardEspecializacoes: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  profissionalCardSelectedText: {
    color: Colors.card,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  profissionalCardIndisponivel: {
    color: Colors.destructive,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavBtn: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  calendarNavText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.tint,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: '14.28%',
    padding: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarDaySelected: {
    backgroundColor: Colors.tint,
    borderRadius: 8,
  },
  calendarDayPast: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: Colors.card,
    fontWeight: '600',
  },
  calendarDayTextPast: {
    color: Colors.textSecondary,
  },
  calendarDayWithSlots: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.tint,
  },
  calendarDayTextWithSlots: {
    color: Colors.tint,
    fontWeight: '600',
  },
  calendarDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tint,
    marginTop: 2,
  },
  diasDisponiveisContainer: {
    marginBottom: 12,
  },
  diasDisponiveisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  diasDisponiveisList: {
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  diaDisponivelBtn: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  diaDisponivelBtnSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  diaDisponivelDiaSemana: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  diaDisponivelDiaSemanaSelected: {
    color: Colors.card,
  },
  diaDisponivelDia: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  diaDisponivelDiaSelected: {
    color: Colors.card,
  },
  diaDisponivelHoje: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.tint,
    marginTop: 2,
  },
  diaDisponivelHojeSelected: {
    color: Colors.card,
  },
  horariosConfiguradosContainer: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  horarioConfiguradoCard: {
    backgroundColor: Colors.card,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.tint,
  },
  horarioConfiguradoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  horarioConfiguradoDia: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  horarioConfiguradoHorario: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.headerBlue,
  },
  horarioConfiguradoDuracao: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  slotsDoHorarioContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  slotsDoHorarioLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  slotsDoHorarioList: {
    marginBottom: 4,
  },
  slotHorarioBtn: {
    backgroundColor: Colors.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotHorarioBtnSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  slotHorarioBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  slotHorarioBtnTextSelected: {
    color: Colors.card,
    fontWeight: '600',
  },
  slotsContainer: {
    marginVertical: 8,
    marginBottom: 12,
  },
  slotButton: {
    backgroundColor: Colors.cardAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotButtonSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tint,
  },
  slotButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  slotButtonTextSelected: {
    color: Colors.card,
    fontWeight: '700',
  },
});