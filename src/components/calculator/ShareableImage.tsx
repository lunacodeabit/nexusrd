import React from 'react';
import { AlveareLogo } from './ui/AlveareLogo';

interface ShareableImageProps {
    clientName: string;
    unitType: string;
    propertyValue: string;
    discountedPropertyValue: string;
    fairDiscount: string;
    reservation: string;
    totalInitial: string;
    onDelivery: string;
    duringConstruction: string;
    currencySymbol: string;
    installmentsCount: number;
    installmentAmount: string;
    paymentFrequency: 'monthly' | 'quarterly';
    customLogo: string | null;
    promotionName: string;
    // Pagos extras de cuota balón
    balonExtraAmount?: string;
    balonFrequency?: number;
    balonPaymentsCount?: number;
}


const ShareableImage: React.FC<ShareableImageProps> = ({
    clientName,
    unitType,
    propertyValue,
    discountedPropertyValue,
    fairDiscount,
    reservation,
    totalInitial,
    onDelivery,
    duringConstruction,
    currencySymbol,
    installmentsCount,
    installmentAmount,
    paymentFrequency,
    customLogo,
    promotionName: _promotionName,
    balonExtraAmount,
    balonFrequency,
    balonPaymentsCount,
}) => {
    const paymentFrequencyText = paymentFrequency === 'monthly' ? 'PAGO MENSUAL' : 'PAGO TRIMESTRAL';
    const hasDiscount = (parseFloat(fairDiscount.replace(/[^0-9.]/g, '')) || 0) > 0;

    return (
        <div className="w-[600px] bg-white text-slate-800 p-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            <header className="flex justify-between items-start pb-4 border-b-2 border-slate-200">
                {customLogo ? (
                    <img src={customLogo} alt="Logo Personalizado" className="max-h-16 max-w-48 object-contain" />
                ) : (
                    <AlveareLogo />
                )}
                <div className="text-right">
                    <p className="text-sm text-slate-500">Para: <span className="font-bold text-slate-700">{clientName || 'N/A'}</span></p>
                    <p className="text-sm text-slate-500 mt-1">Unidad: <span className="font-bold text-slate-700">{unitType || 'N/A'}</span></p>
                </div>
            </header>
            <main className="mt-6">
                <h1 className="text-3xl font-bold text-blue-800">Proyección de Pago</h1>

                <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    {hasDiscount ? (
                        <div className="text-right">
                            <div className="flex justify-between items-baseline">
                                <p className="text-slate-500 text-lg">Valor de la Propiedad</p>
                                <p className="text-2xl text-slate-600">{propertyValue}</p>
                            </div>
                            <div className="flex justify-between items-baseline mt-1">
                                <p className="text-slate-500 text-lg font-bold">Precio con Descuento</p>
                                <p className="text-3xl font-bold text-slate-800">{discountedPropertyValue}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <p className="text-slate-500 text-lg">Valor de la Propiedad</p>
                            <p className="text-3xl font-bold text-slate-800">{propertyValue}</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700 font-semibold">RESERVA</p>
                        <p className="text-xl font-bold text-blue-900 mt-1">{reservation}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700 font-semibold">SEPARACIÓN A LA FIRMA</p>
                        <p className="text-xl font-bold text-blue-900 mt-1">{totalInitial}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm text-indigo-700 font-semibold">DURANTE CONSTRUCCIÓN</p>
                        <p className="text-xl font-bold text-indigo-900 mt-1">{duringConstruction}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-lg">
                        <p className="text-sm text-slate-700 font-semibold">A LA ENTREGA</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{onDelivery}</p>
                    </div>
                </div>

                {installmentsCount > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-700 font-semibold">CUOTAS</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{installmentsCount}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-700 font-semibold">{paymentFrequencyText}</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">{installmentAmount}</p>
                        </div>
                    </div>
                )}

                {/* Pagos Extras de Cuota Balón */}
                {balonExtraAmount && balonPaymentsCount && balonPaymentsCount > 0 && (
                    <div className="mt-4 bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-purple-700 font-semibold">PAGOS ADICIONALES (CUOTA BALÓN)</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">{balonExtraAmount}</p>
                        <p className="text-xs text-purple-600 mt-1">
                            Cada {balonFrequency} meses • {balonPaymentsCount} pagos durante el plazo
                        </p>
                    </div>
                )}
            </main>
            <footer className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
                <p>Este es un documento de proyección y está sujeto a cambios. Los valores son presentados en {currencySymbol}.</p>
                <p className="font-semibold mt-1">Generado por Alveare Realty Calculator</p>
            </footer>
        </div>
    );
};

export default ShareableImage;