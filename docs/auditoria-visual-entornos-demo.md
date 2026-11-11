# CoreFlow — Auditoría visual de los entornos de demostración

Fecha: 2026-11-10. Recorrido en Chrome a 1920 × 951, con datos de demostración locales.

Hay dos versiones de la interfaz y se revisaron ambas:

- **A:** `COREFLOW-backend` (`localhost:5180`). Interfaz del último commit, con el login nuevo.
- **B:** `COREFLOW`, `develop` con 6 archivos sin commit de Antigravity (`localhost:5174`).

**Cobertura:** en A, los 10 módulos de Starter, 9 de Business y las 5 secciones de Platform Admin. En B, lo que no se cae de Business, y Organizaciones y Usuarios de Platform Admin. Móvil a 390 px solo en el dashboard Business de A, mediante iframe. Modo oscuro de forma parcial.

## 1. Fallas

### Críticas

| # | Versión | Falla | Dónde |
|---|---|---|---|
| 1 | B | **Starter no carga**: el dashboard queda en blanco | `DashboardView.jsx:551,577` |
| 2 | B | **Business se cae al abrir Clientes, Tareas o Documentos** | `ModulesPreviewView.jsx:698,840,905` |
| 3 | B | El arreglo pedido a Antigravity está incompleto: `TaskProgressCard` tiene el mismo error, así que son 6 llamadas, no 4 | `DashboardView.jsx:462`, `ModulesPreviewView.jsx:840` |

### Altas

| # | Versión | Falla | Dónde |
|---|---|---|---|
| 4 | A | Platform Admin, Usuarios: tabla vacía y contador en 0, aunque hay 10 usuarios. La vista espera `platformUsers` y recibe otra prop | `PlatformAdminView.jsx:36` |
| 5 | A y B | El formulario de suscripción muestra "Starter" para una organización Business al abrir. **Guardar sin revisar la degradaría** | `PlatformAdminView.jsx:87` |
| 6 | A y B | Las cifras no coinciden: el menú y el dashboard dicen 19 clientes y la lista muestra 2. También 54 documentos frente a 1, y en Business 48 frente a 4 y 132 frente a 2 | `MetricsEngineService.js` |
| 7 | A | La capacidad de Starter se ve "0 GB" en Platform Admin y "5 GB" en Documentos. Efecto de dejarla sin configurar | `PlatformAdminView.jsx:619`, `ModulesPreviewView` |
| 8 | A | Starter muestra "Asistente IA", aunque la especificación excluye IA | `AppShell.jsx` |
| 9 | A | Starter muestra "Crear departamento", aunque tiene una sola área | Módulo Configuración |

### Medias

| # | Versión | Falla |
|---|---|---|
| 10 | A | El perfil del usuario queda fuera de pantalla en páginas largas: hay que bajar hasta el final |
| 11 | A | "Sistema de Diseño" aparece a clientes en la barra lateral, en el botón de ayuda y en la navegación móvil |
| 12 | A | El título cambia con el tema: "Dashboard operativo" en claro y "Resumen ejecutivo" en oscuro |
| 13 | A | El panel de notificaciones sigue abierto al cambiar de módulo y al desplazarse |
| 14 | A y B | Nombres cortados con puntos suspensivos: usuario, rol y organización |
| 15 | A | Platform Admin tiene 17 px de desplazamiento sobrante y el encabezado se corta |
| 16 | A | Mezcla de nombres: "CoreFlow Start" y "CoreFlow Starter" |
| 17 | A y B | Lenguaje técnico para clientes: "Aislamiento RLS", "Claves foráneas compuestas verificadas", "Storage Privado", "Suscripción verificada en BD", rutas como `{organizationId}/documents/...` |
| 18 | A y B | Identificadores crudos: `multiBranch`, `SESSION_AUTHENTICATED`, `MEM-STARTER-OWNER`, `ORG_ADMIN` |
| 19 | A y B | Cifras fijas presentadas como reales: cumplimiento 92.5 %, "+9 %", "Hace 2 horas" |
| 20 | A y B | El editor de planes abre con un plan inexistente: "CoreFlow Enterprise" |
| 21 | A | El avatar dice "CF" para todos los usuarios de organización (`AppShell.jsx:335`) |
| 22 | A | Starter ofrece elegir área al crear una solicitud, aunque solo tiene una |
| 23 | A | Configuración mezcla departamentos y miembros en una sola tabla |
| 24 | A | En móvil, "Tareas cerradas" y "Activa" quedan pegados, los títulos de actividad se cortan y la página mide 3871 px |

## 2. Vistas genéricas

**Versión A:**
- **Clientes, Comercial, Solicitudes, Procesos, Tareas, Documentos, Reportes y Configuración** son la misma plantilla: título, tres tarjetas de indicadores, buscador y tabla de cinco columnas. Solo cambia el texto.
- **Starter y Business** tienen la misma estructura en todas sus vistas. Solo cambian los datos y unas etiquetas.
- **Dashboard:** el patrón estándar de cuatro indicadores, actividad y gráfica.
- **Platform Admin:** las mismas cuatro tarjetas encabezan las cinco secciones, sin relación con el contenido. **Configuración de Plataforma** solo tiene dos notas técnicas y nada que configurar. **Auditoría** es una lista plana sin filtros.
- Recursos repetidos en todo el producto: etiqueta verde con tendencia, icono en cuadro de color y barra de progreso decorativa bajo cada número.

**Versión B:**
- Avanza en composición propia: Comercial por etapas, Automatizaciones, Reportes por área y Departamentos con dos columnas. Business ya se distingue de la plantilla única.
- Sigue genérico: cada módulo abre con las mismas tres tarjetas, ahora con borde superior de color, y Platform Admin repite sus cuatro tarjetas.
- No se pudieron evaluar Starter, Clientes, Tareas ni Documentos, porque se caen.

## 3. Sin fallas detectadas

- Sin desbordes horizontales en escritorio en ninguna vista de A.
- Sin errores de consola en A durante el recorrido.
- El logo oficial se ve correctamente en login, barra lateral y Platform Admin.
- El login nuevo funciona en escritorio y a 390 px.
