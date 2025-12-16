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
