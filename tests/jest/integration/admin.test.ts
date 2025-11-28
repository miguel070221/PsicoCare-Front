import {
  listarUsuariosCompleto,
  getPacienteDetalhes,
  getPsicologoDetalhes,
  editarPacienteAdmin,
  editarPsicologoAdmin,
  excluirPacienteAdmin,
  excluirPsicologoAdmin,
} from '../../../lib/api';

// Mock global fetch
global.fetch = jest.fn();

const BASE_URL = 'http://localhost:3333';

describe('Admin - API Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('listarUsuariosCompleto', () => {
    it('deve listar todos os usuários (pacientes e psicólogos)', async () => {
      const mockResponse = {
        pacientes: [
          { id: 1, nome: 'Paciente 1', email: 'paciente1@teste.com' },
          { id: 2, nome: 'Paciente 2', email: 'paciente2@teste.com' },
        ],
        psicologos: [
          { id: 3, nome: 'Psicólogo 1', email: 'psicologo1@teste.com', crp: '12345' },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await listarUsuariosCompleto(token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/admin/usuarios/completo`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.pacientes).toBeInstanceOf(Array);
      expect(result.psicologos).toBeInstanceOf(Array);
    });
  });

  describe('getPacienteDetalhes', () => {
    it('deve buscar detalhes completos de um paciente', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Paciente Teste',
        email: 'paciente@teste.com',
        idade: 30,
        genero: 'masculino',
        agendamentos: [],
        acompanhamentos: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getPacienteDetalhes(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/admin/pacientes/1`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPsicologoDetalhes', () => {
    it('deve buscar detalhes completos de um psicólogo', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Psicólogo Teste',
        email: 'psicologo@teste.com',
        crp: '12345',
        especializacoes: ['Ansiedade'],
        pacientes: [],
        agendamentos: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const result = await getPsicologoDetalhes(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/admin/psicologos/1`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('editarPacienteAdmin', () => {
    it('deve editar paciente como admin', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Paciente Editado',
        email: 'editado@teste.com',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        nome: 'Paciente Editado',
        email: 'editado@teste.com',
        idade: 31,
        genero: 'feminino',
      };

      const result = await editarPacienteAdmin(1, dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/admin/pacientes/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('editarPsicologoAdmin', () => {
    it('deve editar psicólogo como admin', async () => {
      const mockResponse = {
        id: 1,
        nome: 'Psicólogo Editado',
        crp: '12345',
        aprovado: true,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = 'mock-token';
      const dados = {
        nome: 'Psicólogo Editado',
        crp: '12345',
        especializacoes: ['Ansiedade', 'Depressão'],
        aprovado: true,
      };

      const result = await editarPsicologoAdmin(1, dados, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/admin/psicologos/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(dados),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('excluirPacienteAdmin', () => {
    it('deve excluir paciente como admin', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      const token = 'mock-token';
      const result = await excluirPacienteAdmin(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/admin/pacientes/1`,
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

  describe('excluirPsicologoAdmin', () => {
    it('deve excluir psicólogo como admin', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      const token = 'mock-token';
      const result = await excluirPsicologoAdmin(1, token);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/admin/psicologos/1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(result).toBeNull();
    });
  });
});

