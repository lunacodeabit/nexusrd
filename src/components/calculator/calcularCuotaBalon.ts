/**
 * Calculadora de Pagos Extraordinarios (Cuota Balón)
 * 
 * Calcula el monto de pagos extra necesarios para saldar una deuda inmobiliaria.
 * Soporta dos escenarios: sin interés (capital puro) y con interés (valor presente).
 * 
 * @author ALVEARE CRM
 * @version 1.0
 */

export interface CuotaBalonParams {
    deudaTotal: number;       // Monto total a financiar
    cuotaMensual: number;     // Cuota mensual propuesta por el cliente
    totalMeses: number;       // Plazo total en meses
    frecuenciaExtra: number;  // Cada cuántos meses ocurre el pago extra (3, 6, 12)
    tasaAnual?: number;       // Tasa de interés anual (opcional, default 0)
}

export interface CuotaBalonResult {
    pagoExtraRequerido: number;   // Monto de cada pago extraordinario
    cantidadPagos: number;        // Cuántos pagos extras en el plazo
    deficit: number;              // Saldo que cubren los pagos extras
    recaudoCuotas: number;        // Total recaudado por cuotas mensuales
    tieneInteres: boolean;        // Si se aplicó tasa de interés
    tasaAplicada: number;         // Tasa anual aplicada
    esValido: boolean;            // Si el cálculo es válido
    mensaje: string;              // Mensaje descriptivo del resultado
}

/**
 * Calcula el pago extraordinario requerido para cubrir el saldo de una deuda.
 * 
 * CASO A (Sin Interés - Capital Puro):
 *   1. Recaudo = cuotaMensual × totalMeses
 *   2. Déficit = deudaTotal - Recaudo
 *   3. PagoExtra = Déficit / cantidadPagosExtras
 * 
 * CASO B (Con Interés - Valor Presente):
 *   1. i = (tasaAnual / 100) / 12 (tasa mensual)
 *   2. VP_Cuotas = cuotaMensual × [(1 - (1+i)^-n) / i] (anualidad)
 *   3. Saldo_VP = deudaTotal - VP_Cuotas
 *   4. Factor = Σ (1+i)^-mes para cada mes con pago extra
 *   5. PagoExtra = Saldo_VP / Factor
 */
