# 📋 NEXUS CRM - Instrucciones de Desarrollo

> **Archivo de Continuidad:** Usa este documento para retomar el desarrollo desde cualquier dispositivo.  
> **Última actualización:** 15 de Diciembre, 2025 - 1:45 PM  
> **Estado actual:** Beta funcional con webhook activo  

---

## 🎯 Visión General

### ¿Qué es NEXUS CRM?
Un CRM (Customer Relationship Management) diseñado específicamente para **agentes inmobiliarios en República Dominicana**. Reemplaza las hojas de Excel con una aplicación web moderna, móvil y automatizada.

### Problema que Resuelve
- Leads perdidos por falta de seguimiento
- Datos dispersos en WhatsApp, Excel, notas
- Sin visibilidad de qué actividades generan resultados
- Proceso de calificación inconsistente

### Usuario Objetivo
- Agentes inmobiliarios independientes
- Pequeñas/medianas agencias
- Asesores de inversión inmobiliaria

---

## 🚀 Cómo Iniciar el Proyecto

### Requisitos
- Node.js 18+ instalado
- npm o pnpm
- VS Code (recomendado)
- Docker (opcional, para n8n local)

### Comandos para Iniciar

```bash
# 1. Navegar al proyecto
cd C:\Users\howar\OneDrive\Desktop\NEXUSRD

# 2. Instalar dependencias (si es primera vez o nuevo dispositivo)
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:5173 (o el puerto que indique)
```

### Estructura del Proyecto
```
NEXUSRD/
├── src/
│   ├── components/       # Componentes React
│   ├── services/         # Lógica de negocio (scoring, export, etc.)
│   ├── types/            # TypeScript interfaces
│   ├── App.tsx           # Componente principal
│   └── main.tsx          # Entry point
├── public/               # Assets estáticos, PWA files
├── NEXUS_CRM_ROADMAP.md  # Roadmap técnico completo
├── INSTRUCTIONS.md       # Este archivo
└── package.json          # Dependencias
```

---

## ✅ Pasos Completados

### Fase 1: Setup Inicial ✓
- [x] Proyecto Vite + React + TypeScript creado
- [x] Tailwind CSS configurado con colores custom (nexus-base, nexus-surface, nexus-accent)
- [x] Estructura de carpetas organizada
- [x] PWA configurado (manifest.json, service worker)

### Fase 2: Core CRM ✓
- [x] Dashboard con KPIs
- [x] Gestión de leads (crear, ver, editar)
- [x] Gestión de propiedades/inventario
- [x] Navegación móvil (bottom tabs)
- [x] Modales y formularios funcionales

### Fase 3: Sistema de Calificación ✓
- [x] 10 preguntas de calificación implementadas
- [x] Algoritmo de scoring por puntos
- [x] Categorías HOT 🔥 / WARM 🌡️ / COLD ❄️
- [x] Indicadores visuales en tarjetas de leads

### Fase 4: Actividades Diarias ✓
- [x] Checklist por horarios (8AM, 8:30AM, 3PM, 6PM)
- [x] Categorías: Posts, Subidas, Aprendizaje, Prospección
- [x] Progreso diario/semanal
- [x] Navegación por fechas

### Fase 5: Seguimiento S1-S12 ✓
- [x] Barra de progreso de seguimientos
- [x] Registro de método (WhatsApp, Llamada, Email, Visita)
- [x] Estado de respuesta
- [x] Notas por seguimiento
- [x] Timeline cronológico

### Fase 6: Analytics ✓
- [x] Gráficos de correlación actividad-resultados
- [x] Efectividad por número de seguimiento
- [x] Distribución de leads por estado/score
- [x] Insights generados
- [x] Exportar a CSV

### Fase 7: Notificaciones ✓
- [x] Permisos de notificación del navegador
- [x] Sonidos via Web Audio API (sin archivos externos)
- [x] Sonido urgente para leads HOT
- [x] Sonido de éxito para completar tareas

