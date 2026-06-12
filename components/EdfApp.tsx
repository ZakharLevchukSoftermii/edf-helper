'use client'

import { useState, useRef } from 'react'
import { parseEdf, cutEdf, fmtDuration, fmtSize, dayOfOffset, numDays, offsetFromDayTime } from '@/lib/edf-core.js'
import type { Phase, ActiveTab, ParsedEdf, CutRangeUI } from '@/types/edf'
import UploadScreen from './screens/UploadScreen'
import LoadingScreen from './screens/LoadingScreen'
import ErrorScreen from './screens/ErrorScreen'
import LoadedView from './loaded/LoadedView'

// ---- helpers ----------------------------------------------------------------

function parseTimeInput(str: string): number | null {
  str = (str || '').trim()
  if (str === '') return null
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str)
  const parts = str.split(/[:.]/).map((x) => parseFloat(x))
  if (parts.some((x) => isNaN(x))) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0]
}

function hms(sec: number) {
  sec = Math.max(0, Math.floor(sec))
  return { h: Math.floor(sec / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 }
}

function timeStrOfOffset(parsed: ParsedEdf, off: number): string {
  if (!parsed.startDate) return fmtDuration(off)
  const d = new Date(parsed.startDate.getTime() + off * 1000)
  const pad = (x: number) => String(x).padStart(2, '0')
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

function fmtYmd(d: Date): string {
  const pad = (x: number) => String(x).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function initRange(parsed: ParsedEdf): Omit<CutRangeUI, 'startSec' | 'endSec'> {
  if (!parsed.startDate) {
    return {
      startStr: fmtDuration(0),
      endStr: fmtDuration(parsed.totalSec),
      startDay: 1,
      endDay: 1,
    }
  }
  const s = parsed.startDate
  const tstr = (off: number) => {
    const d = new Date(s.getTime() + off * 1000)
    const pad = (x: number) => String(x).padStart(2, '0')
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }
  const fsMid = new Date(s.getFullYear(), s.getMonth(), s.getDate())
  const end = new Date(s.getTime() + parsed.totalSec * 1000)
  const endMid = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const endDay = Math.round((endMid.getTime() - fsMid.getTime()) / 86400000) + 1
  return { startStr: tstr(0), endStr: tstr(parsed.totalSec), startDay: 1, endDay }
}

// ---- component --------------------------------------------------------------

export default function EdfApp() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [activeTab, setActiveTab] = useState<ActiveTab>('info')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileSizeStr, setFileSizeStr] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [parsed, setParsed] = useState<ParsedEdf | null>(null)
  const [cut, setCut] = useState<CutRangeUI>({ startSec: 0, endSec: 0, startStr: '00:00:00', endStr: '00:00:00', startDay: 1, endDay: 1 })
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const bufferRef = useRef<ArrayBuffer | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---- file loading ---------------------------------------------------------

  async function loadFile(file: File) {
    setPhase('loading')
    setFileName(file.name)
    setFileSizeStr(fmtSize(file.size))
    setErrorMsg('')
    try {
      const [buf] = await Promise.all([
        file.arrayBuffer(),
        new Promise<void>((r) => setTimeout(r, 480)),
      ])
      const p = parseEdf(buf, file.name, file.size) as ParsedEdf
      bufferRef.current = buf
      const r = initRange(p)
      setCut({ startSec: 0, endSec: p.totalSec, ...r })
      setParsed(p)
      setActiveTab('info')
      setDownloaded(false)
      setDownloading(false)
      setPhase('loaded')
    } catch (err) {
      setPhase('error')
      setErrorMsg((err instanceof Error ? err.message : String(err)) || 'Unknown error.')
    }
  }

  function reset() {
    bufferRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
    setParsed(null)
    setErrorMsg('')
    setDragOver(false)
    setDownloaded(false)
    setPhase('upload')
  }

  // ---- drag / file input handlers ------------------------------------------

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) loadFile(f)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) loadFile(f)
  }

  function handlePickerClick() {
    fileInputRef.current?.click()
  }

  // ---- cut range helpers ---------------------------------------------------

  function clampStart(sec: number, endSec: number, total: number) {
    return Math.min(Math.max(0, sec), endSec, total)
  }

  function clampEnd(sec: number, startSec: number, total: number) {
    return Math.max(Math.min(sec, total), startSec, 0)
  }

  function dayOf(p: ParsedEdf, off: number): number {
    return p.startDate ? dayOfOffset(p, off) : 1
  }

  function applyDrag(which: 'start' | 'end', sec: number) {
    if (!parsed) return
    const total = parsed.totalSec
    if (which === 'start') {
      const v = Math.round(clampStart(sec, cut.endSec, total))
      setCut((prev) => ({
        ...prev,
        startSec: v,
        startStr: timeStrOfOffset(parsed, v),
        startDay: dayOf(parsed, v),
        downloaded: false,
      } as CutRangeUI))
    } else {
      const v = Math.round(clampEnd(sec, cut.startSec, total))
      setCut((prev) => ({
        ...prev,
        endSec: v,
        endStr: timeStrOfOffset(parsed, v),
        endDay: dayOf(parsed, v),
      } as CutRangeUI))
    }
    setDownloaded(false)
  }

  function commitField(which: 'start' | 'end', day: number) {
    if (!parsed) return
    const total = parsed.totalSec
    const txt = which === 'start' ? cut.startStr : cut.endStr
    const cur = which === 'start' ? cut.startSec : cut.endSec
    const t = parseTimeInput(txt)
    let v: number
    if (parsed.startDate) {
      if (t === null) {
        v = cur
      } else {
        const { h, m, s } = hms(t)
        v = offsetFromDayTime(parsed, day, h, m, s)
      }
    } else {
      v = t === null ? cur : t
    }
    if (which === 'start') {
      const clamped = Math.round(clampStart(v, cut.endSec, total))
      setCut((prev) => ({
        ...prev,
        startSec: clamped,
        startStr: timeStrOfOffset(parsed, clamped),
        startDay: dayOf(parsed, clamped),
      }))
    } else {
      const clamped = Math.round(clampEnd(v, cut.startSec, total))
      setCut((prev) => ({
        ...prev,
        endSec: clamped,
        endStr: timeStrOfOffset(parsed, clamped),
        endDay: dayOf(parsed, clamped),
      }))
    }
    setDownloaded(false)
  }

  function handleCutChange(update: Partial<CutRangeUI>) {
    setCut((prev) => ({ ...prev, ...update }))
  }

  // ---- download ------------------------------------------------------------

  function doDownload() {
    if (!parsed || !bufferRef.current) return
    const recDur = parsed.recDuration > 0 ? parsed.recDuration : 1
    const nRec = Math.floor(cut.endSec / recDur) - Math.floor(cut.startSec / recDur)
    if (nRec <= 0) return
    setDownloading(true)
    setDownloaded(false)
    setTimeout(() => {
      try {
        const { bytes, suggestedName } = cutEdf(bufferRef.current!, parsed, cut.startSec, cut.endSec)
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }))
        const a = document.createElement('a')
        a.href = url
        a.download = suggestedName
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        setDownloading(false)
        setDownloaded(true)
      } catch (err) {
        setDownloading(false)
        setErrorMsg((err instanceof Error ? err.message : String(err)) || 'Download failed.')
      }
    }, 30)
  }

  // ---- build day options ---------------------------------------------------

  function buildDayOptions(p: ParsedEdf) {
    if (!p.startDate) return []
    const n = numDays(p)
    const s = p.startDate
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i)
      return { value: String(i + 1), label: 'Day ' + (i + 1) + ' · ' + fmtYmd(d) }
    })
  }

  // ---- hints ---------------------------------------------------------------

  function buildHint(p: ParsedEdf, sec: number): string {
    if (!p.startDate) {
      const g = (x: number) => Number(x.toPrecision(6)).toString()
      return 'HH:MM:SS · ' + g(sec) + ' s'
    }
    const d = new Date(p.startDate.getTime() + sec * 1000)
    const pad = (x: number) => String(x).padStart(2, '0')
    return '→ ' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }

  // ---- render --------------------------------------------------------------

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f7', fontFamily: "'IBM Plex Sans',system-ui,sans-serif", color: '#1c2430', WebkitFontSmoothing: 'antialiased' }}>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 28px', borderBottom: '1px solid #e3e6eb', background: '#ffffff', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ width: 22, height: 22, background: '#2b6cf0', borderRadius: 5, transform: 'rotate(45deg)', boxShadow: 'inset 0 0 0 4px #ffffff' }} />
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>EDF Helper</div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#9aa3b2', letterSpacing: '0.04em', textTransform: 'uppercase' }}>European Data Format · in-browser</div>
        <div style={{ flex: 1 }} />
        {phase === 'loaded' && (
          <button onClick={reset} style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, fontWeight: 500, color: '#677082', background: '#f3f4f7', border: '1px solid #e3e6eb', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
            Load another file
          </button>
        )}
      </div>

      {phase === 'upload' && (
        <UploadScreen
          dragOver={dragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          onPickerClick={handlePickerClick}
          fileInputRef={fileInputRef}
        />
      )}

      {phase === 'loading' && (
        <LoadingScreen fileName={fileName} fileSizeStr={fileSizeStr} />
      )}

      {phase === 'error' && (
        <ErrorScreen message={errorMsg} onReset={reset} />
      )}

      {phase === 'loaded' && parsed && (
        <LoadedView
          parsed={parsed}
          activeTab={activeTab}
          cut={cut}
          downloading={downloading}
          downloaded={downloaded}
          dayOptions={buildDayOptions(parsed)}
          startHint={buildHint(parsed, cut.startSec)}
          endHint={buildHint(parsed, cut.endSec)}
          onTabChange={setActiveTab}
          onCutChange={handleCutChange}
          onStartDayChange={(day) => commitField('start', day)}
          onEndDayChange={(day) => commitField('end', day)}
          onCommitStart={() => commitField('start', cut.startDay)}
          onCommitEnd={() => commitField('end', cut.endDay)}
          onDrag={applyDrag}
          onDownload={doDownload}
        />
      )}
    </div>
  )
}
