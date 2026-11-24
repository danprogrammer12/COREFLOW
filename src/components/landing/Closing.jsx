// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React from 'react'
import { ArrowRight } from 'lucide-react'
import { TriangleCluster } from '../brand/BrandShapes'
import { Atmos, Tri } from './atmos'
import { DEMO_STARTER, FOCUS_DARK, Reveal } from './ui'

export function Closing({ canDemo, busy, onStartDemo, onLogin }) {
  return (
    <section aria-labelledby="lf-cierre-title" className="lf-dark-section isolate overflow-hidden bg-core-navy-deep pb-24 text-white lg:pb-36" style={{ '--lf-prev': '#101228' }}>
      <Atmos mesh="d" grid />
      <Tri tone="mix" size="xl" mask="r" />
      <Tri tone="lime" size="lg" mask="br" className="opacity-80" />
      <TriangleCluster accent="lime" className="!-right-4 !top-20 !h-28 !w-48 opacity-40 sm:!h-48 sm:!w-80" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <Reveal as="h2" id="lf-cierre-title" className="text-[clamp(2.5rem,8vw,7rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          Organiza. Conecta.{' '}
          <span className="text-core-lime">Evoluciona.</span>
        </Reveal>
        {canDemo && (
          <Reveal as="p" delay={40} className="mt-6 max-w-[48ch] text-[18px] leading-[1.6] text-slate-200">
            Entra a la demo con datos de ejemplo y recorre el flujo completo, sin registrarte.
          </Reveal>
        )}
        <Reveal delay={70} className="mt-10 flex flex-wrap gap-3">
          {canDemo && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onStartDemo(DEMO_STARTER)}
              className={`inline-flex h-12 items-center gap-2 rounded-xl bg-core-lime px-6 text-[15px] font-semibold text-core-navy hover:brightness-95 disabled:opacity-60 ${FOCUS_DARK}`}
            >
              Explorar la demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onLogin}
            className={`inline-flex h-12 items-center rounded-xl border border-white/40 px-6 text-[15px] font-semibold text-white hover:bg-white/10 ${FOCUS_DARK}`}
          >
            Iniciar sesión
          </button>
        </Reveal>
      </div>
    </section>
  )
}
