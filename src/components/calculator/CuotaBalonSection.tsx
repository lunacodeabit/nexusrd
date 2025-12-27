import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { calcularCuotaBalon, FRECUENCIAS_PAGO_EXTRA, type CuotaBalonResult } from './calcularCuotaBalon';
import { Currency } from './types';

interface CuotaBalonSectionProps {
    deudaTotal: number;           // Valor de la propiedad después de descuentos
    totalMeses: number;           // Plazo total en meses (calculado desde fechas)
    currency: Currency;
    sellRate: number;
    onApplyExtras?: (pagoExtra: number, frecuencia: number, cuotaMensual: number) => void;
}

// Clave para localStorage
const STORAGE_KEY = 'cuotaBalon_settings';

/**
 * Sección de cálculo de Cuota Balón - Solo visible para Supervisores/Admins
 * Permite calcular los pagos extraordinarios necesarios para cubrir el saldo de una deuda
 */
const CuotaBalonSection: React.FC<CuotaBalonSectionProps> = ({
    deudaTotal,
    totalMeses,
    currency,
    sellRate,
    onApplyExtras
}) => {
    // Cargar valores iniciales desde localStorage
    const [isExpanded, setIsExpanded] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).isExpanded ?? false;
            } catch { return false; }
        }
        return false;
    });

    const [cuotaMensual, setCuotaMensual] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).cuotaMensual ?? '';
            } catch { return ''; }
        }
        return '';
    });

    const [frecuenciaExtra, setFrecuenciaExtra] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).frecuenciaExtra ?? 6;
            } catch { return 6; }
        }
        return 6;
    });

    const [aplicarInteres, setAplicarInteres] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).aplicarInteres ?? false;
            } catch { return false; }
        }
        return false;
    });

    const [tasaAnual, setTasaAnual] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved).tasaAnual ?? '12';
            } catch { return '12'; }
        }
        return '12';
    });

    // Persistir cambios en localStorage
    useEffect(() => {
        const settings = {
            isExpanded,
            cuotaMensual,
            frecuenciaExtra,
            aplicarInteres,
            tasaAnual
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [isExpanded, cuotaMensual, frecuenciaExtra, aplicarInteres, tasaAnual]);

    // Formatear para display con separadores de miles
    const formatForDisplay = (val: string): string => {
        if (!val) return '';
        const parts = val.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    // Manejar input numérico
    const handleNumericInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const sanitized = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
        if (sanitized.split('.').length > 2) return;
        const parts = sanitized.split('.');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        setter(parts.join('.'));
    };

    // Calcular resultado
    const resultado: CuotaBalonResult = useMemo(() => {
        const cuota = parseFloat(cuotaMensual.replace(/,/g, '')) || 0;
        const tasa = aplicarInteres ? (parseFloat(tasaAnual) || 0) : 0;

        if (deudaTotal <= 0 || cuota <= 0 || totalMeses <= 0) {
            return {
                pagoExtraRequerido: 0,
                cantidadPagos: 0,
                deficit: 0,
                recaudoCuotas: 0,
                tieneInteres: false,
                tasaAplicada: 0,
                esValido: false,
                mensaje: 'Ingresa los valores para calcular'
            };
        }

        return calcularCuotaBalon({
            deudaTotal,
            cuotaMensual: cuota,
            totalMeses,
            frecuenciaExtra,
            tasaAnual: tasa
        });
    }, [deudaTotal, cuotaMensual, totalMeses, frecuenciaExtra, aplicarInteres, tasaAnual]);

    // Formatear moneda
    const formatCurrency = useCallback((value: number) => {
        const symbol = currency === Currency.USD ? 'US$' : 'RD$';
        const convertedValue = currency === Currency.DOP ? value * sellRate : value;
        return `${symbol}${convertedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [currency, sellRate]);

    // Aplicar los pagos calculados
    const handleApplyExtras = () => {
        if (resultado.esValido && resultado.pagoExtraRequerido > 0 && onApplyExtras) {
            const cuota = parseFloat(cuotaMensual.replace(/,/g, '')) || 0;
            onApplyExtras(resultado.pagoExtraRequerido, frecuenciaExtra, cuota);
        }
    };

    const currencySymbol = currency === Currency.USD ? 'US$' : 'RD$';

    return (
        <div className="mt-6 border border-amber-500/30 rounded-lg overflow-hidden bg-amber-950/20">
            {/* Header - Siempre visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-900/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">🔒</span>
                    <div>
                        <h3 className="text-sm font-semibold text-amber-200">
                            Cálculo Interno - Pagos Extra Requeridos
                        </h3>
                        <p className="text-xs text-amber-400/70">
                            Solo visible para Supervisores y Administradores
                        </p>
                    </div>
                </div>
                <span className={`text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {/* Content - Expandible */}
            {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-amber-500/20">
                    {/* Info del contexto */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 bg-nexus-base/50 p-3 rounded">
                        <span>📊 Deuda: <strong className="text-white">{formatCurrency(deudaTotal)}</strong></span>
                        <span>📅 Plazo: <strong className="text-white">{totalMeses} meses</strong></span>
                    </div>

                    {/* Formulario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Cuota Mensual */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Cuota Mensual Propuesta
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                    {currencySymbol}
                                </span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={formatForDisplay(cuotaMensual)}
                                    onChange={(e) => handleNumericInput(e.target.value, setCuotaMensual)}
                                    placeholder="0.00"
                                    className="w-full pl-12 pr-3 py-2 bg-nexus-base border border-nexus-border rounded text-white text-sm focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Frecuencia */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Frecuencia Pago Extra
                            </label>
                            <select
                                value={frecuenciaExtra}
                                onChange={(e) => setFrecuenciaExtra(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-nexus-base border border-nexus-border rounded text-white text-sm focus:border-amber-500 focus:outline-none"
                            >
                                {FRECUENCIAS_PAGO_EXTRA.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Toggle Interés */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">
                                Aplicar Interés
                            </label>
                            <div className="flex items-center gap-3 h-[38px]">
                                <button
                                    onClick={() => setAplicarInteres(!aplicarInteres)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${aplicarInteres ? 'bg-amber-500' : 'bg-gray-600'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${aplicarInteres ? 'translate-x-6' : ''}`} />
                                </button>
                                <span className="text-xs text-gray-400">
                                    {aplicarInteres ? 'Sí' : 'No'}
                                </span>
                            </div>
                        </div>

                        {/* Tasa de Interés (solo si está activo) */}
                        {aplicarInteres && (
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                    Tasa Anual (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tasaAnual}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            setTasaAnual(val);
                                        }}
                                        placeholder="12"
                                        className="w-full px-3 py-2 pr-8 bg-nexus-base border border-nexus-border rounded text-white text-sm focus:border-amber-500 focus:outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                        %
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resultado */}
                    <div className={`p-4 rounded-lg ${resultado.esValido && resultado.pagoExtraRequerido > 0 ? 'bg-green-900/30 border border-green-500/30' : 'bg-nexus-base border border-nexus-border'}`}>
                        <h4 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">📊 Resultado</h4>

                        {resultado.esValido && resultado.pagoExtraRequerido > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Pago Extra Requerido:</span>
                                    <span className="text-2xl font-bold text-green-400">
                                        {formatCurrency(resultado.pagoExtraRequerido)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Frecuencia:</span>
                                    <span className="text-white">
                                        Cada {frecuenciaExtra} meses ({resultado.cantidadPagos} pagos en el plazo)
                                    </span>
                                </div>
                                {resultado.tieneInteres && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Interés aplicado:</span>
                                        <span className="text-amber-400">{resultado.tasaAplicada}% anual</span>
                                    </div>
                                )}
                                <p className="text-xs text-green-400 mt-2">{resultado.mensaje}</p>

                                {/* Botón Aplicar */}
                                {onApplyExtras && (
                                    <button
                                        onClick={handleApplyExtras}
                                        className="mt-3 w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        ✅ Aplicar a Pagos Extraordinarios
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">{resultado.mensaje}</p>
                        )}
                    </div>

                    {/* Nota de confidencialidad */}
                    <p className="text-xs text-amber-400/50 text-center italic">
                        ⚠️ Esta información es confidencial y NO aparecerá en los reportes PDF ni imágenes de resumen
                    </p>
                </div>
            )}
        </div>
    );
};

export default CuotaBalonSection;
