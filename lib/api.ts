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
 * IMPORTANTE: Não precisa passar usuarioId, o backend usa o ID do token automaticamente
 */
export const getAgendamentosUsuario = async (usuarioId: number, token: string): Promise<any[]> => {
  // O backend agora ignora o usuarioId da query e usa o ID do token
  // Mantemos o parâmetro para compatibilidade, mas ele não é mais usado
  return await getComToken(`/agendamentos`, token);
};

/**
 * Buscar agendamentos do psicólogo autenticado
 * IMPORTANTE: Não precisa passar profissionalId, o backend usa o ID do token automaticamente
 */
export const getAgendamentosPsicologo = async (token: string): Promise<any[]> => {
  // O backend agora ignora o profissionalId da query e usa o ID do token
  return await getComToken(`/agendamentos`, token);
};

/**
 * Buscar agendamentos de um paciente específico (apenas para psicólogos)
 * Verifica se há vínculo entre o psicólogo e o paciente antes de retornar
 */
export const getAgendamentosPaciente = async (pacienteId: number, token: string): Promise<any[]> => {
  return await getComToken(`/agendamentos/paciente/${pacienteId}`, token);
};
/**
 * Criar agendamento
 */
export const criarAgendamento = async (
  dados: { profissional_id?: number; data_hora: string; paciente_id?: number },
  token: string
): Promise<any> => {
  console.log('📤 criarAgendamento chamado:', { dados, tokenPresente: !!token });
  try {
    const resultado = await apiFetch('/agendamentos', 'POST', dados, token);
    console.log('✅ criarAgendamento sucesso:', resultado);
    return resultado;
  } catch (error: any) {
    console.error('❌ criarAgendamento erro:', error);
    console.error('❌ Status:', error?.response?.status);
    console.error('❌ Dados:', error?.response?.data);
    throw error;
  }
};

/**
 * Atualizar agendamento
 */
export const atualizarAgendamento = async (
  agendamentoId: number,
  dados: { data_hora: string },
  token: string
): Promise<any> => {
  return await apiFetch(`/agendamentos/${agendamentoId}`, 'PUT', dados, token);
};

/**
 * Cancelar/Deletar agendamento (agora deleta permanentemente)
 */
