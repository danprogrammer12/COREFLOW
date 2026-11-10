import React, { useState } from 'react'
import {
  ArrowRight,
  Copy,
  Check,
  Download,
  FileText,
  ChevronRight,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { CoreFlowLogo, CoreFlowIsotipo, DiagonalBrandCanvas } from '../components/brand/CoreFlowLogo'
import {
  Button,
  StatusBadge,
  SurfaceCard,
  InputField,
  SearchInput,
  Tabs,
  ToastNotification,
} from '../components/ui/Primitives'

const COLOR_TOKENS = [
  {
    name: 'Midnight Navy',
    hex: '#171936',
    role: 'Navegación lateral, fondos oscuros de marca y texto principal',
    group: 'Principal',
    textDark: false,
  },
  {
    name: 'Electric Violet',
    hex: '#6545E8',
    role: 'Identidad principal y acciones primarias de interacción',
    group: 'Principal',
    textDark: false,
  },
  {
    name: 'Royal Blue',
    hex: '#3568E8',
    role: 'Acciones secundarias y soporte de navegación',
    group: 'Principal',
    textDark: false,
  },
  {
    name: 'Cyan',
    hex: '#08C9E8',
    role: 'Acentos selectivos, estados en proceso y detalles informativos',
    group: 'Acento',
    textDark: true,
  },
  {
    name: 'Lime Green',
    hex: '#A6E91C',
    role: 'Éxito, evolución y elementos destacados puntuales',
    group: 'Acento',
    textDark: true,
  },
  {
    name: 'Cloud Gray',
    hex: '#F4F5FA',
    role: 'Fondo general de la aplicación SaaS',
    group: 'Neutral',
    textDark: true,
  },
  {
    name: 'White Surface',
    hex: '#FFFFFF',
    role: 'Tarjetas, tablas, modales y superficies limpias',
    group: 'Neutral',
    textDark: true,
  },
  {
    name: 'Slate Muted',
    hex: '#64748B',
    role: 'Texto secundario, etiquetas y metadatos',
    group: 'Neutral',
    textDark: false,
  },
  {
    name: 'Soft Border',
    hex: '#E2E6F2',
    role: 'Bordes sutiles de tarjetas, divisores y controles',
    group: 'Neutral',
    textDark: true,
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
            Sistema de Diseño Oficial · Webcore
          </span>
          <CoreFlowLogo variant="horizontal" theme="dark" size="xl" showSlogan />
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl pt-1">
            Lenguaje visual de <strong className="text-white">geometría dinámica y modular</strong>.
            Interfaz predominantemente clara con navegación lateral en Midnight Navy, tarjetas limpias
            de 14px, tipografía <strong className="text-white">Inter</strong> y jerarquía cromática
            liderada por Electric Violet.
          </p>
        </div>
      </DiagonalBrandCanvas>

      {/* 1. VERSIONES DEL LOGOTIPO (Horizontal, Vertical, Isotipo, Monocromático, Favicon) */}
      <SurfaceCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-core-navy dark:text-white">
              1. Versiones del Logotipo y Recursos SVG
            </h2>
            <p className="text-xs text-core-muted dark:text-slate-400">
              Símbolo geométrico dinámico de tres elementos diagonales con proporciones consistentes
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
          {/* Principal Horizontal (Oscuro) */}
          <div className="rounded-xl bg-core-navy p-5 flex flex-col items-center justify-between min-h-[150px] border border-white/10">
            <div className="flex-1 flex items-center justify-center">
              <CoreFlowLogo variant="horizontal" theme="dark" size="md" showSlogan />
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-3">
              Principal (Horizontal)
            </span>
          </div>

          {/* Principal Horizontal (Claro) */}
          <div className="rounded-xl bg-core-cloud p-5 flex flex-col items-center justify-between min-h-[150px] border border-core-border">
            <div className="flex-1 flex items-center justify-center">
              <CoreFlowLogo variant="horizontal" theme="light" size="md" showSlogan />
            </div>
            <span className="text-[11px] font-medium text-core-muted mt-3">
              Versión sobre fondo claro
            </span>
          </div>

          {/* Vertical */}
          <div className="rounded-xl bg-core-navy p-5 flex flex-col items-center justify-between min-h-[150px] border border-white/10">
            <div className="flex-1 flex items-center justify-center">
              <CoreFlowLogo variant="vertical" theme="dark" size="sm" showSlogan />
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-3">Vertical</span>
          </div>

          {/* Isotipo / Ícono de aplicación */}
          <div className="rounded-xl bg-[#1F2247] p-5 flex flex-col items-center justify-between min-h-[150px] border border-white/10">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-core-navy border border-white/15 shadow-lg flex items-center justify-center">
                <CoreFlowIsotipo className="w-11 h-11" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-300 mt-3">
              Isotipo / App Icon
            </span>
          </div>

          {/* Monocromático */}
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

      {/* 2. PALETA DE COLORES + SISTEMA TIPOGRÁFICO INTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Paleta de Colores */}
        <SurfaceCard className="lg:col-span-7 p-6">
          <h2 className="text-lg font-bold text-core-navy dark:text-white">
            2. Paleta Cromática Oficial
          </h2>
          <p className="text-xs text-core-muted dark:text-slate-400 mb-5">
            El violeta (#6545E8) es el acento principal de interacción; el cian y el verde lima se usan selectivamente. Haz clic en cualquier muestra para copiar su HEX.
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
                  className="h-14 w-full rounded-lg border border-black/10 flex items-end justify-between p-2 transition-transform group-hover:scale-[1.01]"
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
                  <p className="text-[11px] text-core-muted dark:text-slate-400 mt-0.5 line-clamp-2">
                    {color.role}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        {/* Tipografía Inter */}
        <SurfaceCard className="lg:col-span-5 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-core-navy dark:text-white">
              3. Tipografía Principal: Inter
            </h2>
            <p className="text-xs text-core-muted dark:text-slate-400 mb-5">
              Jerarquía clara enfocada en legibilidad empresarial, tablas de datos e indicadores.
            </p>

            <div className="p-4 rounded-xl bg-core-cloud/60 dark:bg-[#12142E] border border-core-border dark:border-[#282C5A] mb-4">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-extrabold tracking-tight text-core-navy dark:text-white">
                  Inter
                </span>
                <span className="text-2xl font-bold text-core-violet">Aa Bb Cc 123</span>
              </div>
              <p className="text-xs text-core-muted dark:text-slate-400 mt-2">
                ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz · 0123456789
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-core-border dark:border-[#282C5A]">
                <div>
                  <p className="text-lg font-bold text-core-navy dark:text-white">
                    Títulos de Módulo (Bold / Semibold)
                  </p>
                  <p className="text-[11px] text-core-muted">Inter 700 / 600 · 24px - 30px</p>
                </div>
                <span className="text-xs font-semibold text-core-violet">Títulos</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-core-border dark:border-[#282C5A]">
                <div>
                  <p className="text-sm font-medium text-core-navy dark:text-white">
                    Subtítulos y Cabeceras de Sección (Medium)
                  </p>
                  <p className="text-[11px] text-core-muted">Inter 500 · 14px - 16px</p>
                </div>
                <span className="text-xs font-semibold text-core-blue">Subtítulos</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-core-border dark:border-[#282C5A]">
                <div>
                  <p className="text-sm font-normal text-core-muted dark:text-slate-300">
                    Cuerpo de texto, tablas y descripciones operativas (Regular)
                  </p>
                  <p className="text-[11px] text-core-muted">Inter 400 · 13px - 14px</p>
                </div>
                <span className="text-xs font-semibold text-core-muted">Texto</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-2xl font-semibold text-core-navy dark:text-white">
                    48 · $36,180K · 94.2%
                  </p>
                  <p className="text-[11px] text-core-muted">Inter 600 Semibold · Indicadores KPI</p>
                </div>
                <span className="text-xs font-semibold text-[#5A8700] dark:text-core-lime">
                  Indicadores
                </span>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* 4. COMPONENTES UI Y ESTADOS VISUALES (Fiel a la lámina de diseño) */}
      <SurfaceCard className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-core-navy dark:text-white">
            4. Componentes UI Reutilizables y Estados Visuales
          </h2>
          <p className="text-xs text-core-muted dark:text-slate-400">
            Biblioteca base que alimenta el Dashboard y todos los módulos funcionales de CoreFlow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna 1: Botones y Tarjetas */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted">
              Botones de Acción
            </h3>
            <div className="flex flex-col items-start gap-3 p-4 rounded-xl bg-core-cloud/50 dark:bg-[#12142E] border border-core-border dark:border-[#282C5A]">
              <Button variant="primary" icon={ArrowRight} className="w-full justify-between">
                Botón primario
              </Button>
              <Button variant="secondary" className="w-full">
                Botón secundario
              </Button>
              <Button variant="royal" className="w-full">
                Acción secundaria (Royal Blue)
              </Button>
              <Button variant="text" icon={ArrowRight}>
                Botón texto
              </Button>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted pt-2">
              Tarjeta Interactiva (14px radius)
            </h3>
            <div className="rounded-card border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#12142E] p-4 flex items-center justify-between hover:border-core-violet/40 transition-colors cursor-pointer shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-core-violet/10 text-core-violet flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-core-navy dark:text-white">
                    Título de tarjeta
                  </p>
                  <p className="text-xs text-core-muted dark:text-slate-400">
                    Descripción breve del contenido
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-core-muted" />
            </div>
          </div>

          {/* Columna 2: Inputs, Search, Tabs y Select */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted">
              Inputs y Controles de Formulario
            </h3>
            <div className="space-y-3 p-4 rounded-xl bg-core-cloud/50 dark:bg-[#12142E] border border-core-border dark:border-[#282C5A]">
              <InputField
                label="Etiqueta"
                placeholder="Ingresa un valor..."
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
              />
              <SearchInput
                placeholder="Buscar..."
                value={demoSearch}
                onChange={(e) => setDemoSearch(e.target.value)}
              />
              <div className="pt-1">
                <label className="text-xs font-medium text-core-muted dark:text-slate-300 block mb-1.5">
                  Select / Dropdown
                </label>
                <select className="w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#171936] px-3.5 py-2.5 text-sm text-core-navy dark:text-white focus:border-core-violet focus:outline-none">
                  <option>Opción seleccionada</option>
                  <option>Departamento de Operaciones</option>
                  <option>Departamento Comercial</option>
                </select>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted pt-2">
              Navegación por Tabs
            </h3>
            <div className="px-4 pt-3 pb-1 rounded-xl bg-white dark:bg-[#12142E] border border-core-border dark:border-[#282C5A]">
              <Tabs
                activeTab={demoTab}
                onChange={setDemoTab}
                tabs={[
                  { id: 'general', label: 'General' },
                  { id: 'configuracion', label: 'Configuración' },
                  { id: 'permisos', label: 'Permisos' },
                ]}
              />
            </div>
          </div>

          {/* Columna 3: Estados Semánticos y Toasts */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted">
              Estados Visuales Coherentes
            </h3>
            <div className="p-4 rounded-xl bg-core-cloud/50 dark:bg-[#12142E] border border-core-border dark:border-[#282C5A] flex flex-wrap gap-2.5">
              <StatusBadge status="active" label="Activo" />
              <StatusBadge status="process" label="En proceso" />
              <StatusBadge status="pending" label="Pendiente" />
              <StatusBadge status="completed" label="Completado" />
              <StatusBadge status="error" label="Error" />
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-core-muted pt-2">
              Toasts / Notificaciones
            </h3>
            <ToastNotification
              title="Proceso completado"
              description="Los cambios se guardaron correctamente."
            />
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}
