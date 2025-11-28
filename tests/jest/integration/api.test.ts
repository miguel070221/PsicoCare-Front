import {
  loginPaciente,
  loginPsicologo,
  loginAdmin,
  cadastrarUsuario,
  criarAgendamento,
  getAgendamentosUsuario,
  criarAcompanhamento,
  getAcompanhamentos,
  atualizarAcompanhamento,
  deletarAcompanhamento,
} from '../../../lib/api';

// Mock global fetch
global.fetch = jest.fn();

const BASE_URL = 'http://localhost:3333';

describe('API Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('loginPaciente', () => {
    it('deve fazer login de paciente com sucesso', async () => {
      const mockResponse = {
        token: 'mock-token',
        nome: 'Paciente Teste',
        email: 'paciente@teste.com',
        role: 'paciente',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await loginPaciente({
        email: 'paciente@teste.com',
        senha: 'senha123',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/pacientes/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'paciente@teste.com',
            senha: 'senha123',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve lançar erro quando login falha', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ erro: 'Credenciais inválidas' }),
      });

      await expect(
        loginPaciente({
          email: 'paciente@teste.com',
          senha: 'senha-errada',
        })
      ).rejects.toThrow();
    });
  });

  describe('loginPsicologo', () => {
    it('deve fazer login de psicólogo com sucesso', async () => {
      const mockResponse = {
        token: 'mock-token',
        nome: 'Psicólogo Teste',
        email: 'psicologo@teste.com',
        role: 'psicologo',
        profissionalId: 1,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await loginPsicologo({
        email: 'psicologo@teste.com',
        senha: 'senha123',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('loginAdmin', () => {
    it('deve fazer login de admin com sucesso', async () => {
      const mockResponse = {
        token: 'mock-token',
        nome: 'Admin Teste',
        email: 'admin@teste.com',
        role: 'admin',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await loginAdmin({
        email: 'admin@teste.com',
        senha: 'senha123',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('cadastrarUsuario', () => {
    it('deve cadastrar paciente com sucesso', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Novo Paciente',
        email: 'novo@teste.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cadastrarUsuario({
        nome: 'Novo Paciente',
        email: 'novo@teste.com',
        senha: 'senha123',
        telefone: '11999999999',
        nascimento: '2000-01-01',
        tipo: 'paciente',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/pacientes/register`,
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve cadastrar psicólogo com sucesso', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Novo Psicólogo',
        email: 'novo@teste.com',
        crp: '12345',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cadastrarUsuario({
        nome: 'Novo Psicólogo',
        email: 'novo@teste.com',
        senha: 'senha123',
        telefone: '11999999999',
        nascimento: '2000-01-01',
        tipo: 'psicologo',
        crp: '12345',
        especialidade: 'Psicologia Clínica',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/register`,
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('criarAgendamento', () => {
    it('deve criar agendamento com sucesso', async () => {
      const mockResponse = {
        id: 1,
        data_hora: '2024-12-25T14:30:00',
        paciente_id: 1,
        profissional_id: 1,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await criarAgendamento(
        {
          data_hora: '2024-12-25T14:30:00',
          paciente_id: 1,
        },
        token
      );

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/agendamentos`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAgendamentosUsuario', () => {
    it('deve buscar agendamentos do usuário', async () => {
      const mockResponse = [
        {
          id: 1,
          data_hora: '2024-12-25T14:30:00',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getAgendamentosUsuario(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/agendamentos`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('criarAcompanhamento', () => {
    it('deve criar acompanhamento com sucesso', async () => {
      const mockResponse = {
        id: 1,
        texto: 'Acompanhamento teste',
        qualidade_sono: 8,
        humor: 'feliz',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await criarAcompanhamento(
        {
          texto: 'Acompanhamento teste',
          qualidade_sono: 8,
          humor: 'feliz',
        },
        token
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAcompanhamentos', () => {
    it('deve buscar acompanhamentos do usuário', async () => {
      const mockResponse = [
        {
          id: 1,
          texto: 'Acompanhamento 1',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getAcompanhamentos(token);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('atualizarAcompanhamento', () => {
    it('deve atualizar acompanhamento com sucesso', async () => {
      const mockResponse = {
        id: 1,
        texto: 'Acompanhamento atualizado',
        qualidade_sono: 9,
        humor: 'muito feliz',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await atualizarAcompanhamento(
        1,
        {
          texto: 'Acompanhamento atualizado',
          qualidade_sono: 9,
        },
        token
      );

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/acompanhamentos/1`,
        expect.objectContaining({
          method: 'PUT',
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('deletarAcompanhamento', () => {
    it('deve deletar acompanhamento com sucesso', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      const token = 'mock-token';
      const result = await deletarAcompanhamento(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/acompanhamentos/1`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );

      expect(result).toBeNull();
    });
  });
});

