# 📊 Plantilla Google Sheet - NEXUS CRM Lead Tracking

## Cómo usar esta plantilla

### Opción 1: Importar CSV desde NEXUS CRM
1. Ve a **Métricas** en NEXUS CRM
2. Haz clic en **"Exportar CSV"**
3. Abre Google Sheets → **Archivo** → **Importar** → Sube el CSV
4. Selecciona "Reemplazar hoja actual"

### Opción 2: Crear manualmente
Crea un Google Sheet con estas columnas:

---

## 📋 Estructura de Columnas

### Información Básica (A-L)
| Columna | Nombre | Descripción |
|---------|--------|-------------|
| A | ID | Identificador único del lead |
| B | Nombre del Cliente | Nombre completo |
| C | Teléfono | Número con código de país |
| D | Email | Correo electrónico |
| E | Fuente | Instagram, WhatsApp, Referido, etc. |
| F | Estado | NEW, CONTACTED, VISIT_SCHEDULED, etc. |
| G | Presupuesto | Monto en moneda local |
| H | Zona de Interés | Área geográfica preferida |
| I | Fecha Creación | Cuándo entró el lead |
| J | Último Contacto | Última interacción |
| K | Próximo Seguimiento | Fecha del próximo contacto |
| L | Notas | Comentarios generales |

### Preguntas de Calificación (M-V)
| Columna | Pregunta |
|---------|----------|
| M | ¿Tipo de propiedad? |
| N | ¿Cuál es el objetivo principal de tu inversión? |
| O | ¿Cuántas habitaciones te interesan? |
| P | ¿Esta sería tu primera inversión inmobiliaria? |
| Q | Si es para renta, ¿prefieres renta a corto o largo plazo? |
| R | ¿Cuál es tu presupuesto estimado para esta inversión? |
| S | ¿Tienes preaprobación bancaria o necesitas orientación? |
| T | ¿Hay otras personas involucradas en la toma de decisión? |
| U | ¿Te gustaría agendar una cita virtual o presencial? |
| V | Saludo/Respuesta inicial |

### Puntuación (W-Z)
| Columna | Nombre | Descripción |
|---------|--------|-------------|
| W | Puntos | Total de puntos (0-30) |
| X | Porcentaje | % del máximo posible |
| Y | Clasificación | HOT 🔥 / WARM ☀️ / COLD ❄️ |
| Z | Fecha Calificación | Cuándo fue calificado |

### Seguimientos S1-S12 (AA-AL)
| Columna | Seguimiento | Formato Sugerido |
|---------|-------------|------------------|
| AA | S1 | Fecha + Método (Ej: "15/12 - WA ✅") |
| AB | S2 | ... |
| AC | S3 | ... |
| AD | S4 | ... |
| AE | S5 | ... |
| AF | S6 | ... |
| AG | S7 | ... |
| AH | S8 | ... |
| AI | S9 | ... |
| AJ | S10 | ... |
| AK | S11 | ... |
| AL | S12 | ... |

### Resumen (AM-AP)
| Columna | Nombre | Descripción |
|---------|--------|-------------|
| AM | Total Seguimientos | Conteo automático |
| AN | Respuestas Positivas | Cuántas fueron positivas |
| AO | Sin Respuesta | Cuántas sin respuesta |
| AP | Respuestas Negativas | Cuántas fueron negativas |

---

## 🎨 Formato Condicional Sugerido

### Para Clasificación (Columna Y)
- **HOT** → Fondo rojo claro (#ffcdd2)
- **WARM** → Fondo amarillo claro (#fff9c4)
- **COLD** → Fondo azul claro (#bbdefb)

### Para Estado (Columna F)
- **NEW** → Azul (#2196f3)
- **CONTACTED** → Amarillo (#ffc107)
- **VISIT_SCHEDULED** → Púrpura (#9c27b0)
- **NEGOTIATION** → Naranja (#ff9800)
- **CLOSED_WON** → Verde (#4caf50)
- **CLOSED_LOST** → Rojo (#f44336)

### Para Seguimientos (AA-AL)
- Celda con fecha → Verde claro (completado)
- Celda vacía → Rojo claro (pendiente)

---

## 📈 Fórmulas Útiles

### Contar leads HOT
```
=COUNTIF(Y:Y, "HOT")
```

### Tasa de conversión
```
=COUNTIF(F:F, "CLOSED_WON") / COUNTA(F2:F) * 100
```

### Promedio de seguimientos por lead cerrado
```
=AVERAGEIF(F:F, "CLOSED_WON", AM:AM)
```

### Días promedio para cerrar
```
=AVERAGEIF(F:F, "CLOSED_WON", J:J) - AVERAGEIF(F:F, "CLOSED_WON", I:I)
```

---

## 📊 Dashboard Sugerido (Nueva Hoja)

Crea una hoja "Dashboard" con:

1. **KPIs principales**
   - Total leads
   - Leads este mes
   - Tasa de conversión
   - Leads HOT activos

2. **Gráfico de embudo**
   - NEW → CONTACTED → VISIT → NEGOTIATION → CLOSED

3. **Gráfico de fuentes**
   - Pie chart con origen de leads

4. **Tabla de rendimiento semanal**
   - Posts hechos vs Leads generados

---

## 🔗 Link de Plantilla

Puedes crear una copia de esta estructura en:
https://docs.google.com/spreadsheets/create

O importar directamente el CSV exportado desde NEXUS CRM.
