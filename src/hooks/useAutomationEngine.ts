import { useState, useCallback, useMemo } from 'react';
import type { Lead, AutomationRule, PendingAutomation } from '../types';
import { LeadStatus } from '../types';

interface UseAutomationEngineProps {
  leads: Lead[];
  rules: AutomationRule[];
  onAction?: (automation: PendingAutomation) => void;
}

interface UseAutomationEngineReturn {
  pendingAutomations: PendingAutomation[];
  alertCount: number;
  whatsappCount: number;
  emailCount: number;
  supervisorAlerts: PendingAutomation[];
  executeWhatsApp: (automation: PendingAutomation) => void;
  dismissAutomation: (leadId: string, ruleId: string) => void;
  dismissedCount: number;
}

export function useAutomationEngine({ 
  leads, 
  rules,
  onAction 
}: UseAutomationEngineProps): UseAutomationEngineReturn {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Calculate days since last contact for each lead
  const getLeadMetrics = useCallback((lead: Lead) => {
    const now = new Date();
    
    // Days since last contact
    const lastContact = lead.lastContactDate ? new Date(lead.lastContactDate) : new Date(lead.createdAt);
    const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    
    // Days in current status (approximation - would need status change history for accuracy)
    const createdAt = new Date(lead.createdAt);
    const daysInStatus = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return { daysSinceContact, daysInStatus };
  }, []);

  // Check if a rule applies to a lead
  const ruleApplies = useCallback((rule: AutomationRule, lead: Lead): boolean => {
    // Skip closed leads unless specifically targeted
    if (lead.status === LeadStatus.CLOSED_WON || lead.status === LeadStatus.CLOSED_LOST) {
      return false;
    }

    // Check if rule is active
    if (!rule.is_active) return false;

    // Check status filter
    if (rule.apply_to_statuses && rule.apply_to_statuses.length > 0) {
      if (!rule.apply_to_statuses.includes(lead.status)) {
        return false;
      }
    }

    // For status-specific triggers
    if (rule.trigger === 'days_in_status' && rule.trigger_status) {
      if (lead.status !== rule.trigger_status) {
        return false;
      }
    }

    return true;
  }, []);

  // Generate message from template
  const generateMessage = useCallback((template: string, lead: Lead, days: number): string => {
    return template
      .replace(/{lead_name}/g, lead.name)
      .replace(/{days}/g, days.toString())
      .replace(/{phone}/g, lead.phone)
      .replace(/{email}/g, lead.email)
      .replace(/{status}/g, lead.status)
      .replace(/{budget}/g, lead.budget.toLocaleString())
      .replace(/{interest}/g, lead.interestArea);
  }, []);

  // Calculate pending automations
  const pendingAutomations = useMemo(() => {
    const pending: PendingAutomation[] = [];
    const activeRules = rules.filter(r => r.is_active);

    for (const lead of leads) {
      const { daysSinceContact, daysInStatus } = getLeadMetrics(lead);

      for (const rule of activeRules) {
        // Skip if dismissed
        const dismissKey = `${lead.id}-${rule.id}`;
        if (dismissed.has(dismissKey)) continue;

        // Check if rule applies to this lead
        if (!ruleApplies(rule, lead)) continue;

        // Check trigger conditions
        let triggered = false;
        let relevantDays = 0;

        switch (rule.trigger) {
          case 'days_without_contact':
            triggered = daysSinceContact >= rule.trigger_value;
            relevantDays = daysSinceContact;
            break;
          case 'days_in_status':
            triggered = daysInStatus >= rule.trigger_value;
            relevantDays = daysInStatus;
            break;
          case 'follow_up_overdue':
            const nextFollowUp = new Date(lead.nextFollowUpDate);
            const overdueDays = Math.floor((new Date().getTime() - nextFollowUp.getTime()) / (1000 * 60 * 60 * 24));
            triggered = overdueDays >= rule.trigger_value;
            relevantDays = overdueDays;
            break;
        }

        if (triggered) {
          const suggestedMessage = rule.action_config.message_template
            ? generateMessage(rule.action_config.message_template, lead, relevantDays)
            : undefined;

          pending.push({
            rule,
            lead,
            daysSinceContact,
            daysInStatus,
            suggestedMessage,
          });
        }
      }
    }

    // Sort by urgency (most days without contact first)
    return pending.sort((a, b) => b.daysSinceContact - a.daysSinceContact);
  }, [leads, rules, dismissed, getLeadMetrics, ruleApplies, generateMessage]);

  // Count by action type
  const alertCount = useMemo(() => 
    pendingAutomations.filter(a => a.rule.action === 'show_alert').length,
    [pendingAutomations]
  );

  const whatsappCount = useMemo(() => 
    pendingAutomations.filter(a => a.rule.action === 'send_whatsapp').length,
    [pendingAutomations]
  );

  const emailCount = useMemo(() => 
    pendingAutomations.filter(a => a.rule.action === 'send_email').length,
    [pendingAutomations]
  );

  const supervisorAlerts = useMemo(() => 
    pendingAutomations.filter(a => a.rule.action === 'notify_supervisor'),
    [pendingAutomations]
  );

  // Execute WhatsApp action
  const executeWhatsApp = useCallback((automation: PendingAutomation) => {
    const { lead, suggestedMessage } = automation;
    const phone = lead.phone.replace(/\D/g, '');
    const message = encodeURIComponent(suggestedMessage || '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    // Dismiss this automation
    setDismissed(prev => new Set([...prev, `${lead.id}-${automation.rule.id}`]));
    
    if (onAction) {
      onAction(automation);
    }
  }, [onAction]);

  // Dismiss an automation
  const dismissAutomation = useCallback((leadId: string, ruleId: string) => {
    setDismissed(prev => new Set([...prev, `${leadId}-${ruleId}`]));
  }, []);

  return {
    pendingAutomations,
    alertCount,
    whatsappCount,
    emailCount,
    supervisorAlerts,
    executeWhatsApp,
    dismissAutomation,
    dismissedCount: dismissed.size,
  };
}
