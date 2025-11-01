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

export const getAcompanhamentosPaciente = async (pacienteId: number, token: string): Promise<any[]> => {
  return await getComToken(`/acompanhamentos/paciente/${pacienteId}`, token);
};
/**
 * Buscar dados do usuário pelo ID
 */
// Removido: endpoint antigo de usuários genéricos
/**
 * Buscar agendamentos do usuário autenticado
 */
export const getAgendamentosUsuario = async (usuarioId: number, token: string): Promise<any[]> => {
  return await getComToken(`/agendamentos?usuarioId=${usuarioId}`, token);
};

/**
 * Buscar agendamentos do psicólogo autenticado
 */
export const getAgendamentosPsicologo = async (token: string): Promise<any[]> => {
  const psicologo = await getPsicologoMe(token);
  return await getComToken(`/agendamentos?profissionalId=${psicologo.id}`, token);
};
/**
 * Criar agendamento
 */
export const criarAgendamento = async (
  dados: { profissional_id?: number; data_hora: string; paciente_id?: number },
  token: string
): Promise<any> => {
  return await apiFetch('/agendamentos', 'POST', dados, token);
};

/**
 * Listar profissionais
 */
export const listarPsicologosPublicos = async (filtro?: { especializacao?: string; faixa?: string; pacienteId?: number }, token?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (filtro?.especializacao) params.append('especializacao', filtro.especializacao);
  if (filtro?.faixa) params.append('faixa', filtro.faixa);
  if (filtro?.pacienteId) params.append('pacienteId', filtro.pacienteId.toString());
  const qs = params.toString();
  return await apiFetch(`/psicologos/public${qs ? `?${qs}` : ''}`, 'GET', undefined, token);
};

/**
 * Toggle disponibilidade do profissional
 */
export const toggleDisponibilidade = async (disponivel: boolean, token: string): Promise<any> => {
  return await apiFetch(`/psicologos/toggle-disponibilidade`, 'POST', { disponivel }, token);
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
  role?: 'paciente' | 'psicologo' | 'admin';
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

  if (response.status === 204) {
    return null;
  }

  const raw = await response.text();
  let data: any = null;
  if (raw && raw.length > 0) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw; // não-JSON, mantém como texto
    }
  }

  if (!response.ok) {
    const msg = (data && (data.erro || data.message)) || (typeof data === 'string' ? data : 'Erro na requisição');
    throw new Error(msg);
  }

  return data;
};

/**
 * Login de usuário
 */
export const loginPaciente = async ({ email, senha }: LoginPayload): Promise<LoginResponse> => {
  return await apiFetch('/pacientes/login', 'POST', { email, senha });
};

export const loginPsicologo = async ({ email, senha }: LoginPayload): Promise<LoginResponse> => {
  return await apiFetch('/psicologos/login', 'POST', { email, senha });
};

export const loginAdmin = async ({ email, senha }: LoginPayload): Promise<LoginResponse> => {
  return await apiFetch('/admin/login', 'POST', { email, senha });
};

export const solicitarAtendimento = async (id_psicologo: number, token: string): Promise<any> => {
  return await apiFetch('/solicitacoes', 'POST', { id_psicologo }, token);
};

export const listarSolicitacoesPendentesPsicologo = async (token: string): Promise<any[]> => {
  return await apiFetch('/psicologos/solicitacoes/pendentes', 'GET', undefined, token);
};

export const aceitarSolicitacaoPsicologo = async (solicitacaoId: number, id_paciente: number, token: string): Promise<any> => {
  return await apiFetch('/psicologos/solicitacoes/aceitar', 'POST', { solicitacaoId, id_paciente }, token);
};

export const recusarSolicitacaoPsicologo = async (solicitacaoId: number, token: string): Promise<any> => {
  return await apiFetch('/psicologos/solicitacoes/recusar', 'POST', { solicitacaoId }, token);
};

export const getPacienteMe = async (token: string): Promise<any> => {
  return await apiFetch('/pacientes/me', 'GET', undefined, token);
};

export const updatePacienteMe = async (
  dados: { nome?: string; idade?: number | null; genero?: string; preferencia_comunicacao?: string; contato_preferido?: string },
  token: string
): Promise<any> => {
  return await apiFetch('/pacientes/me', 'PUT', dados, token);
};

export const updatePsicologoMe = async (
  dados: { nome?: string; crp?: string; especializacoes?: string[]; bio?: string; foto_perfil?: string; perfil_completo?: boolean },
  token: string
): Promise<any> => {
  return await apiFetch('/psicologos/me', 'PUT', dados, token);
};

export const getPsicologoMe = async (token: string): Promise<any> => {
  return await apiFetch('/psicologos/me', 'GET', undefined, token);
};

export const listarAtendimentosDoPsicologo = async (token: string): Promise<any[]> => {
  return await apiFetch('/atendimentos/psicologo/meus', 'GET', undefined, token);
};

/**
 * Cadastro de novo usuário
 */
export const cadastrarUsuario = async (dados: UsuarioCadastro): Promise<any> => {
  if (dados.tipo === 'psicologo') {
    return await apiFetch('/psicologos/register', 'POST', {
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      crp: dados.crp,
      especializacoes: dados.especialidade ? [dados.especialidade] : [],
      bio: '',
    });
  }
  // paciente (default)
  return await apiFetch('/pacientes/register', 'POST', {
    nome: dados.nome,
    email: dados.email,
    senha: dados.senha,
    idade: null,
    genero: 'outro',
    preferencia_comunicacao: 'WhatsApp',
    contato_preferido: dados.telefone || '',
  });
};

/**
 * GET com autenticação
 */
export const getComToken = async (endpoint: string, token: string): Promise<any> => {
  return await apiFetch(endpoint, 'GET', undefined, token);
};
