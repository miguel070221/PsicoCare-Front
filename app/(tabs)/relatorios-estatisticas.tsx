import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { listarAtendimentosDoPsicologo, getAgendamentosPsicologo } from '../../lib/api';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';

interface Estatisticas {
  totalPacientes: number;
  totalAgendamentos: number;
  agendamentosMes: number;
  agendamentosConcluidos: number;
  agendamentosCancelados: number;
  taxaConclusao: number;
  pacientesAtivos: number;
}

export default function RelatoriosEstatisticasTab() {
  const { token } = useAuth();
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalPacientes: 0,
    totalAgendamentos: 0,
    agendamentosMes: 0,
    agendamentosConcluidos: 0,
    agendamentosCancelados: 0,
    taxaConclusao: 0,
    pacientesAtivos: 0,
  });

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
    
    const agendamentosConcluidos = agendamentosData.filter((a) => a.status === 'concluido' || a.status === 'concluído').length;
    const agendamentosCancelados = agendamentosData.filter((a) => a.status === 'cancelado').length;
    const taxaConclusao = totalAgendamentos > 0 ? (agendamentosConcluidos / totalAgendamentos) * 100 : 0;

    setEstatisticas({
      totalPacientes: pacientesUnicos.size,
      totalAgendamentos,
      agendamentosMes,
      agendamentosConcluidos,
      agendamentosCancelados,
      taxaConclusao: Math.round(taxaConclusao),
      pacientesAtivos,
    });
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
      <AppHeader title="Relatórios e Estatísticas" subtitle="Visão geral do seu trabalho" />
      
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

          <View style={styles.statsGrid}>
            <StatCard
              title="Concluídos"
              value={estatisticas.agendamentosConcluidos}
              subtitle={`${estatisticas.taxaConclusao}% taxa`}
              icon="✅"
            />
            <StatCard
              title="Cancelados"
              value={estatisticas.agendamentosCancelados}
              icon="❌"
            />
          </View>

          {/* Taxa de Conclusão */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Taxa de Conclusão</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${estatisticas.taxaConclusao}%` }]} />
            </View>
            <Text style={styles.progressText}>{estatisticas.taxaConclusao}%</Text>
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
    padding: 24,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.tint,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  progressSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: Colors.cardAlt,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.tint,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  pacientesResumo: {
    gap: 12,
  },
  pacienteResumoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pacienteResumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pacienteResumoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  pacienteResumoData: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  agendamentosList: {
    gap: 12,
  },
  agendamentoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  agendamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agendamentoData: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  agendamentoHora: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  agendamentoPaciente: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
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
    fontSize: 12,
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

