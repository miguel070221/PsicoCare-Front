// Localização: (app)/(tabs)/avaliacoes.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { criarAcompanhamento, getAcompanhamentos } from '../../lib/api';

export default function AcompanhamentoDiario() {
  const { token } = useAuth();
  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);
  const [loadingAcompanhamento, setLoadingAcompanhamento] = useState(false);
  const [textoAcompanhamento, setTextoAcompanhamento] = useState('');
  const [qualidadeSono, setQualidadeSono] = useState(0); // 1 a 5
  const [humor, setHumor] = useState(''); // emoji
  const [outrasEmocoes, setOutrasEmocoes] = useState<string[]>([]);
  const [novaEmocao, setNovaEmocao] = useState('');
  const humores = [
    { label: 'Estável', value: 'Estável', emoji: '🙂' },
    { label: 'Ansioso', value: 'Ansioso', emoji: '😰' },
    { label: 'Triste', value: 'Triste', emoji: '😢' },
    { label: 'Irritado', value: 'Irritado', emoji: '😡' },
    { label: 'Outro', value: 'Outro', emoji: '🤔' },
  ];

  const handleSalvarAcompanhamento = async () => {
    if (!textoAcompanhamento && !qualidadeSono && !humor) return;
    if (!token) return;
    setLoadingAcompanhamento(true);
    try {
      let humorFinal = humor;
      if (humor === 'Outro') {
        if (outrasEmocoes.length > 0) {
          humorFinal = outrasEmocoes.join(', ');
        } else {
          Alert.alert('Adicione pelo menos uma emoção personalizada!');
          setLoadingAcompanhamento(false);
          return;
        }
      }
      await criarAcompanhamento({ texto: textoAcompanhamento, qualidade_sono: qualidadeSono, humor: humorFinal }, token);
      await fetchAcompanhamentos();
      setTextoAcompanhamento('');
      setQualidadeSono(0);
      setHumor('');
  setOutrasEmocoes([]);
  setNovaEmocao('');
      Alert.alert('Registro salvo!');
    } catch (e) {
      Alert.alert('Erro ao salvar registro');
    }
    setLoadingAcompanhamento(false);
  };

  const fetchAcompanhamentos = async () => {
    if (!token) return;
    setLoadingAcompanhamento(true);
    try {
      const data = await getAcompanhamentos(token);
      setAcompanhamentos(data.map((a: any) => ({
        ...a,
        dataHora: a.data_hora ? new Date(a.data_hora).toLocaleString('pt-BR') : '',
        sono: a.qualidade_sono,
      })));
    } catch (e) {
      setAcompanhamentos([]);
    }
    setLoadingAcompanhamento(false);
  };

  useEffect(() => {
    fetchAcompanhamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Acompanhamento Diário</Text>
  <View style={styles.section}>
  <Text style={styles.sectionTitle}>Observações do dia</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Descreva sintomas, eventos ou observações clínicas."
          placeholderTextColor={Colors.textSecondary}
          value={textoAcompanhamento}
          onChangeText={setTextoAcompanhamento}
          multiline
        />
  <Text style={styles.sectionTitle}>Qualidade do sono</Text>
  <View style={styles.sonoRow}>
    {[1,2,3,4,5].map((num) => (
      <TouchableOpacity
        key={num}
        style={[styles.sonoBtn, qualidadeSono === num && styles.sonoBtnSelected]}
        onPress={() => setQualidadeSono(num)}
        activeOpacity={0.8}
      >
        <Text style={{ color: qualidadeSono === num ? Colors.card : Colors.text, fontWeight: 'bold', fontSize: 28 }}>{num}</Text>
      </TouchableOpacity>
    ))}
  </View>
  <Text style={styles.sectionTitle}>Estado emocional:</Text>
  <View style={styles.optionsContainer}>
          {humores.map((h) => (
            <TouchableOpacity
              key={h.value}
              style={[styles.moodOption, humor === h.value && styles.moodOptionSelected]}
              onPress={() => { setHumor(h.value); if(h.value !== 'Outro') { setOutrasEmocoes([]); setNovaEmocao(''); } }}
              activeOpacity={0.8}
            >
              <Text style={styles.moodEmoji}>{h.emoji}</Text>
              <Text style={styles.optionText}>
                {h.value === 'Outro' && outrasEmocoes.length > 0 ? outrasEmocoes.join(', ') : h.label}
              </Text>
            </TouchableOpacity>
          ))}
          {humor === 'Outro' && (
            <View style={styles.outraEmocaoBox}>
              <Text style={styles.outraEmocaoLabel}>Adicione emoções (máx 10 caracteres cada):</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={styles.outraEmocaoInput}
                  value={novaEmocao}
                  onChangeText={t => setNovaEmocao(t.slice(0,10))}
                  maxLength={10}
                  placeholder="Digite aqui..."
                  placeholderTextColor={Colors.textSecondary}
                />
                <TouchableOpacity
                  style={[styles.button, { paddingVertical: 8, paddingHorizontal: 12, marginTop: 0 }]}
                  onPress={() => {
                    if (novaEmocao.trim() && !outrasEmocoes.includes(novaEmocao.trim())) {
                      setOutrasEmocoes([...outrasEmocoes, novaEmocao.trim()]);
                      setNovaEmocao('');
                    }
                  }}
                >
                  <Text style={{ color: Colors.card, fontWeight: 'bold' }}>Adicionar</Text>
                </TouchableOpacity>
              </View>
              {/* Lista de emoções adicionadas */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
                {outrasEmocoes.map((emo, idx) => (
                  <View key={emo+idx} style={{ backgroundColor: Colors.tint, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 4, marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: Colors.card, fontWeight: 'bold', fontSize: 14 }}>{emo}</Text>
                    <TouchableOpacity onPress={() => setOutrasEmocoes(outrasEmocoes.filter((e, i) => i !== idx))} style={{ marginLeft: 6 }}>
                      <Text style={{ color: Colors.card, fontWeight: 'bold' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
  <TouchableOpacity style={styles.button} onPress={handleSalvarAcompanhamento}>
          <Text style={styles.buttonText}>Salvar registro</Text>
        </TouchableOpacity>
      </View>

      {loadingAcompanhamento ? (
        <ActivityIndicator color={Colors.tint} style={{ marginTop: 16 }} />
      ) : acompanhamentos.length > 0 && (
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Histórico de acompanhamentos:</Text>
          {acompanhamentos.map((a) => (
            <View key={a.id} style={styles.card}> 
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 13, marginRight: 8 }}>{a.dataHora}</Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 13, marginRight: 8 }}>Sono: {a.sono || '-'}</Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Humor: {a.humor || '-'}</Text>
              </View>
              <Text style={{ color: Colors.text, marginTop: 2 }}>{a.texto}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ...declaração duplicada removida...
// ...código duplicado removido...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    padding: 20,
  },
  card: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.background,
    marginBottom: 12,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 4,
    textAlign: 'center',
  },
  moodOption: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.cardAlt,
    marginHorizontal: 6,
    minWidth: 80,
    shadowColor: Colors.tint,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 2,
  },
  moodOptionSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  sonoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sonoBtn: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 32,
    paddingVertical: 22,
    paddingHorizontal: 28,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    minWidth: 56,
    shadowColor: Colors.tint,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  outraEmocaoBox: {
    marginTop: 12,
    alignItems: 'flex-start',
    width: '100%',
  },
  outraEmocaoLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 2,
  },
  outraEmocaoInput: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    fontSize: 16,
    color: Colors.text,
    width: '100%',
  },
  sonoBtnSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tintDark,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.icon,
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 30,
  },
  optionText: {
    marginTop: 5,
    color: Colors.text,
  },
  textArea: {
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
    height: 120,
  },
  button: {
    backgroundColor: Colors.tint,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
});