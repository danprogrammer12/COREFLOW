import React, { useState } from 'react'
import { GeometricAccentBar } from '../ui/Primitives'

export const CHART_DATASETS = {
  '7d': {
    label: 'Últimos 7 días',
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    maxScale: 16,
    yTicks: [0, 4, 8, 12, 16],
    solicitudes: [4, 6, 5, 8, 7, 6, 6], // Suma = 42 solicitudes en la semana
    tareas: [3, 5, 6, 5, 8, 6, 5],      // Suma = 38 tareas completadas
    automatizaciones: [2, 4, 4, 5, 5, 5, 4], // Suma = 29 flujos automatizados
    summary: {
      totalSolicitudes: '42',
      totalTareas: '38',
      totalAuto: '29',
      cumplimientoSla: '94.2%',
    },
  },
  '30d': {
    label: 'Últimos 30 días',
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Actual'],
    maxScale: 32,
    yTicks: [0, 8, 16, 24, 32],
    solicitudes: [18, 22, 20, 25, 24, 27, 28], // Suma = 164
    tareas: [16, 19, 21, 22, 23, 23, 24],      // Suma = 148
    automatizaciones: [12, 14, 16, 17, 19, 20, 20], // Suma = 118
    summary: {
      totalSolicitudes: '164',
      totalTareas: '148',
      totalAuto: '118',
      cumplimientoSla: '95.1%',
    },
  },
  trimestre: {
    label: 'Trimestre actual',
    labels: ['Mes 1 · Q1', 'Mes 1 · Q2', 'Mes 2 · Q1', 'Mes 2 · Q2', 'Mes 3 · Q1', 'Mes 3 · Q2', 'Cierre'],
    maxScale: 90,
    yTicks: [0, 22, 45, 68, 90],
    solicitudes: [52, 58, 64, 68, 72, 75, 79], // Suma = 468
    tareas: [48, 54, 58, 62, 66, 70, 74],      // Suma = 432
    automatizaciones: [38, 44, 48, 52, 55, 58, 61], // Suma = 356
    summary: {
      totalSolicitudes: '468',
      totalTareas: '432',
      totalAuto: '356',
      cumplimientoSla: '96.0%',
    },
  },
}

