// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React from 'react'

/**
 * Formas de apoyo derivadas del patrón de triángulos del login (aprobado).
 * No reproducen ni alteran el logotipo: solo repiten su geometría triangular.
 */

export const BRAND_ACCENTS = Object.freeze({
  violet: '#6545E8',
  blue: '#3568E8',
  cyan: '#08C9E8',
  lime: '#A6E91C',
})

/** Triángulo pequeño que identifica el color de una sección. */
export function TriangleMark({ accent = 'violet', className = 'w-2.5 h-2.5' }) {
  return (
    <svg viewBox="0 0 12 10.4" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M0 10.4 6 0l6 10.4z" fill={BRAND_ACCENTS[accent]} />
    </svg>
  )
}

/** Fragmento del teselado del login para la esquina de una tarjeta. */
export function TriangleCluster({ accent = 'violet', className = '' }) {
  const color = BRAND_ACCENTS[accent]
  return (
    <svg
      viewBox="60 0 180 104"
      className={`pointer-events-none absolute -right-3 -top-2 w-24 h-14 sm:w-36 sm:h-[84px] ${className}`}
      aria-hidden="true"
    >
      <path d="M60 0h120l-60 104z" fill={color} className="opacity-[0.10] dark:opacity-[0.16]" />
      <path d="M120 104 180 0l60 104z" fill={color} className="opacity-[0.22] dark:opacity-[0.32]" />
      <path d="M180 0h60l-30 52z" fill={color} className="opacity-60 dark:opacity-70" />
    </svg>
  )
}
