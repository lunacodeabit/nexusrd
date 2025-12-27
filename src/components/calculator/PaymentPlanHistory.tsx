import React, { useEffect, useState } from 'react';
import { usePaymentPlanHistory } from '../../hooks/usePaymentPlanHistory';
import { deletePaymentPlan, type PaymentPlanRecord } from '../../services/paymentPlanHistoryService';

interface PaymentPlanHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadPlan?: (plan: PaymentPlanRecord) => void;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const PaymentPlanHistory: React.FC<PaymentPlanHistoryProps> = ({ isOpen, onClose, onLoadPlan }) => {
    const {
        history,
        totalCount,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        currentPage,
        totalPages,
        goToPage,
        refresh
    } = usePaymentPlanHistory();

    const [selectedPlan, setSelectedPlan] = useState<PaymentPlanRecord | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Manejar borrar
    const handleDelete = async (e: React.MouseEvent, planId: string) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de que deseas eliminar este plan?')) return;

        setDeletingId(planId);
        const result = await deletePaymentPlan(planId);
        setDeletingId(null);

        if (result.success) {
            refresh();
            if (selectedPlan?.id === planId) {
                setSelectedPlan(null);
            }
        } else {
            alert('Error al eliminar: ' + result.error);
        }
    };

    // Cargar al abrir
    useEffect(() => {
        if (isOpen) {
            refresh();
        }
    }, [isOpen, refresh]);

    // Buscar con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchTerm) {
                setSearchTerm(searchInput);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, searchTerm, setSearchTerm]);

    const formatCurrency = (value: number, currency: string = 'USD', rate: number = 1) => {
        const symbol = currency === 'USD' ? 'US$' : 'RD$';
        const converted = currency === 'DOP' ? value * rate : value;
        return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-DO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-nexus-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-nexus-border">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            📜 Historial de Planes de Pago
                        </h2>
                        <p className="text-sm text-gray-400">{totalCount} planes guardados</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-nexus-base hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Búsqueda */}
                <div className="p-4 border-b border-nexus-border">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="🔍 Buscar por nombre de cliente..."
                        className="w-full px-4 py-2 bg-nexus-base border border-nexus-border rounded-lg text-white placeholder-gray-500 focus:border-nexus-accent focus:outline-none"
                    />
                </div>

                {/* Lista o Detalle */}
                <div className="flex-1 overflow-auto">
                    {selectedPlan ? (
                        // Vista de detalle
                        <div className="p-4">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="mb-4 text-sm text-nexus-accent hover:underline flex items-center gap-1"
                            >
                                ← Volver a la lista
                            </button>

                            <div className="bg-nexus-base rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{selectedPlan.client_name}</h3>
                                        <p className="text-sm text-gray-400">{selectedPlan.unit_type}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{formatDate(selectedPlan.created_at || '')}</span>
                                </div>

                                {(selectedPlan.client_phone || selectedPlan.client_email) && (
                                    <div className="text-sm text-gray-300">
                                        {selectedPlan.client_phone && <p>📞 {selectedPlan.client_phone}</p>}
                                        {selectedPlan.client_email && <p>✉️ {selectedPlan.client_email}</p>}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-400">Valor Propiedad:</span>
                                        <p className="text-white font-mono">{formatCurrency(selectedPlan.property_value, selectedPlan.currency, selectedPlan.sell_rate)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Valor con Descuento:</span>
                                        <p className="text-white font-mono">{formatCurrency(selectedPlan.discounted_value, selectedPlan.currency, selectedPlan.sell_rate)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Reserva:</span>
                                        <p className="text-white font-mono">{formatCurrency(selectedPlan.reservation || 0, selectedPlan.currency, selectedPlan.sell_rate)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Cuotas:</span>
                                        <p className="text-white">{selectedPlan.installments_count} x {formatCurrency(selectedPlan.installment_amount || 0, selectedPlan.currency, selectedPlan.sell_rate)}</p>
                                    </div>
                                </div>

                                <div className="border-t border-nexus-border pt-4">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-400">Separación ({selectedPlan.initial_percentage?.toFixed(1)}%):</span>
                                            <p className="text-white font-mono">{formatCurrency(selectedPlan.total_initial || 0, selectedPlan.currency, selectedPlan.sell_rate)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Construcción ({selectedPlan.construction_percentage?.toFixed(1)}%):</span>
                                            <p className="text-white font-mono">{formatCurrency(selectedPlan.during_construction || 0, selectedPlan.currency, selectedPlan.sell_rate)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Entrega ({selectedPlan.delivery_percentage?.toFixed(1)}%):</span>
                                            <p className="text-white font-mono">{formatCurrency(selectedPlan.delivery_amount || 0, selectedPlan.currency, selectedPlan.sell_rate)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500">
                                    Período: {MONTHS[selectedPlan.start_month || 0]} {selectedPlan.start_year} → {MONTHS[selectedPlan.end_month || 0]} {selectedPlan.end_year}
                                    {selectedPlan.promotion_enabled && (
                                        <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                            {selectedPlan.promotion_name}
                                        </span>
                                    )}
                                </div>

                                {/* Botón Cargar Plan */}
                                {onLoadPlan && (
                                    <button
                                        onClick={() => {
                                            onLoadPlan(selectedPlan);
                                            onClose();
                                        }}
                                        className="mt-4 w-full py-3 px-4 bg-nexus-accent hover:bg-nexus-accent/80 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        📥 Cargar Plan en Calculadora
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Lista
                        <>
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-400">
                                    <span className="animate-spin inline-block mr-2">⏳</span>
                                    Cargando...
                                </div>
                            ) : error ? (
                                <div className="p-8 text-center text-red-400">
                                    Error: {error}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    {searchTerm ? 'No se encontraron planes con ese nombre' : 'No hay planes guardados aún'}
                                </div>
                            ) : (
                                <div className="divide-y divide-nexus-border">
                                    {history.map(plan => (
                                        <div
                                            key={plan.id}
                                            className="flex items-center p-4 hover:bg-nexus-base/50 transition-colors gap-2"
                                        >
                                            <button
                                                onClick={() => setSelectedPlan(plan)}
                                                className="flex-1 text-left"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-medium text-white">{plan.client_name}</h3>
                                                        <p className="text-sm text-gray-400">{plan.unit_type}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono text-nexus-accent">
                                                            {formatCurrency(plan.discounted_value, plan.currency, plan.sell_rate)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{formatDate(plan.created_at || '')}</p>
                                                    </div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, plan.id!)}
                                                disabled={deletingId === plan.id}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="Eliminar plan"
                                            >
                                                {deletingId === plan.id ? '⏳' : '🗑️'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Paginación */}
                {!selectedPlan && totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-nexus-border">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm bg-nexus-base rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
                        >
                            ← Anterior
                        </button>
                        <span className="text-sm text-gray-400">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm bg-nexus-base rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentPlanHistory;
