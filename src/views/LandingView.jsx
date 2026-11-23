import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, Menu, X } from 'lucide-react'
import { CoreFlowLogo } from '../components/brand/CoreFlowLogo'
import { LegalFooter } from '../components/privacy/LegalFooter'
import { Hero } from '../components/landing/Hero'
import { ChaosToOrder } from '../components/landing/ChaosToOrder'
import { ModuleExplorer, MODULES } from '../components/landing/ModuleExplorer'
import { PlansSection } from '../components/landing/PlansSection'
import { Closing } from '../components/landing/Closing'
import { DayToDay, MetricsBand } from '../components/landing/DayToDay'
import { ModuleMarquee } from '../components/landing/Marquee'
import { idlePreloadDemo } from './preloadRoutes'
import { DEMO_STARTER, FOCUS_DARK, scrollToId, useArmReveal } from '../components/landing/ui'

const NAV = [
  ['como-funciona', 'Cómo funciona'],
  ['funciones', 'Funciones'],
  ['planes', 'Planes'],
]

export function LandingView({ isDemoData = false, onStartDemo, onOpenDemo, pendingDemoId = null, demoError = null, onLogin }) {
  const busy = Boolean(pendingDemoId)
  const canDemo = isDemoData && typeof onStartDemo === 'function'
  // Planes: arrancan esa demo directo. Resto de CTA: abren la pantalla de demo (o, sin ella, la demo Starter)
  const demoHandler = canDemo ? onStartDemo : null
  const openDemo = canDemo ? () => (onOpenDemo ? onOpenDemo() : onStartDemo(DEMO_STARTER)) : null
  const rootRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef(null)

  useArmReveal(rootRef)
  useEffect(() => idlePreloadDemo(), [])

  // Brillo que sigue al cursor en cualquier elemento .lf-spot (un solo listener delegado)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      const el = e.target.closest?.('.lf-spot')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    root.addEventListener('pointermove', onMove, { passive: true })
    return () => root.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div ref={rootRef} className="lf-root min-h-screen overflow-x-clip bg-core-navy-deep text-white selection:bg-core-violet selection:text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-core-navy-deep">
        {/* Barra a todo el ancho: logo en el extremo izquierdo, enlaces en el centro real, acciones en el derecho */}
        <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <div className="justify-self-start">
            <CoreFlowLogo variant="horizontal" theme="dark" size="md" />
          </div>
          <nav aria-label="Secciones" className="hidden items-center gap-1 text-sm font-medium text-slate-200 md:flex">
            {NAV.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToId(id)}
                className={`h-11 rounded-lg px-3 hover:text-white hover:underline underline-offset-4 ${FOCUS_DARK}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center justify-self-end gap-2">
            <button
              type="button"
              onClick={onLogin}
              className={`h-11 items-center rounded-xl border border-white/40 px-4 text-sm font-semibold text-white hover:border-white/80 hover:bg-white/5 ${FOCUS_DARK} ${
                canDemo ? 'hidden sm:inline-flex' : 'inline-flex'
              }`}
            >
              Iniciar sesión
            </button>
            {canDemo && (
              <button
                type="button"
                disabled={busy}
                onClick={openDemo}
                className={`inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-core-lime px-3.5 text-[13px] font-semibold text-core-navy hover:brightness-95 disabled:opacity-60 sm:px-4 sm:text-sm ${FOCUS_DARK}`}
              >
                {pendingDemoId === DEMO_STARTER.id ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-label="Entrando" />
                ) : (
                  <>
                    Explorar la demo
                    <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
            <button
              ref={menuBtnRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls="lf-nav-menu"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen((v) => !v)}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 text-white hover:border-white/80 md:hidden ${FOCUS_DARK}`}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div id="lf-nav-menu" className="border-t border-white/10 bg-core-navy-deep px-4 pb-4 pt-2 sm:px-6 md:hidden">
            <ul className="space-y-1">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      scrollToId(id)
                    }}
                    className={`flex h-11 w-full items-center rounded-lg px-3 text-left text-[15px] font-semibold text-white hover:bg-white/10 ${FOCUS_DARK}`}
                  >
                    {label}
                  </button>
                </li>
              ))}
              {canDemo && (
                <li className="sm:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onLogin?.()
                    }}
                    className={`flex h-11 w-full items-center rounded-lg px-3 text-left text-[15px] font-semibold text-white hover:bg-white/10 ${FOCUS_DARK}`}
                  >
                    Iniciar sesión
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
        {demoError && (
          <p aria-hidden="true" className="border-t border-red-300/30 bg-red-500/10 px-4 py-1.5 text-center text-[13px] text-red-200 sm:px-6">
            {demoError}
          </p>
        )}
      </header>

      <main>
        <Hero
          canDemo={canDemo}
          busy={busy}
          pendingDemoId={pendingDemoId}
          demoError={demoError}
          onStartDemo={openDemo}
          onLogin={onLogin}
        />
        <ModuleMarquee />
        <ChaosToOrder />
        <ModuleExplorer />
        <DayToDay />
        <MetricsBand moduleCount={MODULES.length} />
        <PlansSection demoHandler={demoHandler} pendingDemoId={pendingDemoId} busy={busy} onLogin={onLogin} />
        <Closing canDemo={canDemo} busy={busy} onStartDemo={openDemo} onLogin={onLogin} />
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-core-navy-deep py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-end md:justify-between md:px-8">
          <div className="space-y-3">
            <CoreFlowLogo variant="horizontal" theme="dark" size="sm" />
            <p className="text-[13px] text-slate-300">Desarrollado por Webcore</p>
          </div>
          <LegalFooter tone="dark" />
        </div>
      </footer>
    </div>
  )
}
