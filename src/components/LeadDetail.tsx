import React, { useState } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import { Phone, MessageSquare, Mail, Calendar, Clock, ChevronRight, ClipboardCheck, TrendingUp } from 'lucide-react';
import { getScoreColor, getScoreEmoji, type LeadScore } from '../services/leadScoring';
import LeadQualification from './LeadQualification';
import LeadFollowUpTracker from './LeadFollowUpTracker';
import type { LeadFollowUp } from '../types/activities';

interface LeadDetailProps {
  lead: Lead;
  onClose: () => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUpdateScore?: (leadId: string, score: LeadScore) => void;
  followUps?: LeadFollowUp[];
  onAddFollowUp?: (followUp: Omit<LeadFollowUp, 'id'>) => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, onClose, onUpdateStatus, onUpdateScore, followUps = [], onAddFollowUp }) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showQualification, setShowQualification] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);

  const handleCall = () => {
    window.open(`tel:${lead.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola ${lead.name}, te contacto de NEXUS Inmobiliaria.`);
    window.open(`https://wa.me/${lead.phone.replace(/\s/g, '')}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Información inmobiliaria - NEXUS');
    const body = encodeURIComponent(`Hola ${lead.name},\n\nGracias por tu interés...`);
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
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
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 bg-nexus-base rounded-lg">
          <Phone size={16} className="text-gray-400" />
          <span className="text-white">{lead.phone}</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-nexus-base rounded-lg">
          <Mail size={16} className="text-gray-400" />
          <span className="text-white">{lead.email}</span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-nexus-base p-3 rounded-lg">
          <p className="text-xs text-gray-500">Presupuesto</p>
          <p className="text-lg font-bold text-nexus-accent">€{lead.budget.toLocaleString()}</p>
        </div>
        <div className="bg-nexus-base p-3 rounded-lg">
          <p className="text-xs text-gray-500">Zona de interés</p>
          <p className="text-white font-medium">{lead.interestArea || 'No especificada'}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar size={14} />
          <span>Creado: {new Date(lead.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={14} />
          <span>Próximo seguimiento: {new Date(lead.nextFollowUpDate).toLocaleString()}</span>
        </div>
        {lead.score?.qualifiedAt && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ClipboardCheck size={14} />
            <span>Calificado: {new Date(lead.score.qualifiedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="bg-nexus-base p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Notas</p>
          <p className="text-gray-300 text-sm italic">"{lead.notes}"</p>
        </div>
      )}

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
    </div>
  );
};

export default LeadDetail;
