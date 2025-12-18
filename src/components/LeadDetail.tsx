import React, { useState, useRef } from 'react';
import type { Lead, Currency } from '../types';
import { LeadStatus } from '../types';
import { Phone, MessageSquare, Mail, Calendar, Clock, ChevronRight, ClipboardCheck, TrendingUp, Edit3, Check, X, Save } from 'lucide-react';
import { getScoreColor, getScoreEmoji, type LeadScore } from '../services/leadScoring';
import LeadQualification from './LeadQualification';
import LeadFollowUpTracker from './LeadFollowUpTracker';
import MoveToTrackingModal from './MoveToTrackingModal';
import type { LeadFollowUp } from '../types/activities';
import { useActivityLogger } from '../hooks/useActivityLogger';

// Format phone number as xxx-xxx-xxxx
const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

// Format money with commas: 1,234,567
const formatMoney = (value: number): string => {
  return value.toLocaleString('en-US');
};

interface LeadDetailProps {
  lead: Lead;
  onClose: () => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUpdateScore?: (leadId: string, score: LeadScore) => void;
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void;
  followUps?: LeadFollowUp[];
  onAddFollowUp?: (followUp: Omit<LeadFollowUp, 'id'>) => void;
  onUpdateFollowUpNotes?: (followUpId: string, notes: string) => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, onClose, onUpdateStatus, onUpdateScore, onUpdateLead, followUps = [], onAddFollowUp, onUpdateFollowUpNotes }) => {
  const { logActivity } = useActivityLogger();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showQualification, setShowQualification] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const budgetInputRef = useRef<HTMLInputElement>(null);
  
  // Editable fields state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    phone: formatPhoneNumber(lead.phone),
    email: lead.email,
    budget: lead.budget,
    budgetDisplay: formatMoney(lead.budget), // For display with commas
    currency: lead.currency || 'USD' as Currency,
    interestArea: lead.interestArea,
    notes: lead.notes,
    nextFollowUp: new Date(lead.nextFollowUpDate).toISOString().slice(0, 16)
  });

  // Handle budget input with formatting
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      const numValue = parseInt(rawValue, 10) || 0;
      setEditValues(prev => ({
        ...prev,
        budget: numValue,
        budgetDisplay: rawValue === '' ? '' : formatMoney(numValue)
      }));
    }
  };

  // Handle phone input with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setEditValues(prev => ({ ...prev, phone: formatted }));
  };

  // Select all text when focusing on budget if value is 0
  const handleBudgetFocus = () => {
    if (editValues.budget === 0 && budgetInputRef.current) {
      budgetInputRef.current.select();
    }
  };

  const handleSaveField = async (field: string) => {
    if (onUpdateLead) {
      try {
        const updates: Partial<Lead> = {};
        switch (field) {
          case 'phone':
            // Remove formatting for storage
            updates.phone = editValues.phone.replace(/-/g, '');
            break;
          case 'email':
            updates.email = editValues.email;
            break;
          case 'budget':
            updates.budget = editValues.budget;
            // Note: currency update temporarily disabled until DB column exists
            // updates.currency = editValues.currency;
            break;
          case 'interestArea':
            updates.interestArea = editValues.interestArea;
            break;
          case 'notes':
            updates.notes = editValues.notes;
            break;
        }
        console.log('Saving field:', field, 'with updates:', updates);
        await onUpdateLead(lead.id, updates);
        console.log('Field saved successfully');
        setEditingField(null);
      } catch (error) {
        console.error('Error saving field:', error);
        alert('Error al guardar. Por favor intenta de nuevo.');
      }
    } else {
      console.warn('onUpdateLead is not defined');
      setEditingField(null);
    }
  };

  const handleCancelEdit = (field: string) => {
    if (field === 'budget') {
      setEditValues(prev => ({
        ...prev,
        budget: lead.budget,
        budgetDisplay: formatMoney(lead.budget),
        currency: lead.currency || 'USD'
      }));
    } else {
      setEditValues(prev => ({
        ...prev,
        [field]: field === 'phone' ? formatPhoneNumber(lead.phone) : 
                 field === 'email' ? lead.email :
                 field === 'interestArea' ? lead.interestArea :
                 lead.notes
      }));
    }
    setEditingField(null);
  };

  // Get currency symbol
  const getCurrencySymbol = (currency?: Currency) => {
    return currency === 'RD$' ? 'RD$' : 'US$';
  };

  const handleCall = () => {
    window.open(`tel:${lead.phone}`, '_self');
    // Log activity
    logActivity({
      actionType: 'call_made',
      entityType: 'lead',
      entityId: lead.id,
      metadata: { lead_name: lead.name, phone: lead.phone }
    });
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola ${lead.name}, te contacto de ALVEARE Inmobiliaria.`);
    window.open(`https://wa.me/${lead.phone.replace(/\s/g, '')}?text=${message}`, '_blank');
    // Log activity
    logActivity({
      actionType: 'whatsapp_sent',
      entityType: 'lead',
      entityId: lead.id,
      metadata: { lead_name: lead.name, phone: lead.phone }
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Información inmobiliaria - ALVEARE');
    const body = encodeURIComponent(`Hola ${lead.name},\n\nGracias por tu interés...`);
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
    // Log activity
    logActivity({
      actionType: 'call_made',
      entityType: 'lead',
      entityId: lead.id,
      metadata: { lead_name: lead.name, email: lead.email, type: 'email_sent' }
    });
  };

  const handleQualificationComplete = (score: LeadScore) => {
    if (onUpdateScore) {
      onUpdateScore(lead.id, score);
    }
    setShowQualification(false);
  };

  const statusOptions = Object.values(LeadStatus);

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW: return 'bg-blue-500';
      case LeadStatus.CONTACTED: return 'bg-yellow-500';
      case LeadStatus.VISIT_SCHEDULED: return 'bg-purple-500';
      case LeadStatus.NEGOTIATION: return 'bg-orange-500';
      case LeadStatus.CLOSED_WON: return 'bg-green-500';
      case LeadStatus.CLOSED_LOST: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const leadFollowUpCount = followUps.filter(f => f.leadId === lead.id).length;

  // Vista de calificación
  if (showQualification) {
    return (
      <LeadQualification
        leadName={lead.name}
        onComplete={handleQualificationComplete}
        onCancel={() => setShowQualification(false)}
      />
    );
  }

  // Vista de seguimientos
  if (showFollowUps && onAddFollowUp) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowFollowUps(false)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Volver al detalle
        </button>
        <LeadFollowUpTracker
          lead={lead}
          followUps={followUps}
          onAddFollowUp={onAddFollowUp}
          onUpdateFollowUpNotes={onUpdateFollowUpNotes}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center pb-4 border-b border-white/10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-nexus-accent to-purple-500 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
          {lead.name.charAt(0)}
        </div>
        <h3 className="text-xl font-bold text-white">{lead.name}</h3>
        <p className="text-gray-400 text-sm">{lead.source}</p>
        
        {/* Score Badge */}
        {lead.score && (
          <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full border ${getScoreColor(lead.score.category)}`}>
            <span>{getScoreEmoji(lead.score.category)}</span>
            <span className="font-bold">{lead.score.category}</span>
            <span className="text-sm opacity-75">({lead.score.percentage}%)</span>
          </div>
        )}
        
        {/* Follow-up Badge */}
        <div className="inline-flex items-center gap-2 mt-2 ml-2 px-3 py-1.5 rounded-full border bg-purple-500/20 text-purple-400 border-purple-500/30">
          <TrendingUp size={14} />
          <span className="font-bold">S{leadFollowUpCount}</span>
          <span className="text-sm opacity-75">/ 12</span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Qualify Button */}
        {!lead.score ? (
          <button
            onClick={() => setShowQualification(true)}
            className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-nexus-accent to-orange-400 text-nexus-base font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            <ClipboardCheck size={18} />
            Calificar
          </button>
        ) : (
          <button
            onClick={() => setShowQualification(true)}
            className="flex items-center justify-center gap-2 p-3 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            <ClipboardCheck size={16} />
            Recalificar
          </button>
        )}
        
        {/* Follow-ups Button */}
        <button
          onClick={() => setShowFollowUps(true)}
          className="flex items-center justify-center gap-2 p-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition-colors"
        >
          <TrendingUp size={18} />
          Seguimientos
        </button>
      </div>

      {/* Status */}
      <div className="relative">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={`w-full flex items-center justify-between p-3 rounded-lg ${getStatusColor(lead.status)} text-white font-bold`}
        >
          <span>Estado: {lead.status}</span>
          <ChevronRight size={18} className={`transition-transform ${showStatusMenu ? 'rotate-90' : ''}`} />
        </button>
        
        {showStatusMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-nexus-base border border-white/10 rounded-lg overflow-hidden z-10">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  onUpdateStatus(lead.id, status);
                  setShowStatusMenu(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors ${
                  lead.status === status ? 'text-nexus-accent' : 'text-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
            {/* Separator */}
            <div className="border-t border-white/10 my-1"></div>
            {/* Move to Tracking option */}
            <button
              onClick={() => {
                setShowStatusMenu(false);
                setShowTrackingModal(true);
              }}
              className="w-full text-left px-4 py-2 hover:bg-amber-500/10 transition-colors text-amber-400 flex items-center gap-2"
            >
              <Clock size={14} />
              🕐 Mover a Seguimiento
            </button>
          </div>
        )}
      </div>

      {/* Contact Info - Editable */}
      <div className="space-y-2">
        {/* Phone */}
        <div className="flex items-center gap-3 p-3 bg-nexus-base rounded-lg group">
          <Phone size={16} className="text-gray-400 flex-shrink-0" />
          {editingField === 'phone' ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="tel"
                value={editValues.phone}
                onChange={handlePhoneChange}
                placeholder="809-555-1234"
                className="flex-1 bg-transparent border-b border-nexus-accent text-white focus:outline-none"
                autoFocus
              />
              <button type="button" onClick={() => handleSaveField('phone')} className="text-green-400 hover:text-green-300 p-1 hover:bg-green-400/20 rounded">
                <Check size={16} />
              </button>
              <button type="button" onClick={() => handleCancelEdit('phone')} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/20 rounded">
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <span className="text-white flex-1">{formatPhoneNumber(lead.phone)}</span>
              {onUpdateLead && (
                <button 
                  onClick={() => {
                    setEditValues(prev => ({ ...prev, phone: formatPhoneNumber(lead.phone) }));
                    setEditingField('phone');
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-nexus-accent transition-all"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Email */}
        <div className="flex items-center gap-3 p-3 bg-nexus-base rounded-lg group">
          <Mail size={16} className="text-gray-400 flex-shrink-0" />
          {editingField === 'email' ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="email"
                value={editValues.email}
                onChange={(e) => setEditValues(prev => ({ ...prev, email: e.target.value }))}
                className="flex-1 bg-transparent border-b border-nexus-accent text-white focus:outline-none"
                autoFocus
              />
              <button type="button" onClick={() => handleSaveField('email')} className="text-green-400 hover:text-green-300 p-1 hover:bg-green-400/20 rounded">
                <Check size={16} />
              </button>
              <button type="button" onClick={() => handleCancelEdit('email')} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/20 rounded">
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <span className="text-white flex-1">{lead.email}</span>
              {onUpdateLead && (
                <button 
                  onClick={() => {
                    setEditValues(prev => ({ ...prev, email: lead.email }));
                    setEditingField('email');
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-nexus-accent transition-all"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details - Editable */}
      <div className="grid grid-cols-2 gap-3">
        {/* Budget */}
        <div className="bg-nexus-base p-3 rounded-lg group overflow-hidden">
          <p className="text-xs text-gray-500 flex items-center justify-between mb-1">
            Presupuesto
            {onUpdateLead && editingField !== 'budget' && (
              <button 
                onClick={() => {
                  setEditValues(prev => ({
                    ...prev,
                    budget: lead.budget,
                    budgetDisplay: lead.budget === 0 ? '' : formatMoney(lead.budget),
                    currency: lead.currency || 'USD'
                  }));
                  setEditingField('budget');
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-nexus-accent transition-all"
              >
                <Edit3 size={12} />
              </button>
            )}
          </p>
          {editingField === 'budget' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={editValues.currency}
                  onChange={(e) => setEditValues(prev => ({ ...prev, currency: e.target.value as Currency }))}
                  className="bg-nexus-surface border border-nexus-accent rounded px-2 py-1 text-nexus-accent font-bold text-sm focus:outline-none flex-shrink-0"
                >
                  <option value="USD">US$</option>
                  <option value="RD$">RD$</option>
                </select>
                <input
                  ref={budgetInputRef}
                  type="text"
                  inputMode="numeric"
                  value={editValues.budgetDisplay}
                  onChange={handleBudgetChange}
                  onFocus={handleBudgetFocus}
                  placeholder="0"
                  className="w-20 min-w-0 bg-transparent border-b border-nexus-accent text-white focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-1">
                <button 
                  type="button"
                  onClick={() => handleSaveField('budget')} 
                  className="text-green-400 hover:text-green-300 p-1 hover:bg-green-400/20 rounded"
                >
                  <Check size={14} />
                </button>
                <button 
                  type="button"
                  onClick={() => handleCancelEdit('budget')} 
                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/20 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-lg font-bold text-nexus-accent truncate">{getCurrencySymbol(lead.currency)} {formatMoney(lead.budget)}</p>
          )}
        </div>
        
        {/* Interest Area */}
        <div className="bg-nexus-base p-3 rounded-lg group overflow-hidden">
          <p className="text-xs text-gray-500 flex items-center justify-between mb-1">
            Zona de interés
            {onUpdateLead && editingField !== 'interestArea' && (
              <button 
                onClick={() => {
                  setEditValues(prev => ({ ...prev, interestArea: lead.interestArea }));
                  setEditingField('interestArea');
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-nexus-accent transition-all"
              >
                <Edit3 size={12} />
              </button>
            )}
          </p>
          {editingField === 'interestArea' ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editValues.interestArea}
                onChange={(e) => setEditValues(prev => ({ ...prev, interestArea: e.target.value }))}
                className="w-full bg-transparent border-b border-nexus-accent text-white focus:outline-none"
                autoFocus
              />
              <div className="flex gap-1">
                <button type="button" onClick={() => handleSaveField('interestArea')} className="text-green-400 hover:text-green-300 p-1 hover:bg-green-400/20 rounded">
                  <Check size={14} />
                </button>
                <button type="button" onClick={() => handleCancelEdit('interestArea')} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/20 rounded">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-white font-medium truncate">{lead.interestArea || 'No especificada'}</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar size={14} />
          <span>Creado: {new Date(lead.createdAt).toLocaleDateString()}</span>
        </div>
        
        {/* Próximo seguimiento - Editable */}
        <div className="flex items-center gap-2 text-sm text-gray-400 group">
          <Clock size={14} />
          {editingField === 'nextFollowUp' ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="datetime-local"
                value={editValues.nextFollowUp || new Date(lead.nextFollowUpDate).toISOString().slice(0, 16)}
                onChange={(e) => setEditValues(prev => ({ ...prev, nextFollowUp: e.target.value }))}
                className="bg-nexus-base border border-nexus-accent rounded px-2 py-1 text-white text-xs focus:outline-none"
              />
              <button
                onClick={() => {
                  if (onUpdateLead && editValues.nextFollowUp) {
                    onUpdateLead(lead.id, { nextFollowUpDate: new Date(editValues.nextFollowUp).toISOString() });
                  }
                  setEditingField(null);
                }}
                className="text-green-400 hover:text-green-300"
              >
                <Save size={14} />
              </button>
              <button onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <span>Próximo seguimiento: {new Date(lead.nextFollowUpDate).toLocaleString()}</span>
              {onUpdateLead && (
                <button 
                  onClick={() => {
                    setEditValues(prev => ({ ...prev, nextFollowUp: new Date(lead.nextFollowUpDate).toISOString().slice(0, 16) }));
                    setEditingField('nextFollowUp');
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-nexus-accent transition-all"
                >
                  <Edit3 size={12} />
                </button>
              )}
            </>
          )}
        </div>
        
        {lead.score?.qualifiedAt && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ClipboardCheck size={14} />
            <span>Calificado: {new Date(lead.score.qualifiedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Notes - Editable */}
      <div className="bg-nexus-base p-3 rounded-lg">
        <p className="text-xs text-gray-500 mb-2 flex items-center justify-between">
          Notas
          {onUpdateLead && editingField !== 'notes' && (
            <button 
              onClick={() => {
                setEditValues(prev => ({ ...prev, notes: lead.notes }));
                setEditingField('notes');
              }}
              className="text-gray-400 hover:text-nexus-accent transition-all"
            >
              <Edit3 size={12} />
            </button>
          )}
        </p>
        
        {editingField === 'notes' ? (
          <div className="space-y-2">
            <textarea
              value={editValues.notes}
              onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-transparent border border-nexus-accent rounded p-2 text-white focus:outline-none resize-none"
              rows={3}
              autoFocus
              placeholder="Agregar nota..."
            />
            <div className="flex gap-2 justify-end">
              <button 
                type="button"
                onClick={() => handleSaveField('notes')} 
                className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30"
              >
                Guardar
              </button>
              <button 
                type="button"
                onClick={() => handleCancelEdit('notes')} 
                className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {/* Nota principal del lead */}
            {lead.notes && (
              <div className="text-gray-300 text-sm italic border-l-2 border-nexus-accent pl-2">
                "{lead.notes}"
              </div>
            )}
            
            {/* Historial de notas de seguimientos */}
            {followUps
              .filter(f => f.leadId === lead.id && f.notes)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((followUp) => (
                <div key={followUp.id} className="text-xs text-gray-400 border-l-2 border-gray-600 pl-2">
                  <span className="text-gray-500">
                    S{followUp.followUpNumber} - {new Date(followUp.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}:
                  </span>
                  <span className="ml-1 text-gray-300">{followUp.notes}</span>
                </div>
              ))
            }
            
            {!lead.notes && followUps.filter(f => f.leadId === lead.id && f.notes).length === 0 && (
              <p className="text-gray-500 text-sm italic">Sin notas</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <button
          onClick={handleCall}
          className="flex flex-col items-center gap-1 p-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
        >
          <Phone size={20} />
          <span className="text-xs">Llamar</span>
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex flex-col items-center gap-1 p-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] transition-colors"
        >
          <MessageSquare size={20} />
          <span className="text-xs">WhatsApp</span>
        </button>
        <button
          onClick={handleEmail}
          className="flex flex-col items-center gap-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          <Mail size={20} />
          <span className="text-xs">Email</span>
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
      >
        Cerrar
      </button>

      {/* Move to Tracking Modal */}
      <MoveToTrackingModal
        lead={lead}
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        onSuccess={() => {
          setShowTrackingModal(false);
          onClose(); // Close lead detail after moving to tracking
        }}
      />
    </div>
  );
};

export default LeadDetail;
