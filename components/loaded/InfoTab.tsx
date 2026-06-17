'use client'

import type { ParsedEdf, SummaryRow } from '@/types/edf'
import FileSummaryCard from './FileSummaryCard'
import SignalsTable from './SignalsTable'

function gfmt(x: number): string {
  if (!isFinite(x)) return String(x)
  return Number(x.toPrecision(6)).toString()
}

function buildSummaryRows(p: ParsedEdf): SummaryRow[] {
  return [
    { label: 'File', value: p.fileName },
    { label: 'Size', value: p.sizeStr },
    { label: 'Format', value: p.format },
    { label: 'Version', value: p.version || '—' },
    { label: 'Patient ID', value: p.patientId || '—' },
    { label: 'Recording', value: p.recording || '—' },
    { label: 'Start', value: p.startStr },
    { label: 'End', value: p.endStr },
    { label: 'Total Duration', value: p.durationStr },
    { label: 'Records', value: String(p.nRecords) },
    { label: 'Record Duration', value: gfmt(p.recDuration) + ' s' },
    { label: 'Signals', value: String(p.ns) },
  ]
}

interface Props {
  parsed: ParsedEdf
  renamedLabels: Record<number, string>
  onLabelChange: (idx: number, val: string) => void
}

export default function InfoTab({ parsed, renamedLabels, onLabelChange }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
      <FileSummaryCard rows={buildSummaryRows(parsed)} />
      <SignalsTable signals={parsed.signals} ns={parsed.ns} renamedLabels={renamedLabels} onLabelChange={onLabelChange} />
    </div>
  )
}
