// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useId } from 'react'

/**
 * Símbolo geométrico dinámico de CoreFlow (3 elementos diagonales: Cian bipartito, Electric Violet y Lime Green)
 */
export function CoreFlowIsotipo({ className = 'w-9 h-9', mono = null }) {
  const uid = useId().replace(/:/g, '')

  if (mono) {
    const fill = mono === 'white' ? '#FFFFFF' : '#171936'
    return (
      <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <path
          d="M13.5 34.2C10.8 30.3 13.6 25 18.4 25H34.8C37.4 25 39.8 26.3 41.3 28.4L63.5 60L41.3 91.6C39.8 93.7 37.4 95 34.8 95H18.4C13.6 95 10.8 89.7 13.5 85.8L32.2 60L13.5 34.2Z"
          fill={fill}
          fillOpacity="0.82"
        />
        <path
          d="M40.2 17.2C37.5 13.3 40.3 8 45.1 8H69.5C72.7 8 75.7 9.6 77.5 12.2L108.8 57H72.4C69.8 57 67.4 55.7 65.9 53.6L40.2 17.2Z"
          fill={fill}
        />
        <path
          d="M40.2 102.8C37.5 106.7 40.3 112 45.1 112H69.5C72.7 112 75.7 110.4 77.5 107.8L108.8 63H72.4C69.8 63 67.4 64.3 65.9 66.4L40.2 102.8Z"
          fill={fill}
        />
      </svg>
    )
  }

  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`v-${uid}`} x1="42" y1="8" x2="112" y2="57" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C5DFA" />
          <stop offset="100%" stopColor="#6545E8" />
        </linearGradient>
        <linearGradient id={`l-${uid}`} x1="112" y1="63" x2="42" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B5F32A" />
          <stop offset="100%" stopColor="#8FD10B" />
        </linearGradient>
        <linearGradient id={`ct-${uid}`} x1="10" y1="26" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059DFF" />
          <stop offset="100%" stopColor="#08C9E8" />
        </linearGradient>
        <linearGradient id={`cb-${uid}`} x1="10" y1="94" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B8E6" />
          <stop offset="100%" stopColor="#1CE4F9" />
        </linearGradient>
      </defs>

      {/* Pieza 1: Chevron Cian (dividido en plano superior azul-cian e inferior cian luminoso) */}
      <path
        d="M13.5 34.2C10.8 30.3 13.6 25 18.4 25H34.8C37.4 25 39.8 26.3 41.3 28.4L63.5 60H32.2L13.5 34.2Z"
        fill={`url(#ct-${uid})`}
      />
      <path
        d="M13.5 85.8C10.8 89.7 13.6 95 18.4 95H34.8C37.4 95 39.8 93.7 41.3 91.6L63.5 60H32.2L13.5 85.8Z"
        fill={`url(#cb-${uid})`}
      />

      {/* Pieza 2: Diagonal Superior Derecha (Electric Violet) */}
      <path
        d="M40.2 17.2C37.5 13.3 40.3 8 45.1 8H69.5C72.7 8 75.7 9.6 77.5 12.2L108.8 57H72.4C69.8 57 67.4 55.7 65.9 53.6L40.2 17.2Z"
        fill={`url(#v-${uid})`}
      />

      {/* Pieza 3: Diagonal Inferior Derecha (Lime Green) */}
      <path
        d="M40.2 102.8C37.5 106.7 40.3 112 45.1 112H69.5C72.7 112 75.7 110.4 77.5 107.8L108.8 63H72.4C69.8 63 67.4 64.3 65.9 66.4L40.2 102.8Z"
        fill={`url(#l-${uid})`}
      />
    </svg>
  )
}

/**
 * Componente versátil del Logotipo CoreFlow (Horizontal, Vertical, Isotipo y Monocromático)
 */
