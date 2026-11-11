import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { CoreFlowLogo } from '../components/brand/CoreFlowLogo'
import { Button } from '../components/ui/Primitives'

const DEMO_CONTEXTS = [
  { id: 'platform_admin', label: 'Platform Admin', email: 'platform.admin@coreflow.app' },
  { id: 'starter_admin', label: 'Starter', email: 'admin.starter@unidadpyme.co' },
  { id: 'business_admin', label: 'Business', email: 'admin.business@corporativoprincipal.co' },
]

const AUTH_ERROR_COPY = {
  AUTH_INVALID_CREDENTIALS: 'El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo.',
  AUTH_NO_ACTIVE_MEMBERSHIP: 'Esta cuenta no tiene una organización activa. Contacta a tu administrador.',
  BACKEND_UNAVAILABLE: 'No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FOCUS_OUTLINE =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet'

function readableError(result) {
  if (AUTH_ERROR_COPY[result?.code]) return AUTH_ERROR_COPY[result.code]
  const message = String(result?.error || result?.message || '').replace(/^[A-Z_]+:\s*/, '')
  return message || 'No fue posible iniciar sesión. Inténtalo de nuevo.'
}

function validateEmail(value) {
  if (!value.trim()) return 'Escribe tu correo electrónico.'
  if (!EMAIL_PATTERN.test(value.trim())) return 'Revisa el formato del correo, por ejemplo nombre@empresa.com.'
  return null
}

function AuthField({ id, label, error, trailing, inputRef, ...inputProps }) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-core-navy">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          ref={inputRef}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`h-11 w-full rounded-lg border bg-white px-3.5 text-[15px] text-core-navy transition-colors duration-150 hover:border-core-navy focus:border-core-violet focus:outline-none focus:ring-1 focus:ring-core-violet ${
            error ? 'border-red-600' : 'border-[color:var(--cf-border-control)]'
          } ${trailing ? 'pr-12' : ''}`}
          {...inputProps}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

function SubmitButton({ busy, busyLabel, children }) {
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className={`w-full ${FOCUS_OUTLINE}`}
      disabled={busy}
      aria-busy={busy}
    >
      {busy ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {busyLabel}
        </span>
      ) : (
        children
      )}
    </Button>
  )
}

function BackToLogin({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded text-sm font-medium text-core-violet underline-offset-4 hover:underline ${FOCUS_OUTLINE}`}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Volver al inicio de sesión
    </button>
  )
}

