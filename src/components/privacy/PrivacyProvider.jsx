/**
 * CONSENTIMIENTO DE COOKIES EN LA INTERFAZ
 * CoreFlow — src/components/privacy/PrivacyProvider.jsx
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { COOKIE_CATEGORIES, createConsentManager } from '../../core/privacy/consent.js'

const PrivacyContext = createContext(null)

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet'
const BUTTON = `h-11 sm:h-10 px-3 rounded-xl text-[13px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${FOCUS}`
const SOLID = `${BUTTON} bg-core-navy text-white hover:bg-[#232650] dark:bg-white dark:text-core-navy dark:hover:bg-slate-200`
const OUTLINE = `${BUTTON} border border-core-border dark:border-[#3A3F75] text-core-navy dark:text-white hover:bg-core-cloud dark:hover:bg-white/5`

function browserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function PrivacyProvider({ children, onRecord = null }) {
  const onRecordRef = useRef(onRecord)
  onRecordRef.current = onRecord

  const manager = useMemo(
    () => createConsentManager({ storage: browserStorage(), onRecord: (record) => onRecordRef.current?.(record) }),
    []
  )
  const consent = useSyncExternalStore(manager.subscribe, manager.getSnapshot)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  const value = useMemo(
    () => ({
      consent,
      isAllowed: manager.isAllowed,
      acceptAll: manager.acceptAll,
      rejectOptional: manager.rejectOptional,
      save: manager.save,
      withdraw: manager.withdraw,
      runWhenAllowed: manager.runWhenAllowed,
      readPreference: manager.readPreference,
      writePreference: manager.writePreference,
      openPreferences: () => setPreferencesOpen(true),
    }),
    [consent, manager]
  )

  return (
    <PrivacyContext.Provider value={value}>
      {children}
      {!consent && !preferencesOpen && <CookieBanner />}
      {preferencesOpen && <CookiePreferencesDialog onClose={() => setPreferencesOpen(false)} />}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (!context) throw new Error('usePrivacy debe usarse dentro de <PrivacyProvider>.')
  return context
}

function CookieBanner() {
  const { acceptAll, rejectOptional, openPreferences } = usePrivacy()

  return (
    <section
      role="region"
      aria-label="Aviso de cookies"
      className="fixed z-[60] inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-[440px] max-h-[70dvh] overflow-y-auto rounded-card border border-core-border dark:border-[#3A3F75] bg-white dark:bg-[#171936] p-3.5 sm:p-5 shadow-[0_18px_40px_-12px_rgba(23,25,54,0.35)]"
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-core-navy dark:text-white">
        <svg viewBox="0 0 12 10.4" className="w-2.5 h-2.5" aria-hidden="true">
          <path d="M0 10.4 6 0l6 10.4z" fill="#08C9E8" />
        </svg>
        Tu privacidad en CoreFlow
      </h2>
      <p className="mt-1.5 sm:mt-2 text-xs leading-snug sm:leading-relaxed text-core-muted dark:text-slate-300">
        Usamos almacenamiento necesario para que puedas iniciar sesión y trabajar de forma segura.
        <span className="hidden sm:inline">
          {' '}Con tu permiso, también recordaremos preferencias como el tema.
        </span>{' '}
        No usamos analítica ni publicidad.{' '}
        <a href="#/legal/cookies" className={`font-semibold text-core-violet dark:text-indigo-300 underline underline-offset-2 rounded ${FOCUS}`}>
          Política de cookies
        </a>
      </p>
      <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={rejectOptional} className={SOLID}>
          Rechazar opcionales
        </button>
        <button type="button" onClick={acceptAll} className={SOLID}>
          Aceptar todas
        </button>
        <button type="button" onClick={openPreferences} className={`${OUTLINE} col-span-2`}>
          Configurar preferencias
        </button>
      </div>
    </section>
  )
}

function Toggle({ checked, disabled, onChange, labelledBy }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${FOCUS} ${
        checked ? 'bg-core-violet' : 'bg-slate-300 dark:bg-slate-600'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  )
}

export function CookiePreferencesDialog({ onClose }) {
  const { consent, save, acceptAll, rejectOptional, withdraw } = usePrivacy()
  const dialogRef = useRef(null)
  const [choices, setChoices] = useState(() =>
    Object.fromEntries(COOKIE_CATEGORIES.map((c) => [c.id, c.required || Boolean(consent?.accepted.includes(c.id))]))
  )

  // Sin limpieza: cerrar aquí dispararía `close` y desmontaría el diálogo en el modo estricto de React.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const finish = (action) => () => {
    action()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="cookie-prefs-title"
      className="m-auto w-[min(560px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] rounded-card p-0 bg-white dark:bg-[#171936] text-core-navy dark:text-white backdrop:bg-core-navy/60 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex flex-col max-h-[calc(100dvh-24px)]">
        <header className="relative overflow-hidden bg-core-navy px-5 py-4 text-white">
          <div className="cf-auth-pattern" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <h2 id="cookie-prefs-title" className="text-lg font-bold">
                Configuración de cookies
              </h2>
              <p className="mt-0.5 text-xs text-slate-300">Elige qué permites. Puedes cambiarlo cuando quieras.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 ${FOCUS}`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <ul className="overflow-y-auto divide-y divide-core-border/70 dark:divide-[#282C5A]">
          {COOKIE_CATEGORIES.map((category) => (
            <li key={category.id} className="px-5 py-4 flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h3 id={`cookie-cat-${category.id}`} className="text-sm font-semibold">
                  {category.name}
                  {category.required && (
                    <span className="ml-2 text-[11px] font-medium text-core-muted dark:text-slate-400">Siempre activas</span>
                  )}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-core-muted dark:text-slate-400">{category.description}</p>
              </div>
              <Toggle
                checked={choices[category.id]}
                disabled={category.required}
                labelledBy={`cookie-cat-${category.id}`}
                onChange={(value) => setChoices((prev) => ({ ...prev, [category.id]: value }))}
              />
            </li>
          ))}
        </ul>

        {consent && (
          <p className="px-5 pb-3 text-[11px] text-core-muted dark:text-slate-400">
            Decisión registrada el {new Date(consent.updatedAt).toLocaleString('es-CO')} · referencia{' '}
            <span className="tabular-nums">{consent.consentId.slice(0, 8)}</span> ·{' '}
            <button type="button" onClick={finish(withdraw)} className={`font-semibold text-core-violet dark:text-indigo-300 underline underline-offset-2 rounded ${FOCUS}`}>
              Retirar consentimiento
            </button>
          </p>
        )}

        <footer className="px-5 py-4 border-t border-core-border dark:border-[#282C5A] grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button type="button" onClick={finish(rejectOptional)} className={OUTLINE}>
            Rechazar opcionales
          </button>
          <button type="button" onClick={finish(() => save(choices))} className={OUTLINE}>
            Guardar preferencias
          </button>
          <button type="button" onClick={finish(acceptAll)} className={SOLID}>
            Aceptar todas
          </button>
        </footer>
      </div>
    </dialog>
  )
}
