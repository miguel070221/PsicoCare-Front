import {
  getPacienteMe,
  updatePacienteMe,
  getPsicologoMe,
  updatePsicologoMe,
} from '../../../lib/api';

// Mock global fetch
global.fetch = jest.fn();

const BASE_URL = 'http://localhost:3333';

describe('Perfil - API Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('getPacienteMe', () => {
    it('deve buscar dados do paciente autenticado', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Paciente Teste',
        email: 'paciente@teste.com',
        idade: 30,
        genero: 'masculino',
        preferencia_comunicacao: 'WhatsApp',
        contato_preferido: '11999999999',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getPacienteMe(token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/pacientes/me`,
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

  describe('updatePacienteMe', () => {
    it('deve atualizar perfil do paciente com sucesso', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Paciente Atualizado',
        email: 'novo@email.com',
        idade: 31,
        genero: 'feminino',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        nome: 'Paciente Atualizado',
        email: 'novo@email.com',
        idade: 31,
        genero: 'feminino',
        preferencia_comunicacao: 'Telegram',
        contato_preferido: '11988888888',
      };

      const result = await updatePacienteMe(dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/pacientes/me`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('deve atualizar links de contato', async () => {
      const mockResponse = {
        id: 1,
        link_whatsapp: 'https://wa.me/5511999999999',
        link_telegram: '@usuario',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        link_whatsapp: 'https://wa.me/5511999999999',
        link_telegram: '@usuario',
        link_discord: 'usuario#1234',
        link_email: 'email@exemplo.com',
      };

      const result = await updatePacienteMe(dados, token);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPsicologoMe', () => {
    it('deve buscar dados do psicólogo autenticado', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Psicólogo Teste',
        email: 'psicologo@teste.com',
        crp: '12345',
        especializacoes: ['Ansiedade'],
        bio: 'Bio do psicólogo',
        disponivel: true,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getPsicologoMe(token);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePsicologoMe', () => {
    it('deve atualizar perfil do psicólogo com sucesso', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Psicólogo Atualizado',
        bio: 'Nova bio atualizada',
        especializacoes: ['Ansiedade', 'Depressão', 'TOC'],
        crp: '12345',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        nome: 'Psicólogo Atualizado',
        bio: 'Nova bio atualizada',
        especializacoes: ['Ansiedade', 'Depressão', 'TOC'],
        telefone: '11999999999',
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

    it('deve atualizar redes sociais', async () => {
      const mockResponse = {
        id: 1,
        redes_sociais: {
          instagram: '@psicologo',
          linkedin: 'linkedin.com/in/psicologo',
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        redes_sociais: {
          instagram: '@psicologo',
          linkedin: 'linkedin.com/in/psicologo',
        },
      };

      const result = await updatePsicologoMe(dados, token);

      expect(result).toEqual(mockResponse);
    });
  });
});

