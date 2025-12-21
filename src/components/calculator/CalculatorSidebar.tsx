import React, { useEffect, useRef } from 'react';
import { ActiveCalculator, Currency } from './types';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { AlveareLogo } from './ui/AlveareLogo';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ExcelIcon } from './icons/ExcelIcon';
import { BankRateIcon } from './icons/BankRateIcon';
import { RefreshIcon } from './icons/RefreshIcon';


interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    activeCalculator: ActiveCalculator;
    setActiveCalculator: (calculator: ActiveCalculator) => void;
    theme: string;
    setTheme: (theme: string) => void;
    customLogo: string | null;
    onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveLogo: () => void;
    onTriggerExcelExport: () => void;
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    sellRate: number;
    rateSource: string;
    isFetchingRate: boolean;
    handleFetchLiveRate: () => void;
    fetchRateError: string | null;
    rateLastUpdated: Date | null;
    promotionEnabled: boolean;
    setPromotionEnabled: (enabled: boolean) => void;
    promotionName: string;
    setPromotionName: (name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    setIsOpen,
    activeCalculator,
    setActiveCalculator,
    theme,
    setTheme,
    customLogo,
    onLogoUpload,
    onRemoveLogo,
    onTriggerExcelExport,
    currency,
    setCurrency,
    sellRate,
    rateSource,
    isFetchingRate,
    handleFetchLiveRate,
    fetchRateError,
    rateLastUpdated,
    promotionEnabled,
    setPromotionEnabled,
    promotionName,
    setPromotionName,
}) => {
    const sidebarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            // Use `mousedown` to catch the event before a `click` might be prevented elsewhere
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen]);


    const navItems = [
        { id: ActiveCalculator.PaymentPlan, label: 'Plan de Pago', icon: <CalculatorIcon /> },
    ];

    return (
        <aside ref={sidebarRef} className={`fixed top-0 left-0 h-full w-64 bg-slate-800 text-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 print:hidden`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-slate-700 h-[65px]">
                    <div className="hidden lg:flex lg:items-center">
                        <AlveareLogo className="text-white" monochrome />
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white lg:hidden ml-auto" aria-label="Close menu">
                        <CloseIcon />
                    </button>
                </div>
                <nav className="mt-6 flex-shrink-0">
                    <ul>
                        {navItems.map((item) => (
                            <li key={item.id} className="px-4 mb-2">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveCalculator(item.id);
                                        setIsOpen(false); // Close sidebar on mobile after selection
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-md transition-colors duration-200 ${activeCalculator === item.id
                                        ? 'bg-blue-600 text-white shadow-inner'
                                        : 'hover:bg-slate-700'
                                        }`}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </a>
                                {item.id === ActiveCalculator.PaymentPlan && activeCalculator === ActiveCalculator.PaymentPlan && (
                                    <button
                                        onClick={() => {
                                            onTriggerExcelExport();
                                            setIsOpen(false);
                                        }}
                                        className="flex items-center gap-3 w-full text-left p-3 mt-1 rounded-md transition-colors duration-200 text-sm text-slate-300 hover:bg-slate-700"
                                    >
                                        <ExcelIcon />
                                        <span>Exportar Excel</span>
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="px-4 mt-4 space-y-4 flex-1 overflow-y-auto">
                    {/* Moneda Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Moneda</h3>
                        <div className="flex flex-col space-y-1 p-1 bg-slate-700/80 rounded-lg">
                            <button
                                onClick={() => setCurrency(Currency.USD)}
                                className={`w-full text-center text-sm py-1.5 rounded-md transition-colors ${currency === Currency.USD ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
                            >
                                US Dólar (USD)
                            </button>
                            <button
                                onClick={() => setCurrency(Currency.DOP)}
                                className={`w-full text-center text-sm py-1.5 rounded-md transition-colors ${currency === Currency.DOP ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
                            >
                                Peso Dom. (DOP)
                            </button>
                        </div>
                    </div>

                    {/* Tasa de Cambio Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tasa de Cambio</h3>
                        <div className="p-3 bg-slate-700/60 rounded-lg text-center">
                            <p className="text-sm text-slate-300">
                                Venta ({rateSource}):
                            </p>
                            <p className="text-base font-mono font-semibold text-white mt-1">
                                1 USD = {sellRate.toFixed(2)} DOP
                            </p>
                            <button
                                onClick={handleFetchLiveRate}
                                disabled={isFetchingRate}
                                className="w-full mt-3 text-sm bg-slate-500/20 border border-slate-600 hover:bg-slate-600/50 text-slate-300 rounded-md py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isFetchingRate ? <RefreshIcon className="animate-spin" /> : <BankRateIcon />}
                                {isFetchingRate ? 'Buscando...' : 'Actualizar Tasa'}
                            </button>
                            {fetchRateError && <p className="text-xs text-red-500 mt-2">{fetchRateError}</p>}
                            {rateLastUpdated && !fetchRateError && (
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Actualizado: {rateLastUpdated.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Promotion Section */}
                <div className="px-4 mt-4 border-t border-slate-700 pt-4 flex-shrink-0">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Promoción Especial</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-700/60 rounded-lg">
                            <span className="text-sm font-medium">Activar Descuento</span>
                            <button
                                onClick={() => setPromotionEnabled(!promotionEnabled)}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${promotionEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}
                                aria-label="Toggle promotion"
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${promotionEnabled ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        {promotionEnabled && (
                            <input
                                type="text"
                                value={promotionName}
                                onChange={(e) => setPromotionName(e.target.value)}
                                placeholder="Nombre de la promoción"
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                    </div>
                </div>

                <div className="px-4 mt-4 border-t border-slate-700 pt-4 flex-shrink-0">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Imagen Personalizada</h3>
                    <div className="space-y-2">
                        <label htmlFor="logo-upload" className="w-full flex items-center gap-3 p-3 rounded-md transition-colors duration-200 hover:bg-slate-700 cursor-pointer text-sm font-medium">
                            <UploadIcon />
                            <span>{customLogo ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
                        </label>
                        <input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={onLogoUpload} />

                        {customLogo && (
                            <button onClick={onRemoveLogo} className="w-full flex items-center gap-3 p-3 rounded-md transition-colors duration-200 hover:bg-slate-700 text-sm font-medium text-red-400 hover:text-red-300">
                                <TrashIcon />
                                <span>Quitar Imagen</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 mt-auto border-t border-slate-700 flex-shrink-0">
                    <div className="flex items-center justify-center space-x-2 p-1 bg-slate-700 rounded-lg">
                        <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center p-2 rounded-md transition-colors ${theme === 'light' ? 'bg-blue-600 text-white' : 'text-slate-400'}`} aria-label="Switch to Light Mode">
                            <SunIcon />
                        </button>
                        <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center p-2 rounded-md transition-colors ${theme === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400'}`} aria-label="Switch to Dark Mode">
                            <MoonIcon />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;