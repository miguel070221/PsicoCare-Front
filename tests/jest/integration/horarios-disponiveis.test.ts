import {
  listarHorariosDisponiveis,
  criarHorarioDisponivel,
  atualizarHorarioDisponivel,
  removerHorarioDisponivel,
  getSlotsDisponiveis,
  getDiasSemanaDisponiveis,
  listarHorariosDisponiveisPublico,
} from '../../../lib/api';

// Mock global fetch
global.fetch = jest.fn();

const BASE_URL = 'http://localhost:3333';

describe('Horários Disponíveis - API Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('listarHorariosDisponiveis', () => {
    it('deve listar horários disponíveis do psicólogo', async () => {
      const mockResponse = [
        {
          id: 1,
          dia_semana: 1, // Segunda-feira
          hora_inicio: '09:00',
          hora_fim: '12:00',
          duracao_minutos: 60,
          ativo: true,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await listarHorariosDisponiveis(token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/horarios-disponiveis`,
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

  describe('criarHorarioDisponivel', () => {
    it('deve criar horário disponível com sucesso', async () => {
      const mockResponse = {
        id: 1,
        dia_semana: 1,
        hora_inicio: '09:00',
        hora_fim: '12:00',
        duracao_minutos: 60,
        ativo: true,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        dia_semana: 1,
        hora_inicio: '09:00',
        hora_fim: '12:00',
        duracao_minutos: 60,
        ativo: true,
      };

      const result = await criarHorarioDisponivel(dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/horarios-disponiveis`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('atualizarHorarioDisponivel', () => {
    it('deve atualizar horário disponível com sucesso', async () => {
      const mockResponse = {
        id: 1,
        hora_inicio: '10:00',
        hora_fim: '13:00',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        hora_inicio: '10:00',
        hora_fim: '13:00',
      };

      const result = await atualizarHorarioDisponivel(1, dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/horarios-disponiveis/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('removerHorarioDisponivel', () => {
    it('deve remover horário disponível com sucesso', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      const token = 'mock-token';
      const result = await removerHorarioDisponivel(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/horarios-disponiveis/1`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );

      expect(result).toBeDefined();
    });
  });

  describe('getSlotsDisponiveis', () => {
    it('deve buscar slots disponíveis para uma data', async () => {
      const mockResponse = {
        slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getSlotsDisponiveis(1, '2024-12-25');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/horarios-disponiveis/slots?psicologoId=1&data=2024-12-25`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.slots).toBeInstanceOf(Array);
    });
  });

  describe('getDiasSemanaDisponiveis', () => {
    it('deve buscar dias da semana disponíveis', async () => {
      const mockResponse = {
        diasSemana: [1, 2, 3, 4, 5], // Segunda a Sexta
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getDiasSemanaDisponiveis(1);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/horarios-disponiveis/dias-semana?psicologoId=1`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.diasSemana).toBeInstanceOf(Array);
    });
  });

  describe('listarHorariosDisponiveisPublico', () => {
    it('deve listar horários disponíveis publicamente', async () => {
      const mockResponse = [
        {
          id: 1,
          dia_semana: 1,
          hora_inicio: '09:00',
          hora_fim: '12:00',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await listarHorariosDisponiveisPublico(1);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/horarios-disponiveis/publico?psicologoId=1`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });
});

