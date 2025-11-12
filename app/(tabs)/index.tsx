import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentosUsuario, getAcompanhamentos, listarPsicologosVinculadosPorAtendimentos } from '../../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);
  const [psicologosVinculados, setPsicologosVinculados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const verify = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/login');
        }
      };
      verify();
    }, [router])
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !token) return;
      setLoading(true);
      try {
        const [ags, acs, profs] = await Promise.all([
          getAgendamentosUsuario(user.id, token).catch(() => []),
          getAcompanhamentos(token).catch(() => []),
          listarPsicologosVinculadosPorAtendimentos(token).catch(() => [])
        ]);
        setAgendamentos(ags || []);
        setAcompanhamentos(acs || []);
        setPsicologosVinculados(profs || []);
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
        setAgendamentos([]);
        setAcompanhamentos([]);
        setPsicologosVinculados([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, token]);

  // Memoizar cálculos para melhor performance
  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  
  const agendamentosFuturos = useMemo(() => agendamentos.filter((a) => {
    // Tentar pegar data_hora primeiro, depois data
    const dataHora = a.data_hora || a.data;
    if (!dataHora) return false;
    
    try {
      let dataAgendamento: Date;
      
      if (a.data_hora) {
        // Formato ISO completo
        dataAgendamento = new Date(a.data_hora);
      } else if (a.data && a.horario) {
        // Formato separado: data + horario
        const [dd, mm, yyyy] = a.data.split('-');
        const [hh, min] = a.horario.split(':');
        dataAgendamento = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
      } else if (a.data) {
        // Apenas data
        const [dd, mm, yyyy] = a.data.split('-');
        dataAgendamento = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      } else {
        return false;
      }
      
      dataAgendamento.setHours(0, 0, 0, 0);
      return dataAgendamento >= hoje;
    } catch {
      return false;
    }
  }).sort((a, b) => {
    // Ordenar por data/hora
    try {
      const getDataHora = (ag: any) => {
        if (ag.data_hora) return new Date(ag.data_hora).getTime();
        if (ag.data && ag.horario) {
          const [dd, mm, yyyy] = ag.data.split('-');
          const [hh, min] = ag.horario.split(':');
          return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min)).getTime();
        }
        if (ag.data) {
          const [dd, mm, yyyy] = ag.data.split('-');
          return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
        }
        return 0;
      };
      
      return getDataHora(a) - getDataHora(b);
    } catch {
      return 0;
    }
  }), [agendamentos]);

  const proximoAgendamento = useMemo(() => agendamentosFuturos[0], [agendamentosFuturos]);
  const totalAgendamentos = agendamentos.length;
  const totalAcompanhamentos = acompanhamentos.length;
  const totalPsicologos = psicologosVinculados.length;
  const ultimoAcompanhamento = useMemo(() => acompanhamentos[0], [acompanhamentos]);

  const dataHoje = useMemo(() => hoje.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    weekday: 'long'
  }), [hoje]);

  const formatarDataHora = (data: string, horario?: string) => {
    if (!data) return 'Data não informada';
    try {
      // Tentar diferentes formatos de data
      let dataFormatada = '';
      
      // Formato DD-MM-YYYY
      if (data.includes('-')) {
        const partes = data.split('-');
        if (partes.length === 3) {
          dataFormatada = `${partes[0]}/${partes[1]}/${partes[2]}`;
        } else {
          dataFormatada = data;
        }
      }
      // Formato ISO (YYYY-MM-DD)
      else if (data.includes('T') || data.match(/^\d{4}-\d{2}-\d{2}/)) {
        const dataObj = new Date(data);
        if (!isNaN(dataObj.getTime())) {
          dataFormatada = dataObj.toLocaleDateString('pt-BR');
        } else {
          dataFormatada = data;
        }
      }
      // Outros formatos
      else {
        const dataObj = new Date(data);
        if (!isNaN(dataObj.getTime())) {
          dataFormatada = dataObj.toLocaleDateString('pt-BR');
        } else {
          dataFormatada = data;
        }
      }
      
      return horario ? `${dataFormatada} às ${horario}` : dataFormatada;
    } catch {
      return data;
    }
  };

  const nomePsicologo = proximoAgendamento?.psicologo_nome || proximoAgendamento?.profissional_nome || 'Psicólogo';

  if (user?.role === 'psicologo') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.hello}>Esta seção é para pacientes.</Text>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Início" subtitle="Painel do Paciente" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.tint} />
          <Text style={styles.loadingText}>Carregando informações...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <AppHeader title="Início" subtitle="Painel do Paciente" />
      
      {/* Boas-vindas */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Olá, {user?.nome || 'Paciente'}!</Text>
        <Text style={styles.dateText}>{dataHoje}</Text>
      </View>

      {/* Cards de estatísticas */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color={Colors.tint} />
          <Text style={styles.statValue}>{totalAgendamentos}</Text>
          <Text style={styles.statLabel}>Agendamentos</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text-outline" size={24} color={Colors.tint} />
          <Text style={styles.statValue}>{totalAcompanhamentos}</Text>
          <Text style={styles.statLabel}>Acompanhamentos</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color={Colors.tint} />
          <Text style={styles.statValue}>{totalPsicologos}</Text>
          <Text style={styles.statLabel}>Psicólogos</Text>
        </View>
      </View>

      {/* Próximo agendamento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Próximo Agendamento</Text>
        {proximoAgendamento ? (
          <View style={styles.nextAppointmentCard}>
            <View style={styles.appointmentHeader}>
              <Ionicons name="calendar" size={32} color={Colors.tint} />
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentDate}>
                  {formatarDataHora(proximoAgendamento.data, proximoAgendamento.horario)}
                </Text>
                {nomePsicologo && (
                  <Text style={styles.appointmentPsychologist}>
                    {nomePsicologo}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.viewDetailsBtn}
              onPress={() => router.push('/(tabs)/agendamentos')}
            >
              <Text style={styles.viewDetailsText}>Ver detalhes</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.tint} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyCardText}>Nenhum agendamento próximo</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/agendamentos')}
            >
              <Text style={styles.actionButtonText}>Agendar consulta</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Último acompanhamento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Último Acompanhamento</Text>
        {ultimoAcompanhamento ? (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              {new Date(ultimoAcompanhamento.data_hora).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            {ultimoAcompanhamento.texto && (
              <Text style={styles.cardSubtext} numberOfLines={2}>
                {ultimoAcompanhamento.texto}
              </Text>
            )}
            <TouchableOpacity 
              style={styles.viewDetailsBtn}
              onPress={() => router.push('/(tabs)/avaliacoes')}
            >
              <Text style={styles.viewDetailsText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyCardText}>Nenhum acompanhamento registrado</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/avaliacoes')}
            >
              <Text style={styles.actionButtonText}>Criar acompanhamento</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Ações rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: Colors.tint }]}
            onPress={() => router.push('/(tabs)/agendamentos')}
          >
            <Ionicons name="calendar" size={28} color={Colors.card} />
            <Text style={[styles.actionCardText, { color: Colors.card }]}>Agendamentos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: Colors.headerBlue }]}
            onPress={() => router.push('/(tabs)/avaliacoes')}
          >
            <Ionicons name="clipboard-outline" size={28} color={Colors.card} />
            <Text style={[styles.actionCardText, { color: Colors.card }]}>Avaliações</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: Colors.destructive }]}
            onPress={() => router.push('/(tabs)/emergencias')}
          >
            <Ionicons name="warning" size={28} color={Colors.card} />
            <Text style={[styles.actionCardText, { color: Colors.card }]}>Emergência</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: Colors.cardAlt }]}
            onPress={() => router.push('/(tabs)/psicologos')}
          >
            <Ionicons name="people" size={28} color={Colors.text} />
            <Text style={styles.actionCardText}>Psicólogos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    padding: isSmallScreen ? 16 : 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  nextAppointmentCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.tint,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  appointmentPsychologist: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: Colors.tint,
    fontWeight: '600',
    marginRight: 4,
  },
  actionButton: {
    backgroundColor: Colors.tint,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  actionButtonText: {
    color: Colors.card,
    fontWeight: '600',
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
});
