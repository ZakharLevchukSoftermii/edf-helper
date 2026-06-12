'use client'

import type { SummaryRow } from '@/types/edf'

interface Props {
  rows: SummaryRow[]
}

export default function FileSummaryCard({ rows }: Props) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e3e6eb', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0f3', fontSize: 13, fontWeight: 600, color: '#677082', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        File summary
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', gap: 14, padding: '11px 20px', borderBottom: '1px solid #f4f5f7', alignItems: 'baseline' }}>
            <div style={{ fontSize: 12.5, color: '#8b94a3', minWidth: 118, fontWeight: 500 }}>{row.label}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: '#1c2430', wordBreak: 'break-word' }}>{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
