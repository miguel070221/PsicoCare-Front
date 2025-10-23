// Localização: (app)/register.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { cadastrarUsuario } from '../lib/api';

type UserType = 'paciente' | 'psicologo';

export default function RegisterScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>('paciente');
  const [crp, setCrp] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [especialidade, setEspecialidade] = useState('');

  const handleRegister = async () => {
    try {
      await cadastrarUsuario({ nome, email, senha, telefone, nascimento, tipo: userType, crp: crp || undefined, especialidade: especialidade || undefined });
      router.push('/login');
    } catch (e: any) {
      // exibir erro simples
      alert(e.message || 'Erro ao cadastrar');
    }
  };

  // Adicione aqui os outros estados para nome, email, senha, etc.

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

      {/* Seletor de Tipo de Utilizador */}
      <View style={styles.userTypeSelector}>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'paciente' && styles.userTypeButtonActive]}
          onPress={() => setUserType('paciente')}
        >
          <Text style={[styles.userTypeText, userType === 'paciente' && styles.userTypeTextActive]}>Sou Paciente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'psicologo' && styles.userTypeButtonActive]}
          onPress={() => setUserType('psicologo')}
        >
          <Text style={[styles.userTypeText, userType === 'psicologo' && styles.userTypeTextActive]}>Sou Psicólogo</Text>
        </TouchableOpacity>
      </View>

  <TextInput style={styles.input} placeholder="Nome Completo" value={nome} onChangeText={setNome} />
  <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
  <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
  <TextInput style={styles.input} placeholder="Telefone" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
  <TextInput style={styles.input} placeholder="Data de nascimento (AAAA-MM-DD)" value={nascimento} onChangeText={setNascimento} />

      {/* Campo de CRP Condicional */}
      {userType === 'psicologo' && (
        <TextInput
          style={styles.input}
          placeholder="Número do CRP"
          value={crp}
          onChangeText={setCrp}
        />
      )}

      {userType === 'psicologo' && (
        <TextInput style={styles.input} placeholder="Especialidade" value={especialidade} onChangeText={setEspecialidade} />
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.linkText}>Já tenho conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 28,
  },
  userTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 4,
  },
  userTypeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
  },
  userTypeButtonActive: {
    backgroundColor: Colors.tintDark,
  },
  userTypeText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  userTypeTextActive: {
    color: Colors.card,
  },
  input: {
    backgroundColor: Colors.card,
    color: Colors.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.tint,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
  },
});