# CoreFlow — Privacidad, cookies y documentación legal

Estado al 2026-11-11: **implementado en la interfaz, en borrador legal y sin registro en el servidor**. Nada de esto se ha publicado ni desplegado, y no se ejecutó ninguna migración.

Los documentos son borradores para revisión jurídica. No son asesoría legal ni declaran cumplimiento pleno de la normativa.

## 1. Qué se implementó

| Pieza | Archivo | Qué hace |
|---|---|---|
| Núcleo de consentimiento | `src/core/privacy/consent.js` | Categorías, registro local sin datos personales, versiones, vencimiento a 12 meses, retiro y ejecución diferida de lo opcional |
| Banner y centro de preferencias | `src/components/privacy/PrivacyProvider.jsx` | Banner en la primera visita con tres opciones de igual peso; diálogo para elegir por categoría y retirar el consentimiento |
| Pie legal | `src/components/privacy/LegalFooter.jsx` | Enlaces a los documentos y a «Configuración de cookies» en login, espacio de trabajo y Platform Admin |
| Centro legal | `src/views/LegalCenterView.jsx`, `src/legal/documents.js` | Cinco documentos con fechas, versión, índice interno y datos pendientes resaltados; página para ejercer derechos |
| Servicio de registro | `src/core/backend/PrivacyService.js` | Registra decisiones y solicitudes en Supabase. Inactivo hasta aplicar la migración 018 y poner `VITE_COREFLOW_PRIVACY_SYNC=on` |
| Migración propuesta | `supabase/proposed/018_privacy_consent_and_requests.sql` | Tablas inmutables de consentimiento y de solicitudes, con RLS. Fuera de `supabase/migrations` para que nada la aplique sola |

Integración: `App.jsx` (rutas `#/legal/...`, tema guardado solo con consentimiento funcional), `AuthView.jsx`, `AppShell.jsx` (pie y enlace en el menú del usuario), `PlatformAdminView.jsx` y la sección «Privacidad» de Configuración de la organización.

## 2. Inventario del navegador

| Clave | Categoría | Uso |
|---|---|---|
| `coreflow_supabase_auth_token` | Necesaria | Sesión de Supabase Auth |
| `coreflow_active_organization` | Necesaria | Organización activa |
| `coreflow_cookie_consent` | Necesaria | Decisión de cookies |
| `coreflow_saas_relational_state_v3` | Necesaria | Datos del entorno de demostración |
| `coreflow_ui_theme` | Funcional | Tema claro u oscuro; solo con consentimiento |

No hay herramientas analíticas ni publicitarias. La fuente Inter se descarga de Google Fonts, que recibe la IP del visitante.

## 3. Webcore y las organizaciones clientes

- Webcore es responsable de los datos que trata para sus fines: cuentas, servicio, seguridad y solicitudes.
- Cada organización cliente es responsable de los datos que registra y de obtener sus autorizaciones; Webcore actúa como encargado.
- La relación debe constar en un contrato de transmisión (art. 2.2.2.25.5.2 del Decreto 1074 de 2015). Falta el modelo.
- El consentimiento de cookies es de la persona en un navegador. En el servidor, la organización solo se guarda si el usuario es miembro activo; una organización ajena se descarta.

## 4. Migración propuesta 018

- `privacy_consents`: identificador de la decisión, visitante, usuario (desde `auth.uid()`), organización de contexto, categorías aceptadas y rechazadas, versiones y fechas. Sin IP, correo ni datos del navegador. Inmutable por trigger; `anon` solo registra mediante RPC, nunca lee.
- `privacy_requests`: tipo, titular, correo, detalle, estado y plazo legal (10 días hábiles para consultas, 15 para reclamos). El titular ve las suyas; Platform Admin las gestiona.
- Reversión: `018_privacy_consent_and_requests.down.sql`, destructiva.

Para activarla: autorización expresa, revisión jurídica, aplicar en desarrollo, correr `npm run test:db` y la prueba real, y luego `VITE_COREFLOW_PRIVACY_SYNC=on`.

## 5. Pruebas

| Escenario | Cómo se verificó | Resultado |
|---|---|---|
| 1. Primera visita | Navegador y `tests/privacy` | Banner visible; opcionales bloqueadas |
| 2. Aceptar todas | `tests/privacy` | Cuatro categorías aceptadas |
| 3. Rechazar opcionales | Navegador y `tests/privacy` | Solo `coreflow_cookie_consent` y datos necesarios en el navegador |
| 4. Preferencias personalizadas | Navegador y `tests/privacy` | Solo lo marcado; el tema se guarda y se conserva al recargar |
| 5. Modificar o retirar | Navegador y `tests/privacy` | Retiro borra `coreflow_ui_theme` |
| 6. Cerrar sesión y volver | Navegador y `tests/privacy` | La decisión se conserva |
| 7. Otro navegador | `tests/privacy` | Se pide de nuevo |
| 8. Otra organización | `tests/db/privacy-018.test.mjs` | Una organización ajena no queda asociada |
| 9. Visitante sin cuenta | `tests/db/privacy-018.test.mjs` | Registra sin leer |
| 10. Ejercer derechos | Navegador y `tests/db/privacy-018.test.mjs` | Plazo legal asignado; formulario deshabilitado en la demo con aviso honesto |
| Nada opcional antes del consentimiento | `tests/privacy` | Lo opcional queda en espera hasta aceptarse |

No se probó contra Supabase real, porque la migración 018 no está aplicada.

## 6. Datos pendientes de validación

Razón social, NIT, domicilio, correo de privacidad, teléfono, representante legal, matrícula mercantil, área responsable, fecha de entrada en vigencia, jurisdicción, condiciones comerciales, niveles de servicio, plazos de conservación, plazo de devolución de datos, registro de marca, regiones de Vercel, obligación de inscribir el RNBD, modelo de acuerdo de tratamiento con clientes, texto y prueba de la autorización al activar cuentas, y cláusula de limitación de responsabilidad.

## 7. Riesgos

**Legales**
- Los textos no tienen revisión jurídica y contienen datos pendientes. No deben publicarse así.
- Las transmisiones internacionales a Estados Unidos (Supabase, Vercel, Google) necesitan análisis y contratos.
- El aviso del login informa, pero la autorización previa, expresa e informada y su prueba aún no están en el flujo de activación de cuentas.
- Falta el acuerdo de tratamiento de datos con cada organización cliente.

**Técnicos**
- Sin la migración 018, la prueba del consentimiento vive solo en el navegador del usuario.
- El registro de visitantes es anónimo por diseño: el servidor no puede impedir registros masivos sin un límite de frecuencia, que no existe aún.
- Google Fonts transmite la IP antes de cualquier decisión. Alojar la fuente en el propio dominio lo evita.
- Los plazos legales se guardan en días hábiles, pero el sistema todavía no calcula fechas de vencimiento con festivos colombianos.
