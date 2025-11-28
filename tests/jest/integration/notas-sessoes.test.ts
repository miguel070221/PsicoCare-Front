import {
  listarNotasSessoes,
  criarNotaSessao,
  atualizarNotaSessao,
  removerNotaSessao,
} from '../../../lib/api';

// Mock global fetch
global.fetch = jest.fn();

const BASE_URL = 'http://localhost:3333';

describe('Notas e Sessões - API Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('listarNotasSessoes', () => {
    it('deve listar todas as notas de sessão', async () => {
      const mockResponse = [
        {
          id: 1,
          titulo: 'Sessão 1',
          conteudo: 'Conteúdo da sessão',
          data_sessao: '2024-12-25',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await listarNotasSessoes(undefined, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/notas-sessoes`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve listar notas de um paciente específico', async () => {
      const mockResponse = [
        {
          id: 1,
          titulo: 'Sessão 1',
          id_paciente: 1,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await listarNotasSessoes(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/notas-sessoes?id_paciente=1`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('criarNotaSessao', () => {
    it('deve criar nota de sessão com sucesso', async () => {
      const mockResponse = {
        id: 1,
        titulo: 'Nova Sessão',
        conteudo: 'Conteúdo da sessão',
        id_paciente: 1,
        data_sessao: '2024-12-25',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        id_paciente: 1,
        titulo: 'Nova Sessão',
        conteudo: 'Conteúdo da sessão',
        data_sessao: '2024-12-25',
      };

      const result = await criarNotaSessao(dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/notas-sessoes`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve criar nota vinculada a um agendamento', async () => {
      const mockResponse = {
        id: 1,
        id_agendamento: 5,
        titulo: 'Sessão Agendada',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        id_paciente: 1,
        titulo: 'Sessão Agendada',
        conteudo: 'Conteúdo',
        id_agendamento: 5,
      };

      const result = await criarNotaSessao(dados, token);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('atualizarNotaSessao', () => {
    it('deve atualizar nota de sessão com sucesso', async () => {
      const mockResponse = {
        id: 1,
        titulo: 'Sessão Atualizada',
        conteudo: 'Conteúdo atualizado',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        titulo: 'Sessão Atualizada',
        conteudo: 'Conteúdo atualizado',
        data_sessao: '2024-12-26',
      };

      const result = await atualizarNotaSessao(1, dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/notas-sessoes/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('removerNotaSessao', () => {
    it('deve remover nota de sessão com sucesso', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      const token = 'mock-token';
      const result = await removerNotaSessao(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/notas-sessoes/1`,
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

