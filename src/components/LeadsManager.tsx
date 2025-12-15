import React, { useState, useMemo } from 'react';
import type { Lead } from '../types';
import { LeadStatus } from '../types';
import { Search, Plus, Smartphone, Mail, MessageSquare, TrendingUp } from 'lucide-react';
import Modal from './Modal';
import LeadForm from './LeadForm';
import LeadDetail from './LeadDetail';
import { getScoreColor, getScoreEmoji, type LeadScore } from '../services/leadScoring';
import type { LeadFollowUp } from '../types/activities';
import { notificationSound } from '../services/notificationSound';

interface LeadsManagerProps {
  leads: Lead[];
  addLead: (lead: Lead) => void;
  updateLeadStatus?: (leadId: string, newStatus: LeadStatus) => void;
  updateLeadScore?: (leadId: string, score: LeadScore) => void;
  followUps?: LeadFollowUp[];
  addFollowUp?: (followUp: Omit<LeadFollowUp, 'id'>) => void;
}

const LeadsManager: React.FC<LeadsManagerProps> = ({ leads, addLead, updateLeadStatus, updateLeadScore, followUps = [], addFollowUp }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // ---------------------------------------------------------------------------
  // WEBHOOK SIMULATION (Critical Requirement)
  // ---------------------------------------------------------------------------
  const simulateIncomingWebhook = () => {
    const newLead: Lead = {
      id: `l-${Date.now()}`,
      name: 'Simulated Lead API',
      email: 'api.lead@portal.com',
      phone: '+34 600 000 000',
      source: 'Webhook API',
      status: LeadStatus.NEW,
      budget: 0,
      interestArea: 'Unknown',
      createdAt: new Date().toISOString(),
      nextFollowUpDate: new Date().toISOString(),
      notes: 'Ingresado automáticamente via API v1 Endpoint'
    };
    addLead(newLead);
    
    // Play notification sound
    notificationSound.playUrgent();
    
    // Show notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚡ NEXUS CRM', {
        body: 'Nuevo lead recibido via Webhook API',
        icon: '/icons/icon.svg'
      });
    } else {
      alert('⚡ WEBHOOK RECIBIDO: Lead inyectado automáticamente en la base de datos.');
    }
  };

  // Filtered leads with search
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesStatus = filterStatus === 'ALL' || lead.status === filterStatus;
      const matchesSearch = searchQuery === '' || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [leads, filterStatus, searchQuery]);

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

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Gestión de Leads</h2>
        <div className="flex gap-2">
            <button 
                onClick={simulateIncomingWebhook}
                className="flex items-center gap-2 bg-nexus-surface border border-nexus-accent text-nexus-accent px-4 py-2 rounded hover:bg-nexus-accent hover:text-nexus-base transition-colors text-sm"
            >
                <Plus size={16} />
                Simular Webhook API
            </button>
            <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 bg-nexus-accent text-nexus-base px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity text-sm"
            >
                <Plus size={16} />
                Manual
            </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-nexus-surface p-4 rounded-lg flex flex-col md:flex-row gap-4 border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, teléfono o email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-nexus-base border border-white/10 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-nexus-accent text-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['ALL', ...Object.values(LeadStatus)].map((status) => (
             <button
               key={status}
               onClick={() => setFilterStatus(status)}
               className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap border transition-all ${
                 filterStatus === status 
                   ? 'bg-nexus-accent text-nexus-base border-nexus-accent' 
                   : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
               }`}
             >
               {status === 'ALL' ? 'TODOS' : status.replace('_', ' ')}
             </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Mostrando {filteredLeads.length} de {leads.length} leads
      </p>

      {/* Leads List */}
      <div className="grid gap-4">
        {filteredLeads.map((lead) => {
          const leadFollowUpCount = followUps.filter(f => f.leadId === lead.id).length;
          
          return (
          <div 
            key={lead.id} 
            className="bg-nexus-surface rounded-lg p-5 border border-white/5 hover:border-nexus-accent/50 transition-all group relative overflow-hidden cursor-pointer"
            onClick={() => setSelectedLead(lead)}
          >
             {lead.status === LeadStatus.NEW && (
                 <div className="absolute top-0 left-0 w-1 h-full bg-nexus-accent"></div>
             )}
             
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
                      {/* Follow-up Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1">
                        <TrendingUp size={10} />
                        S{leadFollowUpCount}/12
                      </span>
                   </div>
                   <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                      <span className="flex items-center gap-1"><Smartphone size={14}/> {lead.phone}</span>
                      <span className="flex items-center gap-1"><Mail size={14}/> {lead.email}</span>
                   </div>
                   <p className="text-sm text-gray-300 italic border-l-2 border-white/10 pl-3 py-1">
                     "{lead.notes}"
                   </p>
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
              onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }}
              className="text-nexus-accent hover:underline mt-2"
            >
              Limpiar filtros
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
            followUps={followUps}
            onAddFollowUp={addFollowUp}
          />
        )}
      </Modal>
    </div>
  );
};

export default LeadsManager;