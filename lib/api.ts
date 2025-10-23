/**
 * Buscar solicitações de pacientes para o psicólogo
 */
export const getSolicitacoes = async (profissionalId: number, token: string): Promise<any[]> => {
  return await getComToken(`/solicitacoes?profissionalId=${profissionalId}`, token);
};

/**
 * Aceitar solicitação de paciente
 */
export const aceitarSolicitacao = async (solicitacaoId: number, token: string): Promise<any> => {
  return await apiFetch(`/solicitacoes/${solicitacaoId}/aceitar`, 'POST', {}, token);
};
/**
 * Criar acompanhamento diário
 */
export const criarAcompanhamento = async (
  dados: { texto: string; qualidade_sono: number; humor: string; data_hora?: string },
  token: string
): Promise<any> => {
  return await apiFetch('/acompanhamentos', 'POST', dados, token);
};

/**
 * Buscar acompanhamentos do usuário autenticado
 */
export const getAcompanhamentos = async (token: string): Promise<any[]> => {
  return await getComToken('/acompanhamentos', token);
};
/**
 * Buscar dados do usuário pelo ID
 */
export const getUsuarioById = async (id: number, token: string): Promise<any> => {
  return await getComToken(`/usuarios/${id}`, token);
};
/**
 * Buscar agendamentos do usuário autenticado
 */
export const getAgendamentosUsuario = async (usuarioId: number, token: string): Promise<any[]> => {
  return await getComToken(`/agendamentos?usuarioId=${usuarioId}`, token);
};
/**
 * Criar agendamento
 */
export const criarAgendamento = async (dados: { profissional_id: number; data_hora: string }, token: string): Promise<any> => {
  return await apiFetch('/agendamentos', 'POST', dados, token);
};

/**
 * Listar profissionais
 */
export const listarProfissionais = async (): Promise<any[]> => {
  return await apiFetch('/profissionais');
};

/**
 * Toggle disponibilidade do profissional
 */
export const toggleDisponibilidade = async (id: number, disponivel: boolean, token: string): Promise<any> => {
  return await apiFetch(`/profissionais/${id}/disponibilidade`, 'PATCH', { disponivel: disponivel ? 1 : 0 }, token);
};

/**
 * Criar avaliação
 */
export const criarAvaliacao = async (dados: { profissional_id: number; nota: number; comentario?: string }, token: string): Promise<any> => {
  return await apiFetch('/avaliacoes', 'POST', dados, token);
};

/**
 * Buscar avaliações públicas
 */
export const getAvaliacoesPublicas = async (): Promise<any[]> => {
  return await apiFetch('/avaliacoes/publicas');
};
/**
 * Atualização de usuário
 */
export const updateUsuario = async (id: number, dados: { nome: string; email: string }, token: string): Promise<any> => {
  return await apiFetch(`/usuarios/${id}`, 'PUT', dados, token);
};

const BASE_URL = 'http://localhost:3333';


interface LoginResponse {
  token: string;
  nome: string;
  email: string;
  role?: 'paciente' | 'psicologo';
  profissionalId?: number;
}

interface LoginPayload {
  email: string;
  senha: string;
}

interface UsuarioCadastro {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  nascimento: string;
  tipo?: 'paciente' | 'psicologo';
  crp?: string;
  especialidade?: string;
}

/**
 * Função genérica para requisições à API
 */
const apiFetch = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: object,
  token?: string
): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(erro.erro || 'Erro na requisição');
  }

  return await response.json();
};

/**
 * Login de usuário
 */
export const login = async ({ email, senha }: LoginPayload): Promise<LoginResponse> => {
  return await apiFetch('/auth/login', 'POST', { email, senha });
};

/**
 * Cadastro de novo usuário
 */
export const cadastrarUsuario = async (dados: UsuarioCadastro): Promise<any> => {
  return await apiFetch('/usuarios', 'POST', dados);
};

/**
 * GET com autenticação
 */
export const getComToken = async (endpoint: string, token: string): Promise<any> => {
  return await apiFetch(endpoint, 'GET', undefined, token);
};
