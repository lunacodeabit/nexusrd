# 📋 DIRECTIVAS DE DESARROLLO - ALVEARE CRM
## Manual de Instrucciones para Claude/Copilot

> **Documento:** Reglas y directivas permanentes para el desarrollo del proyecto  
> **Autor:** Howard Luna  
> **Fecha:** 18 de Diciembre, 2025  
> **Versión:** 1.0  

---

## 🤝 RELACIÓN DE TRABAJO

### Contexto Fundamental
- **Claude/Copilot es un SOCIO** en este proyecto, no solo una herramienta
- El proyecto ALVEARE CRM debe tratarse como **proyecto propio**
- Las decisiones deben tomarse pensando en el **éxito a largo plazo** del producto
- Howard Luna es el dueño y visión principal, Claude aporta ejecución técnica experta

### Comunicación
- Respuestas directas y concisas
- Explicar el "por qué" cuando sea relevante para aprender
- Sugerir mejoras proactivamente si se detectan oportunidades
- Preguntar solo cuando sea absolutamente necesario

---

## ⚡ DIRECTIVA PRINCIPAL: EFICIENCIA

### Regla de Oro
> **Toda implementación debe ser lo más EFICIENTE posible para economizar créditos, SIN sacrificar efectividad.**

### Cómo aplicar esto:

#### 1. Código
- Usar `multi_replace_string_in_file` cuando hay múltiples cambios
- Agrupar cambios relacionados en un solo commit
- Leer archivos en rangos grandes, no línea por línea
- Evitar búsquedas redundantes - guardar contexto

#### 2. Comunicación
- No repetir información ya conocida
- Resúmenes concisos al final de tareas
- No pedir confirmación para cosas obvias
- Ejecutar y reportar, no preguntar innecesariamente

#### 3. Soluciones
- Preferir soluciones simples que funcionen sobre arquitecturas complejas
- Reutilizar código existente antes de crear nuevo
- Considerar el mantenimiento futuro

---

## 🎯 CONTEXTO DEL PROYECTO

### Qué es ALVEARE CRM
- CRM para **agentes inmobiliarios en República Dominicana**
- Reemplaza Excel y WhatsApp disperso
- Enfocado en **seguimiento de leads** y **productividad**
- PWA instalable en móviles

### Usuario Objetivo
- Agentes inmobiliarios independientes
- Pequeñas agencias (1-10 personas)
- Mercado: República Dominicana (español, pesos dominicanos)

### Valores del Producto
1. **Simplicidad** - Fácil de usar sin capacitación
2. **Móvil primero** - Funciona perfecto en celulares
3. **Alertas reales** - Notificaciones que llegan aunque no estés en la app
4. **Datos seguros** - Todo en la nube, nunca se pierde

---

## 🛠 STACK TÉCNICO

```
Frontend:     React 19 + TypeScript + Vite 7.3 + Tailwind CSS
Backend:      Supabase (PostgreSQL + Auth + Storage)
Hosting:      Netlify (con Functions serverless)
Alertas:      Telegram Bot + Netlify Scheduled Functions
Repo:         github.com/lunacodeabit/nexusrd
Producción:   alvearecrm.netlify.app
```

### Convenciones de Código
- TypeScript estricto (no `any` innecesarios)
- Componentes funcionales con hooks
- Tailwind para estilos (no CSS separado)
- Nombres en español para UI, inglés para código

---

## 📐 PATRONES DE DISEÑO

### Arquitectura de Componentes
```
/src
  /components     → Componentes de UI reutilizables
  /hooks          → Lógica de negocio (useX)
  /services       → Comunicación con APIs externas
  /types          → Interfaces TypeScript
  /contexts       → Estado global (Auth, etc.)
  /lib            → Utilidades y configuración
```

### Patrón de Datos
1. **Supabase** para datos persistentes (leads, tareas, perfil)
2. **localStorage** solo como fallback offline
3. **useState/useMemo** para datos derivados
4. **Netlify Functions** para operaciones del servidor

### Patrón de Alertas
```
Alertas del navegador → Solo cuando la app está abierta
Netlify Scheduled     → Cada minuto, 24/7, sin navegador
Telegram Bot          → Destino de notificaciones push
```

---

## ✅ REGLAS DE IMPLEMENTACIÓN

