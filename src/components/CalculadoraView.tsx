import React, { useState } from 'react';

const CalculatorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const CalculadoraView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const calculatorUrl = 'https://calculadora-alveare.netlify.app';

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-nexus-surface border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-nexus-accent/20 rounded-lg">
                        <CalculatorIcon />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Calculadora de Pagos</h1>
                        <p className="text-sm text-gray-400">Genera cotizaciones profesionales para tus clientes</p>
                    </div>
                </div>

                <a
                    href={calculatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg transition-colors"
                >
                    <span>Abrir en nueva pestaña</span>
                    <ExternalLinkIcon />
                </a>
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="flex items-center justify-center p-8 bg-nexus-base">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-nexus-accent border-t-transparent"></div>
                        <p className="text-gray-400">Cargando calculadora...</p>
                    </div>
                </div>
            )}

            {/* Calculator iFrame */}
            <div className={`flex-1 ${isLoading ? 'hidden' : 'block'}`}>
                <iframe
                    src={calculatorUrl}
                    className="w-full h-full border-0"
                    title="Calculadora Alveare"
                    onLoad={() => setIsLoading(false)}
                    allow="clipboard-write"
                />
            </div>
        </div>
    );
};

export default CalculadoraView;
