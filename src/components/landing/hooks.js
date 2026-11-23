// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import { useEffect, useRef, useState } from 'react'

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

/** Devuelve [ref, visible]. Con `once` se queda en true tras la primera entrada. */
export function useInView({ threshold = 0.2, once = false, rootMargin = '0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) setInView(false)
      },
      { threshold, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once, rootMargin])
  return [ref, inView]
}

export function usePageVisible() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visible
}

/**
 * Progreso 0→1 de un contenedor "pin" (sticky top 80 px). Escucha scroll solo mientras
 * el contenedor está cerca de la pantalla y agrupa las lecturas en un rAF.
 */
export function useScrollProgress(ref, onProgress, enabled) {
  const cb = useRef(onProgress)
  cb.current = onProgress
  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return undefined
    let raf = 0
    let listening = false
    const compute = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const range = Math.max(1, r.height - window.innerHeight + 80)
      cb.current(clamp((80 - r.top) / range))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute)
    }
    const attach = () => {
      if (listening) return
      listening = true
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll, { passive: true })
      onScroll()
    }
    const detach = () => {
      if (!listening) return
      listening = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? attach() : detach()), {
      rootMargin: '15% 0px',
    })
    io.observe(el)
    return () => {
      io.disconnect()
      detach()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, enabled])
}

/** Conteo animado; al cambiar `target` parte del valor mostrado en ese momento. */
export function useCountUp(target, { active = true, duration = 900, from = 0 } = {}) {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(reduced && active ? target : from)
  const current = useRef(value)
  useEffect(() => {
    if (!active) {
      current.current = from
      setValue(from)
      return undefined
    }
    if (reduced) {
      current.current = target
      setValue(target)
      return undefined
    }
    const start = current.current
    const t0 = performance.now()
    let raf = 0
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration)
      const next = start + (target - start) * (1 - Math.pow(1 - k, 3))
      current.current = next
      setValue(next)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration, from, reduced])
  return value
}
