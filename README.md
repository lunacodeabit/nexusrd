# CRM ALVEARE 🐝

**CRM especializado para el sector inmobiliario en República Dominicana**

Sistema de gestión de relaciones con clientes diseñado específicamente para agentes inmobiliarios, con enfoque en el mercado dominicano. Aplicación PWA instalable en dispositivos móviles.

---

## 🛠 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 7.3
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage)
- **State:** Local Storage + React State
- **PWA:** Service Worker + Web App Manifest

---

## ✅ Características Implementadas

### Dashboard
- [x] KPIs principales (leads totales, nuevos, conversiones, valor pipeline)
- [x] Alertas críticas de seguimiento vencido
- [x] **Agenda Hoy** - Tareas programadas del día actual con edición inline
- [x] Vista de leads que requieren atención inmediata
- [x] Completar/editar tareas directamente desde Dashboard

### Gestión de Leads (Leads Flow)
- [x] Lista de leads con filtros y búsqueda
- [x] **Vista Kanban** con drag & drop entre estados (desktop)
- [x] Vista lista responsive (móvil)
- [x] Estados: Nuevo → Contactado → En Negociación → Visita Programada → Propuesta → Cerrado
- [x] Detalle completo del lead con edición inline
- [x] Historial de actividades por lead
- [x] Lead scoring automático

### Sistema de Seguimiento (Follow-up Tracker)
- [x] Programación de tareas (Llamada, WhatsApp, Email, Visita, Otro)
- [x] Selector de tiempo de alerta (15min, 30min, 1h, 2h)
- [x] **Alertas WhatsApp** - Notificaciones automáticas al teléfono
- [x] Alertas de sonido en navegador
- [x] Notificaciones push del sistema
- [x] Edición de tareas programadas
- [x] Sistema de alertas global (funciona en cualquier vista)

### Marketing
- [x] Gestión de campañas de marketing
- [x] Seguimiento de fuentes de leads

### Captaciones
- [x] Búsqueda semi-automática con IA (Google, Maps, LinkedIn)
- [x] Upload de screenshots de propiedades
- [x] Extracción de datos de publicaciones
- [x] Estados de captación (Pendiente, Contactado, En Negociación, Captado, Descartado)

### Configuraciones
- [x] **Perfil de Usuario** - Configuración personal
- [x] Número de WhatsApp para alertas
- [x] Preferencias de notificaciones (sonido, browser, WhatsApp)
- [x] Test de conexión WhatsApp
- [x] **Cerrar Sesión**

### PWA & Mobile
- [x] Aplicación instalable (PWA)
- [x] Diseño responsive completo
- [x] Menú hamburguesa + bottom navigation (móvil)
- [x] Botones de acción siempre visibles en móvil
- [x] Service Worker para funcionamiento offline
- [x] Test de conexión WhatsApp

### Métricas
- [x] Dashboard de métricas y analytics
- [x] Reportes de conversión

---

## 🗺 Roadmap

### Fase 1 - MVP Core ✅ COMPLETADA
- [x] Sistema de autenticación (Supabase Auth)
- [x] CRUD de leads
- [x] Dashboard básico
- [x] Sistema de estados del pipeline

### Fase 2 - Productividad ✅ COMPLETADA
- [x] Vista Kanban con drag & drop (desktop)
- [x] Sistema de tareas programadas con alertas
- [x] Alertas WhatsApp automáticas
- [x] Agenda Hoy en Dashboard
- [x] Perfil de usuario y configuraciones
- [x] Edición de tareas desde cualquier vista
- [x] PWA instalable
- [x] Diseño mobile-first responsive
- [x] Cerrar sesión

### Fase 3 - Inteligencia (Próxima)
- [ ] Lead scoring avanzado con ML
- [ ] Predicción de probabilidad de cierre
- [ ] Recomendaciones automáticas de siguiente acción
- [ ] Análisis de sentimiento en notas
- [ ] Métricas de actividad personal (score de disciplina)
- [ ] Metas configurables por usuario

### Fase 4 - Integraciones
- [ ] WhatsApp Business API (mensajes directos sin abrir browser)
- [ ] Integración con portales inmobiliarios (Corotos, SuperCasas)
- [ ] Sincronización bidireccional con Google Calendar
- [ ] Integración con email (Gmail, Outlook)
- [ ] Webhooks para leads automáticos desde landing pages

