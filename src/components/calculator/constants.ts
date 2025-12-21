export const DEFAULT_BUY_RATE: number = 62.05;
export const DEFAULT_SELL_RATE: number = 63.90;

export const MONTHS: string[] = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const YEARS: number[] = Array.from({ length: 20 }, (_, i) => (new Date().getFullYear() - 1) + i);

export const MORTGAGE_TERMS: number[] = [20, 25, 30];