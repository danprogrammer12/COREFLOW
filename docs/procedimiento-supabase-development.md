# Procedimiento: conexión con CoreFlow Development

Estado: **preparado, sin ejecutar**. Ninguna migración ni operación se ha hecho sobre Supabase. Requiere autorización explícita en la fase 2 y en la fase 3.

## 1. Requisitos previos

**A cargo del responsable del proyecto:**
1. Crear el proyecto `CoreFlow Development`, independiente de producción.
2. Completar `.env.local` en `COREFLOW-backend` (ignorado por git, nunca pegar claves en el chat). Las variables están en `.env.example`.
3. Definir los correos y contraseñas de las tres cuentas, y los datos reales o de prueba de las organizaciones.

**Antes de autorizar la fase 2:**
- Decisión sobre la herramienta de aplicación: Supabase CLI (no instalada aquí) o el conector de Supabase de esta sesión.
- Confirmar que el proyecto usa PostgreSQL 15 o superior: 008 usa `ON DELETE SET NULL (columna)`.

## 2. Orden de migraciones

Se aplican una a una y en este orden, deteniéndose ante el primer error.

| Orden | Migración | Efecto |
|---|---|---|
| 1 | 001 | Planes, organizaciones, perfiles, sedes, áreas, equipos |
| 2 | 002 | Roles, permisos, membresías |
| 3 | 003 | Auditoría, funciones de seguridad, RLS base |
| 4 | 004 | Solicitudes y aprobaciones |
| 5 | 005 | Platform Admin y suscripciones |
| 6 | 006 | Módulos operativos |
| 7 | 007 | Bucket privado y políticas de Storage |
| 8 | 008 | Reconciliación, vínculo con `auth.users` |
| 9 | 009 | Endurecimiento de RLS |
| 10 | 010 | Auditoría en servidor y flujos |
| 11 | 011 | Cuotas y membresías |
| 12 | 012 | Aprovisionamiento |
| 13 | 013 | Capacidades y contadores |
| 14 | 014 | Especificación Starter v1.0 |
| 15 | 015 | Versiones de documentos y Storage con alcance |
| 16 | 016 | Métricas con datos reales |

## 3. Riesgos y operaciones destructivas

En un proyecto vacío ninguna pierde datos. Se registran porque el mismo orden se usará después en otros entornos.

| Migración | Operación | Riesgo |
|---|---|---|
| 005 | `drop constraint`, `drop not null` en `audit_logs.organization_id` | Bajo |
| 007 | `drop policy if exists` sobre `storage.objects`, solo las propias | Bajo |
| 008 | Reemplazo de 13 claves foráneas | Bloqueo breve de esas tablas |
| 008 | Actualiza `start` a `starter` | Irreversible en los datos migrados |
| 008 | Trigger sobre `auth.users` | **Si falla, los registros en Auth fallan** |
| 009 | Retira **todas** las políticas del esquema `public` (con respaldo) | **Afectaría a tablas ajenas a CoreFlow**: el esquema debe contener solo CoreFlow |
| 009 | `revoke` de funciones y de `update` en `user_profiles` | Bajo |

**Rollbacks** (`supabase/rollbacks/`): se aplican en orden inverso. Tres son destructivos: 008 ejecuta `drop schema private cascade`, 010 retira la columna `audit_logs.origin` y 015 elimina el historial de versiones.

**Puntos que el entorno simulado no puede confirmar:**
- Permiso del rol `postgres` para crear el trigger en `auth.users` y las políticas en `storage.objects`.
- Si `private.org_storage_has_room` puede leer `storage.objects`, que tiene RLS y otro dueño. Si no puede, las cargas fallarán.
- Resolución de `uuid_generate_v4()` con la extensión en el esquema `extensions`.
- Que la herramienta acepte nombres de migración como `001_...sql`.
- Las columnas reales de `storage.objects`: 015 usa `owner_id` y `metadata ->> 'size'` y `'mimetype'`.

## 4. Fases

**Fase 1, sin escrituras.** `node scripts/provision-coreflow-accounts.mjs` en simulación: valida configuración y destino. Antes de aplicar 001, las consultas a tablas fallarán; es lo esperado.

**Fase 2, con autorización.** Aplicar las migraciones y comprobar: RLS activo en todas las tablas de `public`, funciones `private.*` sin `EXECUTE` para `anon`, bucket privado, y los asesores de seguridad de Supabase.

**Fase 3, con autorización.** Aprovisionar:
```
node scripts/provision-coreflow-accounts.mjs --apply --confirm-project-ref=<ref>
```
El script se detiene si Starter no recibe exactamente 3 roles, así que depende de los cambios de la especificación. Repetirlo no duplica nada ni cambia contraseñas, salvo con `--rotate-passwords`.

Auth y PostgreSQL no comparten transacción: si un paso falla, pueden quedar cuentas creadas sin organización. La recuperación consiste en corregir la causa y repetir el comando, que retoma lo existente. El script no elimina roles sobrantes: si una organización Starter ya tiene más de 3, la verificación final falla y hay que resolverlo a mano.

**Fase 4.** `COREFLOW_SUPABASE_E2E=1 npm run test:supabase`, con resultados etiquetados `SUPABASE-REAL`.

**Fase 5.** Integración de `CoreFlowContext.jsx`, coordinada con Antigravity.

## 5. Verificaciones preparadas

`tests/supabase/integration.test.mjs`. Crea datos con una marca por ejecución (`e2e-<marca>`) y no los borra, porque `audit_logs` impide eliminar organizaciones con registros. Se acumulan con cada ejecución; la limpieza prevista es recrear el proyecto de desarrollo, nunca borrar filas de auditoría.

| Área | Qué comprueba |
|---|---|
| Auth | Credenciales inválidas, trigger de perfil, inicio, sesión y cierre con la capa real de servicios |
| PostgREST | `anon` sin datos ni RPC, `private` no expuesto, funciones antiguas no invocables, auditoría no insertable |
| RLS | Lectura y escritura entre tenants, escritura directa de estados |
| Storage | Carga, URL firmada, prefijo ajeno, ruta inválida, bucket no público |

## 6. Concurrencia y cuotas

El entorno simulado usa una sola conexión, así que estas pruebas solo tienen valor en Supabase real, donde cada petición usa su propia conexión.

| Caso | Método | Resultado esperado |
|---|---|---|
| Colaboradores | Cuota con 2 plazas libres, 6 invitaciones simultáneas | Exactamente 2 aceptadas |
| Sedes | Cuota con 1 plaza libre, 5 altas simultáneas | Exactamente 1 aceptada |
| Aprobaciones | 4 decisiones simultáneas sobre un paso | Exactamente 1 |
| Automatizaciones | Tras 014: 3 activas y activaciones simultáneas | No se supera 3 |
| Administradores | Tras 014: promociones simultáneas | No se supera 2 |
| Almacenamiento | Cuota de 1 MB, 5 cargas simultáneas de 900 KB | **Se mide, no se exige**: es un riesgo abierto |

La cuota de almacenamiento comprueba antes de cargar y no reserva espacio. Cerrarla de verdad requiere reservar cupo en el servidor antes de emitir la carga, por ejemplo con una URL de carga firmada generada por una Edge Function.
