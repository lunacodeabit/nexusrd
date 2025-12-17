# 🧠 ALVEARE CRM - Memoria del Agente

> **Propósito:** Este documento sirve como memoria para continuar el desarrollo del CRM ALVEARE.  
> **Última actualización:** 17 de Diciembre, 2025 - 4:00 PM  
> **Sesión actual:** Implementación de alertas del servidor  

---

## 🎯 Contexto del Proyecto

### ¿Qué es ALVEARE CRM?
CRM especializado para **agentes inmobiliarios en República Dominicana**. Diseñado para reemplazar Excel y WhatsApp disperso con un sistema centralizado.

### Usuario Principal
- **Nombre:** Howard Luna
- **Rol:** Agente inmobiliario / Desarrollador
- **Telegram Chat ID:** 5087918257
- **User ID (Supabase):** 82cfb6cd-0d39-437f-83dc-67c2de83023e

---

## 🔧 Stack Técnico

```
Frontend:     React 19 + TypeScript + Vite 7.3 + Tailwind CSS
Backend:      Supabase (PostgreSQL + Auth + Storage)
Hosting:      Netlify (con Functions serverless)
Alertas:      Telegram Bot API + Netlify Scheduled Functions
```

### URLs Importantes
- **Producción:** https://alvearecrm.netlify.app
- **Supabase:** https://supabase.com/dashboard/project/lldhpidjcjyjldhpbjql
- **Netlify:** https://app.netlify.com (buscar proyecto NEXUSRD)
- **GitHub:** https://github.com/lunacodeabit/nexusrd

### Credenciales (en Netlify Env Vars)
- `VITE_SUPABASE_URL` - URL del proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave pública de Supabase
- `SUPABASE_SERVICE_KEY` - Clave de servicio (acceso total, bypassea RLS)
- `TELEGRAM_BOT_TOKEN` - Token del bot @alveare_crm_bot

---

## 📅 Historial de Sesiones

### Sesión 17 Dic 2025 (HOY)
**Problema inicial:** Los datos del perfil y las tareas se borraban al cerrar el navegador.

**Causa raíz:** Se estaba usando `localStorage` en lugar de Supabase.

**Soluciones implementadas:**
1. Creamos columnas nuevas en `user_profiles`:
   - telegram_chat_id, whatsapp_number
   - enable_telegram_alerts, enable_whatsapp_alerts
   - enable_sound_alerts, enable_browser_notifications
   - default_alert_time

2. Creamos tabla `personal_tasks` para el planner:
   - Con campo `alert_sent` para trackear alertas enviadas
   - RLS habilitado para seguridad

3. Creamos `userProfileService.ts`:
   - Funciones para leer/escribir perfil en Supabase
   - Migración automática de localStorage a Supabase

4. Creamos `useUserProfile.ts`:
   - Hook de React para manejar el perfil
   - Cache local para evitar queries repetidos

5. **GRAN LOGRO:** Implementamos `scheduled-alerts.js`:
   - Función de Netlify que corre cada minuto
   - Lee tareas de `personal_tasks` donde alert_sent = false
   - Calcula si es hora de enviar alerta
   - Envía mensaje a Telegram
   - Marca alert_sent = true
   - **¡FUNCIONA SIN NAVEGADOR ABIERTO!**

**Bugs encontrados y resueltos:**
- Follow-ups no actualizaban fecha de último contacto → Agregamos update al guardar follow-up
- Telegram no funcionaba en localhost → Agregamos llamada directa a API para dev
- Scheduled function no encontraba tareas → El formato de fecha/hora era correcto, pero la tabla estaba vacía inicialmente

---

## 🗂 Estructura de Archivos Relevantes

