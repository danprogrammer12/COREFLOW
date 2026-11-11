import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { CoreFlowLogo } from '../components/brand/CoreFlowLogo'
import { TriangleMark } from '../components/brand/BrandShapes'
import { LegalFooter } from '../components/privacy/LegalFooter'
import { usePrivacy } from '../components/privacy/PrivacyProvider'
import { LEGAL_DOCUMENTS, PENDING, RIGHTS_REQUEST_TYPES, getLegalDocument } from '../legal/documents'

const STRONG = 'text-core-navy dark:text-white'
const MUTED = 'text-core-muted dark:text-slate-400'
const RULE = 'border-core-border dark:border-[#282C5A]'
const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet'
const FIELD = `w-full rounded-xl border ${RULE} bg-white dark:bg-[#101228] px-3 text-sm ${STRONG} focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/20`

/** Resalta los datos pendientes de validación para que no pasen inadvertidos. */
function Text({ children }) {
  const parts = String(children).split(/(\[POR VALIDAR:[^\]]+\])/g)
  return parts.map((part, index) =>
    part.startsWith('[POR VALIDAR') ? (
      <mark key={index} className="rounded px-1 bg-amber-100 text-[#92400E] dark:bg-amber-500/20 dark:text-amber-200">
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    )
  )
}

