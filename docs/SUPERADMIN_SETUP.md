# 🛡️ Guía de Configuración SuperAdmin - CRM ALVEARE

## Paso 1: Ejecutar Migración SQL

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** (en el sidebar izquierdo)
3. Crea un nuevo query
4. Copia y pega el contenido de `supabase/migrations/001_superadmin_tables.sql`
5. Ejecuta el query (botón Run)

## Paso 2: Asignar Rol de Supervisor

Para hacer a un usuario supervisor, ejecuta este SQL:

```sql
-- Reemplaza 'tu-email@ejemplo.com' con el email del usuario
UPDATE user_profiles 
SET role = 'supervisor' 
WHERE email = 'tu-email@ejemplo.com';

-- Para hacer admin (todos los permisos):
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'tu-email@ejemplo.com';
```

## Paso 3: Verificar Roles

```sql
-- Ver todos los usuarios y sus roles
SELECT id, email, full_name, role, is_active, created_at 
FROM user_profiles 
ORDER BY role, full_name;
```

## Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `asesor` | Agente de ventas (default) | Ver solo sus propios leads y tareas |
| `supervisor` | Supervisor de equipo | Ver datos de todos los asesores |
| `admin` | Administrador | Todos los permisos + configuración |

## Estructura de Tablas Creadas

### `user_profiles`
- Almacena información extendida de usuarios
- Se crea automáticamente al registrarse un usuario nuevo
- Contiene el campo `role` para control de acceso

### `scheduled_tasks`
- Reemplazo de localStorage para tareas programadas
- Permite persistencia multi-dispositivo
- Los supervisores pueden ver tareas de todo el equipo

### `activity_logs`
- Registro de todas las acciones de usuarios
- Usado para métricas y alertas de inactividad
- Mantiene historial de 90 días (configurable)

## Políticas de Seguridad (RLS)

Las políticas Row Level Security garantizan que:
- ✅ Cada asesor solo ve sus propios datos
- ✅ Supervisores pueden ver datos de todo su equipo
- ✅ Admins tienen acceso completo
- ✅ Nadie puede modificar datos de otros usuarios

## Funcionalidades del SuperAdmin

Una vez configurado, los supervisores verán:

1. **Panel de Equipo** - KPIs globales del equipo
2. **Ranking de Asesores** - Ordenado por ventas cerradas
3. **Alertas de Inactividad** - Asesores sin actividad en 3+ días
4. **Detalle por Asesor** - Click para ver leads, tareas y actividad individual

## Troubleshooting

### "Acceso Restringido" aparece aunque soy supervisor
- Verifica que ejecutaste el UPDATE SQL correctamente
- Cierra sesión y vuelve a entrar
- Revisa la consola del navegador para errores

### No aparece el botón SuperAdmin en el sidebar
- Solo aparece para usuarios con rol `supervisor` o `admin`
- El hook `useUserRole` consulta la tabla `user_profiles`

### Las tablas no se crearon
- Asegúrate de ejecutar TODO el SQL del archivo de migración
- Revisa errores en el SQL Editor de Supabase
- Verifica que tienes permisos de administrador en el proyecto
