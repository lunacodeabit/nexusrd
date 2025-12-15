import type { TaskCompletion, LeadFollowUp } from '../types/activities';

// Helper para crear fechas
const dateKey = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const getDayOfWeek = (daysAgo: number): TaskCompletion['dayOfWeek'] => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const days: TaskCompletion['dayOfWeek'][] = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
  return days[date.getDay()];
};

// Seguimientos de demostración (S1-S12)
export const DEMO_FOLLOW_UPS: LeadFollowUp[] = [
  // Carlos Rodríguez (l-1) - Lead HOT en negociación - 8 seguimientos
  { id: 'fu-1', leadId: 'l-1', followUpNumber: 1, date: dateKey(14) + 'T09:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Respondió interesado' },
  { id: 'fu-2', leadId: 'l-1', followUpNumber: 2, date: dateKey(12) + 'T10:30:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Llamada de 15 min, muy interesado' },
  { id: 'fu-3', leadId: 'l-1', followUpNumber: 3, date: dateKey(10) + 'T14:00:00', method: 'EMAIL', response: 'POSITIVA', notes: 'Envié propiedades, le gustaron 2' },
  { id: 'fu-4', leadId: 'l-1', followUpNumber: 4, date: dateKey(8) + 'T11:00:00', method: 'VISITA', response: 'POSITIVA', notes: 'Visita a 2 propiedades' },
  { id: 'fu-5', leadId: 'l-1', followUpNumber: 5, date: dateKey(6) + 'T16:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Pidió más info del apto en Punta Cana' },
  { id: 'fu-6', leadId: 'l-1', followUpNumber: 6, date: dateKey(4) + 'T09:30:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Hablamos de financiamiento' },
  { id: 'fu-7', leadId: 'l-1', followUpNumber: 7, date: dateKey(2) + 'T15:00:00', method: 'VISITA', response: 'POSITIVA', notes: 'Segunda visita con esposa' },
  { id: 'fu-8', leadId: 'l-1', followUpNumber: 8, date: dateKey(1) + 'T10:00:00', method: 'WHATSAPP', response: 'PENDIENTE', notes: 'Enviando propuesta final' },

  // María Fernández (l-2) - Lead HOT con visita - 5 seguimientos
  { id: 'fu-9', leadId: 'l-2', followUpNumber: 1, date: dateKey(9) + 'T08:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Contacto inicial' },
  { id: 'fu-10', leadId: 'l-2', followUpNumber: 2, date: dateKey(7) + 'T11:00:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Buena conversación' },
  { id: 'fu-11', leadId: 'l-2', followUpNumber: 3, date: dateKey(5) + 'T14:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Agendamos visita' },
  { id: 'fu-12', leadId: 'l-2', followUpNumber: 4, date: dateKey(3) + 'T09:00:00', method: 'EMAIL', response: 'POSITIVA', notes: 'Confirmación de visita' },
  { id: 'fu-13', leadId: 'l-2', followUpNumber: 5, date: dateKey(2) + 'T16:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Recordatorio de visita' },

  // Roberto Méndez (l-3) - Lead HOT contactado - 3 seguimientos
  { id: 'fu-14', leadId: 'l-3', followUpNumber: 1, date: dateKey(6) + 'T10:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Referido de Carlos' },
  { id: 'fu-15', leadId: 'l-3', followUpNumber: 2, date: dateKey(4) + 'T11:30:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Muy interesado en villa' },
  { id: 'fu-16', leadId: 'l-3', followUpNumber: 3, date: dateKey(3) + 'T15:00:00', method: 'EMAIL', response: 'PENDIENTE', notes: 'Envié catálogo de villas' },

  // Ana García (l-4) - Lead WARM - 4 seguimientos
  { id: 'fu-17', leadId: 'l-4', followUpNumber: 1, date: dateKey(11) + 'T09:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Llegó por Instagram' },
  { id: 'fu-18', leadId: 'l-4', followUpNumber: 2, date: dateKey(9) + 'T14:00:00', method: 'LLAMADA', response: 'SIN_RESPUESTA', notes: 'No contestó' },
  { id: 'fu-19', leadId: 'l-4', followUpNumber: 3, date: dateKey(7) + 'T10:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Respondió, pide más tiempo' },
  { id: 'fu-20', leadId: 'l-4', followUpNumber: 4, date: dateKey(4) + 'T16:00:00', method: 'WHATSAPP', response: 'SIN_RESPUESTA', notes: 'Sin respuesta aún' },

  // José Pérez (l-5) - Lead WARM nuevo - 2 seguimientos
  { id: 'fu-21', leadId: 'l-5', followUpNumber: 1, date: dateKey(4) + 'T08:30:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Contacto inicial' },
  { id: 'fu-22', leadId: 'l-5', followUpNumber: 2, date: dateKey(2) + 'T11:00:00', method: 'LLAMADA', response: 'SIN_RESPUESTA', notes: 'Buzón de voz' },

  // Laura Jiménez (l-6) - Lead WARM - 3 seguimientos
  { id: 'fu-23', leadId: 'l-6', followUpNumber: 1, date: dateKey(7) + 'T10:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'De SuperCasas' },
  { id: 'fu-24', leadId: 'l-6', followUpNumber: 2, date: dateKey(6) + 'T14:00:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Hablamos, necesita consultar' },
  { id: 'fu-25', leadId: 'l-6', followUpNumber: 3, date: dateKey(6) + 'T17:00:00', method: 'EMAIL', response: 'PENDIENTE', notes: 'Info enviada para el esposo' },

  // Pedro Santana (l-7) - Lead COLD - 1 seguimiento
  { id: 'fu-26', leadId: 'l-7', followUpNumber: 1, date: dateKey(2) + 'T09:00:00', method: 'WHATSAPP', response: 'NEGATIVA', notes: 'Solo explorando, no está listo' },

  // Carmen Díaz (l-8) - Lead COLD - 2 seguimientos
  { id: 'fu-27', leadId: 'l-8', followUpNumber: 1, date: dateKey(19) + 'T10:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Interesada pero sin prisa' },
  { id: 'fu-28', leadId: 'l-8', followUpNumber: 2, date: dateKey(15) + 'T11:00:00', method: 'LLAMADA', response: 'NEGATIVA', notes: 'Dice que tal vez el próximo año' },

  // Fernando Núñez (l-11) - CERRADO WON - 10 seguimientos (completo)
  { id: 'fu-29', leadId: 'l-11', followUpNumber: 1, date: dateKey(44) + 'T09:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Primer contacto' },
  { id: 'fu-30', leadId: 'l-11', followUpNumber: 2, date: dateKey(42) + 'T10:00:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Muy interesado' },
  { id: 'fu-31', leadId: 'l-11', followUpNumber: 3, date: dateKey(40) + 'T14:00:00', method: 'EMAIL', response: 'POSITIVA', notes: 'Envié opciones' },
  { id: 'fu-32', leadId: 'l-11', followUpNumber: 4, date: dateKey(35) + 'T11:00:00', method: 'VISITA', response: 'POSITIVA', notes: 'Primera visita' },
  { id: 'fu-33', leadId: 'l-11', followUpNumber: 5, date: dateKey(30) + 'T10:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Le gustó Cap Cana' },
  { id: 'fu-34', leadId: 'l-11', followUpNumber: 6, date: dateKey(25) + 'T15:00:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Negociando precio' },
  { id: 'fu-35', leadId: 'l-11', followUpNumber: 7, date: dateKey(20) + 'T09:00:00', method: 'VISITA', response: 'POSITIVA', notes: 'Segunda visita con familia' },
  { id: 'fu-36', leadId: 'l-11', followUpNumber: 8, date: dateKey(15) + 'T14:00:00', method: 'EMAIL', response: 'POSITIVA', notes: 'Propuesta aceptada' },
  { id: 'fu-37', leadId: 'l-11', followUpNumber: 9, date: dateKey(10) + 'T10:00:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Coordinando firma' },
  { id: 'fu-38', leadId: 'l-11', followUpNumber: 10, date: dateKey(5) + 'T11:00:00', method: 'VISITA', response: 'POSITIVA', notes: '¡FIRMÓ! 🎉' },

  // Patricia Vega (l-12) - CERRADO WON - 7 seguimientos
  { id: 'fu-39', leadId: 'l-12', followUpNumber: 1, date: dateKey(29) + 'T09:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'De Instagram' },
  { id: 'fu-40', leadId: 'l-12', followUpNumber: 2, date: dateKey(27) + 'T11:00:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Interesada en Santo Domingo' },
  { id: 'fu-41', leadId: 'l-12', followUpNumber: 3, date: dateKey(24) + 'T14:00:00', method: 'VISITA', response: 'POSITIVA', notes: 'Le encantó el apartamento' },
  { id: 'fu-42', leadId: 'l-12', followUpNumber: 4, date: dateKey(20) + 'T10:00:00', method: 'WHATSAPP', response: 'POSITIVA', notes: 'Confirmó interés' },
  { id: 'fu-43', leadId: 'l-12', followUpNumber: 5, date: dateKey(17) + 'T15:00:00', method: 'LLAMADA', response: 'POSITIVA', notes: 'Negociación final' },
  { id: 'fu-44', leadId: 'l-12', followUpNumber: 6, date: dateKey(13) + 'T09:00:00', method: 'EMAIL', response: 'POSITIVA', notes: 'Documentos enviados' },
  { id: 'fu-45', leadId: 'l-12', followUpNumber: 7, date: dateKey(10) + 'T11:00:00', method: 'VISITA', response: 'POSITIVA', notes: '¡CERRADO! 🎉' },
];

// Actividades completadas de demostración (últimos 7 días)
export const DEMO_TASK_COMPLETIONS: TaskCompletion[] = [
  // Hoy (día 0)
  { taskId: 'art-1', date: dateKey(0), dayOfWeek: getDayOfWeek(0), completed: true, completedAt: dateKey(0) + 'T08:15:00' },
  { taskId: 'art-2', date: dateKey(0), dayOfWeek: getDayOfWeek(0), completed: true, completedAt: dateKey(0) + 'T08:20:00' },
  { taskId: 'art-3', date: dateKey(0), dayOfWeek: getDayOfWeek(0), completed: true, completedAt: dateKey(0) + 'T08:25:00' },
  { taskId: 'prop-1', date: dateKey(0), dayOfWeek: getDayOfWeek(0), completed: true, completedAt: dateKey(0) + 'T08:45:00' },
  { taskId: 'other-3', date: dateKey(0), dayOfWeek: getDayOfWeek(0), completed: true, completedAt: dateKey(0) + 'T09:00:00' },
  
  // Ayer (día 1)
  { taskId: 'art-1', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T08:10:00' },
  { taskId: 'art-2', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T08:15:00' },
  { taskId: 'art-3', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T08:20:00' },
  { taskId: 'art-4', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T08:25:00' },
  { taskId: 'art-5', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T08:30:00' },
  { taskId: 'prop-1', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T08:40:00' },
  { taskId: 'prop-2', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T08:50:00' },
  { taskId: 'other-1', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T07:30:00' },
  { taskId: 'other-3', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T09:00:00' },
  { taskId: 'kpi-1', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T18:00:00' },
  { taskId: 'art-pm1-1', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T15:10:00' },
  { taskId: 'art-pm1-3', date: dateKey(1), dayOfWeek: getDayOfWeek(1), completed: true, completedAt: dateKey(1) + 'T15:20:00' },
  
  // Hace 2 días
  { taskId: 'art-1', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T08:05:00' },
  { taskId: 'art-2', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T08:10:00' },
  { taskId: 'art-3', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T08:15:00' },
  { taskId: 'art-4', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T08:20:00' },
  { taskId: 'art-5', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T08:25:00' },
  { taskId: 'art-6', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T08:30:00' },
  { taskId: 'prop-1', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T08:40:00' },
  { taskId: 'prop-2', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T08:50:00' },
  { taskId: 'prop-3', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T09:00:00' },
  { taskId: 'other-1', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T07:00:00' },
  { taskId: 'other-2', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T12:00:00' },
  { taskId: 'other-3', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T09:30:00' },
  { taskId: 'kpi-1', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T18:00:00' },
  { taskId: 'kpi-2', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T18:30:00' },
  { taskId: 'art-pm1-1', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T15:05:00' },
  { taskId: 'art-pm1-2', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T15:10:00' },
  { taskId: 'art-pm1-3', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T15:15:00' },
  { taskId: 'art-pm2-1', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T18:05:00' },
  { taskId: 'art-pm2-3', date: dateKey(2), dayOfWeek: getDayOfWeek(2), completed: true, completedAt: dateKey(2) + 'T18:10:00' },
  
  // Hace 3 días
  { taskId: 'art-1', date: dateKey(3), dayOfWeek: getDayOfWeek(3), completed: true, completedAt: dateKey(3) + 'T08:00:00' },
  { taskId: 'art-2', date: dateKey(3), dayOfWeek: getDayOfWeek(3), completed: true, completedAt: dateKey(3) + 'T08:05:00' },
  { taskId: 'art-3', date: dateKey(3), dayOfWeek: getDayOfWeek(3), completed: true, completedAt: dateKey(3) + 'T08:10:00' },
  { taskId: 'prop-1', date: dateKey(3), dayOfWeek: getDayOfWeek(3), completed: true, completedAt: dateKey(3) + 'T08:35:00' },
  { taskId: 'other-3', date: dateKey(3), dayOfWeek: getDayOfWeek(3), completed: true, completedAt: dateKey(3) + 'T09:00:00' },
  { taskId: 'art-pm1-1', date: dateKey(3), dayOfWeek: getDayOfWeek(3), completed: true, completedAt: dateKey(3) + 'T15:00:00' },
  
  // Hace 4 días
  { taskId: 'art-1', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T08:10:00' },
  { taskId: 'art-2', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T08:15:00' },
  { taskId: 'art-3', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T08:20:00' },
  { taskId: 'art-4', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T08:25:00' },
  { taskId: 'prop-1', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T08:40:00' },
  { taskId: 'prop-2', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T08:50:00' },
  { taskId: 'other-1', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T07:00:00' },
  { taskId: 'other-3', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T09:30:00' },
  { taskId: 'kpi-1', date: dateKey(4), dayOfWeek: getDayOfWeek(4), completed: true, completedAt: dateKey(4) + 'T17:00:00' },
  
  // Hace 5 días
  { taskId: 'art-1', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T08:00:00' },
  { taskId: 'art-2', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T08:05:00' },
  { taskId: 'art-3', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T08:10:00' },
  { taskId: 'art-4', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T08:15:00' },
  { taskId: 'art-5', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T08:20:00' },
  { taskId: 'prop-1', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T08:35:00' },
  { taskId: 'prop-2', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T08:45:00' },
  { taskId: 'prop-3', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T08:55:00' },
  { taskId: 'prop-4', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T09:05:00' },
  { taskId: 'other-1', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T06:30:00' },
  { taskId: 'other-2', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T11:00:00' },
  { taskId: 'other-3', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T09:30:00' },
  { taskId: 'other-4', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T09:45:00' },
  { taskId: 'kpi-1', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T17:30:00' },
  { taskId: 'kpi-2', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T18:00:00' },
  { taskId: 'art-pm1-1', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T15:00:00' },
  { taskId: 'art-pm1-2', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T15:05:00' },
  { taskId: 'art-pm1-3', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T15:10:00' },
  { taskId: 'art-pm1-4', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T15:15:00' },
  { taskId: 'art-pm2-1', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T18:05:00' },
  { taskId: 'art-pm2-2', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T18:10:00' },
  { taskId: 'art-pm2-3', date: dateKey(5), dayOfWeek: getDayOfWeek(5), completed: true, completedAt: dateKey(5) + 'T18:15:00' },
  
  // Hace 6 días
  { taskId: 'art-1', date: dateKey(6), dayOfWeek: getDayOfWeek(6), completed: true, completedAt: dateKey(6) + 'T08:00:00' },
  { taskId: 'art-2', date: dateKey(6), dayOfWeek: getDayOfWeek(6), completed: true, completedAt: dateKey(6) + 'T08:05:00' },
  { taskId: 'art-3', date: dateKey(6), dayOfWeek: getDayOfWeek(6), completed: true, completedAt: dateKey(6) + 'T08:10:00' },
  { taskId: 'prop-1', date: dateKey(6), dayOfWeek: getDayOfWeek(6), completed: true, completedAt: dateKey(6) + 'T08:35:00' },
  { taskId: 'other-1', date: dateKey(6), dayOfWeek: getDayOfWeek(6), completed: true, completedAt: dateKey(6) + 'T07:00:00' },
  { taskId: 'other-3', date: dateKey(6), dayOfWeek: getDayOfWeek(6), completed: true, completedAt: dateKey(6) + 'T09:00:00' },
];
