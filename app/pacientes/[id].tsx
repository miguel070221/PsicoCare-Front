import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '../../constants/Colors';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentosUsuario, getAcompanhamentosPaciente, listarAtendimentosDoPsicologo, listarNotasSessoes, getAgendamentosPaciente as getAgendamentosPacienteEspecifico } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function PacienteDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pacienteId = Number(id);
  const { token, user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  const [dadosPaciente, setDadosPaciente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!token || !pacienteId) {
        console.log('❌ Token ou pacienteId ausente:', { token: !!token, pacienteId });
        setLoading(false);
        return;
      }
      
      console.log('🔍 Buscando dados do paciente:', pacienteId);
      setLoading(true);
      
      try {
        // Buscar agendamentos do paciente
        console.log('📅 Buscando agendamentos...');
        // Se for psicólogo, usar a rota específica que verifica vínculo
        // Se for paciente, usar a rota normal (que filtra pelo token)
        let ags;
        if (user?.role === 'psicologo') {
          console.log('📅 Psicólogo visualizando paciente - usando rota específica');
          ags = await getAgendamentosPacienteEspecifico(pacienteId, token);
        } else {
          console.log('📅 Paciente visualizando seus próprios agendamentos');
          ags = await getAgendamentosUsuario(pacienteId, token);
        }
        console.log('📅 Agendamentos encontrados:', ags?.length || 0);
        setAgendamentos(ags || []);
      } catch (e: any) {
        console.error('❌ Erro ao buscar agendamentos:', e);
        // Se for erro de permissão (403), mostrar mensagem mais clara
        if (e?.response?.status === 403) {
          console.error('❌ Sem permissão para visualizar agendamentos deste paciente');
        }
        setAgendamentos([]);
      }
      
      try {
        // Buscar acompanhamentos do paciente
        console.log('📊 Buscando acompanhamentos...');
        const acs = await getAcompanhamentosPaciente(pacienteId, token);
        console.log('📊 Acompanhamentos encontrados:', acs?.length || 0);
        setAcompanhamentos((acs || []).map((a: any) => ({ ...a, dataHora: a.data_hora ? new Date(a.data_hora).toLocaleString('pt-BR') : '' })));
      } catch (e: any) {
        console.error('❌ Erro ao buscar acompanhamentos:', e);
        setAcompanhamentos([]);
      }
      
      // Se for psicólogo, buscar notas do paciente
      if (user?.role === 'psicologo') {
        try {
          console.log('📝 Buscando notas do paciente...');
          const notasData = await listarNotasSessoes(pacienteId, token);
          console.log('📝 Notas encontradas:', notasData?.length || 0);
          setNotas(notasData || []);
        } catch (e: any) {
          console.error('❌ Erro ao buscar notas:', e);
          setNotas([]);
        }
      }
      
      try {
        // Buscar dados do paciente através dos atendimentos
        console.log('👤 Buscando dados do paciente...');
        const atendimentos = await listarAtendimentosDoPsicologo(token);
        console.log('👤 Atendimentos encontrados:', atendimentos?.length || 0);
        const atendimento = atendimentos.find((a: any) => a.id_paciente === pacienteId);
        if (atendimento) {
          console.log('✅ Atendimento encontrado para paciente:', atendimento.paciente_nome);
          setDadosPaciente({
            nome: atendimento.paciente_nome,
            preferencia_comunicacao: atendimento.preferencia_comunicacao,
            contato_preferido: atendimento.contato_preferido,
            link_whatsapp: atendimento.link_whatsapp,
            link_telegram: atendimento.link_telegram,
            link_discord: atendimento.link_discord,
            link_email: atendimento.link_email,
            telefone: atendimento.telefone,
          });
        } else {
          console.log('⚠️ Nenhum atendimento encontrado para este paciente');
        }
      } catch (e: any) {
        console.error('❌ Erro ao buscar dados do paciente:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, pacienteId, user?.role]);
  
  // Função para copiar texto para a área de transferência
  const copiarParaClipboard = async (texto: string, tipo: string) => {
    if (!texto) return;
    try {
      if (Platform.OS === 'web') {
        // Para web, usar a API do navegador
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(texto);
        } else {
          // Fallback para navegadores antigos
          const textArea = document.createElement('textarea');
          textArea.value = texto;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } else {
        // Para mobile (Expo)
        await Clipboard.setStringAsync(texto);
      }
      Alert.alert('Copiado!', `${tipo} copiado para a área de transferência.`);
    } catch (e) {
      console.error('Erro ao copiar:', e);
      Alert.alert('Erro', 'Não foi possível copiar.');
    }
  };
  
  // Função para verificar se é um número (apenas dígitos)
  const isNumero = (texto: string): boolean => {
    return /^\d+$/.test(texto.replace(/\s+/g, ''));
  };
  
  // Função para renderizar link de contato
  const renderLinkContato = (label: string, valor: string | null | undefined, icone: string, cor: string) => {
    if (!valor) return null;
    const isNum = isNumero(valor);
    return (
      <TouchableOpacity
        style={[styles.linkContato, { borderLeftColor: cor }]}
        onPress={() => copiarParaClipboard(valor, label)}
        activeOpacity={0.7}
      >
        <View style={styles.linkContatoContent}>
          <Ionicons name={icone as any} size={20} color={cor} />
          <View style={styles.linkContatoText}>
            <Text style={styles.linkContatoLabel}>{label}</Text>
            <Text style={styles.linkContatoValor} numberOfLines={1}>{valor}</Text>
          </View>
          <Ionicons name="copy-outline" size={18} color={Colors.textSecondary} />
        </View>
        {isNum && (
          <Text style={styles.linkContatoHint}>Toque para copiar número</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{dadosPaciente?.nome || `Paciente #${pacienteId}`}</Text>
      
      {/* Seção de Contatos */}
      {(dadosPaciente?.link_whatsapp || dadosPaciente?.link_telegram || dadosPaciente?.link_discord || 
        dadosPaciente?.link_email || dadosPaciente?.telefone || dadosPaciente?.contato_preferido) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contatos de Comunicação</Text>
          {dadosPaciente.preferencia_comunicacao && (
            <Text style={styles.preferenceText}>
              Preferência: {dadosPaciente.preferencia_comunicacao}
            </Text>
          )}
          {renderLinkContato('WhatsApp', dadosPaciente.link_whatsapp, 'logo-whatsapp', '#25D366')}
          {renderLinkContato('Telegram', dadosPaciente.link_telegram, 'logo-telegram', '#0088cc')}
          {renderLinkContato('Discord', dadosPaciente.link_discord, 'logo-discord', '#5865F2')}
          {renderLinkContato('Email', dadosPaciente.link_email, 'mail-outline', Colors.tint)}
          {renderLinkContato('Telefone', dadosPaciente.telefone, 'call-outline', Colors.tint)}
          {renderLinkContato('Contato Preferido', dadosPaciente.contato_preferido, 'chatbubble-outline', Colors.textSecondary)}
        </View>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Consultas</Text>
      {agendamentos.length === 0 ? (
        <Text style={styles.note}>Nenhuma consulta encontrada.</Text>
      ) : agendamentos.map((a, idx) => (
        <View key={a.id || idx} style={styles.card}>
          <Text style={styles.cardName}>{a.data} {a.horario}</Text>
          <Text style={styles.cardMeta}>Status: {a.status || '-'}</Text>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Autoavaliações</Text>
      {acompanhamentos.length === 0 ? (
        <Text style={styles.note}>Nenhum registro.</Text>
      ) : acompanhamentos.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.cardName}>{a.dataHora}</Text>
          <Text style={styles.cardMeta}>Sono: {a.qualidade_sono || '-'}</Text>
          <Text style={{ color: Colors.text, marginTop: 4 }}>Humor: {a.humor || '-'}</Text>
          <Text style={{ color: Colors.text }}>{a.texto}</Text>
        </View>
      ))}

      {/* Seção de Notas (apenas para psicólogos) */}
      {user?.role === 'psicologo' && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Notas de Sessões</Text>
          {loading ? (
            <Text style={styles.note}>Carregando notas...</Text>
          ) : notas.length === 0 ? (
            <Text style={styles.note}>Nenhuma nota encontrada.</Text>
          ) : (
            notas.map((nota) => (
              <View key={nota.id} style={styles.card}>
                <Text style={styles.cardName}>{nota.titulo || 'Sem título'}</Text>
                {nota.data_sessao && (
                  <Text style={styles.cardMeta}>
                    Data da sessão: {new Date(nota.data_sessao).toLocaleDateString('pt-BR')}
                  </Text>
                )}
                {nota.created_at && (
                  <Text style={styles.cardMeta}>
                    Criada em: {new Date(nota.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                )}
                <Text style={{ color: Colors.text, marginTop: 8 }}>{nota.conteudo}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 4, marginBottom: 8 },
  preferenceText: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  note: { color: Colors.textSecondary },
  card: { backgroundColor: Colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cardName: { color: Colors.text, fontWeight: '700' },
  cardMeta: { color: Colors.textSecondary, marginTop: 2 },
  linkContato: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkContatoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkContatoText: {
    flex: 1,
    marginLeft: 12,
  },
  linkContatoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  linkContatoValor: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  linkContatoHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});












