import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Alert } from 'react-native';
// Removido DateTimePicker: mini calendário sem dependências
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { toggleDisponibilidade, listarAtendimentosDoPsicologo, criarAgendamento } from '../../lib/api';

export default function HomePsicologoTab() {
  const { user, token } = useAuth();
  const [disponivel, setDisponivel] = useState<boolean>(false);
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<number | null>(null);
  const [dataInput, setDataInput] = useState(''); // DD-MM-AAAA
  const [horaInput, setHoraInput] = useState(''); // HH:MM
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

  const getMonthDays = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  useEffect(() => {
    // fallback visual; o real vem do backend em futuras melhorias
    setDisponivel(true);
  }, []);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const data = await listarAtendimentosDoPsicologo(token);
        setAtendimentos(data || []);
      } catch {
        setAtendimentos([]);
      }
    })();
  }, [token]);

  const handleToggle = async (value: boolean) => {
    setDisponivel(value);
    if (!token) return;
    try {
      await toggleDisponibilidade(value, token);
    } catch {}
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

  const handleAgendarParaPaciente = async () => {
    if (!token) {
      Alert.alert('Erro', 'Você precisa estar autenticado.');
      return;
    }

    if (!pacienteSelecionado) {
      Alert.alert('Erro', 'Selecione um paciente.');
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

    try {
      // Converter DD-MM-AAAA para ISO
      const [dd, mm, yyyy] = dataInput.split('-');
      const iso = new Date(`${yyyy}-${mm}-${dd}T${horaInput}:00`).toISOString();
      
      await criarAgendamento({ data_hora: iso, paciente_id: pacienteSelecionado }, token);
      
      Alert.alert('Sucesso', 'Agendamento criado com sucesso!');
      
      // Limpar campos
      setPacienteSelecionado(null);
      setDataInput('');
      setHoraInput('');
    } catch (e: any) {
      const mensagem = e?.message || e?.response?.data?.erro || 'Falha ao criar agendamento. Tente novamente.';
      Alert.alert('Erro', mensagem);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Painel do Psicólogo</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Disponível</Text>
        <Switch value={disponivel} onValueChange={handleToggle} />
      </View>
      <Text style={[styles.title, { marginTop: 16 }]}>Pacientes vinculados</Text>
      {atendimentos.length === 0 ? (
        <Text style={styles.note}>Nenhum atendimento ativo.</Text>
      ) : (
        atendimentos.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardName}>{a.paciente_nome || `Paciente #${a.id_paciente}`}</Text>
            <Text style={styles.cardMeta}>Desde: {new Date(a.data_inicio).toLocaleDateString('pt-BR')}</Text>
            {a.link_consulta ? (
              <Text style={styles.cardMeta}>Link: {a.link_consulta}</Text>
            ) : null}
            <TouchableOpacity style={styles.selectBtn} onPress={() => setPacienteSelecionado(a.id_paciente)}>
              <Text style={styles.selectBtnText}>{pacienteSelecionado === a.id_paciente ? 'Selecionado' : 'Selecionar'}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Agendar consulta</Text>
        <Text style={styles.formLabel}>Paciente</Text>
        <Text style={styles.formHint}>{
          pacienteSelecionado
            ? `Paciente ID: ${pacienteSelecionado}`
            : 'Selecione um paciente na lista acima'
        }</Text>
        <Text style={styles.formLabel}>Data (DD-MM-AAAA)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowCalendar(!showCalendar)}>
          <Text style={{ color: dataInput ? Colors.text : Colors.textSecondary }}>
            {dataInput || 'Selecione uma data'}
          </Text>
        </TouchableOpacity>
        {showCalendar && (
          <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 8, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <TouchableOpacity onPress={() => {
                const m = calendarMonth - 1;
                if (m < 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); } else { setCalendarMonth(m); }
              }}><Text style={{ color: Colors.text }}>{'<'}</Text></TouchableOpacity>
              <Text style={{ color: Colors.text, fontWeight: '600' }}>{String(calendarMonth + 1).padStart(2, '0')}/{calendarYear}</Text>
              <TouchableOpacity onPress={() => {
                const m = calendarMonth + 1;
                if (m > 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); } else { setCalendarMonth(m); }
              }}><Text style={{ color: Colors.text }}>{'>'}</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {getMonthDays(calendarYear, calendarMonth).map((d, idx) => {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const dataAtual = new Date(d);
                dataAtual.setHours(0, 0, 0, 0);
                const isPast = dataAtual < hoje;
                const isSelected = dataInput === `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      { width: '14.28%', padding: 6, alignItems: 'center', borderRadius: 8 },
                      isSelected && { backgroundColor: Colors.tint },
                      isPast && { opacity: 0.3 }
                    ]}
                    onPress={() => {
                      if (!isPast) {
                        const dd = String(d.getDate()).padStart(2, '0');
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const yyyy = String(d.getFullYear());
                        setDataInput(`${dd}-${mm}-${yyyy}`);
                        setShowCalendar(false);
                      }
                    }}
                    disabled={isPast}
                  >
                    <Text style={{
                      color: isSelected ? Colors.card : (isPast ? Colors.textSecondary : Colors.text),
                      fontWeight: isSelected ? '700' : '400'
                    }}>
                      {d.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCalendar(false)}>
              <Text style={styles.createBtnText}>Fechar calendário</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.formLabel}>Hora (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="14:30"
          value={horaInput}
          onChangeText={setHoraInput}
          keyboardType="numeric"
          maxLength={5}
        />
        <Text style={styles.hintText}>Exemplo: 09:00, 14:30, 18:00</Text>
        <TouchableOpacity
          style={[
            styles.createBtn,
            (!pacienteSelecionado || !dataInput || !horaInput) && styles.createBtnDisabled
          ]}
          onPress={handleAgendarParaPaciente}
          disabled={!pacienteSelecionado || !dataInput || !horaInput}
        >
          <Text style={styles.createBtnText}>Criar Agendamento</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  label: { color: Colors.text },
  note: { color: Colors.textSecondary, marginTop: 12 },
  card: { backgroundColor: Colors.card, padding: 12, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: Colors.border },
  cardName: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  cardMeta: { color: Colors.textSecondary, marginTop: 4 },
  selectBtn: { marginTop: 8, backgroundColor: Colors.cardAlt, padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  selectBtnText: { color: Colors.text },
  formCard: { backgroundColor: Colors.card, padding: 12, borderRadius: 10, marginTop: 16, borderWidth: 1, borderColor: Colors.border },
  formTitle: { color: Colors.text, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  formLabel: { color: Colors.text, fontWeight: '600', marginTop: 6 },
  formHint: { color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: Colors.cardAlt, borderRadius: 8, padding: 10, marginTop: 6, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  hintText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  createBtn: { backgroundColor: Colors.tint, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { color: Colors.card, fontWeight: '700' },
});


