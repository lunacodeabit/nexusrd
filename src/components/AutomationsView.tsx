import React, { useState, useMemo } from 'react';
import { 
  Zap, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, 
  MessageSquare, Mail, Bell, AlertTriangle, CheckCircle2,
  Clock, Users, ChevronDown, ChevronUp, Send, X,
  Settings, Activity, Filter
} from 'lucide-react';
import { useAutomations } from '../hooks/useAutomations';
import { useAutomationEngine } from '../hooks/useAutomationEngine';
import type { Lead, AutomationRule, AutomationTrigger, AutomationAction, PendingAutomation } from '../types';
import { LeadStatus } from '../types';
import Modal from './Modal';

interface AutomationsViewProps {
  leads: Lead[];
}

const TRIGGER_OPTIONS: { value: AutomationTrigger; label: string; icon: React.ReactNode }[] = [
  { value: 'days_without_contact', label: 'Días sin contacto', icon: <Clock size={16} /> },
  { value: 'days_in_status', label: 'Días en mismo status', icon: <Activity size={16} /> },
  { value: 'follow_up_overdue', label: 'Seguimiento vencido', icon: <AlertTriangle size={16} /> },
];

const ACTION_OPTIONS: { value: AutomationAction; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'send_whatsapp', label: 'Enviar WhatsApp', icon: <MessageSquare size={16} />, color: 'text-green-400' },
  { value: 'send_email', label: 'Enviar Email', icon: <Mail size={16} />, color: 'text-blue-400' },
  { value: 'show_alert', label: 'Mostrar Alerta', icon: <Bell size={16} />, color: 'text-yellow-400' },
  { value: 'notify_supervisor', label: 'Notificar Supervisor', icon: <Users size={16} />, color: 'text-purple-400' },
  { value: 'create_task', label: 'Crear Tarea', icon: <CheckCircle2 size={16} />, color: 'text-orange-400' },
];

const STATUS_OPTIONS = Object.values(LeadStatus);

