import React, { useState } from 'react';
import { Database, GitBranch, Terminal, Webhook, Copy, Check } from 'lucide-react';
import UserProfileSettings from './UserProfileSettings';
import { useUserRole } from '../hooks/useUserRole';

const ArchitectureInfo: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const { canViewSettings } = useUserRole();
  
  const WEBHOOK_URL = 'https://n8n.srv806559.hstgr.cloud/webhook/nexus-lead';
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      {/* User Profile Settings - Visible para TODOS */}
      <UserProfileSettings />

      {/* Webhook y Configuración técnica - Solo supervisores/admins */}
      {canViewSettings && (
        <>
          {/* Webhook Integration Card */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Webhook className="text-green-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">🔗 Webhook de Integración</h2>
            <p className="text-gray-400 text-sm">Conecta portales inmobiliarios y recibe leads automáticamente</p>
          </div>
        </div>
        
        <div className="bg-black/30 p-4 rounded-lg border border-white/10 mb-4">
          <p className="text-xs text-gray-500 mb-2">URL del Webhook (n8n):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-green-400 text-sm bg-black/50 p-3 rounded font-mono break-all">
              {WEBHOOK_URL}
            </code>
            <button
              onClick={() => copyToClipboard(WEBHOOK_URL, 'webhook')}
              className={`p-3 rounded-lg transition-all ${
                copied === 'webhook' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-nexus-accent/20 text-nexus-accent hover:bg-nexus-accent/30'
              }`}
              title="Copiar URL"
            >
              {copied === 'webhook' ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-black/20 p-4 rounded-lg">
            <h4 className="font-bold text-white mb-2">📤 Formato de envío (POST)</h4>
            <pre className="text-xs text-gray-400 overflow-x-auto">
{`{
  "name": "Nombre del lead",
  "phone": "+1 809 555 1234",
  "email": "email@ejemplo.com",
  "source": "Facebook Ads",
  "message": "Mensaje del cliente"
}`}
            </pre>
            <button
              onClick={() => copyToClipboard(`{
  "name": "Nombre del lead",
  "phone": "+1 809 555 1234",
  "email": "email@ejemplo.com",
  "source": "Facebook Ads",
  "message": "Mensaje del cliente"
}`, 'json')}
              className="mt-2 text-xs text-nexus-accent hover:underline flex items-center gap-1"
            >
              {copied === 'json' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'json' ? 'Copiado!' : 'Copiar JSON'}
            </button>
          </div>
          
          <div className="bg-black/20 p-4 rounded-lg">
            <h4 className="font-bold text-white mb-2">✅ Acciones automáticas</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>📧 Email de notificación instantáneo</li>
              <li>📊 Guardado en Google Sheets</li>
              <li>💬 (Próximamente) WhatsApp auto-reply</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Facebook Ads</span>
          <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs">Instagram</span>
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">SuperCasas</span>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Encuentra24</span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Zapier</span>
        </div>
      </div>

      <div className="bg-nexus-surface p-8 rounded-xl border border-nexus-accent/20">
        <h2 className="text-3xl font-bold text-nexus-accent mb-6">Configuraciones</h2>
        <p className="text-gray-300 mb-6">
          A continuación se presenta el análisis arquitectónico solicitado para la migración de Excel a PWA.
        </p>

        {/* 1. Database Schema */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-blue-400" />
            <h3 className="text-xl font-bold text-white">1. Esquema Relacional Unificado</h3>
          </div>
          <div className="bg-black/30 p-4 rounded text-sm font-mono text-gray-300 border border-white/10">
            <p className="text-green-400">// Tabla Users (Auth)</p>
            <p className="mb-2">id (UUID), email, role, full_name</p>
            
            <p className="text-green-400">// Tabla Leads (Unified 'Leads Flow' & 'Seguimiento')</p>
            <p className="mb-2">id (UUID), status (ENUM), source, probability_score, next_action_date (INDEX), assigned_to_user_id (FK)</p>

            <p className="text-green-400">// Tabla Properties ('Captaciones')</p>
            <p className="mb-2">id, address, price, commission_percentage, owner_contact_json, status</p>

            <p className="text-green-400">// Tabla Interactions (Log)</p>
            <p>id, lead_id (FK), type, notes, timestamp (AUTO)</p>
          </div>
        </section>

        {/* 2. Data Flow */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="text-purple-400" />
            <h3 className="text-xl font-bold text-white">2. Flujo de Datos (Data Flow)</h3>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li><strong className="text-white">Ingesta:</strong> Portal Inmobiliario &rarr; Webhook (Node.js/Edge Function) &rarr; <span className="text-nexus-accent">Supabase DB</span>.</li>
            <li><strong className="text-white">Procesamiento:</strong> Trigger en DB detecta `INSERT` &rarr; Asigna estado "NUEVO" &rarr; Crea Tarea Programada (+2h).</li>
            <li><strong className="text-white">Notificación:</strong> Cron Job revisa cada 15 min leads sin contactar &rarr; Envía Push Notification a PWA/Móvil.</li>
            <li><strong className="text-white">Cliente:</strong> React Query actualiza la UI en tiempo real cuando cambia el estado.</li>
          </ul>
        </section>

        {/* 3. Prompt */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="text-green-400" />
            <h3 className="text-xl font-bold text-white">3. Prompt Técnico (Para IA)</h3>
          </div>
          <p className="text-xs text-gray-400 mb-2">Copia este prompt para generar el backend real en Supabase/Firebase:</p>
          <div className="bg-black/50 p-4 rounded border border-white/10 overflow-x-auto">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
{`"Actúa como Senior Backend Engineer. Genera un script de inicialización para Supabase (PostgreSQL) para un CRM Inmobiliario.
Requisitos:
1. Tablas: 'leads' (con estados: NEW, CONTACTED, etc.), 'properties', 'interactions', 'tasks'.
2. Row Level Security (RLS): Solo el usuario autenticado puede ver sus leads.
3. Database Function: Una función 'handle_new_lead' que se active tras un INSERT en 'leads' y cree automáticamente una entrada en 'tasks' con fecha de vencimiento +2 horas.
4. Edge Function Stub: Un endpoint TypeScript para recibir un JSON genérico de portales inmobiliarios (Idealista/Fotocasa), normalizar los datos y hacer insert en 'leads'.
5. Crea índices para 'next_follow_up_date' para optimizar consultas de alertas."`}
            </pre>
          </div>
        </section>
      </div>
      </>
      )}
    </div>
  );
};

export default ArchitectureInfo;
