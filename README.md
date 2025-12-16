# NEXUS CRM

**CRM especializado para el sector inmobiliario en República Dominicana**

Sistema de gestión de relaciones con clientes diseñado específicamente para agentes inmobiliarios, con enfoque en el mercado dominicano.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage)
- **State:** Local Storage + React State

## Características Implementadas

### Dashboard
- [x] KPIs principales (leads totales, nuevos, conversiones, valor pipeline)
- [x] Alertas críticas de seguimiento vencido
- [x] **Agenda Hoy** - Tareas programadas del día actual
- [x] Vista de leads que requieren atención inmediata

### Gestión de Leads (Leads Flow)
- [x] Lista de leads con filtros y búsqueda
- [x] **Vista Kanban** con drag & drop entre estados
- [x] Estados: Nuevo → Contactado → En Negociación → Visita Programada → Propuesta → Cerrado Ganado/Perdido
- [x] Detalle completo del lead con edición inline
- [x] Historial de actividades por lead
- [x] Lead scoring automático

### Sistema de Seguimiento (Follow-up Tracker)
- [x] Programación de tareas (Llamada, WhatsApp, Email, Visita, Otro)
- [x] Selector de tiempo de alerta (15min, 30min, 1h, 2h)
- [x] **Alertas WhatsApp** - Notificaciones automáticas al teléfono
- [x] Alertas de sonido en navegador
- [x] Notificaciones del sistema
- [x] Completar tareas desde Dashboard

### Marketing
- [x] Gestión de campañas de marketing
- [x] Seguimiento de fuentes de leads

### Captaciones
- [x] Búsqueda semi-automática con IA
- [x] Upload de screenshots de propiedades
- [x] Extracción de datos de publicaciones

### Configuraciones
- [x] **Perfil de Usuario** - Configuración personal
- [x] Número de WhatsApp para alertas
- [x] Preferencias de notificaciones
- [x] Test de conexión WhatsApp

### Métricas
- [x] Dashboard de métricas y analytics
- [x] Reportes de conversión

## Roadmap

### Fase 1 - MVP Core ✅ COMPLETADO
- [x] Sistema de autenticación
- [x] CRUD de leads
- [x] Dashboard básico
- [x] Sistema de estados

### Fase 2 - Productividad ✅ COMPLETADO
- [x] Vista Kanban con drag & drop
- [x] Sistema de tareas programadas
- [x] Alertas WhatsApp
- [x] Agenda en Dashboard
- [x] Perfil de usuario

### Fase 3 - Inteligencia (En Progreso)
- [ ] Lead scoring avanzado con ML
- [ ] Predicción de cierre
- [ ] Recomendaciones automáticas de seguimiento
- [ ] Análisis de sentimiento en notas

### Fase 4 - Integraciones
- [ ] WhatsApp Business API (mensajes directos)
- [ ] Integración con portales inmobiliarios (Corotos, SuperCasas)
- [ ] Sincronización con Google Calendar
- [ ] Integración con email

### Fase 5 - Escalabilidad
- [ ] Multi-usuario / Equipos
- [ ] Roles y permisos
- [ ] Reportes avanzados exportables
- [ ] API pública

## Instalación

```bash
# Clonar repositorio
git clone [repo-url]
cd NEXUSRD

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de Supabase

# Iniciar en desarrollo
npm run dev
```

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Ejecutar linter
```

## Estructura del Proyecto

```
src/
├── components/       # Componentes React
│   ├── Dashboard.tsx
│   ├── LeadsManager.tsx
│   ├── LeadDetail.tsx
│   ├── LeadFollowUpTracker.tsx
│   ├── UserProfileSettings.tsx
│   └── ...
├── services/         # Servicios y lógica de negocio
│   ├── leadScoring.ts
│   ├── userProfile.ts
│   └── ...
├── types/            # Definiciones TypeScript
├── lib/              # Utilidades y configuración
└── assets/           # Recursos estáticos
```

## Última Actualización

**Diciembre 16, 2025**
- Dashboard: Agenda Hoy muestra tareas programadas del día
- Sistema de alertas WhatsApp funcional
- Vista Kanban con drag & drop
- Perfil de usuario con configuración de alertas
- Reorganización del menú de navegación

---

Desarrollado para el mercado inmobiliario de República Dominicana 🇩🇴
