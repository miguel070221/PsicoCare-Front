import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { login } from '../lib/api';
import { useAuth } from './contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();
  const { signIn } = useAuth();

  const verify = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      router.replace('/(tabs)');
    }
  };

  useFocusEffect(
    useCallback(() => {
      verify();
    }, [])
  );

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      const data = await login({ email, senha });
      await signIn(data.token); // Atualiza o contexto com nome/email/role do token
      Alert.alert('Sucesso', `Bem-vindo, ${data.nome || 'usuário'}`);
      if (data.role === 'psicologo') {
        router.replace('/home-psicologo');
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      let msg = error.message || 'Falha no login';
      if (error?.response) {
        msg += `\nStatus: ${error.response.status}`;
        msg += `\nDetalhe: ${JSON.stringify(error.response.data)}`;
      }
      console.log('Erro login:', error);
      Alert.alert('Erro', msg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <Link href="/register" style={styles.link}>
        Criar conta
      </Link>
      <Link href="/esqueci-senha" style={styles.link}>
        Esqueci minha senha
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: Colors.card,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.tint,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: Colors.card,
    fontWeight: '600',
  },
  link: {
    color: Colors.tint,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
});