export function calcularCuotaBalon(params: CuotaBalonParams): CuotaBalonResult {
    const { deudaTotal, cuotaMensual, totalMeses, frecuenciaExtra, tasaAnual = 0 } = params;

    // Validaciones básicas
    if (deudaTotal <= 0 || cuotaMensual <= 0 || totalMeses <= 0 || frecuenciaExtra <= 0) {
        return {
            pagoExtraRequerido: 0,
            cantidadPagos: 0,
            deficit: 0,
            recaudoCuotas: 0,
            tieneInteres: false,
            tasaAplicada: 0,
            esValido: false,
            mensaje: 'Los valores deben ser mayores a cero'
        };
    }

    // Calcular cuántos pagos extras caben en el plazo
    // Pagos en meses: frecuencia, 2*frecuencia, 3*frecuencia... mientras <= totalMeses
    const mesesConPagoExtra: number[] = [];
    for (let mes = frecuenciaExtra; mes <= totalMeses; mes += frecuenciaExtra) {
        mesesConPagoExtra.push(mes);
    }
    const cantidadPagos = mesesConPagoExtra.length;

    if (cantidadPagos === 0) {
        return {
            pagoExtraRequerido: 0,
            cantidadPagos: 0,
            deficit: 0,
            recaudoCuotas: cuotaMensual * totalMeses,
            tieneInteres: false,
            tasaAplicada: 0,
            esValido: false,
            mensaje: 'La frecuencia de pagos extra es mayor al plazo total'
        };
    }

    const tieneInteres = tasaAnual !== null && tasaAnual !== undefined && tasaAnual > 0;

    if (!tieneInteres) {
        // ═══════════════════════════════════════════════════════════
        // CASO A: Sin Interés (Capital Puro)
        // ═══════════════════════════════════════════════════════════

        // 1. Total recaudado por cuotas mensuales
        const recaudoCuotas = cuotaMensual * totalMeses;

        // 2. Déficit = lo que falta cubrir
        const deficit = deudaTotal - recaudoCuotas;

        // 3. Si las cuotas ya cubren todo, no se necesitan pagos extra
        if (deficit <= 0) {
            return {
                pagoExtraRequerido: 0,
                cantidadPagos,
                deficit: 0,
                recaudoCuotas,
                tieneInteres: false,
                tasaAplicada: 0,
                esValido: true,
                mensaje: '✅ Las cuotas mensuales cubren el total. No se requieren pagos extra.'
            };
        }

        // 4. Dividir déficit entre cantidad de pagos extras
        const pagoExtraRequerido = Math.round((deficit / cantidadPagos) * 100) / 100;

        return {
            pagoExtraRequerido,
            cantidadPagos,
            deficit,
            recaudoCuotas,
            tieneInteres: false,
            tasaAplicada: 0,
            esValido: true,
            mensaje: `✅ Plan viable: ${cantidadPagos} pagos extras de ${pagoExtraRequerido.toLocaleString('en-US', { minimumFractionDigits: 2 })} cada ${frecuenciaExtra} meses`
        };

    } else {
        // ═══════════════════════════════════════════════════════════
        // CASO B: Con Interés (Valor Presente)
        // ═══════════════════════════════════════════════════════════

        // 1. Convertir tasa anual a mensual decimal
        const tasaMensual = (tasaAnual / 100) / 12;

        // 2. Calcular Valor Presente de las cuotas mensuales (Anualidad Ordinaria)
        // VP = PMT × [(1 - (1+i)^-n) / i]
        const factorAnualidad = (1 - Math.pow(1 + tasaMensual, -totalMeses)) / tasaMensual;
        const vpCuotas = cuotaMensual * factorAnualidad;

        // 3. Saldo a cubrir en Valor Presente
        const saldoVP = deudaTotal - vpCuotas;

        // Si las cuotas ya cubren la deuda en VP
        if (saldoVP <= 0) {
            return {
                pagoExtraRequerido: 0,
                cantidadPagos,
                deficit: 0,
                recaudoCuotas: vpCuotas,
                tieneInteres: true,
                tasaAplicada: tasaAnual,
                esValido: true,
                mensaje: '✅ Las cuotas mensuales cubren el total (considerando intereses). No se requieren pagos extra.'
            };
        }

        // 4. Calcular Factor de Descuento Acumulado para pagos extras
        // Factor = Σ (1+i)^-mes para cada mes donde ocurre un pago extra
        let factorDescuento = 0;
        for (const mes of mesesConPagoExtra) {
            factorDescuento += Math.pow(1 + tasaMensual, -mes);
        }

        // 5. Pago extra = Saldo VP / Factor de descuento
        const pagoExtraRequerido = Math.round((saldoVP / factorDescuento) * 100) / 100;

        return {
            pagoExtraRequerido,
            cantidadPagos,
            deficit: saldoVP,
            recaudoCuotas: vpCuotas,
            tieneInteres: true,
            tasaAplicada: tasaAnual,
            esValido: true,
            mensaje: `✅ Plan viable con ${tasaAnual}% interés: ${cantidadPagos} pagos extras de ${pagoExtraRequerido.toLocaleString('en-US', { minimumFractionDigits: 2 })} cada ${frecuenciaExtra} meses`
        };
    }
}

/**
 * Frecuencias disponibles para pagos extraordinarios
 */
export const FRECUENCIAS_PAGO_EXTRA = [
    { value: 3, label: 'Trimestral (cada 3 meses)' },
    { value: 6, label: 'Semestral (cada 6 meses)' },
    { value: 12, label: 'Anual (cada 12 meses)' },
];
