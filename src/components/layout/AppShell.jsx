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
  Check,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react'
import { CoreFlowLogo } from '../brand/CoreFlowLogo'
import { GeometricAccentBar } from '../ui/Primitives'
import { EDITION_RULES, ROLES_CONFIG } from '../../data/demoStore'

export function AppShell({
  activeView,
  onNavigate,
  edition,
  entitlementsResolved = null,
  activeOrganization = null,
  accessibleOrganizations = [],
  onSwitchOrganization,
  user = null,
  activeRole,
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onSignOut,
  onOpenAiAssistant,
  counts = { clientes: 48, comercial: 16, solicitudes: 9, tareas: 24 },
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [orgSelectorOpen, setOrgSelectorOpen] = useState(false)
  const [editionInfoOpen, setEditionInfoOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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

  const planConfig = EDITION_RULES[edition] || EDITION_RULES.start
  const collabStatus = entitlementsResolved?.collaboratorsStatus || {
    current: planConfig.activeCollaborators,
    max: planConfig.maxCollaborators,
  }

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
        <div className="overflow-y-auto">
          {/* Cabecera del Sidebar con Logotipo */}
          <div className="relative h-16 px-5 flex items-center justify-between border-b border-white/10 overflow-hidden shrink-0">
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

          {/* Tarjeta de Suscripción Contratada en Sidebar (Proveniente de PostgreSQL) */}
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
                    {entitlementsResolved?.contractedPlanName || planConfig.name}
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-200 tabular-nums">
                  {collabStatus.current}/{collabStatus.max} colab.
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-300 leading-snug">
                {edition === 'business'
                  ? 'Departamentos, aprobaciones multinivel e indicadores por área activos.'
                  : 'Suscripción Starter (1–15 colab.): flujo directo, clientes, tareas y documentos.'}
              </p>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span className="text-core-cyan font-semibold">Suscripción verificada en BD</span>
                <span className="px-1.5 py-0.5 rounded bg-core-lime/20 text-core-lime font-bold uppercase">
                  {entitlementsResolved?.subscriptionStatus || 'Activa'}
                </span>
              </div>
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
                onClick={onSignOut || onOpenAuth}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/6 transition-all"
              >
                <span className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-core-cyan" strokeWidth={1.85} />
                  <span>Cambiar cuenta / Cerrar sesión</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </nav>
        </div>

        {/* Pie del Sidebar: Sesión Autenticada y Rol Organizacional Real */}
        <div className="relative p-3 border-t border-white/10 bg-[#12142B] shrink-0">
          {userMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 rounded-xl bg-[#1C2042] border border-white/15 shadow-float p-3 z-50 space-y-2">
              <div className="pb-2 border-b border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-core-cyan">
                  Sesión Autenticada
                </p>
                <p className="text-xs font-bold text-white truncate mt-0.5">
                  {user?.fullName || activeRole}
                </p>
                <p className="text-[11px] font-mono text-slate-300 truncate">
                  {user?.email || 'sesion@coreflow.app'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  if (onSignOut) {
                    onSignOut()
                  } else {
                    onOpenAuth?.()
                  }
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs bg-core-violet hover:bg-core-blue text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-core-lime" />
                Cerrar sesión
              </button>
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
                <p className="text-xs font-semibold text-white truncate">
                  {user?.fullName || 'Usuario Autenticado'}
                </p>
                <p className="text-[11px] text-core-cyan truncate">{activeRole}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* B. TOPBAR CORREGIDA (Sin superposición en el buscador global en ninguna resolución) */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#171936]/95 backdrop-blur-md border-b border-core-border dark:border-[#282C5A] px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* ZONA 1 (Izquierda): Menú Móvil + Indicador de Vista + Búsqueda Global Limpia */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-navy dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb contextual en escritorio amplio */}
            <div className="hidden xl:flex items-center gap-2 pr-3 border-r border-core-border dark:border-[#282C5A] shrink-0">
              <GeometricAccentBar size="sm" />
              <span className="text-xs font-bold text-core-navy dark:text-white whitespace-nowrap">
                {viewLabels[activeView] || 'Dashboard'}
              </span>
            </div>

            {/* Buscador Global SIN etiquetas flotantes que invadan el placeholder */}
            <div className="relative flex-1 min-w-0">
              <Search
                className="w-4 h-4 text-core-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.8}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar solicitudes, códigos o cuentas..."
                aria-label="Buscar en CoreFlow"
                className={`h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/75 dark:bg-[#101228] pl-10 ${
                  searchQuery ? 'pr-9' : 'pr-3.5'
                } text-xs sm:text-sm text-core-navy dark:text-white placeholder:text-core-muted focus:bg-white dark:focus:bg-[#141736] focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/20 transition-all truncate`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-core-muted hover:text-core-navy dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ZONA 2 Y 3 (Derecha): Entorno + Selector Start/Business + Utilidades */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Selector de Entorno Organizacional Multi-Tenant */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => {
                  setOrgSelectorOpen(!orgSelectorOpen)
                  setNotificationsOpen(false)
                  setEditionInfoOpen(false)
                }}
                className="h-10 flex items-center gap-2 rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 text-xs font-semibold text-core-navy dark:text-slate-200 hover:border-core-violet/40 transition-colors"
                title="Cambiar organización activa (Aislamiento Multi-Tenant)"
              >
                <Building2 className="w-3.5 h-3.5 text-core-violet shrink-0" strokeWidth={1.9} />
                <span className="max-w-[190px] truncate">
                  {activeOrganization?.displayName || 'Entorno Principal · Sede Central'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-core-muted shrink-0" />
              </button>

              {orgSelectorOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-card bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-float p-2.5 z-50">
                  <div className="px-2.5 py-1.5 border-b border-core-border dark:border-[#282C5A] mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-core-muted">
                      Organizaciones con membresía activa (RLS)
                    </p>
                  </div>
                  <div className="space-y-1">
                    {accessibleOrganizations.map((org) => {
                      const isSelected = activeOrganization?.id === org.id
                      return (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => {
                            onSwitchOrganization?.(org.id)
                            setOrgSelectorOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-core-violet/10 text-core-violet dark:text-indigo-300 font-semibold border border-core-violet/25'
                              : 'text-core-navy dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{org.displayName}</p>
                            <p className="text-[10px] text-core-muted dark:text-slate-400 truncate">
                              Plan contratado: {String(org.contractedPlanCode).toUpperCase()} ·{' '}
                              {org.activeCollaboratorsCount} colab.
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-core-violet shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* INDICADOR DE SUSCRIPCIÓN CONTRATADA (SIN SIMULACIÓN DESDE TOPBAR) */}
            <div className="relative flex items-center">
              <div
                className="h-10 inline-flex items-center rounded-xl bg-core-cloud dark:bg-[#101228] px-2.5 border border-core-border dark:border-[#282C5A] gap-2"
                role="status"
                aria-label="Suscripción activa de la organización"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    edition === 'business' ? 'bg-core-lime' : 'bg-core-cyan'
                  }`}
                />
                <span className="text-xs font-extrabold text-core-navy dark:text-white">
                  {entitlementsResolved?.contractedPlanName ||
                    (edition === 'business' ? 'CoreFlow Business' : 'CoreFlow Starter')}
                </span>
                <span className="hidden md:inline text-[11px] font-semibold px-1.5 py-0.5 rounded bg-core-violet/10 text-core-violet dark:text-indigo-300 tabular-nums">
                  {collabStatus.current}/{collabStatus.max} colab.
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setEditionInfoOpen(!editionInfoOpen)
                    setNotificationsOpen(false)
                    setOrgSelectorOpen(false)
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-core-muted hover:text-core-violet dark:hover:text-white"
                  title="Ver detalles de suscripción y capacidades habilitadas en PostgreSQL"
                  aria-label="Información de suscripción"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {editionInfoOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-card bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-float p-4 z-50">
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-core-border dark:border-[#282C5A]">
                    <div>
                      <p className="text-xs font-bold text-core-navy dark:text-white">
                        Suscripción y Capacidades del Tenant
                      </p>
                      <p className="text-[11px] text-core-muted dark:text-slate-400">
                        Administrado desde CoreFlow Platform Admin (PostgreSQL)
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

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl border border-core-violet/30 bg-core-violet/5 dark:bg-core-violet/15">
                      <div className="flex items-center justify-between font-bold text-core-navy dark:text-white">
                        <span>
                          {entitlementsResolved?.contractedPlanName || planConfig.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-core-violet text-white uppercase">
                          {entitlementsResolved?.subscriptionStatus || 'active'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-core-muted dark:text-slate-300">
                        Cuota activa: <strong>{collabStatus.current}</strong> de{' '}
                        <strong>{collabStatus.max}</strong> colaboradores permitidos.
                      </p>
                    </div>

                    <p className="text-[11px] text-core-muted dark:text-slate-400">
                      Para modificar el plan contratado, vigencias o cuotas de esta organización,
                      inicia sesión con la cuenta <strong>CoreFlow Platform Admin</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:block h-6 w-px bg-core-border dark:bg-[#282C5A] mx-0.5" />

            {/* Botón Asistente IA */}
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="h-10 inline-flex items-center gap-1.5 rounded-xl border border-core-violet/30 bg-core-violet/8 dark:bg-core-violet/20 hover:bg-core-violet hover:text-white text-core-violet dark:text-indigo-300 px-2.5 sm:px-3 text-xs font-semibold transition-all"
              title="Abrir Asistente Operativo IA"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
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

            {/* Centro de Notificaciones */}
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
