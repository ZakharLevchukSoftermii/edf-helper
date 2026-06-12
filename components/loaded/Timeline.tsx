'use client'

import { useRef } from 'react'

interface Props {
  totalSec: number
  startSec: number
  endSec: number
  durationStr: string
  onDrag: (which: 'start' | 'end', sec: number) => void
}

export default function Timeline({ totalSec, startSec, endSec, durationStr, onDrag }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  const total = totalSec || 1
  const sPct = Math.min(100, Math.max(0, (startSec / total) * 100))
  const ePct = Math.min(100, Math.max(0, (endSec / total) * 100))

  function secFromPointer(clientX: number): number {
    const el = trackRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return Math.round(frac * totalSec)
  }

  function beginDrag(which: 'start' | 'end') {
    function onMove(ev: PointerEvent) {
      onDrag(which, secFromPointer(ev.clientX))
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function handleTrackDown(e: React.PointerEvent) {
    const sec = secFromPointer(e.clientX)
    const which = Math.abs(sec - startSec) <= Math.abs(sec - endSec) ? 'start' : 'end'
    onDrag(which, sec)
    beginDrag(which)
  }

  function handleStartHandleDown(e: React.PointerEvent) {
    e.stopPropagation()
    beginDrag('start')
  }

  function handleEndHandleDown(e: React.PointerEvent) {
    e.stopPropagation()
    beginDrag('end')
  }

  const handleBase: React.CSSProperties = {
    position: 'absolute', top: -4, width: 14, height: 62, marginLeft: -7,
    background: '#2b6cf0', borderRadius: 5, cursor: 'ew-resize', touchAction: 'none',
    boxShadow: '0 1px 4px rgba(43,108,240,0.4)', border: '2px solid #fff', zIndex: 2,
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        ref={trackRef}
        onPointerDown={handleTrackDown}
        style={{ position: 'relative', height: 54, background: '#f3f4f7', border: '1px solid #e3e6eb', borderRadius: 10, cursor: 'pointer', userSelect: 'none', touchAction: 'none' }}
      >
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: sPct + '%', width: (ePct - sPct) + '%',
          background: 'rgba(43,108,240,0.14)',
          borderLeft: '1px solid #2b6cf0', borderRight: '1px solid #2b6cf0',
        }} />
        <div onPointerDown={handleStartHandleDown} style={{ ...handleBase, left: sPct + '%' }} />
        <div onPointerDown={handleEndHandleDown} style={{ ...handleBase, left: ePct + '%' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#9aa3b2', marginTop: 7 }}>
        <span>00:00:00</span>
        <span>{durationStr}</span>
      </div>
    </div>
  )
}
