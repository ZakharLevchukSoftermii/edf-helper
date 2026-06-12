import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EDF Helper',
  description: 'In-browser EDF/EDF+ viewer and cutter. Files never leave your device.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
