import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useRef, useEffect } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { loginPaciente, loginPsicologo, loginAdmin } from '../lib/api';
import { useAuth } from './contexts/AuthContext';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState<'paciente' | 'psicologo' | 'admin'>('paciente');
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Reset contador de cliques após 3 segundos sem cliques
  useEffect(() => {
    if (logoClicks > 0 && !showAdmin) {
      // Limpar timeout anterior
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      // Criar novo timeout
      clickTimeoutRef.current = setTimeout(() => {
        setLogoClicks(0);
      }, 3000);
    }
    
    // Cleanup
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [logoClicks, showAdmin]);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    
    if (newClicks >= 7) {
      setShowAdmin(true);
      setLogoClicks(0);
      // Limpar timeout se existir
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      let data;
      if (tipo === 'psicologo') data = await loginPsicologo({ email, senha });
      else if (tipo === 'admin') data = await loginAdmin({ email, senha });
      else data = await loginPaciente({ email, senha });
      await signIn(data.token); // Atualiza o contexto com nome/email/role do token
      Alert.alert('Sucesso', `Bem-vindo, ${data.nome || 'usuário'}`);
      if (tipo === 'psicologo') {
        router.replace('/(tabs)/home-psicologo');
      } else if (tipo === 'admin') {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/(tabs)');
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
      {/* Logo PsicoCare - Clicável para mostrar botão admin */}
      <TouchableOpacity 
        style={styles.logoContainer} 
        onPress={handleLogoClick}
        activeOpacity={0.7}
      >
        <Logo size="large" showText={true} />
      </TouchableOpacity>

      <Text style={styles.title}>Login</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => setTipo('paciente')} style={[styles.roleBtn, tipo === 'paciente' && { backgroundColor: Colors.tint }]}>
          <Text style={[styles.roleText, tipo === 'paciente' && { color: Colors.card }]}>Paciente</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTipo('psicologo')} style={[styles.roleBtn, tipo === 'psicologo' && { backgroundColor: Colors.tint }]}>
          <Text style={[styles.roleText, tipo === 'psicologo' && { color: Colors.card }]}>Psicólogo</Text>
        </TouchableOpacity>
        {showAdmin && (
          <TouchableOpacity onPress={() => setTipo('admin')} style={[styles.roleBtn, tipo === 'admin' && { backgroundColor: Colors.tint }]}>
            <Text style={[styles.roleText, tipo === 'admin' && { color: Colors.card }]}>Admin</Text>
          </TouchableOpacity>
        )}
      </View>

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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
  roleBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: Colors.card,
  },
  roleText: {
    color: Colors.text,
    fontWeight: '600',
  },
});
