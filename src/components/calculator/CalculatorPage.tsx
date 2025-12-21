import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ActiveCalculator, Currency } from './types';
import CalculatorSidebar from './CalculatorSidebar';
import PaymentPlanCalculator from './PaymentPlanCalculator';
import MortgageCalculator from './MortgageCalculator';
import CurrencyConverter from './CurrencyConverter';
import { MenuIcon } from './icons/MenuIcon';
import { DEFAULT_BUY_RATE, DEFAULT_SELL_RATE } from './constants';
import { AlveareLogo } from './ui/AlveareLogo';

// Get API key from Vite env vars (same as CRM uses for Netlify)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const CalculatorPage: React.FC = () => {
    const [activeCalculator, setActiveCalculator] = useState<ActiveCalculator>(ActiveCalculator.PaymentPlan);
    const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [excelExportTrigger, setExcelExportTrigger] = useState(0);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedTheme = localStorage.getItem('calculatorTheme');
            if (storedTheme) return storedTheme;
            return 'dark'; // CRM uses dark theme by default
        }
        return 'dark';
    });

    const [buyRate, setBuyRate] = useState<number>(DEFAULT_BUY_RATE);
    const [sellRate, setSellRate] = useState<number>(DEFAULT_SELL_RATE);
    const [rateSource, setRateSource] = useState<string>('Fija');
    const [isFetchingRate, setIsFetchingRate] = useState<boolean>(false);
    const [fetchRateError, setFetchRateError] = useState<string | null>(null);
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const [currency, setCurrency] = useState<Currency>(Currency.USD);
    const [rateLastUpdated, setRateLastUpdated] = useState<Date | null>(null);

    // Configurable Promotion State
    const [promotionEnabled, setPromotionEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem('calculatorPromotionEnabled') === 'true';
        }
        return false;
    });
    const [promotionName, setPromotionName] = useState<string>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem('calculatorPromotionName') || 'Promoción Especial';
        }
        return 'Promoción Especial';
    });

    useEffect(() => {
        const storedLogo = localStorage.getItem('calculatorCustomLogo');
        if (storedLogo) {
            setCustomLogo(storedLogo);
        }

        // Load cached rate if exists and not expired (1 hour)
        const cachedRate = localStorage.getItem('calculatorCachedExchangeRate');
        if (cachedRate) {
            try {
                const { buyRate: cachedBuy, sellRate: cachedSell, timestamp } = JSON.parse(cachedRate);
                const cacheTime = new Date(timestamp);
                const now = new Date();
                const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < 1) {
                    // Cache is still valid
                    setBuyRate(cachedBuy);
                    setSellRate(cachedSell);
                    setRateSource('Banco Popular (Cache)');
                    setRateLastUpdated(cacheTime);
                }
            } catch (e) {
                console.error('Error parsing cached rate:', e);
            }
        }
    }, []);

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setCustomLogo(base64String);
                localStorage.setItem('calculatorCustomLogo', base64String);
                setSidebarOpen(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setCustomLogo(null);
        localStorage.removeItem('calculatorCustomLogo');
    };

    // Persist promotion settings
    useEffect(() => {
        localStorage.setItem('calculatorPromotionEnabled', String(promotionEnabled));
    }, [promotionEnabled]);

    useEffect(() => {
        localStorage.setItem('calculatorPromotionName', promotionName);
    }, [promotionName]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('calculatorTheme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('calculatorTheme', 'light');
        }
    }, [theme]);

    const handleFetchLiveRate = useCallback(async () => {
        if (!GEMINI_API_KEY) {
            setFetchRateError('API key no configurada');
            return;
        }

        setIsFetchingRate(true);
        setFetchRateError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: 'Busca en tiempo real la tasa de cambio de Dólar (USD) en el Banco Popular Dominicano. Necesito tanto la tasa de COMPRA como la de VENTA. Responde únicamente con un objeto JSON válido con las claves "buyRate" y "sellRate", donde los valores sean números. No incluyas ningún otro texto o explicación.',
                config: {
                    tools: [{ googleSearch: {} }],
                }
            });

            let jsonText = response.text?.trim() || '';
            if (!jsonText) {
                throw new Error('No response from AI');
            }

            // The model might wrap the JSON in markdown fences. Let's remove them.
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.substring(7, jsonText.length - 3).trim();
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.substring(3, jsonText.length - 3).trim();
            }

            const rates = JSON.parse(jsonText);

            if (rates && typeof rates.buyRate === 'number' && typeof rates.sellRate === 'number') {
                const now = new Date();
                setBuyRate(rates.buyRate);
                setSellRate(rates.sellRate);
                setRateSource('Banco Popular (En Vivo)');
                setRateLastUpdated(now);

                // Cache the rate
                localStorage.setItem('calculatorCachedExchangeRate', JSON.stringify({
                    buyRate: rates.buyRate,
                    sellRate: rates.sellRate,
                    timestamp: now.toISOString()
                }));
            } else {
                throw new Error('La IA devolvió un formato de datos inesperado.');
            }
        } catch (error) {
            console.error("Error fetching live rate:", error);
            setFetchRateError('No se pudo obtener la tasa. Inténtalo de nuevo.');
        } finally {
            setIsFetchingRate(false);
        }
    }, []);

    // Auto-fetch rate on component load if cache is expired or missing
    useEffect(() => {
        const cachedRate = localStorage.getItem('calculatorCachedExchangeRate');
        let shouldFetch = true;

        if (cachedRate) {
            try {
                const { timestamp } = JSON.parse(cachedRate);
                const cacheTime = new Date(timestamp);
                const now = new Date();
                const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
                shouldFetch = hoursDiff >= 1; // Only fetch if cache is older than 1 hour
            } catch (e) {
                shouldFetch = true;
            }
        }

        if (shouldFetch && GEMINI_API_KEY) {
            handleFetchLiveRate();
        }
    }, [handleFetchLiveRate]);

    const handleTriggerExcelExport = useCallback(() => {
        setExcelExportTrigger(prev => prev + 1);
    }, []);

    const renderActiveCalculator = () => {
        switch (activeCalculator) {
            case ActiveCalculator.PaymentPlan:
                return <PaymentPlanCalculator
                    sellRate={sellRate}
                    rateSource={rateSource}
                    customLogo={customLogo}
                    excelExportTrigger={excelExportTrigger}
                    currency={currency}
                    promotionEnabled={promotionEnabled}
                    promotionName={promotionName}
                />;
            case ActiveCalculator.Mortgage:
                return <MortgageCalculator />;
            case ActiveCalculator.Converter:
                return <CurrencyConverter
                    buyRate={buyRate}
                    sellRate={sellRate}
                    rateSource={rateSource}
                    isFetchingRate={isFetchingRate}
                    handleFetchLiveRate={handleFetchLiveRate}
                    fetchRateError={fetchRateError}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-full bg-slate-950 text-slate-200">
            <CalculatorSidebar
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
                activeCalculator={activeCalculator}
                setActiveCalculator={setActiveCalculator}
                theme={theme}
                setTheme={setTheme}
                customLogo={customLogo}
                onLogoUpload={handleLogoUpload}
                onRemoveLogo={handleRemoveLogo}
                onTriggerExcelExport={handleTriggerExcelExport}
                currency={currency}
                setCurrency={setCurrency}
                sellRate={sellRate}
                rateSource={rateSource}
                isFetchingRate={isFetchingRate}
                handleFetchLiveRate={handleFetchLiveRate}
                fetchRateError={fetchRateError}
                rateLastUpdated={rateLastUpdated}
                promotionEnabled={promotionEnabled}
                setPromotionEnabled={setPromotionEnabled}
                promotionName={promotionName}
                setPromotionName={setPromotionName}
            />
            <main className="flex-1 p-6 lg:ml-64 overflow-y-auto print:ml-0 print:p-4">
                <header className="lg:hidden fixed top-0 left-0 right-0 bg-slate-800 px-4 z-30 flex items-center justify-between shadow-md print:hidden h-[65px]">
                    <button onClick={() => setSidebarOpen(true)} className="text-white p-2" aria-label="Open menu">
                        <MenuIcon />
                    </button>
                    <div className="flex-grow flex justify-center items-center">
                        <AlveareLogo className="text-white" monochrome />
                    </div>
                    <div className="w-10" /> {/* Spacer for centering the logo */}
                </header>
                <div className="lg:pt-0 pt-[65px]">
                    {renderActiveCalculator()}
                </div>
            </main>
        </div>
    );
};

export default CalculatorPage;
