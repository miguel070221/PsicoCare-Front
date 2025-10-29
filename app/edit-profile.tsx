
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { useAuth } from './contexts/AuthContext';
import { updatePacienteMe, updatePsicologoMe } from '../lib/api';


export default function EditarPerfilScreen() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [preferencia, setPreferencia] = useState<'WhatsApp' | 'Telegram' | 'Discord'>('WhatsApp');
  const [contato, setContato] = useState('');
  const [bio, setBio] = useState('');
  const [crp, setCrp] = useState('');

  // Atualização do contexto após salvar (forçando recarregar o perfil)
  const handleSalvar = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      if (user.role === 'psicologo') {
        await updatePsicologoMe({ nome, crp, bio }, token);
        updateUser({ id: user.id, nome, email });
      } else {
        await updatePacienteMe({ nome, preferencia_comunicacao: preferencia, contato_preferido: contato }, token);
        updateUser({ id: user.id, nome, email });
      }
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      router.replace('/(tabs)/perfil');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {user?.role !== 'psicologo' && (
        <>
          <Text style={{ color: Colors.text, marginBottom: 6 }}>Preferência de comunicação</Text>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            {(['WhatsApp','Telegram','Discord'] as const).map((p) => (
              <TouchableOpacity key={p} onPress={() => setPreferencia(p)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, marginRight: 6, backgroundColor: preferencia===p?Colors.tint:Colors.card }}>
                <Text style={{ color: preferencia===p?Colors.card:Colors.text }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Contato preferido" value={contato} onChangeText={setContato} />
        </>
      )}

      {user?.role === 'psicologo' && (
        <>
          <TextInput style={styles.input} placeholder="CRP" value={crp} onChangeText={setCrp} />
          <TextInput style={[styles.input, { height: 100 }]} placeholder="Bio" value={bio} onChangeText={setBio} multiline />
        </>
      )}
      <TouchableOpacity style={styles.button} onPress={handleSalvar} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.text,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.tint,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 12,
  },
  cancelButtonText: {
    color: Colors.destructive,
    fontSize: 16,
  },
});
