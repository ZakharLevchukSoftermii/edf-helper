'use client'

import { useState } from 'react'
import type { DayOption } from '@/types/edf'

interface Props {
  label: string
  hasClock: boolean
  dayOptions: DayOption[]
  day: number
  timeStr: string
  hint: string
  onDayChange: (day: number) => void
  onTimeStrChange: (str: string) => void
  onCommit: () => void
}

export default function CutInputs({ label, hasClock, dayOptions, day, timeStr, hint, onDayChange, onTimeStrChange, onCommit }: Props) {
  const [focused, setFocused] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, color: '#1c2430',
    background: '#fff',
    border: '1px solid ' + (focused ? '#2b6cf0' : '#d3d8df'),
    borderRadius: 9, padding: '11px 13px', outline: 'none',
    boxShadow: focused ? '0 0 0 3px #eaf1fe' : 'none',
    transition: 'border-color .15s ease, box-shadow .15s ease',
  }

  const selectStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 13.5, color: '#1c2430',
    background: '#fff', border: '1px solid #d3d8df', borderRadius: 9,
    padding: '11px 10px', outline: 'none', cursor: 'pointer', width: '100%',
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#677082', marginBottom: 7 }}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hasClock && (
          <select
            value={String(day)}
            onChange={(e) => onDayChange(parseInt(e.target.value, 10))}
            style={selectStyle}
          >
            {dayOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        <input
          value={timeStr}
          onChange={(e) => onTimeStrChange(e.target.value)}
          onBlur={() => { setFocused(false); onCommit() }}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
          style={inputStyle}
        />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#9aa3b2', marginTop: 6 }}>{hint}</div>
    </div>
  )
}