```
NEXUSRD/
├── netlify/
│   └── functions/
│       ├── scheduled-alerts.js    ← Alertas del servidor (NUEVO)
│       ├── telegram-send.js       ← Enviar mensaje manual
│       └── telegram-webhook.js    ← Recibir mensajes del bot
├── src/
│   ├── components/
│   │   └── UserProfileSettings.tsx  ← Config de usuario (modificado)
│   ├── hooks/
│   │   ├── useUserProfile.ts        ← Hook de perfil (NUEVO)
│   │   ├── usePersonalTasks.ts      ← Hook de tareas
│   │   └── usePersonalTaskAlerts.ts ← Alertas client-side
│   ├── services/
│   │   ├── userProfileService.ts    ← CRUD perfil (NUEVO)
│   │   └── telegramService.ts       ← Envío Telegram
│   └── lib/
│       └── supabase.ts              ← Cliente Supabase
├── supabase/
│   └── migrations/
│       ├── 002_user_profile_settings.sql  ← Columnas perfil
│       ├── 005_personal_tasks.sql         ← Tabla tareas
│       └── 006_fix_personal_tasks_rls.sql ← Fix RLS
└── netlify.toml                     ← Config scheduled function
```

---

## 🔑 Decisiones de Diseño

### ¿Por qué Netlify Scheduled Functions?
- Las alertas deben funcionar 24/7
- JavaScript en el navegador no puede correr cuando está cerrado
- Netlify ofrece funciones cron gratis
- Se ejecuta cada minuto para máxima precisión

### ¿Por qué Supabase Service Key para alertas?
- Row Level Security (RLS) bloquea acceso anónimo
- El servidor necesita leer todas las tareas de todos los usuarios
- Service Key bypasea RLS automáticamente

### ¿Por qué guardar en localStorage Y Supabase?
- localStorage: Fallback para offline
- Supabase: Persistencia real en la nube
- El código intenta Supabase primero, luego localStorage

---

## ⚠️ Problemas Conocidos

1. **Las alertas de follow-ups de leads NO usan el servidor todavía**
   - Solo las tareas personales (Mi Planner) tienen alertas del servidor
   - Los follow-ups aún dependen del navegador abierto

2. **Timezone:**
   - El servidor usa UTC
   - La República Dominicana usa AST (UTC-4)
   - Hay que considerar esto al calcular horas de alerta

3. **Límite de ejecuciones en Netlify Free:**
   - 125,000 invocaciones/mes gratis
   - 1 vez por minuto = ~43,200/mes → OK

---

## 🚀 Próximos Pasos Sugeridos

### Para la próxima sesión:

1. **Agregar alertas de follow-ups al servidor:**
   - Modificar `scheduled-alerts.js` para también revisar `follow_ups`
   - Enviar alerta cuando se acerque hora de llamada/visita

2. **Mejorar mensaje de Telegram:**
   - Incluir nombre del lead si aplica
   - Agregar botón para abrir el CRM directamente

3. **Dashboard de próximas alertas:**
   - Mostrar las alertas que se enviarán hoy
   - Permitir cancelar/posponer

4. **Notificaciones de nuevos leads:**
   - Cuando entra un lead por webhook, notificar por Telegram

---

## 💡 Tips para Desarrollo

### Probar scheduled function localmente:
```bash
# No se puede probar localmente, usar "Run now" en Netlify
```

### Ver logs de la función:
1. Netlify Dashboard → Functions → scheduled-alerts → Logs

### Verificar datos en Supabase:
```sql
-- Ver tareas de hoy
SELECT * FROM personal_tasks WHERE scheduled_date = CURRENT_DATE;

-- Ver perfil del usuario
SELECT * FROM user_profiles WHERE id = '82cfb6cd-0d39-437f-83dc-67c2de83023e';
```

### Forzar redeploy:
```bash
git commit --allow-empty -m "Force redeploy"
git push
```

---

## 🎯 Definición de "Terminado"

Para considerar las alertas 100% completas:
- [x] Tareas personales con alertas ← DONE
- [ ] Follow-ups de leads con alertas
- [ ] Visitas programadas con alertas
- [ ] Nuevos leads notificados
- [ ] Resumen diario matutino

---

*Memoria actualizada: 17 Dic 2025, 4:00 PM*
