import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import Colors from '../constants/Colors';
import { getSolicitacoes, aceitarSolicitacao } from '../lib/api';

interface Solicitacao {
  id: number;
  paciente_nome: string;
  paciente_email: string;
}

export default function SolicitacoesPsicologo() {
  const { user, token } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSolicitacoes() {
      setLoading(true);
      try {
        if (user?.profissionalId && token) {
          const data = await getSolicitacoes(user.profissionalId, token);
          setSolicitacoes(data);
        }
      } catch (e) {
        // erro
      }
      setLoading(false);
    }
    fetchSolicitacoes();
  }, [user, token]);

  async function handleAceitar(id: number) {
    if (token) {
      await aceitarSolicitacao(id, token);
      setSolicitacoes(solicitacoes.filter(s => s.id !== id));
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Solicitações de Pacientes</Text>
      {loading ? (
        <ActivityIndicator color={Colors.tint} />
      ) : solicitacoes.length === 0 ? (
        <Text style={styles.empty}>Nenhuma solicitação pendente.</Text>
      ) : (
        solicitacoes.map(s => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.nome}>{s.paciente_nome}</Text>
            <Text style={styles.info}>Email: {s.paciente_email}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => handleAceitar(s.id)}>
              <Text style={styles.btnText}>Aceitar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
  color: Colors.tint,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  info: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  btn: {
  backgroundColor: Colors.tint,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
});
