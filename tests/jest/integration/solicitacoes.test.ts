import {
  solicitarAtendimento,
  listarSolicitacoesPendentesPsicologo,
  aceitarSolicitacaoPsicologo,
  recusarSolicitacaoPsicologo,
  getSolicitacoes,
  aceitarSolicitacao,
} from '../../../lib/api';

// Mock global fetch
global.fetch = jest.fn();

const BASE_URL = 'http://localhost:3333';

describe('Solicitações de Vínculo - API Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('solicitarAtendimento', () => {
    it('deve solicitar vínculo com psicólogo com sucesso', async () => {
      const mockResponse = {
        id: 1,
        id_paciente: 1,
        id_psicologo: 2,
        status: 'pendente',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await solicitarAtendimento(2, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/solicitacoes`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
          body: JSON.stringify({ id_psicologo: 2 }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve lançar erro quando solicitação falha', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ erro: 'Psicólogo não encontrado' }),
      });

      await expect(solicitarAtendimento(999, 'token')).rejects.toThrow();
    });
  });

  describe('listarSolicitacoesPendentesPsicologo', () => {
    it('deve listar solicitações pendentes do psicólogo', async () => {
      const mockResponse = [
        {
          id: 1,
          id_paciente: 1,
          id_psicologo: 2,
          status: 'pendente',
          paciente: { nome: 'Paciente Teste' },
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await listarSolicitacoesPendentesPsicologo(token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/solicitacoes/pendentes`,
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

  describe('aceitarSolicitacaoPsicologo', () => {
    it('deve aceitar solicitação com sucesso', async () => {
      const mockResponse = {
        id: 1,
        status: 'aceita',
        mensagem: 'Solicitação aceita com sucesso',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await aceitarSolicitacaoPsicologo(1, 1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/solicitacoes/aceitar`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ solicitacaoId: 1, id_paciente: 1 }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('recusarSolicitacaoPsicologo', () => {
    it('deve recusar solicitação com sucesso', async () => {
      const mockResponse = {
        id: 1,
        status: 'recusada',
        mensagem: 'Solicitação recusada',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await recusarSolicitacaoPsicologo(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/psicologos/solicitacoes/recusar`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ solicitacaoId: 1 }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSolicitacoes', () => {
    it('deve buscar solicitações do psicólogo', async () => {
      const mockResponse = [
        {
          id: 1,
          id_paciente: 1,
          status: 'pendente',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getSolicitacoes(2, token);

      expect(result).toEqual(mockResponse);
    });
  });
});

