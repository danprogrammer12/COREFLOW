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
} from 'lucide-react'
import { CoreFlowLogo, DiagonalBrandCanvas } from '../components/brand/CoreFlowLogo'
import { Button } from '../components/ui/Primitives'

export function AuthView({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'recover' | 'recover-sent'
  const [email, setEmail] = useState('admin@tuempresa.com')
  const [password, setPassword] = useState('••••••••••••')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const handleSubmitLogin = (e) => {
    e.preventDefault()
    onLoginSuccess?.()
  }

  const handleSubmitRecover = (e) => {
    e.preventDefault()
    setMode('recover-sent')
  }

  return (
    <DiagonalBrandCanvas className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-white/15 bg-[#13152E]/90 backdrop-blur-xl shadow-2xl">
        {/* Columna Izquierda: Identidad Corporativa CoreFlow */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="space-y-6">
            <CoreFlowLogo variant="horizontal" theme="dark" size="lg" showSlogan />

            <div className="pt-4 space-y-4 max-w-md">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-core-violet/20 border border-core-violet/40 text-xs font-semibold text-core-cyan">
                Plataforma Modular de Gestión Organizacional
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Tecnología que impulsa la gestión organizacional.
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Centraliza información, administra clientes, organiza actividades, gestiona
                procesos y automatiza operaciones desde un solo entorno configurable.
              </p>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-white/10 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-bold text-core-cyan uppercase tracking-wider">Organiza</p>
              <p className="text-xs text-slate-400 mt-1">Clientes, tareas y documentos</p>
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Conecta</p>
              <p className="text-xs text-slate-400 mt-1">Equipos, áreas y solicitudes</p>
            </div>
            <div>
              <p className="text-xs font-bold text-core-lime uppercase tracking-wider">Evoluciona</p>
              <p className="text-xs text-slate-400 mt-1">Procesos e indicadores</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Acceso / Recuperación */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-[#171936] flex flex-col justify-center">
          {mode === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-5">
              <div>
                <CoreFlowLogo variant="horizontal" theme="dark" size="sm" />
                <h2 className="mt-5 text-2xl font-bold text-white">Inicia sesión</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Accede a tu cuenta organizacional para continuar
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@empresa.com"
                      className="w-full rounded-xl border border-white/15 bg-[#101228] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/30"
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
                      className="w-full rounded-xl border border-white/15 bg-[#101228] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/30"
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
                  <span>Recordarme</span>
                </label>

                <button
                  type="button"
                  onClick={() => setMode('recover')}
                  className="font-semibold text-core-cyan hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button type="submit" variant="primary" size="lg" icon={ArrowRight} className="w-full">
                Iniciar sesión
              </Button>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Desarrollado por Webcore</span>
                <span className="inline-flex items-center gap-1 text-core-lime font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Acceso seguro
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
                  Ingresa tu correo corporativo y enviaremos las instrucciones para restablecer tu acceso.
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
                    placeholder="tu@empresa.com"
                    className="w-full rounded-xl border border-white/15 bg-[#101228] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-core-violet focus:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" icon={ArrowRight} className="w-full">
                Enviar instrucciones
              </Button>
            </form>
          )}

          {mode === 'recover-sent' && (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-core-lime/20 text-core-lime flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Enlace enviado</h2>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Hemos enviado un enlace de recuperación a <strong className="text-white">{email}</strong>. Revisa tu bandeja de entrada para restablecer tu contraseña.
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
    </DiagonalBrandCanvas>
  )
}
