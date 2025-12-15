import type { Lead, Property, DailyKPI } from '../types';
import { LeadStatus, PropertyStatus } from '../types';

// Helper para crear fechas relativas
const daysAgo = (days: number) => new Date(Date.now() - 86400000 * days).toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + 86400000 * days).toISOString();

export const MOCK_LEADS: Lead[] = [
  // Leads HOT 🔥
  {
    id: 'l-1',
    name: 'Carlos Rodríguez',
    email: 'carlos.rod@example.com',
    phone: '+1 809 555 1234',
    source: 'Instagram',
    status: LeadStatus.NEGOTIATION,
    budget: 350000,
    interestArea: 'Punta Cana',
    createdAt: daysAgo(15),
    lastContactDate: daysAgo(1),
    nextFollowUpDate: daysFromNow(1),
    notes: 'Interesado en apartamento de playa. Tiene preaprobación bancaria.',
    score: { total: 27, percentage: 90, category: 'HOT', qualifiedAt: daysAgo(14) }
  },
  {
    id: 'l-2',
    name: 'María Fernández',
    email: 'maria.f@example.com',
    phone: '+1 809 555 2345',
    source: 'WhatsApp',
    status: LeadStatus.VISIT_SCHEDULED,
    budget: 280000,
    interestArea: 'Santo Domingo Este',
    createdAt: daysAgo(10),
    lastContactDate: daysAgo(2),
    nextFollowUpDate: daysFromNow(0),
    notes: 'Visita programada para hoy. Muy interesada en inversión.',
    score: { total: 25, percentage: 83, category: 'HOT', qualifiedAt: daysAgo(9) }
  },
  {
    id: 'l-3',
    name: 'Roberto Méndez',
    email: 'roberto.m@gmail.com',
    phone: '+1 809 555 3456',
    source: 'Referido',
    status: LeadStatus.CONTACTED,
    budget: 450000,
    interestArea: 'Santiago',
    createdAt: daysAgo(7),
    lastContactDate: daysAgo(3),
    nextFollowUpDate: daysFromNow(2),
    notes: 'Referido por Carlos. Busca villa para familia.',
    score: { total: 24, percentage: 80, category: 'HOT', qualifiedAt: daysAgo(6) }
  },

  // Leads WARM ☀️
  {
    id: 'l-4',
    name: 'Ana García',
    email: 'ana.garcia@example.com',
    phone: '+1 809 555 4567',
    source: 'Instagram',
    status: LeadStatus.CONTACTED,
    budget: 200000,
    interestArea: 'Bávaro',
    createdAt: daysAgo(12),
    lastContactDate: daysAgo(4),
    nextFollowUpDate: daysFromNow(1),
    notes: 'Busca inversión para alquiler a corto plazo.',
    score: { total: 18, percentage: 60, category: 'WARM', qualifiedAt: daysAgo(11) }
  },
  {
    id: 'l-5',
    name: 'José Pérez',
    email: 'jose.perez@hotmail.com',
    phone: '+1 809 555 5678',
    source: 'Facebook',
    status: LeadStatus.NEW,
    budget: 180000,
    interestArea: 'La Romana',
    createdAt: daysAgo(5),
    nextFollowUpDate: daysFromNow(0),
    notes: 'Preguntó por apartamentos cerca de la playa.',
    score: { total: 16, percentage: 53, category: 'WARM', qualifiedAt: daysAgo(4) }
  },
  {
    id: 'l-6',
    name: 'Laura Jiménez',
    email: 'laura.j@example.com',
    phone: '+1 809 555 6789',
    source: 'SuperCasas',
    status: LeadStatus.CONTACTED,
    budget: 320000,
    interestArea: 'Puerto Plata',
    createdAt: daysAgo(8),
    lastContactDate: daysAgo(6),
    nextFollowUpDate: daysFromNow(3),
    notes: 'Interesada pero necesita hablar con esposo.',
    score: { total: 17, percentage: 57, category: 'WARM', qualifiedAt: daysAgo(7) }
  },

  // Leads COLD ❄️
  {
    id: 'l-7',
    name: 'Pedro Santana',
    email: 'pedro.s@example.com',
    phone: '+1 809 555 7890',
    source: 'Corotos',
    status: LeadStatus.NEW,
    budget: 100000,
    interestArea: 'No definida',
    createdAt: daysAgo(3),
    nextFollowUpDate: daysFromNow(5),
    notes: 'Solo explorando opciones.',
    score: { total: 8, percentage: 27, category: 'COLD', qualifiedAt: daysAgo(2) }
  },
  {
    id: 'l-8',
    name: 'Carmen Díaz',
    email: 'carmen.d@example.com',
    phone: '+1 809 555 8901',
    source: 'Instagram',
    status: LeadStatus.CONTACTED,
    budget: 150000,
    interestArea: 'Cualquier zona',
    createdAt: daysAgo(20),
    lastContactDate: daysAgo(15),
    nextFollowUpDate: daysFromNow(7),
    notes: 'No tiene prisa. Tal vez el próximo año.',
    score: { total: 10, percentage: 33, category: 'COLD', qualifiedAt: daysAgo(19) }
  },

  // Leads sin calificar
  {
    id: 'l-9',
    name: 'Miguel Torres',
    email: 'miguel.t@example.com',
    phone: '+1 809 555 9012',
    source: 'WhatsApp',
    status: LeadStatus.NEW,
    budget: 0,
    interestArea: 'Por definir',
    createdAt: daysAgo(1),
    nextFollowUpDate: daysFromNow(0),
    notes: 'Lead nuevo de hoy. Pendiente calificar.',
  },
  {
    id: 'l-10',
    name: 'Sofía Herrera',
    email: 'sofia.h@example.com',
    phone: '+1 809 555 0123',
    source: 'Telegram',
    status: LeadStatus.NEW,
    budget: 250000,
    interestArea: 'Punta Cana',
    createdAt: daysAgo(0),
    nextFollowUpDate: daysFromNow(1),
    notes: 'Llegó hoy por broadcast de Telegram.',
  },

  // Leads cerrados
  {
    id: 'l-11',
    name: 'Fernando Núñez',
    email: 'fernando.n@example.com',
    phone: '+1 809 555 1111',
    source: 'Referido',
    status: LeadStatus.CLOSED_WON,
    budget: 380000,
    interestArea: 'Cap Cana',
    createdAt: daysAgo(45),
    lastContactDate: daysAgo(5),
    nextFollowUpDate: daysAgo(5),
    notes: '¡CERRADO! Compró apartamento en Cap Cana.',
    score: { total: 28, percentage: 93, category: 'HOT', qualifiedAt: daysAgo(44) }
  },
  {
    id: 'l-12',
    name: 'Patricia Vega',
    email: 'patricia.v@example.com',
    phone: '+1 809 555 2222',
    source: 'Instagram',
    status: LeadStatus.CLOSED_WON,
    budget: 195000,
    interestArea: 'Santo Domingo',
    createdAt: daysAgo(30),
    lastContactDate: daysAgo(10),
    nextFollowUpDate: daysAgo(10),
    notes: '¡CERRADO! Firma la semana pasada.',
    score: { total: 22, percentage: 73, category: 'WARM', qualifiedAt: daysAgo(29) }
  },
  {
    id: 'l-13',
    name: 'Ricardo Castillo',
    email: 'ricardo.c@example.com',
    phone: '+1 809 555 3333',
    source: 'Facebook',
    status: LeadStatus.CLOSED_LOST,
    budget: 500000,
    interestArea: 'Casa de Campo',
    createdAt: daysAgo(60),
    lastContactDate: daysAgo(25),
    nextFollowUpDate: daysAgo(25),
    notes: 'Perdido - decidió comprar en Miami.',
    score: { total: 20, percentage: 67, category: 'WARM', qualifiedAt: daysAgo(59) }
  }
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p-1',
    title: 'Apartamento Frente al Mar',
    address: 'Bávaro, Punta Cana',
    price: 285000,
    status: PropertyStatus.AVAILABLE,
    bedrooms: 2,
    bathrooms: 2,
    sqMeters: 95,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    ownerName: 'Desarrolladora XYZ',
    ownerPhone: '+1 809 555 4444'
  },
  {
    id: 'p-2',
    title: 'Penthouse con Vista Golf',
    address: 'Cap Cana, La Altagracia',
    price: 520000,
    status: PropertyStatus.AVAILABLE,
    bedrooms: 3,
    bathrooms: 3,
    sqMeters: 180,
    imageUrl: 'https://picsum.photos/400/300?random=2',
    ownerName: 'Inversiones Premium',
    ownerPhone: '+1 809 555 5555'
  },
  {
    id: 'p-3',
    title: 'Villa Familiar con Piscina',
    address: 'Santiago de los Caballeros',
    price: 450000,
    status: PropertyStatus.RESERVED,
    bedrooms: 4,
    bathrooms: 3,
    sqMeters: 280,
    imageUrl: 'https://picsum.photos/400/300?random=3',
    ownerName: 'Juan Propietario',
    ownerPhone: '+1 809 555 6666'
  },
  {
    id: 'p-4',
    title: 'Estudio Moderno Centro',
    address: 'Naco, Santo Domingo',
    price: 125000,
    status: PropertyStatus.AVAILABLE,
    bedrooms: 1,
    bathrooms: 1,
    sqMeters: 55,
    imageUrl: 'https://picsum.photos/400/300?random=4',
    ownerName: 'María Dueña',
    ownerPhone: '+1 809 555 7777'
  },
  {
    id: 'p-5',
    title: 'Apartamento Playa Dorada',
    address: 'Puerto Plata',
    price: 175000,
    status: PropertyStatus.SOLD,
    bedrooms: 2,
    bathrooms: 1,
    sqMeters: 85,
    imageUrl: 'https://picsum.photos/400/300?random=5',
    ownerName: 'Vendedor ABC',
    ownerPhone: '+1 809 555 8888'
  }
];

export const MOCK_KPIS: DailyKPI[] = [
  { date: '2025-12-09', callsMade: 15, emailsSent: 8, visitsConducted: 1, newLeads: 3 },
  { date: '2025-12-10', callsMade: 12, emailsSent: 10, visitsConducted: 2, newLeads: 2 },
  { date: '2025-12-11', callsMade: 18, emailsSent: 5, visitsConducted: 0, newLeads: 4 },
  { date: '2025-12-12', callsMade: 22, emailsSent: 12, visitsConducted: 3, newLeads: 5 },
  { date: '2025-12-13', callsMade: 10, emailsSent: 6, visitsConducted: 1, newLeads: 2 },
  { date: '2025-12-14', callsMade: 8, emailsSent: 4, visitsConducted: 2, newLeads: 1 },
  { date: '2025-12-15', callsMade: 14, emailsSent: 9, visitsConducted: 1, newLeads: 2 },
];
