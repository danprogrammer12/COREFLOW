import React, { useState } from 'react'
import {
  ArrowRight,
  Copy,
  Check,
  Download,
  FileText,
  ChevronRight,
  Users,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import {
  CoreFlowLogo,
  CoreFlowIsotipo,
  DiagonalBrandCanvas,
} from '../components/brand/CoreFlowLogo'
import {
  Button,
  StatusBadge,
  SurfaceCard,
  KpiCard,
  InputField,
  SearchInput,
  Tabs,
  ToastNotification,
  GeometricAccentBar,
} from '../components/ui/Primitives'

const COLOR_TOKENS = [
  {
    name: 'Midnight Navy',
    hex: '#171936',
    cssVar: '--cf-midnight-navy',
    twClass: 'bg-core-navy',
    role: 'Navegación lateral, fondos oscuros de marca y texto principal',
    group: 'Principal',
    textDark: false,
  },
  {
    name: 'Electric Violet',
    hex: '#6545E8',
    cssVar: '--cf-electric-violet',
    twClass: 'bg-core-violet',
    role: 'Identidad principal y acciones primarias de interacción',
    group: 'Principal',
    textDark: false,
  },
  {
    name: 'Royal Blue',
    hex: '#3568E8',
    cssVar: '--cf-royal-blue',
    twClass: 'bg-core-blue',
    role: 'Acciones secundarias y soporte de navegación',
    group: 'Principal',
    textDark: false,
  },
  {
    name: 'Cyan',
    hex: '#08C9E8',
    cssVar: '--cf-cyan',
    twClass: 'bg-core-cyan',
    role: 'Acentos selectivos, estados en proceso y detalles informativos',
    group: 'Acento',
    textDark: true,
  },
  {
    name: 'Lime Green',
    hex: '#A6E91C',
    cssVar: '--cf-lime-green',
    twClass: 'bg-core-lime',
    role: 'Éxito, evolución y elementos destacados puntuales',
    group: 'Acento',
    textDark: true,
  },
  {
    name: 'Cloud Gray',
    hex: '#F4F5FA',
    cssVar: '--cf-cloud-gray',
    twClass: 'bg-core-cloud',
    role: 'Fondo general de la aplicación SaaS (Modo Claro)',
    group: 'Neutral',
    textDark: true,
  },
  {
    name: 'White Surface',
    hex: '#FFFFFF',
    cssVar: '--cf-bg-surface',
    twClass: 'bg-white',
    role: 'Tarjetas, tablas, modales y superficies limpias',
    group: 'Neutral',
    textDark: true,
  },
  {
    name: 'Slate Muted',
    hex: '#64748B',
    cssVar: '--cf-text-secondary',
    twClass: 'text-core-muted',
    role: 'Texto secundario, etiquetas y metadatos',
    group: 'Neutral',
    textDark: false,
  },
  {
    name: 'Soft Border',
    hex: '#E2E6F2',
    cssVar: '--cf-border',
    twClass: 'border-core-border',
    role: 'Bordes sutiles de tarjetas, divisores y controles',
    group: 'Neutral',
    textDark: true,
  },
]

const STATE_TOKENS = [
  {
    status: 'active',
    label: 'Activo',
    usage: 'Registros vigentes, cuentas operativas y reglas en ejecución',
    tokens: '--cf-state-active-bg (#EAFBE7) · --cf-state-active-text (#15803D)',
  },
  {
    status: 'process',
    label: 'En proceso',
    usage: 'Solicitudes asignadas, trámites en curso o etapas intermedias',
    tokens: '--cf-state-process-bg (#E5F7FC) · --cf-state-process-text (#0284C7)',
  },
  {
    status: 'pending',
    label: 'Pendiente',
    usage: 'En espera de revisión, firma documental o validación de nivel',
    tokens: '--cf-state-pending-bg (#FEF6E0) · --cf-state-pending-text (#B45309)',
  },
  {
    status: 'completed',
    label: 'Completado',
    usage: 'Procesos cerrados con conformidad y aprobaciones finalizadas',
    tokens: '--cf-state-completed-bg (#EFEBFD) · --cf-state-completed-text (#6545E8)',
  },
  {
    status: 'error',
    label: 'Requiere atención',
    usage: 'Observaciones en validación, vencimientos o alertas de SLA',
    tokens: '--cf-state-error-bg (#FEE2E2) · --cf-state-error-text (#DC2626)',
  },
]

export function DesignSystemView() {
  const [copiedHex, setCopiedHex] = useState(null)
  const [demoTab, setDemoTab] = useState('general')
  const [demoInput, setDemoInput] = useState('')
  const [demoSearch, setDemoSearch] = useState('')

  const copyColor = (hex) => {
    navigator.clipboard?.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1800)
  }

  return (
    <div className="space-y-8">
      {/* BANNER HERO DE IDENTIDAD VISUAL */}
      <DiagonalBrandCanvas className="rounded-2xl p-6 sm:p-10 text-white shadow-float border border-white/10">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-core-cyan">
            Documentación del Sistema de Diseño · CoreFlow UI Kit
          </span>
          <CoreFlowLogo variant="horizontal" theme="dark" size="xl" showSlogan />
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl pt-1">
            Fuente centralizada de tokens (<code className="text-core-lime">src/styles/tokens.css</code> y{' '}
            <code className="text-core-cyan">tailwind.config.js</code>), geometría dinámica de 3
            elementos diagonales, escala tipográfica <strong>Inter</strong> y biblioteca de
            componentes reutilizables validados en modo claro y modo ejecutivo oscuro.
          </p>
        </div>
      </DiagonalBrandCanvas>

      {/* 1. VERSIONES DEL LOGOTIPO */}
      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <GeometricAccentBar size="sm" />
              <h2 className="text-lg font-bold text-core-navy dark:text-white">
                1. Logotipo Oficial, Variantes y Recursos Vectoriales SVG
              </h2>
            </div>
            <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
              Símbolo geométrico dinámico de tres piezas diagonales (Cian, Electric Violet y Lime Green)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/brand/coreflow-logo-horizontal-dark.svg"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-core-violet/10 text-core-violet dark:text-indigo-300 text-xs font-semibold hover:bg-core-violet hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Horizontal SVG
            </a>
            <a
              href="/brand/coreflow-isotipo.svg"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-core-violet/10 text-core-violet dark:text-indigo-300 text-xs font-semibold hover:bg-core-violet hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Isotipo SVG
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl bg-core-navy p-5 flex flex-col items-center justify-between min-h-[150px] border border-white/10">
            <div className="flex-1 flex items-center justify-center">
              <CoreFlowLogo variant="horizontal" theme="dark" size="md" showSlogan />
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-3">
              Principal (Horizontal Oscuro)
            </span>
          </div>

          <div className="rounded-xl bg-core-cloud p-5 flex flex-col items-center justify-between min-h-[150px] border border-core-border">
            <div className="flex-1 flex items-center justify-center">
              <CoreFlowLogo variant="horizontal" theme="light" size="md" showSlogan />
            </div>
            <span className="text-[11px] font-medium text-core-muted mt-3">
              Horizontal sobre Claro
            </span>
          </div>

          <div className="rounded-xl bg-core-navy p-5 flex flex-col items-center justify-between min-h-[150px] border border-white/10">
            <div className="flex-1 flex items-center justify-center">
              <CoreFlowLogo variant="vertical" theme="dark" size="sm" showSlogan />
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-3">Vertical con Slogan</span>
          </div>

          <div className="rounded-xl bg-[#1F2247] p-5 flex flex-col items-center justify-between min-h-[150px] border border-white/10">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-core-navy border border-white/15 shadow-lg flex items-center justify-center">
                <CoreFlowIsotipo className="w-11 h-11" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-300 mt-3">
              Isotipo / Favicon
            </span>
          </div>

          <div className="rounded-xl bg-core-navy p-5 flex flex-col items-center justify-between min-h-[150px] border border-white/10">
            <div className="flex-1 flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <CoreFlowIsotipo className="w-8 h-8" mono="white" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                <CoreFlowIsotipo className="w-8 h-8" mono="navy" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-3">
              Monocromático (Blanco / Navy)
            </span>
          </div>
        </div>
      </SurfaceCard>

      {/* 2. TOKENS CENTRALIZADOS DE COLOR Y SISTEMA TIPOGRÁFICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SurfaceCard className="lg:col-span-7 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <GeometricAccentBar size="sm" />
            <h2 className="text-lg font-bold text-core-navy dark:text-white">
              2. Tokens Cromáticos Centralizados
            </h2>
          </div>
          <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5 mb-5">
            Definidos en <code>tokens.css</code> y mapeados en Tailwind. Pulsa cualquier tarjeta para copiar su código HEX.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COLOR_TOKENS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => copyColor(color.hex)}
                className="group text-left rounded-xl border border-core-border dark:border-[#282C5A] p-2.5 hover:border-core-violet transition-all bg-core-cloud/30 dark:bg-[#12142E]"
              >
                <div
                  className="h-12 w-full rounded-lg border border-black/10 flex items-end justify-between p-2 transition-transform group-hover:scale-[1.01]"
                  style={{ backgroundColor: color.hex }}
                >
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      color.textDark
                        ? 'bg-core-navy/10 text-core-navy'
                        : 'bg-white/15 text-white'
                    }`}
                  >
                    {color.group}
                  </span>
                  {copiedHex === color.hex ? (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        color.textDark ? 'text-core-navy' : 'text-white'
                      }`}
                    />
                  ) : (
                    <Copy
                      className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                        color.textDark ? 'text-core-navy' : 'text-white'
                      }`}
                    />
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-core-navy dark:text-white">
                      {color.name}
                    </p>
                    <code className="text-[11px] font-semibold text-core-violet dark:text-indigo-300">
                      {color.hex}
                    </code>
                  </div>
                  <p className="text-[10px] font-mono text-core-muted dark:text-slate-400 mt-0.5">
                    {color.cssVar}
                  </p>
                  <p className="text-[11px] text-core-muted dark:text-slate-400 mt-1 line-clamp-2">
                    {color.role}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        {/* Tipografía Inter */}
        <SurfaceCard className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GeometricAccentBar size="sm" />
              <h2 className="text-lg font-bold text-core-navy dark:text-white">
                3. Sistema Tipográfico: Inter
              </h2>
            </div>
            <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5 mb-5">
              Token <code>--cf-font-sans</code> con soporte de cifras tabulares (<code>tabular-nums</code>).
            </p>

            <div className="p-4 rounded-xl bg-core-cloud/60 dark:bg-[#12142E] border border-core-border dark:border-[#282C5A] mb-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-core-navy dark:text-white">
                  Inter
                </span>
                <span className="text-xl sm:text-2xl font-bold text-core-violet">Aa Bb Cc 123</span>
              </div>
              <p className="text-xs text-core-muted dark:text-slate-400 mt-2 break-all">
                ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz · 0123456789
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-core-border dark:border-[#282C5A]">
                <div>
                  <p className="text-base sm:text-lg font-extrabold text-core-navy dark:text-white">
                    Títulos de Módulo (Extrabold / Bold)
                  </p>
                  <p className="text-[11px] text-core-muted">Inter 700 / 800 · 24px – 30px · tracking-tight</p>
                </div>
                <span className="text-xs font-semibold text-core-violet">H1 / H2</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-core-border dark:border-[#282C5A]">
                <div>
                  <p className="text-sm font-semibold text-core-navy dark:text-white">
                    Subtítulos y Cabeceras de Tarjeta (Semibold / Medium)
                  </p>
                  <p className="text-[11px] text-core-muted">Inter 500 / 600 · 14px – 16px</p>
                </div>
                <span className="text-xs font-semibold text-core-blue">H3 / Label</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-core-border dark:border-[#282C5A]">
                <div>
                  <p className="text-sm font-normal text-core-muted dark:text-slate-300">
                    Cuerpo de texto, tablas y descripciones (Regular)
                  </p>
                  <p className="text-[11px] text-core-muted">Inter 400 · 12px – 14px</p>
                </div>
                <span className="text-xs font-semibold text-core-muted">Body</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-2xl font-extrabold text-core-navy dark:text-white tabular-nums">
                    48 · 132 · 94.2%
                  </p>
                  <p className="text-[11px] text-core-muted">
                    Inter 800 + tabular-nums · Indicadores KPI
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#5A8700] dark:text-core-lime">
                  KPI Metric
                </span>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* 4. COMPONENTES UI, ESTADOS Y VARIANTES DOCUMENTADAS */}
      <SurfaceCard className="p-5 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <GeometricAccentBar size="sm" />
            <h2 className="text-lg font-bold text-core-navy dark:text-white">
              4. Catálogo de Componentes UI, Variantes y Estados Semánticos
            </h2>
          </div>
          <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
            Todos los controles interactivos comparten altura normalizada (<code>h-10</code> = 40px) y radios de 12px–14px.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1: Variantes de Botones */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted">
              Variantes de Botón (&lt;Button /&gt;)
            </h3>
            <div className="flex flex-col items-start gap-3 p-4 rounded-xl bg-core-cloud/50 dark:bg-[#12142E] border border-core-border dark:border-[#282C5A]">
              <Button variant="primary" icon={ArrowRight} className="w-full justify-between">
                variant="primary" (Electric Violet)
              </Button>
              <Button variant="secondary" className="w-full">
                variant="secondary" (Borde Violeta)
              </Button>
              <Button variant="royal" className="w-full">
                variant="royal" (Royal Blue #3568E8)
              </Button>
              <Button variant="outline" className="w-full">
                variant="outline" (Superficie neutra)
              </Button>
              <div className="flex items-center justify-between w-full pt-1">
                <Button variant="text" icon={ArrowRight}>
                  variant="text"
                </Button>
                <Button variant="primary" size="sm">
                  size="sm" (h-8)
                </Button>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted pt-2">
              Tarjeta de Superficie (&lt;SurfaceCard /&gt;)
            </h3>
            <div className="rounded-card border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#12142E] p-4 flex items-center justify-between hover:border-core-violet/40 transition-colors cursor-pointer shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-core-violet/10 text-core-violet dark:text-indigo-300 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-core-navy dark:text-white">
                    Tarjeta interactiva (14px)
                  </p>
                  <p className="text-xs text-core-muted dark:text-slate-400">
                    Sombra suave + borde #E2E6F2
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-core-muted" />
            </div>
          </div>

          {/* Columna 2: Controles de Formulario y Tabs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted">
              Controles de Entrada (Altura h-10)
            </h3>
            <div className="space-y-3 p-4 rounded-xl bg-core-cloud/50 dark:bg-[#12142E] border border-core-border dark:border-[#282C5A]">
              <InputField
                label="InputField estándar"
                placeholder="Ingresa un valor..."
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
              />
              <SearchInput
                placeholder="SearchInput con limpieza..."
                value={demoSearch}
                onChange={(e) => setDemoSearch(e.target.value)}
                onClear={() => setDemoSearch('')}
              />
              <div className="pt-1">
                <label className="text-xs font-semibold text-core-navy dark:text-slate-200 block mb-1.5">
                  Select / Selector de Área
                </label>
                <select className="h-10 w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#171936] px-3.5 text-sm text-core-navy dark:text-white focus:border-core-violet focus:outline-none">
                  <option>Área de Operaciones</option>
                  <option>Área Comercial</option>
                  <option>Área de Calidad</option>
                </select>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted pt-2">
              Navegación por Pestañas (&lt;Tabs /&gt;)
            </h3>
            <div className="px-4 pt-3 pb-1 rounded-xl bg-white dark:bg-[#12142E] border border-core-border dark:border-[#282C5A]">
              <Tabs
                activeTab={demoTab}
                onChange={setDemoTab}
                tabs={[
                  { id: 'general', label: 'General', count: 12 },
                  { id: 'configuracion', label: 'Configuración', count: 5 },
                  { id: 'permisos', label: 'Permisos' },
                ]}
              />
            </div>
          </div>

          {/* Columna 3: Los 5 Estados Semánticos Documentados y Toasts */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted">
              5 Estados Semánticos (&lt;StatusBadge /&gt;)
            </h3>
            <div className="p-4 rounded-xl bg-core-cloud/50 dark:bg-[#12142E] border border-core-border dark:border-[#282C5A] space-y-2.5">
              {STATE_TOKENS.map((st) => (
                <div
                  key={st.status}
                  className="flex items-start justify-between gap-3 pb-2 border-b last:border-b-0 last:pb-0 border-core-border/70 dark:border-[#282C5A]"
                >
                  <div>
                    <StatusBadge status={st.status} label={st.label} size="sm" />
                    <p className="text-[11px] text-core-muted dark:text-slate-400 mt-1">
                      {st.usage}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted pt-1">
              Notificaciones (&lt;ToastNotification /&gt;)
            </h3>
            <ToastNotification
              title="Proceso completado"
              description="Los cambios se guardaron correctamente."
            />
          </div>
        </div>
      </SurfaceCard>

      {/* 5. MATRIZ DE REGLAS Y PERMISOS: COREFLOW START VS COREFLOW BUSINESS */}
      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <GeometricAccentBar size="sm" />
          <h2 className="text-lg font-bold text-core-navy dark:text-white">
            5. Reglas de Negocio y Permisos Aplicados en Lógica (Start vs. Business)
          </h2>
        </div>
        <p className="text-xs text-core-muted dark:text-slate-400 mb-4">
          Ambas ediciones comparten la misma plataforma y sistema visual; las capacidades se habilitan o restringen dinámicamente mediante <code>checkCapability(edition, role, capability)</code> en <code>src/data/demoStore.js</code>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-core-border dark:border-[#282C5A] text-[11px] font-bold uppercase tracking-wider text-core-muted dark:text-slate-400">
                <th className="py-3 px-3">Capacidad / Regla</th>
                <th className="py-3 px-3">CoreFlow Starter (1–15 colab.)</th>
                <th className="py-3 px-3">CoreFlow Business (16–30 colab.)</th>
                <th className="py-3 px-3">Comportamiento Lógico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A]">
              <tr>
                <td className="py-3 px-3 font-semibold text-core-navy dark:text-white">
                  Departamentos y equipos
                </td>
                <td className="py-3 px-3 text-core-muted">No incluido (estructura única)</td>
                <td className="py-3 px-3 font-semibold text-core-violet dark:text-indigo-300">
                  Habilitado (5 áreas activas)
                </td>
                <td className="py-3 px-3 text-xs text-core-muted dark:text-slate-300">
                  Al cambiar a Start se restablece automáticamente el filtro de departamento a <code>all</code>.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-core-navy dark:text-white">
                  Aprobaciones multinivel
                </td>
                <td className="py-3 px-3 text-core-muted">Flujo directo de 1 paso</td>
                <td className="py-3 px-3 font-semibold text-core-violet dark:text-indigo-300">
                  Validación por niveles y rol
                </td>
                <td className="py-3 px-3 text-xs text-core-muted dark:text-slate-300">
                  Verifica plan Business y que el rol activo posea <code>canApproveMultilevel: true</code>.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-core-navy dark:text-white">
                  Indicadores por responsable
                </td>
                <td className="py-3 px-3 text-core-muted">Indicadores globales</td>
                <td className="py-3 px-3 font-semibold text-core-violet dark:text-indigo-300">
                  Desglose por área y rol
                </td>
                <td className="py-3 px-3 text-xs text-core-muted dark:text-slate-300">
                  Habilita la pestaña de cumplimiento por área en el Dashboard.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  )
}
