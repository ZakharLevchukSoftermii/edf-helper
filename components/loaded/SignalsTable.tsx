'use client'

import type { EdfSignal } from '@/types/edf'

function gfmt(x: number): string {
  if (!isFinite(x)) return String(x)
  return Number(x.toPrecision(6)).toString()
}

const TH_STYLE: React.CSSProperties = {
  padding: '10px 14px', fontWeight: 600, fontSize: 11.5,
  textTransform: 'uppercase', letterSpacing: '0.03em',
  borderBottom: '1px solid #eef0f3', color: '#8b94a3',
}

interface Props {
  signals: EdfSignal[]
  ns: number
  renamedLabels: Record<number, string>
  onLabelChange: (idx: number, val: string) => void
}

export default function SignalsTable({ signals, ns, renamedLabels, onLabelChange }: Props) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e3e6eb', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0f3', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#677082', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Signals</span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#2b6cf0', background: '#eaf1fe', borderRadius: 5, padding: '2px 7px' }}>{ns}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 920, fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>#</th>
              <th style={TH_STYLE}>Label</th>
              <th style={TH_STYLE}>New label</th>
              <th style={TH_STYLE}>Unit</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Phys Min</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Phys Max</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Dig Min</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Dig Max</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Rate (Hz)</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Samp/Rec</th>
              <th style={TH_STYLE}>Transducer</th>
              <th style={TH_STYLE}>Prefilter</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((sig) => {
              const muted = sig.isAnnotation
              const rowColor = muted ? '#aab2bf' : '#2a3340'
              const TD: React.CSSProperties = { padding: '9px 14px', borderBottom: '1px solid #f4f5f7', color: rowColor }
              const MONO: React.CSSProperties = { ...TD, fontFamily: "'IBM Plex Mono',monospace" }
              const zeroIdx = sig.index - 1
              return (
                <tr key={sig.index}>
                  <td style={{ ...MONO, textAlign: 'right', color: muted ? '#aab2bf' : '#b3bac6' }}>{sig.index}</td>
                  <td style={{ ...MONO, fontWeight: 600, whiteSpace: 'nowrap' }}>{sig.label || '—'}</td>
                  <td style={{ ...TD, minWidth: 140 }}>
                    {muted ? (
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#b3bac6' }}>—</span>
                    ) : (
                      <input
                        value={renamedLabels[zeroIdx] ?? ''}
                        onChange={(e) => onLabelChange(zeroIdx, e.target.value)}
                        placeholder={sig.label || ''}
                        style={{
                          width: '100%', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13,
                          color: '#1c2430', background: '#fff', border: '1px solid #d3d8df',
                          borderRadius: 6, padding: '6px 9px', outline: 'none',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2b6cf0'; e.target.style.boxShadow = '0 0 0 2px #eaf1fe' }}
                        onBlur={(e) => { e.target.style.borderColor = '#d3d8df'; e.target.style.boxShadow = 'none' }}
                      />
                    )}
                  </td>
                  <td style={MONO}>{sig.unit || '—'}</td>
                  <td style={{ ...MONO, textAlign: 'right' }}>{sig.physMin || '—'}</td>
                  <td style={{ ...MONO, textAlign: 'right' }}>{sig.physMax || '—'}</td>
                  <td style={{ ...MONO, textAlign: 'right' }}>{sig.digMin || '—'}</td>
                  <td style={{ ...MONO, textAlign: 'right' }}>{sig.digMax || '—'}</td>
                  <td style={{ ...MONO, textAlign: 'right' }}>{sig.rateHz === null ? '—' : gfmt(sig.rateHz)}</td>
                  <td style={{ ...MONO, textAlign: 'right' }}>{sig.samplesPerRecord}</td>
                  <td style={{ ...MONO, color: muted ? '#aab2bf' : '#8b94a3', fontSize: 12 }}>{sig.transducer || '—'}</td>
                  <td style={{ ...MONO, color: muted ? '#aab2bf' : '#8b94a3', fontSize: 12 }}>{sig.prefilter || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
