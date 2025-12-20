import React, { useState } from 'react';

const CalculadoraView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const calculatorUrl = 'https://calculadora-alveare.netlify.app';

    return (
        <div className="h-full w-full -m-4 md:-m-8">
            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-nexus-base z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-nexus-accent border-t-transparent"></div>
                        <p className="text-gray-400">Cargando calculadora...</p>
                    </div>
                </div>
            )}

            {/* Calculator iFrame - Full screen */}
            <iframe
                src={calculatorUrl}
                className="w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] h-[calc(100vh-4rem)] md:h-screen border-0"
                title="Calculadora Alveare"
                onLoad={() => setIsLoading(false)}
                allow="clipboard-write"
            />
        </div>
    );
};

export default CalculadoraView;
