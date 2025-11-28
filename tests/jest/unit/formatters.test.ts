import {
  formatarHora,
  formatarData,
  converterDataParaFormato,
  validarHoraFormatada,
  validarDataFormatada,
} from '../../../lib/formatters';

describe('Formatters', () => {
  describe('formatarHora', () => {
    it('deve formatar hora corretamente', () => {
      expect(formatarHora('1430')).toBe('14:30');
      expect(formatarHora('0900')).toBe('09:00');
      expect(formatarHora('2359')).toBe('23:59');
    });

    it('deve lidar com menos de 4 dígitos', () => {
      expect(formatarHora('14')).toBe('14');
      expect(formatarHora('1')).toBe('1');
    });

    it('deve remover caracteres não numéricos', () => {
      expect(formatarHora('14:30')).toBe('14:30');
      expect(formatarHora('abc1430def')).toBe('14:30');
    });

    it('deve limitar a 4 dígitos', () => {
      expect(formatarHora('143059')).toBe('14:30');
    });
  });

  describe('formatarData', () => {
    it('deve formatar data corretamente', () => {
      expect(formatarData('25122024')).toBe('25/12/2024');
      expect(formatarData('01012024')).toBe('01/01/2024');
    });

    it('deve lidar com menos de 8 dígitos', () => {
      expect(formatarData('25')).toBe('25');
      expect(formatarData('2512')).toBe('25/12');
    });

    it('deve remover caracteres não numéricos', () => {
      expect(formatarData('25/12/2024')).toBe('25/12/2024');
      expect(formatarData('abc25122024def')).toBe('25/12/2024');
    });

    it('deve limitar a 8 dígitos', () => {
      expect(formatarData('25122024123')).toBe('25/12/2024');
    });
  });

  describe('converterDataParaFormato', () => {
    it('deve converter data de DD/MM/AAAA para DD-MM-AAAA', () => {
      expect(converterDataParaFormato('25/12/2024')).toBe('25-12-2024');
      expect(converterDataParaFormato('01/01/2024')).toBe('01-01-2024');
    });
  });

  describe('validarHoraFormatada', () => {
    it('deve validar horas válidas', () => {
      expect(validarHoraFormatada('00:00')).toBe(true);
      expect(validarHoraFormatada('12:30')).toBe(true);
      expect(validarHoraFormatada('23:59')).toBe(true);
    });

    it('deve rejeitar horas inválidas', () => {
      expect(validarHoraFormatada('24:00')).toBe(false);
      expect(validarHoraFormatada('12:60')).toBe(false);
      expect(validarHoraFormatada('25:30')).toBe(false);
      expect(validarHoraFormatada('12:30:00')).toBe(false);
      expect(validarHoraFormatada('1:30')).toBe(false);
    });
  });

  describe('validarDataFormatada', () => {
    it('deve validar datas válidas', () => {
      expect(validarDataFormatada('01/01/2024')).toBe(true);
      expect(validarDataFormatada('31/12/2024')).toBe(true);
      expect(validarDataFormatada('29/02/2024')).toBe(true); // Ano bissexto
    });

    it('deve rejeitar datas inválidas', () => {
      expect(validarDataFormatada('32/01/2024')).toBe(false);
      expect(validarDataFormatada('31/02/2024')).toBe(false);
      expect(validarDataFormatada('29/02/2023')).toBe(false); // Não é bissexto
      expect(validarDataFormatada('01-01-2024')).toBe(false);
      expect(validarDataFormatada('1/1/2024')).toBe(false);
    });
  });
});