export function CoreFlowLogo({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  showSlogan = false,
  mono = null,
  className = '',
}) {
  const sizes = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', slogan: 'text-[10px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', slogan: 'text-[11px]' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', slogan: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl', slogan: 'text-sm' },
  }
  const currentSize = sizes[size] || sizes.md

  const wordmarkColor = mono
    ? mono === 'white'
      ? 'text-white'
      : 'text-core-navy'
    : theme === 'dark'
    ? 'text-white'
    : 'text-core-navy'

  const sloganBaseColor = theme === 'dark' ? 'text-slate-300' : 'text-core-muted'
  const sloganAccentColor = mono
    ? wordmarkColor
    : theme === 'dark'
    ? 'text-core-lime'
    : 'text-core-violet'

  if (variant === 'isotipo') {
    return <CoreFlowIsotipo className={`${currentSize.icon} ${className}`} mono={mono} />
  }

  if (variant === 'vertical') {
    return (
      <div className={`inline-flex flex-col items-center text-center select-none ${className}`}>
        <CoreFlowIsotipo className={`${currentSize.icon} mb-2.5`} mono={mono} />
        <span className={`font-extrabold tracking-tight leading-none ${currentSize.text} ${wordmarkColor}`}>
          CoreFlow
        </span>
        {showSlogan && (
          <span className={`mt-1.5 font-medium tracking-wide ${currentSize.slogan} ${sloganBaseColor}`}>
            Organiza. Conecta. <strong className={`font-bold ${sloganAccentColor}`}>Evoluciona.</strong>
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <CoreFlowIsotipo className={`${currentSize.icon} shrink-0`} mono={mono} />
      <div className="flex flex-col justify-center">
        <span className={`font-extrabold tracking-tight leading-none ${currentSize.text} ${wordmarkColor}`}>
          CoreFlow
        </span>
        {showSlogan && (
          <span className={`mt-1 font-medium tracking-tight leading-none ${currentSize.slogan} ${sloganBaseColor}`}>
            Organiza. Conecta. <strong className={`font-bold ${sloganAccentColor}`}>Evoluciona.</strong>
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Formas diagonales dinámicas de identidad de marca (inspiradas en los fondos oficiales adjuntos)
 */
export function DiagonalBrandCanvas({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-core-navy ${className}`}>
      {/* Esquina Superior Izquierda: Barras Diagonales Electric Violet / Royal Blue */}
      <svg
        className="pointer-events-none absolute -top-6 -left-6 w-72 h-72 opacity-95"
        viewBox="0 0 300 300"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bg-tl-1" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6545E8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3568E8" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="bg-tl-2" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8062FF" />
            <stop offset="100%" stopColor="#6545E8" />
          </linearGradient>
        </defs>
        <path
          d="M-40 190 L165 -30 L235 -30 L20 205 C8 218 -10 222 -25 215 Z"
          fill="url(#bg-tl-1)"
        />
        <path
          d="M-40 115 L95 -30 L165 -30 L15 130 C2 144 -18 145 -32 132 Z"
          fill="url(#bg-tl-2)"
        />
      </svg>

      {/* Esquina Inferior Derecha: Barras Diagonales Royal Blue, Cyan y Lime Green */}
      <svg
        className="pointer-events-none absolute -bottom-6 -right-6 w-80 h-80 opacity-95"
        viewBox="0 0 320 320"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bg-br-blue" x1="80" y1="320" x2="320" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1B4FD8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3568E8" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="bg-br-cyan" x1="120" y1="320" x2="320" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#08C9E8" />
            <stop offset="100%" stopColor="#3568E8" />
          </linearGradient>
          <linearGradient id="bg-br-lime" x1="190" y1="320" x2="320" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A6E91C" />
            <stop offset="100%" stopColor="#7AC10A" />
          </linearGradient>
        </defs>
        <path
          d="M95 340 L250 175 C262 162 282 160 296 172 L340 210 L215 340 Z"
          fill="url(#bg-br-blue)"
        />
        <path
          d="M150 340 L300 178 C312 165 332 164 345 176 L360 195 L230 340 Z"
          fill="url(#bg-br-cyan)"
        />
        <path
          d="M215 340 L325 220 L365 255 L290 340 Z"
          fill="url(#bg-br-lime)"
        />
      </svg>

      <div className="relative z-10">{children}</div>
    </div>
  )
}
