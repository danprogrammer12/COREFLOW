// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { CoreFlowLogo } from '../components/brand/CoreFlowLogo'
import { Atmos } from '../components/landing/atmos'
import { FOCUS_DARK } from '../components/landing/ui'

export function NotFoundView() {
  const titleRef = useRef(null)
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <div className="lf-root relative isolate flex min-h-screen flex-col overflow-x-clip bg-core-navy-deep text-white">
      <Atmos mesh="hero" grid fade />
      <header className="relative z-10 flex h-16 items-center border-b border-white/10 px-4 sm:px-6 lg:px-8">
        <a href="/" aria-label="CoreFlow, ir al inicio" className={`rounded ${FOCUS_DARK}`}>
          <CoreFlowLogo variant="horizontal" theme="dark" size="md" />
        </a>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold text-core-cyan">Error 404</p>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="mt-3 text-balance text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] outline-none"
        >
          Esta página no existe.
        </h1>
        <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.6] text-slate-200">
          Puede que el enlace esté incompleto o que la página haya cambiado de lugar.
        </p>
        <a
          href="/"
          className={`mt-8 inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-core-navy hover:bg-slate-100 ${FOCUS_DARK}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </a>
      </main>
    </div>
  )
}
