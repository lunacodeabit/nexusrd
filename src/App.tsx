import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadsManager from './components/LeadsManager';
import CaptacionesView from './components/CaptacionesView';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import ArchitectureInfo from './components/ArchitectureInfo';
import DailyActivities from './components/DailyActivities';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AutomationsView from './components/AutomationsView';
import { AuthScreen } from './components/Auth';
import { useAuth } from './contexts/AuthContext';
import { useLeads } from './hooks/useLeads';
import { useFollowUps } from './hooks/useFollowUps';
import { useActivities } from './hooks/useActivities';
import { useTaskAlerts } from './hooks/useTaskAlerts';
import { usePersonalTaskAlerts } from './hooks/usePersonalTaskAlerts';
import type { Lead } from './types';
import { LeadStatus } from './types';
import type { LeadScore } from './services/leadScoring';
import type { TaskCompletion, LeadFollowUp } from './types/activities';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Supabase hooks
  const { leads, addLead: addLeadToDb, updateLead } = useLeads();
  const { followUps, addFollowUp: addFollowUpToDb, updateFollowUpNotes } = useFollowUps();
  const { completions: taskCompletions, toggleTask } = useActivities();
  
  // Global task alerts - runs always when app is open
  useTaskAlerts();
  usePersonalTaskAlerts(); // Personal planner alerts

  // Show auth screen if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Add new lead (from Webhook or Form)
  const addLead = async (newLead: Lead) => {
    await addLeadToDb(newLead);
  };

  // Update lead status
  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    // Calcular próximo seguimiento basado en el nuevo estado
    const getNextFollowUpDate = () => {
      const now = new Date();
      switch (newStatus) {
        case LeadStatus.CONTACTED:
          // Próximo seguimiento en 24 horas
          return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        case LeadStatus.VISIT_SCHEDULED:
          // Próximo seguimiento en 3 días
          return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
        case LeadStatus.NEGOTIATION:
          // Próximo seguimiento en 2 días
          return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
        case LeadStatus.CLOSED_WON:
        case LeadStatus.CLOSED_LOST:
          // Sin seguimiento futuro para leads cerrados
          return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        default:
          return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      }
    };

    await updateLead(leadId, { 
      status: newStatus, 
      lastContactDate: new Date().toISOString(),
      nextFollowUpDate: getNextFollowUpDate()
    });
  };

  // Update lead score
  const updateLeadScore = async (leadId: string, score: LeadScore) => {
    await updateLead(leadId, {
      score: {
        total: score.total,
        percentage: score.percentage,
        category: score.category,
        qualifiedAt: new Date().toISOString()
      }
    });
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string, date: string, dayOfWeek: TaskCompletion['dayOfWeek']) => {
    await toggleTask(taskId, date, dayOfWeek);
  };

  // Add lead follow-up
  const addFollowUp = async (followUp: Omit<LeadFollowUp, 'id'>) => {
    await addFollowUpToDb(followUp);
    
    // IMPORTANTE: Actualizar lastContactDate del lead cuando se registra un seguimiento
    const lead = leads.find(l => l.id === followUp.leadId);
    if (lead) {
      const updates: Partial<Lead> = {
        lastContactDate: new Date().toISOString(),
      };
      
      // Si el lead era NUEVO, cambiarlo a CONTACTADO
      if (lead.status === LeadStatus.NEW) {
        updates.status = LeadStatus.CONTACTED;
        updates.nextFollowUpDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas
      }
      
      await updateLead(lead.id, updates);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          leads={leads} 
          onUpdateLeadStatus={updateLeadStatus}
          onUpdateLeadScore={updateLeadScore}
          onUpdateLead={updateLead}
          followUps={followUps}
          onAddFollowUp={addFollowUp}
          onUpdateFollowUpNotes={updateFollowUpNotes}
        />;
      case 'leads':
        return <LeadsManager 
          leads={leads} 
          addLead={addLead} 
          updateLeadStatus={updateLeadStatus} 
          updateLeadScore={updateLeadScore}
          updateLead={updateLead}
          followUps={followUps}
          addFollowUp={addFollowUp}
          updateFollowUpNotes={updateFollowUpNotes}
        />;
      case 'inventory':
        return <CaptacionesView />;
      case 'automations':
        return <AutomationsView leads={leads} />;
      case 'activities':
        return <DailyActivities completions={taskCompletions} onToggleTask={toggleTaskCompletion} />;
      case 'analytics':
        return <AdvancedAnalytics leads={leads} followUps={followUps} taskCompletions={taskCompletions} />;
      case 'architecture':
        return <ArchitectureInfo />;
      case 'superadmin':
        return <SuperAdminDashboard />;
      default:
        return <Dashboard 
          leads={leads} 
          onUpdateLeadStatus={updateLeadStatus}
          onUpdateLeadScore={updateLeadScore}
          onUpdateLead={updateLead}
          followUps={followUps}
          onAddFollowUp={addFollowUp}
        />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;