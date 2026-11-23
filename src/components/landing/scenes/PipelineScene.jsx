// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TriangleMark } from '../../brand/BrandShapes'
import { SceneWindow, fmtCop } from '../ui'

const COLS = [
  { name: 'Nuevo', accent: 'cyan' },
  { name: 'Contacto', accent: 'cyan' },
  { name: 'Propuesta', accent: 'violet' },
  { name: 'Cierre', accent: 'lime' },
]

const INITIAL = [
  { id: 'a', name: 'Distribuidora Andina', amount: 4200000, col: 0 },
  { id: 'b', name: 'Café Tairona', amount: 1950000, col: 0 },
  { id: 'c', name: 'Textiles Sur', amount: 2800000, col: 1 },
  { id: 'd', name: 'Ferretería El Puerto', amount: 3100000, col: 2 },
  { id: 'e', name: 'Clínica Bahía', amount: 5400000, col: 2 },
  { id: 'f', name: 'Logística Caribe', amount: 2250000, col: 3 },
]

const MOVE_BTN =
  'flex h-8 w-8 items-center justify-center rounded-md border border-core-border bg-white text-core-navy hover:border-core-violet disabled:opacity-30 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-core-violet'

export function PipelineScene() {
  const [cards, setCards] = useState(INITIAL)
  const [drag, setDrag] = useState(null)
  const [note, setNote] = useState('')
  const start = useRef(null)

  const move = (id, col) => {
    setCards((prev) => {
      const card = prev.find((c) => c.id === id)
      if (!card || card.col === col) return prev
      setNote(`${card.name} pasó a ${COLS[col].name}.`)
      return prev.map((c) => (c.id === id ? { ...c, col } : c))
    })
  }

  const onDown = (e, id) => {
    if (e.pointerType === 'touch' || e.button !== 0 || e.target.closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    setDrag({ id, dx: 0, dy: 0 })
  }
  const onMove = (e) => {
    if (!start.current) return
    setDrag((d) => d && { ...d, dx: e.clientX - start.current.x, dy: e.clientY - start.current.y })
  }
  const onUp = (e) => {
    if (!start.current) return
    start.current = null
    const target = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find((el) => el.dataset && el.dataset.col !== undefined)
    if (target && drag) move(drag.id, Number(target.dataset.col))
    setDrag(null)
  }
  const onCancel = () => {
    start.current = null
    setDrag(null)
  }

  return (
    <div role="group" aria-label="Pipeline comercial de ejemplo. Arrastra las tarjetas o usa los botones para moverlas.">
      <SceneWindow title="Pipeline comercial" bodyClassName="p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COLS.map((col, ci) => {
            const items = cards.filter((c) => c.col === ci)
            const total = items.reduce((s, c) => s + c.amount, 0)
            return (
              <div key={col.name} data-col={ci} className="min-h-[150px] min-w-0 rounded-xl bg-core-cloud p-2">
                <div className="flex items-center gap-1.5 px-1">
                  <TriangleMark accent={col.accent} />
                  <h4 className="text-[13px] font-semibold text-core-navy">{col.name}</h4>
                  <span className="ml-auto text-xs tabular-nums text-core-body">{items.length}</span>
                </div>
                <p className="px-1 text-[13px] font-bold tabular-nums text-core-navy">{fmtCop(total)}</p>
                <ul className="mt-2 space-y-2">
                  {items.map((card) => {
                    const dragging = drag?.id === card.id
                    return (
                      <li
                        key={card.id}
                        onPointerDown={(e) => onDown(e, card.id)}
                        onPointerMove={onMove}
                        onPointerUp={onUp}
                        onPointerCancel={onCancel}
                        style={
                          dragging
                            ? { transform: `translate(${drag.dx}px, ${drag.dy - 4}px) rotate(1.5deg)`, zIndex: 20, position: 'relative' }
                            : undefined
                        }
                        className={`lf-card-drag select-none rounded-lg border bg-white p-2 ${
                          dragging
                            ? 'cursor-grabbing border-core-violet shadow-card-hover'
                            : 'cursor-grab border-core-border transition-shadow hover:shadow-card-hover'
                        }`}
                      >
                        <p className="truncate text-[13px] font-semibold text-core-navy">{card.name}</p>
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <span className="text-xs tabular-nums text-core-body">{fmtCop(card.amount)}</span>
                          <span className="flex gap-1">
                            <button
                              type="button"
                              disabled={ci === 0}
                              onClick={() => move(card.id, ci - 1)}
                              aria-label={`Mover ${card.name} a ${COLS[Math.max(0, ci - 1)].name}`}
                              className={MOVE_BTN}
                            >
                              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              disabled={ci === COLS.length - 1}
                              onClick={() => move(card.id, ci + 1)}
                              aria-label={`Mover ${card.name} a ${COLS[Math.min(COLS.length - 1, ci + 1)].name}`}
                              className={MOVE_BTN}
                            >
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
        <p role="status" className="sr-only">
          {note}
        </p>
      </SceneWindow>
    </div>
  )
}
