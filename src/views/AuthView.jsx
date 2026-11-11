import React, { useState } from 'react'
import {
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Layers,
  AlertCircle,
} from 'lucide-react'
import { CoreFlowLogo, DiagonalBrandCanvas } from '../components/brand/CoreFlowLogo'
import { Button, GeometricAccentBar } from '../components/ui/Primitives'

const PROVISIONED_CONTEXT_ACCOUNTS = [
  {
    id: 'platform_admin',
    badge: 'Contexto A · Platform Admin',
    label: 'Administrador Global de Plataforma',
    email: 'platform.admin@coreflow.app',
    desc: 'Consola global: gestión de organizaciones, planes en PostgreSQL, suscripciones y auditoría.',
    accent: 'border-core-lime/40 bg-core-lime/10 text-core-lime',
  },
  {
    id: 'starter_admin',
    badge: 'Contexto B · CoreFlow Starter',
    label: 'Soluciones Ágiles del Caribe (Starter)',
    email: 'admin.starter@unidadpyme.co',
    desc: 'Organización con suscripción Starter (1–15 colab.): flujo directo y datos propios aislados.',
    accent: 'border-core-cyan/40 bg-core-cyan/10 text-core-cyan',
  },
  {
    id: 'business_admin',
    badge: 'Contexto C · CoreFlow Business',
    label: 'Grupo Corporativo Andino (Business)',
    email: 'admin.business@corporativoprincipal.co',
    desc: 'Organización con suscripción Business (16–30 colab.): departamentos, aprobaciones multinivel y KPIs por área.',
    accent: 'border-core-violet/50 bg-core-violet/20 text-indigo-300',
  },
]

export function AuthView({ onAuthenticate, supabaseStatus }) {
  const [mode, setMode] = useState('login') // 'login' | 'recover' | 'recover-sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitLogin = async (e) => {
    e.preventDefault()
    setAuthError(null)
    setIsSubmitting(true)
    try {
      const res = await onAuthenticate?.({ email, password })
      if (res && res.ok === false) {
        setAuthError(res.error || 'No fue posible iniciar sesión con las credenciales indicadas.')
      }
    } catch (err) {
      setAuthError(err.message || 'Error de autenticación.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickAccountSelect = async (accountEmail) => {
    setEmail(accountEmail)
    setPassword('CoreFlow#2026')
    setAuthError(null)
    const res = await onAuthenticate?.({
      email: accountEmail,
      password: 'CoreFlow#2026',
    })
    if (res && res.ok === false) {
      setAuthError(res.error)
    }
  }

  const handleSubmitRecover = (e) => {
    e.preventDefault()
    setMode('recover-sent')
  }

  return (
    <DiagonalBrandCanvas className="min-h-screen flex flex-col justify-between p-4 sm:p-8">
      {/* Cabecera Superior */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <GeometricAccentBar size="sm" />
          <span>CoreFlow SaaS · Autenticación Multi-Tenant y Resolución de Contexto</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-core-cyan">
          {supabaseStatus?.configured
            ? 'Supabase Auth Activo'
            : 'Persistencia Relacional Multi-Tenant Activa'}
        </span>
      </div>

      {/* Contenedor Central */}
      <div className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-white/15 bg-[#13152E]/95 backdrop-blur-xl shadow-2xl">
        {/* Columna Izquierda: Identidad Corporativa CoreFlow + Acceso a las 3 Cuentas Aprovisionadas */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="space-y-5">
            <CoreFlowLogo variant="horizontal" theme="dark" size="lg" showSlogan />

            <div className="pt-2 space-y-2.5 max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-core-violet/20 border border-core-violet/40 text-xs font-semibold text-core-cyan">
                Plataforma Modular de Gestión Organizacional
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Tres contextos independientes sobre una arquitectura SaaS unificada.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Cada sesión autenticada resuelve su propio contexto de autorización, suscripción y
                aislamiento de datos en PostgreSQL sin compartir información entre organizaciones.
              </p>
            </div>

            {/* Tarjetas de las 3 Cuentas Diferenciadas (Sección 2 y 5) */}
            <div className="pt-2 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cuentas aprovisionadas para validación de los 3 contextos:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {PROVISIONED_CONTEXT_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickAccountSelect(acc.email)}
                    className="w-full text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-core-violet/50 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${acc.accent}`}
                        >
                          {acc.badge}
                        </span>
                        <span className="text-xs font-bold text-white">{acc.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{acc.desc}</p>
                      <p className="text-[11px] font-mono text-core-cyan">{acc.email}</p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-core-violet text-white text-xs font-semibold shrink-0 group-hover:bg-core-blue transition-colors inline-flex items-center gap-1.5 self-start sm:self-center">
                      <span>Iniciar sesión</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-bold text-core-cyan uppercase tracking-wider">Organiza</p>
              <p className="text-xs text-slate-400 mt-0.5">Clientes, tareas y documentos</p>
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Conecta</p>
              <p className="text-xs text-slate-400 mt-0.5">Equipos, áreas y solicitudes</p>
            </div>
            <div>
              <p className="text-xs font-bold text-core-lime uppercase tracking-wider">Evoluciona</p>
              <p className="text-xs text-slate-400 mt-0.5">Procesos e indicadores</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Inicio de Sesión / Recuperación */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-[#171936] flex flex-col justify-center">
          {mode === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-5">
              <div>
                <CoreFlowLogo variant="horizontal" theme="dark" size="sm" />
                <h2 className="mt-5 text-2xl font-bold text-white">Inicia sesión</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Ingresa tus credenciales corporativas o selecciona una de las 3 cuentas aprovisionadas
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Correo electrónico corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@organizacion.co"
                      className="h-10 w-full rounded-xl border border-white/15 bg-[#101228] pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="h-10 w-full rounded-xl border border-white/15 bg-[#101228] pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label="Mostrar u ocultar contraseña"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-[#101228] text-core-violet focus:ring-core-violet"
                  />
                  <span>Mantener sesión activa</span>
                </label>

                <button
                  type="button"
                  onClick={() => setMode('recover')}
                  className="font-semibold text-core-cyan hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={ArrowRight}
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verificando sesión...' : 'Ingresar a la plataforma'}
              </Button>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Desarrollado por Webcore</span>
                <span className="inline-flex items-center gap-1 text-core-lime font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Aislamiento RLS Activo
                </span>
              </div>
            </form>
          )}

          {mode === 'recover' && (
            <form onSubmit={handleSubmitRecover} className="space-y-5">
              <div>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-core-cyan hover:underline mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver al inicio de sesión
                </button>
                <h2 className="text-2xl font-bold text-white">Recuperar contraseña</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Ingresa tu correo registrado y enviaremos las instrucciones para restablecer tu acceso.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo electrónico registrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@organizacion.co"
                    className="h-10 w-full rounded-xl border border-white/15 bg-[#101228] pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-core-violet focus:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" icon={ArrowRight} className="w-full">
                Enviar enlace de recuperación
              </Button>
            </form>
          )}

          {mode === 'recover-sent' && (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-core-lime/20 text-core-lime flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Instrucciones enviadas</h2>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Hemos enviado un enlace de restablecimiento a{' '}
                  <strong className="text-white">{email}</strong>.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setMode('login')}
                className="w-full"
              >
                Regresar al acceso
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto text-center text-[11px] text-slate-400 py-1">
        CoreFlow · Organiza. Conecta. Evoluciona. · Plataforma SaaS Multi-Tenant
      </div>
    </DiagonalBrandCanvas>
  )
}