### Fase 5 - SuperAdmin & Equipos 🚧 EN PROGRESO
- [x] Portal SuperAdmin para supervisores (frontend)
- [x] Dashboard de equipo con métricas por asesor
- [x] Ranking de asesores (conversiones, actividad, velocidad)
- [x] Alertas de inactividad ("Juan no ha registrado actividad en 3 días")
- [x] Vista individual de cada asesor (leads, tareas, actividad)
- [x] Sistema de roles (asesor/supervisor/admin)
- [x] Row Level Security policies (SQL listo)
- [ ] Migración de tareas localStorage → Supabase
- [ ] Asignación y distribución de leads
- [ ] Sistema de coaching (notas/feedback a asesores)
- [ ] Gamificación (badges, reconocimientos)
- [ ] Reportes exportables para reuniones

> **Nota:** El frontend del SuperAdmin está completo. Para activarlo, ejecuta el SQL de migración.
> Ver: [docs/SUPERADMIN_SETUP.md](docs/SUPERADMIN_SETUP.md)

---

## 📱 Instalación PWA (Móvil)

1. Abre la app en Chrome desde tu teléfono
2. Toca los 3 puntos (menú)
3. Selecciona "Añadir a pantalla de inicio" o "Instalar app"
4. ¡Listo! La app aparecerá como icono en tu home

---

## 💻 Instalación Desarrollo

```bash
# Clonar repositorio
git clone https://github.com/lunacodeabit/nexusrd.git
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
npm run dev      # Servidor de desarrollo (localhost:5173)
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Ejecutar linter
```

---

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── Dashboard.tsx    # Dashboard principal con KPIs y Agenda
│   ├── LeadsManager.tsx # Gestión de leads (Lista + Kanban)
│   ├── LeadDetail.tsx   # Detalle y edición de lead
│   ├── LeadFollowUpTracker.tsx  # Sistema de seguimientos
│   ├── UserProfileSettings.tsx  # Configuración de usuario
│   ├── Layout.tsx       # Layout con navegación
│   ├── CaptacionesView.tsx      # Módulo de captaciones
│   └── ...
├── hooks/               # Custom hooks
│   ├── useLeads.ts      # Hook para gestión de leads
│   ├── useTaskAlerts.ts # Hook global de alertas
│   └── ...
├── services/            # Servicios y lógica de negocio
│   ├── leadScoring.ts   # Algoritmo de scoring
│   ├── userProfile.ts   # Perfil y alertas WhatsApp
│   └── ...
├── contexts/            # React Context
│   └── AuthContext.tsx  # Autenticación Supabase
├── types/               # Definiciones TypeScript
└── lib/                 # Utilidades (Supabase client)
```

---

## 🔑 Variables de Entorno

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

---

## 📝 Notas de Desarrollo

### Lecciones Aprendidas
- Las alertas deben ejecutarse a nivel de App.tsx (global), no en componentes específicos
- Los botones hover-only no funcionan en móvil - usar `md:opacity-0 md:group-hover:opacity-100`
- WhatsApp Web API tiene limitaciones con emojis especiales - usar texto plano
- El Kanban drag & drop nativo funciona bien en desktop pero requiere librerías especiales para touch

### Convenciones
- Prefijo `_` para variables intencionalmente no usadas (preparadas para futuro)
- Colores de marca: `nexus-accent` (naranja), `nexus-base` (azul oscuro), `nexus-surface` (gris)
- Todos los componentes son responsive por defecto

---

## 🚀 Última Actualización

**Diciembre 16, 2025**
- Nombre actualizado a CRM ALVEARE
- Sistema de alertas WhatsApp funcionando correctamente
- Edición de tareas desde Dashboard
- Botón de cerrar sesión
- Limpieza de código (0 warnings)
- PWA manifest actualizado
- Mobile responsive completo

---

Desarrollado para el mercado inmobiliario de República Dominicana 🇩🇴
├── types/            # Definiciones TypeScript
├── lib/              # Utilidades y configuración
└── assets/           # Recursos estáticos
```

## Última Actualización

**Diciembre 16, 2025 (v2.0)**
- ✨ **SuperAdmin Dashboard** - Panel de supervisión para managers
- 📊 Ranking de asesores con métricas de rendimiento
- ⚠️ Alertas de inactividad (3+ días sin actividad)
- 👤 Vista detallada por asesor (leads, tareas, actividad)
- 🔐 Sistema de roles (asesor/supervisor/admin)
- 📝 SQL de migración para nuevas tablas
- 🐛 Corrección de errores menores

---

Desarrollado para el mercado inmobiliario de República Dominicana 🇩🇴
