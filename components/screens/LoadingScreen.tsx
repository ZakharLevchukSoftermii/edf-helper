'use client'

interface Props {
  fileName: string
  fileSizeStr: string
}

export default function LoadingScreen({ fileName, fileSizeStr }: Props) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '120px 24px', textAlign: 'center', animation: 'edffade .3s ease both' }}>
      <div style={{ width: 48, height: 48, border: '3px solid #e3e6eb', borderTopColor: '#2b6cf0', borderRadius: '50%', margin: '0 auto 26px', animation: 'edfspin .8s linear infinite' }} />
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Reading file…</div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: '#677082' }}>{fileName}</div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#9aa3b2', marginTop: 4 }}>{fileSizeStr}</div>
    </div>
  )
}
