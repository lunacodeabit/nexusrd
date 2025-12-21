import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MORTGAGE_TERMS } from './constants';
import { Card } from './ui/Card';
import { InputGroup } from './ui/InputGroup';
import { Button } from './ui/Button';
import type { AmortizationEntry } from './types';
import { SparklesIcon } from './icons/SparklesIcon';
import { RefreshIcon } from './icons/RefreshIcon';

const MortgageCalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<string>('150000');
  const [interestRate, setInterestRate] = useState<string>('5.5');
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [amortizationTable, setAmortizationTable] = useState<AmortizationEntry[]>([]);

  // State for AI Advisor
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return `US$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { monthlyPayment, totalInterest, totalPayment, principal } = useMemo(() => {
    const _loanAmount = parseFloat(loanAmount) || 0;
    const _interestRate = parseFloat(interestRate) || 0;

    if (_loanAmount <= 0 || _interestRate <= 0) {
      return { monthlyPayment: 0, totalInterest: 0, totalPayment: 0, principal: _loanAmount };
    }
    const monthlyInterestRate = _interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const power = Math.pow(1 + monthlyInterestRate, numberOfPayments);
    const monthly = _loanAmount * (monthlyInterestRate * power) / (power - 1);

    const total = monthly * numberOfPayments;
    const interest = total - _loanAmount;

    return { monthlyPayment: monthly, totalInterest: interest, totalPayment: total, principal: _loanAmount };
  }, [loanAmount, interestRate, loanTerm]);

  const handleAnalyzeMortgage = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    setAiAdvice('');

    const _interestRate = parseFloat(interestRate) || 0;

    const prompt = `
      Actúa como un asesor financiero experto en el mercado inmobiliario de la República Dominicana.
      Analiza la siguiente situación de préstamo hipotecario y proporciona consejos claros, concisos y accionables.
      El consejo debe estar en español y formateado en markdown con viñetas.
      
      Detalles del Préstamo:
      - Monto del Préstamo: ${formatCurrency(principal)}
      - Tasa de Interés Anual: ${_interestRate}%
      - Plazo del Préstamo: ${loanTerm} años
      - Pago Mensual Estimado: ${formatCurrency(monthlyPayment)}
      
      Proporciona consejos sobre los siguientes puntos:
      1.  **Asequibilidad:** ¿Es este un pago mensual manejable para un ingreso promedio en RD? Da un contexto general.
      2.  **Ahorro en Intereses:** Sugiere 2-3 estrategias específicas para pagar el préstamo más rápido y ahorrar en intereses (ej. pagos extraordinarios, aumento de cuota). Cuantifica un ejemplo si es posible.
      3.  **Consideraciones Adicionales:** Menciona brevemente un punto clave a tener en cuenta en RD (ej. seguros asociados, impacto de la inflación/devaluación del peso).
      
      Mantén el tono profesional, alentador y fácil de entender para alguien que no es un experto en finanzas.
      NO incluyas un saludo o despedida, solo ve directo al análisis y los consejos.
    `;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.5 }
      });

      const text = response.text || '';
      setAiAdvice(text);

    } catch (error) {
      console.error("Error fetching AI advice:", error);
      setAiError("No se pudo obtener el consejo. Inténtalo de nuevo más tarde.");
    } finally {
      setIsAnalyzing(false);
    }
  };


  const generateAmortization = () => {
    const _loanAmount = parseFloat(loanAmount) || 0;
    const _interestRate = parseFloat(interestRate) || 0;

    if (_loanAmount <= 0 || _interestRate <= 0) {
      setAmortizationTable([]);
      return;
    }

    const table: AmortizationEntry[] = [];
    let balance = _loanAmount;
    const monthlyInterestRate = _interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    for (let i = 1; i <= numberOfPayments; i++) {
      const interestPayment = balance * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      table.push({
        month: i,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: balance > 0 ? balance : 0,
        monthlyPayment: monthlyPayment
      });
    }
    setAmortizationTable(table);
  };

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Calculadora de Hipoteca y Amortización</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Parámetros del Préstamo">
            <div className="space-y-4">
              <InputGroup label="Monto del Préstamo" type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} prefix="US$" />
              <InputGroup label="Tasa de Interés Anual" type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} suffix="%" />
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Plazo del Préstamo (Años)</label>
                <div className="flex space-x-2">
                  {MORTGAGE_TERMS.map(term => (
                    <Button key={term} onClick={() => setLoanTerm(term)} className={`flex-1 ${loanTerm === term ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                      {term} Años
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Resumen del Préstamo">
            <div className="space-y-4 text-lg">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Pago Mensual:</span>
                <span className="font-bold text-blue-500 text-2xl">{formatCurrency(monthlyPayment)}</span>
              </div>
              <hr className="border-slate-200 dark:border-slate-700" />
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Principal Total:</span>
                <span className="font-semibold">{formatCurrency(principal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Interés Total:</span>
                <span className="font-semibold">{formatCurrency(totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Costo Total:</span>
                <span className="font-semibold">{formatCurrency(totalPayment)}</span>
              </div>
            </div>
            <Button onClick={generateAmortization} className="w-full mt-6 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">Generar Tabla de Amortización</Button>
          </Card>

          <Card title="Consejero Financiero AI">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Obtén consejos personalizados de nuestra IA basados en los datos de tu préstamo para tomar mejores decisiones financieras.
            </p>
            <Button onClick={handleAnalyzeMortgage} disabled={isAnalyzing || (parseFloat(loanAmount) || 0) <= 0} className="w-full text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isAnalyzing ? (
                <>
                  <RefreshIcon className="animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Analizar mi Hipoteca
                </>
              )}
            </Button>

            {aiAdvice && !isAnalyzing && (
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAdvice}</ReactMarkdown>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-right mt-2 italic">- Generado por Gemini</p>
              </div>
            )}

            {aiError && !isAnalyzing && (
              <p className="text-sm text-red-500 mt-2 text-center">{aiError}</p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3">
          {amortizationTable.length > 0 ? (
            <Card title="Tabla de Amortización">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Mes</th>
                      <th className="p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Principal</th>
                      <th className="p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Interés</th>
                      <th className="p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationTable.map((entry) => (
                      <tr key={entry.month} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-2 text-sm">{entry.month}</td>
                        <td className="p-2 text-sm text-right font-mono">{formatCurrency(entry.principal)}</td>
                        <td className="p-2 text-sm text-right font-mono">{formatCurrency(entry.interest)}</td>
                        <td className="p-2 text-sm text-right font-mono">{formatCurrency(entry.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card title="Tabla de Amortización">
              <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400 text-center px-4">
                  Haga clic en "Generar Tabla de Amortización" para ver el desglose detallado de su préstamo.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;