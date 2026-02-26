/**
 * Retorna a data atual no fuso BRT (UTC-3) no formato YYYY-MM-DD
 */
export const getTodayBRT = (): string => {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().split('T')[0];
};

/**
 * Formata uma data string YYYY-MM-DD em português sem problema de timezone
 */
export const formatDateBRT = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formata com dia da semana
 */
export const formatDateFullBRT = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formata abreviado para histórico: "18 fev"
 */
export const formatDateShortBRT = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  });
};
