/**
 * Formata hora automaticamente adicionando ":"
 * Exemplo: "1430" -> "14:30"
 */
export const formatarHora = (valor: string): string => {
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, '');
  
  // Limita a 4 dígitos
  const limitado = numeros.slice(0, 4);
  
  // Adiciona ":" após 2 dígitos
  if (limitado.length <= 2) {
    return limitado;
  }
  
  return `${limitado.slice(0, 2)}:${limitado.slice(2)}`;
};

/**
 * Formata data automaticamente adicionando "/"
 * Exemplo: "25122024" -> "25/12/2024"
 */
export const formatarData = (valor: string): string => {
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, '');
  
  // Limita a 8 dígitos
  const limitado = numeros.slice(0, 8);
  
  // Adiciona "/" após 2 e 4 dígitos
  if (limitado.length <= 2) {
    return limitado;
  }
  
  if (limitado.length <= 4) {
    return `${limitado.slice(0, 2)}/${limitado.slice(2)}`;
  }
  
  return `${limitado.slice(0, 2)}/${limitado.slice(2, 4)}/${limitado.slice(4)}`;
};

/**
 * Converte data formatada (DD/MM/AAAA) para formato DD-MM-AAAA
 */
export const converterDataParaFormato = (dataFormatada: string): string => {
  // Remove "/" e substitui por "-"
  return dataFormatada.replace(/\//g, '-');
};

/**
 * Converte hora formatada para formato HH:MM válido
 */
export const validarHoraFormatada = (hora: string): boolean => {
  const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(hora);
};

/**
 * Converte data formatada para formato DD-MM-AAAA válido
 */
export const validarDataFormatada = (data: string): boolean => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(data)) {
    return false;
  }
  
  const [, dia, mes, ano] = data.match(regex) || [];
  const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
  
  return dataObj.getDate() === Number(dia) && 
         dataObj.getMonth() === Number(mes) - 1 && 
         dataObj.getFullYear() === Number(ano);
};




