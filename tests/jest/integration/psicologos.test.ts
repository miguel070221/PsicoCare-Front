import {
  listarPsicologosPublicos,
  toggleDisponibilidade,
  getPsicologoMe,
  updatePsicologoMe,
} from '../../../lib/api';

// Mock global fetch
global.fetch = jest.fn();

const BASE_URL = 'http://localhost:3333';

describe('Psicólogos - API Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('listarPsicologosPublicos', () => {
    it('deve listar psicólogos públicos sem filtros', async () => {
      const mockResponse = [
        {
          id: 1,
          nome: 'Psicólogo 1',
          crp: '12345',
          especializacoes: ['Ansiedade'],
          disponivel: true,
        },
        {
          id: 2,
          nome: 'Psicólogo 2',
          crp: '67890',
          especializacoes: ['Depressão'],
          disponivel: true,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await listarPsicologosPublicos();

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/public`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar psicólogos por especialização', async () => {
      const mockResponse = [
        {
          id: 1,
          nome: 'Psicólogo 1',
          especializacoes: ['Ansiedade'],
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await listarPsicologosPublicos({ especializacao: 'Ansiedade' });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/public?especializacao=Ansiedade`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar psicólogos vinculados a um paciente', async () => {
      const mockResponse = [
        {
          id: 1,
          nome: 'Psicólogo Vinculado',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await listarPsicologosPublicos(
        { pacienteId: 1, apenasVinculados: true },
        token
      );

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/public?pacienteId=1&apenasVinculados=true`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('toggleDisponibilidade', () => {
    it('deve ativar disponibilidade do psicólogo', async () => {
      const mockResponse = {
        id: 1,
        disponivel: true,
        mensagem: 'Disponibilidade atualizada',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await toggleDisponibilidade(true, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/toggle-disponibilidade`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
          body: JSON.stringify({ disponivel: true }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve desativar disponibilidade do psicólogo', async () => {
      const mockResponse = {
        id: 1,
        disponivel: false,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await toggleDisponibilidade(false, token);

      expect(result.disponivel).toBe(false);
    });
  });

  describe('getPsicologoMe', () => {
    it('deve buscar dados do psicólogo autenticado', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Psicólogo Teste',
        email: 'psicologo@teste.com',
        crp: '12345',
        especializacoes: ['Ansiedade', 'Depressão'],
        bio: 'Bio do psicólogo',
        disponivel: true,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getPsicologoMe(token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/me`,
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

  describe('updatePsicologoMe', () => {
    it('deve atualizar perfil do psicólogo com sucesso', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Psicólogo Atualizado',
        bio: 'Nova bio',
        especializacoes: ['Ansiedade', 'TOC'],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        nome: 'Psicólogo Atualizado',
        bio: 'Nova bio',
        especializacoes: ['Ansiedade', 'TOC'],
      };

      const result = await updatePsicologoMe(dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/me`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });
});

