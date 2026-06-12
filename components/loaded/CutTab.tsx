'use client'

import { fmtDuration, fmtSize } from '@/lib/edf-core.js'
import type { ParsedEdf, CutRangeUI, DayOption } from '@/types/edf'
import Timeline from './Timeline'
import CutInputs from './CutInputs'
import OutputSummary from './OutputSummary'
import DownloadButton from './DownloadButton'

interface Props {
  parsed: ParsedEdf
  cut: CutRangeUI
  downloading: boolean
  downloaded: boolean
  dayOptions: DayOption[]
  startHint: string
  endHint: string
  onCutChange: (update: Partial<CutRangeUI>) => void
  onStartDayChange: (day: number) => void
  onEndDayChange: (day: number) => void
  onCommitStart: () => void
  onCommitEnd: () => void
  onDrag: (which: 'start' | 'end', sec: number) => void
  onDownload: () => void
}

function gfmt(x: number): string {
  if (!isFinite(x)) return String(x)
  return Number(x.toPrecision(6)).toString()
}

function buildOutFileName(parsed: ParsedEdf, startSec: number): string {
  const recDur = parsed.recDuration > 0 ? parsed.recDuration : 1
  const startRecord = Math.floor(startSec / recDur)
  const base = parsed.fileName.replace(/\.(edf\+?|bdf|rec)$/i, '')
  if (!parsed.startDate) return base + '_cut.edf'
  const d = new Date(parsed.startDate.getTime() + startRecord * recDur * 1000)
  const pad = (x: number) => String(x).padStart(2, '0')
  const tag = pad(d.getDate()) + pad(d.getMonth() + 1) + String(d.getFullYear() % 100).padStart(2, '0') + '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
  return base + '_cut_' + tag + '.edf'
}

export default function CutTab({
  parsed, cut, downloading, downloaded,
  dayOptions, startHint, endHint,
  onCutChange, onStartDayChange, onEndDayChange,
  onCommitStart, onCommitEnd, onDrag, onDownload,
}: Props) {
  const recDur = parsed.recDuration > 0 ? parsed.recDuration : 1
  const startRecord = Math.floor(cut.startSec / recDur)
  const endRecord = Math.floor(cut.endSec / recDur)
  const nRec = endRecord - startRecord
  const outBytes = parsed.headerBytes + Math.max(0, nRec) * parsed.bytesPerRecord
  const canCut = nRec > 0
  const hasClock = !!parsed.startDate

  return (
    <div style={{ background: '#fff', border: '1px solid #e3e6eb', borderRadius: 14, padding: 28, maxWidth: 760 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#677082', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>
        Select a time range to cut
      </div>
      <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 26 }}>
        Recording is{' '}
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: '#1c2430' }}>
          {fmtDuration(parsed.totalSec)}
        </span>{' '}
        long. Drag the handles or type exact times below.
      </div>

      <Timeline
        totalSec={parsed.totalSec}
        startSec={cut.startSec}
        endSec={cut.endSec}
        durationStr={fmtDuration(parsed.totalSec)}
        onDrag={onDrag}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 24 }}>
        <CutInputs
          label="Start"
          hasClock={hasClock}
          dayOptions={dayOptions}
          day={cut.startDay}
          timeStr={cut.startStr}
          hint={startHint}
          onDayChange={onStartDayChange}
          onTimeStrChange={(str) => onCutChange({ startStr: str })}
          onCommit={onCommitStart}
        />
        <CutInputs
          label="End"
          hasClock={hasClock}
          dayOptions={dayOptions}
          day={cut.endDay}
          timeStr={cut.endStr}
          hint={endHint}
          onDayChange={onEndDayChange}
          onTimeStrChange={(str) => onCutChange({ endStr: str })}
          onCommit={onCommitEnd}
        />
      </div>

      <OutputSummary
        durationStr={fmtDuration(cut.endSec - cut.startSec)}
        nRecords={nRec}
        sizeStr={fmtSize(outBytes)}
      />

      {!canCut && (
        <div style={{ fontSize: 13, color: '#d1453b', marginTop: 16 }}>
          End time must be after start time.
        </div>
      )}

      <DownloadButton
        disabled={!canCut || downloading}
        downloading={downloading}
        downloaded={downloaded}
        outFileName={buildOutFileName(parsed, cut.startSec)}
        onDownload={onDownload}
      />
    </div>
  )
}
