'use client'

interface Props {
  disabled: boolean
  downloading: boolean
  downloaded: boolean
  outFileName: string
  onDownload: () => void
  onDownloadWithRenames: () => void
}

export default function DownloadButton({ disabled, downloading, downloaded, outFileName, onDownload, onDownloadWithRenames }: Props) {
  const btnStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14.5, fontWeight: 600,
    color: '#fff',
    background: disabled ? '#9bbcf6' : '#2b6cf0',
    border: 'none', borderRadius: 10, padding: '12px 22px',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background .15s ease',
  }

  const secondaryStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14.5, fontWeight: 600,
    color: disabled ? '#9bbcf6' : '#2b6cf0',
    background: disabled ? '#f3f4f7' : '#ffffff',
    border: `1.5px solid ${disabled ? '#9bbcf6' : '#2b6cf0'}`,
    borderRadius: 10, padding: '11px 22px',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all .15s ease',
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onDownload} disabled={disabled} style={btnStyle}>
            {downloading ? 'Generating…' : 'Cut & download EDF'}
          </button>
          <button
            onClick={onDownloadWithRenames}
            disabled={disabled}
            style={secondaryStyle}
            title="Download with custom channel labels"
          >
            With renamed channels
          </button>
        </div>
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
