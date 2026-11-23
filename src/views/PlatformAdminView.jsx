import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Building2,
  Layers,
  Users,
  FileText,
  Settings,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  LogOut,
  Database,
  Sun,
  Moon,
  Lock,
  Sparkles,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react'
import { CoreFlowLogo, CoreFlowIsotipo } from '../components/brand/CoreFlowLogo'
import { DesignSystemView } from './DesignSystemView'
import { LegalFooter } from '../components/privacy/LegalFooter'
import {
  Button,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  Tabs,
  ToastNotification,
  GeometricAccentBar,
} from '../components/ui/Primitives'
import { auditActionLabel, featureLabel, formatStorageMb, roleLabel } from '../components/ui/labels'

export function PlatformAdminView({
  user,
  supabaseStatus,
  isDemoData = false,
  plans = [],
  organizations = [],
  usersData,
  platformUsers: platformUsersProp,
  globalAuditLogs = [],
  darkMode = false,
  onToggleDarkMode,
  onUpsertPlan,
  onCreateOrganization,
  onUpdateSubscription,
  onUpdateEntitlement,
  onSignOut,
}) {
  const platformUsers = usersData ||
    platformUsersProp || { platformAdmins: [], userProfiles: [], memberships: [] }
  const [activeSection, setActiveSection] = useState('organizaciones')
  const [showInternalDesignSystem, setShowInternalDesignSystem] = useState(false)
  const [toast, setToast] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Escape cierra el menú lateral en móvil
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const blankPlan = () => ({
    planCode: '',
    displayName: '',
    description: '',
    priceMonthlyUsd: 0,
    collaboratorsRangeLabel: '',
    limits: { maxCollaborators: 1, maxBranches: 1, maxStorageMb: null },
    features: Object.fromEntries(Object.keys(plans[0]?.features || {}).map((key) => [key, false])),
  })

  // Formulario de creación o edición de un plan
  const [editingPlan, setEditingPlan] = useState(blankPlan)

  // Estado para formulario de nueva organización
  const [newOrgForm, setNewOrgForm] = useState({
    displayName: '',
    legalName: '',
    taxId: '',
    sector: 'Servicios Empresariales',
    planCode: 'starter',
    billingCycle: 'monthly',
    adminEmail: '',
    adminFullName: '',
  })

  // Estado para edición rápida de suscripción y cuota de una organización
  // El formulario parte siempre de la suscripción real de la organización elegida.
  const subscriptionFormFrom = (org) => {
    const contracted = org?.subscription?.planCode || org?.contractedPlanCode || 'starter'
    const planCode = contracted === 'start' ? 'starter' : contracted
    const override = org?.entitlements?.find(
      (e) => e.entitlementKey === 'max_collaborators'
    )?.valueJson
    return {
      planCode,
      status: org?.subscription?.status || org?.status || 'active',
      billingCycle: org?.subscription?.billingCycle || 'monthly',
      validUntil: (org?.subscription?.validUntil || '').slice(0, 10),
      maxCollab:
        typeof override === 'number'
          ? override
          : plans.find((p) => p.planCode === planCode)?.limits.maxCollaborators ?? 15,
    }
  }
  const initialSubscription = subscriptionFormFrom(organizations[0])

  const [selectedOrgForSub, setSelectedOrgForSub] = useState(organizations[0]?.id || '')
  const [subPlanCode, setSubPlanCode] = useState(initialSubscription.planCode)
  const [subStatus, setSubStatus] = useState(initialSubscription.status)
  const [subBillingCycle, setSubBillingCycle] = useState(initialSubscription.billingCycle)
  const [subValidUntil, setSubValidUntil] = useState(initialSubscription.validUntil)
  const [customMaxCollab, setCustomMaxCollab] = useState(initialSubscription.maxCollab)
  const [auditFilter, setAuditFilter] = useState('all')

  const selectedOrgName =
    organizations.find((o) => o.id === selectedOrgForSub)?.displayName || 'Sin selección'
  const orgNameOf = (id) => organizations.find((o) => o.id === id)?.displayName || 'Plataforma'
  const auditModules = [...new Set(globalAuditLogs.map((log) => log.module).filter(Boolean))]
  const visibleAuditLogs =
    auditFilter === 'all'
      ? globalAuditLogs
      : globalAuditLogs.filter((log) => log.module === auditFilter)

  const handleSelectOrgToManage = (org) => {
    const form = subscriptionFormFrom(org)
    setSelectedOrgForSub(org.id)
    setSubPlanCode(form.planCode)
    setSubStatus(form.status)
    setSubBillingCycle(form.billingCycle)
    setSubValidUntil(form.validUntil)
    setCustomMaxCollab(form.maxCollab)
  }

  const showFailure = (res) =>
    setToast({ title: 'No se pudo guardar', description: res?.error || 'Revisa los datos e inténtalo de nuevo.' })

  const handleSaveSubscription = async (e) => {
    e.preventDefault()
    const res = await onUpdateSubscription?.({
      organizationId: selectedOrgForSub,
      planCode: subPlanCode,
      status: subStatus,
      billingCycle: subBillingCycle,
      validUntil: subValidUntil ? `${subValidUntil}T00:00:00.000Z` : null,
      maxCollaboratorsOverride: Number(customMaxCollab),
      notes: `Actualizado desde CoreFlow Platform Admin por ${user?.email}`,
    })
    if (res?.ok === false) return showFailure(res)
    setToast({
      title: 'Suscripción actualizada',
      description: `${selectedOrgName} queda en el plan ${plans.find((p) => p.planCode === subPlanCode)?.displayName || subPlanCode}, con un límite de ${customMaxCollab} colaboradores.`,
    })
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    const res = await onUpsertPlan?.(editingPlan)
    if (res?.ok === false) return showFailure(res)
    setToast({
      title: `Plan "${editingPlan.displayName}" guardado`,
      description: 'Ya se puede asignar a cualquier organización.',
    })
  }

  const handleCreateOrgSubmit = async (e) => {
    e.preventDefault()
    if (!newOrgForm.displayName.trim()) return
    const slug = newOrgForm.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const res = await onCreateOrganization?.({
      ...newOrgForm,
      slug,
    })
    if (res?.ok === false) return showFailure(res)
    setNewOrgForm({
      displayName: '',
      legalName: '',
      taxId: '',
      sector: 'Servicios Empresariales',
      planCode: 'starter',
      billingCycle: 'monthly',
      adminEmail: '',
      adminFullName: '',
    })
    setToast({
      title: 'Organización creada',
      description: `${newOrgForm.displayName} ya tiene su suscripción inicial.`,
    })
  }

  const navItems = [
    { id: 'organizaciones', label: 'Organizaciones y Suscripciones', icon: Building2 },
    { id: 'planes', label: 'Catálogo de Planes y Capacidades', icon: Layers },
    { id: 'usuarios', label: 'Usuarios y Administradores', icon: Users },
    { id: 'auditoria', label: 'Auditoría Global', icon: FileText },
    { id: 'configuracion', label: 'Configuración de Plataforma', icon: Settings },
  ]

  return (
    <div className="h-screen h-dvh w-full overflow-hidden flex flex-col lg:flex-row bg-core-cloud dark:bg-[#0F1126] text-core-navy dark:text-slate-100">
      {toast && (
        <ToastNotification
          title={toast.title}
          description={toast.description}
          onClose={() => setToast(null)}
        />
      )}

      {/* SIDEBAR EXCLUSIVO DE COREFLOW PLATFORM ADMIN (100% Viewport Height, Perfil Anclado al Pie) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-core-navy/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,86vw)] h-dvh lg:static lg:w-72 lg:h-screen bg-core-navy text-white flex flex-col border-r border-white/10 shrink-0 transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 lg:px-5 flex items-center justify-between gap-2 border-b border-white/10 shrink-0">
          <CoreFlowLogo variant="horizontal" theme="dark" size="sm" />
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-core-lime text-core-navy">
            Platform Admin
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden h-11 w-11 -mr-2 inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 shrink-0">
          <div className="rounded-xl bg-[#1E2146] border border-core-violet/40 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-core-cyan">
              <ShieldCheck className="w-4 h-4 text-core-lime shrink-0" />
              <span>Administración de la plataforma</span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
              Organizaciones, planes, suscripciones, capacidades y auditoría.
            </p>
          </div>
        </div>

        <nav
          className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 space-y-1"
          aria-label="Navegación Platform Admin"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id && !showInternalDesignSystem
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setShowInternalDesignSystem(false)
                  setActiveSection(item.id)
                  setMobileMenuOpen(false)
                }}
                className={`w-full min-h-11 lg:min-h-0 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-core-violet text-white font-semibold shadow-md shadow-core-violet/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/6'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Pie del Sidebar Anclado Siempre Visible: Sesión Real de Administrador de Plataforma */}
        <div className="shrink-0 mt-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#12142B] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-core-violet to-core-lime flex items-center justify-center text-xs font-extrabold text-core-navy shrink-0">
              PA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {user?.fullName || 'Administrador de Plataforma'}
              </p>
              <p className="text-[11px] text-core-cyan truncate">{user?.email}</p>
              <p className="text-[10px] text-core-lime font-semibold truncate mt-0.5">
                Rol: Superadmin Global · CoreFlow SaaS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full h-11 lg:h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm lg:text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-core-lime" />
            <span>Cerrar sesión de Plataforma</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE COREFLOW PLATFORM ADMIN CON SCROLL INDEPENDIENTE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <header className="h-16 shrink-0 bg-white/95 dark:bg-[#171936]/95 border-b border-core-border dark:border-[#282C5A] px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-11 w-11 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-navy dark:text-white shrink-0"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
            <GeometricAccentBar size="sm" />
            <span className="text-sm font-extrabold text-core-navy dark:text-white truncate">
              <span className="sm:hidden">
                {navItems.find((item) => item.id === activeSection)?.label || 'Consola de plataforma'}
              </span>
              <span className="hidden sm:inline">Consola de suscripciones y planes</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-core-violet/10 text-core-violet dark:text-indigo-300 border border-core-violet/25">
              <Database className="w-3.5 h-3.5" />
              {isDemoData ? 'Datos de demostración' : 'Datos en vivo'}
            </span>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="h-11 w-11 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-muted hover:text-core-navy dark:hover:text-white shrink-0"
              title="Alternar tema visual"
              aria-label="Alternar tema visual"
            >
              {darkMode ? <Sun className="w-4 h-4 text-core-lime" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto cf-scroll-contain p-4 sm:p-6 lg:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="max-w-[1560px] w-full mx-auto space-y-6">
          {/* KPIs GLOBALES DE PLATAFORMA */}
          {activeSection === 'organizaciones' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Organizaciones en Plataforma"
              scopeBadge="Clientes de CoreFlow"
              subtitle="Registradas"
              value={String(organizations.length)}
              deltaDirection="up"
              accentColor="violet"
              icon={Building2}
              breakdown="Identificadores, suscripciones y datos independientes"
            />
            <KpiCard
              title="Planes en catálogo"
              scopeBadge="Catálogo"
              subtitle="Disponibles"
              value={String(plans.length)}
              deltaDirection="up"
              accentColor="cyan"
              icon={Layers}
              breakdown={plans.map((p) => p.displayName).join(' · ')}
            />
            <KpiCard
              title="Usuarios y Membresías"
              scopeBadge="Cuentas"
              subtitle="Cuentas registradas"
              value={String(platformUsers.userProfiles?.length || 0)}
              delta={`${platformUsers.memberships?.length || 0} vínculos`}
              deltaDirection="up"
              accentColor="lime"
              icon={Users}
              breakdown="Perfiles separados de membresías y roles"
            />
            <KpiCard
              title="Eventos de Auditoría Global"
              scopeBadge="Trazabilidad"
              subtitle="Registrados"
              value={String(globalAuditLogs.length)}
              deltaDirection="up"
              accentColor="blue"
              icon={ShieldCheck}
              breakdown="Los registros no se pueden modificar"
            />
          </div>
          )}

          {/* SECCIÓN 1: ORGANIZACIONES Y SUSCRIPCIONES */}
          {activeSection === 'organizaciones' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 space-y-6">
                <SurfaceCard
                  title="Organizaciones Registradas y Estado de Suscripción"
                  subtitle="Selecciona cualquier organización para modificar su plan contratado, capacidades, vigencia o cuotas"
                >
                  <div className="space-y-3 mt-2">
                    {organizations.map((org) => {
                      const planCode =
                        org.subscription?.planCode || org.contractedPlanCode || 'starter'
                      const isSelected = selectedOrgForSub === org.id
                      const maxCollab =
                        org.entitlements?.find((e) => e.entitlementKey === 'max_collaborators')
                          ?.valueJson || (planCode === 'business' ? 30 : 15)
                      const collabPercent = Math.min(
                        100,
                        Math.round(((org.activeCollaboratorsCount || 1) / maxCollab) * 100)
                      )

                      return (
                        <div
                          key={org.id}
                          onClick={() => handleSelectOrgToManage(org)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-core-violet bg-core-violet/5 dark:bg-core-violet/15'
                              : 'border-core-border dark:border-[#282C5A] hover:border-core-violet/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-core-navy dark:text-white">
                                  {org.displayName}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-core-violet/15 text-core-violet dark:text-indigo-300">
                                  Plan: {String(planCode).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
                                NIT: {org.taxId} · Sector: {org.sector}
                              </p>
                            </div>
                            <StatusBadge status={org.subscription?.status || org.status} />
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-core-border/70 dark:border-[#282C5A] space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-core-muted dark:text-slate-300">
                              <span>
                                Cuota colaboradores:{' '}
                                <strong className="text-core-navy dark:text-white tabular-nums">
                                  {org.activeCollaboratorsCount} / {maxCollab} ({collabPercent}%)
                                </strong>
                              </span>
                              <span>
                                Estructura: <strong>{org.branchesCount || 1} sede(s)</strong> ·{' '}
                                <strong>{org.departmentsCount || 1} área(s)</strong>
                              </span>
                              <span>
                                Vigencia:{' '}
                                <strong>
                                  {org.subscription?.validUntil?.slice(0, 10) || 'Sin fecha'}
                                </strong>
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  planCode === 'business'
                                    ? 'bg-gradient-to-r from-core-violet to-core-cyan'
                                    : 'bg-gradient-to-r from-core-cyan to-core-lime'
                                }`}
                                style={{ width: `${collabPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </SurfaceCard>

                {/* Formulario para aprovisionar una nueva organización */}
                <SurfaceCard
                  title="Registrar nueva organización"
                  subtitle="Crea una organización con su suscripción inicial, sede principal y administrador organizacional"
                >
                  <form onSubmit={handleCreateOrgSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Nombre comercial</label>
                      <input
                        type="text"
                        required
                        value={newOrgForm.displayName}
                        onChange={(e) =>
                          setNewOrgForm({ ...newOrgForm, displayName: e.target.value })
                        }
                        placeholder="Ej. Ingeniería del Pacífico S.A.S."
                        className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">NIT / Identificación Tributaria</label>
                      <input
                        type="text"
                        required
                        value={newOrgForm.taxId}
                        onChange={(e) => setNewOrgForm({ ...newOrgForm, taxId: e.target.value })}
                        placeholder="Ej. 901.550.320-1"
                        className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Plan suscrito inicial</label>
                      <select
                        value={newOrgForm.planCode}
                        onChange={(e) =>
                          setNewOrgForm({ ...newOrgForm, planCode: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs font-semibold"
                      >
                        {plans.map((p) => (
                          <option key={p.planCode} value={p.planCode}>
                            {p.displayName} (${p.priceMonthlyUsd}/mes)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Correo del Administrador Organizacional</label>
                      <input
                        type="email"
                        required
                        value={newOrgForm.adminEmail}
                        onChange={(e) =>
                          setNewOrgForm({ ...newOrgForm, adminEmail: e.target.value })
                        }
                        placeholder="admin@nuevaorganizacion.co"
                        className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <Button type="submit" variant="primary" size="md" icon={Plus} iconPosition="left">
                        Crear Organización y Asignar Suscripción
                      </Button>
                    </div>
                  </form>
                </SurfaceCard>
              </div>

              {/* Panel Derecho: Administración de Suscripción, Vigencia y Cuotas del Tenant Seleccionado */}
              <div className="xl:col-span-5 space-y-6">
                <SurfaceCard
                  title={`Administrar suscripción: ${selectedOrgName}`}
                  subtitle="Revisa el plan antes de guardar: el cambio se aplica de inmediato"
                >
                  <form onSubmit={handleSaveSubscription} className="space-y-4 mt-2">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Organización objetivo
                      </label>
                      <select
                        value={selectedOrgForSub}
                        onChange={(e) => {
                          const found = organizations.find((o) => o.id === e.target.value)
                          if (found) handleSelectOrgToManage(found)
                        }}
                        className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 text-xs font-bold"
                      >
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Plan Asignado</label>
                        <select
                          value={subPlanCode}
                          onChange={(e) => {
                            const nextPlan = e.target.value
                            setSubPlanCode(nextPlan)
                            const matched = plans.find((p) => p.planCode === nextPlan)
                            if (matched) {
                              setCustomMaxCollab(matched.limits.maxCollaborators)
                            }
                          }}
                          className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 text-xs font-semibold"
                        >
                          {plans.map((p) => (
                            <option key={p.planCode} value={p.planCode}>
                              {p.displayName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Estado de Suscripción
                        </label>
                        <select
                          value={subStatus}
                          onChange={(e) => setSubStatus(e.target.value)}
                          className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 text-xs font-semibold"
                        >
                          <option value="active">Activa</option>
                          <option value="trialing">Periodo de prueba</option>
                          <option value="past_due">Pago pendiente</option>
                          <option value="suspended">Suspendida</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Cuota Máx. Colaboradores
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={customMaxCollab}
                          onChange={(e) => setCustomMaxCollab(e.target.value)}
                          className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Vigencia Hasta
                        </label>
                        <input
                          type="date"
                          value={subValidUntil}
                          onChange={(e) => setSubValidUntil(e.target.value)}
                          className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 text-xs"
                        />
                      </div>
                    </div>

                    <Button type="submit" variant="primary" size="md" className="w-full">
                      Guardar suscripción
                    </Button>
                  </form>
                </SurfaceCard>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: CATÁLOGO DE PLANES Y CAPACIDADES EN POSTGRESQL */}
          {activeSection === 'planes' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 space-y-4">
                <SurfaceCard
                  title="Catálogo de planes"
                  subtitle="Límites y capacidades de cada plan"
                >
                  <div className="space-y-4 mt-2">
                    {plans.map((plan) => (
                      <div
                        key={plan.planCode}
                        className="rounded-xl border border-core-border dark:border-[#282C5A] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base font-extrabold text-core-navy dark:text-white">
                              {plan.displayName}
                            </span>
                            <span className="ml-2 px-2 py-0.5 rounded bg-core-violet/10 text-core-violet text-xs font-bold">
                              Código: {plan.planCode}
                            </span>
                          </div>
                          <span className="text-sm font-extrabold text-core-violet dark:text-core-cyan">
                            ${plan.priceMonthlyUsd} USD / mes
                          </span>
                        </div>

                        <p className="text-xs text-core-muted dark:text-slate-300">
                          {plan.description}
                        </p>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-core-border/60 dark:border-[#282C5A] text-xs">
                          <div>
                            <span className="text-core-muted block">Máx. Colaboradores</span>
                            <strong>{plan.limits.maxCollaborators}</strong>
                          </div>
                          <div>
                            <span className="text-core-muted block">Máx. Sedes</span>
                            <strong>{plan.limits.maxBranches}</strong>
                          </div>
                          <div>
                            <span className="text-core-muted block">Almacenamiento</span>
                            <strong>{formatStorageMb(plan.limits.maxStorageMb)}</strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {Object.entries(plan.features).map(([featKey, enabled]) => (
                            <span
                              key={featKey}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                enabled
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-core-lime'
                                  : 'bg-slate-200/70 dark:bg-white/5 text-slate-400 line-through'
                              }`}
                            >
                              {featureLabel(featKey)}
                            </span>
                          ))}
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingPlan(plan)}
                          >
                            Cargar en editor de planes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              </div>

              <div className="xl:col-span-5">
                <SurfaceCard
                  title={editingPlan.planCode ? `Editar plan: ${editingPlan.displayName || editingPlan.planCode}` : 'Crear plan'}
                  subtitle="Registra un nuevo plan o modifica las capacidades y límites de un plan existente"
                >
                  <form onSubmit={handleSavePlan} className="space-y-3.5 mt-2 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Código del plan</label>
                        <input
                          type="text"
                          required
                          value={editingPlan.planCode}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, planCode: e.target.value })
                          }
                          className="h-9 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Precio Mensual (USD)</label>
                        <input
                          type="number"
                          required
                          value={editingPlan.priceMonthlyUsd}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              priceMonthlyUsd: Number(e.target.value),
                            })
                          }
                          className="h-9 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Nombre comercial del plan</label>
                      <input
                        type="text"
                        required
                        value={editingPlan.displayName}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, displayName: e.target.value })
                        }
                        className="h-9 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-semibold mb-1">Máx. Colab.</label>
                        <input
                          type="number"
                          value={editingPlan.limits.maxCollaborators}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              limits: {
                                ...editingPlan.limits,
                                maxCollaborators: Number(e.target.value),
                              },
                            })
                          }
                          className="h-9 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-2.5"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Máx. Sedes</label>
                        <input
                          type="number"
                          value={editingPlan.limits.maxBranches}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              limits: {
                                ...editingPlan.limits,
                                maxBranches: Number(e.target.value),
                              },
                            })
                          }
                          className="h-9 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-2.5"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Almacenamiento (MB)</label>
                        <input
                          type="number"
                          placeholder="Sin definir"
                          value={editingPlan.limits.maxStorageMb ?? ''}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              limits: {
                                ...editingPlan.limits,
                                maxStorageMb: e.target.value === '' ? null : Number(e.target.value),
                              },
                            })
                          }
                          className="h-9 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-2.5"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-core-border dark:border-[#282C5A]">
                      <p className="font-bold text-core-navy dark:text-white">
                        Capacidades habilitadas en el plan:
                      </p>
                      {Object.keys(editingPlan.features).map((featureKey) => (
                        <label
                          key={featureKey}
                          className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-core-cloud/60 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <span>{featureLabel(featureKey)}</span>
                          <input
                            type="checkbox"
                            checked={Boolean(editingPlan.features[featureKey])}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                features: {
                                  ...editingPlan.features,
                                  [featureKey]: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-core-violet"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="submit" variant="primary" size="md" className="flex-1">
                        Guardar plan
                      </Button>
                      <Button type="button" variant="outline" size="md" onClick={() => setEditingPlan(blankPlan())}>
                        Limpiar
                      </Button>
                    </div>
                  </form>
                </SurfaceCard>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: USUARIOS Y ADMINISTRADORES */}
          {activeSection === 'usuarios' && (
            <SurfaceCard
              title="Usuarios y administradores"
              subtitle="Equipo de la plataforma y personas de cada organización"
            >
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-core-border dark:border-[#282C5A] text-[11px] font-bold uppercase text-core-muted">
                      <th className="py-3 px-3">Usuario / Nombre</th>
                      <th className="py-3 px-3">Correo</th>
                      <th className="py-3 px-3">Organización</th>
                      <th className="py-3 px-3">Rol Asignado</th>
                      <th className="py-3 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A]">
                    {(platformUsers.platformAdmins || []).map((pa) => (
                      <tr key={pa.id} className="bg-core-violet/5 dark:bg-core-violet/10">
                        <td className="py-3 px-3 font-bold text-core-navy dark:text-white">
                          {pa.fullName}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs">{pa.email}</td>
                        <td className="py-3 px-3 font-bold text-core-violet dark:text-core-cyan">
                          Equipo de plataforma
                        </td>
                        <td className="py-3 px-3">{roleLabel(pa.roleLevel)}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={pa.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                    {(platformUsers.memberships || []).map((mem) => (
                      <tr key={mem.id}>
                        <td className="py-3 px-3 font-semibold text-core-navy dark:text-white">
                          {mem.userFullName || mem.displayName}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs">{mem.userEmail || mem.email}</td>
                        <td className="py-3 px-3">{mem.organizationName}</td>
                        <td className="py-3 px-3 font-semibold text-core-violet dark:text-indigo-300">
                          {roleLabel(mem.roleCode)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={mem.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          )}

          {/* SECCIÓN 4: AUDITORÍA GLOBAL */}
          {activeSection === 'auditoria' && (
            <SurfaceCard
              title="Auditoría"
              subtitle={`${visibleAuditLogs.length} de ${globalAuditLogs.length} eventos. Los registros no se pueden modificar.`}
              action={
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  aria-label="Filtrar eventos por módulo"
                  className="h-9 rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/60 dark:bg-[#101228] px-3 text-xs font-semibold"
                >
                  <option value="all">Todos los módulos</option>
                  {auditModules.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>
              }
            >
              <div className="space-y-2.5 mt-3">
                {visibleAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-core-border dark:border-[#282C5A] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-core-violet dark:text-indigo-300">
                          {auditActionLabel(log.action)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-core-cloud dark:bg-[#101228] text-[10px] font-semibold">
                          {orgNameOf(log.organizationId)} · {log.module}
                          {log.actorRoleCode ? ` · ${roleLabel(log.actorRoleCode)}` : ''}
                        </span>
                      </div>
                      <p className="text-core-navy dark:text-slate-100 font-medium">
                        {log.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* SECCIÓN 5: CONFIGURACIÓN DE PLATAFORMA Y CONSULTA INTERNA DEL SISTEMA DE DISEÑO */}
          {activeSection === 'configuracion' && (
            <div className="space-y-6">
              <SurfaceCard
                title="Estado de la plataforma"
                subtitle="Cómo está funcionando este entorno"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
                  <div className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] space-y-2">
                    <p className="font-bold text-sm text-core-navy dark:text-white">
                      Origen de los datos
                    </p>
                    <p className="text-core-muted dark:text-slate-300">
                      {isDemoData
                        ? 'Este entorno usa datos de demostración guardados en el navegador. Ningún cambio llega a una base de datos.'
                        : 'Este entorno está conectado a la base de datos de CoreFlow.'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] space-y-2">
                    <p className="font-bold text-sm text-core-navy dark:text-white">
                      Separación entre organizaciones
                    </p>
                    <p className="text-core-muted dark:text-slate-300">
                      Cada organización ve solo sus propios registros y documentos.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] space-y-2 flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-sm text-core-navy dark:text-white">
                        Sistema de Diseño Institucional (Consulta Interna)
                      </p>
                      <p className="text-core-muted dark:text-slate-300 mt-1">
                        Documentación técnica interna de tokens cromáticos, tipografía, isotipo
                        vectorial y componentes UI de CoreFlow (excluida de la navegación operativa
                        de clientes).
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowInternalDesignSystem((v) => !v)}
                    >
                      {showInternalDesignSystem
                        ? 'Ocultar documentación visual'
                        : 'Abrir Sistema de Diseño Interno'}
                    </Button>
                  </div>
                </div>
              </SurfaceCard>

              {showInternalDesignSystem && (
                <div className="pt-2 border-t border-core-border dark:border-[#282C5A]">
                  <DesignSystemView />
                </div>
              )}
            </div>
          )}
          <LegalFooter className="pt-5 border-t border-core-border dark:border-[#282C5A]" />
          </div>
        </main>
      </div>
    </div>
  )
}
