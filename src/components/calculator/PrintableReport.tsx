import React from 'react';
import type { CSSProperties } from 'react';
import { Currency } from './types';
import { MONTHS } from './constants';
import { AlveareLogo } from './ui/AlveareLogo';

interface PrintableReportProps {
    clientName: string;
    phone: string;
    email: string;
    unitType: string;
    propertyValue: number;
    fairDiscount: number;
    reservation: number;
    sellRate: number;
    currency: Currency;
    initialPercentage: number;
    constructionPercentage: number;
    deliveryPercentage: number;
    calculations: {
        onContractSigning: number;
        totalInitial: number;
        duringConstruction: number;
        totalExtraPayments: number;
        totalBalonExtraPayments: number;
        onDelivery: number;
        installmentsCount: number;
        installmentAmount: number;
        remainingDuringConstruction: number;
    };
    combinedPaymentSchedule: { date: Date; amount: number; description: string; type: 'regular' | 'extra' | 'delivery' }[];
    paymentFrequency: 'monthly' | 'quarterly';
    formatCurrency: (value: number) => string;
    customLogo: string | null;
    promotionName: string;
}

const PrintableReport: React.FC<PrintableReportProps> = ({
    clientName,
    phone,
    email,
    unitType,
    propertyValue,
    fairDiscount,
    reservation,
    calculations,
    combinedPaymentSchedule,
    formatCurrency,
    initialPercentage,
    deliveryPercentage,
    constructionPercentage,
    paymentFrequency,
    customLogo,
    promotionName,
}) => {
    const today = new Date();
    const hasDiscount = fairDiscount > 0;

    const styles: { [key: string]: CSSProperties } = {
        page: {
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '10pt',
            lineHeight: 1.5,
            color: '#1e293b', // slate-800
            backgroundColor: '#ffffff',
        },
        header: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingBottom: '12px',
            marginBottom: '24px',
            borderBottom: 'none',
        },
        mainTitleContainer: {
            textAlign: 'left',
            marginTop: '16px',
        },
        mainTitle: {
            fontSize: '24pt',
            fontWeight: 'bold',
            color: '#1e3a8a', // blue-900
            margin: 0,
        },
        clientInfo: {
            fontSize: '9.5pt',
            color: '#475569', // slate-600
            marginTop: '8px'
        },
        sectionTitle: {
            fontSize: '13pt',
            fontWeight: 'bold',
            color: '#1e40af', // blue-800
            backgroundColor: '#e0e8f9',
            padding: '8px 12px',
            borderRadius: '6px',
            borderBottom: 'none',
            margin: '20px 0 8px 0',
        },
        infoBox: {
            backgroundColor: '#f8fafc', // slate-50
            borderRadius: '8px',
            padding: '16px',
            border: 'none',
        },
        summaryContainer: {
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '8px 16px 16px 16px',
            border: 'none',
        },
        summaryRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: 'none',
            alignItems: 'center',
        },
        summaryLabel: { color: '#334155' /* slate-700 */, fontSize: '9.5pt' },
        summaryValue: { color: '#1e293b' /* slate-800 */, textAlign: 'left', fontWeight: '500' },
        summaryIndented: { paddingLeft: '20px', fontSize: '9pt' },
        bold: { fontWeight: 'bold' },
        highlightBox: {
            backgroundColor: '#dbeafe', // blue-200
            color: '#1e3a8a', // blue-900
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
            textAlign: 'left',
            fontWeight: 'bold',
            fontSize: '12pt',
            border: 'none',
        },
        scheduleContainer: { pageBreakInside: 'auto', marginTop: '20px' },
        scheduleHeaderContainer: {
            pageBreakInside: 'avoid',
        },
        scheduleHeader: {
            display: 'flex',
            backgroundColor: '#374151', // gray-700
            color: '#ffffff',
            padding: '10px 12px',
            fontSize: '10pt',
            fontWeight: 'bold',
            borderBottom: 'none',
            borderRadius: '6px'
        },
        scheduleRow: {
            display: 'flex',
            padding: '8px 12px',
            borderBottom: 'none',
            fontSize: '9.5pt',
            pageBreakInside: 'avoid',
        },
        scheduleCell: {
            color: '#1f2937', // gray-800
        },
        footer: {
            marginTop: 'auto',
            paddingTop: '20px',
            borderTop: 'none',
            textAlign: 'left',
            fontSize: '8pt',
            color: '#64748b', // slate-500
            pageBreakBefore: 'auto'
        },
        customLogo: {
            maxHeight: '70px',
            maxWidth: '190px',
            objectFit: 'contain',
        }
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div>
                    {customLogo ? (
                        <img src={customLogo} alt="Logo Personalizado" style={styles.customLogo} />
                    ) : (
                        <AlveareLogo />
                    )}
                </div>
                <div style={styles.mainTitleContainer}>
                    <h1 style={styles.mainTitle}>Proyección de Pago</h1>
                    <div style={styles.clientInfo}>
                        <p style={{ margin: '4px 0 0 0' }}><strong>Fecha:</strong> {today.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                </div>
            </header>

            <main style={{ flexGrow: 1 }}>
                <div style={{ pageBreakInside: 'avoid' }}>
                    <h2 style={{ ...styles.sectionTitle, marginTop: 0 }}>Información del Cliente y Propiedad</h2>
                    <div style={styles.infoBox}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                            <p style={{ margin: 0 }}><strong>Nombre:</strong> {clientName || 'N/A'}</p>
                            <p style={{ margin: 0 }}><strong>Unidad:</strong> {unitType || 'N/A'}</p>
                            <p style={{ margin: 0 }}><strong>Teléfono:</strong> {phone || 'N/A'}</p>
                            <p style={{ margin: 0 }}><strong>Correo:</strong> {email || 'N/A'}</p>
                        </div>
                        <hr style={{ margin: '12px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span><strong>Reserva:</strong></span>
                                <span>{formatCurrency(reservation)}</span>
                            </div>
                            {hasDiscount ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Valor Original:</span>
                                        <span>{formatCurrency(propertyValue)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Descuento {promotionName}:</span>
                                        <span>({formatCurrency(fairDiscount)})</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                        <span>Valor Final con Descuento:</span>
                                        <span>{formatCurrency(propertyValue - fairDiscount)}</span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <span>Valor Total:</span>
                                    <span>{formatCurrency(propertyValue)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ pageBreakInside: 'avoid' }}>
                    <h2 style={styles.sectionTitle}>Resumen Financiero</h2>
                    <div style={styles.summaryContainer}>
                        <div style={{ ...styles.summaryRow, borderTop: 'none' }}>
                            <span style={{ ...styles.summaryLabel, ...styles.bold }}>Total Separación ({initialPercentage > 0 ? initialPercentage.toFixed(2) : '0.00'}%):</span>
                            <span style={{ ...styles.summaryValue, ...styles.bold, fontSize: '11pt', color: '#1d4ed8' }}>{formatCurrency(calculations.totalInitial)}</span>
                        </div>
                        <div style={{ ...styles.summaryRow, ...styles.summaryIndented }}>
                            <span style={styles.summaryLabel}>Monto de Reserva:</span>
                            <span style={styles.summaryValue}>({formatCurrency(reservation)})</span>
                        </div>
                        <div style={{ ...styles.summaryRow, ...styles.summaryIndented }}>
                            <span style={{ ...styles.summaryLabel, ...styles.bold }}>Saldo a la Firma de Contrato:</span>
                            <span style={{ ...styles.summaryValue, ...styles.bold }}>{formatCurrency(calculations.onContractSigning)}</span>
                        </div>

                        <div style={styles.summaryRow}>
                            <span style={styles.summaryLabel}>Durante Construcción ({constructionPercentage > 0 ? constructionPercentage.toFixed(2) : '0.00'}%):</span>
                            <span style={styles.summaryValue}>{formatCurrency(calculations.duringConstruction)}</span>
                        </div>
                        {calculations.totalExtraPayments > 0 && (
                            <div style={{ ...styles.summaryRow, ...styles.summaryIndented }}>
                                <span style={styles.summaryLabel}>Pagos Extraordinarios:</span>
                                <span style={styles.summaryValue}>{formatCurrency(calculations.totalExtraPayments)}</span>
                            </div>
                        )}
                        {calculations.totalBalonExtraPayments > 0 && (
                            <div style={{ ...styles.summaryRow, ...styles.summaryIndented }}>
                                <span style={{ ...styles.summaryLabel, color: '#7c3aed' }}>Pagos Adicionales (Cuota Balón):</span>
                                <span style={{ ...styles.summaryValue, color: '#7c3aed' }}>{formatCurrency(calculations.totalBalonExtraPayments)}</span>
                            </div>
                        )}
                        <div style={{ ...styles.summaryRow }}>
                            <span style={styles.summaryLabel}>A la Entrega ({deliveryPercentage > 0 ? deliveryPercentage.toFixed(2) : '0.00'}%):</span>
                            <span style={{ ...styles.summaryValue, fontWeight: 'bold' }}>{formatCurrency(calculations.onDelivery)}</span>
                        </div>

                        {calculations.installmentsCount > 0 &&
                            (() => {
                                const paymentFrequencyText = paymentFrequency === 'monthly' ? 'Cuota Mensual' : 'Cuota Trimestral';
                                return (
                                    <div style={styles.highlightBox}>
                                        {paymentFrequencyText} ({calculations.installmentsCount} pagos): {formatCurrency(calculations.installmentAmount)}
                                    </div>
                                );
                            })()
                        }
                    </div>
                </div>

                <div style={styles.scheduleContainer}>
                    <div style={styles.scheduleHeaderContainer}>
                        <h2 style={styles.sectionTitle}>Cronograma de Pagos</h2>
                        <div style={styles.scheduleHeader}>
                            <div style={{ ...styles.scheduleCell, width: '25%', color: 'white' }}>Fecha</div>
                            <div style={{ ...styles.scheduleCell, width: '50%', color: 'white' }}>Descripción</div>
                            <div style={{ ...styles.scheduleCell, width: '25%', textAlign: 'left', color: 'white' }}>Monto</div>
                        </div>
                    </div>
                    <div>
                        {combinedPaymentSchedule.length > 0 ? (
                            combinedPaymentSchedule.map((entry, index) => (
                                <div key={index} style={{ ...styles.scheduleRow, backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white' }}>
                                    <div style={{ ...styles.scheduleCell, width: '25%' }}>{`${MONTHS[entry.date.getMonth()]} ${entry.date.getFullYear()}`}</div>
                                    <div style={{ ...styles.scheduleCell, width: '50%' }}>{entry.description}</div>
                                    <div style={{ ...styles.scheduleCell, width: '25%', textAlign: 'left', fontFamily: 'monospace', fontSize: '10pt' }}>{formatCurrency(entry.amount)}</div>
                                </div>
                            ))
                        ) : (
                            <div style={styles.scheduleRow}>
                                <div style={{ ...styles.scheduleCell, width: '100%', textAlign: 'center', color: '#6b7280', padding: '24px 0' }}>
                                    No hay pagos programados.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer style={styles.footer}>
                <p style={{ margin: '0 0 2px 0' }}>Este es un documento de proyección y está sujeto a cambios. Los valores son presentados en USD.</p>
                <p style={{ margin: 0, fontWeight: '500' }}>Generado por Alveare Realty Calculator</p>
            </footer>
        </div>
    );
};

export default PrintableReport;