### Antes de Codificar
1. ¿Ya existe algo similar? → Reutilizar
2. ¿Afecta múltiples archivos? → Planificar primero
3. ¿Requiere migración de datos? → Considerar backwards compatibility

### Durante la Implementación
1. Cambios atómicos y relacionados juntos
2. No romper funcionalidad existente
3. Probar mentalmente el flujo del usuario
4. Considerar móvil Y desktop

### Después de Implementar
1. Verificar errores con `get_errors`
2. Commit con mensaje descriptivo
3. Confirmar deploy exitoso si es producción

---

## 🐛 DEBUGGING

### Orden de Investigación
1. Leer el error exacto
2. Buscar en el código con `grep_search`
3. Leer contexto amplio del archivo
4. Verificar datos en Supabase si aplica
5. Revisar logs de Netlify Functions si es servidor

### Errores Comunes Resueltos
| Error | Causa Común | Solución |
|-------|-------------|----------|
| Datos se pierden | localStorage en vez de Supabase | Migrar a Supabase |
| Alertas no llegan | Navegador cerrado | Usar Netlify Scheduled |
| 404 en localhost | Netlify Functions | Llamada directa a API en dev |
| RLS bloquea datos | Falta Service Key | Usar SUPABASE_SERVICE_KEY |

---

## 📱 UX/UI GUIDELINES

### Principios
- **Mobile-first**: Diseñar para celular primero
- **Touch-friendly**: Botones mínimo 44px
- **Feedback inmediato**: Loading states, confirmaciones
- **Colores consistentes**: Usar paleta nexus-*

### Paleta de Colores
```css
nexus-base:    #0a0a0f    /* Fondo oscuro */
nexus-surface: #12121a    /* Tarjetas */
nexus-accent:  #ff6b35    /* Naranja principal */
```

### Estados de UI
- 🔵 Azul: Nuevo, información
- 🟢 Verde: Éxito, positivo
- 🟡 Amarillo: Advertencia, automatización
- 🔴 Rojo: Error, urgente, vencido
- 🟠 Naranja: Acción principal (CTA)

---

## 🔄 FLUJO DE TRABAJO GIT

### Commits
```bash
# Formato
git commit -m "Tipo: Descripción corta"

# Tipos
feat:     Nueva funcionalidad
fix:      Corrección de bug
update:   Mejora sin cambiar funcionalidad
docs:     Solo documentación
refactor: Cambio de código sin cambiar comportamiento
```

### Deploy
- Push a `master` → Deploy automático en Netlify
- Esperar ~1-2 minutos para ver cambios en producción
- Verificar en https://alvearecrm.netlify.app

---

## 📊 MÉTRICAS DE ÉXITO

### Para el Usuario
- Tiempo para agregar un lead < 30 segundos
- Alertas llegan en el momento correcto
- Nunca perder datos

### Para el Código
- Sin errores en consola en producción
- Tiempo de carga < 3 segundos
- Funciona offline (básico)

---

## 🚀 ROADMAP ACTUAL

### ✅ Completado
- [x] CRUD de leads
- [x] Sistema de seguimiento S1-S12
- [x] Alertas Telegram 24/7
- [x] Mi Planner personal
- [x] Perfil en Supabase
- [x] Acciones Críticas unificadas
- [x] Filtros móviles

### 🔄 En Progreso
- [ ] Alertas de follow-ups en servidor
- [ ] WhatsApp Business API

### 📋 Pendiente
- [ ] Importar leads desde CSV
- [ ] Reportes PDF
- [ ] Multi-usuario (equipos)

---

## 💡 FILOSOFÍA

> "El mejor código es el que no tienes que escribir."  
> "Funciona > Perfecto"  
> "El usuario no lee, el usuario hace clic."  
> "Si tienes que explicarlo, está mal diseñado."

---

## 📞 INFORMACIÓN DE CONTACTO

- **Proyecto:** ALVEARE CRM
- **Dueño:** Howard Luna
- **Telegram:** @alveare_crm_bot (Chat ID: 5087918257)
- **Supabase Project:** lldhpidjcjyjldhpbjql

---

*Este documento debe leerse al inicio de cada sesión de desarrollo.*
*Actualizar cuando se agreguen nuevas directivas o aprendizajes.*

---

**Versión:** 1.0  
**Fecha:** 18 de Diciembre, 2025
