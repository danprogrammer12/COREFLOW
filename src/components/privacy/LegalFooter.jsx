import React from 'react'
import { usePrivacy } from './PrivacyProvider'

export const LEGAL_LINKS = Object.freeze([
  { href: '/legal/privacidad', label: 'Privacidad' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/terminos', label: 'Términos' },
  { href: '/legal/tratamiento-datos', label: 'Tratamiento de datos' },
  { href: '/legal/aviso-legal', label: 'Aviso legal' },
  { href: '/legal/derechos', label: 'Tus derechos' },
])

const FOCUS =
  'rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet'

/** Pie de página legal. `tone="dark"` para fondos azul marino. */
export function LegalFooter({ tone = 'light', className = '' }) {
  const { openPreferences } = usePrivacy()
  const link =
    tone === 'dark'
      ? 'text-slate-300 hover:text-white'
      : 'text-core-muted dark:text-slate-400 hover:text-core-navy dark:hover:text-white'

  return (
    <footer className={`text-[12px] ${className}`}>
      <nav aria-label="Información legal" className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {LEGAL_LINKS.map((item) => (
          <a key={item.href} href={item.href} className={`${link} hover:underline underline-offset-2 ${FOCUS}`}>
            {item.label}
          </a>
        ))}
      </nav>
      <button type="button" onClick={openPreferences} className={`mt-2 ${link} hover:underline underline-offset-2 ${FOCUS}`}>
        Configuración de cookies
      </button>
    </footer>
  )
}
