// Localização: (app)/agendamentos.tsx



import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import Colors from '../../constants/Colors';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAgendamentosUsuario, listarProfissionais, criarAgendamento } from '../../lib/api';
import { useLocalSearchParams } from 'expo-router';


export default function Agendamentos() {
  const router = useRouter();
  const { user, token } = useAuth();
  const searchParams = useLocalSearchParams();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      if (!user || !token) return;
      setLoading(true);
      try {
        const data = await getAgendamentosUsuario(user.id, token);
        setAgendamentos(data);
        // buscar lista de profissionais
        try {
          const profs = await listarProfissionais();
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


  // Função para agendar uma data aleatória (apenas para teste)
  const handleAgendarAleatorio = () => {
    const dias = Math.floor(Math.random() * 30) + 1;
    const data = new Date();
    data.setDate(data.getDate() + dias);
    const dataStr = data.toLocaleDateString('pt-BR');
    const novo = {
      id: Math.random().toString(36).substring(2),
      data: dataStr,
      descricao: 'Sessão agendada (teste)',
    };
    setAgendamentos([novo, ...agendamentos]);
  };


  // Função para criar agendamento real
  const [selectedProfissional, setSelectedProfissional] = useState<number | null>(null);
  const [dataInput, setDataInput] = useState(''); // 'YYYY-MM-DD'
  const [horaInput, setHoraInput] = useState(''); // 'HH:MM'

  const handleCriarAgendamento = async () => {
    if (!token || !selectedProfissional || !dataInput || !horaInput) return;
    // construir ISO string
    const iso = new Date(`${dataInput}T${horaInput}:00`).toISOString();
    try {
      setLoading(true);
      await criarAgendamento({ profissional_id: selectedProfissional, data_hora: iso }, token as string);
      const data = await getAgendamentosUsuario(user!.id, token as string);
      setAgendamentos(data);
      setDataInput('');
      setHoraInput('');
      setSelectedProfissional(null);
    } catch (e) {
      // mostrar erro se quiser
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agendamentos</Text>
      </View>
      <Text style={styles.title}>Os Seus Agendamentos</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: Colors.tint, marginBottom: 12 }]} onPress={handleAgendarAleatorio}>
        <Text style={styles.buttonText}>Agendar data aleatória (teste)</Text>
      </TouchableOpacity>
      {/* Formulário de agendamento real */}
      <View style={[styles.acompanhamentoCard, { marginTop: 8 }]}>
        <Text style={styles.label}>Agendar com</Text>
        {/* Lista de profissionais */}
        {profissionais.length === 0 ? (
          <Text style={{ color: Colors.textSecondary }}>Nenhum profissional encontrado.</Text>
        ) : (
          profissionais.map((p) => (
            <TouchableOpacity key={p.id} style={[styles.humorBtn, selectedProfissional === p.id && styles.humorBtnSelected]} onPress={() => setSelectedProfissional(p.id)}>
              <Text style={{ color: Colors.text }}>{p.nome} {p.disponivel ? '' : '(indisponível)'}</Text>
            </TouchableOpacity>
          ))
        )}
        <Text style={styles.label}>Data (AAAA-MM-DD)</Text>
        <TextInput style={styles.inputArea} placeholder="2025-12-31" value={dataInput} onChangeText={setDataInput} />
        <Text style={styles.label}>Hora (HH:MM)</Text>
        <TextInput style={styles.inputArea} placeholder="14:30" value={horaInput} onChangeText={setHoraInput} />
        <TouchableOpacity style={[styles.button, { marginTop: 8 }]} onPress={handleCriarAgendamento}>
          <Text style={styles.buttonText}>Criar Agendamento</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.tint} size="large" style={{ marginTop: 32 }} />
      ) : agendamentos.length === 0 ? (
        <Text style={{ color: Colors.textSecondary, marginTop: 24 }}>Nenhum agendamento encontrado.</Text>
      ) : (
        agendamentos.map((ag, idx) => (
          <View style={styles.card} key={ag.id || idx}>
            <Text style={styles.date}>{ag.data ? ag.data : 'Data não informada'}</Text>
            <Text style={styles.desc}>{ag.descricao || 'Sessão agendada'}</Text>
          </View>
        ))
      )}

      {/* Seção de acompanhamento diário removida */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Adicione este novo estilo 👇
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // <--- A MÁGICA ACONTECE AQUI
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text,
  },
  card: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.card,
    marginBottom: 12,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  desc: {
    fontSize: 14,
    marginTop: 4,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: 16,
    backgroundColor: Colors.tint,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.card,
    fontWeight: '600',
  },
  inputArea: {
    backgroundColor: Colors.cardAlt,
    color: Colors.text,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
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
    marginBottom: 6,
    marginTop: 6,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 2,
  },
  humorRow: {
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 2,
    gap: 8,
  },
  humorBtn: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  humorBtnSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  header: {
    backgroundColor: Colors.headerBlue,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  headerTitle: {
    color: Colors.card,
    fontSize: 18,
    fontWeight: '700',
  },
});