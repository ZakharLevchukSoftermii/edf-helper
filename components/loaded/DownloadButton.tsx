'use client'

interface Props {
  disabled: boolean
  downloading: boolean
  downloaded: boolean
  outFileName: string
  onDownload: () => void
}

export default function DownloadButton({ disabled, downloading, downloaded, outFileName, onDownload }: Props) {
  const btnStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14.5, fontWeight: 600,
    color: '#fff',
    background: disabled ? '#9bbcf6' : '#2b6cf0',
    border: 'none', borderRadius: 10, padding: '12px 22px',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background .15s ease',
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
        <button onClick={onDownload} disabled={disabled} style={btnStyle}>
          {downloading ? 'Generating…' : 'Cut & download EDF'}
        </button>
        {downloaded && (
          <span style={{ fontSize: 13.5, color: '#15a06b', fontWeight: 600, animation: 'edffade .3s ease both' }}>
            ✓ Saved to your downloads
          </span>
        )}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: '#b3bac6', marginTop: 14 }}>
        → {outFileName}
      </div>
    </>
  )
}
