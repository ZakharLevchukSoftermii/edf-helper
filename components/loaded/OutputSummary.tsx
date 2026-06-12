'use client'

interface Props {
  durationStr: string
  nRecords: number
  sizeStr: string
}

export default function OutputSummary({ durationStr, nRecords, sizeStr }: Props) {
  const items = [
    { label: 'Output length', value: durationStr },
    { label: 'Records', value: nRecords > 0 ? nRecords.toLocaleString() : '0' },
    { label: 'Est. file size', value: sizeStr },
  ]
  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', background: '#f8f9fb', border: '1px solid #eef0f3', borderRadius: 11, padding: '16px 20px', marginTop: 24 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ fontSize: 11, color: '#9aa3b2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, fontWeight: 600 }}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}