### Fase 8: Webhook n8n ✓
- [x] Workflow en n8n configurado y ACTIVO
- [x] URL: `https://n8n.srv806559.hstgr.cloud/webhook/nexus-lead`
- [x] Email de notificación con formato HTML
- [x] Subject dinámico con nombre y fuente
- [x] Sección en app con botón de copiar URL

---

## ⏳ Pasos Pendientes (Por Orden de Prioridad)

### 🔴 Alta Prioridad

#### 1. Google Sheets Integration (n8n)
**Estado:** Pendiente  
**Tiempo estimado:** 30 minutos  
**Instrucciones:**
1. Abrir n8n: `https://n8n.srv806559.hstgr.cloud`
2. Editar workflow "NEXUS CRM - Leads"
3. Agregar nodo "Google Sheets" después de "Edit Fields"
4. Conectar credenciales de Google
5. Configurar: Append Row a un spreadsheet nuevo
6. Mapear campos: name, phone, email, source, message, fecha
7. Guardar y probar

#### 2. WhatsApp Business API
**Estado:** Pendiente (requiere setup de Meta)  
**Tiempo estimado:** 2-4 horas  
**Prerrequisitos:**
- [ ] Cuenta de Meta Business verificada
- [ ] Número de teléfono NO registrado en WhatsApp personal
- [ ] App creada en developers.facebook.com

**Pasos cuando esté listo:**
1. Crear app en Meta for Developers
2. Agregar producto WhatsApp
3. Obtener Phone Number ID y Access Token
4. Agregar nodo WhatsApp Cloud API en n8n
5. Crear template de mensaje de bienvenida
6. Conectar al workflow

#### 3. Backend + Persistencia de Datos
**Estado:** Pendiente  
**Tiempo estimado:** 4-6 horas  
**Opción recomendada:** Supabase  
**Pasos:**
1. Crear cuenta en supabase.com
2. Crear proyecto nuevo
3. Diseñar tablas: leads, properties, activities, follow_ups
4. Configurar Row Level Security (RLS)
5. Obtener API keys
6. Instalar @supabase/supabase-js en el proyecto
7. Reemplazar estado local con queries a Supabase

#### 4. Autenticación de Usuarios
**Estado:** Pendiente  
**Tiempo estimado:** 3-4 horas  
**Después de:** Backend configurado  
**Pasos:**
1. Habilitar Auth en Supabase
2. Crear componente de Login/Register
3. Implementar contexto de autenticación
4. Proteger rutas
5. Asociar leads al usuario autenticado

### 🟡 Media Prioridad

#### 5. Despliegue a Producción
**Opciones:**
- Vercel (recomendado, gratis)
- Netlify (alternativa)
- Hostinger (si ya tienes)

**Pasos para Vercel:**
1. Push código a GitHub
2. Conectar repo en vercel.com
3. Deploy automático
4. Configurar dominio custom (opcional)

#### 6. Importar Leads desde CSV
**Tiempo estimado:** 2 horas
- Componente de upload
- Parser de CSV
- Mapeo de columnas
- Validación de datos

#### 7. Integración con Portales Reales
- Investigar API de SuperCasas
- Configurar Facebook Lead Ads webhook
- Conectar Instagram Lead Forms

### 🟢 Baja Prioridad (Nice to Have)

- [ ] Tema claro/oscuro toggle
- [ ] Multi-idioma (EN/ES)
- [ ] Calculadora de comisiones
- [ ] Calendario con citas
- [ ] Notas de voz
- [ ] Generación de PDF reports

---

## 🔧 Configuraciones Importantes

### URLs y Credenciales

| Servicio | URL/Valor |
|----------|-----------|
| **n8n Dashboard** | `https://n8n.srv806559.hstgr.cloud` |
| **Webhook URL** | `https://n8n.srv806559.hstgr.cloud/webhook/nexus-lead` |
| **Dev Server** | `http://localhost:5173` (default Vite) |
| **Email notificaciones** | howard@alveare.do |

### Variables de Entorno (Cuando agregues backend)
```env
# .env.local (crear este archivo)
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_key_aqui
VITE_WEBHOOK_URL=https://n8n.srv806559.hstgr.cloud/webhook/nexus-lead
```