export function AuthView({ onAuthenticate, onRequestPasswordReset, isDemoData = false }) {
  const [mode, setMode] = useState('login') // 'login' | 'recover' | 'recover-sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [fieldErrors, setFieldErrors] = useState({})
  const [authError, setAuthError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingContext, setPendingContext] = useState(null)

  const headingRef = useRef(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const isFirstRender = useRef(true)

  // Depende de los datos que usa la app, no de que existan variables de Supabase.
  const demoAccessEnabled = isDemoData
  const busy = isSubmitting || Boolean(pendingContext)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [mode])

  const changeMode = (nextMode) => {
    setFieldErrors({})
    setAuthError(null)
    setMode(nextMode)
  }

  const authenticate = async (credentials) => {
    const res = await onAuthenticate?.(credentials)
    if (res && res.ok === false) setAuthError(readableError(res))
  }

  const handleSubmitLogin = async (e) => {
    e.preventDefault()
    const errors = {
      email: validateEmail(email),
      password: password ? null : 'Escribe tu contraseña.',
    }
    setFieldErrors(errors)
    setAuthError(null)
    if (errors.email) return emailRef.current?.focus()
    if (errors.password) return passwordRef.current?.focus()

    setIsSubmitting(true)
    try {
      await authenticate({ email: email.trim(), password })
    } catch (err) {
      setAuthError(readableError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoContext = async (context) => {
    setFieldErrors({})
    setAuthError(null)
    setPendingContext(context.id)
    try {
      await authenticate({ email: context.email, password: '' })
    } catch (err) {
      setAuthError(readableError(err))
    } finally {
      setPendingContext(null)
    }
  }

  const handleSubmitRecover = async (e) => {
    e.preventDefault()
    const error = validateEmail(email)
    setFieldErrors({ email: error })
    if (error) return emailRef.current?.focus()
    const res = await onRequestPasswordReset?.(email.trim())
    if (res?.ok === false) return setAuthError(readableError(res))
    changeMode('recover-sent')
  }

  const headingClass = 'text-[28px] font-bold leading-tight tracking-tight text-core-navy caret-transparent focus:outline-none'

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white selection:bg-core-violet selection:text-white lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-core-navy p-12 text-white lg:flex xl:p-16">
        <div className="cf-auth-pattern" aria-hidden="true" />
        <CoreFlowLogo variant="horizontal" theme="dark" size="md" className="relative" />

        <div className="relative">
          <p className="text-[clamp(2.75rem,4.4vw,4.25rem)] font-extrabold leading-[1.04] tracking-[-0.03em]">
            Organiza.
            <br />
            Conecta.
            <br />
            <span className="text-core-lime">Evoluciona.</span>
          </p>
          <p className="mt-6 max-w-[38ch] text-base leading-relaxed text-slate-300">
            Clientes, equipos y procesos de tu organización en una sola plataforma.
          </p>
        </div>

        <p className="relative text-[13px] text-slate-400">Desarrollado por Webcore</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 lg:hidden">
            <CoreFlowLogo variant="horizontal" theme="light" size="md" showSlogan />
          </div>

          {mode === 'login' && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className={headingClass}>
                Inicia sesión
              </h1>
              <p className="mt-2 text-[15px] text-core-muted">Accede al espacio de trabajo de tu organización.</p>

              {authError && (
                <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitLogin} noValidate className="mt-8 space-y-5">
                <AuthField
                  id="auth-email"
                  label="Correo electrónico"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                  inputRef={emailRef}
                />

                <AuthField
                  id="auth-password"
                  label="Contraseña"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  inputRef={passwordRef}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={showPass}
                      className={`absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-lg text-core-muted transition-colors duration-150 hover:text-core-navy ${FOCUS_OUTLINE}`}
                    >
                      {showPass ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  }
                />

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-core-navy">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`h-4 w-4 rounded accent-core-violet ${FOCUS_OUTLINE}`}
                    />
                    Mantener sesión activa
                  </label>
                  <button
                    type="button"
                    onClick={() => changeMode('recover')}
                    className={`rounded font-medium text-core-violet underline-offset-4 hover:underline ${FOCUS_OUTLINE}`}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <SubmitButton busy={isSubmitting} busyLabel="Verificando…">
                  Ingresar
                </SubmitButton>
              </form>

              {demoAccessEnabled && (
                <div className="mt-8 border-t border-core-border pt-6">
                  <p id="auth-demo-label" className="text-[13px] text-core-muted">
                    Entrar a un entorno de demostración
                  </p>
                  <div role="group" aria-labelledby="auth-demo-label" className="mt-3 grid grid-cols-3 gap-2">
                    {DEMO_CONTEXTS.map((context) => (
                      <button
                        key={context.id}
                        type="button"
                        disabled={busy}
                        aria-busy={pendingContext === context.id}
                        onClick={() => handleDemoContext(context)}
                        className={`flex h-10 items-center justify-center rounded-lg border border-core-border px-1 text-[13px] font-medium text-core-navy transition-colors duration-150 hover:border-core-violet hover:text-core-violet disabled:opacity-50 ${FOCUS_OUTLINE}`}
                      >
                        {pendingContext === context.id ? (
                          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-label="Entrando" />
                        ) : (
                          context.label
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'recover' && (
            <>
              <BackToLogin onClick={() => changeMode('login')} />
              <h1 ref={headingRef} tabIndex={-1} className={`mt-6 ${headingClass}`}>
                Recuperar contraseña
              </h1>
              <p className="mt-2 text-[15px] text-core-muted">
                Escribe el correo de tu cuenta para restablecer el acceso.
              </p>

              <form onSubmit={handleSubmitRecover} noValidate className="mt-8 space-y-5">
                <AuthField
                  id="auth-recover-email"
                  label="Correo electrónico"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                  inputRef={emailRef}
                />
                <SubmitButton busy={false}>Enviar instrucciones</SubmitButton>
              </form>
            </>
          )}

          {mode === 'recover-sent' && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className={headingClass}>
                Revisa tu correo
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-core-muted">
                Si <span className="font-medium text-core-navy">{email.trim()}</span> tiene una cuenta, recibirás las
                instrucciones para restablecer tu contraseña.
              </p>
              <div className="mt-8">
                <BackToLogin onClick={() => changeMode('login')} />
              </div>
            </>
          )}

          <p className="mt-10 text-[13px] text-core-muted lg:hidden">Desarrollado por Webcore</p>
        </div>
      </main>
    </div>
  )
}
