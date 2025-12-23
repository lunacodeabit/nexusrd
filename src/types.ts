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

// Note history entry
export interface NoteEntry {
  id: string;
  text: string;
  createdAt: string;
  source: 'manual' | 'follow_up' | 'qualification';
  followUpNumber?: number;
  questionId?: string; // For qualification notes
}

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
  notesHistory?: NoteEntry[]; // Historial de notas con timestamp
  // Lead Scoring
  score?: {
    total: number;
    percentage: number;
    category: 'HOT' | 'WARM' | 'COLD';
    qualifiedAt?: string;
  };
  // Qualification progress (partial save support)
  qualificationAnswers?: Record<string, string>; // questionId -> answer value
  qualificationNotes?: Record<string, string>;   // questionId -> note text
  qualificationProgress?: number;                // 0-100 percentage
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

// Appointment type for visits/meetings
export type AppointmentType = 'virtual' | 'in_person';

export interface ScheduledTask {
  id: string;
  user_id: string;
  lead_id: string | null;
  lead_name: string;
  lead_phone: string | null;
  task_type: 'call' | 'whatsapp' | 'visit' | 'email' | 'other';
  appointment_type?: AppointmentType; // Only for task_type = 'visit'
  scheduled_date: string;
  scheduled_time: string;
  notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
  alert_sent: boolean;
  created_at: string;
  updated_at: string;
}

// Appointment Metrics for dashboard
export interface AppointmentMetrics {
  user_id: string;
  full_name: string;
  email: string;
  month: string;
  virtual_appointments: number;
  in_person_appointments: number;
  total_appointments: number;
  completed_appointments: number;
  completed_virtual: number;
  completed_in_person: number;
}

// Team appointment summary
export interface TeamAppointmentSummary {
  total_virtual: number;
  total_in_person: number;
  total_appointments: number;
  total_completed: number;
  asesores_with_appointments: number;
}

export type ActivityType =
  | 'lead_created'
  | 'lead_updated'
  | 'lead_status_changed'
  | 'follow_up_created'
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
  // Métricas avanzadas
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  active_leads: number; // Leads en proceso (no cerrados)
  conversion_rate: number;
  avg_follow_ups: number;
  total_follow_ups: number;
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

// ---------------------------------------------------------------------------
// AUTOMATIZACIONES
// ---------------------------------------------------------------------------

export type AutomationTrigger =
  | 'days_without_contact'      // Lead sin contacto por X días
  | 'days_in_status'            // Lead estancado en un status por X días
  | 'follow_up_overdue'         // Seguimiento programado vencido
  | 'no_response_after_contact' // Sin respuesta después de contacto
  | 'lead_gone_cold';           // Lead calificado como HOT/WARM que se enfrió

export type AutomationAction =
  | 'send_whatsapp'       // Enviar mensaje de WhatsApp
  | 'send_email'          // Enviar email
  | 'create_task'         // Crear tarea automática
  | 'notify_supervisor'   // Notificar al supervisor
  | 'change_status'       // Cambiar status del lead
  | 'show_alert';         // Mostrar alerta en dashboard

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  trigger_value: number;          // Días, horas, etc. según el trigger
  trigger_status?: LeadStatus;    // Para 'days_in_status'
  action: AutomationAction;
  action_config: {
    message_template?: string;    // Para WhatsApp/Email
    task_title?: string;          // Para crear tarea
    new_status?: LeadStatus;      // Para cambiar status
    notify_role?: UserRole;       // Para notificar
  };
  is_active: boolean;
  apply_to_statuses?: LeadStatus[]; // En qué status aplicar (null = todos)
  created_at: string;
  updated_at: string;
  user_id: string;                // Quien creó la regla
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  lead_id: string;
  executed_at: string;
  action_taken: AutomationAction;
  result: 'success' | 'pending' | 'failed';
  details?: string;
}

export interface PendingAutomation {
  rule: AutomationRule;
  lead: Lead;
  daysSinceContact: number;
  daysInStatus: number;
  suggestedMessage?: string;
}

// ---------------------------------------------------------------------------
// TAREAS PERSONALES (Planner Diario)
// ---------------------------------------------------------------------------

export type TaskPriority = 'alta' | 'media' | 'baja';
export type TaskCategory = 'personal' | 'trabajo' | 'cliente' | 'admin' | 'otro';

export interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  scheduled_date: string;      // YYYY-MM-DD
  scheduled_time?: string;     // HH:MM (opcional)
  duration_minutes?: number;   // Duración estimada
  is_completed: boolean;
  completed_at?: string;
  alert_minutes_before?: number; // Minutos antes para notificar
  alert_sent?: boolean;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  recurrence_days?: number[];  // [1,3,5] = Lun, Mie, Vie
  created_at: string;
  updated_at: string;
}

// Para la UI
export interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  alert_minutes_before: number;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
}

// ---------------------------------------------------------------------------
// FOLLOW-UP TRACKING (Seguimiento de Leads)
// ---------------------------------------------------------------------------

export type TrackingType = 'waiting' | 'paused' | 'searching';

export interface SearchCriteria {
  zones: string[];
  bedroomsMin?: number;
  bedroomsMax?: number;
  budgetMin?: number;
  budgetMax?: number;
  propertyType?: string;
  features?: string[];
  notes?: string;
}

export interface FollowUpTracking {
  id: string;
  user_id: string;
  lead_id: string;
  tracking_type: TrackingType;
  original_status: string;
  reason: string;
  notes?: string;
  contact_date?: string; // YYYY-MM-DD
  search_criteria?: SearchCriteria;
  properties_sent: number;
  is_active: boolean;
  reactivated_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields from lead
  lead_name?: string;
  lead_phone?: string;
  lead_email?: string;
  lead_budget?: number;
  lead_currency?: Currency;
  lead_source?: string;
  lead_interest_area?: string;
  days_until_contact?: number;
  days_in_tracking?: number;
}

export interface TrackingFormData {
  tracking_type: TrackingType;
  reason: string;
  notes?: string;
  contact_date?: string;
  search_criteria?: SearchCriteria;
}
