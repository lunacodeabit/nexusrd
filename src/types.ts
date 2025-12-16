// ---------------------------------------------------------------------------
// SCHEMA UNIFICADO (Base de Datos Relacional Simulada)
// ---------------------------------------------------------------------------

export const LeadStatus = {
  NEW: 'NUEVO',
  CONTACTED: 'CONTACTADO',
  VISIT_SCHEDULED: 'VISITA_AGENDADA',
  NEGOTIATION: 'NEGOCIACION',
  CLOSED_WON: 'CERRADO_GANADO',
  CLOSED_LOST: 'CERRADO_PERDIDO'
} as const;

export type LeadStatus = typeof LeadStatus[keyof typeof LeadStatus];

export const PropertyStatus = {
  AVAILABLE: 'DISPONIBLE',
  RESERVED: 'RESERVADO',
  SOLD: 'VENDIDO',
  INACTIVE: 'INACTIVO'
} as const;

export type PropertyStatus = typeof PropertyStatus[keyof typeof PropertyStatus];

// Currency type
export type Currency = 'USD' | 'RD$';

// Tabla: LEADS (Unifica "Leads Flow" y "Seguimiento")
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string; // Flexible: Instagram, WhatsApp, Facebook, Referido, SuperCasas, Corotos, etc.
  status: LeadStatus;
  budget: number;
  currency?: Currency; // US$ or RD$ (default: USD)
  interestArea: string;
  createdAt: string; // ISO Date
  lastContactDate?: string; // ISO Date
  nextFollowUpDate: string; // ISO Date (Critical for Alerts)
  notes: string;
  // Lead Scoring
  score?: {
    total: number;
    percentage: number;
    category: 'HOT' | 'WARM' | 'COLD';
    qualifiedAt?: string;
  };
}

// Tabla: PROPERTIES (Equivalente a "Captaciones")
export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  status: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  sqMeters: number;
  imageUrl: string;
  ownerName: string;
  ownerPhone: string;
}

// Tabla: INTERACTIONS (Log histórico para "Seguimiento")
export interface Interaction {
  id: string;
  leadId: string;
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING';
  notes: string;
  date: string;
}

// Tabla: DAILY_KPI (Equivalente a "Acciones Diarias")
export interface DailyKPI {
  date: string;
  callsMade: number;
  emailsSent: number;
  visitsConducted: number;
  newLeads: number;
}

// ---------------------------------------------------------------------------
// SUPERADMIN TYPES
// ---------------------------------------------------------------------------

export type UserRole = 'asesor' | 'supervisor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledTask {
  id: string;
  user_id: string;
  lead_id: string | null;
  lead_name: string;
  lead_phone: string | null;
  task_type: 'call' | 'whatsapp' | 'visit' | 'email' | 'other';
  scheduled_date: string;
  scheduled_time: string;
  notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
  alert_sent: boolean;
  created_at: string;
  updated_at: string;
}

export type ActivityType = 
  | 'lead_created' 
  | 'lead_updated' 
  | 'lead_status_changed'
  | 'task_created'
  | 'task_completed' 
  | 'call_made' 
  | 'whatsapp_sent'
  | 'visit_completed'
  | 'login'
  | 'note_added';

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: ActivityType;
  entity_type: 'lead' | 'task' | 'property' | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Team Performance (from SQL view)
export interface TeamMemberPerformance {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  total_leads: number;
  leads_won: number;
  leads_lost: number;
  leads_this_week: number;
  total_tasks: number;
  tasks_completed: number;
  last_activity: string | null;
}

// Daily Activity Summary (from SQL view)
export interface DailyActivitySummary {
  user_id: string;
  activity_date: string;
  total_actions: number;
  leads_created: number;
  leads_updated: number;
  tasks_completed: number;
  calls_made: number;
  whatsapp_sent: number;
}
