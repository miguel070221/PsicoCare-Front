// Localização: (app)/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; // Precisaremos desta biblioteca

// Definir a estrutura dos dados do utilizador
interface User {
  id: number;
  nome: string;
  email: string;
}
interface UserExtended extends User {
  role?: 'paciente' | 'psicologo' | 'admin';
  profissionalId?: number | null;
}

// Definir o que o nosso contexto irá fornecer
interface AuthContextData {
  user: UserExtended | null;
  token: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserExtended | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUser = (newUser: User) => {
    setUser((prev) => {
      if (!prev) return { ...newUser } as any;
      return { ...prev, ...newUser } as any;
    });
  };

  useEffect(() => {
    // Tenta carregar o token do armazenamento ao iniciar a app
    async function loadStoragedData() {
      const storagedToken = await AsyncStorage.getItem('token');
      if (storagedToken) {
        const decodedToken: any = jwtDecode(storagedToken);
        setUser({ id: decodedToken.id, nome: decodedToken.nome, email: decodedToken.email, role: decodedToken.role, profissionalId: decodedToken.profissionalId });
        setToken(storagedToken);
      }
      setIsLoading(false);
    }
    loadStoragedData();
  }, []);

  const signIn = async (receivedToken: string) => {
    await AsyncStorage.setItem('token', receivedToken);
    const decodedToken: any = jwtDecode(receivedToken);
    const role = decodedToken.role as 'paciente' | 'psicologo' | 'admin' | undefined;
    setUser({
      id: decodedToken.id,
      nome: decodedToken.nome,
      email: decodedToken.email,
      role,
      profissionalId: decodedToken.profissionalId ?? null,
    });
    setToken(receivedToken);
  };

  const signOut = async () => {
    console.log('🔓 [AUTH] Iniciando signOut...');
    try {
      await AsyncStorage.removeItem('token');
      console.log('🔓 [AUTH] Token removido do AsyncStorage');
      setUser(null);
      setToken(null);
      console.log('🔓 [AUTH] Estado do usuário limpo');
    } catch (error) {
      console.error('❌ [AUTH] Erro ao fazer signOut:', error);
      // Mesmo com erro, limpar o estado
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para facilitar o uso do contexto
export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}