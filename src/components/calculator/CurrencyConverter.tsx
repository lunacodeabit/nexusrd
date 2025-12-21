import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { InputGroup } from './ui/InputGroup';
import { ExchangeIcon } from './icons/ExchangeIcon';
import { Button } from './ui/Button';
import { RefreshIcon } from './icons/RefreshIcon';

interface CurrencyConverterProps {
  buyRate: number;
  sellRate: number;
  rateSource: string;
  isFetchingRate: boolean;
  handleFetchLiveRate: () => void;
  fetchRateError: string | null;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  buyRate,
  sellRate,
  rateSource,
  isFetchingRate,
  handleFetchLiveRate,
  fetchRateError
}) => {
  const [usd, setUsd] = useState<string>('1000');
  const [dop, setDop] = useState<string>('');

  useEffect(() => {
    const usdValue = parseFloat(usd);
    if (!isNaN(usdValue)) {
      setDop((usdValue * buyRate).toFixed(2));
    } else {
        setDop('');
    }
  }, [usd, buyRate]);
  
  const handleUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsd(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setDop((numericValue * buyRate).toFixed(2));
    } else {
        setDop('');
    }
  };

  const handleDopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDop(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && sellRate > 0) {
        setUsd((numericValue / sellRate).toFixed(2));
    } else {
        setUsd('');
    }
  };

  return (
    <div className="space-y-6 pt-16 lg:pt-0 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 text-center">Conversor de Moneda</h1>
      <div className="text-center">
        <p className="text-slate-500 dark:text-slate-400">
          Tasa Compra ({rateSource}): <strong>1 USD = {buyRate} DOP</strong>
        </p>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Tasa Venta ({rateSource}): <strong>1 USD = {sellRate} DOP</strong>
        </p>
        {rateSource === 'Fija' && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Para mayor precisión, obtén la tasa del día.
          </p>
        )}
      </div>
      
      <Card>
        <div className="flex flex-col items-center space-y-4">
            <InputGroup 
                label="Dólar Estadounidense (USD)" 
                type="number" 
                value={usd}
                onChange={handleUsdChange}
                prefix="US$"
                className="w-full"
            />

            <div className="text-slate-400 dark:text-slate-500">
                <ExchangeIcon />
            </div>

            <InputGroup 
                label="Peso Dominicano (DOP)" 
                type="number" 
                value={dop}
                onChange={handleDopChange}
                prefix="RD$"
                className="w-full"
            />
        </div>
      </Card>

      <Button 
        onClick={handleFetchLiveRate} 
        disabled={isFetchingRate} 
        className="w-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
      >
        <RefreshIcon className={isFetchingRate ? 'animate-spin' : ''} />
        {isFetchingRate ? 'Buscando...' : 'Obtener Tasa del Banco Popular'}
      </Button>
      {fetchRateError && <p className="text-sm text-red-500 mt-2 text-center">{fetchRateError}</p>}
    </div>
  );
};

export default CurrencyConverter;
