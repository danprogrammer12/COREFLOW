-- =============================================================================
-- COREFLOW — MIGRACIÓN 016: MÉTRICAS CALCULADAS CON DATOS REALES
-- Responsabilidad: devolver la forma de `unifiedMetrics` a partir de los registros.
-- Se ejecuta con los permisos del usuario: cada rol ve las cifras de lo que puede leer.
-- Lo que no se puede calcular con los datos existentes se devuelve como 'N/D'.
-- Reversión: supabase/rollbacks/016_metrics_read_model.down.sql
-- =============================================================================

create or replace function public.rpc_get_org_metrics(p_org uuid, p_period text default '7d')
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_days integer;
  v_label text;
  v_short text;
  v_from timestamptz;
  v_bucket interval;
  v_labels jsonb;
  v_requests jsonb;
  v_tasks jsonb;
  v_peak integer;
  v_scale integer;
  v_resolved integer;
  v_managed integer;
  v_tasks_closed integer;
  v_deltas jsonb := jsonb_build_object(
    'clientes', 'N/D', 'oportunidades', 'N/D', 'tareas', 'N/D', 'documentos', 'N/D'
  );
  v_series_zero jsonb := '[0,0,0,0,0,0,0]'::jsonb;
  v_ticks jsonb;
begin
  if not private.is_reader(p_org) then
    raise exception 'TENANT_ISOLATION_VIOLATION: Sin acceso a la organización.';
  end if;

  case p_period
    when '7d' then v_days := 7; v_label := 'Últimos 7 días'; v_short := 'Período: 7 días';
    when '30d' then v_days := 30; v_label := 'Últimos 30 días'; v_short := 'Período: 30 días';
    when 'trimestre' then v_days := 90; v_label := 'Últimos 90 días'; v_short := 'Período: 90 días';
    else raise exception 'VALIDATION_ERROR: Período no admitido.';
  end case;

  v_from := now() - make_interval(days => v_days);
  v_bucket := make_interval(secs => v_days * 86400 / 7.0);

  with buckets as (
    select g as i,
           v_from + g * v_bucket as lo,
           case when g = 6 then 'infinity'::timestamptz else v_from + (g + 1) * v_bucket end as hi,
           v_from + (g + 1) * v_bucket as label_at
      from generate_series(0, 6) g
  )
  select jsonb_agg(to_char(b.label_at, 'DD/MM') order by b.i),
         jsonb_agg((
           select count(*) from public.requests r
            where r.organization_id = p_org and r.deleted_at is null
              and r.created_at >= b.lo and r.created_at < b.hi
         ) order by b.i),
         jsonb_agg((
           select count(*) from public.tasks t
            where t.organization_id = p_org and t.deleted_at is null and t.status = 'completed'
              and t.updated_at >= b.lo and t.updated_at < b.hi
         ) order by b.i)
    into v_labels, v_requests, v_tasks
    from buckets b;

  select coalesce(max(value::integer), 0) into v_peak
    from jsonb_array_elements_text(v_requests || v_tasks);
  v_scale := greatest(4, ceil(v_peak / 4.0)::integer * 4);
  v_ticks := jsonb_build_array(0, v_scale / 4, v_scale / 2, v_scale * 3 / 4, v_scale);

  select count(*) into v_resolved
    from public.requests r
   where r.organization_id = p_org and r.deleted_at is null
     and r.status = 'completed' and r.updated_at >= v_from;

  select count(*) into v_managed
    from public.requests r
   where r.organization_id = p_org and r.deleted_at is null and r.updated_at >= v_from;

  select count(*) into v_tasks_closed
    from public.tasks t
   where t.organization_id = p_org and t.deleted_at is null
     and t.status = 'completed' and t.updated_at >= v_from;

  return jsonb_build_object(
    'organizationId', p_org,
    'periodInfo', jsonb_build_object(
      'id', p_period,
      'label', v_label,
      'shortLabel', v_short,
      'labels', v_labels,
      'maxScale', v_scale,
      'yTicks', v_ticks,
      'solicitudes', v_requests,
      'tareas', v_tasks,
      'automatizaciones', v_series_zero,
      'baseResueltasPeriodo', v_resolved,
      'cumplimientoSla', 'N/D',
      'deltas', v_deltas
    ),
    'acumulados', jsonb_build_object(
      'clientesTotal', (select count(*) from public.clients c where c.organization_id = p_org and c.deleted_at is null),
      'clientesActivos', (select count(*) from public.clients c where c.organization_id = p_org and c.deleted_at is null and c.status = 'active'),
      'clientesIncorporacion', (select count(*) from public.clients c where c.organization_id = p_org and c.deleted_at is null and c.status in ('onboarding', 'process', 'pending')),
      'oportunidadesActivas', (select count(*) from public.commercial_opportunities o where o.organization_id = p_org and o.deleted_at is null and o.stage not in ('ganada', 'perdida')),
      'oportunidadesPropuesta', (select count(*) from public.commercial_opportunities o where o.organization_id = p_org and o.deleted_at is null and o.stage = 'propuesta'),
      'oportunidadesValidacion', (select count(*) from public.commercial_opportunities o where o.organization_id = p_org and o.deleted_at is null and o.stage = 'validacion_tecnica'),
      'tareasPendientesActuales', (select count(*) from public.tasks t where t.organization_id = p_org and t.deleted_at is null and t.status <> 'completed'),
      'tareasHoy', 'N/D',
      'tareasSemana', 'N/D',
      'documentosTotales', (select count(*) from public.documents d where d.organization_id = p_org and d.deleted_at is null),
      'documentosVigentes', (select count(*) from public.documents d where d.organization_id = p_org and d.deleted_at is null and d.status in ('active', 'completed')),
      'documentosRevision', (select count(*) from public.documents d where d.organization_id = p_org and d.deleted_at is null and d.status in ('pending', 'process')),
      'solicitudesEnSeguimiento', (select count(*) from public.requests r where r.organization_id = p_org and r.deleted_at is null and r.status <> 'completed'),
      'pendingValidationCount', (select count(*) from public.requests r where r.organization_id = p_org and r.deleted_at is null and r.status in ('pending', 'error'))
    ),
    'periodo', jsonb_build_object(
      'label', v_label,
      'shortLabel', v_short,
      'solicitudesGestionadas', v_managed,
      'solicitudesResueltas', v_resolved,
      'tareasCerradas', v_tasks_closed,
      'automatizacionesEjecutadas', 'N/D',
      'cumplimientoSla', 'N/D',
      'deltas', v_deltas,
      'series', jsonb_build_object(
        'labels', v_labels,
        'maxScale', v_scale,
        'yTicks', v_ticks,
        'solicitudes', v_requests,
        'tareas', v_tasks,
        'automatizaciones', v_series_zero
      )
    )
  );
end;
$$;

revoke all on function public.rpc_get_org_metrics(uuid, text) from public, anon;
grant execute on function public.rpc_get_org_metrics(uuid, text) to authenticated;