const AutomationsView: React.FC<AutomationsViewProps> = ({ leads }) => {
  const { rules, addRule, updateRule, deleteRule, toggleRule, isLoading } = useAutomations();
  const [activeTab, setActiveTab] = useState<'pending' | 'rules'>('pending');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [filterAction, setFilterAction] = useState<AutomationAction | 'all'>('all');

  // Automation engine
  const {
    pendingAutomations,
    alertCount,
    whatsappCount,
    executeWhatsApp,
    dismissAutomation,
  } = useAutomationEngine({ leads, rules });

  // Filtered pending automations
  const filteredPending = useMemo(() => {
    if (filterAction === 'all') return pendingAutomations;
    return pendingAutomations.filter(a => a.rule.action === filterAction);
  }, [pendingAutomations, filterAction]);

  const handleSaveRule = async (ruleData: Partial<AutomationRule>) => {
    if (editingRule) {
      await updateRule(editingRule.id, ruleData);
    } else {
      await addRule(ruleData as Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'user_id'>);
    }
    setIsFormOpen(false);
    setEditingRule(null);
  };

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-yellow-400" />
            Automatizaciones
          </h1>
          <p className="text-gray-400 mt-1">
            Seguimiento automático inteligente para no perder ningún lead
          </p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-nexus-accent text-nexus-base font-bold rounded-lg hover:bg-orange-400 transition-colors"
        >
          <Plus size={18} />
          Nueva Regla
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Pendientes" 
          value={pendingAutomations.length} 
          icon={<Clock className="w-5 h-5" />} 
          color="text-yellow-400"
          subtitle="Acciones sugeridas"
        />
        <StatCard 
          label="WhatsApp" 
          value={whatsappCount} 
          icon={<MessageSquare className="w-5 h-5" />} 
          color="text-green-400"
          subtitle="Mensajes a enviar"
        />
        <StatCard 
          label="Alertas" 
          value={alertCount} 
          icon={<Bell className="w-5 h-5" />} 
          color="text-red-400"
          subtitle="Requieren atención"
        />
        <StatCard 
          label="Reglas Activas" 
          value={rules.filter(r => r.is_active).length} 
          icon={<Zap className="w-5 h-5" />} 
          color="text-purple-400"
          subtitle={`de ${rules.length} totales`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-nexus-accent text-nexus-base'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📬 Acciones Pendientes ({pendingAutomations.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'rules'
              ? 'bg-nexus-accent text-nexus-base'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          ⚙️ Configurar Reglas ({rules.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' ? (
        <PendingActionsView
          automations={filteredPending}
          filterAction={filterAction}
          onFilterChange={setFilterAction}
          onExecuteWhatsApp={executeWhatsApp}
          onDismiss={dismissAutomation}
        />
      ) : (
        <RulesConfigView
          rules={rules}
          onToggle={toggleRule}
          onEdit={handleEditRule}
          onDelete={deleteRule}
          isLoading={isLoading}
        />
      )}

      {/* Rule Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingRule(null); }}
        title={editingRule ? 'Editar Regla' : 'Nueva Regla de Automatización'}
      >
        <RuleForm
          initialData={editingRule}
          onSave={handleSaveRule}
          onCancel={() => { setIsFormOpen(false); setEditingRule(null); }}
        />
      </Modal>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ label, value, icon, color, subtitle }) => (
  <div className="bg-nexus-surface p-4 rounded-xl border border-white/5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`${color} opacity-50`}>{icon}</div>
    </div>
  </div>
);

// Pending Actions View
const PendingActionsView: React.FC<{
  automations: PendingAutomation[];
  filterAction: AutomationAction | 'all';
  onFilterChange: (action: AutomationAction | 'all') => void;
  onExecuteWhatsApp: (automation: PendingAutomation) => void;
  onDismiss: (leadId: string, ruleId: string) => void;
}> = ({ automations, filterAction, onFilterChange, onExecuteWhatsApp, onDismiss }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        <span className="text-sm text-gray-400">Filtrar:</span>
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filterAction === 'all' ? 'bg-nexus-accent text-nexus-base' : 'bg-white/10 text-gray-300'
          }`}
        >
          Todos
        </button>
        {ACTION_OPTIONS.slice(0, 4).map(opt => (
          <button
            key={opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
              filterAction === opt.value ? 'bg-nexus-accent text-nexus-base' : 'bg-white/10 text-gray-300'
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* Pending List */}
      {automations.length === 0 ? (
        <div className="bg-nexus-surface rounded-xl p-12 text-center border border-white/5">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">¡Todo al día! 🎉</h3>
          <p className="text-gray-400">No hay acciones de seguimiento pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => {
            const isExpanded = expandedId === `${automation.lead.id}-${automation.rule.id}`;
            const actionOption = ACTION_OPTIONS.find(a => a.value === automation.rule.action);

            return (
              <div
                key={`${automation.lead.id}-${automation.rule.id}`}
                className="bg-nexus-surface rounded-xl border border-white/5 overflow-hidden"
              >
                {/* Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : `${automation.lead.id}-${automation.rule.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/10 ${actionOption?.color || 'text-gray-400'}`}>
                      {actionOption?.icon}
                    </div>
                    <div>
                      <p className="font-medium text-white">{automation.lead.name}</p>
                      <p className="text-xs text-gray-400">
                        {automation.daysSinceContact} días sin contacto • {automation.rule.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      automation.daysSinceContact >= 5 ? 'bg-red-500/20 text-red-400' :
                      automation.daysSinceContact >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {automation.daysSinceContact}d
                    </span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                    {/* Lead Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Teléfono</p>
                        <p className="text-white">{automation.lead.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className="text-white">{automation.lead.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Presupuesto</p>
                        <p className="text-white">${automation.lead.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Interés</p>
                        <p className="text-white">{automation.lead.interestArea}</p>
                      </div>
                    </div>

                    {/* Suggested Message */}
                    {automation.suggestedMessage && (
                      <div className="bg-nexus-base p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Mensaje sugerido:</p>
                        <p className="text-white text-sm italic">"{automation.suggestedMessage}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {automation.rule.action === 'send_whatsapp' && (
                        <button
                          onClick={() => onExecuteWhatsApp(automation)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                        >
                          <Send size={16} />
                          Enviar WhatsApp
                        </button>
                      )}
                      <button
                        onClick={() => onDismiss(automation.lead.id, automation.rule.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <X size={16} />
                        Descartar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Rules Config View
const RulesConfigView: React.FC<{
  rules: AutomationRule[];
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}> = ({ rules, onToggle, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Cargando reglas...</div>;
  }

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <div className="bg-nexus-surface rounded-xl p-12 text-center border border-white/5">
          <Settings className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sin reglas configuradas</h3>
          <p className="text-gray-400">Crea tu primera regla de automatización</p>
        </div>
      ) : (
        rules.map((rule) => {
          const triggerOption = TRIGGER_OPTIONS.find(t => t.value === rule.trigger);
          const actionOption = ACTION_OPTIONS.find(a => a.value === rule.action);

          return (
            <div
              key={rule.id}
              className={`bg-nexus-surface rounded-xl p-4 border transition-all ${
                rule.is_active ? 'border-nexus-accent/30' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{rule.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      rule.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {rule.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-400 mb-2">{rule.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-gray-300">
                      {triggerOption?.icon} {triggerOption?.label}: {rule.trigger_value} días
                    </span>
                    <span className={`flex items-center gap-1 bg-white/10 px-2 py-1 rounded ${actionOption?.color}`}>
                      {actionOption?.icon} {actionOption?.label}
                    </span>
                    {rule.apply_to_statuses && rule.apply_to_statuses.length > 0 && (
                      <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-gray-300">
                        📊 {rule.apply_to_statuses.length} status
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggle(rule.id, !rule.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.is_active ? 'text-green-400 hover:bg-green-500/20' : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {rule.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button
                    onClick={() => onEdit(rule)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(rule.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// Rule Form Component
const RuleForm: React.FC<{
  initialData: AutomationRule | null;
  onSave: (data: Partial<AutomationRule>) => void;
  onCancel: () => void;
}> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    trigger: initialData?.trigger || 'days_without_contact' as AutomationTrigger,
    trigger_value: initialData?.trigger_value || 3,
    trigger_status: initialData?.trigger_status || undefined,
    action: initialData?.action || 'send_whatsapp' as AutomationAction,
    message_template: initialData?.action_config.message_template || 
      'Hola {lead_name}, ¿sigues interesado en las propiedades que vimos? Estoy aquí para ayudarte. 🏠',
    is_active: initialData?.is_active ?? true,
    apply_to_statuses: initialData?.apply_to_statuses || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      trigger_value: formData.trigger_value,
      trigger_status: formData.trigger_status,
      action: formData.action,
      action_config: {
        message_template: formData.message_template,
      },
      is_active: formData.is_active,
      apply_to_statuses: formData.apply_to_statuses.length > 0 ? formData.apply_to_statuses : undefined,
    });
  };

  const toggleStatus = (status: string) => {
    setFormData(prev => ({
      ...prev,
      apply_to_statuses: prev.apply_to_statuses.includes(status as any)
        ? prev.apply_to_statuses.filter(s => s !== status)
        : [...prev.apply_to_statuses, status as any]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Nombre de la Regla *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
          placeholder="Ej: Seguimiento 3 días"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Descripción</label>
        <input
          type="text"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
          placeholder="Descripción opcional"
        />
      </div>

      {/* Trigger */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Disparador</label>
          <select
            value={formData.trigger}
            onChange={e => setFormData({ ...formData, trigger: e.target.value as AutomationTrigger })}
            className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
          >
            {TRIGGER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Días</label>
          <input
            type="number"
            min={1}
            max={30}
            value={formData.trigger_value}
            onChange={e => setFormData({ ...formData, trigger_value: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Action */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Acción</label>
        <select
          value={formData.action}
          onChange={e => setFormData({ ...formData, action: e.target.value as AutomationAction })}
          className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none"
        >
          {ACTION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Message Template */}
      {(formData.action === 'send_whatsapp' || formData.action === 'send_email' || formData.action === 'show_alert') && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Plantilla de Mensaje</label>
          <textarea
            value={formData.message_template}
            onChange={e => setFormData({ ...formData, message_template: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-nexus-base border border-white/10 rounded-lg text-white focus:border-nexus-accent focus:outline-none resize-none"
            placeholder="Usa {lead_name}, {days}, {phone}, etc."
          />
          <p className="text-xs text-gray-500 mt-1">
            Variables: {'{lead_name}'}, {'{days}'}, {'{phone}'}, {'{email}'}, {'{status}'}, {'{budget}'}, {'{interest}'}
          </p>
        </div>
      )}

      {/* Apply to Statuses */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Aplicar a Status (vacío = todos)</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(status => (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                formData.apply_to_statuses.includes(status as any)
                  ? 'bg-nexus-accent text-nexus-base'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
          className={`p-1 rounded ${formData.is_active ? 'text-green-400' : 'text-gray-400'}`}
        >
          {formData.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
        <span className="text-sm text-gray-300">
          {formData.is_active ? 'Regla activa' : 'Regla inactiva'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          type="submit"
          className="flex-1 py-2 bg-nexus-accent text-nexus-base font-bold rounded-lg hover:bg-orange-400 transition-colors"
        >
          {initialData ? 'Guardar Cambios' : 'Crear Regla'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default AutomationsView;
