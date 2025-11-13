import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { toggleDisponibilidade, listarAtendimentosDoPsicologo, getAgendamentosPsicologo } from '../../lib/api';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { 
  getResponsivePadding, 
  getResponsiveFontSize, 
  getResponsiveGap,
  isSmallScreen,
  isXLargeScreen 
} from '../../utils/responsive';

interface Estatisticas {
  totalPacientes: number;
  totalAgendamentos: number;
  agendamentosMes: number;
  pacientesAtivos: number;
}

export default function HomePsicologoTab() {
  const { token } = useAuth();
  const [disponivel, setDisponivel] = useState<boolean>(false);
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalPacientes: 0,
    totalAgendamentos: 0,
    agendamentosMes: 0,
    pacientesAtivos: 0,
  });

  useEffect(() => {
    // fallback visual; o real vem do backend em futuras melhorias
    setDisponivel(true);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [token]);

  const carregarDados = async () => {
      if (!token) return;
    setLoading(true);
      try {
      // Carregar atendimentos
      const atendimentosData = await listarAtendimentosDoPsicologo(token);
      setAtendimentos(atendimentosData || []);

      // Carregar agendamentos do psicólogo
      let agendamentosData: any[] = [];
      try {
        agendamentosData = await getAgendamentosPsicologo(token);
        setAgendamentos(agendamentosData || []);
      } catch (e) {
        setAgendamentos([]);
      }
      
      // Calcular estatísticas
      calcularEstatisticas(atendimentosData || [], agendamentosData);

    } catch (e) {
      setAtendimentos([]);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (atendimentosData: any[], agendamentosData: any[]) => {
    const pacientesUnicos = new Set(atendimentosData.map((a) => a.id_paciente));
    const pacientesAtivos = atendimentosData.filter((a) => a.status === 'ativo').length;
    
    const totalAgendamentos = agendamentosData.length;
    const mesAtual = new Date();
    const agendamentosMes = agendamentosData.filter((a) => {
      try {
        const dataAgendamento = new Date(a.data_hora);
        return dataAgendamento.getMonth() === mesAtual.getMonth() && 
               dataAgendamento.getFullYear() === mesAtual.getFullYear();
      } catch {
        return false;
      }
    }).length;
    
    setEstatisticas({
      totalPacientes: pacientesUnicos.size,
      totalAgendamentos,
      agendamentosMes,
      pacientesAtivos,
    });
  };

  const handleToggle = async (value: boolean) => {
    setDisponivel(value);
    if (!token) return;
    try {
      await toggleDisponibilidade(value, token);
    } catch {}
  };

  const StatCard = ({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle?: string; icon?: string }) => (
    <View style={styles.statCard}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <AppHeader title="Painel do Psicólogo" subtitle="Gerencie seus pacientes e agendamentos" />
      <View style={styles.row}>
        <Text style={styles.label}>Disponível</Text>
        <Switch value={disponivel} onValueChange={handleToggle} />
      </View>
      
      {loading ? (
        <ActivityIndicator color={Colors.tint} size="large" style={{ marginTop: 50 }} />
      ) : (
        <>
          {/* Cards de Estatísticas Principais */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Pacientes"
              value={estatisticas.totalPacientes}
              subtitle={`${estatisticas.pacientesAtivos} ativos`}
              icon="👥"
            />
            <StatCard
              title="Agendamentos"
              value={estatisticas.totalAgendamentos}
              subtitle={`${estatisticas.agendamentosMes} este mês`}
              icon="📅"
            />
          </View>

          {/* Resumo de Pacientes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo de Pacientes</Text>
            {atendimentos.length === 0 ? (
              <EmptyState icon="👥" title="Nenhum paciente vinculado" hint="Aceite solicitações para começar" />
            ) : (
              <View style={styles.pacientesResumo}>
                {Array.from(new Map(atendimentos.map((a) => [a.id_paciente, a])).values())
                  .slice(0, 5)
                  .map((atendimento: any) => (
                    <View key={atendimento.id} style={styles.pacienteResumoCard}>
                      <View style={styles.pacienteResumoHeader}>
                        <Text style={styles.pacienteResumoNome}>
                          {atendimento.paciente_nome || `Paciente #${atendimento.id_paciente}`}
                    </Text>
                        <View
                  style={[
                            styles.statusBadge,
                            atendimento.status === 'ativo' ? styles.statusAtivo : styles.statusInativo,
                  ]}
                >
                  <Text
                    style={[
                              styles.statusText,
                              atendimento.status === 'ativo' ? styles.statusTextAtivo : styles.statusTextInativo,
                    ]}
                  >
                            {atendimento.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                          </Text>
                        </View>
                      </View>
                      {atendimento.data_inicio && (
                        <Text style={styles.pacienteResumoData}>
                          Desde: {new Date(atendimento.data_inicio).toLocaleDateString('pt-BR')}
                  </Text>
                      )}
                    </View>
              ))}
              </View>
            )}
          </View>

          {/* Agendamentos Recentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agendamentos Recentes</Text>
            {agendamentos.length === 0 ? (
              <EmptyState icon="📅" title="Nenhum agendamento encontrado" />
            ) : (
              <View style={styles.agendamentosList}>
                {agendamentos.slice(0, 5).map((ag: any, idx: number) => (
                  <View key={ag.id || idx} style={styles.agendamentoCard}>
                    <View style={styles.agendamentoHeader}>
                      <Text style={styles.agendamentoData}>
                        {ag.data || 'Data não informada'}
                      </Text>
                      <Text style={styles.agendamentoHora}>{ag.horario || ''}</Text>
                    </View>
                    {ag.paciente_nome && (
                      <Text style={styles.agendamentoPaciente}>{ag.paciente_nome}</Text>
        )}
                    <View
          style={[
                        styles.statusBadge,
                        ag.status === 'concluido' || ag.status === 'concluído'
                          ? styles.statusConcluido
                          : ag.status === 'cancelado'
                          ? styles.statusCancelado
                          : styles.statusAgendado,
                      ]}
        >
                      <Text style={styles.statusText}>{ag.status || 'agendado'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
      </View>
        </>
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
    padding: getResponsivePadding(24),
    paddingBottom: isSmallScreen ? 120 : 150,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: getResponsivePadding(12),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: getResponsiveGap(24),
    minHeight: isSmallScreen ? 48 : 56,
  },
  label: {
    color: Colors.text,
    fontSize: getResponsiveFontSize(14),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveGap(16),
    gap: getResponsiveGap(12),
    flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
  },
  statCard: {
    flex: isSmallScreen ? 1 : 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: getResponsivePadding(isSmallScreen ? 16 : 20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minWidth: isSmallScreen ? '48%' : undefined,
    marginBottom: isSmallScreen ? getResponsiveGap(8) : 0,
    overflow: 'visible',
    minHeight: isSmallScreen ? 120 : 140,
  },
  statIcon: {
    fontSize: getResponsiveFontSize(isSmallScreen ? 28 : 32),
    marginBottom: getResponsiveGap(8),
  },
  statValue: {
    fontSize: getResponsiveFontSize(isSmallScreen ? 28 : 32),
    fontWeight: '700',
    color: Colors.tint,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: getResponsiveFontSize(isSmallScreen ? 12 : 14),
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: getResponsiveFontSize(12),
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: getResponsiveGap(24),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(isSmallScreen ? 16 : 18),
    fontWeight: '700',
    color: Colors.text,
    marginBottom: getResponsiveGap(16),
  },
  pacientesResumo: {
    gap: getResponsiveGap(12),
  },
  pacienteResumoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: getResponsivePadding(16),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pacienteResumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveGap(8),
    flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
  },
  pacienteResumoNome: {
    fontSize: getResponsiveFontSize(isSmallScreen ? 14 : 16),
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    flexShrink: 1,
  },
  pacienteResumoData: {
    fontSize: getResponsiveFontSize(12),
    color: Colors.textSecondary,
  },
  agendamentosList: {
    gap: getResponsiveGap(12),
  },
  agendamentoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: getResponsivePadding(16),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  agendamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveGap(8),
    flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
  },
  agendamentoData: {
    fontSize: getResponsiveFontSize(isSmallScreen ? 14 : 16),
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  agendamentoHora: {
    fontSize: getResponsiveFontSize(14),
    color: Colors.textSecondary,
  },
  agendamentoPaciente: {
    fontSize: getResponsiveFontSize(14),
    color: Colors.textSecondary,
    marginBottom: getResponsiveGap(8),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: getResponsivePadding(4),
    paddingHorizontal: getResponsivePadding(12),
    borderRadius: 12,
  },
  statusAtivo: {
    backgroundColor: '#E8F5E9',
  },
  statusInativo: {
    backgroundColor: '#F5F5F5',
  },
  statusConcluido: {
    backgroundColor: '#E8F5E9',
  },
  statusCancelado: {
    backgroundColor: '#FFEBEE',
  },
  statusAgendado: {
    backgroundColor: Colors.cardAlt,
  },
  statusText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTextAtivo: {
    color: '#4CAF50',
  },
  statusTextInativo: {
    color: Colors.textSecondary,
  },
});
