import React, { useState } from 'react'
import {
  Home,
  Users,
  Briefcase,
  Inbox,
  GitBranch,
  CheckSquare,
  FileText,
  BarChart3,
  Settings,
  Palette,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Building2,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react'
import { CoreFlowLogo } from '../brand/CoreFlowLogo'
import { GeometricAccentBar } from '../ui/Primitives'

export function AppShell({
  activeView,
  onNavigate,
  edition,
  onEditionChange,
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onOpenAiAssistant,
  counts = { clientes: 48, comercial: 16, solicitudes: 9, tareas: 24 },
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [orgSelectorOpen, setOrgSelectorOpen] = useState(false)
  const [editionInfoOpen, setEditionInfoOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('Entorno Principal · Sede Central')
  const [activeRole, setActiveRole] = useState('Administrador Organizacional')

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Solicitud #SOL-458 asignada al área de Operaciones',
      time: 'Hace 15 min',
      unread: true,
      targetView: 'dashboard',
    },
    {
      id: 2,
      title: 'Aprobación multinivel pendiente en flujo #APR-102',
      time: 'Hace 1 hora',
      unread: true,
      targetView: 'dashboard',
    },
    {
      id: 3,
      title: 'Procedimiento estandarizado validado en Documentos',
      time: 'Hace 2 horas',
      unread: false,
      targetView: 'documentos',
    },
  ])

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home, badge: null },
    { id: 'clientes', label: 'Clientes', icon: Users, badge: String(counts.clientes) },
    { id: 'comercial', label: 'Comercial', icon: Briefcase, badge: String(counts.comercial) },
    { id: 'solicitudes', label: 'Solicitudes', icon: Inbox, badge: String(counts.solicitudes) },
    { id: 'procesos', label: 'Procesos', icon: GitBranch, badge: null },
    { id: 'tareas', label: 'Tareas', icon: CheckSquare, badge: String(counts.tareas) },
    { id: 'documentos', label: 'Documentos', icon: FileText, badge: null },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, badge: null },
    { id: 'configuracion', label: 'Configuración', icon: Settings, badge: null },
  ]

  const viewLabels = {
    dashboard: 'Dashboard Operativo',
    'design-system': 'Sistema de Diseño y Marca',
    clientes: 'Gestión de Clientes',
    comercial: 'Gestión Comercial',
    solicitudes: 'Gestión de Solicitudes',
    procesos: 'Procesos y Flujos',
    tareas: 'Tareas y Calendario',
    documentos: 'Repositorio Documental',
    reportes: 'Reportes e Indicadores',
    configuracion: 'Configuración Organizacional',
  }

  const organizations = [
    'Entorno Principal · Sede Central',
    'Unidad Operativa 02 · Regional',
    'Entorno de Validación · Demo',
  ]

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleNavClick = (id) => {
    onNavigate(id)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-core-cloud dark:bg-[#0F1126] text-core-navy dark:text-slate-100 transition-colors duration-200">
      {/* Overlay móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-core-navy/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* A. SIDEBAR LATERAL OSCURO (#171936 Midnight Navy) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-core-navy text-white flex flex-col justify-between border-r border-white/10 transition-transform duration-200 ease-out lg:static lg:translate-x-0 shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Cabecera del Sidebar con Logotipo y geometría sutil */}
          <div className="relative h-16 px-5 flex items-center justify-between border-b border-white/10 overflow-hidden">
            <svg
              className="pointer-events-none absolute top-0 right-0 w-24 h-16 opacity-30"
              viewBox="0 0 100 64"
              fill="none"
              aria-hidden="true"
            >
              <path d="M45 -10 L110 55 L110 25 L75 -10 Z" fill="#6545E8" />
              <path d="M75 -10 L110 25 L110 5 L95 -10 Z" fill="#08C9E8" />
            </svg>

            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className="relative z-10 focus:outline-none text-left"
            >
              <CoreFlowLogo variant="horizontal" theme="dark" size="sm" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden relative z-10 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tarjeta de Edición Activa en Sidebar */}
          <div className="px-3.5 pt-3.5 pb-1.5">
            <div className="relative overflow-hidden rounded-xl bg-[#1E2146] border border-white/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      edition === 'business' ? 'bg-core-lime' : 'bg-core-cyan'
                    }`}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                    CoreFlow {edition === 'business' ? 'Business' : 'Start'}
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-200 tabular-nums">
                  {edition === 'business' ? '16–30 colab.' : '1–15 colab.'}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-300 leading-snug">
                {edition === 'business'
                  ? 'Departamentos, aprobaciones multinivel e indicadores por área activos.'
                  : 'Gestión esencial de clientes, solicitudes, documentos y tareas.'}
              </p>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="px-3 py-2 space-y-0.5" aria-label="Navegación principal">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Módulos de plataforma
            </p>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-core-violet text-white font-semibold shadow-md shadow-core-violet/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/6'
                  }`}
                >
                  {/* Indicador diagonal geométrico cuando está activo */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-core-lime"
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                      strokeWidth={1.85}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Sección Validación de Diseño & Acceso */}
            <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-core-cyan">
                Validación Fase 1
              </p>
              <button
                type="button"
                onClick={() => handleNavClick('design-system')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                  activeView === 'design-system'
                    ? 'bg-core-violet text-white font-semibold shadow-md shadow-core-violet/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/6'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-core-lime" strokeWidth={1.85} />
                  <span>Sistema de Diseño</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-core-lime/20 text-core-lime font-bold">
                  UI Kit
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/6 transition-all"
              >
                <span className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-core-cyan" strokeWidth={1.85} />
                  <span>Vista Login / Acceso</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </nav>
        </div>

        {/* Pie del Sidebar: Perfil de Sesión Interactiva */}
        <div className="relative p-3 border-t border-white/10 bg-[#12142B]">
          {userMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 rounded-xl bg-[#1C2042] border border-white/15 shadow-float p-2 z-50 space-y-1">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-core-cyan">
                Cambiar perfil de vista
              </p>
              {['Administrador Organizacional', 'Coordinación de Operaciones', 'Líder de Área Comercial'].map(
                (role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setActiveRole(role)
                      setUserMenuOpen(false)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      activeRole === role
                        ? 'bg-core-violet text-white font-semibold'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">{role}</span>
                    {activeRole === role && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                )
              )}
              <div className="pt-1 mt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onOpenAuth()
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-core-lime hover:bg-white/10 font-semibold flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Ir a pantalla de Inicio de Sesión
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-white/6 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-core-violet to-core-cyan flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                CF
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-core-lime ring-2 ring-[#12142B]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Sesión Demostrativa</p>
                <p className="text-[11px] text-slate-400 truncate">{activeRole}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* B. TOPBAR REFINADA (Jerarquía de 3 Zonas con controles h-10 alineados) */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#171936]/95 backdrop-blur-md border-b border-core-border dark:border-[#282C5A] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* ZONA 1 (Izquierda): Menú Móvil + Indicador de Vista + Búsqueda Global */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-navy dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb contextual en escritorio */}
            <div className="hidden xl:flex items-center gap-2 pr-2 border-r border-core-border dark:border-[#282C5A] shrink-0">
              <GeometricAccentBar size="sm" />
              <span className="text-xs font-bold text-core-navy dark:text-white">
                {viewLabels[activeView] || 'Dashboard'}
              </span>
            </div>

            {/* Buscador Global con limpieza rápida */}
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-core-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.8}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filtrar solicitudes, cuentas, códigos o responsables..."
                className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/75 dark:bg-[#101228] pl-10 pr-16 text-xs sm:text-sm text-core-navy dark:text-white placeholder:text-core-muted focus:bg-white dark:focus:bg-[#141736] focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/20 transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-core-navy dark:text-white"
                >
                  Limpiar
                </button>
              ) : (
                <span className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] text-[10px] font-semibold text-core-muted pointer-events-none">
                  Filtro activo
                </span>
              )}
            </div>
          </div>

          {/* ZONA 2 Y 3 (Derecha): Entorno + Selector Start/Business + Utilidades */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Selector de Entorno Organizacional */}
            <div className="relative hidden 2xl:block">
              <button
                type="button"
                onClick={() => {
                  setOrgSelectorOpen(!orgSelectorOpen)
                  setNotificationsOpen(false)
                  setEditionInfoOpen(false)
                }}
                className="h-10 flex items-center gap-2 rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 text-xs font-semibold text-core-navy dark:text-slate-200 hover:border-core-violet/40 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-core-violet shrink-0" strokeWidth={1.9} />
                <span className="max-w-[180px] truncate">{selectedOrg}</span>
                <ChevronDown className="w-3.5 h-3.5 text-core-muted shrink-0" />
              </button>

              {orgSelectorOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-card bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-float p-2 z-50">
                  <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-core-muted">
                    Seleccionar entorno organizacional
                  </p>
                  {organizations.map((org) => (
                    <button
                      key={org}
                      type="button"
                      onClick={() => {
                        setSelectedOrg(org)
                        setOrgSelectorOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                        selectedOrg === org
                          ? 'bg-core-violet/10 text-core-violet dark:text-indigo-300 font-semibold'
                          : 'text-core-navy dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{org}</span>
                      {selectedOrg === org && (
                        <Check className="w-3.5 h-3.5 text-core-violet shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SELECTOR START / BUSINESS PERFECCIONADO */}
            <div className="relative flex items-center">
              <div
                className="h-10 inline-flex items-center rounded-xl bg-core-cloud dark:bg-[#101228] p-1 border border-core-border dark:border-[#282C5A]"
                role="group"
                aria-label="Selector de edición CoreFlow"
              >
                <button
                  type="button"
                  onClick={() => onEditionChange('start')}
                  className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    edition === 'start'
                      ? 'bg-core-navy dark:bg-core-violet text-white shadow-xs'
                      : 'text-core-muted dark:text-slate-400 hover:text-core-navy dark:hover:text-white'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      edition === 'start' ? 'bg-core-cyan' : 'bg-slate-400'
                    }`}
                  />
                  <span>Start</span>
                  <span className="hidden md:inline text-[10px] opacity-80 font-normal">1–15</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEditionChange('business')}
                  className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    edition === 'business'
                      ? 'bg-core-violet text-white shadow-xs'
                      : 'text-core-muted dark:text-slate-400 hover:text-core-navy dark:hover:text-white'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      edition === 'business' ? 'bg-core-lime' : 'bg-slate-400'
                    }`}
                  />
                  <span>Business</span>
                  <span className="hidden md:inline text-[10px] opacity-85 font-normal">16–30</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditionInfoOpen(!editionInfoOpen)
                    setNotificationsOpen(false)
                    setOrgSelectorOpen(false)
                  }}
                  className="hidden sm:inline-flex h-8 w-7 items-center justify-center rounded-lg text-core-muted hover:text-core-violet dark:hover:text-white"
                  title="Ver comparativa de capacidades Start vs Business"
                  aria-label="Información de ediciones"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Popover comparativo de alcance de edición */}
              {editionInfoOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-card bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-float p-4 z-50">
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-core-border dark:border-[#282C5A]">
                    <div>
                      <p className="text-xs font-bold text-core-navy dark:text-white">
                        Alcance de Ediciones CoreFlow
                      </p>
                      <p className="text-[11px] text-core-muted dark:text-slate-400">
                        Misma plataforma y sistema visual, capacidades según plan
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditionInfoOpen(false)}
                      className="text-slate-400 hover:text-core-navy dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div
                      onClick={() => {
                        onEditionChange('start')
                        setEditionInfoOpen(false)
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        edition === 'start'
                          ? 'border-core-cyan bg-core-cyan/5 dark:bg-core-cyan/10'
                          : 'border-core-border dark:border-[#282C5A] hover:border-core-cyan/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-core-navy dark:text-white">
                        <span>CoreFlow Start (1 a 15 colaboradores)</span>
                        {edition === 'start' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-core-cyan/20 text-[#0369A1] dark:text-core-cyan">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-core-muted dark:text-slate-300">
                        Clientes, solicitudes y oportunidades, documentos, tareas, automatizaciones básicas, asistente IA y roles básicos.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        onEditionChange('business')
                        setEditionInfoOpen(false)
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        edition === 'business'
                          ? 'border-core-violet bg-core-violet/5 dark:bg-core-violet/15'
                          : 'border-core-border dark:border-[#282C5A] hover:border-core-violet/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-core-navy dark:text-white">
                        <span>CoreFlow Business (16 a 30 colaboradores)</span>
                        {edition === 'business' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-core-violet text-white">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-core-muted dark:text-slate-300">
                        Todo Start + Departamentos y equipos, permisos granulares, aprobaciones multinivel, automatizaciones entre áreas e indicadores por responsable.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Separador vertical de zona de utilidades */}
            <div className="hidden sm:block h-6 w-px bg-core-border dark:bg-[#282C5A] mx-0.5" />

            {/* Botón Asistente IA */}
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="h-10 inline-flex items-center gap-1.5 rounded-xl border border-core-violet/30 bg-core-violet/8 dark:bg-core-violet/20 hover:bg-core-violet hover:text-white text-core-violet dark:text-indigo-300 px-3 text-xs font-semibold transition-all"
              title="Abrir Asistente Operativo IA"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden md:inline">Asistente IA</span>
            </button>

            {/* Toggle Vista Clara / Resumen Ejecutivo Oscuro */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-muted dark:text-slate-300 hover:text-core-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title={darkMode ? 'Cambiar a Interfaz Clara principal' : 'Cambiar a Vista Ejecutiva Oscura'}
              aria-label="Alternar tema visual"
            >
              {darkMode ? <Sun className="w-4 h-4 text-core-lime" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Centro de Notificaciones funcional */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen)
                  setOrgSelectorOpen(false)
                  setEditionInfoOpen(false)
                }}
                className="relative h-10 w-10 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-muted dark:text-slate-300 hover:text-core-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Notificaciones"
              >
                <Bell className="w-4 h-4" strokeWidth={1.85} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-core-violet ring-2 ring-white dark:ring-[#171936]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-card bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-float p-3.5 z-50">
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-core-border dark:border-[#282C5A]">
                    <span className="text-xs font-bold text-core-navy dark:text-white">
                      Notificaciones operativas ({unreadCount} sin leer)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-core-violet dark:text-indigo-300 hover:underline"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((item) =>
                              item.id === n.id ? { ...item, unread: false } : item
                            )
                          )
                          setNotificationsOpen(false)
                          onNavigate(n.targetView)
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start justify-between gap-2 ${
                          n.unread
                            ? 'bg-core-violet/6 dark:bg-core-violet/15'
                            : 'hover:bg-core-cloud dark:hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-core-navy dark:text-slate-100">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-core-muted dark:text-slate-400 mt-0.5">
                            {n.time}
                          </p>
                        </div>
                        {n.unread && (
                          <span className="w-2 h-2 rounded-full bg-core-violet mt-1 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acceso directo al Sistema de Diseño */}
            <button
              type="button"
              onClick={() => handleNavClick('design-system')}
              className={`hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                activeView === 'design-system'
                  ? 'border-core-violet bg-core-violet text-white'
                  : 'border-core-border dark:border-[#282C5A] text-core-muted dark:text-slate-300 hover:text-core-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
              title="Inspeccionar Sistema de Diseño y Recursos de Marca"
              aria-label="Sistema de Diseño"
            >
              <HelpCircle className="w-4 h-4" strokeWidth={1.85} />
            </button>
          </div>
        </header>

        {/* C. ÁREA DE CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* BARRA DE NAVEGACIÓN COMPACTA MÓVIL */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-core-navy text-white border-t border-white/10 px-2 py-1.5 flex items-center justify-around"
          aria-label="Navegación rápida móvil"
        >
          {[
            { id: 'dashboard', label: 'Inicio', icon: Home },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'solicitudes', label: 'Solicitudes', icon: Inbox },
            { id: 'tareas', label: 'Tareas', icon: CheckSquare },
            { id: 'design-system', label: 'Sistema UI', icon: Palette },
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-medium ${
                  isActive ? 'text-core-lime font-semibold' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-core-lime' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
