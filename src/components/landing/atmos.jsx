// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useEffect, useRef } from 'react'
import { clamp, useReducedMotion } from './hooks'

/** Capa de atmósfera: malla de gradientes de la paleta, puntos o retícula y grano fino. Decorativa. */
export function Atmos({ mesh = 'hero', dots = true, grid = false, grain = true, fade = false, className = '' }) {
  return (
    <div aria-hidden="true" className={`lf-atmos ${fade ? 'lf-fade-b' : ''} ${className}`}>
      <div className={`absolute inset-0 lf-mesh-${mesh}`} />
      {grid && <div className="lf-grid absolute inset-0" />}
      {dots && <div className="lf-dots absolute inset-0" />}
      {grain && <div className="lf-grain absolute inset-0" />}
    </div>
  )
}

/**
 * Teselado de triángulos de marca (extiende el patrón del login). Decorativo.
 * tone: cyan | violet | lime | blue | white | mix. size: base | lg | xl.
 * mask: tr | tl | br | bl | r | l | t | b | x (el lado donde se ve; se desvanece hacia el texto).
 */
export function Tri({ tone = 'mix', size = 'base', mask = 'tr', className = '' }) {
  const sz = size === 'base' ? '' : `lf-tri-${size}`
  return <div aria-hidden="true" className={`lf-tri lf-tri-${tone} ${sz} lf-tri-m-${mask} ${className}`} />
}

/** Fila de triángulos de marca para separar secciones en diagonal. */
export function TriEdge({ at = 'bottom' }) {
  return <div aria-hidden="true" className={`lf-tri-edge lf-tri-edge-${at}`} />
}

/** Marca el elemento con `lf-live` solo mientras está en pantalla (las animaciones infinitas lo respetan). */
export function useLiveClass(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([entry]) => el.classList.toggle('lf-live', entry.isIntersecting), {
      rootMargin: '5% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
}

/**
 * Contenedor de parallax: expone --px/--py (cursor, -1..1) y --sy (scroll, -1..1).
 * Solo escucha mientras está visible; con movimiento reducido no escucha nada.
 */
export function Parallax({ className = '', children, ...rest }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  useLiveClass(ref)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return undefined
    let rafMove = 0
    let rafScroll = 0
    let listening = false
    let pointer = null
    let nodes = []
    let px = 0
    let py = 0
    let sy = 0
    // Se escribe el transform en cada capa .lf-px: cambiar variables heredadas en el contenedor recalcula el estilo de todo el subárbol
    const paint = () => {
      nodes.forEach((n) => {
        const d = Number(n.dataset.d || 0)
        const s = Number(n.dataset.s || 0)
        n.style.transform = `translate3d(${(px * d).toFixed(1)}px, ${(py * d + sy * s).toFixed(1)}px, 0)`
      })
    }

    const applyPointer = () => {
      rafMove = 0
      if (!pointer) return
      const r = el.getBoundingClientRect()
      px = clamp(((pointer.x - r.left) / r.width) * 2 - 1, -1, 1)
      py = clamp(((pointer.y - r.top) / r.height) * 2 - 1, -1, 1)
      paint()
    }
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      pointer = { x: e.clientX, y: e.clientY }
      if (!rafMove) rafMove = requestAnimationFrame(applyPointer)
    }
    const onLeave = () => {
      pointer = null
      px = 0
      py = 0
      paint()
    }
    const computeScroll = () => {
      rafScroll = 0
      const r = el.getBoundingClientRect()
      const k = (r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight / 2 + r.height / 2)
      sy = clamp(k, -1, 1)
      paint()
    }
    const onScroll = () => {
      if (!rafScroll) rafScroll = requestAnimationFrame(computeScroll)
    }
    const attach = () => {
      if (listening) return
      listening = true
      nodes = Array.from(el.querySelectorAll('.lf-px'))
      window.addEventListener('scroll', onScroll, { passive: true })
      el.addEventListener('pointermove', onMove, { passive: true })
      el.addEventListener('pointerleave', onLeave)
      onScroll()
    }
    const detach = () => {
      if (!listening) return
      listening = false
      window.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? attach() : detach()), { rootMargin: '10% 0px' })
    io.observe(el)
    return () => {
      io.disconnect()
      detach()
      cancelAnimationFrame(rafMove)
      cancelAnimationFrame(rafScroll)
    }
  }, [reduced])

  return (
    <div ref={ref} className={`lf-parallax ${className}`} {...rest}>
      {children}
    </div>
  )
}

/** Capa con profundidad: `d` px de desplazamiento con el cursor, `s` px con el scroll; flota con retardo `bob`. */
export function Depth({ d = 10, s = 0, bob = 0, className = '', children }) {
  return (
    <div className={`lf-px ${className}`} data-d={d} data-s={s}>
      <div className={bob ? 'lf-bob' : ''} style={bob ? { '--lf-d': `${bob}ms` } : undefined}>
        {children}
      </div>
    </div>
  )
}