function Block({ block, onOpenPreferences }) {
  if (typeof block === 'string') {
    return (
      <p className={`text-[15px] leading-relaxed ${STRONG}`}>
        <Text>{block}</Text>
      </p>
    )
  }
  if (block.list) {
    return (
      <ul className="space-y-2 list-disc pl-5 marker:text-core-violet">
        {block.list.map((item) => (
          <li key={item} className={`text-[15px] leading-relaxed ${STRONG}`}>
            <Text>{item}</Text>
          </li>
        ))}
      </ul>
    )
  }
  if (block.table) {
    return (
      <div className={`overflow-x-auto rounded-xl border ${RULE}`}>
        <table className="w-full text-sm">
          <thead className="bg-core-cloud dark:bg-white/5">
            <tr>
              {block.table.head.map((cell) => (
                <th key={cell} className={`text-left text-xs font-semibold px-3 py-2.5 ${MUTED}`}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A]">
            {block.table.rows.map((row) => (
              <tr key={row.join('|')}>
                {row.map((cell, index) => (
                  <td key={index} className={`px-3 py-2.5 align-top ${index === 0 ? `font-medium ${STRONG}` : MUTED}`}>
                    <Text>{cell}</Text>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (block.link) {
    return (
      <a href={block.link.href} className={`inline-flex text-sm font-semibold text-core-violet dark:text-indigo-300 underline underline-offset-2 rounded ${FOCUS}`}>
        {block.link.label}
      </a>
    )
  }
  if (block.action === 'cookie-preferences') {
    return (
      <button
        type="button"
        onClick={onOpenPreferences}
        className={`h-10 px-4 rounded-xl bg-core-violet text-white text-sm font-semibold hover:bg-core-blue transition-colors ${FOCUS}`}
      >
        Abrir configuración de cookies
      </button>
    )
  }
  return null
}

function DocumentView({ document }) {
  const { openPreferences } = usePrivacy()
  const goTo = (id) => window.document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <article className="min-w-0">
      <h1 className={`text-3xl font-extrabold tracking-tight ${STRONG}`}>{document.title}</h1>
      <p className={`mt-2 text-base ${MUTED}`}>{document.description}</p>
      <dl className={`mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs ${MUTED}`}>
        <div>
          <dt className="inline">Publicación: </dt>
          <dd className={`inline font-semibold ${STRONG}`}>{document.published}</dd>
        </div>
        <div>
          <dt className="inline">Última actualización: </dt>
          <dd className={`inline font-semibold ${STRONG}`}>{document.updated}</dd>
        </div>
        <div>
          <dt className="inline">Versión: </dt>
          <dd className={`inline font-semibold tabular-nums ${STRONG}`}>{document.version}</dd>
        </div>
      </dl>

      <p role="note" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40 px-4 py-3 text-sm text-[#92400E] dark:text-amber-200">
        Borrador sujeto a revisión jurídica. No constituye asesoría legal ni declara cumplimiento pleno de la normativa.
        Los datos marcados como pendientes deben completarse antes de publicarlo.
      </p>

      <nav aria-label="Contenido del documento" className={`mt-6 rounded-xl border ${RULE} p-4`}>
        <h2 className={`text-xs font-semibold ${MUTED}`}>En este documento</h2>
        <ol className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {document.sections.map((section, index) => (
            <li key={section.id}>
              <button type="button" onClick={() => goTo(section.id)} className={`text-left text-sm text-core-violet dark:text-indigo-300 hover:underline underline-offset-2 rounded ${FOCUS}`}>
                {index + 1}. {section.heading}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-10">
        {document.sections.map((section, index) => (
          <section key={section.id} id={`sec-${section.id}`} className="scroll-mt-6 space-y-3">
            <h2 className={`flex items-baseline gap-2 text-xl font-bold tracking-tight ${STRONG}`}>
              <span className={`text-sm tabular-nums ${MUTED}`}>{index + 1}.</span>
              {section.heading}
            </h2>
            {section.body.map((block, blockIndex) => (
              <Block key={blockIndex} block={block} onOpenPreferences={openPreferences} />
            ))}
          </section>
        ))}
      </div>
    </article>
  )
}

function RightsView({ onSubmitRequest }) {
  const [form, setForm] = useState({ type: 'consulta', name: '', email: '', organization: '', detail: '', confirm: false })
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const enabled = typeof onSubmitRequest === 'function'
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!enabled) return
    setStatus({ state: 'sending', message: '' })
    const res = await onSubmitRequest({
      requestType: form.type,
      fullName: form.name.trim(),
      email: form.email.trim(),
      organizationName: form.organization.trim() || null,
      detail: form.detail.trim(),
    })
    if (res?.ok === false) {
      setStatus({ state: 'error', message: res.error })
      return
    }
    setStatus({
      state: 'sent',
      message: `Recibimos tu solicitud con la referencia ${String(res?.data?.id || '').slice(0, 8)}. Te responderemos al correo indicado dentro de los plazos legales.`,
    })
  }

  return (
    <article className="min-w-0">
      <h1 className={`text-3xl font-extrabold tracking-tight ${STRONG}`}>Ejercer tus derechos</h1>
      <p className={`mt-2 text-base ${MUTED}`}>
        Puedes consultar tus datos, pedir que se actualicen o rectifiquen, solicitar su supresión, revocar tu autorización o
        presentar un reclamo.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={`rounded-xl border ${RULE} p-4`}>
          <h2 className={`flex items-center gap-2 text-sm font-bold ${STRONG}`}>
            <TriangleMark accent="violet" />
            Consultas
          </h2>
          <p className={`mt-1 text-sm ${MUTED}`}>Respuesta en máximo 10 días hábiles, prorrogables 5 más.</p>
        </div>
        <div className={`rounded-xl border ${RULE} p-4`}>
          <h2 className={`flex items-center gap-2 text-sm font-bold ${STRONG}`}>
            <TriangleMark accent="cyan" />
            Reclamos
          </h2>
          <p className={`mt-1 text-sm ${MUTED}`}>Respuesta en máximo 15 días hábiles, prorrogables 8 más.</p>
        </div>
      </div>

      <p className={`mt-5 text-sm leading-relaxed ${STRONG}`}>
        Si tus datos los registró una organización que usa CoreFlow, ella es la responsable de su tratamiento. Indícanos cuál
        es y le trasladaremos tu solicitud. Para datos de tu cuenta, responde Webcore. Canal oficial:{' '}
        <Text>{PENDING.privacyEmail}</Text>.
      </p>

      {!enabled && (
        <p role="note" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40 px-4 py-3 text-sm text-[#92400E] dark:text-amber-200">
          El envío en línea todavía no está habilitado en este entorno. Mientras tanto, escribe al canal oficial con el tipo de
          solicitud, tu nombre, tu correo y la organización relacionada.
        </p>
      )}

      <form onSubmit={submit} className={`mt-6 space-y-4 rounded-card border ${RULE} p-5`} aria-describedby="rights-form-note">
        <fieldset disabled={!enabled || status.state === 'sending'} className="space-y-4 disabled:opacity-60">
          <div>
            <label htmlFor="rights-type" className={`block text-sm font-semibold mb-1 ${STRONG}`}>Tipo de solicitud</label>
            <select id="rights-type" value={form.type} onChange={update('type')} className={`${FIELD} h-10`}>
              {RIGHTS_REQUEST_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rights-name" className={`block text-sm font-semibold mb-1 ${STRONG}`}>Nombre completo</label>
              <input id="rights-name" required autoComplete="name" value={form.name} onChange={update('name')} className={`${FIELD} h-10`} />
            </div>
            <div>
              <label htmlFor="rights-email" className={`block text-sm font-semibold mb-1 ${STRONG}`}>Correo para la respuesta</label>
              <input id="rights-email" type="email" required autoComplete="email" value={form.email} onChange={update('email')} className={`${FIELD} h-10`} />
            </div>
          </div>
          <div>
            <label htmlFor="rights-org" className={`block text-sm font-semibold mb-1 ${STRONG}`}>Organización relacionada (opcional)</label>
            <input id="rights-org" value={form.organization} onChange={update('organization')} className={`${FIELD} h-10`} />
          </div>
          <div>
            <label htmlFor="rights-detail" className={`block text-sm font-semibold mb-1 ${STRONG}`}>Describe tu solicitud</label>
            <textarea id="rights-detail" required rows={4} maxLength={2000} value={form.detail} onChange={update('detail')} className={`${FIELD} py-2.5`} />
            <p className={`mt-1 text-xs ${MUTED}`}>No incluyas contraseñas ni datos sensibles.</p>
          </div>
          <label className={`flex items-start gap-2.5 text-sm ${STRONG}`}>
            <input type="checkbox" required checked={form.confirm} onChange={update('confirm')} className="mt-0.5 accent-core-violet" />
            Soy el titular de los datos o su representante, y autorizo usar estos datos solo para atender esta solicitud.
          </label>
          <button type="submit" className={`h-10 px-5 rounded-xl bg-core-violet text-white text-sm font-semibold hover:bg-core-blue transition-colors ${FOCUS}`}>
            {status.state === 'sending' ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </fieldset>
        <p id="rights-form-note" role="status" className={`text-sm ${status.state === 'error' ? 'text-rose-700 dark:text-rose-300' : STRONG}`}>
          {status.message}
        </p>
      </form>
    </article>
  )
}

export function LegalCenterView({ slug, onSubmitPrivacyRequest }) {
  const isRights = slug === 'derechos'
  const document = isRights ? null : getLegalDocument(slug) || LEGAL_DOCUMENTS[0]
  const topRef = useRef(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' })
    window.document.title = `${isRights ? 'Tus derechos' : document.title} · CoreFlow`
    return () => {
      window.document.title = 'CoreFlow — Organiza. Conecta. Evoluciona.'
    }
  }, [slug, isRights, document])

  const navItem = (href, label, active) => (
    <a
      key={href}
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${FOCUS} ${
        active ? 'bg-core-violet/10 font-semibold text-core-violet dark:text-indigo-300' : `${MUTED} hover:bg-core-cloud dark:hover:bg-white/5`
      }`}
    >
      {label}
    </a>
  )

  return (
    <div ref={topRef} className="min-h-screen bg-core-cloud dark:bg-[#0F1126]">
      <header className="relative overflow-hidden bg-core-navy text-white">
        <div className="cf-auth-pattern" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <CoreFlowLogo variant="horizontal" theme="dark" size="sm" />
          <a href="#/" className={`inline-flex items-center gap-1.5 text-sm font-semibold text-slate-200 hover:text-white rounded ${FOCUS}`}>
            <ArrowLeft className="w-4 h-4" />
            Volver a CoreFlow
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Documentos legales" className="lg:sticky lg:top-6 self-start">
          <h2 className={`px-3 text-xs font-semibold ${MUTED}`}>Centro legal</h2>
          <div className="mt-2 space-y-0.5">
            {LEGAL_DOCUMENTS.map((d) => navItem(`#/legal/${d.slug}`, d.title, !isRights && d.slug === document.slug))}
            {navItem('#/legal/derechos', 'Ejercer tus derechos', isRights)}
          </div>
        </nav>

        <main className="min-w-0 rounded-card border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] px-5 py-7 sm:px-10 sm:py-10">
          <div className="max-w-[72ch]">
            {isRights ? <RightsView onSubmitRequest={onSubmitPrivacyRequest} /> : <DocumentView document={document} />}
          </div>
        </main>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <LegalFooter />
      </div>
    </div>
  )
}
