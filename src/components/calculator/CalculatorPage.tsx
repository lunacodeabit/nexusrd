import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Currency } from './types';
import PaymentPlanCalculator from './PaymentPlanCalculator';
import PaymentPlanHistory from './PaymentPlanHistory';
import { DEFAULT_BUY_RATE, DEFAULT_SELL_RATE } from './constants';
import { RefreshIcon } from './icons/RefreshIcon';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useUserRole } from '../../hooks/useUserRole';
import type { PaymentPlanRecord } from '../../services/paymentPlanHistoryService';

// Get API key from Vite env vars
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const CalculatorPage: React.FC = () => {
    const [excelExportTrigger, setExcelExportTrigger] = useState(0);

    // Detectar si el usuario puede ver funciones avanzadas (supervisor/admin)
    const { canViewTeam } = useUserRole();

    const [_buyRate, setBuyRate] = useState<number>(DEFAULT_BUY_RATE);
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

    // Settings panel visibility
    const [showSettings, setShowSettings] = useState(false);

    // History modal visibility
    const [showHistory, setShowHistory] = useState(false);

    // Plan cargado desde historial
    const [loadedPlan, setLoadedPlan] = useState<PaymentPlanRecord | null>(null);

    // Callback para cargar plan desde historial
    const handleLoadPlan = useCallback((plan: PaymentPlanRecord) => {
        setLoadedPlan(plan);
        // Limpiar después de un tick para que el calculador lo procese
        setTimeout(() => setLoadedPlan(null), 100);
    }, []);

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
                shouldFetch = hoursDiff >= 1;
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

    return (
        <div className="space-y-4">
            {/* Toolbar - Inline Controls */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-nexus-card rounded-lg border border-nexus-border">
                {/* Currency Toggle */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Moneda:</span>
                    <div className="flex bg-nexus-base rounded-md">
                        <button
                            onClick={() => setCurrency(Currency.USD)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${currency === Currency.USD ? 'bg-nexus-accent text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            USD
                        </button>
                        <button
                            onClick={() => setCurrency(Currency.DOP)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${currency === Currency.DOP ? 'bg-nexus-accent text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            DOP
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-nexus-border" />

                {/* Exchange Rate */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Tasa:</span>
                    <span className="text-sm font-mono text-white">1 USD = {sellRate.toFixed(2)} DOP</span>
                    <button
                        onClick={handleFetchLiveRate}
                        disabled={isFetchingRate}
                        className="p-1.5 text-gray-400 hover:text-nexus-accent transition-colors disabled:opacity-50"
                        title="Actualizar tasa del Banco Popular"
                    >
                        <RefreshIcon className={isFetchingRate ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
                    </button>
                    {rateLastUpdated && (
                        <span className="text-xs text-gray-500">
                            ({rateSource})
                        </span>
                    )}
                    {fetchRateError && <span className="text-xs text-red-400">{fetchRateError}</span>}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-nexus-border" />

                {/* Promotion Toggle */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Promoción:</span>
                    <button
                        onClick={() => setPromotionEnabled(!promotionEnabled)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${promotionEnabled ? 'bg-nexus-accent' : 'bg-gray-600'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${promotionEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                    {promotionEnabled && (
                        <input
                            type="text"
                            value={promotionName}
                            onChange={(e) => setPromotionName(e.target.value)}
                            className="w-32 px-2 py-1 text-xs bg-nexus-base border border-nexus-border rounded text-white"
                            placeholder="Nombre promoción"
                        />
                    )}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-nexus-border" />

                {/* Settings Button */}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    ⚙️ Más opciones
                </button>

                {/* History Button */}
                <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-nexus-base rounded-md transition-colors"
                >
                    📜 Historial
                </button>

                {/* Excel Export */}
                <button
                    onClick={handleTriggerExcelExport}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                    📊 Excel
                </button>
            </div>

            {/* Expandable Settings Panel */}
            {showSettings && (
                <div className="p-4 bg-nexus-card rounded-lg border border-nexus-border">
                    <h3 className="text-sm font-medium text-white mb-3">Configuración Avanzada</h3>
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Custom Logo */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Logo personalizado:</span>
                            <label className="flex items-center gap-1 px-2 py-1 text-xs bg-nexus-base border border-nexus-border rounded cursor-pointer hover:border-nexus-accent transition-colors">
                                <UploadIcon />
                                <span>{customLogo ? 'Cambiar' : 'Subir'}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </label>
                            {customLogo && (
                                <button
                                    onClick={handleRemoveLogo}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <TrashIcon />
                                    Quitar
                                </button>
                            )}
                        </div>

                        {/* Preview Logo */}
                        {customLogo && (
                            <img src={customLogo} alt="Logo" className="h-8 object-contain" />
                        )}
                    </div>
                </div>
            )}

            {/* Calculator Content */}
            <PaymentPlanCalculator
                sellRate={sellRate}
                rateSource={rateSource}
                customLogo={customLogo}
                excelExportTrigger={excelExportTrigger}
                currency={currency}
                promotionEnabled={promotionEnabled}
                promotionName={promotionName}
                canViewAdvanced={canViewTeam}
                loadedPlan={loadedPlan}
            />

            {/* History Modal */}
            <PaymentPlanHistory
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onLoadPlan={handleLoadPlan}
            />
        </div>
    );
};

export default CalculatorPage;
