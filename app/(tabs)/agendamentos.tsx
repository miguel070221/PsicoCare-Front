// Localização: (app)/agendamentos.tsx

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentosUsuario, listarPsicologosPublicos, criarAgendamento, listarAtendimentosDoPaciente, listarPsicologosVinculadosPorAtendimentos, getAgendamentosPsicologo, cancelarAgendamento, listarAtendimentosDoPsicologo, getPsicologoMe, atualizarAgendamento } from '../../lib/api';
import { useLocalSearchParams } from 'expo-router';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { formatarHora, formatarData } from '../../lib/formatters';
import { Ionicons } from '@expo/vector-icons';

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
  // Gerar todos os horários de 00:00 até 23:59 (de hora em hora e meia em meia hora)
  const [horariosDisponiveis] = useState<string[]>(() => {
    const horarios: string[] = [];
    for (let hora = 0; hora < 24; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaStr = String(hora).padStart(2, '0');
        const minutoStr = String(minuto).padStart(2, '0');
        horarios.push(`${horaStr}:${minutoStr}`);
      }
    }
    return horarios; // 00:00, 00:30, 01:00, 01:30, ..., 23:00, 23:30
  });
  const [editingAgendamento, setEditingAgendamento] = useState<number | null>(null);
  const [pacientes, setPacientes] = useState<any[]>([]); // Para psicólogos
  const [pacienteSelecionado, setPacienteSelecionado] = useState<number | null>(null); // Para psicólogos
  const [psicologoId, setPsicologoId] = useState<number | null>(null); // ID do psicólogo logado
  const [modalConfirmarExclusao, setModalConfirmarExclusao] = useState(false);
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const isPaciente = user?.role === 'paciente';
  const isPsicologo = user?.role === 'psicologo';
  
  // Dimensões para responsividade
  const { width: screenWidth } = useMemo(() => Dimensions.get('window'), []);
  const isSmallScreen = screenWidth < 360;
  
  // Memoizar funções para evitar re-renders
  // Memoizar agendamentos filtrados
  const agendamentosFuturos = useMemo(() => {
    return agendamentos.filter((ag: any) => {
      const dataHora = ag.data_hora || (ag.data && ag.horario ? `${ag.data} ${ag.horario}` : null);
      if (!dataHora) return false;
      try {
        const dataAgendamento = new Date(dataHora);
        return dataAgendamento >= new Date();
      } catch {
        return false;
      }
    }).sort((a: any, b: any) => {
      const getTime = (ag: any) => {
        const dh = ag.data_hora || (ag.data && ag.horario ? `${ag.data} ${ag.horario}` : null);
        return dh ? new Date(dh).getTime() : 0;
      };
      return getTime(a) - getTime(b);
    });
  }, [agendamentos]);

  // Função auxiliar para formatar Date para DD-MM-AAAA
  const formatarDataParaInput = (data: Date): string => {
    const dd = String(data.getDate()).padStart(2, '0');
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const yyyy = data.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Carregar psicólogos vinculados automaticamente (para pacientes)
  useEffect(() => {
    const carregarPsicologos = async () => {
      if (!isPaciente || !token) {
        return;
      }
      
      console.log('🔄 [AUTO] Carregando psicólogos vinculados...');
      try {
        const profsVinculados = await listarPsicologosVinculadosPorAtendimentos(token);
        console.log('✅ [AUTO] Psicólogos carregados:', Array.isArray(profsVinculados) ? profsVinculados.length : 0);
        setProfissionais(Array.isArray(profsVinculados) ? profsVinculados : []);
        
        // Selecionar profissional se vier na URL
        const pid = searchParams.profissionalId;
        if (pid) {
          setSelectedProfissional(Number(pid));
        }
      } catch (e: any) {
        console.error('❌ [AUTO] Erro ao buscar psicólogos vinculados:', e);
        setProfissionais([]);
      }
    };
    
    carregarPsicologos();
  }, [isPaciente, token, searchParams.profissionalId]);

  // Carregar pacientes vinculados automaticamente (para psicólogos)
  useEffect(() => {
    const carregarPacientes = async () => {
      if (!isPsicologo || !token) {
        return;
      }
      
      console.log('🔄 [AUTO] Carregando pacientes vinculados...');
      try {
        const [psicologo, atendimentos] = await Promise.all([
          getPsicologoMe(token).catch(() => null),
          listarAtendimentosDoPsicologo(token).catch(() => [])
        ]);
        
        if (psicologo?.id) {
          setPsicologoId(psicologo.id);
          console.log('✅ [AUTO] ID do psicólogo:', psicologo.id);
        }
        
        console.log('🔍 [AUTO] Todos os atendimentos recebidos:', JSON.stringify(atendimentos, null, 2));
        console.log('🔍 [AUTO] Total de atendimentos:', Array.isArray(atendimentos) ? atendimentos.length : 0);
        
        // Log detalhado de TODOS os atendimentos recebidos
        console.log('🔍 [AUTO] ====== ANÁLISE DE ATENDIMENTOS ======');
        console.log('🔍 [AUTO] Total de atendimentos recebidos:', Array.isArray(atendimentos) ? atendimentos.length : 0);
        
        if (Array.isArray(atendimentos) && atendimentos.length > 0) {
          atendimentos.forEach((a: any, idx: number) => {
            const statusOk = a.status === 'ativo' || !a.status;
            const statusDisplay = a.status || 'NULL (ativo)';
            console.log(`  ${idx + 1}. Atendimento ID ${a.id}:`);
            console.log(`     - Paciente ID: ${a.id_paciente}, Nome: ${a.paciente_nome || 'SEM NOME'}`);
            console.log(`     - Status: ${statusDisplay} ${statusOk ? '✅' : '❌'}`);
            console.log(`     - Será incluído: ${statusOk ? 'SIM' : 'NÃO'}`);
          });
        } else {
          console.log('⚠️ [AUTO] Nenhum atendimento recebido ou array vazio');
        }
        
        const atendimentosFiltrados = (Array.isArray(atendimentos) ? atendimentos : [])
          .filter((a: any) => {
            const statusOk = a.status === 'ativo' || !a.status;
            if (!statusOk) {
              console.warn(`⚠️ [AUTO] Atendimento ID ${a.id} EXCLUÍDO: paciente ${a.id_paciente} (${a.paciente_nome}) tem status "${a.status}" (não é ativo)`);
            }
            return statusOk;
          });
        console.log('🔍 [AUTO] Atendimentos filtrados (ativos):', atendimentosFiltrados.length);
        console.log('🔍 [AUTO] Atendimentos excluídos (inativos):', (Array.isArray(atendimentos) ? atendimentos.length : 0) - atendimentosFiltrados.length);
        
        if (atendimentosFiltrados.length === 0 && Array.isArray(atendimentos) && atendimentos.length > 0) {
          console.error('❌ [AUTO] PROBLEMA DETECTADO: Existem atendimentos, mas NENHUM está ativo!');
          console.error('❌ [AUTO] Todos os atendimentos têm status diferente de "ativo" ou NULL');
          atendimentos.forEach((a: any) => {
            console.error(`   - Atendimento ID ${a.id}: paciente ${a.id_paciente} (${a.paciente_nome}), status: "${a.status}"`);
          });
        }
        
        const pacientesUnicos = Array.from(
          new Map(
            atendimentosFiltrados
              .map((a: any) => {
                const paciente = { id: a.id_paciente, nome: a.paciente_nome || `Paciente #${a.id_paciente}` };
                console.log(`🔍 [AUTO] Mapeando paciente:`, paciente);
                return [a.id_paciente, paciente];
              })
          ).values()
        );
        console.log('✅ [AUTO] Pacientes únicos carregados:', pacientesUnicos.length);
        if (pacientesUnicos.length > 0) {
          pacientesUnicos.forEach((p, idx) => {
            console.log(`  ${idx + 1}. ID: ${p.id}, Nome: ${p.nome}`);
          });
        } else {
          console.warn('⚠️ [AUTO] NENHUM PACIENTE DISPONÍVEL PARA AGENDAMENTO!');
          console.warn('⚠️ [AUTO] Possíveis causas:');
          console.warn('   1. Não há atendimentos criados para este psicólogo');
          console.warn('   2. Todos os atendimentos estão com status inativo');
          console.warn('   3. Erro ao buscar atendimentos do backend');
        }
        console.log('🔍 [AUTO] ========================================');
        setPacientes(pacientesUnicos);
      } catch (e) {
        console.error('❌ [AUTO] Erro ao buscar dados do psicólogo:', e);
        setPacientes([]);
      }
    };
    
    carregarPacientes();
  }, [isPsicologo, token]);

  // Carregar agendamentos automaticamente
  useEffect(() => {
    const fetchAgendamentos = async () => {
      if (!user || !token) {
        return;
      }
      
      setLoading(true);
      
      try {
        // Buscar agendamentos conforme o role
        if (isPaciente) {
          console.log('📥 [AUTO] Carregando agendamentos para paciente ID:', user.id);
          console.log('📥 [AUTO] Token presente:', !!token);
          console.log('📥 [AUTO] User object:', JSON.stringify(user, null, 2));
          const data = await getAgendamentosUsuario(user.id, token);
          console.log('📥 [AUTO] Resposta bruta da API:', data);
          console.log('📥 [AUTO] Agendamentos recebidos:', Array.isArray(data) ? data.length : 0, 'agendamentos');
          if (Array.isArray(data) && data.length > 0) {
            console.log('📥 [AUTO] Primeiro agendamento:', JSON.stringify(data[0], null, 2));
            console.log('📥 [AUTO] Todos os agendamentos:', JSON.stringify(data, null, 2));
          } else {
            console.log('⚠️ [AUTO] Nenhum agendamento encontrado para o paciente');
            console.log('⚠️ [AUTO] Tipo da resposta:', typeof data);
            console.log('⚠️ [AUTO] É array?', Array.isArray(data));
          }
          setAgendamentos(Array.isArray(data) ? data : []);
        } else if (isPsicologo) {
          console.log('📥 [AUTO] Carregando agendamentos para psicólogo...');
          console.log('📥 [AUTO] Token presente:', !!token);
          console.log('📥 [AUTO] User object:', JSON.stringify(user, null, 2));
          const data = await getAgendamentosPsicologo(token);
          console.log('📥 [AUTO] Resposta bruta da API:', data);
          console.log('📥 [AUTO] Agendamentos recebidos:', Array.isArray(data) ? data.length : 0, 'agendamentos');
          if (Array.isArray(data) && data.length > 0) {
            console.log('📥 [AUTO] Primeiro agendamento:', JSON.stringify(data[0], null, 2));
            console.log('📥 [AUTO] Todos os agendamentos:', JSON.stringify(data, null, 2));
          } else {
            console.log('⚠️ [AUTO] Nenhum agendamento encontrado para o psicólogo');
            console.log('⚠️ [AUTO] Tipo da resposta:', typeof data);
            console.log('⚠️ [AUTO] É array?', Array.isArray(data));
          }
          setAgendamentos(Array.isArray(data) ? data : []);
        }
      } catch (eAgendamentos: any) {
        console.error('❌ [AUTO] Erro ao carregar agendamentos:', eAgendamentos);
        console.error('❌ [AUTO] Mensagem do erro:', eAgendamentos?.message);
        console.error('❌ [AUTO] Response do erro:', eAgendamentos?.response?.data);
        console.error('❌ [AUTO] Status do erro:', eAgendamentos?.response?.status);
        console.error('❌ [AUTO] Stack trace:', eAgendamentos?.stack);
        setAgendamentos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgendamentos();
  }, [user, token, isPaciente, isPsicologo]);

  // Função para recarregar agendamentos manualmente
  const recarregarAgendamentos = useCallback(async () => {
    if (!user || !token) {
      console.log('⚠️ [RECARREGAR] Usuário ou token não disponível');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 [RECARREGAR] Iniciando recarregamento de agendamentos...');
      
      if (isPaciente) {
        console.log('🔄 [RECARREGAR] Buscando agendamentos para paciente ID:', user.id);
        const data = await getAgendamentosUsuario(user.id, token);
        console.log('✅ [RECARREGAR] Agendamentos recebidos:', Array.isArray(data) ? data.length : 0);
        if (Array.isArray(data) && data.length > 0) {
          console.log('📋 [RECARREGAR] Primeiro agendamento:', JSON.stringify(data[0], null, 2));
        }
        setAgendamentos(Array.isArray(data) ? data : []);
      } else if (isPsicologo) {
        console.log('🔄 [RECARREGAR] Buscando agendamentos para psicólogo...');
        const data = await getAgendamentosPsicologo(token);
        console.log('✅ [RECARREGAR] Agendamentos recebidos:', Array.isArray(data) ? data.length : 0);
        if (Array.isArray(data) && data.length > 0) {
          console.log('📋 [RECARREGAR] Primeiro agendamento:', JSON.stringify(data[0], null, 2));
        }
        setAgendamentos(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      console.error('❌ [RECARREGAR] Erro ao recarregar agendamentos:', e);
      console.error('❌ [RECARREGAR] Mensagem:', e?.message);
      console.error('❌ [RECARREGAR] Response:', e?.response?.data);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }, [user, token, isPaciente, isPsicologo]);

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

  const handleCriarAgendamento = useCallback(async () => {
    console.log('📤 Criando novo agendamento...');
    
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

    if (!token || !user) {
      Alert.alert('Erro', 'Você precisa estar autenticado.');
      return;
    }

    try {
      setCreating(true);
      // Converter DD-MM-AAAA para ISO
      const [dd, mm, yyyy] = dataInput.split('-');
      const [hora, minuto] = horaInput.split(':');
      // Criar data diretamente em UTC para evitar problemas de timezone
      // Usar Date.UTC para criar a data como se fosse UTC, preservando o horário informado
      const dataUTC = new Date(Date.UTC(
        Number(yyyy), 
        Number(mm) - 1, 
        Number(dd), 
        Number(hora), 
        Number(minuto)
      ));
      const iso = dataUTC.toISOString();
      
      console.log('📤 Dados do agendamento:', {
        isPaciente,
        isPsicologo,
        selectedProfissional,
        pacienteSelecionado,
        dataInput,
        horaInput,
        iso
      });
      
      // Criar agendamento conforme o role
      let resultado;
      if (isPaciente) {
        console.log('📤 [CRIAR] Criando agendamento para paciente:', { 
          profissional_id: selectedProfissional, 
          data_hora: iso,
          user_id: user?.id,
          role: user?.role
        });
        resultado = await criarAgendamento({ profissional_id: selectedProfissional, data_hora: iso }, token);
      } else if (isPsicologo) {
        console.log('📤 [CRIAR] ====== CRIANDO AGENDAMENTO PARA PSICÓLOGO ======');
        console.log('📤 [CRIAR] paciente_id:', pacienteSelecionado);
        console.log('📤 [CRIAR] psicologo_id (token):', user?.id);
        console.log('📤 [CRIAR] psicologoId (state):', psicologoId);
        console.log('📤 [CRIAR] data_hora:', iso);
        console.log('📤 [CRIAR] Pacientes disponíveis:', pacientes.map(p => ({ id: p.id, nome: p.nome })));
        
        // Verificar se o paciente selecionado está na lista de pacientes disponíveis
        const pacienteEncontrado = pacientes.find(p => Number(p.id) === Number(pacienteSelecionado));
        if (!pacienteEncontrado) {
          console.error('❌ [CRIAR] Paciente selecionado NÃO está na lista de pacientes disponíveis!');
          console.error('❌ [CRIAR] Paciente selecionado ID:', pacienteSelecionado);
          console.error('❌ [CRIAR] Pacientes disponíveis IDs:', pacientes.map(p => p.id));
          Alert.alert(
            'Erro', 
            `O paciente selecionado não está na lista de pacientes vinculados.\n\n` +
            `Paciente ID: ${pacienteSelecionado}\n` +
            `Pacientes disponíveis: ${pacientes.length > 0 ? pacientes.map(p => `${p.nome} (ID: ${p.id})`).join(', ') : 'Nenhum'}\n\n` +
            `Por favor, recarregue a lista de pacientes.`
          );
          setCreating(false);
          return;
        }
        
        console.log('✅ [CRIAR] Paciente encontrado na lista:', pacienteEncontrado);
        console.log('📤 [CRIAR] Enviando requisição para criar agendamento...');
        
        resultado = await criarAgendamento({ 
          paciente_id: pacienteSelecionado, 
          profissional_id: psicologoId || user?.id,
          data_hora: iso 
        }, token);
        
        console.log('✅ [CRIAR] Resposta do backend:', resultado);
      }
      
      console.log('✅ Agendamento criado com sucesso:', resultado);
      
      // Mostrar confirmação melhorada
      const nomeDestinatario = isPaciente 
        ? profissionais.find(p => p.id === selectedProfissional)?.nome || 'Profissional'
        : pacientes.find(p => p.id === pacienteSelecionado)?.nome || 'Paciente';
      
      // Limpar campos primeiro
      if (isPaciente) {
        setDataInput('');
        setHoraInput('');
      } else if (isPsicologo) {
        setDataInput('');
        setHoraInput('');
      }
      
      // Guardar valores antes de limpar
      const dataOriginal = dataInput;
      const horaOriginal = horaInput;
      
      Alert.alert(
        '✅ Agendamento Criado!', 
        `Consulta agendada com sucesso!\n\n${isPaciente ? 'Profissional' : 'Paciente'}: ${nomeDestinatario}\nData: ${dataOriginal}\nHorário: ${horaOriginal}`,
        [{ 
          text: 'OK', 
          style: 'default',
          onPress: () => {
            // Recarregar lista de agendamentos após criar
            console.log('🔄 Recarregando agendamentos após criar...');
            setTimeout(() => {
              recarregarAgendamentos();
            }, 100);
          }
        }]
      );
    } catch (error: any) {
      console.error('❌ Erro ao criar agendamento:', error);
      console.error('❌ Response:', error?.response?.data);
      const mensagem = error?.response?.data?.erro || error?.message || 'Erro ao criar agendamento. Verifique se você está vinculado ao profissional e tente novamente.';
      Alert.alert('Erro ao Agendar', mensagem);
    } finally {
      setCreating(false);
    }
  }, [selectedProfissional, pacienteSelecionado, dataInput, horaInput, isPaciente, isPsicologo, token, user, profissionais, pacientes, recarregarAgendamentos]);

  const handleEditarAgendamento = (agendamento: any) => {
    console.log('✏️ Editando agendamento:', agendamento);
    
    // Preencher formulário com dados do agendamento
    setEditingAgendamento(agendamento.id);
    if (isPaciente) {
      setSelectedProfissional(agendamento.profissional_id || agendamento.id_profissional);
    } else if (isPsicologo) {
      setPacienteSelecionado(agendamento.usuario_id || agendamento.id_usuario);
    }
    
    // Converter data e hora para o formato do input (DD-MM-YYYY)
    try {
      if (agendamento.data_hora) {
        // Se tem data_hora (formato ISO ou datetime)
        const dataObj = new Date(agendamento.data_hora);
        if (!isNaN(dataObj.getTime())) {
          const dd = String(dataObj.getDate()).padStart(2, '0');
          const mm = String(dataObj.getMonth() + 1).padStart(2, '0');
          const yyyy = dataObj.getFullYear();
          setDataInput(`${dd}-${mm}-${yyyy}`);
          const horaStr = dataObj.toTimeString().split(' ')[0].substring(0, 5);
          setHoraInput(horaStr);
          console.log('✅ Data/hora parseada de data_hora:', `${dd}-${mm}-${yyyy}`, horaStr);
        }
      } else if (agendamento.data && agendamento.horario) {
        // Se tem data e horario separados
        // A data pode estar em formato DD-MM-YYYY (vindo do backend) ou YYYY-MM-DD
        let dataFormatada = '';
        
        if (agendamento.data.match(/^\d{2}-\d{2}-\d{4}$/)) {
          // Já está no formato DD-MM-YYYY
          dataFormatada = agendamento.data;
        } else if (agendamento.data.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Formato YYYY-MM-DD
          const [yyyy, mm, dd] = agendamento.data.split('-');
          dataFormatada = `${dd}-${mm}-${yyyy}`;
        } else {
          // Tentar parsear como Date
          const dataObj = new Date(agendamento.data);
          if (!isNaN(dataObj.getTime())) {
            const dd = String(dataObj.getDate()).padStart(2, '0');
            const mm = String(dataObj.getMonth() + 1).padStart(2, '0');
            const yyyy = dataObj.getFullYear();
            dataFormatada = `${dd}-${mm}-${yyyy}`;
          }
        }
        
        setDataInput(dataFormatada);
        // Horário pode estar em formato HH:MM:SS ou HH:MM
        const horaStr = agendamento.horario.substring(0, 5);
        setHoraInput(horaStr);
        console.log('✅ Data/hora parseada de data/horario:', dataFormatada, horaStr);
      }
    } catch (e) {
      console.error('❌ Erro ao parsear data/hora do agendamento:', e);
      Alert.alert('Erro', 'Não foi possível carregar os dados do agendamento para edição.');
    }
  };

  const handleSalvarAgendamento = useCallback(async () => {
    if (editingAgendamento) {
      // Atualizar agendamento existente
      console.log('✏️ Salvando agendamento editado:', editingAgendamento);
      
      if (!dataInput || !horaInput) {
        Alert.alert('Erro', 'Preencha data e hora.');
        return;
      }

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

      if (!token) {
        Alert.alert('Erro', 'Você precisa estar autenticado.');
        return;
      }

      try {
        setCreating(true);
        const [dd, mm, yyyy] = dataInput.split('-');
        const [hora, minuto] = horaInput.split(':');
        // Criar data diretamente em UTC para evitar problemas de timezone
        const dataUTC = new Date(Date.UTC(
          Number(yyyy), 
          Number(mm) - 1, 
          Number(dd), 
          Number(hora), 
          Number(minuto)
        ));
        const dataHoraISO = dataUTC.toISOString();
        console.log('📤 Atualizando agendamento:', { id: editingAgendamento, dataHoraISO });
        
        await atualizarAgendamento(editingAgendamento, { data_hora: dataHoraISO }, token);
        
        // Limpar formulário
        setEditingAgendamento(null);
        setDataInput('');
        setHoraInput('');
        
        Alert.alert('✅ Sucesso', 'Agendamento atualizado com sucesso!', [
          {
            text: 'OK',
            onPress: () => {
              // Recarregar lista após atualizar
              setTimeout(() => {
                recarregarAgendamentos();
              }, 100);
            }
          }
        ]);
      } catch (error: any) {
        console.error('❌ Erro ao atualizar agendamento:', error);
        const mensagem = error?.response?.data?.erro || error?.message || 'Erro ao atualizar agendamento. Tente novamente.';
        Alert.alert('Erro', mensagem);
      } finally {
        setCreating(false);
      }
    } else {
      // Criar novo agendamento
      handleCriarAgendamento();
    }
  }, [editingAgendamento, dataInput, horaInput, token, isPaciente, isPsicologo, handleCriarAgendamento, recarregarAgendamentos]);

  // Função para abrir modal de confirmação de exclusão
  const abrirModalExclusao = useCallback((agendamentoId: number) => {
    console.log('🗑️ [MODAL] Abrindo modal de exclusão para agendamento ID:', agendamentoId);
    setAgendamentoParaExcluir(agendamentoId);
    setModalConfirmarExclusao(true);
  }, []);

  // Função para fechar modal de exclusão
  const fecharModalExclusao = useCallback(() => {
    console.log('🗑️ [MODAL] Fechando modal de exclusão');
    setModalConfirmarExclusao(false);
    setAgendamentoParaExcluir(null);
  }, []);

  // Função para confirmar exclusão
  const confirmarExclusao = useCallback(async () => {
    if (!agendamentoParaExcluir || !token) {
      console.error('❌ [MODAL] Dados inválidos para exclusão');
      Alert.alert('Erro', 'Dados inválidos para exclusão.');
      fecharModalExclusao();
      return;
    }

    const agendamentoId = Number(agendamentoParaExcluir);
    if (isNaN(agendamentoId)) {
      console.error('❌ [MODAL] ID inválido:', agendamentoParaExcluir);
      Alert.alert('Erro', 'ID do agendamento inválido.');
      fecharModalExclusao();
      return;
    }

    try {
      setExcluindo(true);
      console.log('🗑️🗑️🗑️ [MODAL] ====== CONFIRMANDO EXCLUSÃO ====== 🗑️🗑️🗑️');
      console.log('🗑️ [MODAL] Agendamento ID:', agendamentoId);
      console.log('🗑️ [MODAL] Token presente:', !!token);
      console.log('🗑️ [MODAL] Chamando cancelarAgendamento...');
      
      const inicio = Date.now();
      const resultado = await cancelarAgendamento(agendamentoId, token);
      const tempoDecorrido = Date.now() - inicio;
      
      console.log('✅ [MODAL] cancelarAgendamento retornou após', tempoDecorrido, 'ms');
      console.log('✅ [MODAL] Resultado:', JSON.stringify(resultado, null, 2));
      
      // Fechar modal
      fecharModalExclusao();
      
      // Aguardar um pouco antes de recarregar
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Recarregar lista
      console.log('🔄 [MODAL] Recarregando lista...');
      await recarregarAgendamentos();
      console.log('✅ [MODAL] Lista recarregada');
      
      Alert.alert('Sucesso', 'Agendamento excluído com sucesso!');
    } catch (error: any) {
      console.error('❌❌❌ [MODAL] ====== ERRO AO EXCLUIR ====== ❌❌❌');
      console.error('❌ [MODAL] Error tipo:', typeof error);
      console.error('❌ [MODAL] Error name:', error?.name);
      console.error('❌ [MODAL] Error message:', error?.message);
      console.error('❌ [MODAL] Error stack:', error?.stack);
      console.error('❌ [MODAL] Error response:', error?.response);
      console.error('❌ [MODAL] Error response status:', error?.response?.status);
      console.error('❌ [MODAL] Error response data:', error?.response?.data);
      console.error('❌ [MODAL] Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      const mensagem = error?.response?.data?.erro || error?.response?.data?.message || error?.message || 'Erro ao excluir agendamento. Tente novamente.';
      console.error('❌ [MODAL] Mensagem final:', mensagem);
      Alert.alert('Erro ao Excluir', mensagem);
    } finally {
      setExcluindo(false);
    }
  }, [agendamentoParaExcluir, token, recarregarAgendamentos, fecharModalExclusao]);


  const profissionalSelecionado = profissionais.find((p) => Number(p.id) === Number(selectedProfissional));

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader title="Agendamentos" subtitle="Gerencie suas consultas" />
      
      
      {/* Formulário de agendamento */}
      <View style={[styles.acompanhamentoCard, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>
          {editingAgendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
        </Text>
        {editingAgendamento && (
          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginTop: -20, marginBottom: 8 }}
            onPress={() => {
              setEditingAgendamento(null);
              setDataInput('');
              setHoraInput('');
            }}
          >
            <Text style={{ color: Colors.tint, fontSize: 14 }}>Cancelar edição</Text>
          </TouchableOpacity>
        )}
        
        {/* Seleção de paciente (apenas para psicólogos) */}
        {isPsicologo && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.label}>Selecione o Paciente</Text>
              <TouchableOpacity 
                onPress={async () => {
                  console.log('🔄 [MANUAL] Recarregando pacientes...');
                  try {
                    const [psicologo, atendimentos] = await Promise.all([
                      getPsicologoMe(token!).catch(() => null),
                      listarAtendimentosDoPsicologo(token!).catch(() => [])
                    ]);
                    
                    if (psicologo?.id) {
                      setPsicologoId(psicologo.id);
                    }
                    
                    const pacientesUnicos = Array.from(
                      new Map(
                        (Array.isArray(atendimentos) ? atendimentos : [])
                          .filter((a: any) => a.status === 'ativo' || !a.status)
                          .map((a: any) => [a.id_paciente, { id: a.id_paciente, nome: a.paciente_nome || `Paciente #${a.id_paciente}` }])
                      ).values()
                    );
                    setPacientes(pacientesUnicos);
                    console.log('✅ [MANUAL] Pacientes recarregados:', pacientesUnicos.length);
                  } catch (e: any) {
                    console.error('❌ [MANUAL] Erro ao recarregar pacientes:', e);
                    Alert.alert('Erro', 'Não foi possível recarregar os pacientes.');
                  }
                }}
                style={{ padding: 8, backgroundColor: Colors.cardAlt, borderRadius: 4, borderWidth: 1, borderColor: Colors.border }}
              >
                <Text style={{ color: Colors.text, fontSize: 12, fontWeight: 'bold' }}>🔄 Recarregar</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator color={Colors.tint} size="small" style={{ marginVertical: 8 }} />
            ) : pacientes.length === 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: Colors.textSecondary, marginBottom: 8 }}>
                  Nenhum paciente vinculado encontrado.
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                  Você precisa ter pacientes vinculados para criar agendamentos.
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.hintText, { marginBottom: 8 }]}>
                  {pacientes.length} paciente(s) vinculado(s) encontrado(s)
                </Text>
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
                        setHoraInput('');
                        setShowCalendar(false);
                        setEditingAgendamento(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.profissionalCardContent} pointerEvents="none">
                        <View style={styles.profissionalCardHeader}>
                          <Text style={[
                            styles.profissionalCardNome,
                            Number(pacienteSelecionado) === Number(p.id) && styles.profissionalCardNomeSelected,
                          ]}>
                            {p.nome || `Paciente #${p.id}`}
                          </Text>
                          <View style={styles.vinculadoBadge}>
                            <Text style={styles.vinculadoBadgeText}>✓ Vinculado</Text>
                          </View>
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
              </>
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
                  console.log('🔄 [MANUAL] Recarregando psicólogos...');
                  try {
                    const profs = await listarPsicologosVinculadosPorAtendimentos(token!);
                    setProfissionais(Array.isArray(profs) ? profs : []);
                    console.log('✅ [MANUAL] Psicólogos recarregados:', Array.isArray(profs) ? profs.length : 0);
                  } catch (e: any) {
                    console.error('❌ [MANUAL] Erro ao recarregar profissionais:', e);
                    Alert.alert('Erro', 'Não foi possível recarregar os psicólogos.');
                  }
                }}
                style={{ padding: 8, backgroundColor: Colors.cardAlt, borderRadius: 4, borderWidth: 1, borderColor: Colors.border }}
              >
                <Text style={{ color: Colors.text, fontSize: 12, fontWeight: 'bold' }}>🔄 Recarregar</Text>
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
                            const novoId = Number(p.id);
                            setSelectedProfissional(novoId);
                            setDataInput(''); // Limpar data ao mudar profissional
                            setHoraInput('');
                            setShowCalendar(false);
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
        {(isPaciente && selectedProfissional) || (isPsicologo && pacienteSelecionado) ? (
          <>
            {/* Seleção de Data - Calendário Visual */}
            <Text style={styles.label}>Selecione a Data</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.tint} />
              <Text style={[styles.datePickerText, !dataInput && { color: Colors.textSecondary }]}>
                {dataInput || 'Selecione uma data'}
              </Text>
              <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Calendário Visual */}
            {showCalendar && (
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    }}
                    style={styles.calendarNavButton}
                  >
                    <Ionicons name="chevron-back" size={20} color={Colors.tint} />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
                      }
                    }}
                    style={styles.calendarNavButton}
                  >
                    <Ionicons name="chevron-forward" size={20} color={Colors.tint} />
                  </TouchableOpacity>
                </View>
                <View style={styles.calendarWeekDays}>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <Text key={day} style={styles.calendarWeekDay}>{day}</Text>
                  ))}
                </View>
                <View style={styles.calendarDays}>
                  {getMonthDays(calendarYear, calendarMonth).map((day, idx) => {
                    const dayStr = formatarData(day);
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const isPast = day < hoje;
                    const isSelected = dataInput === dayStr;
                    const isToday = formatarData(hoje) === dayStr;
                    
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.calendarDay,
                          isPast && styles.calendarDayPast,
                          isSelected && styles.calendarDaySelected,
                          isToday && !isSelected && styles.calendarDayToday,
                        ]}
                        onPress={() => {
                          if (!isPast) {
                            setDataInput(dayStr);
                            setShowCalendar(false);
                          }
                        }}
                        disabled={isPast}
                      >
                        <Text style={[
                          styles.calendarDayText,
                          isPast && styles.calendarDayTextPast,
                          isSelected && styles.calendarDayTextSelected,
                          isToday && !isSelected && styles.calendarDayTextToday,
                        ]}>
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Seleção de Horário - Slots */}
            {dataInput && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>Selecione o Horário</Text>
                <ScrollView 
                  style={styles.horariosScrollContainer}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  <View style={styles.horariosGrid}>
                    {horariosDisponiveis.map((horario) => {
                    const isSelected = horaInput === horario;
                    // Verificar se este horário já está agendado nesta data
                    const jaAgendado = agendamentos.some((ag: any) => {
                      // Normalizar data do agendamento
                      let agData = ag.data;
                      if (!agData && ag.data_hora) {
                        try {
                          const dataObj = new Date(ag.data_hora);
                          const dd = String(dataObj.getDate()).padStart(2, '0');
                          const mm = String(dataObj.getMonth() + 1).padStart(2, '0');
                          const yyyy = dataObj.getFullYear();
                          agData = `${dd}-${mm}-${yyyy}`;
                        } catch {
                          // Se falhar, tenta extrair do formato ISO
                          const partes = ag.data_hora.split('T')[0].split('-');
                          if (partes.length === 3) {
                            agData = `${partes[2]}-${partes[1]}-${partes[0]}`;
                          }
                        }
                      }
                      
                      // Normalizar hora do agendamento
                      let agHora = ag.horario;
                      if (!agHora && ag.data_hora) {
                        const horaStr = ag.data_hora.split('T')[1];
                        if (horaStr) {
                          agHora = horaStr.substring(0, 5);
                        }
                      }
                      
                      return agData === dataInput && agHora === horario && ag.status !== 'cancelado';
                    });
                    
                    return (
                      <TouchableOpacity
                        key={horario}
                        style={[
                          styles.horarioSlot,
                          isSelected && styles.horarioSlotSelected,
                          jaAgendado && styles.horarioSlotOcupado,
                        ]}
                        onPress={() => {
                          if (!jaAgendado) {
                            setHoraInput(horario);
                          }
                        }}
                        disabled={jaAgendado}
                      >
                        <Text style={[
                          styles.horarioSlotText,
                          isSelected && styles.horarioSlotTextSelected,
                          jaAgendado && styles.horarioSlotTextOcupado,
                        ]}>
                          {horario}
                        </Text>
                        {jaAgendado && (
                          <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  </View>
                </ScrollView>
                {dataInput && !horaInput && (
                  <Text style={styles.hintText}>Selecione um horário disponível acima</Text>
                )}
              </>
            )}
        
            {/* Resumo do Agendamento */}
            {dataInput && horaInput && (
              <View style={styles.resumoAgendamento}>
                <Text style={styles.resumoTitle}>📅 Resumo do Agendamento</Text>
                <View style={styles.resumoItem}>
                  <Ionicons name="person-outline" size={18} color={Colors.tint} />
                  <Text style={styles.resumoText}>
                    {isPaciente 
                      ? profissionais.find(p => p.id === selectedProfissional)?.nome || 'Profissional'
                      : pacientes.find(p => p.id === pacienteSelecionado)?.nome || 'Paciente'
                    }
                  </Text>
                </View>
                <View style={styles.resumoItem}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.tint} />
                  <Text style={styles.resumoText}>{dataInput}</Text>
                </View>
                <View style={styles.resumoItem}>
                  <Ionicons name="time-outline" size={18} color={Colors.tint} />
                  <Text style={styles.resumoText}>{horaInput}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.button, 
                { marginTop: 16, backgroundColor: Colors.tint },
                ((isPaciente && !selectedProfissional) || (isPsicologo && !pacienteSelecionado) || !dataInput || !horaInput || creating) && styles.buttonDisabled
              ]} 
              onPress={handleSalvarAgendamento}
              disabled={(isPaciente && !selectedProfissional) || (isPsicologo && !pacienteSelecionado) || !dataInput || !horaInput || creating}
              activeOpacity={0.8}
            >
              {creating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={Colors.card} size="small" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    {editingAgendamento ? 'Salvando...' : 'Criando...'}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={editingAgendamento ? "checkmark-circle" : "calendar"} size={20} color={Colors.card} style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>
                    {editingAgendamento ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* Lista de agendamentos */}
      <View style={{ marginTop: 32 }}>
        <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="list-outline" size={24} color={Colors.tint} />
            <Text style={styles.title}>Meus Agendamentos</Text>
          </View>
          <TouchableOpacity
            onPress={recarregarAgendamentos}
            style={{ padding: 8 }}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color={loading ? Colors.textSecondary : Colors.tint} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.tint} size="large" style={{ marginTop: 32 }} />
        ) : agendamentos.length === 0 ? (
          <EmptyState icon="📅" title="Nenhum agendamento encontrado" hint="Crie um novo agendamento acima" />
        ) : (
          agendamentos.map((ag, idx) => {
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
                
                {isPaciente && ag.psicologo_nome && (
                  <View style={styles.cardInfoRow}>
                    <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.profissionalNome}>Dr(a). {ag.psicologo_nome}</Text>
                  </View>
                )}
                {isPsicologo && ag.paciente_nome && (
                  <View style={styles.cardInfoRow}>
                    <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.profissionalNome}>Paciente: {ag.paciente_nome}</Text>
                  </View>
                )}
                
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
                
                {/* Botões de ação (apenas se não estiver cancelado) */}
                {!isCancelado && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      style={[styles.button, styles.editButton, { flex: 1 }]}
                      onPress={() => handleEditarAgendamento(ag)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={20} color={Colors.card} />
                      <Text style={styles.buttonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton, { flex: 1, opacity: excluindo ? 0.5 : 1 }]}
                      onPress={() => {
                        console.log('🖱️ [BOTÃO] Botão Excluir clicado para agendamento ID:', ag.id);
                        if (ag.id) {
                          abrirModalExclusao(ag.id);
                        } else {
                          Alert.alert('Erro', 'ID do agendamento não encontrado.');
                        }
                      }}
                      activeOpacity={0.7}
                      disabled={excluindo}
                    >
                      <Ionicons name="trash-outline" size={20} color={Colors.card} />
                      <Text style={styles.buttonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>

    {/* Modal de Confirmação de Exclusão */}
    <Modal
      visible={modalConfirmarExclusao}
      transparent={true}
      animationType="fade"
      onRequestClose={fecharModalExclusao}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="warning-outline" size={48} color={Colors.destructive} />
            <Text style={styles.modalTitle}>Excluir Agendamento</Text>
          </View>
          
          <Text style={styles.modalMessage}>
            Tem certeza que deseja excluir este agendamento?{'\n'}
            Esta ação não pode ser desfeita.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={fecharModalExclusao}
              disabled={excluindo}
            >
              <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm, excluindo && styles.modalButtonDisabled]}
              onPress={confirmarExclusao}
              disabled={excluindo}
            >
              {excluindo ? (
                <ActivityIndicator size="small" color={Colors.card} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={Colors.card} />
                  <Text style={styles.modalButtonTextConfirm}>Excluir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: isSmallScreen ? 16 : 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
  desc: {
    fontSize: 14,
    marginTop: 4,
    color: Colors.textSecondary,
  },
  statusContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  statusAgendado: {
    color: Colors.tint,
  },
  statusCancelado: {
    color: Colors.destructive,
  },
  statusConcluido: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.headerBlue,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.destructive,
  },
  cardCancelado: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: Colors.destructive,
  },
  button: {
    marginTop: 8,
    backgroundColor: Colors.tint,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
  input: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  label: {
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    fontSize: 14,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.tint,
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
  calendarNavButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.tint,
    borderRadius: 8,
  },
  calendarDayTextToday: {
    color: Colors.tint,
    fontWeight: '700',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  horariosScrollContainer: {
    maxHeight: 300,
    marginBottom: 8,
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 8,
  },
  horarioSlot: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horarioSlotSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  horarioSlotOcupado: {
    backgroundColor: Colors.card,
    borderColor: Colors.textSecondary,
    opacity: 0.5,
  },
  horarioSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  horarioSlotTextSelected: {
    color: Colors.card,
  },
  horarioSlotTextOcupado: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  resumoAgendamento: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.tint,
    borderStyle: 'dashed',
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  resumoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  resumoText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
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
  acompanhamentoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: Colors.text,
    fontSize: 15,
  },
  button: {
    backgroundColor: Colors.tint,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: Colors.headerBlue,
  },
  cancelButton: {
    backgroundColor: Colors.destructive,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Modal de Confirmação
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalButtonCancel: {
    backgroundColor: Colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.destructive,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonTextCancel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});