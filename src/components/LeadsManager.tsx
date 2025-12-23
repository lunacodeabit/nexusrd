import React, { useState, useMemo } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import { Search, Plus, Smartphone, MessageSquare, TrendingUp, LayoutGrid, List, Clock } from 'lucide-react';
import Modal from './Modal';
import LeadForm from './LeadForm';
import LeadDetail from './LeadDetail';
import MoveToTrackingModal from './MoveToTrackingModal';
import { getScoreColor, getScoreEmoji, type LeadScore } from '../services/leadScoring';
import type { LeadFollowUp } from '../types/activities';

// Configuración de columnas del Kanban
const KANBAN_COLUMNS = [
  { status: LeadStatus.NEW, label: 'Nuevos', color: 'blue', icon: '🆕' },
  { status: LeadStatus.CONTACTED, label: 'Contactados', color: 'yellow', icon: '📞' },
  { status: LeadStatus.VISIT_SCHEDULED, label: 'Visita Agendada', color: 'purple', icon: '📅' },
  { status: LeadStatus.NEGOTIATION, label: 'Negociación', color: 'orange', icon: '🤝' },
  { status: LeadStatus.CLOSED_WON, label: 'Cerrado ✓', color: 'green', icon: '🎉' },
  { status: LeadStatus.CLOSED_LOST, label: 'Perdido', color: 'red', icon: '❌' },
];

interface LeadsManagerProps {
  leads: Lead[];
  addLead: (lead: Lead) => void;
  updateLeadStatus?: (leadId: string, newStatus: LeadStatus) => void;
  updateLeadScore?: (leadId: string, score: LeadScore) => void;
  updateLead?: (leadId: string, updates: Partial<Lead>) => void;
  followUps?: LeadFollowUp[];
  addFollowUp?: (followUp: Omit<LeadFollowUp, 'id'>) => void;
  updateFollowUpNotes?: (followUpId: string, notes: string) => void;
}