---

## 💡 Sugerencias para Mejorar el Proyecto

### Corto Plazo (Esta semana)
1. **Agregar localStorage** - Persistir datos básicos sin backend
2. **Mejorar iconos PWA** - Diseñar iconos profesionales
3. **Validación de formularios** - Mensajes de error claros
4. **Loading states** - Skeletons mientras carga

### Mediano Plazo (Este mes)
1. **Tests unitarios** - Jest + React Testing Library
2. **Error boundaries** - Manejo de errores graceful
3. **Analytics reales** - Google Analytics o Plausible
4. **SEO básico** - Meta tags para compartir

### Largo Plazo (Próximos 3 meses)
1. **App nativa** - React Native o Capacitor
2. **AI Assistant** - Sugerencias de siguiente acción
3. **White-label system** - Multi-tenant para revender
4. **Marketplace de integraciones** - Plugins de terceros

---

## 🧪 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor dev
npm run build            # Crear build de producción
npm run preview          # Preview del build

# Testing (cuando se agregue)
npm run test             # Correr tests
npm run test:coverage    # Tests con coverage

# Linting
npm run lint             # Revisar código

# Git (recomendado configurar)
git add .
git commit -m "descripción del cambio"
git push origin main
```

---

## 🐛 Problemas Conocidos y Soluciones

### Error: "Cannot find module..."
```bash
# Solución: Reinstalar dependencias
rm -rf node_modules
npm install
```

### Error: TypeScript enums
**Problema:** `verbatimModuleSyntax` no permite enums  
**Solución:** Usar `const objects as const` en lugar de enums

### Webhook no recibe datos
**Verificar:**
1. Workflow activo en n8n (toggle verde)
2. URL correcta (production, no test)
3. Content-Type: application/json en el request

### Notificaciones no suenan
**Verificar:**
1. Navegador permite audio (click primero en la página)
2. Volumen del sistema no está en mute
3. Permisos de notificación otorgados

---

## 📞 Retomar Desarrollo

### Checklist para Continuar
1. [ ] Abrir VS Code en `C:\Users\howar\OneDrive\Desktop\NEXUSRD`
2. [ ] Ejecutar `npm run dev`
3. [ ] Leer este archivo para recordar contexto
4. [ ] Revisar NEXUS_CRM_ROADMAP.md para detalles técnicos
5. [ ] Verificar que n8n workflow sigue activo
6. [ ] Continuar con el siguiente paso pendiente

### Contexto para IA (Copilot/ChatGPT)
Si necesitas ayuda de una IA, copia este contexto:

```
Estoy desarrollando NEXUS CRM, un CRM inmobiliario en React + TypeScript + Vite.
Stack: React 19, TypeScript 5.9, Tailwind CSS, Recharts, Lucide icons.
Backend pendiente (planificado Supabase).
Automatización con n8n (webhook activo).

Características completadas:
- Lead management con scoring (HOT/WARM/COLD)
- Daily activities tracker (checklist por horarios)
- Follow-up tracking S1-S12
- Analytics con correlación
- Notificaciones con sonido
- Webhook para recibir leads externos

Pendiente:
- Google Sheets integration
- WhatsApp Business API
- Backend con Supabase
- Autenticación
- Deploy a producción

El código está en: C:\Users\howar\OneDrive\Desktop\NEXUSRD
Documentación en: NEXUS_CRM_ROADMAP.md e INSTRUCTIONS.md
```

---

## 📅 Historial de Sesiones

### Sesión 1 - 15 Dic 2025
**Duración:** ~3 horas  
**Logros:**
- Setup completo del proyecto
- Todas las fases 1-8 completadas
- Webhook n8n funcionando
- Documentación creada

**Próxima sesión debería:**
- Configurar Google Sheets en n8n
- O iniciar setup de WhatsApp Business
- O configurar Supabase para persistencia

---

*Actualiza este archivo cada vez que termines una sesión de desarrollo.*
