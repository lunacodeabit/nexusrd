import React, { useState } from 'react';
import { 
  Phone, MessageSquare, Mail, MapPin, MoreHorizontal,
  Plus, CheckCircle2, Clock, AlertCircle,
  TrendingUp
} from 'lucide-react';
import type { Lead } from '../types';
import type { LeadFollowUp } from '../types/activities';
import { notificationSound } from '../services/notificationSound';

interface LeadFollowUpTrackerProps {
  lead: Lead;
  followUps: LeadFollowUp[];
  onAddFollowUp: (followUp: Omit<LeadFollowUp, 'id'>) => void;
}

const LeadFollowUpTracker: React.FC<LeadFollowUpTrackerProps> = ({ 
  lead, 
  followUps,
  onAddFollowUp 
}) => {
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    method: 'WHATSAPP' as LeadFollowUp['method'],
    notes: '',
    response: 'PENDIENTE' as LeadFollowUp['response']
  });

  // Get follow-ups for this lead
  const leadFollowUps = followUps
    .filter(f => f.leadId === lead.id)
    .sort((a, b) => a.followUpNumber - b.followUpNumber);

  const currentFollowUpNumber = leadFollowUps.length;
  const nextFollowUpNumber = currentFollowUpNumber + 1;

  const handleSubmitFollowUp = () => {
    // Play sound on follow-up registered
    notificationSound.playNotification();
    
    onAddFollowUp({
      leadId: lead.id,
      followUpNumber: nextFollowUpNumber,
      date: new Date().toISOString(),
      method: newFollowUp.method,
      notes: newFollowUp.notes,
      response: newFollowUp.response
    });
    setNewFollowUp({ method: 'WHATSAPP', notes: '', response: 'PENDIENTE' });
    setIsAddingFollowUp(false);
  };

  const getMethodIcon = (method: LeadFollowUp['method']) => {
    switch (method) {
      case 'LLAMADA': return <Phone size={14} />;
      case 'WHATSAPP': return <MessageSquare size={14} />;
      case 'EMAIL': return <Mail size={14} />;
      case 'VISITA': return <MapPin size={14} />;
      default: return <MoreHorizontal size={14} />;
    }
  };

  const getMethodColor = (method: LeadFollowUp['method']) => {
    switch (method) {
      case 'LLAMADA': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WHATSAPP': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'EMAIL': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'VISITA': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getResponseIcon = (response?: LeadFollowUp['response']) => {
    switch (response) {
      case 'POSITIVA': return <CheckCircle2 size={14} className="text-green-400" />;
      case 'NEGATIVA': return <AlertCircle size={14} className="text-red-400" />;
      case 'SIN_RESPUESTA': return <Clock size={14} className="text-yellow-400" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getResponseLabel = (response?: LeadFollowUp['response']) => {
    switch (response) {
      case 'POSITIVA': return 'Positiva';
      case 'NEGATIVA': return 'Negativa';
      case 'SIN_RESPUESTA': return 'Sin Respuesta';
      default: return 'Pendiente';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-nexus-accent" />
          <span className="font-bold text-white">Seguimientos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Actual:</span>
          <span className="px-2 py-1 bg-nexus-accent/20 text-nexus-accent rounded font-bold text-sm">
            S{currentFollowUpNumber}
          </span>
          <span className="text-gray-500">/ S12</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                num <= currentFollowUpNumber
                  ? 'bg-nexus-accent text-nexus-base'
                  : num === nextFollowUpNumber
                  ? 'bg-nexus-accent/30 text-nexus-accent border-2 border-nexus-accent border-dashed'
                  : 'bg-gray-700 text-gray-500'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <div className="h-1 bg-gray-700 rounded-full">
          <div 
            className="h-full bg-nexus-accent rounded-full transition-all duration-500"
            style={{ width: `${(currentFollowUpNumber / 12) * 100}%` }}
          />
        </div>
      </div>

      {/* Follow-up History */}
      {leadFollowUps.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {leadFollowUps.map((followUp) => (
            <div 
              key={followUp.id}
              className="flex items-start gap-3 p-3 bg-nexus-base rounded-lg border border-white/5"
            >
              <div className={`p-1.5 rounded ${getMethodColor(followUp.method)}`}>
                {getMethodIcon(followUp.method)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">S{followUp.followUpNumber}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(followUp.date).toLocaleDateString('es-ES')}
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    {getResponseIcon(followUp.response)}
                    <span className="text-xs text-gray-400">{getResponseLabel(followUp.response)}</span>
                  </div>
                </div>
                {followUp.notes && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{followUp.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Follow-up Form */}
      {isAddingFollowUp ? (
        <div className="bg-nexus-base rounded-lg p-4 border border-nexus-accent/30 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-nexus-accent" />
            <span className="font-bold text-white">Registrar S{nextFollowUpNumber}</span>
          </div>

          {/* Method Selection */}
          <div>
            <label className="text-xs text-gray-500 block mb-2">Método de contacto</label>
            <div className="grid grid-cols-5 gap-2">
              {(['LLAMADA', 'WHATSAPP', 'EMAIL', 'VISITA', 'OTRO'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setNewFollowUp(prev => ({ ...prev, method }))}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    newFollowUp.method === method
                      ? getMethodColor(method)
                      : 'bg-nexus-surface border border-white/10 text-gray-400'
                  }`}
                >
                  {getMethodIcon(method)}
                  <span className="text-[10px]">{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Response */}
          <div>
            <label className="text-xs text-gray-500 block mb-2">Respuesta</label>
            <div className="grid grid-cols-4 gap-2">
              {(['POSITIVA', 'NEGATIVA', 'SIN_RESPUESTA', 'PENDIENTE'] as const).map((response) => (
                <button
                  key={response}
                  onClick={() => setNewFollowUp(prev => ({ ...prev, response }))}
                  className={`p-2 rounded-lg flex items-center justify-center gap-1 text-xs transition-all ${
                    newFollowUp.response === response
                      ? response === 'POSITIVA' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : response === 'NEGATIVA' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : response === 'SIN_RESPUESTA' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      : 'bg-nexus-surface border border-white/10 text-gray-400'
                  }`}
                >
                  {getResponseIcon(response)}
                  <span className="hidden md:inline">{getResponseLabel(response)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 block mb-2">Notas (opcional)</label>
            <textarea
              value={newFollowUp.notes}
              onChange={(e) => setNewFollowUp(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="¿Qué se habló? ¿Próximos pasos?"
              className="w-full bg-nexus-surface border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-nexus-accent resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmitFollowUp}
              className="flex-1 bg-nexus-accent text-nexus-base py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              Guardar S{nextFollowUpNumber}
            </button>
            <button
              onClick={() => setIsAddingFollowUp(false)}
              className="px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingFollowUp(true)}
          disabled={currentFollowUpNumber >= 12}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-bold transition-all ${
            currentFollowUpNumber >= 12
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-nexus-accent to-orange-400 text-nexus-base hover:opacity-90'
          }`}
        >
          <Plus size={18} />
          {currentFollowUpNumber >= 12 
            ? 'Máximo de seguimientos alcanzado' 
            : `Registrar Seguimiento S${nextFollowUpNumber}`
          }
        </button>
      )}

      {/* Stats */}
      {leadFollowUps.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <div className="text-center">
            <p className="text-lg font-bold text-green-400">
              {leadFollowUps.filter(f => f.response === 'POSITIVA').length}
            </p>
            <p className="text-xs text-gray-500">Positivas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-400">
              {leadFollowUps.filter(f => f.response === 'SIN_RESPUESTA').length}
            </p>
            <p className="text-xs text-gray-500">Sin Resp.</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-400">
              {leadFollowUps.filter(f => f.response === 'NEGATIVA').length}
            </p>
            <p className="text-xs text-gray-500">Negativas</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadFollowUpTracker;