const LeadsManager: React.FC<LeadsManagerProps> = ({ leads, addLead, updateLeadStatus, updateLeadScore, updateLead, followUps = [], addFollowUp, updateFollowUpNotes }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [trackingModalLead, setTrackingModalLead] = useState<Lead | null>(null);

  // Filtered leads with search AND status filter
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchQuery === '' ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // Group leads by status for Kanban view
  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    KANBAN_COLUMNS.forEach(col => {
      grouped[col.status] = filteredLeads.filter(lead => lead.status === col.status);
    });
    return grouped;
  }, [filteredLeads]);

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case LeadStatus.CONTACTED: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case LeadStatus.VISIT_SCHEDULED: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case LeadStatus.CLOSED_WON: return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hola ${name}, te contacto de NEXUS Inmobiliaria.`);
    window.open(`https://wa.me/${phone.replace(/\s/g, '')}?text=${message}`, '_blank');
  };

  const handleSaveLead = (lead: Lead) => {
    addLead(lead);
    setIsFormOpen(false);
  };

  const handleUpdateStatus = (leadId: string, newStatus: LeadStatus) => {
    if (updateLeadStatus) {
      updateLeadStatus(leadId, newStatus);
    }
    setSelectedLead(null);
  };

  const handleUpdateScore = (leadId: string, score: LeadScore) => {
    if (updateLeadScore) {
      updateLeadScore(leadId, score);
      // Update selected lead locally to reflect changes immediately
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({
          ...selectedLead,
          score: {
            total: score.total,
            percentage: score.percentage,
            category: score.category,
            qualifiedAt: new Date().toISOString()
          }
        });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // DRAG & DROP HANDLERS
  // ---------------------------------------------------------------------------
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to show the drag effect
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedLead(null);
    setDragOverColumn(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnStatus) {
      setDragOverColumn(columnStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== newStatus && updateLeadStatus) {
      updateLeadStatus(draggedLead.id, newStatus);
    }
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Gestión de Leads</h2>
        <div className="flex gap-2">
          {/* View Toggle - Only show on desktop */}
          <div className="hidden lg:flex bg-nexus-surface border border-white/10 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-nexus-accent text-nexus-base' : 'text-gray-400 hover:text-white'}`}
              title="Vista Kanban"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-nexus-accent text-nexus-base' : 'text-gray-400 hover:text-white'}`}
              title="Vista Lista"
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-nexus-accent text-nexus-base px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity text-sm"
          >
            <Plus size={16} />
            Crear
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-nexus-surface p-3 rounded-lg border border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-nexus-base border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-nexus-accent text-white"
          />
        </div>

        {/* Status Filter - Mobile Only */}
        <div className="lg:hidden mt-3 grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2 py-1.5 text-[11px] rounded-lg border transition-colors ${statusFilter === 'ALL'
              ? 'bg-nexus-accent text-nexus-base border-nexus-accent font-semibold'
              : 'bg-transparent text-gray-400 border-white/20 hover:border-white/40'
              }`}
          >
            Todos ({leads.length})
          </button>
          {KANBAN_COLUMNS.slice(0, 5).map(col => {
            const count = leads.filter(l => l.status === col.status).length;
            const shortLabels: Record<string, string> = {
              'Nuevos': 'Nuevos',
              'Contactados': 'Contact.',
              'Visita Agendada': 'Visita',
              'Negociación': 'Negoc.',
              'Cerrado ✓': 'Cerrado'
            };
            return (
              <button
                key={col.status}
                onClick={() => setStatusFilter(col.status)}
                className={`px-2 py-1.5 text-[11px] rounded-lg border transition-colors ${statusFilter === col.status
                  ? `bg-${col.color}-500/30 text-${col.color}-300 border-${col.color}-500/50 font-semibold`
                  : 'bg-transparent text-gray-400 border-white/20 hover:border-white/40'
                  }`}
              >
                {shortLabels[col.label] || col.label.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filteredLeads.length} leads en total
      </p>

      {/* Kanban Board View - Desktop Only */}
      {viewMode === 'kanban' && (
        <div className="hidden lg:grid grid-cols-6 gap-2">
          {KANBAN_COLUMNS.map((column) => {
            const columnLeads = leadsByStatus[column.status] || [];
            const columnBudget = columnLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
            const isDropTarget = dragOverColumn === column.status && draggedLead?.status !== column.status;

            return (
              <div
                key={column.status}
                className="flex flex-col min-w-0"
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {/* Column Header */}
                <div className={`bg-${column.color}-500/10 border border-${column.color}-500/30 rounded-t-lg p-2 transition-all ${isDropTarget ? 'ring-2 ring-nexus-accent' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold text-${column.color}-400 text-xs truncate`}>
                      {column.label}
                    </h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-${column.color}-500/20 text-${column.color}-400 flex-shrink-0`}>
                      {columnLeads.length}
                    </span>
                  </div>
                  {columnBudget > 0 && (
                    <p className="text-[10px] text-gray-500 truncate">
                      ${(columnBudget / 1000).toFixed(0)}K
                    </p>
                  )}
                </div>

                {/* Column Body */}
                <div className={`bg-nexus-surface/50 border-x border-b border-white/5 rounded-b-lg p-1.5 flex-1 min-h-[300px] max-h-[calc(100vh-280px)] overflow-y-auto space-y-1.5 transition-all ${isDropTarget ? 'bg-nexus-accent/10 border-nexus-accent/50' : ''}`}>
                  {columnLeads.map((lead) => {
                    const leadFollowUps = followUps.filter(f => f.leadId === lead.id);
                    const leadFollowUpCount = leadFollowUps.length;
                    const lastFollowUp = leadFollowUps[leadFollowUps.length - 1];
                    const lastResponse = lastFollowUp?.response;

                    // Get response indicator
                    const getResponseIndicator = () => {
                      if (!lastResponse || lastResponse === 'PENDIENTE') return { color: 'gray', char: '' };
                      if (lastResponse === 'POSITIVA') return { color: 'green', char: '✓' };
                      if (lastResponse === 'NEGATIVA') return { color: 'red', char: '✗' };
                      if (lastResponse === 'SIN_RESPUESTA') return { color: 'yellow', char: '?' };
                      return { color: 'gray', char: '' };
                    };
                    const responseIndicator = getResponseIndicator();

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedLead(lead)}
                        className={`bg-nexus-base rounded p-2 border border-white/5 hover:border-nexus-accent/50 cursor-grab active:cursor-grabbing transition-all group relative ${draggedLead?.id === lead.id ? 'opacity-50 scale-95' : ''}`}
                      >
                        {/* Response indicator bar */}
                        {lastResponse && lastResponse !== 'PENDIENTE' && (
                          <div className={`absolute top-0 left-0 w-0.5 h-full rounded-l bg-${responseIndicator.color}-500`}></div>
                        )}

                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-medium text-white text-xs truncate flex-1">
                            {lead.name}
                          </h4>
                          {lead.score && (
                            <span className="text-[9px] flex-shrink-0">
                              {getScoreEmoji(lead.score.category)}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-500 mb-1 truncate">{lead.source}</p>

                        {lead.budget > 0 && (
                          <p className="text-xs font-medium text-nexus-accent mb-1">
                            ${(lead.budget / 1000).toFixed(0)}K
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          {/* Follow-up indicator */}
                          <span className={`text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 ${responseIndicator.color === 'green' ? 'bg-green-500/20 text-green-400' :
                            responseIndicator.color === 'red' ? 'bg-red-500/20 text-red-400' :
                              responseIndicator.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-purple-500/20 text-purple-400'
                            }`}>
                            <TrendingUp size={8} />
                            {leadFollowUpCount}
                            {responseIndicator.char && <span>{responseIndicator.char}</span>}
                          </span>

                          {/* Quick actions */}
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setTrackingModalLead(lead)}
                              className="p-1 bg-amber-900/30 text-amber-400 rounded hover:bg-amber-500 hover:text-white transition-colors"
                              title="Mover a Seguimiento"
                            >
                              <Clock size={10} />
                            </button>
                            <button
                              onClick={() => handleCall(lead.phone)}
                              className="p-1 bg-green-900/30 text-green-400 rounded hover:bg-green-500 hover:text-white transition-colors"
                            >
                              <Smartphone size={10} />
                            </button>
                            <button
                              onClick={() => handleWhatsApp(lead.phone, lead.name)}
                              className="p-1 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors"
                            >
                              <MessageSquare size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnLeads.length === 0 && (
                    <div className="text-center py-6 text-gray-600 text-[10px]">
                      Vacío
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View - Always on mobile, optional on desktop */}
      <div className={`grid gap-4 ${viewMode === 'kanban' ? 'lg:hidden' : ''}`}>
        {filteredLeads.map((lead) => {
          const leadFollowUps = followUps.filter(f => f.leadId === lead.id);
          const leadFollowUpCount = leadFollowUps.length;
          const lastFollowUp = leadFollowUps[leadFollowUps.length - 1];
          const lastResponse = lastFollowUp?.response;
          const progressPercent = Math.min((leadFollowUpCount / 12) * 100, 100);

          // Determine card accent color based on last response
          const getResponseStyle = () => {
            if (!lastResponse || lastResponse === 'PENDIENTE')
              return { border: 'border-white/5', accent: 'bg-gray-500', glow: '' };
            if (lastResponse === 'POSITIVA')
              return { border: 'border-green-500/30', accent: 'bg-green-500', glow: 'shadow-green-500/10 shadow-lg' };
            if (lastResponse === 'NEGATIVA')
              return { border: 'border-red-500/30', accent: 'bg-red-500', glow: '' };
            if (lastResponse === 'SIN_RESPUESTA')
              return { border: 'border-yellow-500/30', accent: 'bg-yellow-500', glow: '' };
            return { border: 'border-white/5', accent: 'bg-gray-500', glow: '' };
          };

          const responseStyle = getResponseStyle();

          return (
            <div
              key={lead.id}
              className={`bg-nexus-surface rounded-lg p-5 border ${responseStyle.border} hover:border-nexus-accent/50 transition-all group relative overflow-hidden cursor-pointer ${responseStyle.glow}`}
              onClick={() => setSelectedLead(lead)}
            >
              {/* Left accent bar based on response */}
              <div className={`absolute top-0 left-0 w-1 h-full ${responseStyle.accent}`}></div>

              {/* Progress bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <div
                  className={`h-full transition-all duration-500 ${progressPercent >= 75 ? 'bg-green-500' :
                    progressPercent >= 50 ? 'bg-yellow-500' :
                      progressPercent >= 25 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-bold text-lg text-white">{lead.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                    {lead.score && (
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${getScoreColor(lead.score.category)}`}>
                        {getScoreEmoji(lead.score.category)} {lead.score.category} ({lead.score.percentage}%)
                      </span>
                    )}
                    {/* Partial qualification indicator - only show if no full score */}
                    {!lead.score && lead.qualificationProgress && lead.qualificationProgress > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        🟡 Calif. {lead.qualificationProgress}%
                      </span>
                    )}
                    {/* No qualification indicator */}
                    {!lead.score && !lead.qualificationProgress && (
                      <span className="text-[10px] px-2 py-0.5 rounded border bg-gray-500/20 text-gray-400 border-gray-500/30">
                        🔴 Sin calificar
                      </span>
                    )}
                    {/* Follow-up Badge with response indicator */}
                    <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${lastResponse === 'POSITIVA' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      lastResponse === 'NEGATIVA' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        lastResponse === 'SIN_RESPUESTA' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      }`}>
                      <TrendingUp size={10} />
                      S{leadFollowUpCount}/12
                      {lastResponse && (
                        <span className="ml-1">
                          {lastResponse === 'POSITIVA' && '✓'}
                          {lastResponse === 'NEGATIVA' && '✗'}
                          {lastResponse === 'SIN_RESPUESTA' && '?'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <span className="flex items-center gap-1"><Smartphone size={14} /> {lead.phone}</span>
                    <span className="text-gray-600">{lead.email}</span>
                  </div>
                  <p className="text-sm text-gray-300 italic border-l-2 border-white/10 pl-3 py-1">
                    "{lead.notes}"
                  </p>
                  {/* Last contact info */}
                  {lastFollowUp && (
                    <p className="text-[10px] text-gray-500 mt-2">
                      Último contacto: {lastFollowUp.method} - {new Date(lastFollowUp.date).toLocaleDateString('es-ES')}
                      {lastResponse && ` • Respuesta: ${lastResponse.replace('_', ' ')}`}
                    </p>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-2 justify-end items-center md:items-end min-w-[140px]">
                  <p className="text-xs text-gray-500 mb-1 hidden md:block">
                    Fuente: {lead.source}
                  </p>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCall(lead.phone)}
                      className="p-2 bg-green-900/30 text-green-400 rounded hover:bg-green-500 hover:text-white transition-colors"
                    >
                      <Smartphone size={18} />
                    </button>
                    <button
                      onClick={() => handleWhatsApp(lead.phone, lead.name)}
                      className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors"
                    >
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLeads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No se encontraron leads</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-nexus-accent hover:underline mt-2"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

      {/* Modal: New Lead Form */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nuevo Lead">
        <LeadForm onSave={handleSaveLead} onCancel={() => setIsFormOpen(false)} />
      </Modal>

      {/* Modal: Lead Detail */}
      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Detalle del Lead">
        {selectedLead && (
          <LeadDetail
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdateStatus={handleUpdateStatus}
            onUpdateScore={handleUpdateScore}
            onUpdateLead={updateLead}
            followUps={followUps}
            onAddFollowUp={addFollowUp}
            onUpdateFollowUpNotes={updateFollowUpNotes}
          />
        )}
      </Modal>

      {/* Modal: Move to Tracking */}
      {trackingModalLead && (
        <MoveToTrackingModal
          lead={trackingModalLead}
          isOpen={true}
          onClose={() => setTrackingModalLead(null)}
          onSuccess={() => {
            setTrackingModalLead(null);
            // Optionally refresh leads or show success message
          }}
        />
      )}
    </div>
  );
};

export default LeadsManager;