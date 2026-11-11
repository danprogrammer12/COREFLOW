import React, { useEffect, useState } from 'react'
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
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Building2,
  Check,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react'
import { CoreFlowLogo, CoreFlowIsotipo } from '../brand/CoreFlowLogo'
import { EDITION_RULES } from '../../data/demoStore'
import { LegalFooter } from '../privacy/LegalFooter'

export function AppShell({
  activeView,
  onNavigate,
  edition,
  entitlementsResolved = null,
  activeOrganization = null,
  accessibleOrganizations = [],
  onSwitchOrganization,
  user = null,
  isDemoData = false,
  activeRole,
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onSignOut,
  counts = { clientes: 0, comercial: 0, solicitudes: 0, tareas: 0 },
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [orgSelectorOpen, setOrgSelectorOpen] = useState(false)
  const [editionInfoOpen, setEditionInfoOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Los paneles flotantes no sobreviven a un cambio de módulo.
  useEffect(() => {
    setNotificationsOpen(false)
    setOrgSelectorOpen(false)
    setEditionInfoOpen(false)
    setUserMenuOpen(false)
  }, [activeView])

  const isBusiness = edition === 'business'
  const planConfig = EDITION_RULES[edition] || EDITION_RULES.start
  const collabStatus = entitlementsResolved?.collaboratorsStatus || {
    current: planConfig.activeCollaborators,
    max: planConfig.maxCollaborators,
  }

  const [notifications, setNotifications] = useState(() =>
    !isDemoData
      ? []
      : isBusiness
      ? [
          {
            id: 1,
            title: 'Solicitud #SOL-458 asignada al área de Operaciones',
            time: 'Ejemplo',
            unread: true,
            targetView: 'dashboard',
          },
          {
            id: 2,
            title: 'Aprobación multinivel pendiente en flujo #APR-102',
            time: 'Ejemplo',
            unread: true,
            targetView: 'solicitudes',
          },
          {
            id: 3,
            title: 'Procedimiento estandarizado validado en Documentos',
            time: 'Ejemplo',
            unread: false,
            targetView: 'documentos',
          },
        ]
      : [
          {
            id: 101,
            title: 'Solicitud #SOL-101 registrada en flujo directo Starter',
            time: 'Ejemplo',
            unread: true,
            targetView: 'solicitudes',
          },
          {
            id: 102,
            title: 'Tarea de entrega programada para hoy a las 17:00',
            time: 'Ejemplo',
            unread: true,
            targetView: 'tareas',
          },
        ]
  )

  // Navegación diferenciada según la suscripción activa (StarterLayout vs BusinessLayout)
  const navItems = isBusiness
    ? [
        { id: 'dashboard', label: 'Inicio', icon: Home, badge: null },
        { id: 'clientes', label: 'Cuentas y Clientes', icon: Users, badge: String(counts.clientes) },
        { id: 'comercial', label: 'Pipeline Comercial', icon: Briefcase, badge: String(counts.comercial) },
        { id: 'solicitudes', label: 'Solicitudes', icon: Inbox, badge: String(counts.solicitudes) },
        { id: 'procesos', label: 'Automatizaciones', icon: GitBranch, badge: null },
        { id: 'tareas', label: 'Tareas', icon: CheckSquare, badge: String(counts.tareas) },
        { id: 'documentos', label: 'Control Documental', icon: FileText, badge: null },
        { id: 'reportes', label: 'Reportes Comparativos', icon: BarChart3, badge: null },
        { id: 'configuracion', label: 'Departamentos y Roles', icon: Settings, badge: null },
      ]
    : [
        { id: 'dashboard', label: 'Inicio', icon: Home, badge: null },
        { id: 'clientes', label: 'Clientes', icon: Users, badge: String(counts.clientes) },
        { id: 'solicitudes', label: 'Solicitudes Directas', icon: Inbox, badge: String(counts.solicitudes) },
        { id: 'tareas', label: 'Tareas del Equipo', icon: CheckSquare, badge: String(counts.tareas) },
        { id: 'documentos', label: 'Documentos', icon: FileText, badge: null },
        { id: 'comercial', label: 'Oportunidades', icon: Briefcase, badge: String(counts.comercial) },
        { id: 'procesos', label: 'Procesos Básicos', icon: GitBranch, badge: null },
        { id: 'configuracion', label: 'Equipo y Suscripción', icon: Settings, badge: null },
      ]

  // La barra superior repite el nombre del menú para que la ubicación sea inequívoca.
  const viewLabels = {
    ...Object.fromEntries(navItems.map((item) => [item.id, item.label])),
    'design-system': 'Sistema de diseño',
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleNavClick = (id) => {
    onNavigate(id)
    setMobileMenuOpen(false)
  }

  const userDisplayName = user?.fullName || 'Dirección Organizacional'
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CF'

  const orgDisplayName =
    activeOrganization?.displayName ||
    (isBusiness ? 'Grupo Corporativo Andino' : 'Soluciones Ágiles del Caribe')

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col lg:flex-row bg-core-cloud dark:bg-[#0F1126] text-core-navy dark:text-slate-100 transition-colors duration-200">
      {/* Overlay móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-core-navy/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* A. SIDEBAR LATERAL OSCURO (#171936 Midnight Navy) — 100% ALTURA DEL VIEWPORT */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-screen bg-core-navy text-white flex flex-col border-r border-white/10 transition-transform duration-200 ease-out lg:static lg:translate-x-0 shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 1. CABECERA FIJA DEL SIDEBAR CON LOGOTIPO OFICIAL */}
        <div className="relative h-16 px-5 flex items-center justify-between border-b border-white/10 overflow-hidden shrink-0">
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

        {/* 2. RESUMEN COMPACTO DEL CONTEXTO Y SUSCRIPCIÓN (FIJO ARRIBA DE LA LISTA) */}
        <div className="px-3.5 pt-3 pb-2 shrink-0">
          <div className="rounded-xl bg-[#1E2146] border border-white/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isBusiness ? 'bg-core-lime' : 'bg-core-cyan'
                  }`}
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white truncate">
                  {entitlementsResolved?.contractedPlanName || planConfig.name}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-200 tabular-nums shrink-0">
                {collabStatus.current}/{collabStatus.max} colab.
              </span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-core-cyan leading-snug line-clamp-2" title={orgDisplayName}>
              {orgDisplayName}
            </p>
          </div>
        </div>

        {/* 3. ÁREA DE NAVEGACIÓN CENTRAL CON SCROLL INTERNO INDEPENDIENTE */}
        <nav
          className="flex-1 min-h-0 overflow-y-auto px-3 py-1.5 space-y-0.5"
          aria-label="Navegación principal"
        >
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {isBusiness ? 'Operación Corporativa' : 'Operación Directa PYME'}
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
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                    strokeWidth={1.85}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums shrink-0 ${
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
        </nav>

        {/* 4. PIE DEL SIDEBAR ANCLADO AL FONDO: PERFIL DEL USUARIO SIEMPRE VISIBLE */}
        <div className="relative p-3 border-t border-white/10 bg-[#12142B] shrink-0 mt-auto">
          {userMenuOpen && (
            <div className="absolute bottom-full mb-2 left-3 right-3 rounded-xl bg-[#1C2042] border border-white/15 shadow-float p-3 z-50 space-y-2.5">
              <div className="pb-2 border-b border-white/10 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-core-cyan">
                  Perfil y Membresía Activa
                </p>
                <p className="text-xs font-bold text-white truncate">
                  {userDisplayName}
                </p>
                <p className="text-[11px] font-mono text-slate-300 truncate">
                  {user?.email || 'sesion@coreflow.app'}
                </p>
                <p className="text-[10px] text-core-lime truncate pt-0.5">
                  {activeRole} · {orgDisplayName}
                </p>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    handleNavClick('configuracion')
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-core-cyan" />
                  <span>Configuración de organización</span>
                </button>
                <a
                  href="#/legal/privacidad"
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-core-cyan" />
                  <span>Privacidad y cookies</span>
                </a>
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
                  <span>Cambiar cuenta / Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-white/6 transition-colors text-left"
            aria-expanded={userMenuOpen}
            aria-label="Menú de perfil del usuario"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-core-violet to-core-blue flex items-center justify-center text-xs font-extrabold text-white shrink-0 border border-white/15">
                {userInitials}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-core-lime ring-2 ring-[#12142B]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-snug line-clamp-2" title={userDisplayName}>
                  {userDisplayName}
                </p>
                <p className="text-[11px] text-core-cyan leading-snug line-clamp-2" title={activeRole}>
                  {activeRole}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                userMenuOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL CON SCROLL PROPIO INDEPENDIENTE DEL SIDEBAR */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* B. TOPBAR EMPRESARIAL (Sin elementos de demostración ni redirección errónea al Sistema de Diseño) */}
        <header className="shrink-0 z-30 h-16 bg-white/95 dark:bg-[#171936]/95 backdrop-blur-md border-b border-core-border dark:border-[#282C5A] px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* ZONA 1 (Izquierda): Menú Móvil + Indicador de Módulo + Búsqueda Global */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-navy dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden xl:flex items-center gap-2 pr-3 border-r border-core-border dark:border-[#282C5A] shrink-0">
              <CoreFlowIsotipo className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold text-core-navy dark:text-white whitespace-nowrap">
                {viewLabels[activeView] || 'Inicio'}
              </span>
            </div>

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

          {/* ZONA 2 (Derecha): Organización + Suscripción Activa + Utilidades Operativas */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {isDemoData && (
              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-[#B45309] dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                Datos de demostración
              </span>
            )}
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
                title="Organización activa bajo aislamiento Multi-Tenant"
              >
                <Building2 className="w-3.5 h-3.5 text-core-violet shrink-0" strokeWidth={1.9} />
                <span className="max-w-[260px] truncate" title={orgDisplayName}>{orgDisplayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-core-muted shrink-0" />
              </button>

              {orgSelectorOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-card bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-float p-2.5 z-50">
                  <div className="px-2.5 py-1.5 border-b border-core-border dark:border-[#282C5A] mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-core-muted">
                      Organizaciones autorizadas para esta cuenta
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
                              Plan: {String(org.contractedPlanCode).toUpperCase()} ·{' '}
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

            {/* Indicador de Suscripción Contratada */}
            <div className="relative flex items-center">
              <div
                className="h-10 inline-flex items-center rounded-xl bg-core-cloud dark:bg-[#101228] px-2.5 border border-core-border dark:border-[#282C5A] gap-2"
                role="status"
                aria-label="Suscripción activa de la organización"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBusiness ? 'bg-core-lime' : 'bg-core-cyan'
                  }`}
                />
                <span className="text-xs font-extrabold text-core-navy dark:text-white">
                  {entitlementsResolved?.contractedPlanName ||
                    (isBusiness ? 'CoreFlow Business' : 'CoreFlow Starter')}
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
                  title="Consultar capacidades y límites de la suscripción"
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
                        Alcance de Suscripción Activa
                      </p>
                      <p className="text-[11px] text-core-muted dark:text-slate-400">
                        {orgDisplayName}
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
                        Utilización de colaboradores: <strong>{collabStatus.current}</strong> de{' '}
                        <strong>{collabStatus.max}</strong> cupos habilitados.
                      </p>
                    </div>

                    <p className="text-[11px] text-core-muted dark:text-slate-400">
                      Los límites de colaboradores, almacenamiento, sedes y módulos se administran
                      centralmente desde <strong>CoreFlow Platform Admin</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:block h-6 w-px bg-core-border dark:bg-[#282C5A] mx-0.5" />

            {/* Toggle Vista Clara / Vista Oscura */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-muted dark:text-slate-300 hover:text-core-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title={darkMode ? 'Cambiar a Interfaz Clara' : 'Cambiar a Vista Oscura'}
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
                      Avisos operativos ({unreadCount} sin leer)
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
          </div>
        </header>

        {/* C. ÁREA DE CONTENIDO PRINCIPAL CON SCROLL INDEPENDIENTE */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10">
          <div className="max-w-[1600px] w-full mx-auto">
            {children}
            <LegalFooter className="mt-10 pt-5 border-t border-core-border dark:border-[#282C5A]" />
          </div>
        </main>

        {/* BARRA DE NAVEGACIÓN COMPACTA MÓVIL (Sin enlace a Sistema UI) */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-core-navy text-white border-t border-white/10 px-2 py-1.5 flex items-center justify-around"
          aria-label="Navegación rápida móvil"
        >
          {[
            { id: 'dashboard', label: 'Inicio', icon: Home },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'solicitudes', label: 'Solicitudes', icon: Inbox },
            { id: 'tareas', label: 'Tareas', icon: CheckSquare },
            { id: 'documentos', label: 'Documentos', icon: FileText },
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
