import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadsManager from './components/LeadsManager';
import InventoryView from './components/InventoryView';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import ArchitectureInfo from './components/ArchitectureInfo';
import DailyActivities from './components/DailyActivities';
import { MOCK_LEADS, MOCK_PROPERTIES } from './services/mockData';
import { DEMO_FOLLOW_UPS, DEMO_TASK_COMPLETIONS } from './services/demoData';
import type { Lead, Property } from './types';
import { LeadStatus } from './types';
import type { LeadScore } from './services/leadScoring';
import type { TaskCompletion, LeadFollowUp } from './types/activities';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  
  // Daily Activities State - con datos de demo
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>(DEMO_TASK_COMPLETIONS);
  
  // Lead Follow-ups State - con datos de demo
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>(DEMO_FOLLOW_UPS);

  // Add new lead (from Webhook or Form)
  const addLead = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
  };

  // Update lead status
  const updateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, status: newStatus, lastContactDate: new Date().toISOString() } 
        : lead
    ));
  };

  // Update lead score
  const updateLeadScore = (leadId: string, score: LeadScore) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { 
            ...lead, 
            score: {
              total: score.total,
              percentage: score.percentage,
              category: score.category,
              qualifiedAt: new Date().toISOString()
            }
          } 
        : lead
    ));
  };

  // Toggle task completion
  const toggleTaskCompletion = (taskId: string, date: string, dayOfWeek: TaskCompletion['dayOfWeek']) => {
    setTaskCompletions(prev => {
      const existing = prev.find(c => c.taskId === taskId && c.date === date);
      if (existing) {
        // Toggle existing
        return prev.map(c => 
          c.taskId === taskId && c.date === date 
            ? { ...c, completed: !c.completed, completedAt: !c.completed ? new Date().toISOString() : undefined }
            : c
        );
      } else {
        // Add new completion
        return [...prev, {
          taskId,
          date,
          dayOfWeek,
          completed: true,
          completedAt: new Date().toISOString()
        }];
      }
    });
  };

  // Add lead follow-up
  const addFollowUp = (followUp: Omit<LeadFollowUp, 'id'>) => {
    const newFollowUp: LeadFollowUp = {
      ...followUp,
      id: `fu-${Date.now()}`
    };
    setFollowUps(prev => [...prev, newFollowUp]);
  };

  // Add new property
  const addProperty = (newProperty: Property) => {
    setProperties(prev => [newProperty, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard leads={leads} onUpdateLeadStatus={updateLeadStatus} />;
      case 'leads':
        return <LeadsManager 
          leads={leads} 
          addLead={addLead} 
          updateLeadStatus={updateLeadStatus} 
          updateLeadScore={updateLeadScore}
          followUps={followUps}
          addFollowUp={addFollowUp}
        />;
      case 'inventory':
        return <InventoryView properties={properties} addProperty={addProperty} />;
      case 'activities':
        return <DailyActivities completions={taskCompletions} onToggleTask={toggleTaskCompletion} />;
      case 'analytics':
        return <AdvancedAnalytics leads={leads} followUps={followUps} taskCompletions={taskCompletions} />;
      case 'architecture':
        return <ArchitectureInfo />;
      default:
        return <Dashboard leads={leads} onUpdateLeadStatus={updateLeadStatus} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;