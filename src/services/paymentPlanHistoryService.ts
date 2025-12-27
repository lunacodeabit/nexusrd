import { supabase } from '../lib/supabase';

export interface PaymentPlanRecord {
    id?: string;
    user_id?: string;

    // Datos del cliente
    client_name: string;
    client_phone?: string;
    client_email?: string;
    unit_type?: string;

    // Valores financieros
    property_value: number;
    discounted_value: number;
    reservation?: number;
    initial_percentage?: number;
    construction_percentage?: number;
    delivery_percentage?: number;

    // Resultados calculados
    total_initial?: number;
    on_contract_signing?: number;
    during_construction?: number;
    installments_count?: number;
    installment_amount?: number;
    delivery_amount?: number;

    // Pagos extraordinarios
    extra_payments?: Array<{
        description: string;
        amount: number;
        month: number;
        year: number;
        frequency: number;
    }>;

    // Metadata
    currency?: string;
    sell_rate?: number;
    payment_frequency?: string;

    // Fechas del plan
    start_month?: number;
    start_year?: number;
    end_month?: number;
    end_year?: number;

    // Promoción
    promotion_enabled?: boolean;
    promotion_name?: string;

    // Tipo de generación
    generated_type?: 'pdf' | 'image';

    created_at?: string;
}

/**
 * Guarda un plan de pago en el historial
 * Solo guarda si client_name está presente
 */
export async function savePaymentPlan(plan: PaymentPlanRecord): Promise<{ success: boolean; error?: string }> {
    if (!plan.client_name || plan.client_name.trim() === '') {
        return { success: false, error: 'No client name provided' };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        const { error } = await supabase
            .from('payment_plan_history')
            .insert([{
                user_id: user.id,
                client_name: plan.client_name.trim(),
                client_phone: plan.client_phone,
                client_email: plan.client_email,
                unit_type: plan.unit_type,
                property_value: plan.property_value,
                discounted_value: plan.discounted_value,
                reservation: plan.reservation,
                initial_percentage: plan.initial_percentage,
                construction_percentage: plan.construction_percentage,
                delivery_percentage: plan.delivery_percentage,
                total_initial: plan.total_initial,
                on_contract_signing: plan.on_contract_signing,
                during_construction: plan.during_construction,
                installments_count: plan.installments_count,
                installment_amount: plan.installment_amount,
                delivery_amount: plan.delivery_amount,
                extra_payments: plan.extra_payments,
                currency: plan.currency,
                sell_rate: plan.sell_rate,
                payment_frequency: plan.payment_frequency,
                start_month: plan.start_month,
                start_year: plan.start_year,
                end_month: plan.end_month,
                end_year: plan.end_year,
                promotion_enabled: plan.promotion_enabled,
                promotion_name: plan.promotion_name,
                generated_type: plan.generated_type
            }]);

        if (error) {
            console.error('Error saving payment plan:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Error saving payment plan:', err);
        return { success: false, error: 'Unexpected error' };
    }
}

/**
 * Obtiene el historial de planes de pago
 */
export async function getPaymentPlanHistory(options?: {
    limit?: number;
    offset?: number;
    searchTerm?: string;
}): Promise<{ data: PaymentPlanRecord[]; count: number; error?: string }> {
    const { limit = 50, offset = 0, searchTerm } = options || {};

    try {
        let query = supabase
            .from('payment_plan_history')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (searchTerm && searchTerm.trim()) {
            query = query.ilike('client_name', `%${searchTerm.trim()}%`);
        }

        const { data, count, error } = await query;

        if (error) {
            console.error('Error fetching payment history:', error);
            return { data: [], count: 0, error: error.message };
        }

        return { data: data || [], count: count || 0 };
    } catch (err) {
        console.error('Error fetching payment history:', err);
        return { data: [], count: 0, error: 'Unexpected error' };
    }
}

/**
 * Obtiene un plan específico por ID
 */
export async function getPaymentPlanById(id: string): Promise<PaymentPlanRecord | null> {
    try {
        const { data, error } = await supabase
            .from('payment_plan_history')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching payment plan:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Error fetching payment plan:', err);
        return null;
    }
}

/**
 * Elimina un plan de pago del historial
 */
export async function deletePaymentPlan(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('payment_plan_history')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting payment plan:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Error deleting payment plan:', err);
        return { success: false, error: 'Unexpected error' };
    }
}
