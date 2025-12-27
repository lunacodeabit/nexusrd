export const Currency = {
  USD: 'USD',
  DOP: 'DOP',
} as const;
export type Currency = typeof Currency[keyof typeof Currency];

export const ActiveCalculator = {
  PaymentPlan: 'paymentPlan',
  Mortgage: 'mortgage',
  Converter: 'converter',
} as const;
export type ActiveCalculator = typeof ActiveCalculator[keyof typeof ActiveCalculator];

export interface AmortizationEntry {
  month: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  monthlyPayment: number;
}

export interface ExtraPayment {
  id: number;
  description: string;
  amount: string;
  startMonth: number;
  startYear: number;
  frequency: number; // in months. 0 = one-time
  isBalonExtra?: boolean; // Si es true, no se resta de construcción
}