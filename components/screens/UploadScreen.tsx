'use client'

import { RefObject } from 'react'

interface Props {
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPickerClick: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
}

export default function UploadScreen({ dragOver, onDragOver, onDragLeave, onDrop, onFileChange, onPickerClick, fileInputRef }: Props) {
  const dropZoneStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '52px 24px', borderRadius: 16, cursor: 'pointer',
    background: dragOver ? '#eaf1fe' : '#ffffff',
    border: '2px dashed ' + (dragOver ? '#2b6cf0' : '#cfd5de'),
    transition: 'all .15s ease',
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '72px 24px', animation: 'edffade .4s ease both' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          Inspect &amp; cut EDF recordings
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: '#677082', margin: '0 auto', maxWidth: 460 }}>
          Drop an <strong style={{ color: '#1c2430' }}>.edf</strong> / <strong style={{ color: '#1c2430' }}>.edf+</strong> file to read its full header and signal metadata, then trim it to any time range. Everything runs locally in your browser — files are never uploaded.
        </p>
      </div>

      <div onClick={onPickerClick} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} style={dropZoneStyle}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#eaf1fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 18, height: 18, border: '2.5px solid #2b6cf0', borderRadius: 4, borderBottomColor: 'transparent', transform: 'rotate(-45deg)' }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Drop your EDF file here</div>
        <div style={{ fontSize: 13.5, color: '#8b94a3' }}>
          or <span style={{ color: '#2b6cf0', fontWeight: 600 }}>click to browse</span>
          {' '}&nbsp;·&nbsp; .edf, .edf+, .bdf
        </div>
      </div>

      <input
        type="file"
        accept=".edf,.edf+,.bdf,.rec"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: 14, marginTop: 28, justifyContent: 'center' }}>
        {['100% local', 'no install', 'EDF / EDF+C'].map((tag, i) => (
          <>
            {i > 0 && <div key={'sep' + i} style={{ color: '#d3d8df' }}>·</div>}
            <div key={tag} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: '#9aa3b2' }}>{tag}</div>
          </>
        ))}
      </div>
    </div>
  )
}
