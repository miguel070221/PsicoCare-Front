import {
  criarAvaliacao,
  getAvaliacoes,
  getAvaliacoesPublicas,
} from '../../../lib/api';

// Mock global fetch
global.fetch = jest.fn();

const BASE_URL = 'http://localhost:3333';

describe('Avaliações - API Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('criarAvaliacao', () => {
    it('deve criar avaliação com sucesso', async () => {
      const mockResponse = {
        id: 1,
        profissional_id: 2,
        nota: 5,
        comentario: 'Excelente profissional',
        id_agendamento: 1,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        profissional_id: 2,
        nota: 5,
        comentario: 'Excelente profissional',
        id_agendamento: 1,
      };

      const result = await criarAvaliacao(dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/avaliacoes`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve criar avaliação sem comentário', async () => {
      const mockResponse = {
        id: 1,
        profissional_id: 2,
        nota: 4,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        profissional_id: 2,
        nota: 4,
      };

      const result = await criarAvaliacao(dados, token);

      expect(result).toEqual(mockResponse);
    });

    it('deve validar nota entre 1 e 5', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ erro: 'Nota deve estar entre 1 e 5' }),
      });

      const token = 'mock-token';
      const dados = {
        profissional_id: 2,
        nota: 6, // Nota inválida
      };

      await expect(criarAvaliacao(dados, token)).rejects.toThrow();
    });
  });

  describe('getAvaliacoes', () => {
    it('deve listar avaliações do usuário autenticado', async () => {
      const mockResponse = [
        {
          id: 1,
          profissional_id: 2,
          nota: 5,
          comentario: 'Muito bom',
        },
        {
          id: 2,
          profissional_id: 3,
          nota: 4,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getAvaliacoes(token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/avaliacoes`,
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

  describe('getAvaliacoesPublicas', () => {
    it('deve listar avaliações públicas sem autenticação', async () => {
      const mockResponse = [
        {
          id: 1,
          profissional_id: 2,
          nota: 5,
          comentario: 'Excelente',
          nome_paciente: 'Paciente 1',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getAvaliacoesPublicas();

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/avaliacoes/publicas`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });
});

