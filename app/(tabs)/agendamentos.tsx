// Localização: (app)/agendamentos.tsx

import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentosUsuario, listarPsicologosPublicos, criarAgendamento } from '../../lib/api';
import { useLocalSearchParams } from 'expo-router';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';

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

  useEffect(() => {
    const fetchAgendamentos = async () => {
      if (!user || !token) return;
      setLoading(true);
      try {
        const data = await getAgendamentosUsuario(user.id, token);
        setAgendamentos(data);
        // buscar lista de profissionais
        try {
          const profs = await listarPsicologosPublicos();
          setProfissionais(profs);
          const pid = searchParams.profissionalId;
          if (pid) setSelectedProfissional(Number(pid));
        } catch (e) {
          setProfissionais([]);
        }
      } catch (e) {
        setAgendamentos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgendamentos();
  }, [user, token]);

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
    // Validações
    if (!selectedProfissional) {
      Alert.alert('Erro', 'Selecione um profissional.');
      return;
    }

    if (!dataInput || !dataInput.match(/^\d{2}-\d{2}-\d{4}$/)) {
      Alert.alert('Erro', 'Digite a data no formato DD-MM-AAAA.');
      return;
    }

    if (!validarDataFutura(dataInput)) {
      Alert.alert('Erro', 'A data deve ser hoje ou no futuro.');
      return;
    }

    if (!horaInput || !validarHora(horaInput)) {
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
      const iso = new Date(`${yyyy}-${mm}-${dd}T${horaInput}:00`).toISOString();
      
      await criarAgendamento({ profissional_id: selectedProfissional, data_hora: iso }, token);
      
      Alert.alert('Sucesso', 'Agendamento criado com sucesso!');
      
      // Recarregar lista de agendamentos
      const data = await getAgendamentosUsuario(user.id, token);
      setAgendamentos(data);
      
      // Limpar formulário
      setDataInput('');
      setHoraInput('');
      setSelectedProfissional(null);
    } catch (error: any) {
      const mensagem = error?.message || error?.response?.data?.erro || 'Erro ao criar agendamento. Tente novamente.';
      Alert.alert('Erro', mensagem);
    } finally {
      setCreating(false);
    }
  };


  const profissionalSelecionado = profissionais.find((p) => p.id === selectedProfissional);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <AppHeader title="Agendamentos" subtitle="Gerencie suas consultas" />
      
      {/* Formulário de agendamento */}
      <View style={[styles.acompanhamentoCard, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>Novo Agendamento</Text>
        
        <Text style={styles.label}>Selecione o Profissional</Text>
        {profissionais.length === 0 ? (
          loading ? (
            <ActivityIndicator color={Colors.tint} size="small" style={{ marginVertical: 8 }} />
          ) : (
            <Text style={{ color: Colors.textSecondary, marginBottom: 12 }}>Nenhum profissional disponível no momento.</Text>
          )
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profissionaisList}>
            {profissionais.map((p) => (
              <TouchableOpacity 
                key={p.id} 
                style={[
                  styles.profissionalBtn, 
                  selectedProfissional === p.id && styles.profissionalBtnSelected,
                  !p.disponivel && styles.profissionalBtnDisabled
                ]} 
                onPress={() => {
                  if (p.disponivel) {
                    setSelectedProfissional(p.id);
                  }
                }}
                disabled={!p.disponivel}
              >
                <Text style={[
                  styles.profissionalBtnText,
                  selectedProfissional === p.id && styles.profissionalBtnTextSelected,
                  !p.disponivel && styles.profissionalBtnTextDisabled
                ]}>
                  {p.nome}
                </Text>
                {!p.disponivel && (
                  <Text style={styles.disponivelText}>Indisponível</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {profissionalSelecionado && (
          <>
            <Text style={styles.label}>Data da Consulta</Text>
            <TouchableOpacity 
              style={styles.inputArea} 
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Text style={{ color: dataInput ? Colors.text : Colors.textSecondary }}>
                {dataInput || 'Selecione uma data (DD-MM-AAAA)'}
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
                
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      isPast && styles.calendarDayPast
                    ]} 
                    onPress={() => {
                      if (!isPast) {
                        setDataInput(formatarData(d));
                        setShowCalendar(false);
                      }
                    }}
                    disabled={isPast}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextSelected,
                      isPast && styles.calendarDayTextPast
                    ]}>
                      {d.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity 
              style={[styles.button, { marginTop: 8, backgroundColor: Colors.cardAlt }]} 
              onPress={() => setShowCalendar(false)}
            >
              <Text style={[styles.buttonText, { color: Colors.text }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={styles.label}>Hora da Consulta (HH:MM)</Text>
        <TextInput 
          style={styles.inputArea} 
          placeholder="14:30" 
          value={horaInput} 
          onChangeText={setHoraInput}
          keyboardType="numeric"
          maxLength={5}
        />
        <Text style={styles.hintText}>Exemplo: 09:00, 14:30, 18:00</Text>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { marginTop: 16, backgroundColor: Colors.tint },
            (!selectedProfissional || !dataInput || !horaInput || creating) && styles.buttonDisabled
          ]} 
          onPress={handleCriarAgendamento}
          disabled={!selectedProfissional || !dataInput || !horaInput || creating}
        >
          {creating ? (
            <ActivityIndicator color={Colors.card} />
          ) : (
            <Text style={styles.buttonText}>Criar Agendamento</Text>
          )}
        </TouchableOpacity>
          </>
        )}
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
              {ag.psicologo_nome && (
                <Text style={styles.profissionalNome}>Dr(a). {ag.psicologo_nome}</Text>
              )}
              <View style={styles.statusContainer}>
                <Text style={[
                  styles.status,
                  ag.status === 'agendado' && styles.statusAgendado,
                  ag.status === 'cancelado' && styles.statusCancelado,
                  ag.status === 'concluido' && styles.statusConcluido
                ]}>
                  {ag.status || 'agendado'}
                </Text>
              </View>
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
  profissionaisList: {
    marginBottom: 8,
  },
  profissionalBtn: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
    alignItems: 'center',
  },
  profissionalBtnSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  profissionalBtnDisabled: {
    backgroundColor: Colors.cardAlt,
    opacity: 0.5,
  },
  profissionalBtnText: {
    color: Colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  profissionalBtnTextSelected: {
    color: Colors.card,
    fontWeight: '600',
  },
  profissionalBtnTextDisabled: {
    color: Colors.textSecondary,
  },
  disponivelText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
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
});