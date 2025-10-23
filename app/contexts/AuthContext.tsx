// Localização: (app)/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; // Precisaremos desta biblioteca
import { getUsuarioById } from '../../lib/api';

// Definir a estrutura dos dados do utilizador
interface User {
  id: number;
  nome: string;
  email: string;
}
interface UserExtended extends User {
  role?: 'paciente' | 'psicologo';
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
    setUser(newUser);
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
    let nome = decodedToken.nome;
    let email = decodedToken.email;
    const role = decodedToken.role as 'paciente' | 'psicologo' | undefined;
    const profissionalId = decodedToken.profissionalId as number | undefined;
    // Se não houver nome/email no token, busca do backend
    if (!nome || !email) {
      try {
        const usuario = await getUsuarioById(decodedToken.id, receivedToken);
        nome = usuario.nome;
        email = usuario.email;
      } catch (e) {
        // fallback: mantém o que veio do token
      }
    }
    setUser({ id: decodedToken.id, nome, email, role, profissionalId: profissionalId ?? null });
    setToken(receivedToken);
  };

  const signOut = async () => {
    console.log('SignOut chamado');
    await AsyncStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setTimeout(() => {
      // Força reload do contexto após logout
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 100);
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