function buildSmoothPath(points) {
  if (!points.length) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cpx1 = p0.x + (p1.x - p0.x) * 0.45
    const cpy1 = p0.y
    const cpx2 = p0.x + (p1.x - p0.x) * 0.55
    const cpy2 = p1.y
    d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.x} ${p1.y}`
  }
  return d
}

export function ProcessEvolutionChart({
  period = '7d',
  onPeriodChange,
  executiveMode = false,
  edition = 'business',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(6)
  const [visibleSeries, setVisibleSeries] = useState({
    solicitudes: true,
    tareas: true,
    automatizaciones: true,
  })

  const data = CHART_DATASETS[period] || CHART_DATASETS['7d']

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (!next.solicitudes && !next.tareas && !next.automatizaciones) {
        return prev
      }
      return next
    })
  }

  const width = 640
  const height = 210
  const padLeft = 34
  const padRight = 18
  const padTop = 16
  const padBottom = 30
  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom

  const toCoords = (values) =>
    values.map((val, idx) => ({
      x: padLeft + (idx / (values.length - 1)) * chartW,
      y: padTop + chartH - (val / data.maxScale) * chartH,
      val,
    }))

  const ptsViolet = toCoords(data.solicitudes)
  const ptsLime = toCoords(data.tareas)
  const ptsCyan = toCoords(data.automatizaciones)

  const pathViolet = buildSmoothPath(ptsViolet)
  const pathLime = buildSmoothPath(ptsLime)
  const pathCyan = buildSmoothPath(ptsCyan)

  const areaViolet = `${pathViolet} L ${ptsViolet[ptsViolet.length - 1].x} ${padTop + chartH} L ${ptsViolet[0].x} ${padTop + chartH} Z`
  const areaLime = `${pathLime} L ${ptsLime[ptsLime.length - 1].x} ${padTop + chartH} L ${ptsLime[0].x} ${padTop + chartH} Z`

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Cabecera del Gráfico con Selector de Periodo y Conmutadores de Serie */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <GeometricAccentBar size="sm" />
            <h3 className="text-base font-bold text-core-navy dark:text-white">
              Evolución de procesos y ritmo operativo
            </h3>
          </div>
          <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
            Volumen real de solicitudes gestionadas, tareas cerradas y automatizaciones ({data.label})
          </p>
        </div>

        {/* Selector de Periodo segmentado */}
        <div className="inline-flex items-center rounded-xl bg-core-cloud dark:bg-[#101228] p-1 border border-core-border dark:border-[#282C5A] self-start">
          {[
            { id: '7d', label: '7 días' },
            { id: '30d', label: '30 días' },
            { id: 'trimestre', label: 'Trimestre' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPeriodChange?.(opt.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === opt.id
                  ? 'bg-white dark:bg-core-violet text-core-navy dark:text-white shadow-2xs'
                  : 'text-core-muted dark:text-slate-400 hover:text-core-navy dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Banda de Resumen de Coherencia Operativa + Leyenda Interactiva */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <button
          type="button"
          onClick={() => toggleSeries('solicitudes')}
          className={`text-left rounded-xl p-2.5 border transition-all ${
            visibleSeries.solicitudes
              ? 'bg-core-violet/5 dark:bg-core-violet/15 border-core-violet/30'
              : 'bg-core-cloud/40 dark:bg-[#12142E]/40 border-core-border dark:border-[#282C5A] opacity-55'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-core-muted dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-core-violet" />
              Solicitudes
            </span>
            <span className="text-[10px] text-core-violet dark:text-indigo-300 font-semibold">
              {visibleSeries.solicitudes ? 'Visible' : 'Oculto'}
            </span>
          </div>
          <p className="mt-1 text-lg font-extrabold text-core-navy dark:text-white tabular-nums">
            {data.summary.totalSolicitudes}
          </p>
        </button>

        <button
          type="button"
          onClick={() => toggleSeries('tareas')}
          className={`text-left rounded-xl p-2.5 border transition-all ${
            visibleSeries.tareas
              ? 'bg-[#EAFBE7]/55 dark:bg-emerald-950/35 border-emerald-300/60 dark:border-emerald-800/50'
              : 'bg-core-cloud/40 dark:bg-[#12142E]/40 border-core-border dark:border-[#282C5A] opacity-55'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-core-muted dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" />
              Tareas cerradas
            </span>
            <span className="text-[10px] text-[#15803D] dark:text-core-lime font-semibold">
              {visibleSeries.tareas ? 'Visible' : 'Oculto'}
            </span>
          </div>
          <p className="mt-1 text-lg font-extrabold text-core-navy dark:text-white tabular-nums">
            {data.summary.totalTareas}
          </p>
        </button>

        <button
          type="button"
          onClick={() => toggleSeries('automatizaciones')}
          className={`text-left rounded-xl p-2.5 border transition-all ${
            visibleSeries.automatizaciones
              ? 'bg-[#E5F7FC]/60 dark:bg-cyan-950/35 border-cyan-300/60 dark:border-cyan-800/50'
              : 'bg-core-cloud/40 dark:bg-[#12142E]/40 border-core-border dark:border-[#282C5A] opacity-55'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-core-muted dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-core-cyan" />
              Automatizados
            </span>
            <span className="text-[10px] text-[#0369A1] dark:text-core-cyan font-semibold">
              {visibleSeries.automatizaciones ? 'Visible' : 'Oculto'}
            </span>
          </div>
          <p className="mt-1 text-lg font-extrabold text-core-navy dark:text-white tabular-nums">
            {data.summary.totalAuto}
          </p>
        </button>

        <div className="rounded-xl p-2.5 border border-core-border dark:border-[#282C5A] bg-core-cloud/55 dark:bg-[#12142E]">
          <span className="text-[11px] font-medium text-core-muted dark:text-slate-300 block">
            Cumplimiento en tiempo
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-extrabold text-core-navy dark:text-white tabular-nums">
              {data.summary.cumplimientoSla}
            </span>
            <span className="text-[10px] font-bold text-[#15803D] dark:text-core-lime">
              Meta ≥ 90%
            </span>
          </div>
        </div>
      </div>

      {/* Lienzo SVG del Gráfico */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          role="img"
          aria-label="Gráfico de evolución de procesos"
        >
          <defs>
            <linearGradient id="cf-area-violet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6545E8" stopOpacity={executiveMode ? '0.36' : '0.20'} />
              <stop offset="100%" stopColor="#6545E8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cf-area-lime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84CC16" stopOpacity={executiveMode ? '0.22' : '0.14'} />
              <stop offset="100%" stopColor="#84CC16" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas de guía horizontales */}
          {data.yTicks.map((tick) => {
            const y = padTop + chartH - (tick / data.maxScale) * chartH
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200/90 dark:text-[#252954]"
                  strokeDasharray={tick === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] tabular-nums"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Áreas bajo la curva */}
          {visibleSeries.tareas && <path d={areaLime} fill="url(#cf-area-lime)" />}
          {visibleSeries.solicitudes && <path d={areaViolet} fill="url(#cf-area-violet)" />}

          {/* Línea vertical del corte seleccionado */}
          {hoveredIdx !== null && ptsViolet[hoveredIdx] && (
            <line
              x1={ptsViolet[hoveredIdx].x}
              y1={padTop}
              x2={ptsViolet[hoveredIdx].x}
              y2={padTop + chartH}
              stroke="#6545E8"
              strokeOpacity="0.4"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
          )}

          {/* Serie 3: Automatizaciones (Cian) */}
          {visibleSeries.automatizaciones && (
            <path
              d={pathCyan}
              fill="none"
              stroke="#08C9E8"
              strokeWidth="2.2"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          )}

          {/* Serie 2: Tareas cerradas (Lime Green) */}
          {visibleSeries.tareas && (
            <path
              d={pathLime}
              fill="none"
              stroke="#84CC16"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          )}

          {/* Serie 1: Solicitudes gestionadas (Electric Violet) */}
          {visibleSeries.solicitudes && (
            <path
              d={pathViolet}
              fill="none"
              stroke="#6545E8"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* Nodos interactivos */}
          {data.labels.map((label, idx) => {
            const pv = ptsViolet[idx]
            const pl = ptsLime[idx]
            const pc = ptsCyan[idx]
            const isActive = hoveredIdx === idx

            return (
              <g
                key={label}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(idx)}
              >
                <rect
                  x={pv.x - 24}
                  y={padTop}
                  width="48"
                  height={chartH + 24}
                  fill="transparent"
                />

                {visibleSeries.automatizaciones && (
                  <circle
                    cx={pc.x}
                    cy={pc.y}
                    r={isActive ? 4.5 : 3}
                    className="fill-white dark:fill-[#171936]"
                    stroke="#08C9E8"
                    strokeWidth="2"
                  />
                )}

                {visibleSeries.tareas && (
                  <circle
                    cx={pl.x}
                    cy={pl.y}
                    r={isActive ? 5 : 3.5}
                    className="fill-white dark:fill-[#171936]"
                    stroke="#84CC16"
                    strokeWidth={isActive ? 2.8 : 2}
                  />
                )}

                {visibleSeries.solicitudes && (
                  <circle
                    cx={pv.x}
                    cy={pv.y}
                    r={isActive ? 6 : 4}
                    className="fill-core-violet"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                )}

                <text
                  x={pv.x}
                  y={height - 6}
                  textAnchor="middle"
                  className={`text-[11px] transition-colors ${
                    isActive
                      ? 'fill-core-violet dark:fill-indigo-300 font-bold'
                      : 'fill-slate-500 dark:fill-slate-400 font-medium'
                  }`}
                >
                  {label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Inspector del punto activo */}
        {hoveredIdx !== null && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-core-cloud/85 dark:bg-[#101228] px-3.5 py-2 text-xs border border-core-border/80 dark:border-[#282C5A]">
            <span className="font-bold text-core-navy dark:text-white">
              Detalle de corte: <span className="text-core-violet dark:text-indigo-300">{data.labels[hoveredIdx]}</span>
            </span>
            <div className="flex flex-wrap items-center gap-4 tabular-nums">
              <span className="text-core-muted dark:text-slate-300">
                Solicitudes gestionadas:{' '}
                <strong className="text-core-violet dark:text-indigo-300">
                  {data.solicitudes[hoveredIdx]}
                </strong>
              </span>
              <span className="text-core-muted dark:text-slate-300">
                Tareas cerradas:{' '}
                <strong className="text-[#4D7C0F] dark:text-core-lime">
                  {data.tareas[hoveredIdx]}
                </strong>
              </span>
              <span className="text-core-muted dark:text-slate-300">
                Automatizaciones:{' '}
                <strong className="text-[#0369A1] dark:text-core-cyan">
                  {data.automatizaciones[hoveredIdx]}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
