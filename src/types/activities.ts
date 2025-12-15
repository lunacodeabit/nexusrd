// Daily Activities Types

export interface DailyTask {
  id: string;
  category: 'SUBIR_ARTES' | 'SUBIR_PROPIEDADES' | 'OTRAS_ACCIONES' | 'INDICADORES';
  name: string;
  timeSlot: '8:00 AM' | '8:30 AM' | '3:00 PM' | '6:00 PM';
  order: number;
}

export interface TaskCompletion {
  taskId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';
  completed: boolean;
  completedAt?: string;
}

export interface DailyActivityLog {
  date: string; // YYYY-MM-DD
  completions: TaskCompletion[];
  notes?: string;
}

// Predefined tasks based on user's spreadsheet
export const DAILY_TASKS: DailyTask[] = [
  // 8:00 AM - SUBIR ARTES
  { id: 'art-1', category: 'SUBIR_ARTES', name: 'Instagram Post', timeSlot: '8:00 AM', order: 1 },
  { id: 'art-2', category: 'SUBIR_ARTES', name: 'Compartir Post al Story', timeSlot: '8:00 AM', order: 2 },
  { id: 'art-3', category: 'SUBIR_ARTES', name: 'Status WhatsApp', timeSlot: '8:00 AM', order: 3 },
  { id: 'art-4', category: 'SUBIR_ARTES', name: 'Status Telegram', timeSlot: '8:00 AM', order: 4 },
  { id: 'art-5', category: 'SUBIR_ARTES', name: 'Republicar SuperCasas', timeSlot: '8:00 AM', order: 5 },
  { id: 'art-6', category: 'SUBIR_ARTES', name: 'Broadcast (mensajes masivos)', timeSlot: '8:00 AM', order: 6 },
  
  // 8:30 AM - SUBIR PROPIEDADES
  { id: 'prop-1', category: 'SUBIR_PROPIEDADES', name: 'Alveano.do', timeSlot: '8:30 AM', order: 1 },
  { id: 'prop-2', category: 'SUBIR_PROPIEDADES', name: 'Corotos.com.do', timeSlot: '8:30 AM', order: 2 },
  { id: 'prop-3', category: 'SUBIR_PROPIEDADES', name: 'MercadoLibre', timeSlot: '8:30 AM', order: 3 },
  { id: 'prop-4', category: 'SUBIR_PROPIEDADES', name: 'SuperCasas', timeSlot: '8:30 AM', order: 4 },
  
  // 8:30 AM - OTRAS ACCIONES
  { id: 'other-1', category: 'OTRAS_ACCIONES', name: 'Leer 5 páginas', timeSlot: '8:30 AM', order: 5 },
  { id: 'other-2', category: 'OTRAS_ACCIONES', name: 'Entregar tarjetas a desconocidos', timeSlot: '8:30 AM', order: 6 },
  { id: 'other-3', category: 'OTRAS_ACCIONES', name: 'Grabar Leads en Celular', timeSlot: '8:30 AM', order: 7 },
  { id: 'other-4', category: 'OTRAS_ACCIONES', name: 'Grabar Leads en AlterEstate', timeSlot: '8:30 AM', order: 8 },
  
  // 8:30 AM - INDICADORES
  { id: 'kpi-1', category: 'INDICADORES', name: 'Citas programadas', timeSlot: '8:30 AM', order: 9 },
  { id: 'kpi-2', category: 'INDICADORES', name: 'Ventas / Alquileres', timeSlot: '8:30 AM', order: 10 },
  
  // 3:00 PM - Repeat cycle
  { id: 'art-pm1-1', category: 'SUBIR_ARTES', name: 'Instagram Post', timeSlot: '3:00 PM', order: 1 },
  { id: 'art-pm1-2', category: 'SUBIR_ARTES', name: 'Compartir Post al Story', timeSlot: '3:00 PM', order: 2 },
  { id: 'art-pm1-3', category: 'SUBIR_ARTES', name: 'Status WhatsApp', timeSlot: '3:00 PM', order: 3 },
  { id: 'art-pm1-4', category: 'SUBIR_ARTES', name: 'Status Telegram', timeSlot: '3:00 PM', order: 4 },
  { id: 'art-pm1-5', category: 'SUBIR_ARTES', name: 'Republicar SuperCasas', timeSlot: '3:00 PM', order: 5 },
  { id: 'art-pm1-6', category: 'SUBIR_ARTES', name: 'Broadcast (mensajes masivos)', timeSlot: '3:00 PM', order: 6 },
  { id: 'kpi-pm1-1', category: 'INDICADORES', name: 'Citas programadas', timeSlot: '3:00 PM', order: 7 },
  { id: 'kpi-pm1-2', category: 'INDICADORES', name: 'Ventas / Alquileres', timeSlot: '3:00 PM', order: 8 },
  
  // 6:00 PM - Repeat cycle
  { id: 'art-pm2-1', category: 'SUBIR_ARTES', name: 'Instagram Post', timeSlot: '6:00 PM', order: 1 },
  { id: 'art-pm2-2', category: 'SUBIR_ARTES', name: 'Compartir Post al Story', timeSlot: '6:00 PM', order: 2 },
  { id: 'art-pm2-3', category: 'SUBIR_ARTES', name: 'Status WhatsApp', timeSlot: '6:00 PM', order: 3 },
  { id: 'art-pm2-4', category: 'SUBIR_ARTES', name: 'Status Telegram', timeSlot: '6:00 PM', order: 4 },
  { id: 'art-pm2-5', category: 'SUBIR_ARTES', name: 'Republicar SuperCasas', timeSlot: '6:00 PM', order: 5 },
  { id: 'art-pm2-6', category: 'SUBIR_ARTES', name: 'Broadcast (mensajes masivos)', timeSlot: '6:00 PM', order: 6 },
];

// Lead Follow-up Types
export interface LeadFollowUp {
  id: string;
  leadId: string;
  followUpNumber: number; // S1, S2, S3... S12
  date: string;
  method: 'LLAMADA' | 'WHATSAPP' | 'EMAIL' | 'VISITA' | 'OTRO';
  notes?: string;
  response?: 'POSITIVA' | 'NEGATIVA' | 'SIN_RESPUESTA' | 'PENDIENTE';
}

export interface MonthlyMetrics {
  month: string; // YYYY-MM
  totalFollowUps: number;
  totalPosts: number;
  totalLeadsGenerated: number;
  totalCitas: number;
  totalVentas: number;
  totalAlquileres: number;
  avgFollowUpsToClose: number;
  conversionRate: number;
}

// Helper to get day of week in Spanish
export const getDayOfWeek = (date: Date): TaskCompletion['dayOfWeek'] => {
  const days: TaskCompletion['dayOfWeek'][] = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
  return days[date.getDay()];
};

// Helper to format date as YYYY-MM-DD
export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
