import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import { Currency } from './types';
import type { ExtraPayment } from './types';
import { MONTHS, YEARS } from './constants';
import { Card } from './ui/Card';
import { InputGroup } from './ui/InputGroup';
import { SelectGroup } from './ui/SelectGroup';
import { Button } from './ui/Button';
import { RefreshIcon } from './icons/RefreshIcon';
import { PrintIcon } from './icons/PrintIcon';
import { ShareIcon } from './icons/ShareIcon';
import ShareableImage from './ShareableImage';
import { TrashIcon } from './icons/TrashIcon';
import PrintableReport from './PrintableReport';

interface PaymentPlanCalculatorProps {
    sellRate: number;
    rateSource: string;
    customLogo: string | null;
    excelExportTrigger: number;
    currency: Currency;
    promotionEnabled: boolean;
    promotionName: string;
}

const PaymentPlanCalculator: React.FC<PaymentPlanCalculatorProps> = ({
    sellRate,
    rateSource: _rateSource,
    customLogo,
    excelExportTrigger,
    currency,
    promotionEnabled,
    promotionName,
}) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [unitType, setUnitType] = useState('');
    const [propertyValue, setPropertyValue] = useState('');
    const [fairDiscount, setFairDiscount] = useState('');
    const [fairDiscountInputMode, setFairDiscountInputMode] = useState<'percent' | 'amount'>('amount');
    const [fairDiscountInputValue, setFairDiscountInputValue] = useState('');
    const [reservation, setReservation] = useState('');

    const [initialPercentage, setInitialPercentage] = useState('');
    const [constructionPercentage, setConstructionPercentage] = useState('');
    const [initialInputMode, setInitialInputMode] = useState<'percent' | 'amount'>('percent');
    const [initialInputValue, setInitialInputValue] = useState('');

    const [startMonth, setStartMonth] = useState(10); // November
    const [startYear, setStartYear] = useState(2025);
    const [endMonth, setEndMonth] = useState(10); // November
    const [endYear, setEndYear] = useState(2027);
    const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'quarterly'>('monthly');

    const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [_isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const shareableRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Preview modal state
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

    // Clear discount when promotion is disabled
    useEffect(() => {
        if (!promotionEnabled) {
            setFairDiscount('');
            setFairDiscountInputValue('');
        }
    }, [promotionEnabled]);

    useEffect(() => {
        if (fairDiscountInputMode === 'percent') {
            const _propertyValue = parseFloat(propertyValue.replace(/,/g, '')) || 0;
            const perc = parseFloat(fairDiscountInputValue) || 0;
            const newDiscountAmount = _propertyValue > 0 ? (_propertyValue * perc) / 100 : 0;
            setFairDiscount(String(newDiscountAmount));
        }
    }, [propertyValue, fairDiscountInputMode, fairDiscountInputValue]);

    // Track previous currency to detect changes
    const prevCurrencyRef = useRef<Currency>(currency);

    // Convert all monetary values when currency changes
    useEffect(() => {
        const prevCurrency = prevCurrencyRef.current;

        // Only convert if currency actually changed and we have a valid rate
        if (prevCurrency !== currency && sellRate > 0) {
            const convertValue = (value: string): string => {
                const numValue = parseFloat(value.replace(/,/g, '')) || 0;
                if (numValue === 0) return '';

                let converted: number;
                if (prevCurrency === Currency.USD && currency === Currency.DOP) {
                    // USD -> DOP: multiply by rate
                    converted = numValue * sellRate;
                } else if (prevCurrency === Currency.DOP && currency === Currency.USD) {
                    // DOP -> USD: divide by rate
                    converted = numValue / sellRate;
                } else {
                    return value;
                }

                return converted.toFixed(2);
            };

            // Convert property value
            if (propertyValue) {
                setPropertyValue(convertValue(propertyValue));
            }

            // Convert reservation
            if (reservation) {
                setReservation(convertValue(reservation));
            }

            // Convert fair discount if in amount mode
            if (fairDiscountInputMode === 'amount' && fairDiscountInputValue) {
                const converted = convertValue(fairDiscountInputValue);
                setFairDiscountInputValue(converted);
                setFairDiscount(converted);
            }

            // Convert initial payment if in amount mode
            if (initialInputMode === 'amount' && initialInputValue) {
                setInitialInputValue(convertValue(initialInputValue));
            }

            // Convert extra payments
            if (extraPayments.length > 0) {
                setExtraPayments(extraPayments.map(ep => ({
                    ...ep,
                    amount: ep.amount ? convertValue(ep.amount) : ''
                })));
            }
        }

        prevCurrencyRef.current = currency;
    }, [currency, sellRate]);

    const formatForDisplay = (val: string): string => {
        if (!val) return '';
        const parts = val.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    const handleNumericInput = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const sanitized = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
        if (sanitized.split('.').length > 2) return;
        const parts = sanitized.split('.');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
        }
        setter(parts.join('.'));
    };

    const handleReset = useCallback(() => {
        setName('');
        setPhone('');
        setEmail('');
        setUnitType('');
        setPropertyValue('');
        setFairDiscount('');
        setFairDiscountInputMode('amount');
        setFairDiscountInputValue('');
        setReservation('');
        setInitialPercentage('');
        setConstructionPercentage('');
        setInitialInputValue('');
        setInitialInputMode('percent');
        setStartMonth(10);
        setStartYear(2025);
        setEndMonth(10);
        setEndYear(2027);
        setPaymentFrequency('monthly');
        setExtraPayments([]);
        setToastMessage({ text: 'Formulario limpiado.', type: 'success' });
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    const formatCurrency = useCallback((value: number) => {
        const symbol = currency === Currency.USD ? 'US$' : 'RD$';
        const convertedValue = currency === Currency.DOP ? value * sellRate : value;
        return `${symbol}${convertedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [currency, sellRate]);

    const handleInitialInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const _propertyValue = parseFloat(propertyValue.replace(/,/g, '')) || 0;
        let newPerc = 0;

        if (initialInputMode === 'percent') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            if (sanitized.split('.').length > 2) return;
            setInitialInputValue(sanitized);
            newPerc = parseFloat(sanitized) || 0;
        } else { // amount mode
            const sanitized = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
            if (sanitized.split('.').length > 2) return;

            const parts = sanitized.split('.');
            if (parts[1] && parts[1].length > 2) {
                parts[1] = parts[1].substring(0, 2);
            }
            const cleanValue = parts.join('.');

            setInitialInputValue(cleanValue);
            const amount = parseFloat(cleanValue) || 0;
            newPerc = _propertyValue > 0 ? (amount / _propertyValue) * 100 : 0;
        }

        if (newPerc > 100) newPerc = 100;
        if (newPerc < 0) newPerc = 0;

        setInitialPercentage(String(newPerc));

        const currentConstruction = parseFloat(constructionPercentage) || 0;
        if (newPerc + currentConstruction > 100) {
            const newConstruction = 100 - newPerc;
            setConstructionPercentage(String(newConstruction));
        }
    };

    const toggleInitialInputMode = () => {
        const _propVal = parseFloat(propertyValue.replace(/,/g, '')) || 0;
        const newMode = initialInputMode === 'percent' ? 'amount' : 'percent';

        if (newMode === 'amount') {
            // Switching from percent to amount
            const perc = parseFloat(initialInputValue) || 0;
            const amount = (_propVal * perc) / 100;
            setInitialInputValue(amount > 0 ? amount.toFixed(2) : '');
        } else {
            // Switching from amount to percent
            const amount = parseFloat(initialInputValue.replace(/,/g, '')) || 0;
            const perc = _propVal > 0 ? (amount / _propVal) * 100 : 0;
            const roundedPerc = parseFloat(perc.toFixed(2));
            setInitialPercentage(String(isNaN(roundedPerc) ? 0 : roundedPerc));
            setInitialInputValue(isNaN(roundedPerc) ? '' : String(roundedPerc));
        }
        setInitialInputMode(newMode);
    };

    const handleFairDiscountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (fairDiscountInputMode === 'percent') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            if (sanitized.split('.').length > 2) return;
            setFairDiscountInputValue(sanitized);
        } else { // amount mode
            const sanitized = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
            if (sanitized.split('.').length > 2) return;

            const parts = sanitized.split('.');
            if (parts[1] && parts[1].length > 2) {
                parts[1] = parts[1].substring(0, 2);
            }
            const cleanValue = parts.join('.');
            setFairDiscountInputValue(cleanValue);
            setFairDiscount(cleanValue);
        }
    };

    const toggleFairDiscountInputMode = () => {
        const _propVal = parseFloat(propertyValue.replace(/,/g, '')) || 0;
        const newMode = fairDiscountInputMode === 'percent' ? 'amount' : 'percent';

        if (newMode === 'amount') {
            const perc = parseFloat(fairDiscountInputValue) || 0;
            const amount = (_propVal * perc) / 100;
            const formattedAmount = amount > 0 ? amount.toFixed(2) : '';
            setFairDiscountInputValue(formattedAmount);
            setFairDiscount(formattedAmount);
        } else { // newMode is 'percent'
            const amount = parseFloat(fairDiscountInputValue.replace(/,/g, '')) || 0;
            const perc = _propVal > 0 ? (amount / _propVal) * 100 : 0;
            const roundedPerc = parseFloat(perc.toFixed(2));
            const newInputValue = isNaN(roundedPerc) || roundedPerc === 0 ? '' : String(roundedPerc);
            setFairDiscountInputValue(newInputValue);
            // useEffect will setFairDiscount
        }
        setFairDiscountInputMode(newMode);
    };

    const calculations = useMemo(() => {
        const _propertyValue = parseFloat(propertyValue.replace(/,/g, '')) || 0;
        const _fairDiscount = parseFloat(fairDiscount.replace(/,/g, '')) || 0;
        const _discountedPropertyValue = _propertyValue > _fairDiscount ? _propertyValue - _fairDiscount : 0;

        const _reservation = parseFloat(reservation.replace(/,/g, '')) || 0;
        const _initialPercentage = parseFloat(initialPercentage) || 0;
        const _constructionPercentage = parseFloat(constructionPercentage) || 0;

        const constructionStartDate = new Date(startYear, startMonth);
        const deliveryDate = new Date(endYear, endMonth);
        // The last payment month is the one BEFORE the delivery month.
        const constructionEndDate = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth() - 1);

        let totalExtraPayments = 0;
        const extraPaymentSchedule: { date: Date; amount: number; description: string }[] = [];

        extraPayments.forEach(p => {
            const amount = parseFloat(p.amount.replace(/,/g, '')) || 0;
            if (amount > 0) {
                let paymentDate = new Date(p.startYear, p.startMonth);
                if (p.frequency === 0) { // One-time payment
                    if (paymentDate >= constructionStartDate && paymentDate <= constructionEndDate) {
                        totalExtraPayments += amount;
                        extraPaymentSchedule.push({ date: paymentDate, amount, description: p.description || `Pago Extra` });
                    }
                } else { // Recurring payment
                    while (paymentDate <= constructionEndDate) {
                        if (paymentDate >= constructionStartDate) {
                            totalExtraPayments += amount;
                            extraPaymentSchedule.push({ date: new Date(paymentDate), amount, description: p.description || `Pago Extra` });
                        }
                        paymentDate.setMonth(paymentDate.getMonth() + p.frequency);
                    }
                }
            }
        });

        const totalInitial = (_discountedPropertyValue * _initialPercentage) / 100;
        const onContractSigning = totalInitial > _reservation ? totalInitial - _reservation : 0;
        const duringConstruction = (_discountedPropertyValue * _constructionPercentage) / 100;
        const remainingDuringConstruction = duringConstruction - totalExtraPayments;

        const onDelivery = _discountedPropertyValue - totalInitial - duringConstruction;

        let monthsDiff = 0;
        if (constructionEndDate >= constructionStartDate) {
            monthsDiff = (constructionEndDate.getFullYear() - constructionStartDate.getFullYear()) * 12 + (constructionEndDate.getMonth() - constructionStartDate.getMonth()) + 1;
        }
        if (monthsDiff < 0) monthsDiff = 0;

        const installmentsCount = paymentFrequency === 'monthly' ? monthsDiff : Math.ceil(monthsDiff / 3);
        const installmentAmount = installmentsCount > 0 && remainingDuringConstruction > 0 ? remainingDuringConstruction / installmentsCount : 0;

        return { onContractSigning, duringConstruction, totalExtraPayments, onDelivery, installmentsCount, installmentAmount, extraPaymentSchedule, totalInitial, remainingDuringConstruction, discountedPropertyValue: _discountedPropertyValue };
    }, [propertyValue, fairDiscount, reservation, initialPercentage, constructionPercentage, startMonth, startYear, endMonth, endYear, extraPayments, paymentFrequency]);

    const combinedPaymentSchedule = useMemo(() => {
        const schedule: { date: Date; amount: number; description: string; type: 'regular' | 'extra' | 'delivery' }[] = [];

        // Regular construction installments
        if (calculations.installmentsCount > 0 && calculations.installmentAmount > 0) {
            let currentDate = new Date(startYear, startMonth);
            for (let i = 0; i < calculations.installmentsCount; i++) {
                schedule.push({
                    date: new Date(currentDate),
                    amount: calculations.installmentAmount,
                    description: `Cuota de Construcción`,
                    type: 'regular'
                });
                if (paymentFrequency === 'monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else {
                    currentDate.setMonth(currentDate.getMonth() + 3);
                }
            }
        }

        // Extra payments
        calculations.extraPaymentSchedule.forEach(p => {
            schedule.push({ ...p, type: 'extra' });
        });

        // Delivery payment (final balance)
        if (calculations.onDelivery > 0.005) { // Use a small threshold for floating point precision
            // The delivery date is exactly what the user selected in the form.
            const deliveryDate = new Date(endYear, endMonth, 1);

            schedule.push({
                date: deliveryDate,
                amount: calculations.onDelivery,
                description: 'Fecha de Entrega',
                type: 'delivery'
            });
        }

        // Sort all payments chronologically
        return schedule.sort((a, b) => a.date.getTime() - b.date.getTime());

    }, [calculations, startMonth, startYear, endMonth, endYear, paymentFrequency]);


    const handleAddExtraPayment = () => {
        setExtraPayments([...extraPayments, { id: Date.now(), amount: '', description: '', startMonth: currentMonth, startYear: currentYear, frequency: 0 }]);
    };

    const handleExtraPaymentChange = <T extends keyof ExtraPayment>(id: number, field: T, value: ExtraPayment[T]) => {
        if (field === 'amount') {
            const sanitized = String(value).replace(/,/g, '').replace(/[^0-9.]/g, '');
            if (sanitized.split('.').length > 2) return;
            setExtraPayments(extraPayments.map(p => p.id === id ? { ...p, amount: sanitized } : p));
        } else {
            setExtraPayments(extraPayments.map(p => p.id === id ? { ...p, [field]: value } : p));
        }
    };

    const handleRemoveExtraPayment = (id: number) => {
        setExtraPayments(extraPayments.filter(p => p.id !== id));
    };

    const deliveryPercentage = 100 - (parseFloat(initialPercentage) || 0) - (parseFloat(constructionPercentage) || 0);

    const handlePrint = () => {
        setIsGeneratingPdf(true);
        setToastMessage(null);

        const html2pdf = (window as any).html2pdf;
        if (!html2pdf) {
            console.error("html2pdf.js library is not loaded on the window object.");
            setToastMessage({ text: 'Error: La librería PDF no pudo cargarse.', type: 'error' });
            setIsGeneratingPdf(false);
            setTimeout(() => setToastMessage(null), 4000);
            return;
        }

        setTimeout(() => {
            const reportContainer = document.createElement('div');
            reportContainer.style.position = 'fixed';
            reportContainer.style.left = '-9999px';
            reportContainer.style.top = '-9999px';
            document.body.appendChild(reportContainer);

            const root = ReactDOM.createRoot(reportContainer);

            const _propertyValue = parseFloat(propertyValue.replace(/,/g, '')) || 0;
            const _fairDiscount = parseFloat(fairDiscount.replace(/,/g, '')) || 0;
            const _reservation = parseFloat(reservation.replace(/,/g, '')) || 0;
            const _initialPercentage = parseFloat(initialPercentage) || 0;
            const _constructionPercentage = parseFloat(constructionPercentage) || 0;

            const reportProps = {
                clientName: name,
                phone,
                email,
                unitType,
                propertyValue: _propertyValue,
                fairDiscount: _fairDiscount,
                reservation: _reservation,
                sellRate,
                currency,
                initialPercentage: _initialPercentage,
                constructionPercentage: _constructionPercentage,
                deliveryPercentage,
                calculations,
                combinedPaymentSchedule,
                paymentFrequency,
                formatCurrency,
                customLogo,
                promotionName,
            };

            root.render(<PrintableReport {...reportProps} />);

            setTimeout(() => {
                const contentToPrint = reportContainer.firstElementChild as HTMLElement | null;
                if (!contentToPrint) {
                    console.error("Could not find element to generate PDF from.");
                    setToastMessage({ text: 'Error interno al preparar el PDF.', type: 'error' });
                    setIsGeneratingPdf(false);
                    root.unmount();
                    document.body.removeChild(reportContainer);
                    return;
                }

                const sanitizedClientName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const options = {
                    margin: 0.5,
                    filename: `proyeccion_pago_${sanitizedClientName || 'cliente'}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
                    pagebreak: { mode: 'css' }
                };

                html2pdf().from(contentToPrint).set(options).save()
                    .catch((err: any) => {
                        console.error("Error generating PDF:", err);
                        setToastMessage({ text: 'No se pudo generar el PDF. Inténtalo de nuevo.', type: 'error' });
                        setTimeout(() => setToastMessage(null), 4000);
                    })
                    .finally(() => {
                        root.unmount();
                        document.body.removeChild(reportContainer);
                        setIsGeneratingPdf(false);
                    });
            }, 100);

        }, 100);
    };

    const handleShare = async () => {
        if (!shareableRef.current) return;

        setIsGeneratingImage(true);
        setToastMessage(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const canvas = await html2canvas(shareableRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    throw new Error('Canvas to Blob conversion failed');
                }
                // Create preview URL and store blob
                const imageUrl = URL.createObjectURL(blob);
                setPreviewImageUrl(imageUrl);
                setPreviewBlob(blob);
                setShowPreviewModal(true);
                setIsGeneratingImage(false);
            }, 'image/png');
        } catch (error) {
            console.error('Error generating image:', error);
            setToastMessage({ text: 'No se pudo generar la imagen.', type: 'error' });
            setTimeout(() => setToastMessage(null), 4000);
            setIsGeneratingImage(false);
        }
    };

    const handleCopyToClipboard = async () => {
        if (!previewBlob) return;

        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': previewBlob })
            ]);
            setToastMessage({ text: '✅ Imagen copiada al portapapeles', type: 'success' });
            setTimeout(() => setToastMessage(null), 3000);
            setShowPreviewModal(false);
        } catch (error) {
            // Fallback: download the image
            if (previewImageUrl) {
                const link = document.createElement('a');
                link.href = previewImageUrl;
                const sanitizedClientName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                link.download = `plan_pago_${sanitizedClientName || 'cliente'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setToastMessage({ text: '📥 Imagen descargada (copiar no soportado)', type: 'success' });
                setTimeout(() => setToastMessage(null), 3000);
                setShowPreviewModal(false);
            }
        }
    };

    const handleShareFromModal = async () => {
        if (!previewBlob) return;

        const sanitizedClientName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `plan_pago_${sanitizedClientName || 'cliente'}.png`;
        const file = new File([previewBlob], fileName, { type: 'image/png' });
        const shareData = {
            title: 'Proyección de Plan de Pago',
            text: `Aquí está la proyección del plan de pago para ${name} (${unitType}).`,
            files: [file],
        };

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                setShowPreviewModal(false);
            } else {
                // Fallback: download
                const link = document.createElement('a');
                link.href = URL.createObjectURL(previewBlob);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setToastMessage({ text: '📥 Imagen descargada', type: 'success' });
                setTimeout(() => setToastMessage(null), 3000);
                setShowPreviewModal(false);
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const closePreviewModal = () => {
        setShowPreviewModal(false);
        if (previewImageUrl) {
            URL.revokeObjectURL(previewImageUrl);
        }
        setPreviewImageUrl(null);
        setPreviewBlob(null);
    };

    const handleExportExcel = useCallback(() => {
        setIsGeneratingExcel(true);
        setToastMessage(null);

        setTimeout(() => {
            try {
                const XLSX = (window as any).XLSX;
                if (!XLSX) {
                    throw new Error("La librería de Excel (SheetJS) no está cargada.");
                }
                const _propertyValue = parseFloat(propertyValue.replace(/,/g, '')) || 0;
                const _fairDiscount = parseFloat(fairDiscount.replace(/,/g, '')) || 0;
                const _reservation = parseFloat(reservation.replace(/,/g, '')) || 0;

                const clientData = [
                    ["Datos del Cliente y Propiedad"],
                    ["Nombre:", name],
                    ["Teléfono:", phone],
                    ["Correo:", email],
                    ["Tipo de Unidad:", unitType],
                    [],
                    ["Valor de la Propiedad:", _propertyValue],
                    ["Descuento Feria Alveare:", _fairDiscount],
                    ["Valor Final con Descuento:", calculations.discountedPropertyValue],
                    ["Monto de Reserva:", _reservation],
                ];

                const summaryData = [
                    [],
                    ["Resumen Financiero"],
                    [`Total Separación (${(parseFloat(initialPercentage) || 0).toFixed(2)}%):`, calculations.totalInitial],
                    ["  Abonado en Reserva:", _reservation],
                    ["  Saldo a la Firma de Contrato:", calculations.onContractSigning],
                    [],
                    [`Total Durante Construcción (${(parseFloat(constructionPercentage) || 0).toFixed(2)}%):`, calculations.duringConstruction],
                    ["  Pagos Extraordinarios:", calculations.totalExtraPayments],
                    ["  Saldo en Cuotas:", calculations.remainingDuringConstruction],
                    [],
                    [`${calculations.installmentsCount} cuotas de:`, calculations.installmentAmount],
                    [],
                    [`A la entrega (${deliveryPercentage > 0 ? deliveryPercentage.toFixed(2) : '0.00'}%):`, calculations.onDelivery]
                ];

                const scheduleHeader = ["Fecha", "Descripción", "Monto"];
                const scheduleData = combinedPaymentSchedule.map(p => [
                    `${MONTHS[p.date.getMonth()]} ${p.date.getFullYear()}`,
                    p.description,
                    p.amount
                ]);
                const scheduleTotal = combinedPaymentSchedule.reduce((sum, p) => sum + p.amount, 0);
                const scheduleFooter = ["", "Total Pagos Programados", scheduleTotal];

                const finalSheetData = [
                    ...clientData,
                    ...summaryData,
                    [],
                    ["Cronograma de Pagos"],
                    scheduleHeader,
                    ...scheduleData,
                    scheduleFooter
                ];

                const ws = XLSX.utils.aoa_to_sheet(finalSheetData);

                ws['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 20 }];

                const currencyFormat = currency === Currency.USD ? '"US$"#,##0.00' : '"RD$"#,##0.00';

                const numberRows = [7, 8, 9, 10, 14, 15, 16, 18, 19, 20, 22, 23];
                numberRows.forEach(r => {
                    const cellAddress = XLSX.utils.encode_cell({ c: 1, r: r - 1 });
                    if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
                        ws[cellAddress].z = currencyFormat;
                    }
                });

                const scheduleStartRow = clientData.length + summaryData.length + 2;
                scheduleData.forEach((_, index) => {
                    const cellAddress = XLSX.utils.encode_cell({ c: 2, r: scheduleStartRow + index });
                    if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
                        ws[cellAddress].z = currencyFormat;
                    }
                });
                const totalCell = XLSX.utils.encode_cell({ c: 2, r: scheduleStartRow + scheduleData.length });
                if (ws[totalCell]) ws[totalCell].z = currencyFormat;

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Proyección de Pago");

                const sanitizedClientName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const fileName = `proyeccion_pago_${sanitizedClientName || 'cliente'}.xlsx`;

                XLSX.writeFile(wb, fileName);

                setToastMessage({ text: 'El archivo Excel ha sido descargado.', type: 'success' });
            } catch (error) {
                console.error("Error generating Excel file:", error);
                setToastMessage({ text: 'No se pudo generar el archivo Excel.', type: 'error' });
            } finally {
                setIsGeneratingExcel(false);
                setTimeout(() => setToastMessage(null), 3000);
            }
        }, 100);
    }, [name, phone, email, unitType, propertyValue, fairDiscount, reservation, calculations, initialPercentage, constructionPercentage, deliveryPercentage, combinedPaymentSchedule, currency]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else if (excelExportTrigger > 0) {
            handleExportExcel();
        }
    }, [excelExportTrigger, handleExportExcel]);


    return (
        <div className="space-y-6 pt-16 lg:pt-0 print:pt-0" id="printable-area">
            {isGeneratingPdf && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex flex-col items-center justify-center z-50 text-white">
                    <RefreshIcon className="w-12 h-12 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold">Generando Reporte PDF...</h2>
                    <p className="mt-2 text-slate-300">Esto puede tomar unos segundos.</p>
                </div>
            )}
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Proyección de Plan de Pago</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={handleReset} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <TrashIcon />
                        <span className="hidden md:inline">Limpiar</span>
                    </Button>
                    <Button onClick={handleShare} disabled={isGeneratingImage} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait">
                        {isGeneratingImage ? <RefreshIcon className="animate-spin" /> : <ShareIcon />}
                        <span className="hidden md:inline">{isGeneratingImage ? 'Generando...' : 'Resumen'}</span>
                    </Button>
                    <Button onClick={handlePrint} disabled={isGeneratingPdf} className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait">
                        <PrintIcon />
                        <span className="hidden md:inline">{isGeneratingPdf ? 'Generando...' : 'Reporte PDF'}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Datos del Cliente y Propiedad" className="lg:col-span-3 print:border card-print">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                        <InputGroup label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
                        <InputGroup label="Tipo de Unidad" value={unitType} onChange={(e) => setUnitType(e.target.value)} />
                        <InputGroup label="Teléfono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(809) 123-4567" />
                        <InputGroup label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@correo.com" />
                        <InputGroup label="Valor de la Propiedad" type="text" inputMode="decimal" value={formatForDisplay(propertyValue)} onChange={(e) => handleNumericInput(e.target.value, setPropertyValue)} placeholder="0.00" prefix={currency === Currency.USD ? 'US$' : 'RD$'} />
                        <InputGroup label="Monto de Reserva" type="text" inputMode="decimal" value={formatForDisplay(reservation)} onChange={(e) => handleNumericInput(e.target.value, setReservation)} placeholder="0.00" prefix={currency === Currency.USD ? 'US$' : 'RD$'} />
                    </div>
                    <div className="hidden print:grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <p><strong>Nombre:</strong> {name}</p>
                        <p><strong>Tipo de Unidad:</strong> {unitType}</p>
                        <p><strong>Valor Propiedad:</strong> {formatCurrency(parseFloat(propertyValue) || 0)}</p>
                        <p><strong>Reserva:</strong> {formatCurrency(parseFloat(reservation) || 0)}</p>
                    </div>
                </Card>

                <Card title="Estructura de Pago" className="lg:col-span-3 print:hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="relative">
                            <InputGroup
                                label={`Separación a la firma (${(parseFloat(initialPercentage) || 0).toFixed(2)}%)`}
                                type="text"
                                inputMode="decimal"
                                value={initialInputMode === 'percent' ? initialInputValue : formatForDisplay(initialInputValue)}
                                onChange={handleInitialInputChange}
                                prefix={initialInputMode === 'amount' ? (currency === Currency.USD ? 'US$' : 'RD$') : undefined}
                                suffix={initialInputMode === 'percent' ? '%' : undefined}
                            />
                            <button
                                onClick={toggleInitialInputMode}
                                className="absolute top-[26px] right-2 h-7 w-14 text-xs font-bold rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Cambiar modo de entrada"
                                title={`Cambiar a ${initialInputMode === 'percent' ? 'monto' : 'porcentaje'}`}
                            >
                                {initialInputMode === 'percent' ? (currency === Currency.USD ? 'US$' : 'RD$') : '%'}
                            </button>
                        </div>

                        <InputGroup label={`Durante Construcción (${(parseFloat(constructionPercentage) || 0).toFixed(2)}%)`} type="number" value={constructionPercentage} onChange={(e) => setConstructionPercentage(e.target.value)} suffix="%" />
                        <InputGroup label={`A la entrega (${deliveryPercentage > 0 ? deliveryPercentage.toFixed(2) : 0}%)`} value={formatCurrency(calculations.onDelivery)} readOnly />
                    </div>
                </Card>

                <Card title="Plan de Pago Durante Construcción" className="lg:col-span-3 print:hidden">
                    <div className="grid grid-cols-1 md:flex md:items-end md:gap-4">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <SelectGroup label="Inicio de Pago" value={startMonth} onChange={(e) => setStartMonth(parseInt(e.target.value))}>
                                {MONTHS.map((month, i) => <option key={i} value={i}>{month}</option>)}
                            </SelectGroup>
                            <SelectGroup label="Año" value={startYear} onChange={(e) => setStartYear(parseInt(e.target.value))}>
                                {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                            </SelectGroup>
                        </div>

                        <div className="flex items-center justify-center text-slate-500 dark:text-slate-400 text-2xl font-light md:pb-4">→</div>

                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <SelectGroup label="Fecha de Entrega" value={endMonth} onChange={(e) => setEndMonth(parseInt(e.target.value))}>
                                {MONTHS.map((month, i) => <option key={i} value={i}>{month}</option>)}
                            </SelectGroup>
                            <SelectGroup label="Año" value={endYear} onChange={(e) => setEndYear(parseInt(e.target.value))}>
                                {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                            </SelectGroup>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Frecuencia de Cuotas</label>
                        <div className="flex items-center space-x-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                            <Button onClick={() => setPaymentFrequency('monthly')} className={`flex-1 ${paymentFrequency === 'monthly' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Mensual</Button>
                            <Button onClick={() => setPaymentFrequency('quarterly')} className={`flex-1 ${paymentFrequency === 'quarterly' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Trimestral</Button>
                        </div>
                    </div>
                </Card>

                {promotionEnabled && (
                    <Card title={`Descuento ${promotionName}`} className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1 relative">
                                <InputGroup
                                    label={`Descuento por ${promotionName}`}
                                    type="text"
                                    inputMode="decimal"
                                    value={fairDiscountInputMode === 'percent' ? fairDiscountInputValue : formatForDisplay(fairDiscountInputValue)}
                                    onChange={handleFairDiscountInputChange}
                                    placeholder="0.00"
                                    prefix={fairDiscountInputMode === 'amount' ? (currency === Currency.USD ? 'US$' : 'RD$') : undefined}
                                    suffix={fairDiscountInputMode === 'percent' ? '%' : undefined}
                                />
                                <button
                                    onClick={toggleFairDiscountInputMode}
                                    className="absolute top-[26px] right-2 h-7 w-14 text-xs font-bold rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Cambiar modo de entrada de descuento"
                                    title={`Cambiar a ${fairDiscountInputMode === 'percent' ? 'monto' : 'porcentaje'}`}
                                >
                                    {fairDiscountInputMode === 'percent' ? (currency === Currency.USD ? 'US$' : 'RD$') : '%'}
                                </button>
                            </div>
                            <div className="md:col-span-2 text-right space-y-1">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Valor Original: <span className="font-mono text-base text-slate-600 dark:text-slate-300">{formatCurrency(parseFloat(propertyValue.replace(/,/g, '')) || 0)}</span>
                                </p>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    Nuevo Valor con Descuento: <span className="font-mono text-xl text-blue-600 dark:text-blue-400">{formatCurrency(calculations.discountedPropertyValue)}</span>
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                <Card title="Pagos Extraordinarios" className="lg:col-span-3 print:hidden">
                    <div className="space-y-4">
                        {extraPayments.map((payment, index) => (
                            <div key={payment.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                <InputGroup className="md:col-span-3" label={`Descripción ${index + 1}`} value={payment.description} onChange={(e) => handleExtraPaymentChange(payment.id, 'description', e.target.value)} placeholder="Ej: Bono Navideño" />
                                <InputGroup className="md:col-span-2" label="Monto" type="text" inputMode="decimal" value={formatForDisplay(payment.amount)} onChange={(e) => handleExtraPaymentChange(payment.id, 'amount', e.target.value)} prefix={currency === Currency.USD ? 'US$' : 'RD$'} />
                                <SelectGroup className="md:col-span-2" label="Mes" value={payment.startMonth} onChange={(e) => handleExtraPaymentChange(payment.id, 'startMonth', parseInt(e.target.value))}>
                                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </SelectGroup>
                                <SelectGroup className="md:col-span-2" label="Año" value={payment.startYear} onChange={(e) => handleExtraPaymentChange(payment.id, 'startYear', parseInt(e.target.value))}>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </SelectGroup>
                                <SelectGroup className="md:col-span-2" label="Frecuencia" value={payment.frequency} onChange={(e) => handleExtraPaymentChange(payment.id, 'frequency', parseInt(e.target.value))}>
                                    <option value={0}>Única Vez</option>
                                    <option value={3}>Trimestral</option>
                                    <option value={6}>Semestral</option>
                                    <option value={12}>Anual</option>
                                </SelectGroup>
                                <button onClick={() => handleRemoveExtraPayment(payment.id)} className="bg-red-500 text-white hover:bg-red-600 h-10 w-10 flex items-center justify-center p-0 rounded-md md:col-span-1" aria-label="Eliminar pago">
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleAddExtraPayment} className="mt-4 w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">
                        + Añadir Pago Extraordinario
                    </Button>
                </Card>

                <Card title="Resumen Financiero" className="lg:col-span-3 card-print">
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        {/* Total Separación */}
                        <div className="flex justify-between items-baseline">
                            <p className="font-bold text-slate-800 dark:text-slate-100">Total Separación ({(parseFloat(initialPercentage) || 0).toFixed(2)}%):</p>
                            <p className="font-mono text-lg font-bold">{formatCurrency(calculations.totalInitial)}</p>
                        </div>
                        <div className="pl-6 space-y-1">
                            <div className="flex justify-between items-baseline">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Abonado en Reserva:</p>
                                <p className="font-mono text-sm">({formatCurrency(parseFloat(reservation.replace(/,/g, '')) || 0)})</p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Saldo a la Firma de Contrato:</p>
                                <p className="font-mono text-sm font-semibold">{formatCurrency(calculations.onContractSigning)}</p>
                            </div>
                        </div>

                        {/* Durante Construcción */}
                        <div className="flex justify-between items-baseline">
                            <p className="font-bold text-slate-800 dark:text-slate-100">Durante Construcción ({(parseFloat(constructionPercentage) || 0).toFixed(2)}%):</p>
                            <p className="font-mono text-lg font-bold">{formatCurrency(calculations.duringConstruction)}</p>
                        </div>

                        {/* A la Entrega */}
                        <div className="flex justify-between items-baseline">
                            <p className="font-bold text-slate-800 dark:text-slate-100">A la Entrega ({deliveryPercentage > 0 ? deliveryPercentage.toFixed(2) : '0.00'}%):</p>
                            <p className="font-mono text-lg font-bold">{formatCurrency(calculations.onDelivery)}</p>
                        </div>
                    </div>


                    {calculations.installmentsCount > 0 && (
                        <div className="mt-6 p-4 bg-slate-800 dark:bg-slate-900 rounded-lg text-center">
                            <span className="text-slate-400 dark:text-slate-400 text-sm">
                                {paymentFrequency === 'monthly' ? 'Cuota Mensual Estimada' : 'Cuota Trimestral Estimada'} ({calculations.installmentsCount} pagos)
                            </span>
                            <p className="font-bold text-blue-500 dark:text-blue-400 text-3xl mt-1 font-mono">
                                {formatCurrency(calculations.installmentAmount)}
                            </p>
                        </div>
                    )}
                </Card>

                <Card title="Cronograma de Pagos" className="lg:col-span-3 card-print">
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white dark:bg-slate-800">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-700">Fecha</th>
                                    <th className="p-3 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-700">Descripción</th>
                                    <th className="p-3 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-700 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {combinedPaymentSchedule.length > 0 ? (
                                    combinedPaymentSchedule.map((entry, index) => (
                                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{`${MONTHS[entry.date.getMonth()]} ${entry.date.getFullYear()}`}</td>
                                            <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{entry.description}</td>
                                            <td className="p-3 text-sm text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrency(entry.amount)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center p-8 text-slate-500 dark:text-slate-400">
                                            No hay pagos programados durante la construcción.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Preview Modal */}
            {showPreviewModal && previewImageUrl && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closePreviewModal}>
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Vista Previa del Resumen</h3>
                            <button
                                onClick={closePreviewModal}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Image Preview */}
                        <div className="p-4 overflow-auto max-h-[60vh] bg-slate-50 dark:bg-slate-900/50">
                            <img
                                src={previewImageUrl}
                                alt="Vista previa del resumen"
                                className="w-full rounded-lg shadow-lg"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                            <button
                                onClick={handleCopyToClipboard}
                                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-semibold text-slate-700 dark:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">📋</span>
                                Copiar
                            </button>
                            <button
                                onClick={handleShareFromModal}
                                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">📤</span>
                                Compartir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className={`fixed bottom-5 right-5 px-4 py-2 rounded-lg shadow-lg animate-fade-in-out ${toastMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toastMessage.text}
                </div>
            )}

            <div className="fixed -top-[9999px] -left-[9999px]" aria-hidden="true">
                <div ref={shareableRef}>
                    <ShareableImage
                        clientName={name}
                        unitType={unitType}
                        currencySymbol={currency === Currency.USD ? 'USD' : 'DOP'}
                        propertyValue={formatCurrency(parseFloat(propertyValue.replace(/,/g, '')) || 0)}
                        fairDiscount={formatCurrency(parseFloat(fairDiscount.replace(/,/g, '')) || 0)}
                        discountedPropertyValue={formatCurrency(calculations.discountedPropertyValue)}
                        reservation={formatCurrency(parseFloat(reservation) || 0)}
                        totalInitial={formatCurrency(calculations.totalInitial)}
                        duringConstruction={formatCurrency(calculations.duringConstruction)}
                        onDelivery={formatCurrency(calculations.onDelivery)}
                        installmentsCount={calculations.installmentsCount}
                        installmentAmount={formatCurrency(calculations.installmentAmount)}
                        paymentFrequency={paymentFrequency}
                        customLogo={customLogo}
                        promotionName={promotionName}
                    />
                </div>
            </div>
        </div>
    );
};

export default PaymentPlanCalculator;