export const cancelarAgendamento = async (agendamentoId: number, token: string): Promise<any> => {
  console.log('📤 [API] ====== cancelarAgendamento (deletar) CHAMADO ======');
  console.log('📤 [API] agendamentoId:', agendamentoId);
  console.log('📤 [API] agendamentoId tipo:', typeof agendamentoId);
  console.log('📤 [API] tokenPresente:', !!token);
  console.log('📤 [API] token length:', token?.length);
  console.log('📤 [API] BASE_URL:', BASE_URL);
  console.log('📤 [API] Endpoint completo:', `${BASE_URL}/agendamentos/${agendamentoId}/cancelar`);
  
  try {
    // Usar a rota de cancelar que agora deleta o agendamento
    console.log('📤 [API] Fazendo requisição PUT para /agendamentos/:id/cancelar');
    console.log('📤 [API] Timestamp:', new Date().toISOString());
    
    const resultado = await apiFetch(`/agendamentos/${agendamentoId}/cancelar`, 'PUT', {}, token);
    
    console.log('✅ [API] ====== RESPOSTA RECEBIDA ======');
    console.log('✅ [API] Resultado tipo:', typeof resultado);
    console.log('✅ [API] Resultado:', JSON.stringify(resultado, null, 2));
    console.log('✅ [API] Agendamento deletado com sucesso!');
    
    return resultado;
  } catch (error: any) {
    console.error('❌ [API] ====== ERRO AO DELETAR AGENDAMENTO ======');
    console.error('❌ [API] Error tipo:', typeof error);
    console.error('❌ [API] Error name:', error?.name);
    console.error('❌ [API] Error message:', error?.message);
    console.error('❌ [API] Error stack:', error?.stack);
    console.error('❌ [API] Error response:', error?.response);
    console.error('❌ [API] Status:', error?.response?.status);
    console.error('❌ [API] Status Text:', error?.response?.statusText);
    console.error('❌ [API] Dados:', error?.response?.data);
    console.error('❌ [API] Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Re-throw o erro para que o frontend possa tratá-lo
    throw error;
  }
};

/**
 * Deletar agendamento (rota alternativa usando DELETE)
 */
/**
 * Funções de Administração
 */

/**
 * Listar todos os usuários (pacientes e psicólogos) com informações completas (admin)
 */
export const listarUsuariosCompleto = async (token: string): Promise<{ pacientes: any[]; psicologos: any[] }> => {
  return await apiFetch('/admin/usuarios/completo', 'GET', undefined, token);
};

/**
 * Obter detalhes completos de um paciente (admin)
 */
export const getPacienteDetalhes = async (pacienteId: number, token: string): Promise<any> => {
  return await apiFetch(`/admin/pacientes/${pacienteId}`, 'GET', undefined, token);
};

/**
 * Obter detalhes completos de um psicólogo (admin)
 */
export const getPsicologoDetalhes = async (psicologoId: number, token: string): Promise<any> => {
  return await apiFetch(`/admin/psicologos/${psicologoId}`, 'GET', undefined, token);
};

/**
 * Editar paciente (admin)
 */
export const editarPacienteAdmin = async (
  pacienteId: number,
  dados: {
    nome?: string;
    email?: string;
    idade?: number | null;
    genero?: string;
    preferencia_comunicacao?: string;
    contato_preferido?: string;
    link_whatsapp?: string;
    link_telegram?: string;
    link_discord?: string;
    link_email?: string;
    telefone?: string;
  },
  token: string
): Promise<any> => {
  return await apiFetch(`/admin/pacientes/${pacienteId}`, 'PUT', dados, token);
};

/**
 * Editar psicólogo (admin)
 */
export const editarPsicologoAdmin = async (
  psicologoId: number,
  dados: {
    nome?: string;
    email?: string;
    crp?: string;
    especializacoes?: string[];
    bio?: string;
    foto_perfil?: string;
    disponivel?: boolean;
    perfil_completo?: boolean;
    aprovado?: boolean;
  },
  token: string
): Promise<any> => {
  return await apiFetch(`/admin/psicologos/${psicologoId}`, 'PUT', dados, token);
};

/**
 * Excluir paciente (admin)
 */
export const excluirPacienteAdmin = async (pacienteId: number, token: string): Promise<any> => {
  return await apiFetch(`/admin/pacientes/${pacienteId}`, 'DELETE', undefined, token);
};

/**
 * Excluir psicólogo (admin)
 */
export const excluirPsicologoAdmin = async (psicologoId: number, token: string): Promise<any> => {
  return await apiFetch(`/admin/psicologos/${psicologoId}`, 'DELETE', undefined, token);
};

export const deletarAgendamento = async (agendamentoId: number, token: string): Promise<any> => {
  console.log('📤 deletarAgendamento chamado:', { agendamentoId, tokenPresente: !!token });
  try {
    // DELETE não precisa de body
    const resultado = await apiFetch(`/agendamentos/${agendamentoId}`, 'DELETE', undefined, token);
    console.log('✅ Agendamento deletado com sucesso:', resultado);
    return resultado;
  } catch (error: any) {
    console.error('❌ Erro ao deletar agendamento:', error);
    console.error('❌ Status:', error?.response?.status);
    console.error('❌ Dados:', error?.response?.data);
    throw error;
  }
};

/**
 * Listar profissionais
 */
export const listarPsicologosPublicos = async (filtro?: { especializacao?: string; faixa?: string; pacienteId?: number; apenasVinculados?: boolean }, token?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (filtro?.especializacao) params.append('especializacao', filtro.especializacao);
  if (filtro?.faixa) params.append('faixa', filtro.faixa);
  if (filtro?.pacienteId) params.append('pacienteId', filtro.pacienteId.toString());
  if (filtro?.apenasVinculados) params.append('apenasVinculados', 'true');
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
 * Atualização de usuário
 */
export const updateUsuario = async (id: number, dados: { nome: string; email: string }, token: string): Promise<any> => {
  return await apiFetch(`/usuarios/${id}`, 'PUT', dados, token);
};

/**
 * Configuração da URL base da API
 * Detecta automaticamente o ambiente e usa a URL apropriada
 */
const getBaseUrl = (): string => {
  // Se houver uma variável de ambiente definida, usa ela (prioridade)
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Para web, usa localhost
  if (typeof window !== 'undefined' && window.location) {
    return 'http://localhost:3333';
  }

  // Para React Native/Expo
  // No Android emulador, usa 10.0.2.2 em vez de localhost
  // No iOS emulador, localhost funciona
  // Para dispositivos físicos, você precisa usar o IP da sua máquina na rede local
  // Exemplo: 'http://192.168.1.100:3333' (substitua pelo seu IP)
  
  // Por padrão, tenta localhost (funciona no iOS emulador e web)
  // Para Android emulador, você pode mudar para 'http://10.0.2.2:3333'
  // Para dispositivo físico, use o IP da sua máquina: 'http://SEU_IP:3333'
  return 'http://localhost:3333';
};

const BASE_URL = getBaseUrl();

// Log da URL base para debug (apenas em desenvolvimento)
if (__DEV__) {
  console.log('🔗 API Base URL:', BASE_URL);
}

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

  // Log detalhado para debugging (especialmente para criarNotaSessao e agendamentos)
  if ((endpoint.includes('notas-sessoes') || endpoint.includes('agendamentos')) && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    const acao = endpoint.includes('cancelar') ? 'Cancelar/Deletar agendamento' : 
                 endpoint.includes('agendamentos') && method === 'POST' ? 'Criando agendamento' :
                 endpoint.includes('agendamentos') && method === 'PUT' ? 'Atualizando agendamento' :
                 endpoint.includes('agendamentos') && method === 'DELETE' ? 'Deletando agendamento' :
                 'Criando nota';
    console.log('🌐 [apiFetch] Requisição:', acao);
    console.log('🌐 [apiFetch] URL completa:', `${BASE_URL}${endpoint}`);
    console.log('🌐 [apiFetch] Method:', method);
    console.log('🌐 [apiFetch] Body:', body ? JSON.stringify(body, null, 2) : 'vazio');
    console.log('🌐 [apiFetch] Token presente:', !!token);
    if (token) {
      console.log('🌐 [apiFetch] Token (primeiros 20 chars):', token.substring(0, 20) + '...');
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if ((endpoint.includes('notas-sessoes') || endpoint.includes('agendamentos')) && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      const tipo = endpoint.includes('cancelar') ? 'cancelar/deletar agendamento' :
                   endpoint.includes('agendamentos') ? 'agendamento' : 'nota';
      console.log('🌐 [apiFetch] ====== RESPOSTA RECEBIDA ======');
      console.log('🌐 [apiFetch] Tipo:', tipo);
      console.log('🌐 [apiFetch] Status:', response.status);
      console.log('🌐 [apiFetch] Status Text:', response.statusText);
      console.log('🌐 [apiFetch] OK:', response.ok);
      console.log('🌐 [apiFetch] URL:', response.url);
      console.log('🌐 [apiFetch] Redirected:', response.redirected);
      console.log('🌐 [apiFetch] Type:', response.type);
      
      if (!response.ok) {
        console.error('🌐 [apiFetch] ⚠️ RESPOSTA NÃO OK! Status:', response.status);
      }
    }

    if (response.status === 204) {
      console.log('🌐 [apiFetch] Resposta 204 (No Content)');
      return null;
    }

    const raw = await response.text();
    console.log('🌐 [apiFetch] Resposta raw length:', raw?.length);
    console.log('🌐 [apiFetch] Resposta raw (primeiros 500 chars):', raw?.substring(0, 500));
    
    let data: any = null;
    if (raw && raw.length > 0) {
      try {
        data = JSON.parse(raw);
        if ((endpoint.includes('notas-sessoes') || endpoint.includes('agendamentos')) && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
          console.log('🌐 [apiFetch] Dados parseados:', JSON.stringify(data, null, 2));
        }
      } catch (parseError) {
        console.error('🌐 [apiFetch] Erro ao parsear JSON:', parseError);
        console.error('🌐 [apiFetch] Raw que falhou:', raw);
        data = raw; // não-JSON, mantém como texto
        if ((endpoint.includes('notas-sessoes') || endpoint.includes('agendamentos')) && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
          console.log('🌐 [apiFetch] Resposta não é JSON, mantendo como texto');
        }
      }
    } else {
      console.log('🌐 [apiFetch] Resposta vazia (sem body)');
    }

    if (!response.ok) {
      const msg = (data && (data.erro || data.message)) || (typeof data === 'string' ? data : 'Erro na requisição');
      const error: any = new Error(msg);
      error.response = { status: response.status, statusText: response.statusText, data };
      error.status = response.status;
      if ((endpoint.includes('notas-sessoes') || endpoint.includes('agendamentos')) && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        console.error('🌐 [apiFetch] ====== ERRO NA RESPOSTA ======');
        console.error('🌐 [apiFetch] Tipo:', endpoint.includes('cancelar') ? 'cancelar/deletar agendamento' : endpoint.includes('agendamentos') ? 'agendamento' : 'nota');
        console.error('🌐 [apiFetch] Mensagem:', msg);
        console.error('🌐 [apiFetch] Status:', response.status);
        console.error('🌐 [apiFetch] Status Text:', response.statusText);
        console.error('🌐 [apiFetch] Dados do erro:', JSON.stringify(data, null, 2));
        console.error('🌐 [apiFetch] Raw response:', raw?.substring(0, 500));
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    if (endpoint.includes('notas-sessoes') && method === 'POST') {
      console.error('🌐 Erro na requisição:');
      console.error('🌐 Tipo:', error?.name);
      console.error('🌐 Mensagem:', error?.message);
      console.error('🌐 Stack:', error?.stack);
    }
    throw error;
  }
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
  console.log('🔐 [LOGIN ADMIN] Iniciando login de admin...');
  console.log('🔐 [LOGIN ADMIN] Email:', email);
  console.log('🔐 [LOGIN ADMIN] URL:', `${BASE_URL}/admin/login`);
  
  try {
    const response = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    
    console.log('🔐 [LOGIN ADMIN] Status da resposta:', response.status);
    console.log('🔐 [LOGIN ADMIN] Response OK:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ erro: 'Erro ao fazer login' }));
      console.error('❌ [LOGIN ADMIN] Erro na resposta:', errorData);
      throw new Error(errorData.erro || 'Erro ao fazer login');
    }
    
    const data = await response.json();
    console.log('✅ [LOGIN ADMIN] Login bem-sucedido!');
    console.log('✅ [LOGIN ADMIN] Token recebido:', data.token ? 'Sim' : 'Não');
    console.log('✅ [LOGIN ADMIN] Role:', data.role);
    console.log('✅ [LOGIN ADMIN] Nome:', data.nome);
    
    return data;
  } catch (error: any) {
    console.error('❌ [LOGIN ADMIN] Erro ao fazer login:', error);
    console.error('❌ [LOGIN ADMIN] Mensagem:', error.message);
    throw error;
  }
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
  dados: { 
    nome?: string;
    email?: string;
    idade?: number | null; 
    genero?: string; 
    preferencia_comunicacao?: string; 
    contato_preferido?: string;
    link_whatsapp?: string;
    link_telegram?: string;
    link_discord?: string;
    link_email?: string;
    telefone?: string;
  },
  token: string
): Promise<any> => {
  console.log('🟢 [API] updatePacienteMe chamado');
  console.log('🟢 [API] Dados:', dados);
  console.log('🟢 [API] Token presente:', !!token);
  try {
    const resultado = await apiFetch('/pacientes/me', 'PUT', dados, token);
    console.log('✅ [API] updatePacienteMe sucesso:', resultado);
    return resultado;
  } catch (error: any) {
    console.error('❌ [API] updatePacienteMe erro:', error);
    console.error('❌ [API] Erro message:', error?.message);
    console.error('❌ [API] Erro response:', error?.response);
    throw error;
  }
};

export const updatePsicologoMe = async (
  dados: { 
    nome?: string; 
    email?: string;
    crp?: string; 
    especializacoes?: string[]; 
    bio?: string; 
    foto_perfil?: string; 
    telefone?: string | null;
    redes_sociais?: any;
    perfil_completo?: boolean 
  },
  token: string
): Promise<any> => {
  console.log('🟢 [API] updatePsicologoMe chamado');
  console.log('🟢 [API] Dados:', dados);
  console.log('🟢 [API] Token presente:', !!token);
  try {
    const resultado = await apiFetch('/psicologos/me', 'PUT', dados, token);
    console.log('✅ [API] updatePsicologoMe sucesso:', resultado);
    return resultado;
  } catch (error: any) {
    console.error('❌ [API] updatePsicologoMe erro:', error);
    console.error('❌ [API] Erro message:', error?.message);
    console.error('❌ [API] Erro response:', error?.response);
    throw error;
  }
};

export const getPsicologoMe = async (token: string): Promise<any> => {
  return await apiFetch('/psicologos/me', 'GET', undefined, token);
};

export const listarAtendimentosDoPsicologo = async (token: string): Promise<any[]> => {
  try {
    const result = await apiFetch('/atendimentos/psicologo/meus', 'GET', undefined, token);
    // Garantir que sempre retorne um array
    if (Array.isArray(result)) {
      return result;
    }
    console.warn('⚠️ listarAtendimentosDoPsicologo: resposta não é um array:', result);
    return [];
  } catch (error: any) {
    console.error('❌ Erro ao buscar atendimentos do psicólogo:', error?.message || error);
    return [];
  }
};

export const listarAtendimentosDoPaciente = async (token: string): Promise<any[]> => {
  return await apiFetch('/atendimentos/paciente/meus', 'GET', undefined, token);
};

export const listarPsicologosVinculadosPorAtendimentos = async (token: string): Promise<any[]> => {
  try {
    const result = await apiFetch('/psicologos/vinculados', 'GET', undefined, token);
    
    // Garantir que sempre retorne um array
    if (Array.isArray(result)) {
      return result;
    }
    return [];
  } catch (error: any) {
    console.error('Erro ao buscar psicólogos vinculados:', error?.message || error);
    return [];
  }
};

/**
 * Horários disponíveis do psicólogo
 */
export const listarHorariosDisponiveis = async (token: string): Promise<any[]> => {
  return await apiFetch('/horarios-disponiveis', 'GET', undefined, token);
};

export const criarHorarioDisponivel = async (
  dados: { dia_semana: number; hora_inicio: string; hora_fim: string; duracao_minutos?: number; ativo?: boolean },
  token: string
): Promise<any> => {
  return await apiFetch('/horarios-disponiveis', 'POST', dados, token);
};

export const atualizarHorarioDisponivel = async (
  id: number,
  dados: { dia_semana?: number; hora_inicio?: string; hora_fim?: string; duracao_minutos?: number; ativo?: boolean },
  token: string
): Promise<any> => {
  return await apiFetch(`/horarios-disponiveis/${id}`, 'PUT', dados, token);
};

export const removerHorarioDisponivel = async (id: number, token: string): Promise<any> => {
  console.log('API: Removendo horário', id);
  console.log('API: URL completa:', `${BASE_URL}/horarios-disponiveis/${id}`);
  console.log('API: Método: DELETE');
  console.log('API: Token presente:', !!token);
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    console.log('API: Fazendo requisição DELETE...');
    const response = await fetch(`${BASE_URL}/horarios-disponiveis/${id}`, {
      method: 'DELETE',
      headers,
    });

    console.log('API: Status da resposta:', response.status);
    console.log('API: Response ok?', response.ok);

    if (response.status === 204) {
      console.log('API: Resposta 204 (No Content)');
      return { ok: true };
    }

    const raw = await response.text();
    console.log('API: Resposta raw:', raw);
    
    let data: any = null;
    if (raw && raw.length > 0) {
      try {
        data = JSON.parse(raw);
        console.log('API: Dados parseados:', data);
      } catch {
        data = raw;
        console.log('API: Resposta não é JSON');
      }
    }

    if (!response.ok) {
      console.error('API: Resposta não OK');
      const msg = (data && (data.erro || data.message)) || (typeof data === 'string' ? data : 'Erro na requisição');
      throw new Error(msg);
    }

    console.log('API: Sucesso!', data);
    return data;
  } catch (error: any) {
    console.error('API: Erro ao remover horário:', error);
    throw error;
  }
};

export const getSlotsDisponiveis = async (psicologoId: number, data: string): Promise<{ slots: string[] }> => {
  return await apiFetch(`/horarios-disponiveis/slots?psicologoId=${psicologoId}&data=${data}`);
};

export const getDiasSemanaDisponiveis = async (psicologoId: number): Promise<{ diasSemana: number[] }> => {
  return await apiFetch(`/horarios-disponiveis/dias-semana?psicologoId=${psicologoId}`);
};

export const listarHorariosDisponiveisPublico = async (psicologoId: number): Promise<any[]> => {
  return await apiFetch(`/horarios-disponiveis/publico?psicologoId=${psicologoId}`);
};

/**
 * Notas e Sessões
 */
export const listarNotasSessoes = async (idPaciente?: number, token?: string): Promise<any[]> => {
  const params = idPaciente ? `?id_paciente=${idPaciente}` : '';
  return await apiFetch(`/notas-sessoes${params}`, 'GET', undefined, token);
};

export const criarNotaSessao = async (
  dados: { id_paciente: number; titulo: string; conteudo: string; data_sessao?: string; id_agendamento?: number },
  token: string
): Promise<any> => {
  return await apiFetch('/notas-sessoes', 'POST', dados, token);
};

export const atualizarNotaSessao = async (
  id: number,
  dados: { titulo: string; conteudo: string; data_sessao?: string },
  token: string
): Promise<any> => {
  return await apiFetch(`/notas-sessoes/${id}`, 'PUT', dados, token);
};

export const removerNotaSessao = async (id: number, token: string): Promise<any> => {
  return await apiFetch(`/notas-sessoes/${id}`, 'DELETE', undefined, token);
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

/**
 * Listar avaliações públicas
 */
export const getAvaliacoesPublicas = async (): Promise<any[]> => {
  return await apiFetch('/avaliacoes/publicas', 'GET', undefined, undefined);
};

/**
 * Criar avaliação
 */
export const criarAvaliacao = async (
  dados: { profissional_id: number; nota: number; comentario?: string; id_agendamento?: number },
  token: string
): Promise<any> => {
  return await apiFetch('/avaliacoes', 'POST', dados, token);
};

/**
 * Listar avaliações do usuário autenticado
 */
export const getAvaliacoes = async (token: string): Promise<any[]> => {
  return await apiFetch('/avaliacoes', 'GET', undefined, token);
};
