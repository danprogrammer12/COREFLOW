import React, { useState } from 'react'
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
} from 'lucide-react'
import { CoreFlowLogo } from '../components/brand/CoreFlowLogo'
import {
  Button,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  Tabs,
  ToastNotification,
  GeometricAccentBar,
} from '../components/ui/Primitives'

export function PlatformAdminView({
  user,
  supabaseStatus,
  plans = [],
  organizations = [],
  platformUsers = { platformAdmins: [], userProfiles: [], memberships: [] },
  globalAuditLogs = [],
  darkMode = false,
  onToggleDarkMode,
  onUpsertPlan,
  onCreateOrganization,
  onUpdateSubscription,
  onUpdateEntitlement,
  onSignOut,
}) {
  const [activeSection, setActiveSection] = useState('organizaciones')
  const [toast, setToast] = useState(null)

  // Estado para formulario de creación/edición de Plan en PostgreSQL
  const [editingPlan, setEditingPlan] = useState({
    planCode: 'enterprise',
    displayName: 'CoreFlow Enterprise',
    description: 'Plan corporativo multi-sede con capacidades extendidas y almacenamiento ampliado.',
    priceMonthlyUsd: 249,
    collaboratorsRangeLabel: '31 a 100 colaboradores',
    limits: {
      maxCollaborators: 100,
      maxBranches: 25,
      maxStorageMb: 102400,
    },
    features: {
      multiBranch: true,
      departmentsAndTeams: true,
      granularPermissions: true,
      multilevelApprovals: true,
      crossAreaAutomations: true,
      responsibleIndicators: true,
      basicAutomations: true,
      aiAssistant: true,
    },
  })

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
  const [selectedOrgForSub, setSelectedOrgForSub] = useState(organizations[0]?.id || 'org-pyme')
  const [subPlanCode, setSubPlanCode] = useState('starter')
  const [subStatus, setSubStatus] = useState('active')
  const [subBillingCycle, setSubBillingCycle] = useState('monthly')
  const [subValidUntil, setSubValidUntil] = useState('2027-12-31')
  const [customMaxCollab, setCustomMaxCollab] = useState(15)

  const handleSelectOrgToManage = (org) => {
    setSelectedOrgForSub(org.id)
    const currentPlan = org.subscription?.planCode || org.contractedPlanCode || 'starter'
    setSubPlanCode(currentPlan === 'start' ? 'starter' : currentPlan)
    setSubStatus(org.subscription?.status || org.status || 'active')
    setSubBillingCycle(org.subscription?.billingCycle || 'monthly')
    const maxCollabOverride = org.entitlements?.find(
      (e) => e.entitlementKey === 'max_collaborators'
    )?.valueJson
    setCustomMaxCollab(typeof maxCollabOverride === 'number' ? maxCollabOverride : 15)
  }

  const handleSaveSubscription = (e) => {
    e.preventDefault()
    const res = onUpdateSubscription?.({
      organizationId: selectedOrgForSub,
      planCode: subPlanCode,
      status: subStatus,
      billingCycle: subBillingCycle,
      validUntil: `${subValidUntil}T00:00:00.000Z`,
      maxCollaboratorsOverride: Number(customMaxCollab),
      notes: `Actualizado desde CoreFlow Platform Admin por ${user?.email}`,
    })
    if (res?.ok !== false) {
      setToast({
        title: 'Suscripción y cuotas actualizadas en base de datos',
        description: `La organización "${selectedOrgForSub}" ahora opera bajo el plan "${subPlanCode.toUpperCase()}" (${subStatus}) con límite de ${customMaxCollab} colaboradores.`,
      })
    }
  }

  const handleSavePlan = (e) => {
    e.preventDefault()
    const res = onUpsertPlan?.(editingPlan)
    if (res?.ok !== false) {
      setToast({
        title: `Plan "${editingPlan.displayName}" guardado en plan_catalog`,
        description: `El plan (${editingPlan.planCode}) está disponible en PostgreSQL para asignarse a cualquier organización.`,
      })
    }
  }

  const handleCreateOrgSubmit = (e) => {
    e.preventDefault()
    if (!newOrgForm.displayName.trim()) return
    const slug = newOrgForm.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const res = onCreateOrganization?.({
      ...newOrgForm,
      slug,
    })
    if (res?.ok !== false) {
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
        title: 'Organización aprovisionada exitosamente',
        description: `Se creó el tenant aislado con suscripción ${newOrgForm.planCode.toUpperCase()} y registro en auditoría.`,
      })
    }
  }

  const navItems = [
    { id: 'organizaciones', label: 'Organizaciones y Suscripciones', icon: Building2 },
    { id: 'planes', label: 'Catálogo de Planes y Capacidades', icon: Layers },
    { id: 'usuarios', label: 'Usuarios y Administradores', icon: Users },
    { id: 'auditoria', label: 'Auditoría Global', icon: FileText },
    { id: 'configuracion', label: 'Configuración de Plataforma', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-core-cloud dark:bg-[#0F1126] text-core-navy dark:text-slate-100">
      {toast && (
        <ToastNotification
          title={toast.title}
          description={toast.description}
          onClose={() => setToast(null)}
        />
      )}

      {/* SIDEBAR EXCLUSIVO DE COREFLOW PLATFORM ADMIN */}
      <aside className="w-full lg:w-72 bg-core-navy text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 shrink-0">
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
            <CoreFlowLogo variant="horizontal" theme="dark" size="sm" />
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-core-lime text-core-navy">
              Platform Admin
            </span>
          </div>

          <div className="p-4">
            <div className="rounded-xl bg-[#1E2146] border border-core-violet/40 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-core-cyan">
                <ShieldCheck className="w-4 h-4 text-core-lime shrink-0" />
                <span>Gobierno Global del SaaS</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                Contexto administrativo independiente. Administra organizaciones, planes en
                PostgreSQL, suscripciones, capacidades, cuotas y auditoría global.
              </p>
            </div>
          </div>

          <nav className="px-3 pb-4 space-y-1" aria-label="Navegación Platform Admin">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
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
        </div>

        {/* Pie del Sidebar: Sesión Real de Administrador de Plataforma */}
        <div className="p-4 border-t border-white/10 bg-[#12142B] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-core-violet to-core-lime flex items-center justify-center text-xs font-extrabold text-core-navy shrink-0">
              PA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.fullName || 'Administrador de Plataforma'}
              </p>
              <p className="text-[11px] text-core-cyan truncate">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-core-lime" />
            <span>Cerrar sesión de Plataforma</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE COREFLOW PLATFORM ADMIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/95 dark:bg-[#171936]/95 border-b border-core-border dark:border-[#282C5A] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <GeometricAccentBar size="sm" />
            <span className="text-sm font-extrabold text-core-navy dark:text-white">
              CoreFlow Platform Admin · Consola Central de Suscripciones y Planes
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-core-violet/10 text-core-violet dark:text-indigo-300 border border-core-violet/25">
              <Database className="w-3.5 h-3.5" />
              {supabaseStatus?.configured
                ? 'Conectado a Supabase PostgreSQL'
                : 'Motor Relacional Persistente Activo'}
            </span>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-core-border dark:border-[#282C5A] text-core-muted hover:text-core-navy dark:hover:text-white"
              title="Alternar tema visual"
            >
              {darkMode ? <Sun className="w-4 h-4 text-core-lime" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1560px] w-full mx-auto space-y-6">
          {/* KPIs GLOBALES DE PLATAFORMA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Organizaciones en Plataforma"
              scopeBadge="Multi-Tenant RLS"
              subtitle="Tenants aprovisionados"
              value={String(organizations.length)}
              delta="Aisladas"
              deltaDirection="up"
              accentColor="violet"
              icon={Building2}
              progress={85}
              breakdown="Identificadores, suscripciones y datos independientes"
            />
            <KpiCard
              title="Planes en Catálogo BD"
              scopeBadge="PostgreSQL"
              subtitle="Tabla plan_catalog"
              value={String(plans.length)}
              delta="Dinámicos"
              deltaDirection="up"
              accentColor="cyan"
              icon={Layers}
              progress={90}
              breakdown={plans.map((p) => p.displayName).join(' · ')}
            />
            <KpiCard
              title="Usuarios y Membresías"
              scopeBadge="Supabase Auth"
              subtitle="Cuentas registradas"
              value={String(platformUsers.userProfiles?.length || 0)}
              delta={`${platformUsers.memberships?.length || 0} vínculos`}
              deltaDirection="up"
              accentColor="lime"
              icon={Users}
              progress={78}
              breakdown="Perfiles separados de membresías y roles"
            />
            <KpiCard
              title="Eventos de Auditoría Global"
              scopeBadge="Append-Only"
              subtitle="Trazabilidad protegida"
              value={String(globalAuditLogs.length)}
              delta="Inmutable"
              deltaDirection="up"
              accentColor="blue"
              icon={ShieldCheck}
              progress={100}
              breakdown="Trigger trg_protect_audit_logs activo"
            />
          </div>

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
                                ID: <code>{org.id}</code> · NIT: {org.taxId} · Sector: {org.sector}
                              </p>
                            </div>
                            <StatusBadge status={org.subscription?.status || org.status} />
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-core-border/70 dark:border-[#282C5A] flex flex-wrap items-center justify-between gap-2 text-xs text-core-muted dark:text-slate-300">
                            <span>
                              Cuota colaboradores:{' '}
                              <strong className="text-core-navy dark:text-white">
                                {org.activeCollaboratorsCount} / {maxCollab}
                              </strong>
                            </span>
                            <span>
                              Estructura: <strong>{org.branchesCount || 1} sede(s)</strong> ·{' '}
                              <strong>{org.departmentsCount || 1} área(s)</strong>
                            </span>
                            <span>
                              Vigencia:{' '}
                              <strong>
                                {(org.subscription?.validUntil || '2027-01-01').slice(0, 10)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </SurfaceCard>

                {/* Formulario para aprovisionar una nueva organización */}
                <SurfaceCard
                  title="Aprovisionar Nueva Organización (Tenant Independiente)"
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
                  title={`Administrar Suscripción: ${selectedOrgForSub}`}
                  subtitle="Los cambios realizados aquí actualizan organization_subscriptions y organization_entitlements en PostgreSQL"
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
                            {org.displayName} ({org.id})
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
                          <option value="active">Activa (active)</option>
                          <option value="trialing">Periodo de prueba (trialing)</option>
                          <option value="past_due">Pago pendiente (past_due)</option>
                          <option value="suspended">Suspendida (suspended)</option>
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
                      Guardar Suscripción y Cuota en Base de Datos
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
                  title="Planes Almacenados en PostgreSQL (plan_catalog)"
                  subtitle="Los planes y sus matrices de capacidades se consultan dinámicamente desde la base de datos"
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
                            <span className="text-core-muted block">Storage Privado</span>
                            <strong>{Math.round(plan.limits.maxStorageMb / 1024)} GB</strong>
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
                              {featKey}
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
                  title="Crear o Editar Plan en Base de Datos"
                  subtitle="Registra un nuevo plan o modifica las capacidades y límites de un plan existente"
                >
                  <form onSubmit={handleSavePlan} className="space-y-3.5 mt-2 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Código (plan_code)</label>
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
                        <label className="block font-semibold mb-1">Storage (MB)</label>
                        <input
                          type="number"
                          value={editingPlan.limits.maxStorageMb}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              limits: {
                                ...editingPlan.limits,
                                maxStorageMb: Number(e.target.value),
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
                          <span>{featureKey}</span>
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

                    <Button type="submit" variant="primary" size="md" className="w-full">
                      Guardar Plan en PostgreSQL (plan_catalog)
                    </Button>
                  </form>
                </SurfaceCard>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: USUARIOS Y ADMINISTRADORES */}
          {activeSection === 'usuarios' && (
            <SurfaceCard
              title="Cuentas de Plataforma y Administradores Organizacionales"
              subtitle="Separación estricta entre perfiles autenticados (user_profiles), platform_admins y membresías por organización (organization_members)"
            >
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-core-border dark:border-[#282C5A] text-[11px] font-bold uppercase text-core-muted">
                      <th className="py-3 px-3">Usuario / Nombre</th>
                      <th className="py-3 px-3">Correo Autenticado</th>
                      <th className="py-3 px-3">Organización (Tenant)</th>
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
                          CoreFlow Platform Admin (Global)
                        </td>
                        <td className="py-3 px-3">{pa.roleLevel}</td>
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
                          {mem.roleCode}
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
              title="Registro Global de Auditoría Protegida (Append-Only)"
              subtitle="Eventos inmutables de seguridad, planes, suscripciones y operaciones multi-tenant"
            >
              <div className="space-y-2.5 mt-3">
                {globalAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-core-border dark:border-[#282C5A] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-core-violet dark:text-indigo-300">
                          {log.action}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-core-cloud dark:bg-[#101228] text-[10px] font-semibold">
                          Tenant: {log.organizationId} · Módulo: {log.module} · Rol:{' '}
                          {log.actorRoleCode}
                        </span>
                      </div>
                      <p className="text-core-navy dark:text-slate-100 font-medium">
                        {log.summary}
                      </p>
                    </div>
                    <span className="text-[11px] text-core-muted tabular-nums">
                      Entidad: {log.entityId}
                    </span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* SECCIÓN 5: CONFIGURACIÓN DE PLATAFORMA */}
          {activeSection === 'configuracion' && (
            <SurfaceCard
              title="Infraestructura SaaS y Políticas de Seguridad Activas"
              subtitle="Verificación técnica de las 7 migraciones SQL, Row Level Security y Storage privado"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                <div className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] space-y-2">
                  <p className="font-bold text-sm text-core-navy dark:text-white">
                    Políticas Row Level Security (PostgreSQL)
                  </p>
                  <p className="text-core-muted dark:text-slate-300">
                    Todas las tablas operativas exigen <code>app_has_active_membership(organization_id)</code>{' '}
                    y validan capacidades directamente en base de datos mediante{' '}
                    <code>app_org_has_feature(organization_id, feature_key)</code>.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] space-y-2">
                  <p className="font-bold text-sm text-core-navy dark:text-white">
                    Supabase Storage Privado (coreflow-documents)
                  </p>
                  <p className="text-core-muted dark:text-slate-300">
                    Bucket privado configurado con aislamiento obligatorio por prefijo{' '}
                    <code>{'{organization_id}/{module}/{entity_id}/{filename}'}</code>.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          )}
        </main>
      </div>
    </div>
  )
}
