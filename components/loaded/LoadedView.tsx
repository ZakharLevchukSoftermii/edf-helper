'use client'

import type { ParsedEdf, ActiveTab, CutRangeUI, DayOption } from '@/types/edf'
import InfoTab from './InfoTab'
import CutTab from './CutTab'

interface Props {
  parsed: ParsedEdf
  activeTab: ActiveTab
  cut: CutRangeUI
  downloading: boolean
  downloaded: boolean
  dayOptions: DayOption[]
  startHint: string
  endHint: string
  renamedLabels: Record<number, string>
  onTabChange: (tab: ActiveTab) => void
  onCutChange: (update: Partial<CutRangeUI>) => void
  onStartDayChange: (day: number) => void
  onEndDayChange: (day: number) => void
  onCommitStart: () => void
  onCommitEnd: () => void
  onDrag: (which: 'start' | 'end', sec: number) => void
  onDownload: () => void
  onDownloadWithRenames: () => void
  onLabelChange: (idx: number, val: string) => void
}

const tabBase: React.CSSProperties = {
  fontFamily: "'IBM Plex Sans',sans-serif",
  fontSize: 14, fontWeight: 600,
  padding: '11px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
  borderBottom: '2px solid transparent', marginBottom: -1,
}
const tabActive: React.CSSProperties = { ...tabBase, color: '#2b6cf0', borderBottomColor: '#2b6cf0' }
const tabIdle: React.CSSProperties = { ...tabBase, color: '#8b94a3' }

export default function LoadedView({
  parsed, activeTab, cut, downloading, downloaded,
  dayOptions, startHint, endHint, renamedLabels,
  onTabChange, onCutChange, onStartDayChange, onEndDayChange,
  onCommitStart, onCommitEnd, onDrag, onDownload, onDownloadWithRenames, onLabelChange,
}: Props) {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 24px 80px', animation: 'edffade .35s ease both' }}>
      {/* file header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', wordBreak: 'break-all' }}>{parsed.fileName}</div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: '#2b6cf0', background: '#eaf1fe', borderRadius: 6, padding: '4px 9px', letterSpacing: '0.03em' }}>{parsed.format}</div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, color: '#9aa3b2' }}>{parsed.sizeStr}</div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e3e6eb', marginBottom: 26 }}>
        <button onClick={() => onTabChange('info')} style={activeTab === 'info' ? tabActive : tabIdle}>Info</button>
        <button onClick={() => onTabChange('cut')} style={activeTab === 'cut' ? tabActive : tabIdle}>Cut</button>
      </div>

      {activeTab === 'info' && (
        <InfoTab parsed={parsed} renamedLabels={renamedLabels} onLabelChange={onLabelChange} />
      )}

      {activeTab === 'cut' && (
        <CutTab
          parsed={parsed}
          cut={cut}
          downloading={downloading}
          downloaded={downloaded}
          dayOptions={dayOptions}
          startHint={startHint}
          endHint={endHint}
          onCutChange={onCutChange}
          onStartDayChange={onStartDayChange}
          onEndDayChange={onEndDayChange}
          onCommitStart={onCommitStart}
          onCommitEnd={onCommitEnd}
          onDrag={onDrag}
          onDownload={onDownload}
          onDownloadWithRenames={onDownloadWithRenames}
        />
      )}
    </div>
  )
}
