'use client'

interface Props {
  message: string
  onReset: () => void
}

export default function ErrorScreen({ message, onReset }: Props) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '100px 24px', textAlign: 'center', animation: 'edffade .3s ease both' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fdeceb', color: '#d1453b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, margin: '0 auto 22px' }}>!</div>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Couldn&apos;t read this file</div>
      <div style={{ fontSize: 14, color: '#677082', lineHeight: 1.5, marginBottom: 24 }}>{message}</div>
      <button onClick={onReset} style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', background: '#2b6cf0', border: 'none', borderRadius: 9, padding: '11px 22px', cursor: 'pointer' }}>
        Try another file
      </button>
    </div>
  )
}
