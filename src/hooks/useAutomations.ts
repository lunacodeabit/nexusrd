import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { AutomationRule, AutomationExecution } from '../types';

interface UseAutomationsReturn {
  rules: AutomationRule[];
  executions: AutomationExecution[];
  isLoading: boolean;
  error: Error | null;
  addRule: (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateRule: (id: string, updates: Partial<AutomationRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string, isActive: boolean) => Promise<void>;
  logExecution: (execution: Omit<AutomationExecution, 'id' | 'executed_at'>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAutomations(): UseAutomationsReturn {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rulesError) {
        // Table might not exist yet - use default rules
        console.log('Automation rules table not found, using defaults');
        setRules(getDefaultRules(user.id));
      } else {
        setRules(rulesData || []);
      }

      // Fetch recent executions
      const { data: execData, error: execError } = await supabase
        .from('automation_executions')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(100);

      if (!execError) {
        setExecutions(execData || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching automations'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const addRule = async (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    const newRule: AutomationRule = {
      ...rule,
      id: crypto.randomUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try to save to Supabase
    const { error } = await supabase
      .from('automation_rules')
      .insert(newRule);

    if (error) {
      console.log('Could not save to Supabase, saving locally');
    }

    setRules(prev => [newRule, ...prev]);
  };

  const updateRule = async (id: string, updates: Partial<AutomationRule>) => {
    const { error } = await supabase
      .from('automation_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.log('Could not update in Supabase');
    }

    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
    ));
  };

  const deleteRule = async (id: string) => {
    await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    setRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    await updateRule(id, { is_active: isActive });
  };

  const logExecution = async (execution: Omit<AutomationExecution, 'id' | 'executed_at'>) => {
    const newExecution: AutomationExecution = {
      ...execution,
      id: crypto.randomUUID(),
      executed_at: new Date().toISOString(),
    };

    await supabase
      .from('automation_executions')
      .insert(newExecution);

    setExecutions(prev => [newExecution, ...prev]);
  };

  return {
    rules,
    executions,
    isLoading,
    error,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    logExecution,
    refetch: fetchRules,
  };
}

// Default automation rules for new users
function getDefaultRules(userId: string): AutomationRule[] {
  const now = new Date().toISOString();
  
  return [
    {
      id: 'default-1',
      name: '⚠️ Lead sin contacto 2 días',
      description: 'Alerta cuando un lead lleva 2 días sin contacto',
      trigger: 'days_without_contact',
      trigger_value: 2,
      action: 'show_alert',
      action_config: {
        message_template: '¡Atención! {lead_name} lleva {days} días sin contacto. ¡Contáctalo ahora!'
      },
      is_active: true,
      apply_to_statuses: ['NUEVO', 'CONTACTADO', 'VISITA_AGENDADA', 'NEGOCIACION'],
      created_at: now,
      updated_at: now,
      user_id: userId,
    },
    {
      id: 'default-2',
      name: '📱 WhatsApp automático 3 días',
      description: 'Sugiere enviar WhatsApp de seguimiento después de 3 días',
      trigger: 'days_without_contact',
      trigger_value: 3,
      action: 'send_whatsapp',
      action_config: {
        message_template: 'Hola {lead_name}, espero que estés bien. ¿Has tenido tiempo de pensar sobre las propiedades que vimos? Estoy aquí para ayudarte con cualquier duda. 🏠'
      },
      is_active: true,
      apply_to_statuses: ['CONTACTADO', 'VISITA_AGENDADA'],
      created_at: now,
      updated_at: now,
      user_id: userId,
    },
    {
      id: 'default-3',
      name: '🚨 Notificar supervisor 5 días',
      description: 'Notifica al supervisor si un lead lleva 5 días sin contacto',
      trigger: 'days_without_contact',
      trigger_value: 5,
      action: 'notify_supervisor',
      action_config: {
        message_template: 'El lead {lead_name} lleva {days} días sin atención. Requiere intervención.'
      },
      is_active: true,
      apply_to_statuses: ['NUEVO', 'CONTACTADO'],
      created_at: now,
      updated_at: now,
      user_id: userId,
    },
    {
      id: 'default-4',
      name: '❄️ Lead estancado en Negociación',
      description: 'Alerta si un lead lleva más de 7 días en negociación sin avance',
      trigger: 'days_in_status',
      trigger_value: 7,
      trigger_status: 'NEGOCIACION',
      action: 'show_alert',
      action_config: {
        message_template: '{lead_name} lleva {days} días en negociación. ¿Necesita un incentivo para cerrar?'
      },
      is_active: true,
      created_at: now,
      updated_at: now,
      user_id: userId,
    },
  ];
}
