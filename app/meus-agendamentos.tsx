import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, FlatList, Alert } from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from './contexts/AuthContext';
import { getAgendamentosUsuario, criarAgendamento } from '../lib/api';

function getMonthDays(year: number, month: number) {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export default function MeusAgendamentos() {
  const { user, token } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hora, setHora] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const year = hoje.getFullYear();
  const month = hoje.getMonth();
  const days = getMonthDays(year, month);

  useEffect(() => {
    async function fetchAgendamentos() {
      setLoading(true);
      try {
        if (user && token) {
          const ags = await getAgendamentosUsuario(user.id, token);
          setAgendamentos(ags);
        }
      } catch (e) {
        setAgendamentos([]);
      }
      setLoading(false);
    }
    fetchAgendamentos();
  }, [user, token, modalVisible]);

  function openModal(date?: Date) {
    setSelectedDate(date || null);
    setHora('');
    setModalVisible(true);
  }

  async function handleCriarConsulta() {
    if (!selectedDate || !hora) {
      Alert.alert('Preencha dia e hora');
      return;
    }
    try {
      await criarAgendamento({ profissional_id: 1, data_hora: `${selectedDate.toISOString().split('T')[0]}T${hora}` }, token!);
      setModalVisible(false);
      Alert.alert('Consulta criada!');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  const agendamentosDoMes = agendamentos.filter(a => {
    const data = new Date(a.data);
    return data.getMonth() === month && data.getFullYear() === year && (!search || a.status?.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Agenda</Text></View>
      <View style={styles.calendarRow}>
        <View style={styles.calendarBox}>
          <Text style={styles.monthTitle}>Outubro {year}</Text>
          <View style={styles.daysRow}>
            {['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(d => <Text key={d} style={styles.dayName}>{d}</Text>)}
          </View>
          <View style={styles.daysGrid}>
            {days.map((date, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.dayCell, agendamentosDoMes.some(a => new Date(a.data).getDate() === date.getDate()) && styles.dayCellMarked, hoje.getDate() === date.getDate() && styles.dayCellToday]}
                onPress={() => openModal(date)}
              >
                <Text style={styles.dayNum}>{date.getDate()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.eventsBox}>
          <Text style={styles.eventsTitle}>Consultas do Mês</Text>
          <TextInput
            style={styles.search}
            placeholder="Pesquisar consultas..."
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.novoBtn} onPress={() => openModal()}>
            <Text style={styles.novoBtnText}>+ Nova Consulta</Text>
          </TouchableOpacity>
          {loading ? (
            <Text style={styles.empty}>Carregando...</Text>
          ) : agendamentosDoMes.length === 0 ? (
            <Text style={styles.empty}>Nenhuma consulta este mês</Text>
          ) : (
            <FlatList
              data={agendamentosDoMes}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <View style={styles.eventCard}>
                  <Text style={styles.eventDate}>{item.data} {item.horario}</Text>
                  <Text style={styles.eventStatus}>{item.status}</Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nova Consulta</Text>
            <TextInput
              style={styles.input}
              placeholder="Dia (AAAA-MM-DD)"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChangeText={d => setSelectedDate(new Date(d))}
            />
            <TextInput
              style={styles.input}
              placeholder="Hora (HH:MM)"
              value={hora}
              onChangeText={setHora}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleCriarConsulta}>
              <Text style={styles.modalBtnText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 8 },
  header: { backgroundColor: Colors.headerBlue, padding: 16, borderRadius: 12, marginBottom: 12 },
  headerTitle: { color: Colors.card, fontSize: 22, fontWeight: 'bold' },
  calendarRow: { flexDirection: 'row', gap: 16 },
  calendarBox: { flex: 2, backgroundColor: Colors.card, borderRadius: 12, padding: 12 },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dayName: { color: Colors.textSecondary, fontWeight: 'bold', width: 32, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: 32, height: 32, borderRadius: 8, margin: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cardAlt },
  dayCellMarked: { backgroundColor: Colors.tint },
  dayCellToday: { borderWidth: 2, borderColor: Colors.headerBlue },
  dayNum: { color: Colors.text, fontWeight: 'bold' },
  eventsBox: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 12 },
  eventsTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8 },
  search: { backgroundColor: Colors.cardAlt, borderRadius: 8, padding: 8, marginBottom: 8, color: Colors.text },
  novoBtn: { backgroundColor: Colors.tint, borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 8 },
  novoBtnText: { color: Colors.card, fontWeight: 'bold' },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 32 },
  eventCard: { backgroundColor: Colors.cardAlt, borderRadius: 8, padding: 8, marginBottom: 8 },
  eventDate: { color: Colors.text, fontWeight: 'bold' },
  eventStatus: { color: Colors.textSecondary },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: Colors.card, borderRadius: 12, padding: 24, width: 320 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 12 },
  input: { backgroundColor: Colors.cardAlt, borderRadius: 8, padding: 10, marginBottom: 12, color: Colors.text },
  modalBtn: { backgroundColor: Colors.tint, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  modalBtnCancel: { backgroundColor: Colors.destructive, borderRadius: 8, padding: 12, alignItems: 'center' },
  modalBtnText: { color: Colors.card, fontWeight: 'bold' },
});
