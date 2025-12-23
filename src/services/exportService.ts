import type { Lead } from '../types';
import { LeadStatus } from '../types';
import type { LeadFollowUp, TaskCompletion } from '../types/activities';
import { QUALIFICATION_QUESTIONS } from './leadScoring';

// Generate CSV content for leads with full history
export const generateLeadsCSV = (
  leads: Lead[],
  followUps: LeadFollowUp[],
  qualificationAnswers: Record<string, Record<string, string>> = {}
): string => {
  // Headers
  const headers = [
    'ID',
    'Nombre del Cliente',
    'Teléfono',
    'Email',
    'Fuente',
    'Estado',
    'Presupuesto',
    'Zona de Interés',
    'Fecha Creación',
    'Último Contacto',
    'Próximo Seguimiento',
    'Notas',
    // Qualification questions
    ...QUALIFICATION_QUESTIONS.map(q => q.question),
    // Score
    'Puntos',
    'Porcentaje',
    'Clasificación',
    'Fecha Calificación',
    // Follow-ups S1-S12
    'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12',
    // Summary
    'Total Seguimientos',
    'Respuestas Positivas',
    'Sin Respuesta',
    'Respuestas Negativas'
  ];

  // Build rows
  const rows = leads.map(lead => {
    const leadFollowUps = followUps
      .filter(f => f.leadId === lead.id)
      .sort((a, b) => a.followUpNumber - b.followUpNumber);

    const answers = qualificationAnswers[lead.id] || {};

    // Follow-up dates for S1-S12
    const followUpDates: string[] = [];
    for (let i = 1; i <= 12; i++) {
      const fu = leadFollowUps.find(f => f.followUpNumber === i);
      followUpDates.push(fu ? new Date(fu.date).toLocaleDateString('es-ES') : '');
    }

    // Stats
    const positivas = leadFollowUps.filter(f => f.response === 'POSITIVA').length;
    const sinRespuesta = leadFollowUps.filter(f => f.response === 'SIN_RESPUESTA').length;
    const negativas = leadFollowUps.filter(f => f.response === 'NEGATIVA').length;

    return [
      lead.id,
      lead.name,
      lead.phone,
      lead.email,
      lead.source,
      lead.status,
      lead.budget.toString(),
      lead.interestArea || '',
      new Date(lead.createdAt).toLocaleDateString('es-ES'),
      lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString('es-ES') : '',
      new Date(lead.nextFollowUpDate).toLocaleDateString('es-ES'),
      lead.notes || '',
      // Qualification answers
      ...QUALIFICATION_QUESTIONS.map(q => answers[q.id] || ''),
      // Score
      lead.score?.total?.toString() || '',
      lead.score?.percentage?.toString() || '',
      lead.score?.category || '',
      lead.score?.qualifiedAt ? new Date(lead.score.qualifiedAt).toLocaleDateString('es-ES') : '',
      // Follow-ups
      ...followUpDates,
      // Summary
      leadFollowUps.length.toString(),
      positivas.toString(),
      sinRespuesta.toString(),
      negativas.toString()
    ];
  });

  // Convert to CSV
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  return csvContent;
};

// Generate activities CSV
export const generateActivitiesCSV = (completions: TaskCompletion[]): string => {
  const headers = ['Fecha', 'Día', 'Tarea ID', 'Completada', 'Hora Completada'];

  const rows = completions.map(c => [
    c.date,
    c.dayOfWeek,
    c.taskId,
    c.completed ? 'Sí' : 'No',
    c.completedAt ? new Date(c.completedAt).toLocaleTimeString('es-ES') : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

// Download CSV file
export const downloadCSV = (content: string, filename: string) => {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate Google Sheets URL with pre-filled data (for small datasets)
export const generateGoogleSheetsTemplate = (): string => {
  // This creates a template URL - user would need to import the CSV
  return 'https://docs.google.com/spreadsheets/create';
};

// Generate appointments CSV
export const generateAppointmentsCSV = (appointments: any[]): string => {
  const headers = [
    'Fecha',
    'Hora',
    'Cliente',
    'Teléfono',
    'Tipo',
    'Ubicación',
    'Estado',
    'Notas',
    'Lead ID',
    'Creado Por'
  ];

  const rows = appointments.map(apt => [
    new Date(apt.date).toLocaleDateString('es-ES'),
    apt.time,
    apt.lead_name || apt.title || 'Sin nombre',
    apt.lead_phone || '',
    apt.type === 'virtual' ? 'Virtual' : 'Presencial',
    apt.location || '',
    apt.status === 'completed' ? 'Completada' : apt.status === 'cancelled' ? 'Cancelada' : 'Pendiente',
    apt.notes || '',
    apt.lead_id || '',
    apt.user_name || ''
  ]);

  const escapeCSV = (value: string) => {
    if (value && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value || '';
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  return csvContent;
};

// Generate follow-ups detailed CSV
export const generateFollowUpsCSV = (followUps: LeadFollowUp[], leads: Lead[]): string => {
  const headers = [
    'Fecha',
    'Lead',
    'Teléfono',
    '# Seguimiento',
    'Método',
    'Resultado',
    'Notas'
  ];

  const rows = followUps.map(fu => {
    const lead = leads.find(l => l.id === fu.leadId);
    return [
      new Date(fu.date).toLocaleDateString('es-ES'),
      lead?.name || 'Sin lead',
      lead?.phone || '',
      `S${fu.followUpNumber}`,
      fu.method,
      fu.response === 'POSITIVA' ? '✅ Positiva' : fu.response === 'NEGATIVA' ? '❌ Negativa' : '⏳ Sin respuesta',
      fu.notes || ''
    ];
  });

  const escapeCSV = (value: string) => {
    if (value && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value || '';
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  return csvContent;
};

// Generate summary report CSV
export const generateSummaryReportCSV = (
  leads: Lead[],
  followUps: LeadFollowUp[],
  appointments: any[]
): string => {
  const now = new Date();
  const thisMonth = leads.filter(l => {
    const created = new Date(l.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const stats = [
    ['REPORTE RESUMEN - ' + now.toLocaleDateString('es-ES')],
    [],
    ['LEADS'],
    ['Total Leads', leads.length.toString()],
    ['Leads Este Mes', thisMonth.length.toString()],
    ['Leads HOT', leads.filter(l => l.score?.category === 'HOT').length.toString()],
    ['Leads WARM', leads.filter(l => l.score?.category === 'WARM').length.toString()],
    ['Leads COLD', leads.filter(l => l.score?.category === 'COLD').length.toString()],
    ['Leads Cerrados (Won)', leads.filter(l => l.status === LeadStatus.CLOSED_WON).length.toString()],
    ['Leads Cerrados (Lost)', leads.filter(l => l.status === LeadStatus.CLOSED_LOST).length.toString()],
    [],
    ['SEGUIMIENTOS'],
    ['Total Seguimientos', followUps.length.toString()],
    ['Respuestas Positivas', followUps.filter(f => f.response === 'POSITIVA').length.toString()],
    ['Sin Respuesta', followUps.filter(f => f.response === 'SIN_RESPUESTA').length.toString()],
    ['Respuestas Negativas', followUps.filter(f => f.response === 'NEGATIVA').length.toString()],
    [],
    ['CITAS'],
    ['Total Citas', appointments.length.toString()],
    ['Citas Completadas', appointments.filter(a => a.status === 'completed').length.toString()],
    ['Citas Pendientes', appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length.toString()],
  ];

  return stats.map(row => row.join(',')).join('\n');
};
